import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../middleware/auth';

const router = Router();

import fs from 'fs';

// Configuration de Multer pour le stockage des fichiers
// Assurons-nous que le dossier existe
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Le dossier où les fichiers seront sauvegardés
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique pour éviter les conflits
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Route POST pour uploader un fichier
// Elle est protégée, seul un utilisateur authentifié peut uploader.
router.post('/', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier n\'a été uploadé.' });
  }

  // Construire l'URL publique du fichier
  // Utiliser req.get('host') est plus fiable car il inclut le port si nécessaire
  // et correspond à l'hôte utilisé par le client.
  const host = req.get('host');
  const protocol = req.protocol;
  const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

  res.status(200).json({
    message: 'Fichier uploadé avec succès',
    filePath: fileUrl
  });
});

export default router;
