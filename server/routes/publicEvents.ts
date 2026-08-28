import { Router } from 'express';
import pool from '../db';

const router = Router();

// Route publique, pas de middleware d'authentification requis.
router.get('/', async (req, res) => {
  try {
    // Cette requête récupère les événements et agrège les orchestres associés dans un champ JSON.
    const query = `
      SELECT 
        e.id, e.title, e.description, e.event_type, 
        DATE_FORMAT(e.event_date, '%Y-%m-%dT%H:%i:%s') as event_date,
        TIME_FORMAT(e.end_time, '%H:%i') as end_time,
        e.location,
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
        ) AS image_url,
        CASE 
          WHEN COUNT(o.id) > 0 THEN 
            JSON_ARRAYAGG(
              JSON_OBJECT('id', o.id, 'name', o.name)
            )
          ELSE 
            JSON_ARRAY()
        END AS orchestras
      FROM events e
      LEFT JOIN event_orchestras eo ON e.id = eo.event_id
      LEFT JOIN orchestras o ON eo.orchestra_id = o.id
      WHERE e.is_public = 1
      GROUP BY e.id
      ORDER BY e.event_date DESC;
    `;

    const [events] = await pool.query(query);
    res.json(events);
  } catch (error) {
    console.error('Error fetching public events:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des événements.' });
  }
});

export default router;