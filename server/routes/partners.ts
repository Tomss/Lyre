import express from 'express';
import db from '../db';
import crypto from 'crypto';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// GET /api/partners - Get all partners publicly
router.get('/', async (req, res) => {
    try {
        const [partners] = await db.query('SELECT * FROM partners ORDER BY display_order ASC, created_at DESC');
        res.json(partners);
    } catch (error) {
        console.error('Error fetching partners:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des partenaires.' });
    }
});

// POST /api/partners - Create a new partner (Admin only)
router.post('/', authenticateToken, async (req, res) => {
    // @ts-ignore
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Accès refusé.' });
    }
    const { name, logo_url, description, website_url } = req.body;

    if (!name || !logo_url) {
        return res.status(400).json({ message: 'Nom et logo sont requis.' });
    }

    const id = crypto.randomUUID();

    try {
        // Get max display_order to append to the end
        const [rows]: any[] = await db.query('SELECT MAX(display_order) as maxOrder FROM partners');
        const maxOrder = rows[0]?.maxOrder || 0;
        const newOrder = maxOrder + 1;

        await db.query(
            'INSERT INTO partners (id, name, logo_url, description, website_url, display_order) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name, logo_url, description || null, website_url || null, newOrder]
        );

        const [newPartner] = await db.query('SELECT * FROM partners WHERE id = ?', [id]);
        res.status(201).json(Array.isArray(newPartner) ? newPartner[0] : newPartner);
    } catch (error) {
        console.error('Error creating partner:', error);
        res.status(500).json({ message: 'Erreur lors de la création du partenaire.' });
    }
});

// PUT /api/partners/reorder - Reorder partners (Admin only)
router.put('/reorder', authenticateToken, async (req, res) => {
    // @ts-ignore
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Accès refusé.' });
    }
    const { items } = req.body; // Expecting array of IDs in order

    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ message: 'Liste d\'identifiants invalide.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        for (let i = 0; i < items.length; i++) {
            await connection.query('UPDATE partners SET display_order = ? WHERE id = ?', [i, items[i]]);
        }

        await connection.commit();
        res.json({ message: 'Ordre des partenaires mis à jour.' });
    } catch (error) {
        await connection.rollback();
        console.error('Error reordering partners:', error);
        res.status(500).json({ message: 'Erreur lors du réordonnancement.' });
    } finally {
        connection.release();
    }
});

// PUT /api/partners/:id - Update a partner (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
    // @ts-ignore
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Accès refusé.' });
    }
    const { id } = req.params;
    const { name, logo_url, description, website_url } = req.body;

    if (!name || !logo_url) {
        return res.status(400).json({ message: 'Nom et logo sont requis.' });
    }

    try {
        const [result]: any = await db.query(
            'UPDATE partners SET name = ?, logo_url = ?, description = ?, website_url = ? WHERE id = ?',
            [name, logo_url, description || null, website_url || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Partenaire non trouvé.' });
        }

        const [updatedPartner] = await db.query('SELECT * FROM partners WHERE id = ?', [id]);
        res.json(Array.isArray(updatedPartner) ? updatedPartner[0] : updatedPartner);
    } catch (error) {
        console.error('Error updating partner:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du partenaire.' });
    }
});

// DELETE /api/partners/:id - Delete a partner (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
    // @ts-ignore
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Accès refusé.' });
    }
    const { id } = req.params;

    try {
        const [result]: any = await db.query('DELETE FROM partners WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Partenaire non trouvé.' });
        }

        res.json({ message: 'Partenaire supprimé avec succès.' });
    } catch (error) {
        console.error('Error deleting partner:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du partenaire.' });
    }
});

export default router;
