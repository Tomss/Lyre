import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

// Configuration Cloudinary explicite
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';
import { fileURLToPath } from 'url';

const router = Router();

router.use(authenticateToken);

// Route sÃ©curisÃ©e pour rÃ©cupÃ©rer la liste des partitions avec les donnÃ©es associÃ©es
router.get('/', async (req, res) => {
  // @ts-ignore
  const userRole = (req as any).user.role;

  if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('morceaux')) && userRole !== 'Gestionnaire') {
    return res.status(403).json({ message: 'AccÃ¨s refusÃ©.' });
  }

  try {
    // RequÃªte complexe pour joindre toutes les informations nÃ©cessaires et les formater comme l'attend le frontend
    const query = `
      SELECT 
        p.*,
        JSON_OBJECT(
          'id', m.id,
          'nom', m.nom,
          'compositeur', m.compositeur,
          'arrangement', m.arrangement,
          'orchestras', (
              SELECT JSON_ARRAYAGG(
                  JSON_OBJECT('id', o.id, 'name', o.name)
              )
              FROM morceau_orchestras mo
              JOIN orchestras o ON mo.orchestra_id = o.id
              WHERE mo.morceau_id = m.id
          )
        ) AS morceaux,
        JSON_OBJECT(
          'id', i.id,
          'name', i.name
        ) AS instruments
      FROM partitions p
      LEFT JOIN morceaux m ON p.morceau_id = m.id
      LEFT JOIN instruments i ON p.instrument_id = i.id
      ORDER BY m.nom, p.nom;
    `;

    const [partitions] = await pool.query(query);
    res.json(partitions);

  } catch (error) {
    console.error('Error fetching partitions:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des partitions.' });
  }
});

const tempUploadDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(tempUploadDir)) {
    fs.mkdirSync(tempUploadDir, { recursive: true });
}
const tempUpload = multer({ 
    dest: tempUploadDir,
    limits: { fileSize: 150 * 1024 * 1024 } // 150MB limit 
});

router.post('/batch-split', tempUpload.single('file'), async (req, res) => {
    // @ts-ignore
    const userRole = (req as any).user.role;
    if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('morceaux')) && userRole !== 'Gestionnaire') {
        return res.status(403).json({ message: 'Accès refusé.' });
    }

    const { morceau_id, original_name, splits: splitsString } = req.body;
    
    let splits;
    try {
        splits = JSON.parse(splitsString);
    } catch (e) {
        return res.status(400).json({ message: 'Format des données invalide.' });
    }

    if (!morceau_id || !req.file || !splits || !Array.isArray(splits) || splits.length === 0) {
        return res.status(400).json({ message: 'Données ou fichier manquants pour le découpage.' });
    }

    try {
        const pdfBytes = fs.readFileSync(req.file.path);

        const masterPdf = await PDFDocument.load(pdfBytes);
        const totalPages = masterPdf.getPageCount();

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const createdPartitions = [];

            for (let i = 0; i < splits.length; i++) {
                const currentSplit = splits[i];
                const nextSplit = splits[i + 1];
                
                // Pages in pdf-lib are 0-indexed, but start_page from frontend is 1-indexed
                const startIdx = currentSplit.start_page - 1;
                const endIdx = nextSplit ? (nextSplit.start_page - 2) : (totalPages - 1);

                if (startIdx < 0 || endIdx >= totalPages || startIdx > endIdx) {
                    console.warn(`Plage de pages invalide pour le split: ${startIdx} à ${endIdx}. Pages totales: ${totalPages}`);
                    continue; // Skip invalid splits
                }

                if (currentSplit.instrument_id === '_IGNORE_') {
                    continue; // Do not generate partition for ignored sections
                }

                // Create new document for this instrument
                const newPdf = await PDFDocument.create();
                const pageIndices = Array.from({ length: endIdx - startIdx + 1 }, (_, k) => startIdx + k);
                const copiedPages = await newPdf.copyPages(masterPdf, pageIndices);
                
                copiedPages.forEach((page) => newPdf.addPage(page));

                const newPdfBytes = await newPdf.save();
                
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const newFilename = `${uniqueSuffix}.pdf`;
                let finalFilePath = '';
                
                if (process.env.CLOUDINARY_CLOUD_NAME) {
                    // Upload stream to Cloudinary directly from memory Buffer
                    const buffer = Buffer.from(newPdfBytes);
                    finalFilePath = await new Promise<string>((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            {
                                folder: 'lyre-uploads',
                                resource_type: 'auto',
                                public_id: `${uniqueSuffix}`,
                                format: 'pdf'
                            },
                            (error, result) => {
                                if (error) return reject(error);
                                resolve(result!.secure_url);
                            }
                        );
                        uploadStream.end(buffer);
                    });
                } else {
                    // Save new PDF to disk fallback
                    const localUploadDir = path.join(__dirname, '../../uploads');
                    if (!fs.existsSync(localUploadDir)) {
                        fs.mkdirSync(localUploadDir, { recursive: true });
                    }
                    const savePath = path.join(localUploadDir, newFilename);
                    fs.writeFileSync(savePath, newPdfBytes);
                    finalFilePath = `/uploads/${newFilename}`;
                }
                const newPartitionId = crypto.randomUUID();

                await connection.query(
                    'INSERT INTO partitions (id, nom, morceau_id, instrument_id, file_path, file_name, file_type, file_size, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        newPartitionId, 
                        currentSplit.custom_name || (original_name ? `Extrait de ${original_name}` : 'Partition découpée'), 
                        morceau_id, 
                        currentSplit.instrument_id, 
                        finalFilePath, 
                        newFilename, 
                        'pdf', 
                        newPdfBytes.length, 
                        new Date(), 
                        new Date()
                    ]
                );

                createdPartitions.push(newPartitionId);
            }

            await connection.commit();
            res.status(200).json({ message: `${createdPartitions.length} partition(s) générée(s) avec succès !` });
        } catch (dbError) {
            await connection.rollback();
            throw dbError;
        } finally {
            connection.release();
        }

        // Clean up the temporary uploaded master PDF
        try {
            fs.unlinkSync(req.file.path);
        } catch (cleanupErr) {
            console.error('Failed to clean up temp master PDF:', cleanupErr);
        }

    } catch (error) {
        console.error('Error during batch split:', error);
        res.status(500).json({ message: 'Erreur interne lors du découpage du PDF.' });
    }
});

