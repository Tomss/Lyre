import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';

const router = Router();

router.use(authenticateToken);

// Route sécurisée pour récupérer toutes les associations utilisateurs-instruments et utilisateurs-orchestres
router.get('/', async (req, res) => {
  // @ts-ignore
  const userRole = req.user.role;

  if (userRole !== 'Admin') {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  try {
    const [userInstruments] = await pool.query(`
      SELECT ui.user_id, i.id, i.name 
      FROM user_instruments ui 
      JOIN instruments i ON ui.instrument_id = i.id
    `);

    const [userOrchestras] = await pool.query(`
      SELECT uo.user_id, o.id, o.name 
      FROM user_orchestras uo 
      JOIN orchestras o ON uo.orchestra_id = o.id
    `);

    res.json({ userInstruments, userOrchestras });
    
  } catch (error) {
    console.error('Error fetching user associations:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des associations.' });
  }
});

export default router;
