import express from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import crypto from 'crypto';

const router = express.Router();

// GET all history events ordered by sort_order
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM history_events ORDER BY sort_order ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching history events:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération de l\'histoire', error });
    }
});

// GET specific history event
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM history_events WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Événement introuvable' });
        }
        res.json(rows[0]);
    } catch (error) {
         res.status(500).json({ message: 'Erreur serveur', error });
    }
});

// POST new history event
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { year, title, content, era, icon, image_url, sort_order } = req.body;
        const id = crypto.randomUUID();
        
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO history_events (id, year, title, content, era, icon, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, year, title, content, era || 'classic', icon || 'Music', image_url || null, sort_order || 0]
        );
        
        res.status(201).json({ id, message: 'Événement créé avec succès' });
    } catch (error) {
        console.error('Error creating history event:', error);
        res.status(500).json({ message: 'Erreur lors de la création de l\'événement', error });
    }
});

// PUT reorder history events
router.put('/reorder', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { items } = req.body; // Array of IDs in new order
        if (!Array.isArray(items)) {
            return res.status(400).json({ message: 'Format invalide' });
        }

        await connection.beginTransaction();

        for (let i = 0; i < items.length; i++) {
            await connection.query(
                'UPDATE history_events SET sort_order = ? WHERE id = ?',
                [i, items[i]]
            );
        }

        await connection.commit();
        res.json({ message: 'Ordre mis à jour' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error reordering history:', error);
        res.status(500).json({ message: 'Erreur lors de la réorganisation', error });
    } finally {
        if (connection) connection.release();
    }
});

// PUT update history event
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { year, title, content, era, icon, image_url, sort_order } = req.body;
        
        const [result] = await pool.query<ResultSetHeader>(
            'UPDATE history_events SET year = ?, title = ?, content = ?, era = ?, icon = ?, image_url = ?, sort_order = ? WHERE id = ?',
            [year, title, content, era, icon, image_url, sort_order, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Événement introuvable' });
        }
        res.json({ message: 'Événement mis à jour avec succès' });
    } catch (error) {
         console.error('Error updating history event:', error);
         res.status(500).json({ message: 'Erreur lors de la mise à jour', error });
    }
});

// DELETE history event
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const [result] = await pool.query<ResultSetHeader>('DELETE FROM history_events WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Événement introuvable' });
        }
        res.json({ message: 'Événement supprimé' });
    } catch (error) {
        console.error('Error deleting history event:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression', error });
    }
});

export default router;
