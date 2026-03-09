import { Router } from 'express';
import pool from '../db';

const router = Router();

// Route publique pour récupérer la liste des instruments
router.get('/', async (req, res) => {
  try {
    const [instruments] = await pool.query(
      'SELECT * FROM instruments ORDER BY name ASC'
    );
    res.json(instruments);
  } catch (error) {
    console.error('Error fetching instruments:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des instruments.' });
  }
});

export default router;
