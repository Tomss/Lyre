import { JwtPayload } from 'jsonwebtoken';

// Déclare un nouveau module pour étendre l'interface Request de Express
declare module 'express-serve-static-core' {
  interface Request {
    // Ajoute une propriété optionnelle 'user' qui peut être un string ou un JwtPayload
    user?: string | JwtPayload;
  }
}
