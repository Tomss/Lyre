import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';

const router = Router();

// Anti Brute-Force Protection: IP -> { failedAttempts: number, lockoutUntil: number }
interface LoginAttemptRecord {
  failedAttempts: number;
  lockoutUntil: number;
  lastAttempt: number;
}

const loginAttempts = new Map<string, LoginAttemptRecord>();
const LOCKOUT_WINDOW = 15 * 60 * 1000; // 15 minutes lockout
const MAX_FAILED_ATTEMPTS = 5; // Max 5 failed attempts allowed before lockout

// Periodic cleanup of expired rate limit entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of loginAttempts.entries()) {
    if (now > record.lockoutUntil && (now - record.lastAttempt > LOCKOUT_WINDOW)) {
      loginAttempts.delete(key);
    }
  }
}, LOCKOUT_WINDOW);

// Helper pour récupérer tous les profils accessibles (directs + délégués) pour un compte
const getAccessibleProfilesForAccount = async (accountUserId: string) => {
  let directProfiles: any[] = [];
  try {
    const [rows]: any = await pool.query(`
      SELECT p.id, p.first_name, p.last_name, p.role, p.managed_modules, p.status, COALESCE(up.is_primary, 0) as is_primary,
             (SELECT GROUP_CONCAT(i.name SEPARATOR ', ') FROM user_instruments ui JOIN instruments i ON ui.instrument_id = i.id WHERE ui.user_id = p.id) AS instruments
      FROM user_profiles up
      JOIN profiles p ON up.profile_id = p.id
      WHERE up.user_id = ?
      ORDER BY up.is_primary DESC, p.last_name ASC, p.first_name ASC
    `, [accountUserId]);
    directProfiles = rows;
  } catch (err: any) {
    console.warn('[Auth] Erreur query user_profiles:', err.message);
  }

  if (directProfiles.length === 0) {
    try {
      const [fallbackRows]: any = await pool.query(`
        SELECT p.id, p.first_name, p.last_name, p.role, p.managed_modules, p.status, 1 as is_primary,
               (SELECT GROUP_CONCAT(i.name SEPARATOR ', ') FROM user_instruments ui JOIN instruments i ON ui.instrument_id = i.id WHERE ui.user_id = p.id) AS instruments
        FROM profiles p
        WHERE p.id = ?
      `, [accountUserId]);
      directProfiles = fallbackRows;
    } catch (fallbackErr: any) {
      console.warn('[Auth] Erreur query fallback profiles:', fallbackErr.message);
    }
  }

  const directIds = directProfiles.map((p: any) => p.id);
  let delegatedProfiles: any[] = [];
  if (directIds.length > 0) {
    try {
      const [delRows]: any = await pool.query(`
        SELECT p.id, p.first_name, p.last_name, p.role, p.managed_modules, p.status, 0 as is_primary,
               (SELECT GROUP_CONCAT(i.name SEPARATOR ', ') FROM user_instruments ui JOIN instruments i ON ui.instrument_id = i.id WHERE ui.user_id = p.id) AS instruments
        FROM profile_delegations pd
        JOIN profiles p ON pd.child_profile_id = p.id
        WHERE pd.parent_profile_id IN (?) AND p.status = 'Active'
        ORDER BY p.last_name ASC, p.first_name ASC
      `, [directIds]);
      delegatedProfiles = delRows;
    } catch (delErr: any) {
      console.warn('[Auth Warning] Erreur récupération délégations (table en cours de migration):', delErr.message);
    }
  }

  const seen = new Set<string>();
  const combined: any[] = [];
  for (const p of [...directProfiles, ...delegatedProfiles]) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      combined.push(p);
    }
  }
  return combined;
};

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe sont requis.' });
  }

  const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  const normalizedEmail = String(email).trim().toLowerCase();
  const rateLimitKey = `${clientIp}_${normalizedEmail}`;
  const now = Date.now();

  const attemptRecord = loginAttempts.get(rateLimitKey);

  // Check if currently locked out
  if (attemptRecord && attemptRecord.lockoutUntil > now) {
    const remainingMinutes = Math.ceil((attemptRecord.lockoutUntil - now) / 60000);
    console.warn(`[Brute-Force Blocked] IP: ${clientIp}, Email: ${normalizedEmail} - Locked out for ${remainingMinutes} min`);
    return res.status(429).json({
      message: `Trop de tentatives de connexion échouées. Par mesure de sécurité, veuillez patienter ${remainingMinutes} minute(s) avant de réessayer.`
    });
  }

  const registerFailedAttempt = () => {
    const current = loginAttempts.get(rateLimitKey) || { failedAttempts: 0, lockoutUntil: 0, lastAttempt: now };
    current.failedAttempts += 1;
    current.lastAttempt = now;

    if (current.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      current.lockoutUntil = now + LOCKOUT_WINDOW;
      console.warn(`[Brute-Force Triggered] IP: ${clientIp}, Email: ${normalizedEmail} locked out for 15 minutes.`);
    }

    loginAttempts.set(rateLimitKey, current);
  };

  try {
    // 1. Trouver l'utilisateur par email
    const [userRows] = await pool.query<any[]>('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

    if (userRows.length === 0) {
      registerFailedAttempt();
      console.log(`[Login] Échec: Utilisateur non trouvé pour ${normalizedEmail}`);
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }
    const user = userRows[0];

    // 2. Vérifier si un mot de passe existe (pour les invités non activés)
    if (!user.password_hash) {
      console.log(`[Login] Échec: Tentative de connexion sur compte non activé ${normalizedEmail}`);
      return res.status(401).json({ message: 'Compte non activé. Veuillez utiliser le lien reçu par email.' });
    }

    // 3. Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      registerFailedAttempt();
      console.log(`[Login] Échec: Mot de passe invalide pour ${normalizedEmail}`);
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    // Login successful -> clear failed attempts counter
    loginAttempts.delete(rateLimitKey);

    // 4. Récupérer tous les profils accessibles (directs + délégués)
    const profileRows = await getAccessibleProfilesForAccount(user.id);

    if (profileRows.length === 0) {
      return res.status(500).json({ message: 'Aucun profil musicien associé à ce compte.' });
    }

    const activeProfiles = profileRows.filter(p => p.status === 'Active');
    if (activeProfiles.length === 0) {
      console.log(`[Login] Échec: Aucun profil actif pour ${email}`);
      return res.status(403).json({ message: 'Compte inactif ou en attente d\'activation.' });
    }

    // Sélection du profil par défaut (le primaire ou le premier actif)
    const activeProfile = activeProfiles.find(p => p.is_primary) || activeProfiles[0];

    // 5. Mettre à jour la date de dernière connexion
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    console.log(`[Login] Succès pour ${email} (${activeProfile.role} - Profil: ${activeProfile.first_name} ${activeProfile.last_name})`);

    // Parse managed_modules JSON
    let parsedModules = [];
    if (activeProfile.managed_modules) {
        try {
            parsedModules = typeof activeProfile.managed_modules === 'string' ? JSON.parse(activeProfile.managed_modules) : activeProfile.managed_modules;
        } catch (e) {
            console.error("Failed to parse managed_modules:", e);
        }
    }

    // 6. Créer le JWT avec id = activeProfile.id et userId = user.id
    const payload = {
      id: activeProfile.id,
      userId: user.id,
      email: user.email,
      role: activeProfile.role,
      managedModules: parsedModules,
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in .env file');
    }

    const token = jwt.sign(payload, secret, { expiresIn: '1d' });

    const availableProfiles = activeProfiles.map(p => ({
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      role: p.role,
      instruments: p.instruments || null
    }));

    // 7. Envoyer la réponse
    res.json({
      token,
      user: {
        id: activeProfile.id,
        userId: user.id,
        email: user.email,
        firstName: activeProfile.first_name,
        lastName: activeProfile.last_name,
        role: activeProfile.role,
        managedModules: parsedModules,
        availableProfiles
      },
      hasMultipleProfiles: availableProfiles.length > 1,
      availableProfiles
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: error?.message || 'Erreur interne du serveur.' });
  }
});

