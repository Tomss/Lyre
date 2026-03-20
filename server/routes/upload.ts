import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { authenticateToken } from '../middleware/auth';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configuration Cloudinary explicite
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Ensure local uploads directory exists
const localUploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
}

const useCloudinary = !!process.env.CLOUDINARY_CLOUD_NAME;

const cloudinaryStorage = useCloudinary ? new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'lyre-uploads',
        resource_type: 'auto',
    } as any
}) : null;

const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, localUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: (useCloudinary ? cloudinaryStorage : localStorage) as any,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Route POST pour uploader un fichier (protégée)
router.post('/', authenticateToken, (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error('[Upload Error]', err);
            return res.status(500).json({ 
                message: 'Erreur lors de l\'envoi du fichier à Cloudinary.',
                error: err.message
            });
        }
        
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier reçu.' });
        }

        try {
            const filePath = useCloudinary ? req.file.path : `/uploads/${req.file.filename}`;
            res.status(200).json({
                message: 'Fichier uploadé avec succès',
                filePath: filePath
            });
        } catch (error: any) {
            console.error('[Upload Success Error]', error);
            res.status(500).json({ message: 'Erreur lors de la réponse serveur.', error: error.message });
        }
    });
});

export default router;