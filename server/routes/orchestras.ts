import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import crypto from 'crypto';

const router = Router();

router.use(authenticateToken);

// GET /api/orchestras
router.get('/', async (req, res) => {
  // @ts-ignore
  const userRole = req.user.role;
  if (userRole !== 'Admin' && userRole !== 'Gestionnaire') {
    return res.status(403).json({ message: 'Acces refuse.' });
  }
  try {
    const [orchestras] = await pool.query('SELECT * FROM orchestras ORDER BY display_order ASC, name ASC');

    const [photos] = await pool.query('SELECT * FROM orchestra_photos ORDER BY display_order ASC');

    const orchestrasWithPhotos = (orchestras as any[]).map(orch => {
      return {
        ...orch,
        photos: (photos as any[]).filter(p => p.orchestra_id === orch.id)
      };
    });

    res.json(orchestrasWithPhotos);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la recuperation des orchestres.' });
  }
});

// POST /api/orchestras
router.post('/', async (req, res) => {
  // @ts-ignore
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Acces refuse.' });
  }
  const { name, description, photo_url } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Le nom de l orchestre est requis." });
  }
  try {
    const newOrchestra = {
      id: crypto.randomUUID(),
      name,
      description: description || null,
      photo_url: photo_url || null,
      created_at: new Date(),
    };
    await pool.query(
      'INSERT INTO orchestras (id, name, description, photo_url, created_at) VALUES (?, ?, ?, ?, ?)',
      [newOrchestra.id, newOrchestra.name, newOrchestra.description, newOrchestra.photo_url, newOrchestra.created_at]
    );
    res.status(201).json({ message: 'Orchestre cree avec succes', orchestra: newOrchestra });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la creation de l orchestre.' });
  }
});

// PUT /api/orchestras/reorder
router.put('/reorder', async (req, res) => {
  // @ts-ignore
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Acces refuse.' });
  }
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ message: 'Format invalide.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (let i = 0; i < orderedIds.length; i++) {
      await connection.query('UPDATE orchestras SET display_order = ? WHERE id = ?', [i, orderedIds[i]]);
    }
    await connection.commit();
    res.json({ message: 'Ordre mis a jour.' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Erreur lors de la mise a jour de l ordre.' });
  } finally {
    connection.release();
  }
});

// PUT /api/orchestras/:id
router.put('/:id', async (req, res) => {
  // @ts-ignore
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Acces refuse.' });
  }
  const { id } = req.params;
  const { name, description, photo_url, photos } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Le nom de l orchestre est requis." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Update basic info
    await connection.query(
      'UPDATE orchestras SET name = ?, description = ?, photo_url = ? WHERE id = ?',
      [name, description || null, photo_url || null, id]
    );

    // Handle photos if provided
    if (photos && Array.isArray(photos)) {
      // Get existing photos
      const [existingRows] = await connection.query('SELECT id FROM orchestra_photos WHERE orchestra_id = ?', [id]);
      const existingIds = (existingRows as any[]).map(r => r.id);

      const incomingIds = photos.filter((p: any) => p.id).map((p: any) => p.id);

      // Delete removed photos
      const toDelete = existingIds.filter(eid => !incomingIds.includes(eid));
      if (toDelete.length > 0) {
        await connection.query('DELETE FROM orchestra_photos WHERE id IN (?)', [toDelete]);
      }

      // Insert new photos or update order
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo.id && existingIds.includes(photo.id)) {
          // Update order of existing
          await connection.query('UPDATE orchestra_photos SET display_order = ? WHERE id = ?', [i, photo.id]);
        } else {
          // Insert new
          await connection.query(
            'INSERT INTO orchestra_photos (id, orchestra_id, photo_url, display_order) VALUES (UUID(), ?, ?, ?)',
            [id, photo.url || photo.photo_url, i]
          );
        }
      }
    }

    await connection.commit();
    res.status(200).json({ message: 'Orchestre mis a jour avec succes.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise a jour de l orchestre.' });
  } finally {
    connection.release();
  }
});

// DELETE /api/orchestras/:id
router.delete('/:id', async (req, res) => {
  // @ts-ignore
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Acces refuse.' });
  }
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM event_orchestras WHERE orchestra_id = ?', [id]);
    await connection.execute('DELETE FROM morceau_orchestras WHERE orchestra_id = ?', [id]);
    await connection.execute('DELETE FROM user_orchestras WHERE orchestra_id = ?', [id]);
    const [result] = await connection.execute('DELETE FROM orchestras WHERE id = ?', [id]);
    // @ts-ignore
    if (result.affectedRows === 0) {
      throw new Error('Orchestre non trouve.');
    }
    await connection.commit();
    res.status(200).json({ message: 'Orchestre supprime avec succes.' });
  } catch (error) {
    await connection.rollback();
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue.';
    res.status(500).json({ message: `Erreur lors de la suppression de l orchestre: ${errorMessage}` });
  } finally {
    connection.release();
  }
});

export default router;