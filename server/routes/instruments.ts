import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const router = Router();

router.use(authenticateToken);

// GET /api/instruments
router.get('/', async (req, res) => {
  // @ts-ignore
  if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('instruments'))) {
    return res.status(403).json({ message: 'Acces refuse.' });
  }
  try {
    const [instruments] = await pool.query('SELECT * FROM instruments ORDER BY name ASC');
    res.json(instruments);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la recuperation des instruments.' });
  }
});

// POST /api/instruments
router.post('/', async (req, res) => {
  // @ts-ignore
  if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('instruments'))) {
    return res.status(403).json({ message: 'Acces refuse.' });
  }
  const { name, teacher, description, photo_url } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Le nom de l instrument est requis." });
  }
  try {
    const newInstrument = {
      id: crypto.randomUUID(),
      name,
      teacher: teacher || null,
      description: description || null,
      photo_url: photo_url || null,
      created_at: new Date(),
    };
    await pool.query(
      'INSERT INTO instruments (id, name, teacher, description, photo_url, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [newInstrument.id, newInstrument.name, newInstrument.teacher, newInstrument.description, newInstrument.photo_url, newInstrument.created_at]
    );
    res.status(201).json({ message: 'Instrument cree avec succes', instrument: newInstrument });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la creation de l instrument.' });
  }
});

// PUT /api/instruments/:id
router.put('/:id', async (req, res) => {
  // @ts-ignore
  if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('instruments'))) {
    return res.status(403).json({ message: 'Acces refuse.' });
  }
  const { id } = req.params;
  const { name, teacher, description, photo_url } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Le nom de l instrument est requis." });
  }
  try {
    const [result] = await pool.query(
      'UPDATE instruments SET name = ?, teacher = ?, description = ?, photo_url = ? WHERE id = ?',
      [name, teacher || null, description || null, photo_url || null, id]
    );
    // @ts-ignore
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Instrument non trouve.' });
    }
    res.status(200).json({ message: 'Instrument mis a jour avec succes.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise a jour de l instrument.' });
  }
});

// DELETE /api/instruments/:id
router.delete('/:id', async (req, res) => {
  // @ts-ignore
  if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('instruments'))) {
    return res.status(403).json({ message: 'Acces refuse.' });
  }
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM partitions WHERE instrument_id = ?', [id]);
    await connection.execute('DELETE FROM user_instruments WHERE user_id = ?', [id]);
    const [result] = await connection.execute('DELETE FROM instruments WHERE id = ?', [id]);
    // @ts-ignore
    if (result.affectedRows === 0) {
      throw new Error('Instrument non trouve.');
    }
    await connection.commit();
    res.status(200).json({ message: 'Instrument supprime avec succes.' });
  } catch (error) {
    await connection.rollback();
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue.';
    res.status(500).json({ message: `Erreur lors de la suppression de l instrument: ${errorMessage}` });
  } finally {
    connection.release();
  }
});

export default router;
