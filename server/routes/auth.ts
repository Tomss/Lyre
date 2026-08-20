import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe sont requis.' });
  }

  try {
    // 1. Trouver l'utilisateur par email
    const [userRows] = await pool.query<any[]>('SELECT * FROM users WHERE email = ?', [email]);

    if (userRows.length === 0) {
      console.log(`[Login] Échec: Utilisateur non trouvé pour ${email}`);
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }
    const user = userRows[0];

    // 2. Vérifier si un mot de passe existe (pour les invités non activés)
    if (!user.password_hash) {
      console.log(`[Login] Échec: Tentative de connexion sur compte non activé ${email}`);
      return res.status(401).json({ message: 'Compte non activé. Veuillez utiliser le lien reçu par email.' });
    }

    // 3. Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    // 4. Récupérer le profil et vérifier le statut
    const [profileRows] = await pool.query<any[]>(`
      SELECT u.id, u.email, p.first_name, p.last_name, p.role, p.managed_modules, p.status
      FROM users u
      JOIN profiles p ON u.id = p.id
      WHERE u.id = ?
    `, [user.id]);

    if (profileRows.length === 0) {
      return res.status(500).json({ message: 'Profil utilisateur introuvable.' });
    }

    const { first_name, last_name, role, managed_modules, status } = profileRows[0];

    if (status !== 'Active') {
      console.log(`[Login] Échec: Compte inactif (${status}) pour ${email}`);
      return res.status(403).json({ message: 'Compte inactif ou en attente d\'activation.' });
    }

    // 5. Mettre à jour la date de dernière connexion
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    console.log(`[Login] Succès pour ${email} (${role})`);

    // Parse managed_modules JSON if it exists (it comes as a string from MySQL sometimes depending on the driver version)
    let parsedModules = [];
    if (managed_modules) {
        try {
            parsedModules = typeof managed_modules === 'string' ? JSON.parse(managed_modules) : managed_modules;
        } catch (e) {
            console.error("Failed to parse managed_modules:", e);
        }
    }

    // 4. Créer le JWT
    const payload = {
      id: user.id,
      email: user.email,
      role: role,
      managedModules: parsedModules,
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in .env file');
    }

    const token = jwt.sign(payload, secret, { expiresIn: '1d' });

    // 5. Envoyer la réponse
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: first_name,
        lastName: last_name,
        role: role,
        managedModules: parsedModules
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
});

// GET /api/auth/me - Vérifier le token et récupérer l'utilisateur
router.get('/me', authenticateToken, (req, res) => {
  // On force TypeScript à accepter que 'user' contient bien nos données personnalisées
  const user: any = (req as any).user;

  if (!user) {
    return res.status(401).json({ message: 'User not found in token' });
  }

  // Return user info similar to login
  res.json({
    user: {
      id: user.id || '',
      email: user.email || '',
      role: user.role || 'User',
      managedModules: user.managedModules || [],
    }
  });
});

// POST /api/auth/activate - Activer un compte
router.post('/activate', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token et mot de passe sont requis.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verify token and expiration
    const [users] = await connection.query(`
      SELECT u.id, u.email, u.token_expires_at 
      FROM users u 
      WHERE u.activation_token = ?
    `, [token]);

    const userRows = users as any[];
    console.log(`[Auth] Recherche du token: ${token ? token.substring(0, 8) + '...' : 'VIDE'}`);

    if (userRows.length === 0) {
      console.warn(`[Auth] Token non trouvé dans la base pour: ${token ? token.substring(0, 8) + '...' : '???'}`);
      return res.status(400).json({ message: 'Lien invalide ou expiré.' });
    }

    const user = userRows[0];
    
    if (new Date(user.token_expires_at) < new Date()) {
      return res.status(400).json({ message: "Le lien d'activation a expiré." });
    }

    // Password Policy Validation
    const isMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password);

    if (!isMinLength || !hasUppercase || !hasLowercase || !hasDigit || !hasSpecialChar) {
      return res.status(400).json({ 
        message: 'Le mot de passe ne respecte pas les exigences de sécurité : au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.' 
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Update the user: set password, clear token
    await connection.query(`
      UPDATE users 
      SET password_hash = ?, activation_token = NULL, token_expires_at = NULL 
      WHERE id = ?
    `, [password_hash, user.id]);

    // Update profile status
    await connection.query(`
      UPDATE profiles 
      SET status = 'Active' 
      WHERE id = ?
    `, [user.id]);

    await connection.commit();
    res.json({ message: 'Compte activé avec succès.' });

  } catch (error) {
    await connection.rollback();
    console.error('Activation error:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  } finally {
    connection.release();
  }
});

// POST /api/auth/request-password-reset - Demande autonome de réinitialisation de mot de passe
router.post('/request-password-reset', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Veuillez saisir votre adresse e-mail.' });
  }

  try {
    const [userRows] = await pool.query<any[]>(`
      SELECT u.id, u.email, p.first_name 
      FROM users u 
      JOIN profiles p ON u.id = p.id 
      WHERE u.email = ?
    `, [email]);

    if (userRows.length === 0) {
      // Return success message to prevent user enumeration
      return res.json({ message: 'Si un compte existe avec cette adresse e-mail, vous recevrez un lien de réinitialisation.' });
    }

    const user = userRows[0];
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    await pool.query('UPDATE users SET activation_token = ?, token_expires_at = ? WHERE id = ?', [
      token,
      expiresAt,
      user.id
    ]);

    const { sendActivationEmail } = await import('../utils/email');
    await sendActivationEmail(user.email, user.first_name, token, true, req);

    return res.json({ message: 'Si un compte existe avec cette adresse e-mail, vous recevrez un lien de réinitialisation.' });
  } catch (error) {
    console.error('[Auth] Password reset request error:', error);
    return res.status(500).json({ message: 'Erreur lors de la demande de réinitialisation.' });
  }
});

export default router;
