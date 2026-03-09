import { Router } from 'express';
import pool from '../db';

const router = Router();

// GET /api/public-media
router.get('/', async (req, res) => {
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
        END AS media_files
      FROM media_items mi
      LEFT JOIN media_files mf ON mi.id = mf.media_item_id
      WHERE mi.published = 1
      GROUP BY mi.id
      ORDER BY mi.media_date DESC, mi.created_at DESC;
    `;
        const [mediaItems] = await pool.query(query);
        res.json(mediaItems);
    } catch (error) {
        console.error('Error fetching public media:', error);
        res.status(500).json({ message: 'Erreur lors de la recuperation des medias.' });
    }
});

export default router;
