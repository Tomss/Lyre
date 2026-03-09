import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';

const router = Router();

// Toutes les routes dans ce fichier sont protégées
router.use(authenticateToken);

router.get('/events', async (req, res) => {
  // @ts-ignore
  const userId = req.user.id;

  if (!userId) {
    return res.status(400).json({ message: 'User ID not found in token' });
  }

  try {
    // Récupère les IDs des orchestres de l'utilisateur
    const [userOrchestraRows] = await pool.query<any[]>(
      'SELECT orchestra_id FROM user_orchestras WHERE user_id = ?',
      [userId]
    );

    if (userOrchestraRows.length === 0) {
      // L'utilisateur n'est dans aucun orchestre, donc aucun événement
      return res.json([]);
    }

    const orchestraIds = userOrchestraRows.map((row: { orchestra_id: any; }) => row.orchestra_id);

    // Récupère les événements associés à ces orchestres
    const query = `
      SELECT DISTINCT
        e.*,
        CASE 
          WHEN COUNT(eo.orchestra_id) > 0 THEN 
            JSON_ARRAYAGG(JSON_OBJECT('id', o.id, 'name', o.name))
          ELSE 
            JSON_ARRAY()
        END AS orchestras
      FROM events e
      LEFT JOIN event_orchestras eo ON e.id = eo.event_id
      LEFT JOIN orchestras o ON eo.orchestra_id = o.id
      WHERE e.id IN (
        SELECT event_id FROM event_orchestras WHERE orchestra_id IN (?)
      )
      GROUP BY e.id
      ORDER BY e.event_date DESC;
    `;

    const [events] = await pool.query(query, [orchestraIds]);
    
    res.json(events);

  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de vos événements.' });
  }
});

export default router;
