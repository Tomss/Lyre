import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import path from 'path';
import fs from 'fs';

let sharp: any = null;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('[Upload] sharp not available, saving raw uploaded files.');
}

const router = Router();

// Ensure local uploads directory exists
const localUploadDir = path.join(process.cwd(), 'uploads');
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
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Route POST pour uploader un fichier (protégée) avec conversion WebP automatique pour les images
router.post('/', authenticateToken, (req, res) => {
    upload.single('file')(req, res, async (err) => {
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
            let finalFilename = req.file.filename;

            // If file is an image (jpg, png, avif, gif, webp) and sharp is available, convert to optimized WebP
            if (sharp && req.file.mimetype.startsWith('image/') && !req.file.filename.endsWith('.svg')) {
                const webpFilename = `${path.parse(req.file.filename).name}.webp`;
                const webpPath = path.join(localUploadDir, webpFilename);

                try {
                    await sharp(req.file.path)
                        .resize({ width: 1920, height: 1200, fit: 'inside', withoutEnlargement: true })
                        .webp({ quality: 82, effort: 4 })
                        .toFile(webpPath);

                    // Delete uncompressed original file
                    if (fs.existsSync(req.file.path) && req.file.path !== webpPath) {
                        fs.unlinkSync(req.file.path);
                    }
                    finalFilename = webpFilename;
                } catch (sharpErr) {
                    console.error('[Sharp WebP Conversion Error]', sharpErr);
                    // Keep original filename if sharp fails
                }
            }

            const filePath = `/uploads/${finalFilename}`;
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