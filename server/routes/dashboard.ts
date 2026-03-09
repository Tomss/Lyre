import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import { RowDataPacket } from 'mysql2';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  // @ts-ignore
  const userId = req.user.id;
  console.log('Fetching dashboard data for userId:', userId);

  if (!userId) {
    return res.status(400).json({ message: 'User ID not found in token' });
  }

  try {
    // Exécuter les requêtes de base en parallèle
    const [
      userInstrumentsRes,
      userOrchestrasRes,
      userEventsRes,
      userPartitionsRes
    ] = await Promise.all([
      pool.query('SELECT i.id, i.name FROM user_instruments ui JOIN instruments i ON ui.instrument_id = i.id WHERE ui.user_id = ?', [userId]),
      pool.query('SELECT o.id, o.name, o.description FROM user_orchestras uo JOIN orchestras o ON uo.orchestra_id = o.id WHERE uo.user_id = ?', [userId]),
      pool.query(`
        SELECT 
          e.id, e.title, e.event_date, e.location, e.practical_info, e.event_type,
          JSON_ARRAYAGG(JSON_OBJECT('id', o.id, 'name', o.name)) as orchestras
        FROM events e
        JOIN event_orchestras eo ON e.id = eo.event_id
        JOIN orchestras o ON eo.orchestra_id = o.id
        WHERE e.event_date > NOW() AND e.id IN (
          SELECT eo.event_id 
          FROM event_orchestras eo 
          JOIN user_orchestras uo ON eo.orchestra_id = uo.orchestra_id 
          WHERE uo.user_id = ?
        )
        GROUP BY e.id
        ORDER BY e.event_date ASC
      `, [userId]),
      pool.query(`
        SELECT 
          p.id, p.nom, p.file_path,
          m.id as morceau_id, m.nom as morceau_nom, m.compositeur, m.arrangement,
          i.id as instrument_id, i.name as instrument_name
        FROM partitions p
        LEFT JOIN morceaux m ON p.morceau_id = m.id
        LEFT JOIN instruments i ON p.instrument_id = i.id
        WHERE p.instrument_id IN (SELECT instrument_id FROM user_instruments WHERE user_id = ?)
      `, [userId])
    ]);

    const userInstruments = userInstrumentsRes[0] as RowDataPacket[];
    console.log('userInstruments found:', userInstruments);
    const userOrchestras = userOrchestrasRes[0] as RowDataPacket[];
    console.log('userOrchestras found:', userOrchestras);
    const userEvents = userEventsRes[0] as RowDataPacket[];
    console.log('userEvents found:', userEvents);
    const rawPartitions = userPartitionsRes[0] as RowDataPacket[];
    console.log('rawPartitions found:', rawPartitions.length);


    // Récupérer tous les orchestres pour les morceaux concernés
    const morceauIds = [...new Set(rawPartitions.map(p => p.morceau_id).filter(id => id))];
    let morceauOrchestras: RowDataPacket[] = [];
    if (morceauIds.length > 0) {
      const [morceauOrchestrasRes] = await pool.query(`
        SELECT mo.morceau_id, o.id, o.name
        FROM morceau_orchestras mo
        JOIN orchestras o ON mo.orchestra_id = o.id
        WHERE mo.morceau_id IN (?)
      `, [morceauIds]);
      morceauOrchestras = morceauOrchestrasRes as RowDataPacket[];
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
      morceaux: {
        id: p.morceau_id,
        nom: p.morceau_nom,
        compositeur: p.compositeur,
        arrangement: p.arrangement,
        orchestras: orchestrasByMorceauId.get(p.morceau_id) || [],
      },
      instruments: {
        id: p.instrument_id,
        name: p.instrument_name,
      },
    }));

    res.json({
      userInstruments,
      userOrchestras,
      userEvents,
      userPartitions,
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Erreur lors de la recuperation des donnees du tableau de bord.' });
  }
});

export default router;