router.post('/', async (req, res) => {
    // @ts-ignore
    const userRole = (req as any).user.role;
    if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('morceaux')) && userRole !== 'Gestionnaire') {
        return res.status(403).json({ message: 'AccÃ¨s refusÃ©.' });
    }

    const { nom, morceau_id, instrument_id, file_path, file_name, file_type, file_size } = req.body;

    if (!nom || !morceau_id || !instrument_id) {
        return res.status(400).json({ message: 'Les champs nom, morceau et instrument sont requis.' });
    }

    try {
        const newPartition = {
            id: crypto.randomUUID(),
            nom,
            morceau_id,
            instrument_id,
            file_path: file_path || null,
            file_name: file_name || null,
            file_type: file_type || null,
            file_size: file_size || null,
            created_at: new Date(),
            updated_at: new Date(),
        };

        await pool.query(
            'INSERT INTO partitions (id, nom, morceau_id, instrument_id, file_path, file_name, file_type, file_size, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [newPartition.id, newPartition.nom, newPartition.morceau_id, newPartition.instrument_id, newPartition.file_path, newPartition.file_name, newPartition.file_type, newPartition.file_size, newPartition.created_at, newPartition.updated_at]
        );

        res.status(201).json({ message: 'Partition crÃ©Ã©e avec succÃ¨s', partition: newPartition });

    } catch (error) {
        console.error('Error creating partition:', error);
        res.status(500).json({ message: 'Erreur lors de la crÃ©ation de la partition.' });
    }
});

router.put('/:id', async (req, res) => {
    // @ts-ignore
    const userRole = (req as any).user.role;
    if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('morceaux')) && userRole !== 'Gestionnaire') {
        return res.status(403).json({ message: 'AccÃ¨s refusÃ©.' });
    }

    const { id } = req.params;
    const { nom, morceau_id, instrument_id, file_path, file_name, file_type, file_size } = req.body;

    if (!nom || !morceau_id || !instrument_id) {
        return res.status(400).json({ message: 'Les champs nom, morceau et instrument sont requis.' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE partitions SET nom = ?, morceau_id = ?, instrument_id = ?, file_path = ?, file_name = ?, file_type = ?, file_size = ?, updated_at = ? WHERE id = ?',
            [nom, morceau_id, instrument_id, file_path || null, file_name || null, file_type || null, file_size || null, new Date(), id]
        );

        // @ts-ignore
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Partition non trouvÃ©e.' });
        }

        res.status(200).json({ message: 'Partition mise Ã  jour avec succÃ¨s.' });

    } catch (error) {
        console.error(`Error updating partition with id ${id}:`, error);
        res.status(500).json({ message: 'Erreur lors de la mise Ã  jour de la partition.' });
    }
});

router.delete('/:id', async (req, res) => {
    // @ts-ignore
    const userRole = (req as any).user.role;
    if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('morceaux')) && userRole !== 'Gestionnaire') {
        return res.status(403).json({ message: 'AccÃ¨s refusÃ©.' });
    }

    const { id } = req.params;

    try {
        // TODO: GÃ©rer la suppression du fichier associÃ© dans le stockage
        const [result] = await pool.query('DELETE FROM partitions WHERE id = ?', [id]);

        // @ts-ignore
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Partition non trouvÃ©e.' });
        }

        res.status(200).json({ message: 'Partition supprimÃ©e avec succÃ¨s.' });

    } catch (error) {
        console.error(`Error deleting partition with id ${id}:`, error);
        res.status(500).json({ message: 'Erreur lors de la suppression de la partition.' });
    }
});

export default router;
