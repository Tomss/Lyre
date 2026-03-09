import { Router } from 'express';
import pool from '../db';

const router = Router();

// Route publique pour récupérer la liste des orchestres
router.get('/', async (req, res) => {
  try {
    const [orchestras] = await pool.query(
      'SELECT * FROM orchestras ORDER BY display_order ASC, name ASC'
    );

    // Fetch photos for each orchestra
    const [photos] = await pool.query('SELECT * FROM orchestra_photos ORDER BY display_order ASC');

    const orchestrasWithPhotos = (orchestras as any[]).map(orch => {
      return {
        ...orch,
        photos: (photos as any[]).filter(p => p.orchestra_id === orch.id)
      };
    });

    res.json(orchestrasWithPhotos);
  } catch (error) {
    console.error('Error fetching orchestras:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des orchestres.' });
  }
});

export default router;
