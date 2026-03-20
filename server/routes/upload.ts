import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { authenticateToken } from '../middleware/auth';
import path from 'path';
import fs from 'fs';

const router = Router();

// Ensure local uploads directory exists
const localUploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
}

const useCloudinary = !!process.env.CLOUDINARY_CLOUD_NAME;

let storage;

if (useCloudinary) {
    // 1. Configuration de Cloudinary avec tes futures variables Render
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // 2. Configuration de Multer pour envoyer directement sur Cloudinary
    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async (req: any, file: any) => {
            const extension = path.extname(file.originalname).toLowerCase().replace('.', '');
            const isAudio = file.mimetype.startsWith('audio/');
            const isVideo = file.mimetype.startsWith('video/');
            const isPdf = file.mimetype === 'application/pdf' || extension === 'pdf';
            
            return {
                folder: 'lyre-uploads',
                allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'pdf', 'mp3', 'wav', 'mp4', 'mov'],
                resource_type: (isAudio || isVideo) ? 'video' : 'auto',
                format: isPdf ? 'pdf' : undefined
            };
        }
    });
} else {
    // 3. Fallback: Stockage local
    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, localUploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname);
            cb(null, file.fieldname + '-' + uniqueSuffix + ext);
        }
    });
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // Limité à 50 Mo (Cloudinary gratuit bloque à 10Mo par défaut)
});

// Route POST pour uploader un fichier (protégée)
router.post('/', authenticateToken, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier n\'a été uploadé.' });
        }

        let filePath = '';

        if (useCloudinary) {
            // Cloudinary met l'URL dans req.file.path
            filePath = req.file.path;
        } else {
            // Stockage local
            filePath = `/uploads/${req.file.filename}`;
        }

        res.status(200).json({
            message: 'Fichier uploadé avec succès',
            filePath: filePath
        });
    } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        res.status(500).json({ message: 'Erreur lors de l\'upload du fichier.' });
    }
});

export default router;