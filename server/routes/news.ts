import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import crypto from 'crypto';

const router = Router();

// Public: Get all news
router.get('/', async (req, res) => {
    try {
        const [news] = await pool.query('SELECT * FROM news ORDER BY published_at DESC');
        res.json(news);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des actualités.' });
    }
});

// Admin: Create news
router.post('/', authenticateToken, async (req, res) => {
    // @ts-ignore
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Accès refusé.' });
    }

    const { title, content, image_url, published_at } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: "Le titre et le contenu sont requis." });
    }

    try {
        const newNews = {
            id: crypto.randomUUID(),
            title,
            content,
            image_url: image_url || null,
            published_at: published_at || new Date(),
            created_at: new Date()
        };

        await pool.query(
            'INSERT INTO news (id, title, content, image_url, published_at, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [newNews.id, newNews.title, newNews.content, newNews.image_url, newNews.published_at, newNews.created_at]
        );

        res.status(201).json({ message: 'Actualité créée avec succès', news: newNews });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la création de l\'actualité.' });
    }
});

// Admin: Update news
router.put('/:id', authenticateToken, async (req, res) => {
    // @ts-ignore
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Accès refusé.' });
    }

    const { id } = req.params;
    const { title, content, image_url, published_at } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: "Le titre et le contenu sont requis." });
    }

    try {
        const [result] = await pool.query(
            'UPDATE news SET title = ?, content = ?, image_url = ?, published_at = ? WHERE id = ?',
            [title, content, image_url || null, published_at || new Date(), id]
        );

        // @ts-ignore
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Actualité non trouvée.' });
        }

        res.status(200).json({ message: 'Actualité mise à jour avec succès.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'actualité.' });
    }
});

// Admin: Delete news
router.delete('/:id', authenticateToken, async (req, res) => {
    // @ts-ignore
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Accès refusé.' });
    }

    const { id } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM news WHERE id = ?', [id]);

        // @ts-ignore
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Actualité non trouvée.' });
        }

        res.status(200).json({ message: 'Actualité supprimée avec succès.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'actualité.' });
    }
});

export default router;
