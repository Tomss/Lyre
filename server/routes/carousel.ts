import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import crypto from 'crypto';

const router = Router();

// GET /api/carousel (Public) - Récupérer les images actives triées
router.get('/', async (req, res) => {
    try {
        const query = 'SELECT * FROM carousel_images WHERE is_active = TRUE ORDER BY sort_order ASC, created_at DESC';
        const [images] = await pool.query(query);
        res.json(images);
    } catch (error) {
        console.error('Error fetching carousel images:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des images.' });
    }
});

// GET /api/carousel/admin (Admin) - Récupérer toutes les images
router.get('/admin', authenticateToken, async (req, res) => {
    // @ts-ignore
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Accès refusé.' });
    }
    try {
        const query = 'SELECT * FROM carousel_images ORDER BY sort_order ASC, created_at DESC';
        const [images] = await pool.query(query);
        res.json(images);
    } catch (error) {
        console.error('Error fetching admin carousel images:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des images.' });
    }
});

// POST /api/carousel (Admin) - Ajouter une image
router.post('/', authenticateToken, async (req, res) => {
    // @ts-ignore
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Accès refusé.' });
    }

    const { image_url, title, subtitle, sort_order, is_active } = req.body;

    if (!image_url) {
        return res.status(400).json({ message: 'L\'URL de l\'image est requise.' });
    }

    const id = crypto.randomUUID();
    // Default sort_order to 0 if not provided, is_active to true
    const order = sort_order !== undefined ? sort_order : 0;
    const active = is_active !== undefined ? is_active : true;

    try {
        const query = 'INSERT INTO carousel_images (id, image_url, title, subtitle, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)';
        await pool.query(query, [id, image_url, title, subtitle, order, active]);
        res.status(201).json({ message: 'Image ajoutée avec succès.', id });
    } catch (error) {
        console.error('Error adding carousel image:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'image.' });
    }
});

// PUT /api/carousel/reorder (Admin) - Réordonner les images
router.put('/reorder', authenticateToken, async (req, res) => {
    // @ts-ignore
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Accès refusé.' });
    }

    const { items } = req.body; // Array of IDs in new order

    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ message: 'Format invalide.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (let i = 0; i < items.length; i++) {
            const id = items[i];
            await connection.query('UPDATE carousel_images SET sort_order = ? WHERE id = ?', [i, id]);
        }

        await connection.commit();
        res.json({ message: 'Ordre mis à jour avec succès.' });
    } catch (error) {
        await connection.rollback();
        console.error('Error reordering carousel images:', error);
        res.status(500).json({ message: 'Erreur lors du réordonnancement.' });
    } finally {
        connection.release();
    }
});

// PUT /api/carousel/:id (Admin) - Modifier une image
router.put('/:id', authenticateToken, async (req, res) => {
    // @ts-ignore
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Accès refusé.' });
    }

    const { id } = req.params;
    const { image_url, title, subtitle, sort_order, is_active } = req.body;

    try {
        const query = `
      UPDATE carousel_images 
      SET image_url = ?, title = ?, subtitle = ?, sort_order = ?, is_active = ?
      WHERE id = ?
    `;
        await pool.query(query, [image_url, title, subtitle, sort_order, is_active, id]);
        res.json({ message: 'Image mise à jour avec succès.' });
    } catch (error) {
        console.error('Error updating carousel image:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'image.' });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    // @ts-ignore
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Accès refusé.' });
    }

    const { id } = req.params;

    try {
        await pool.query('DELETE FROM carousel_images WHERE id = ?', [id]);
        res.json({ message: 'Image supprimée avec succès.' });
    } catch (error) {
        console.error('Error deleting carousel image:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'image.' });
    }
});

export default router;
