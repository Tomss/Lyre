import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format "Bearer TOKEN"

  if (token == null) {
    return res.sendStatus(401); // Unauthorized
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET is not defined');
    return res.sendStatus(500); // Internal Server Error
  }

  jwt.verify(token, secret, async (err, decodedUser: any) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.sendStatus(403); // Forbidden (token is no longer valid)
    }

    try {
      // Vérification en base de données pour plus de sécurité (stateless -> stateful check)
      const [rows] = await pool.query<any[]>(`
        SELECT u.id, p.status, p.role 
        FROM users u 
        JOIN profiles p ON u.id = p.id 
        WHERE u.id = ?
      `, [decodedUser.id]);

      if (rows.length === 0) {
        return res.status(401).json({ message: 'Compte supprimé.' });
      }

      const user = rows[0];
      if (user.status !== 'Active') {
        return res.status(403).json({ message: 'Compte inactif.' });
      }

      // On attache les infos à l'objet requête
      (req as any).user = decodedUser; 
      next();
    } catch (dbErr) {
      console.error('DB verification error in auth middleware:', dbErr);
      res.sendStatus(500);
    }
  });
};
