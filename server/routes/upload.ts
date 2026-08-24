import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const router = Router();

// Ensure local uploads directory exists
const localUploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
}

// Ensure public directory exists for static bundle persistence
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Memory storage for ultra-fast processing without temporary file locking
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Route POST pour uploader un fichier (protégée) avec conversion WebP instantanée
router.post('/', authenticateToken, (req, res) => {
    upload.single('file')(req, res, async (err) => {
        if (err) {
            console.error('[Upload Error]', err);
            return res.status(500).json({ 
                message: 'Erreur lors du transfert du fichier.',
                error: err.message
            });
        }
        
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier reçu.' });
        }

        try {
            const ext = path.extname(req.file.originalname).toLowerCase();
            const sanitizedBaseName = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);

            let finalFilename = `${sanitizedBaseName}-${uniqueSuffix}${ext}`;
            let targetPath = path.join(localUploadDir, finalFilename);

            // If image (jpg, png, webp, avif, tiff...), convert to optimized WebP in milliseconds
            if (req.file.mimetype.startsWith('image/') && !req.file.originalname.endsWith('.svg')) {
                finalFilename = `${sanitizedBaseName}-${uniqueSuffix}.webp`;
                targetPath = path.join(localUploadDir, finalFilename);

                await sharp(req.file.buffer)
                    .resize({ width: 1920, height: 1200, fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 82, effort: 3 })
                    .toFile(targetPath);
            } else {
                // Non-image files (PDF, audio)
                fs.writeFileSync(targetPath, req.file.buffer);
            }

            // Sync copy to public/ directory for persistent redeploys
            try {
                const publicPath = path.join(publicDir, finalFilename);
                fs.copyFileSync(targetPath, publicPath);
            } catch (e) {
                // Ignore if public copy fails
            }

            const filePath = `/uploads/${finalFilename}`;
            return res.status(200).json({
                message: 'Fichier uploadé avec succès',
                filePath: filePath
            });
        } catch (error: any) {
            console.error('[Upload Processing Error]', error);
            return res.status(500).json({ message: 'Erreur lors du traitement du fichier.', error: error.message });
        }
    });
});

export default router;