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
        res.status(500).json({ message: 'Erreur lors de la rÃ©cupÃ©ration des actualitÃ©s.' });
    }
});

// Admin: Create news
router.post('/', authenticateToken, async (req, res) => {
    // @ts-ignore
    if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('news'))) {
        return res.status(403).json({ message: 'AccÃ¨s refusÃ©.' });
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

        res.status(201).json({ message: 'ActualitÃ© crÃ©Ã©e avec succÃ¨s', news: newNews });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la crÃ©ation de l\'actualitÃ©.' });
    }
});

// Admin: Update news
router.put('/:id', authenticateToken, async (req, res) => {
    // @ts-ignore
    if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('news'))) {
        return res.status(403).json({ message: 'AccÃ¨s refusÃ©.' });
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
            return res.status(404).json({ message: 'ActualitÃ© non trouvÃ©e.' });
        }

        res.status(200).json({ message: 'ActualitÃ© mise Ã  jour avec succÃ¨s.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la mise Ã  jour de l\'actualitÃ©.' });
    }
});

// Admin: Delete news
router.delete('/:id', authenticateToken, async (req, res) => {
    // @ts-ignore
    if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('news'))) {
        return res.status(403).json({ message: 'AccÃ¨s refusÃ©.' });
    }

    const { id } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM news WHERE id = ?', [id]);

        // @ts-ignore
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ActualitÃ© non trouvÃ©e.' });
        }

        res.status(200).json({ message: 'ActualitÃ© supprimÃ©e avec succÃ¨s.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'actualitÃ©.' });
    }
});

export default router;
