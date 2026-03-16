import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import crypto from 'crypto';

const router = Router();

router.use(authenticateToken);

// Route sÃ©curisÃ©e pour rÃ©cupÃ©rer la liste des partitions avec les donnÃ©es associÃ©es
router.get('/', async (req, res) => {
  // @ts-ignore
  const userRole = (req as any).user.role;

  if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('morceaux')) && userRole !== 'Gestionnaire') {
    return res.status(403).json({ message: 'AccÃ¨s refusÃ©.' });
  }

  try {
    // RequÃªte complexe pour joindre toutes les informations nÃ©cessaires et les formater comme l'attend le frontend
    const query = `
      SELECT 
        p.*,
        JSON_OBJECT(
          'id', m.id,
          'nom', m.nom,
          'compositeur', m.compositeur,
          'arrangement', m.arrangement,
          'orchestras', (
              SELECT JSON_ARRAYAGG(
                  JSON_OBJECT('id', o.id, 'name', o.name)
              )
              FROM morceau_orchestras mo
              JOIN orchestras o ON mo.orchestra_id = o.id
              WHERE mo.morceau_id = m.id
          )
        ) AS morceaux,
        JSON_OBJECT(
          'id', i.id,
          'name', i.name
        ) AS instruments
      FROM partitions p
      LEFT JOIN morceaux m ON p.morceau_id = m.id
      LEFT JOIN instruments i ON p.instrument_id = i.id
      ORDER BY m.nom, p.nom;
    `;

    const [partitions] = await pool.query(query);
    res.json(partitions);

  } catch (error) {
    console.error('Error fetching partitions:', error);
    res.status(500).json({ message: 'Erreur lors de la rÃ©cupÃ©ration des partitions.' });
  }
});

router.post('/', async (req, res) => {
    // @ts-ignore
    const userRole = (req as any).user.role;
    if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('morceaux')) && userRole !== 'Gestionnaire') {
        return res.status(403).json({ message: 'AccÃ¨s refusÃ©.' });
    }

    const { nom, morceau_id, instrument_id, file_path, file_name, file_type, file_size } = req.body;

    if (!nom || !morceau_id || !instrument_id) {
        return res.status(400).json({ message: 'Les champs nom, morceau et instrument sont requis.' });
    }

    try {
        const newPartition = {
            id: crypto.randomUUID(),
            nom,
            morceau_id,
            instrument_id,
            file_path: file_path || null,
            file_name: file_name || null,
            file_type: file_type || null,
            file_size: file_size || null,
            created_at: new Date(),
            updated_at: new Date(),
        };

        await pool.query(
            'INSERT INTO partitions (id, nom, morceau_id, instrument_id, file_path, file_name, file_type, file_size, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [newPartition.id, newPartition.nom, newPartition.morceau_id, newPartition.instrument_id, newPartition.file_path, newPartition.file_name, newPartition.file_type, newPartition.file_size, newPartition.created_at, newPartition.updated_at]
        );

        res.status(201).json({ message: 'Partition crÃ©Ã©e avec succÃ¨s', partition: newPartition });

    } catch (error) {
        console.error('Error creating partition:', error);
        res.status(500).json({ message: 'Erreur lors de la crÃ©ation de la partition.' });
    }
});

router.put('/:id', async (req, res) => {
    // @ts-ignore
    const userRole = (req as any).user.role;
    if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('morceaux')) && userRole !== 'Gestionnaire') {
        return res.status(403).json({ message: 'AccÃ¨s refusÃ©.' });
    }

    const { id } = req.params;
    const { nom, morceau_id, instrument_id, file_path, file_name, file_type, file_size } = req.body;

    if (!nom || !morceau_id || !instrument_id) {
        return res.status(400).json({ message: 'Les champs nom, morceau et instrument sont requis.' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE partitions SET nom = ?, morceau_id = ?, instrument_id = ?, file_path = ?, file_name = ?, file_type = ?, file_size = ?, updated_at = ? WHERE id = ?',
            [nom, morceau_id, instrument_id, file_path || null, file_name || null, file_type || null, file_size || null, new Date(), id]
        );

        // @ts-ignore
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Partition non trouvÃ©e.' });
        }

        res.status(200).json({ message: 'Partition mise Ã  jour avec succÃ¨s.' });

    } catch (error) {
        console.error(`Error updating partition with id ${id}:`, error);
        res.status(500).json({ message: 'Erreur lors de la mise Ã  jour de la partition.' });
    }
});

router.delete('/:id', async (req, res) => {
    // @ts-ignore
    const userRole = (req as any).user.role;
    if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('morceaux')) && userRole !== 'Gestionnaire') {
        return res.status(403).json({ message: 'AccÃ¨s refusÃ©.' });
    }

    const { id } = req.params;

    try {
        // TODO: GÃ©rer la suppression du fichier associÃ© dans le stockage
        const [result] = await pool.query('DELETE FROM partitions WHERE id = ?', [id]);

        // @ts-ignore
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Partition non trouvÃ©e.' });
        }

        res.status(200).json({ message: 'Partition supprimÃ©e avec succÃ¨s.' });

    } catch (error) {
        console.error(`Error deleting partition with id ${id}:`, error);
        res.status(500).json({ message: 'Erreur lors de la suppression de la partition.' });
    }
});

export default router;
