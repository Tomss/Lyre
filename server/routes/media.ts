import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import crypto from 'crypto';

const router = Router();

router.use(authenticateToken);

// GET /api/media
router.get('/', async (req, res) => {
  // @ts-ignore
  if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('media'))) {
    return res.status(403).json({ message: 'Acces refuse.' });
  }
  try {
    const query = `
      SELECT 
        mi.*,
        CASE 
          WHEN COUNT(mf.id) > 0 THEN 
            JSON_ARRAYAGG(
              JSON_OBJECT('id', mf.id, 'file_name', mf.file_name, 'file_path', mf.file_path, 'file_type', mf.file_type, 'alt_text', mf.alt_text, 'sort_order', mf.sort_order)
            )
          ELSE 
            JSON_ARRAY()
        END AS files
      FROM media_items mi
      LEFT JOIN media_files mf ON mi.id = mf.media_item_id
      GROUP BY mi.id
      ORDER BY mi.media_date DESC, mi.created_at DESC;
    `;
    const [mediaItems] = await pool.query(query);
    res.json(mediaItems);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ message: 'Erreur lors de la recuperation des medias.' });
  }
});

// POST /api/media
router.post('/', async (req, res) => {
    // @ts-ignore
    if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('media'))) {
        return res.status(403).json({ message: 'Acces refuse.' });
    }
    const { title, description, media_type, media_date, is_featured, published, files } = req.body;
    if (!title || !media_type) {
        return res.status(400).json({ message: 'Titre et type de media sont requis.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const newItemId = crypto.randomUUID();
        await connection.query(
            'INSERT INTO media_items (id, title, description, media_type, media_date, is_featured, published, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [newItemId, title, description, media_type, media_date, is_featured, published, (req as any).user.id]
        );

        if (files && files.length > 0) {
            const fileValues = files.map((file: any) => [
                crypto.randomUUID(), 
                newItemId, 
                file.fileName || file.file_name, 
                file.filePath || file.file_path, 
                file.fileType || file.file_type, 
                file.fileSize || file.file_size, 
                file.altText || file.alt_text, 
                file.sortOrder ?? file.sort_order ?? 0
            ]);
            await connection.query('INSERT INTO media_files (id, media_item_id, file_name, file_path, file_type, file_size, alt_text, sort_order) VALUES ?', [fileValues]);
        }

        await connection.commit();
        res.status(201).json({ message: 'Media cree avec succes.' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Erreur lors de la creation du media.' });
    } finally {
        connection.release();
    }
});

// PUT /api/media/:id
router.put('/:id', async (req, res) => {
    // @ts-ignore
    if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('media'))) {
        return res.status(403).json({ message: 'Acces refuse.' });
    }
    const { id } = req.params;
    const { title, description, media_type, media_date, is_featured, published, files } = req.body;
    if (!title || !media_type) {
        return res.status(400).json({ message: 'Titre et type de media sont requis.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            'UPDATE media_items SET title = ?, description = ?, media_type = ?, media_date = ?, is_featured = ?, published = ? WHERE id = ?',
            [title, description, media_type, media_date, is_featured, published, id]
        );

        await connection.query('DELETE FROM media_files WHERE media_item_id = ?', [id]);
        if (files && files.length > 0) {
            const fileValues = files.map((file: any) => [
                crypto.randomUUID(), 
                id, 
                file.fileName || file.file_name, 
                file.filePath || file.file_path, 
                file.fileType || file.file_type, 
                file.fileSize || file.file_size, 
                file.altText || file.alt_text, 
                file.sortOrder ?? file.sort_order ?? 0
            ]);
            await connection.query('INSERT INTO media_files (id, media_item_id, file_name, file_path, file_type, file_size, alt_text, sort_order) VALUES ?', [fileValues]);
        }

        await connection.commit();
        res.status(200).json({ message: 'Media mis a jour avec succes.' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Erreur lors de la mise a jour du media.' });
    } finally {
        connection.release();
    }
});

// DELETE /api/media/:id
router.delete('/:id', async (req, res) => {
    // @ts-ignore
    if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('media'))) {
        return res.status(403).json({ message: 'Acces refuse.' });
    }
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM media_files WHERE media_item_id = ?', [id]);
        await connection.query('DELETE FROM media_items WHERE id = ?', [id]);
        await connection.commit();
        res.status(200).json({ message: 'Media supprime avec succes.' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Erreur lors de la suppression du media.' });
    } finally {
        connection.release();
    }
});

export default router;
