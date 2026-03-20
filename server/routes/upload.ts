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
        console.log(`[Upload DEBUG] Nom: ${file.originalname}, Type: ${file.mimetype}`);
        const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
        const isAudio = file.mimetype.startsWith('audio/');
        const isVideo = file.mimetype.startsWith('video/');
        
        let resourceType: 'auto' | 'image' | 'video' | 'raw' = 'auto';
        if (isPdf) {
            resourceType = 'image';
            console.log(`[Upload DEBUG] PDF détecté, forçage resource_type: image`);
        } else if (isAudio || isVideo) {
            resourceType = 'video';
        }

        return {
            folder: 'lyre-uploads',
            public_id: uniqueId,
            resource_type: resourceType,
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

const upload = multer({
    storage: (useCloudinary ? cloudinaryStorage : localStorage) as any,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Route POST pour uploader un fichier (protégée)
router.post('/', authenticateToken, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            console.warn('[Upload DEBUG] Aucun fichier reçu dans req.file');
            return res.status(400).json({ message: 'Aucun fichier n\'a été uploadé.' });
        }

        let filePath = '';

        if (useCloudinary) {
            filePath = req.file.path;
            console.log(`[Upload DEBUG] Cloudinary URL: ${filePath}`);
        } else {
            filePath = `/uploads/${req.file.filename}`;
            console.log(`[Upload DEBUG] Local Path: ${filePath}`);
        }

        res.status(200).json({
            message: 'Fichier uploadé avec succès',
            filePath: filePath
        });
    } catch (error) {
        console.error('[Upload DEBUG] Erreur fatale dans la route:', error);
        if (error instanceof Error && (error as any).code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ message: 'Le fichier est trop volumineux (max 50MB).' });
        }
        res.status(500).json({ message: 'Erreur lors de l\'upload du fichier.' });
    }
});

export default router;