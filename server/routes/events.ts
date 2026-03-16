import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import crypto from 'crypto';

const router = Router();

router.use(authenticateToken);

// GET /api/events - RÃ©cupÃ©rer tous les Ã©vÃ©nements avec leurs orchestres
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

// POST /api/events - CrÃ©er un nouvel Ã©vÃ©nement
router.post('/', async (req, res) => {
  // @ts-ignore
  if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('news'))) {
    return res.status(403).json({ message: 'AccÃ¨s refusÃ©.' });
  }
  const { title, description, event_type, event_date, location, orchestra_ids, practical_info, is_public } = req.body;
  if (!title || !event_type || !event_date) {
    return res.status(400).json({ message: 'Champs requis manquants.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const newEventId = crypto.randomUUID();
    await connection.query(
      'INSERT INTO events (id, title, description, event_type, event_date, location, practical_info, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [newEventId, title, description, event_type, event_date, location, practical_info, is_public !== undefined ? is_public : true]
    );
    for (const orchestra_id of orchestra_ids) {
      await connection.query(
        'INSERT INTO event_orchestras (id, event_id, orchestra_id) VALUES (?, ?, ?)',
        [crypto.randomUUID(), newEventId, orchestra_id]
      );
    }
    await connection.commit();
    res.status(201).json({ message: 'Ã‰vÃ©nement crÃ©Ã© avec succÃ¨s.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la crÃ©ation de l\'Ã©vÃ©nement.' });
  } finally {
    connection.release();
  }
});

// PUT /api/events/:id - Mettre Ã  jour un Ã©vÃ©nement
router.put('/:id', async (req, res) => {
  // @ts-ignore
  if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('news'))) {
    return res.status(403).json({ message: 'AccÃ¨s refusÃ©.' });
  }
  const { id } = req.params;
  const { title, description, event_type, event_date, location, orchestra_ids, practical_info, is_public } = req.body;
  if (!title || !event_type || !event_date) {
    return res.status(400).json({ message: 'Champs requis manquants.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      'UPDATE events SET title = ?, description = ?, event_type = ?, event_date = ?, location = ?, practical_info = ?, is_public = ? WHERE id = ?',
      [title, description, event_type, event_date, location, practical_info, is_public !== undefined ? is_public : true, id]
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
    res.status(200).json({ message: 'Ã‰vÃ©nement mis Ã  jour avec succÃ¨s.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise Ã  jour de l\'Ã©vÃ©nement.' });
  } finally {
    connection.release();
  }
});

// DELETE /api/events/:id - Supprimer un Ã©vÃ©nement
router.delete('/:id', async (req, res) => {
  // @ts-ignore
  if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('news'))) {
    return res.status(403).json({ message: 'AccÃ¨s refusÃ©.' });
  }
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM event_orchestras WHERE event_id = ?', [id]);
    const [result] = await connection.query('DELETE FROM events WHERE id = ?', [id]);
    // @ts-ignore
    if (result.affectedRows === 0) {
      throw new Error('Ã‰vÃ©nement non trouvÃ©.');
    }
    await connection.commit();
    res.status(200).json({ message: 'Ã‰vÃ©nement supprimÃ© avec succÃ¨s.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'Ã©vÃ©nement.' });
  } finally {
    connection.release();
  }
});

export default router;
