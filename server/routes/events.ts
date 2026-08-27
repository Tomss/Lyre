import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import crypto from 'crypto';
import { logActivity } from '../utils/activity';

const router = Router();

router.use(authenticateToken);

// GET /api/events - Récupérer tous les événements avec leurs orchestres
router.get('/', async (req, res) => {
  try {
    const [events] = await pool.query(`
        SELECT 
        e.id, e.title, e.description, e.event_type, 
        DATE_FORMAT(e.event_date, '%Y-%m-%dT%H:%i:%s') as event_date,
        DATE_FORMAT(e.end_time, '%H:%i') as end_time,
        e.location, e.is_public, e.practical_info,
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
  if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('news'))) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }
  const { title, description, event_type, event_date, end_time, location, orchestra_ids, practical_info, is_public } = req.body;
  if (!title || !event_type || !event_date) {
    return res.status(400).json({ message: 'Champs requis manquants.' });
  }

  const cleanEndTime = event_type === 'repetition' && end_time ? end_time : null;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const newEventId = crypto.randomUUID();
    await connection.query(
      'INSERT INTO events (id, title, description, event_type, event_date, end_time, location, practical_info, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newEventId, title, description, event_type, event_date, cleanEndTime, location, practical_info, is_public !== undefined ? is_public : true]
    );
    for (const orchestra_id of (orchestra_ids || [])) {
      await connection.query(
        'INSERT INTO event_orchestras (id, event_id, orchestra_id) VALUES (?, ?, ?)',
        [crypto.randomUUID(), newEventId, orchestra_id]
      );
    }
    await connection.commit();

    // Journaliser l'activité de création
    const [firstOrchestra] = orchestra_ids;
    logActivity({
      type: 'event',
      action_type: 'create',
      target_id: String(newEventId),
      orchestra_id: firstOrchestra || null, // On lie au premier orchestre par simplicité ou null si global
      // @ts-ignore
      created_by: (req as any).user.id,
      title: title,
      message: `Nouvel événement : ${title}${location ? ` à ${location}` : ''} le ${new Date(event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`
    });

    res.status(201).json({ message: 'Événement créé avec succès.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la crÃ©ation de l\'Ã©vÃ©nement.' });
  } finally {
    connection.release();
  }
});

// PUT /api/events/:id - Mettre à jour un événement
router.put('/:id', async (req, res) => {
  // @ts-ignore
  if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('news'))) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }
  const { id } = req.params;
  const { title, description, event_type, event_date, end_time, location, orchestra_ids, practical_info, is_public } = req.body;
  if (!title || !event_type || !event_date) {
    return res.status(400).json({ message: 'Champs requis manquants.' });
  }

  const cleanEndTime = event_type === 'repetition' && end_time ? end_time : null;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Récupérer l'ancien événement pour comparaison
        const [oldEvents] = await connection.query('SELECT * FROM events WHERE id = ?', [id]) as any;
        const oldEvent = oldEvents[0];

        if (!oldEvent) {
            await connection.rollback();
            return res.status(404).json({ message: 'Événement non trouvé.' });
        }

        // 2. Mettre à jour l'événement
        await connection.query(
            'UPDATE events SET title = ?, description = ?, event_type = ?, event_date = ?, end_time = ?, location = ?, practical_info = ?, is_public = ? WHERE id = ?',
            [title, description, event_type, event_date, cleanEndTime, location, practical_info, is_public !== undefined ? is_public : true, id]
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

        // 3. Générer un message de log détaillé
        let detailMessage = `Événement ${title} mis à jour. `;
        const changes = [];

        if (oldEvent.title !== title) changes.push(`Nouveau titre : ${title}`);
        if (new Date(oldEvent.event_date).getTime() !== new Date(event_date).getTime()) {
            const newDateStr = new Date(event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
            changes.push(`Nouvel horaire : ${newDateStr}`);
        }
        if (oldEvent.location !== location) changes.push(`Nouveau lieu : ${location || 'Non spécifié'}`);
        if (oldEvent.practical_info !== practical_info) {
            const truncatedInfo = practical_info && practical_info.length > 50 
                ? practical_info.substring(0, 50) + '...' 
                : (practical_info || 'Supprimées');
            changes.push(`Infos Pratiques : ${truncatedInfo}`);
        }

        if (changes.length > 0) {
            detailMessage = changes.join(' | ');
        }

        const [firstOrchestra] = orchestrasToLink;
        logActivity({
            type: 'event',
            action_type: 'update',
            target_id: String(id),
            orchestra_id: firstOrchestra || null,
            // @ts-ignore
            created_by: (req as any).user.id,
            title: title,
            message: detailMessage
        });

        await connection.commit();
        res.status(200).json({ message: 'Événement mis à jour avec succès.' });
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

    // Récupérer le titre avant suppression pour le log
    const [oldEvent] = await connection.query('SELECT title FROM events WHERE id = ?', [id]) as any;
    const eventTitle = oldEvent[0]?.title || 'Événement';

    await connection.query('DELETE FROM event_orchestras WHERE event_id = ?', [id]);
    const [result] = await connection.query('DELETE FROM events WHERE id = ?', [id]);
    // @ts-ignore
    if (result.affectedRows === 0) {
      throw new Error('Ã‰vÃ©nement non trouvÃ©.');
    }
    await connection.commit();

    // Journaliser l'activité de suppression
    logActivity({
      type: 'event',
      action_type: 'delete',
      target_id: String(id),
      // @ts-ignore
      created_by: (req as any).user.id,
      title: eventTitle,
      message: `L'événement ${eventTitle} a été supprimé`
    });

    res.status(200).json({ message: 'Événement supprimé avec succès.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'Ã©vÃ©nement.' });
  } finally {
    connection.release();
  }
});

export default router;