// POST /api/auth/switch-profile - Basculer vers un autre profil associé au compte (direct ou délégué)
router.post('/switch-profile', authenticateToken, async (req: Request, res: Response) => {
  const { profileId } = req.body;
  const currentTokenUser: any = (req as any).user;

  if (!profileId) {
    return res.status(400).json({ message: 'ID du profil requis.' });
  }

  try {
    // Identifier l'identifiant de compte (userId)
    let accountUserId = currentTokenUser.userId;
    if (!accountUserId) {
      const [upRows]: any = await pool.query(
        'SELECT user_id FROM user_profiles WHERE profile_id = ? LIMIT 1',
        [currentTokenUser.id]
      );
      accountUserId = upRows.length > 0 ? upRows[0].user_id : currentTokenUser.id;
    }

    const accessibleProfiles = await getAccessibleProfilesForAccount(accountUserId);
    const selectedProfile = accessibleProfiles.find((p: any) => p.id === profileId && p.status === 'Active');

    if (!selectedProfile) {
      return res.status(403).json({ message: 'Profil non autorisé ou inactif.' });
    }

    // Récupérer l'email du compte
    const [userRows]: any = await pool.query('SELECT email FROM users WHERE id = ?', [accountUserId]);
    const userEmail = userRows.length > 0 ? userRows[0].email : (currentTokenUser.email || '');

    let parsedModules = [];
    if (selectedProfile.managed_modules) {
      try {
        parsedModules = typeof selectedProfile.managed_modules === 'string'
          ? JSON.parse(selectedProfile.managed_modules)
          : selectedProfile.managed_modules;
      } catch (e) {
        console.error("Failed to parse managed_modules:", e);
      }
    }

    const payload = {
      id: selectedProfile.id,
      userId: accountUserId,
      email: userEmail,
      role: selectedProfile.role,
      managedModules: parsedModules,
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not defined');

    const newToken = jwt.sign(payload, secret, { expiresIn: '1d' });

    const activeAccessibleProfiles = accessibleProfiles.filter((p: any) => p.status === 'Active');

    res.json({
      token: newToken,
      user: {
        id: selectedProfile.id,
        userId: accountUserId,
        email: userEmail,
        firstName: selectedProfile.first_name,
        lastName: selectedProfile.last_name,
        role: selectedProfile.role,
        managedModules: parsedModules,
        availableProfiles: activeAccessibleProfiles.map((pr: any) => ({
          id: pr.id,
          firstName: pr.first_name,
          lastName: pr.last_name,
          role: pr.role,
          instruments: pr.instruments || null
        }))
      }
    });
  } catch (error) {
    console.error('Error switching profile:', error);
    res.status(500).json({ message: 'Erreur lors du changement de profil.' });
  }
});

// GET /api/auth/me - Vérifier le token et récupérer l'utilisateur avec ses profils
router.get('/me', authenticateToken, async (req, res) => {
  const user: any = (req as any).user;

  if (!user) {
    return res.status(401).json({ message: 'User not found in token' });
  }

  try {
    let accountUserId = user.userId;
    if (!accountUserId) {
      const [upRows]: any = await pool.query(
        'SELECT user_id FROM user_profiles WHERE profile_id = ? LIMIT 1',
        [user.id]
      );
      accountUserId = upRows.length > 0 ? upRows[0].user_id : user.id;
    }

    const accessibleProfiles = await getAccessibleProfilesForAccount(accountUserId);
    const activeAccessibleProfiles = accessibleProfiles.filter((p: any) => p.status === 'Active');

    const [currentP]: any = await pool.query(`
      SELECT p.id, p.first_name, p.last_name, p.role, p.managed_modules, p.status, u.email
      FROM profiles p
      LEFT JOIN users u ON u.id = ?
      WHERE p.id = ?
    `, [accountUserId, user.id]);

    const active = currentP[0] || {};
    let parsedModules = [];
    if (active.managed_modules) {
      try {
        parsedModules = typeof active.managed_modules === 'string'
          ? JSON.parse(active.managed_modules)
          : active.managed_modules;
      } catch (e) {}
    }

    res.json({
      user: {
        id: user.id || '',
        userId: accountUserId,
        email: active.email || user.email || '',
        firstName: active.first_name || '',
        lastName: active.last_name || '',
        role: active.role || user.role || 'Membre',
        managedModules: parsedModules.length > 0 ? parsedModules : (user.managedModules || []),
        availableProfiles: activeAccessibleProfiles.map((pr: any) => ({
          id: pr.id,
          firstName: pr.first_name,
          lastName: pr.last_name,
          role: pr.role,
          instruments: pr.instruments || null
        }))
      }
    });
  } catch (err) {
    console.error('Error in /me:', err);
    res.json({
      user: {
        id: user.id || '',
        email: user.email || '',
        role: user.role || 'Membre',
        managedModules: user.managedModules || [],
        availableProfiles: []
      }
    });
  }
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
