import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import crypto from 'crypto';

const router = Router();

router.use(authenticateToken);

// GET /api/morceaux - Récupérer tous les morceaux avec leurs orchestres
router.get('/', async (req, res) => {
  // @ts-ignore
  if (!['Admin', 'Gestionnaire'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }
  try {
    const [morceaux] = await pool.query(`
      SELECT 
        m.*, 
        JSON_ARRAYAGG(JSON_OBJECT('id', o.id, 'name', o.name))
        AS orchestras
      FROM morceaux m
      LEFT JOIN morceau_orchestras mo ON m.id = mo.morceau_id
      LEFT JOIN orchestras o ON mo.orchestra_id = o.id
      GROUP BY m.id
      ORDER BY m.nom ASC
    `);
    res.json(morceaux);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/morceaux - Créer un nouveau morceau
router.post('/', async (req, res) => {
  // @ts-ignore
  if (!['Admin', 'Gestionnaire'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }
  const { nom, compositeur, arrangement, orchestra_ids } = req.body;
  if (!nom || !orchestra_ids || orchestra_ids.length === 0) {
    return res.status(400).json({ message: 'Nom et au moins un orchestre sont requis.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const newMorceauId = crypto.randomUUID();
    await connection.query(
      'INSERT INTO morceaux (id, nom, compositeur, arrangement) VALUES (?, ?, ?, ?)',
      [newMorceauId, nom, compositeur, arrangement]
    );
    for (const orchestra_id of orchestra_ids) {
      await connection.query(
        'INSERT INTO morceau_orchestras (morceau_id, orchestra_id) VALUES (?, ?)',
        [newMorceauId, orchestra_id]
      );
    }
    await connection.commit();
    res.status(201).json({ message: 'Morceau créé avec succès.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création du morceau.' });
  } finally {
    connection.release();
  }
});

// PUT /api/morceaux/:id - Mettre à jour un morceau
router.put('/:id', async (req, res) => {
  // @ts-ignore
  if (!['Admin', 'Gestionnaire'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }
  const { id } = req.params;
  const { nom, compositeur, arrangement, orchestra_ids } = req.body;
  if (!nom || !orchestra_ids || orchestra_ids.length === 0) {
    return res.status(400).json({ message: 'Nom et au moins un orchestre sont requis.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      'UPDATE morceaux SET nom = ?, compositeur = ?, arrangement = ? WHERE id = ?',
      [nom, compositeur, arrangement, id]
    );
    await connection.query('DELETE FROM morceau_orchestras WHERE morceau_id = ?', [id]);
    for (const orchestra_id of orchestra_ids) {
      await connection.query(
        'INSERT INTO morceau_orchestras (morceau_id, orchestra_id) VALUES (?, ?)',
        [id, orchestra_id]
      );
    }
    await connection.commit();
    res.status(200).json({ message: 'Morceau mis à jour avec succès.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du morceau.' });
  } finally {
    connection.release();
  }
});

// DELETE /api/morceaux/:id - Supprimer un morceau
router.delete('/:id', async (req, res) => {
  // @ts-ignore
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Accès refusé.' });
  }
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Supprimer les partitions associées (si la logique métier le demande)
    // await connection.query('DELETE FROM partitions WHERE morceau_id = ?', [id]);
    await connection.query('DELETE FROM morceau_orchestras WHERE morceau_id = ?', [id]);
    const [result] = await connection.query('DELETE FROM morceaux WHERE id = ?', [id]);
    // @ts-ignore
    if (result.affectedRows === 0) {
      throw new Error('Morceau non trouvé.');
    }
    await connection.commit();
    res.status(200).json({ message: 'Morceau supprimé avec succès.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la suppression du morceau.' });
  } finally {
    connection.release();
  }
});

export default router;
