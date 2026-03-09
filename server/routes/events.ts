import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import crypto from 'crypto';

const router = Router();

router.use(authenticateToken);

// GET /api/events - Récupérer tous les événements avec leurs orchestres
router.get('/', async (req, res) => {
  try {
    const [events] = await pool.query(`
      SELECT 
        e.*, 
        JSON_ARRAYAGG(JSON_OBJECT('id', o.id, 'name', o.name))
        AS orchestras
      FROM events e
      LEFT JOIN event_orchestras eo ON e.id = eo.event_id
      LEFT JOIN orchestras o ON eo.orchestra_id = o.id
      GROUP BY e.id
      ORDER BY e.event_date DESC
    `);
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/events - Créer un nouvel événement
router.post('/', async (req, res) => {
  // @ts-ignore
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Accès refusé.' });
  }
  const { title, description, event_type, event_date, location, orchestra_ids, practical_info } = req.body;
  if (!title || !event_type || !event_date) {
    return res.status(400).json({ message: 'Champs requis manquants.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const newEventId = crypto.randomUUID();
    await connection.query(
      'INSERT INTO events (id, title, description, event_type, event_date, location, practical_info) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newEventId, title, description, event_type, event_date, location, practical_info]
    );
    for (const orchestra_id of orchestra_ids) {
      await connection.query(
        'INSERT INTO event_orchestras (id, event_id, orchestra_id) VALUES (?, ?, ?)',
        [crypto.randomUUID(), newEventId, orchestra_id]
      );
    }
    await connection.commit();
    res.status(201).json({ message: 'Événement créé avec succès.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'événement.' });
  } finally {
    connection.release();
  }
});

// PUT /api/events/:id - Mettre à jour un événement
router.put('/:id', async (req, res) => {
  // @ts-ignore
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Accès refusé.' });
  }
  const { id } = req.params;
  const { title, description, event_type, event_date, location, orchestra_ids, practical_info } = req.body;
  if (!title || !event_type || !event_date) {
    return res.status(400).json({ message: 'Champs requis manquants.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      'UPDATE events SET title = ?, description = ?, event_type = ?, event_date = ?, location = ?, practical_info = ? WHERE id = ?',
      [title, description, event_type, event_date, location, practical_info, id]
    );
    await connection.query('DELETE FROM event_orchestras WHERE event_id = ?', [id]);

    const orchestrasToLink = Array.isArray(orchestra_ids) ? orchestra_ids : [];
    for (const orchestra_id of orchestrasToLink) {
      if (orchestra_id) {
        await connection.query(
          'INSERT INTO event_orchestras (id, event_id, orchestra_id) VALUES (?, ?, ?)',
          [crypto.randomUUID(), id, orchestra_id]
        );
      }
    }
    await connection.commit();
    res.status(200).json({ message: 'Événement mis à jour avec succès.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'événement.' });
  } finally {
    connection.release();
  }
});

// DELETE /api/events/:id - Supprimer un événement
router.delete('/:id', async (req, res) => {
  // @ts-ignore
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Accès refusé.' });
  }
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM event_orchestras WHERE event_id = ?', [id]);
    const [result] = await connection.query('DELETE FROM events WHERE id = ?', [id]);
    // @ts-ignore
    if (result.affectedRows === 0) {
      throw new Error('Événement non trouvé.');
    }
    await connection.commit();
    res.status(200).json({ message: 'Événement supprimé avec succès.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'événement.' });
  } finally {
    connection.release();
  }
});

export default router;
