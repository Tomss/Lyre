import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.sendStatus(403); // Forbidden (token is no longer valid)
    }
    (req as any).user = user; // Ajoute le payload de l'utilisateur à l'objet requête
    next(); // Passe au prochain middleware ou à la route
  });
};
