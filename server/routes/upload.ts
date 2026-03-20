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

const cloudinaryStorage = useCloudinary ? new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req: any, file: any) => {
        const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const isAudio = file.mimetype.startsWith('audio/');
        const isVideo = file.mimetype.startsWith('video/');
        
        return {
            folder: 'lyre-uploads',
            public_id: uniqueId,
            resource_type: (isAudio || isVideo) ? 'video' : 'auto',
            type: 'upload',
            flags: 'attachment:false'
        };
    }
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

// Dynamic storage: use local for PDFs (to avoid Cloudinary 401) or if Cloudinary is disabled
const storage = {
    _handleFile(req: any, file: any, cb: any) {
        const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
        const selectedStorage: any = (isPdf || !cloudinaryStorage) ? localStorage : cloudinaryStorage;
        selectedStorage._handleFile(req, file, cb);
    },
    _removeFile(req: any, file: any, cb: any) {
        const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
        const selectedStorage: any = (isPdf || !cloudinaryStorage) ? localStorage : cloudinaryStorage;
        selectedStorage._removeFile(req, file, cb);
    }
} as any;

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
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