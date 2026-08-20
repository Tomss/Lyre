import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import path from 'path';
import fs from 'fs';

const router = Router();

// Ensure local uploads directory exists
const localUploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
}

const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, localUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const sanitizedBaseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        cb(null, `${sanitizedBaseName}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: localStorage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Route POST pour uploader un fichier (protégée)
router.post('/', authenticateToken, (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error('[Upload Error]', err);
            return res.status(500).json({ 
                message: 'Erreur lors de l\'enregistrement du fichier sur le serveur.',
                error: err.message
            });
        }
        
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier reçu.' });
        }

        try {
            const filePath = `/uploads/${req.file.filename}`;
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