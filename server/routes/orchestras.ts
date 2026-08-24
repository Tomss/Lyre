import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import crypto from 'crypto';

const router = Router();

router.use(authenticateToken);

// GET /api/orchestras
router.get('/', async (req, res) => {
  // @ts-ignore
  const userRole = (req as any).user.role;
  if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('orchestras')) && userRole !== 'Gestionnaire') {
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
  if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('orchestras'))) {
    return res.status(403).json({ message: 'Acces refuse.' });
  }
  const { name, description, photo_url, photos } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Le nom de l orchestre est requis." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const newOrchestraId = crypto.randomUUID();
    const mainPhotoUrl = photo_url || (photos && photos.length > 0 ? (photos[0].url || photos[0].photo_url) : null);

    await connection.query(
      'INSERT INTO orchestras (id, name, description, photo_url, created_at) VALUES (?, ?, ?, ?, ?)',
      [newOrchestraId, name, description || null, mainPhotoUrl, new Date()]
    );

    if (photos && Array.isArray(photos)) {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const pUrl = photo.url || photo.photo_url;
        if (pUrl) {
          await connection.query(
            'INSERT INTO orchestra_photos (id, orchestra_id, photo_url, display_order) VALUES (UUID(), ?, ?, ?)',
            [newOrchestraId, pUrl, i]
          );
        }
      }
    }

    await connection.commit();
    res.status(201).json({ 
      message: 'Orchestre cree avec succes', 
      orchestra: { id: newOrchestraId, name, description, photo_url: mainPhotoUrl } 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating orchestra:', error);
    res.status(500).json({ message: 'Erreur lors de la creation de l orchestre.' });
  } finally {
    connection.release();
  }
});

// PUT /api/orchestras/reorder
router.put('/reorder', async (req, res) => {
  // @ts-ignore
  if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('orchestras'))) {
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
  if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('orchestras'))) {
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

    const mainPhotoUrl = photo_url || (photos && photos.length > 0 ? (photos[0].url || photos[0].photo_url) : null);

    // Update basic info
    await connection.query(
      'UPDATE orchestras SET name = ?, description = ?, photo_url = ? WHERE id = ?',
      [name, description || null, mainPhotoUrl, id]
    );

    // Handle photos atomically: remove all previous photos and insert updated list
    await connection.query('DELETE FROM orchestra_photos WHERE orchestra_id = ?', [id]);

    if (photos && Array.isArray(photos)) {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const pUrl = photo.url || photo.photo_url;
        if (pUrl) {
          await connection.query(
            'INSERT INTO orchestra_photos (id, orchestra_id, photo_url, display_order) VALUES (UUID(), ?, ?, ?)',
            [id, pUrl, i]
          );
        }
      }
    }

    await connection.commit();
    res.status(200).json({ message: 'Orchestre mis a jour avec succes.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating orchestra:', error);
    res.status(500).json({ message: 'Erreur lors de la mise a jour de l orchestre.' });
  } finally {
    connection.release();
  }
});

// DELETE /api/orchestras/:id
router.delete('/:id', async (req, res) => {
  // @ts-ignore
  if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('orchestras'))) {
    return res.status(403).json({ message: 'Acces refuse.' });
  }
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM orchestra_photos WHERE orchestra_id = ?', [id]);
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
