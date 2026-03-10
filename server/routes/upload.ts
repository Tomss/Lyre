import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 1. Configuration de Cloudinary avec tes futures variables Render
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Configuration de Multer pour envoyer directement sur Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lyre-uploads', // Le dossier qui sera créé sur ton espace Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  } as any
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Limité à 5 Mo pour éviter de surcharger ton quota gratuit
});

// 3. Route POST pour uploader un fichier (protégée)
router.post('/', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier n\'a été uploadé.' });
  }

  // Magie de multer-storage-cloudinary : req.file.path contient maintenant l'URL web sécurisée de Cloudinary !
  res.status(200).json({
    message: 'Fichier uploadé avec succès',
    filePath: req.file.path 
  });
});

export default router;