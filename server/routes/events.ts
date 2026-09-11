import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import crypto from 'crypto';
import { logActivity } from '../utils/activity';

const router = Router();

router.use(authenticateToken);

// GET /api/events - Récupérer tous les événements avec leurs orchestres et statistiques de présence
router.get('/', async (req, res) => {
  try {
    const [events] = await pool.query(`
        SELECT 
        e.id, e.title, e.description, e.event_type, 
        DATE_FORMAT(e.event_date, '%Y-%m-%dT%H:%i:%s') as event_date,
        TIME_FORMAT(e.end_time, '%H:%i') as end_time,
        e.location, e.is_public, e.practical_info,
        e.image_url,
        COALESCE(
          e.image_url,
          (
            SELECT COALESCE(o2.photo_url, (SELECT op.photo_url FROM orchestra_photos op WHERE op.orchestra_id = o2.id ORDER BY op.display_order ASC LIMIT 1))
            FROM event_orchestras eo2
            JOIN orchestras o2 ON eo2.orchestra_id = o2.id
            WHERE eo2.event_id = e.id
            ORDER BY o2.display_order ASC, o2.name ASC
            LIMIT 1
          )
        ) AS fallback_image_url,
        CASE 
          WHEN COUNT(DISTINCT o.id) > 0 THEN 
            JSON_ARRAYAGG(JSON_OBJECT('id', o.id, 'name', o.name, 'photo_url', o.photo_url))
          ELSE 
            JSON_ARRAY()
        END AS orchestras,
        COUNT(DISTINCT CASE WHEN ea.status = 'present' THEN ea.user_id END) AS attendance_present,
        COUNT(DISTINCT CASE WHEN ea.status = 'absent' THEN ea.user_id END) AS attendance_absent,
        COALESCE(
          NULLIF((
            SELECT COUNT(DISTINCT uo.user_id)
            FROM user_orchestras uo
            JOIN event_orchestras eo_sub ON uo.orchestra_id = eo_sub.orchestra_id
            WHERE eo_sub.event_id = e.id
          ), 0),
          (SELECT COUNT(*) FROM profiles WHERE status = 'Active' OR status IS NULL)
        ) AS attendance_total_target
      FROM events e
      LEFT JOIN event_orchestras eo ON e.id = eo.event_id
      LEFT JOIN orchestras o ON eo.orchestra_id = o.id
      LEFT JOIN event_attendances ea ON e.id = ea.event_id
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
  const { title, description, event_type, event_date, end_time, location, orchestra_ids, practical_info, is_public, image_url } = req.body;
  if (!title || !event_type || !event_date) {
    return res.status(400).json({ message: 'Champs requis manquants.' });
  }

  const cleanEndTime = event_type === 'repetition' && end_time ? end_time : null;
  const cleanImageUrl = image_url && typeof image_url === 'string' && image_url.trim() ? image_url.trim() : null;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const newEventId = crypto.randomUUID();
    await connection.query(
      'INSERT INTO events (id, title, description, event_type, event_date, end_time, location, practical_info, is_public, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newEventId, title, description, event_type, event_date, cleanEndTime, location, practical_info, is_public !== undefined ? is_public : true, cleanImageUrl]
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
    res.status(500).json({ message: 'Erreur lors de la création de l\'événement.' });
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
  const { title, description, event_type, event_date, end_time, location, orchestra_ids, practical_info, is_public, image_url } = req.body;
  if (!title || !event_type || !event_date) {
    return res.status(400).json({ message: 'Champs requis manquants.' });
  }

  const cleanEndTime = event_type === 'repetition' && end_time ? end_time : null;
  const cleanImageUrl = image_url && typeof image_url === 'string' && image_url.trim() ? image_url.trim() : null;

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
            'UPDATE events SET title = ?, description = ?, event_type = ?, event_date = ?, end_time = ?, location = ?, practical_info = ?, is_public = ?, image_url = ? WHERE id = ?',
            [title, description, event_type, event_date, cleanEndTime, location, practical_info, is_public !== undefined ? is_public : true, cleanImageUrl, id]
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

// POST /api/events/:id/attendance - Enregistrer ou modifier sa présence (Membre/Admin/Gestionnaire)
router.post('/:id/attendance', async (req, res) => {
  // @ts-ignore
  const userId = (req as any).user?.id;
  const { id: eventId } = req.params;
  const { status, comment } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Utilisateur non authentifié.' });
  }

  if (!['present', 'absent'].includes(status)) {
    return res.status(400).json({ message: 'Statut invalide. Utilisez "present" ou "absent".' });
  }

  try {
    const attendanceId = crypto.randomUUID();
    const cleanComment = comment && typeof comment === 'string' ? comment.trim().slice(0, 255) : null;

    await pool.query(`
      INSERT INTO event_attendances (id, event_id, user_id, status, comment, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        comment = VALUES(comment),
        updated_at = NOW()
    `, [attendanceId, eventId, userId, status, cleanComment]);

    res.json({ 
      success: true, 
      status, 
      comment: cleanComment,
      message: status === 'present' ? 'Votre présence a été confirmée.' : 'Votre absence a été enregistrée.' 
    });
  } catch (error: any) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement de votre présence.' });
  }
});

// GET /api/events/:id/attendances - Récupérer le détail complet des présences pour un événement (Admin/Gestionnaire)
router.get('/:id/attendances', async (req, res) => {
  // @ts-ignore
  const userRole = (req as any).user?.role;
  if (!['Admin', 'Gestionnaire'].includes(userRole)) {
    return res.status(403).json({ message: 'Accès réservé aux gestionnaires et administrateurs.' });
  }
  const { id: eventId } = req.params;

  try {
    // 1. Récupérer les orchestres liés à cet événement
    const [eventOrchs]: any = await pool.query(
      'SELECT orchestra_id FROM event_orchestras WHERE event_id = ?',
      [eventId]
    );

    let targetUsersQuery = '';
    let params: any[] = [];

    if (eventOrchs.length > 0) {
      const orchIds = eventOrchs.map((o: any) => o.orchestra_id);
      targetUsersQuery = `
        SELECT DISTINCT
          u.id as user_id,
          p.first_name,
          p.last_name,
          p.email,
          p.role,
          ea.status as attendance_status,
          ea.comment as attendance_comment,
          DATE_FORMAT(ea.updated_at, '%Y-%m-%dT%H:%i:%s') as attendance_updated_at,
          (
            SELECT GROUP_CONCAT(DISTINCT i.name ORDER BY i.name SEPARATOR ', ')
            FROM user_instruments ui
            JOIN instruments i ON ui.instrument_id = i.id
            WHERE ui.user_id = u.id
          ) as instruments,
          (
            SELECT GROUP_CONCAT(DISTINCT o.name ORDER BY o.name SEPARATOR ', ')
            FROM user_orchestras uo2
            JOIN orchestras o ON uo2.orchestra_id = o.id
            WHERE uo2.user_id = u.id
          ) as orchestras
        FROM users u
        JOIN profiles p ON u.id = p.id
        JOIN user_orchestras uo ON u.id = uo.user_id
        LEFT JOIN event_attendances ea ON ea.event_id = ? AND ea.user_id = u.id
        WHERE uo.orchestra_id IN (?) AND (p.status = 'Active' OR p.status IS NULL)
        ORDER BY p.last_name ASC, p.first_name ASC
      `;
      params = [eventId, orchIds];
    } else {
      targetUsersQuery = `
        SELECT DISTINCT
          u.id as user_id,
          p.first_name,
          p.last_name,
          p.email,
          p.role,
          ea.status as attendance_status,
          ea.comment as attendance_comment,
          DATE_FORMAT(ea.updated_at, '%Y-%m-%dT%H:%i:%s') as attendance_updated_at,
          (
            SELECT GROUP_CONCAT(DISTINCT i.name ORDER BY i.name SEPARATOR ', ')
            FROM user_instruments ui
            JOIN instruments i ON ui.instrument_id = i.id
            WHERE ui.user_id = u.id
          ) as instruments,
          (
            SELECT GROUP_CONCAT(DISTINCT o.name ORDER BY o.name SEPARATOR ', ')
            FROM user_orchestras uo2
            JOIN orchestras o ON uo2.orchestra_id = o.id
            WHERE uo2.user_id = u.id
          ) as orchestras
        FROM users u
        JOIN profiles p ON u.id = p.id
        LEFT JOIN event_attendances ea ON ea.event_id = ? AND ea.user_id = u.id
        WHERE p.status = 'Active' OR p.status IS NULL
        ORDER BY p.last_name ASC, p.first_name ASC
      `;
      params = [eventId];
    }

    const [users]: any = await pool.query(targetUsersQuery, params);

    const presents = users.filter((u: any) => u.attendance_status === 'present');
    const absents = users.filter((u: any) => u.attendance_status === 'absent');
    const unanswered = users.filter((u: any) => !u.attendance_status);

    res.json({
      total_target: users.length,
      counts: {
        present: presents.length,
        absent: absents.length,
        unanswered: unanswered.length,
        rate: users.length > 0 ? Math.round((presents.length / users.length) * 100) : 0
      },
      presents,
      absents,
      unanswered
    });
  } catch (error: any) {
    console.error('Error fetching event attendance details:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des détails de présence.' });
  }
});

export default router;
