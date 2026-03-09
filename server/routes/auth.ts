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
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }
    const user = userRows[0];

    // 2. Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    // 3. Récupérer le profil de l'utilisateur
    const [profileRows] = await pool.query<any[]>('SELECT first_name, last_name, role FROM profiles WHERE id = ?', [user.id]);
    if (profileRows.length === 0) {
      // Should not happen if data is consistent
      return res.status(500).json({ message: 'Profil utilisateur introuvable.' });
    }
    const profile = profileRows[0];

    // 4. Créer le JWT
    const payload = {
      id: user.id,
      email: user.email,
      role: profile.role,
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
        firstName: profile.first_name,
        lastName: profile.last_name,
        role: profile.role,
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
    }
  });
});

export default router;
