import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import { RowDataPacket } from 'mysql2';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  // @ts-ignore
  const userId = (req as any).user.id;

  if (!userId) {
    return res.status(400).json({ message: 'User ID not found in token' });
  }

  try {
    let userInstruments: RowDataPacket[] = [];
    let userOrchestras: RowDataPacket[] = [];
    let userEvents: RowDataPacket[] = [];
    let rawPartitions: RowDataPacket[] = [];
    let activityLogs: RowDataPacket[] = [];

    // 1. User Instruments
    try {
      const [resInst] = await pool.query(
        'SELECT i.id, i.name FROM user_instruments ui JOIN instruments i ON ui.instrument_id = i.id WHERE ui.user_id = ?',
        [userId]
      );
      userInstruments = resInst as RowDataPacket[];
    } catch (err: any) {
      console.error('[Dashboard] Error querying userInstruments:', err.message);
    }

    // 2. User Orchestras
    try {
      const [resOrch] = await pool.query(
        'SELECT o.id, o.name, o.description FROM user_orchestras uo JOIN orchestras o ON uo.orchestra_id = o.id WHERE uo.user_id = ?',
        [userId]
      );
      userOrchestras = resOrch as RowDataPacket[];
    } catch (err: any) {
      console.error('[Dashboard] Error querying userOrchestras:', err.message);
    }

    // 3. User Events (with attendance join and safe fallback)
    try {
      const [resEvents] = await pool.query(`
        SELECT 
          e.id, e.title, 
          DATE_FORMAT(e.event_date, '%Y-%m-%dT%H:%i:%s') as event_date,
          TIME_FORMAT(e.end_time, '%H:%i') as end_time,
          e.location, e.practical_info, e.event_type,
          ea.status AS user_attendance_status,
          ea.comment AS user_attendance_comment,
          CASE 
            WHEN COUNT(o.id) > 0 THEN 
              JSON_ARRAYAGG(JSON_OBJECT('id', o.id, 'name', o.name))
            ELSE 
              JSON_ARRAY()
          END as orchestras
        FROM events e
        LEFT JOIN event_orchestras eo ON e.id = eo.event_id
        LEFT JOIN orchestras o ON eo.orchestra_id = o.id
        LEFT JOIN event_attendances ea ON e.id = ea.event_id AND ea.user_id = ?
        WHERE e.event_date > NOW() AND (
          e.id IN (
            SELECT eo2.event_id 
            FROM event_orchestras eo2 
            JOIN user_orchestras uo ON eo2.orchestra_id = uo.orchestra_id 
            WHERE uo.user_id = ?
          )
          OR NOT EXISTS (SELECT 1 FROM event_orchestras eo3 WHERE eo3.event_id = e.id)
        )
        GROUP BY e.id, e.title, e.event_date, e.end_time, e.location, e.practical_info, e.event_type, ea.status, ea.comment
        ORDER BY e.event_date ASC
      `, [userId, userId]);
      userEvents = resEvents as RowDataPacket[];
    } catch (err: any) {
      console.error('[Dashboard] Error querying userEvents with attendances:', err.message);
      try {
        const [fallbackEvents] = await pool.query(`
          SELECT 
            e.id, e.title, 
            DATE_FORMAT(e.event_date, '%Y-%m-%dT%H:%i:%s') as event_date,
            TIME_FORMAT(e.end_time, '%H:%i') as end_time,
            e.location, e.practical_info, e.event_type,
            NULL AS user_attendance_status,
            NULL AS user_attendance_comment,
            CASE 
              WHEN COUNT(o.id) > 0 THEN 
                JSON_ARRAYAGG(JSON_OBJECT('id', o.id, 'name', o.name))
              ELSE 
                JSON_ARRAY()
            END as orchestras
          FROM events e
          LEFT JOIN event_orchestras eo ON e.id = eo.event_id
          LEFT JOIN orchestras o ON eo.orchestra_id = o.id
          WHERE e.event_date > NOW() AND (
            e.id IN (
              SELECT eo2.event_id 
              FROM event_orchestras eo2 
              JOIN user_orchestras uo ON eo2.orchestra_id = uo.orchestra_id 
              WHERE uo.user_id = ?
            )
            OR NOT EXISTS (SELECT 1 FROM event_orchestras eo3 WHERE eo3.event_id = e.id)
          )
          GROUP BY e.id, e.title, e.event_date, e.end_time, e.location, e.practical_info, e.event_type
          ORDER BY e.event_date ASC
        `, [userId]);
        userEvents = fallbackEvents as RowDataPacket[];
      } catch (fallbackErr: any) {
        console.error('[Dashboard] Fallback userEvents also failed:', fallbackErr.message);
      }
    }

    // 4. User Partitions
    try {
      const [resPartitions] = await pool.query(`
        SELECT 
          p.id, p.nom, p.file_path, p.created_at as partition_created_at,
          m.id as morceau_id, m.nom as morceau_nom, m.compositeur, m.arrangement, m.created_at as morceau_created_at,
          i.id as instrument_id, i.name as instrument_name
        FROM partitions p
        LEFT JOIN morceaux m ON p.morceau_id = m.id
        LEFT JOIN instruments i ON p.instrument_id = i.id
        WHERE p.instrument_id IN (SELECT instrument_id FROM user_instruments WHERE user_id = ?)
        AND (m.is_active = 1 OR m.is_active IS NULL)
        AND (
          p.morceau_id IN (
            SELECT mo.morceau_id 
            FROM morceau_orchestras mo 
            JOIN user_orchestras uo ON mo.orchestra_id = uo.orchestra_id 
            WHERE uo.user_id = ?
          )
          OR NOT EXISTS (SELECT 1 FROM morceau_orchestras mo2 WHERE mo2.morceau_id = p.morceau_id)
        )
      `, [userId, userId]);
      rawPartitions = resPartitions as RowDataPacket[];
    } catch (err: any) {
      console.error('[Dashboard] Error querying userPartitions:', err.message);
    }

    // 5. Activity Logs
    try {
      const [resLogs] = await pool.query(`
        SELECT 
          al.*, 
          p.first_name, p.last_name
        FROM activity_log al
        JOIN profiles p ON al.created_by = p.id
        WHERE (al.orchestra_id IS NULL 
           OR al.orchestra_id IN (SELECT orchestra_id FROM user_orchestras WHERE user_id = ?))
           AND al.created_at >= DATE_SUB(NOW(), INTERVAL 15 DAY)
        ORDER BY al.created_at DESC
        LIMIT 50
      `, [userId]);
      activityLogs = resLogs as RowDataPacket[];
    } catch (err: any) {
      console.error('[Dashboard] Error querying activityLogs:', err.message);
    }

    // Récupérer tous les orchestres pour les morceaux concernés
    const morceauIds = [...new Set(rawPartitions.map(p => p.morceau_id).filter(id => id))];
    let morceauOrchestras: RowDataPacket[] = [];
    if (morceauIds.length > 0) {
      try {
        const [morceauOrchestrasRes] = await pool.query(`
          SELECT mo.morceau_id, o.id, o.name
          FROM morceau_orchestras mo
          JOIN orchestras o ON mo.orchestra_id = o.id
          WHERE mo.morceau_id IN (?)
        `, [morceauIds]);
        morceauOrchestras = morceauOrchestrasRes as RowDataPacket[];
      } catch (err: any) {
        console.error('[Dashboard] Error querying morceauOrchestras:', err.message);
      }
    }

    const orchestrasByMorceauId = new Map();
    morceauOrchestras.forEach(mo => {
      if (!orchestrasByMorceauId.has(mo.morceau_id)) {
        orchestrasByMorceauId.set(mo.morceau_id, []);
      }
      orchestrasByMorceauId.get(mo.morceau_id).push({ id: mo.id, name: mo.name });
    });

    // Formatter les partitions pour correspondre à la structure attendue par le frontend
    const userPartitions = rawPartitions.map(p => ({
      id: p.id,
      nom: p.nom,
      file_path: p.file_path,
      created_at: p.partition_created_at,
      morceaux: {
        id: p.morceau_id,
        nom: p.morceau_nom,
        compositeur: p.compositeur,
        arrangement: p.arrangement,
        created_at: p.morceau_created_at,
        orchestras: orchestrasByMorceauId.get(p.morceau_id) || [],
      },
      instruments: {
        id: p.instrument_id,
        name: p.instrument_name,
      },
    }));

    return res.json({
      userInstruments,
      userOrchestras,
      userEvents,
      userPartitions,
      activityLogs,
    });

  } catch (error) {
    console.error('Fatal error fetching dashboard data:', error);
    return res.status(500).json({ message: 'Erreur lors de la recuperation des donnees du tableau de bord.' });
  }
});

export default router;
