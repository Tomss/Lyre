import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

router.use(authenticateToken);

// Route sécurisée pour récupérer la liste de tous les utilisateurs avec leurs profils
router.get('/', async (req, res) => {
  // @ts-ignore
  const userRole = req.user.role;

  if (userRole !== 'Admin') {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  try {
    const [users] = await pool.query(`
      SELECT u.id, u.email, p.first_name, p.last_name, p.role
      FROM users u
      JOIN profiles p ON u.id = p.id
      ORDER BY p.last_name, p.first_name
    `);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs.' });
  }
});

// Route pour créer un nouvel utilisateur
router.post('/', async (req, res) => {
    // @ts-ignore
    const userRole = req.user.role;
    if (userRole !== 'Admin') {
        return res.status(403).json({ message: 'Accès refusé.' });
    }

    const { email, password, firstName, lastName, role, instruments, orchestras } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ message: 'Les informations utilisateur de base sont requises.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Hasher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        
        // 2. Créer l'utilisateur
        const newUserId = crypto.randomUUID();
        await connection.query('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)', [
            newUserId,
            email,
            password_hash
        ]);

        // 3. Créer le profil
        await connection.query('INSERT INTO profiles (id, first_name, last_name, role) VALUES (?, ?, ?, ?)', [
            newUserId,
            firstName,
            lastName,
            role
        ]);

        // 4. Associer les instruments
        if (instruments && instruments.length > 0) {
            const instrumentValues = instruments.map((instId: string) => [crypto.randomUUID(), newUserId, instId]);
            await connection.query('INSERT INTO user_instruments (id, user_id, instrument_id) VALUES ?', [instrumentValues]);
        }

        // 5. Associer les orchestres
        if (orchestras && orchestras.length > 0) {
            const orchestraValues = orchestras.map((orchId: string) => [crypto.randomUUID(), newUserId, orchId]);
            await connection.query('INSERT INTO user_orchestras (id, user_id, orchestra_id) VALUES ?', [orchestraValues]);
        }

        await connection.commit();
        res.status(201).json({ message: 'Utilisateur créé avec succès.' });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating user:', error);
        // @ts-ignore
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
        }
        res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur.' });
    } finally {
        connection.release();
    }
});

router.put('/:id', async (req, res) => {
    // @ts-ignore
    const userRole = req.user.role;
    if (userRole !== 'Admin') {
        return res.status(403).json({ message: 'Accès refusé.' });
    }

    const { id } = req.params;
    const { password, firstName, lastName, role, instruments, orchestras } = req.body;

    if (!firstName || !lastName || !role) {
        return res.status(400).json({ message: 'Les informations de base (prénom, nom, rôle) sont requises.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Mettre à jour le profil
        await connection.query('UPDATE profiles SET first_name = ?, last_name = ?, role = ? WHERE id = ?', [
            firstName,
            lastName,
            role,
            id
        ]);

        // 2. Mettre à jour le mot de passe si fourni
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            await connection.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, id]);
        }

        // 3. Synchroniser les instruments (Delete then Insert)
        await connection.query('DELETE FROM user_instruments WHERE user_id = ?', [id]);
        if (instruments && instruments.length > 0) {
            const instrumentValues = instruments.map((instId: string) => [crypto.randomUUID(), id, instId]);
            await connection.query('INSERT INTO user_instruments (id, user_id, instrument_id) VALUES ?', [instrumentValues]);
        }

        // 4. Synchroniser les orchestres (Delete then Insert)
        await connection.query('DELETE FROM user_orchestras WHERE user_id = ?', [id]);
        if (orchestras && orchestras.length > 0) {
            const orchestraValues = orchestras.map((orchId: string) => [crypto.randomUUID(), id, orchId]);
            await connection.query('INSERT INTO user_orchestras (id, user_id, orchestra_id) VALUES ?', [orchestraValues]);
        }

        await connection.commit();
        res.status(200).json({ message: 'Utilisateur mis à jour avec succès.' });

    } catch (error) {
        await connection.rollback();
        console.error(`Error updating user with id ${id}:`, error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur.' });
    } finally {
        connection.release();
    }
});

router.delete('/:id', async (req, res) => {
    // @ts-ignore
    const userRole = req.user.role;
    if (userRole !== 'Admin') {
        return res.status(403).json({ message: 'Accès refusé.' });
    }

    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Ordre de suppression pour respecter les clés étrangères
        await connection.execute('DELETE FROM user_instruments WHERE user_id = ?', [id]);
        await connection.execute('DELETE FROM user_orchestras WHERE user_id = ?', [id]);
        // La suppression depuis 'profiles' est en cascade grâce à la contrainte FOREIGN KEY, mais on peut être explicite
        await connection.execute('DELETE FROM profiles WHERE id = ?', [id]);
        // Finalement, supprimer l'utilisateur
        const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [id]);

        // @ts-ignore
        if (result.affectedRows === 0) {
            throw new Error('Utilisateur non trouvé.');
        }

        await connection.commit();
        res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });

    } catch (error) {
        await connection.rollback();
        console.error(`Error deleting user with id ${id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue.';
        res.status(500).json({ message: `Erreur lors de la suppression de l\'utilisateur: ${errorMessage}` });
    } finally {
        connection.release();
    }
});

export default router;
