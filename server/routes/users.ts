import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

router.use(authenticateToken);

// Route sÃ©curisÃ©e pour rÃ©cupÃ©rer la liste de tous les utilisateurs avec leurs profils
router.get('/', async (req, res) => {
  // @ts-ignore
  const userRole = (req as any).user.role;

  if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('users'))) {
    return res.status(403).json({ message: 'AccÃ¨s refusÃ©.' });
  }

  try {
    const [users] = await pool.query(`
      SELECT u.id, u.email, p.first_name, p.last_name, p.role, p.managed_modules
      FROM users u
      JOIN profiles p ON u.id = p.id
      ORDER BY p.last_name, p.first_name
    `);

    // Parse managed_modules for each user
    const parsedUsers = (users as any[]).map((user: any) => {
        let parsedModules = [];
        if (user.managed_modules) {
             try {
                parsedModules = typeof user.managed_modules === 'string' ? JSON.parse(user.managed_modules) : user.managed_modules;
             } catch (e) {
                console.error("Failed to parse managed_modules for user " + user.id, e);
             }
        }
        return {
            ...user,
            managed_modules: parsedModules
        };
    });

    res.json(parsedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Erreur lors de la rÃ©cupÃ©ration des utilisateurs.' });
  }
});

// Route pour crÃ©er un nouvel utilisateur
router.post('/', async (req, res) => {
    // @ts-ignore
    const userRole = (req as any).user.role;
    if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('users'))) {
        return res.status(403).json({ message: 'AccÃ¨s refusÃ©.' });
    }

    const { email, password, firstName, lastName, role, instruments, orchestras, managedModules } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ message: 'Les informations utilisateur de base sont requises.' });
    }

    const modulesJson = (role === 'Gestionnaire' && managedModules) ? JSON.stringify(managedModules) : null;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Hasher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        
        // 2. CrÃ©er l'utilisateur
        const newUserId = crypto.randomUUID();
        await connection.query('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)', [
            newUserId,
            email,
            password_hash
        ]);

        // 3. CrÃ©er le profil
        await connection.query('INSERT INTO profiles (id, first_name, last_name, role, managed_modules) VALUES (?, ?, ?, ?, ?)', [
            newUserId,
            firstName,
            lastName,
            role,
            modulesJson
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
        res.status(201).json({ message: 'Utilisateur crÃ©Ã© avec succÃ¨s.' });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating user:', error);
        // @ts-ignore
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Cet email est dÃ©jÃ  utilisÃ©.' });
        }
        res.status(500).json({ message: 'Erreur lors de la crÃ©ation de l\'utilisateur.' });
    } finally {
        connection.release();
    }
});

router.put('/:id', async (req, res) => {
    // @ts-ignore
    const userRole = (req as any).user.role;
    if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('users'))) {
        return res.status(403).json({ message: 'AccÃ¨s refusÃ©.' });
    }

    const { id } = req.params;
    const { password, firstName, lastName, role, instruments, orchestras, managedModules } = req.body;

    if (!firstName || !lastName || !role) {
        return res.status(400).json({ message: 'Les informations de base (prÃ©nom, nom, rÃ´le) sont requises.' });
    }

    const modulesJson = (role === 'Gestionnaire' && managedModules) ? JSON.stringify(managedModules) : null;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Mettre Ã  jour le profil
        await connection.query('UPDATE profiles SET first_name = ?, last_name = ?, role = ?, managed_modules = ? WHERE id = ?', [
            firstName,
            lastName,
            role,
            modulesJson,
            id
        ]);

        // 2. Mettre Ã  jour le mot de passe si fourni
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
        res.status(200).json({ message: 'Utilisateur mis Ã  jour avec succÃ¨s.' });

    } catch (error) {
        await connection.rollback();
        console.error(`Error updating user with id ${id}:`, error);
        res.status(500).json({ message: 'Erreur lors de la mise Ã  jour de l\'utilisateur.' });
    } finally {
        connection.release();
    }
});

router.delete('/:id', async (req, res) => {
    // @ts-ignore
    const userRole = (req as any).user.role;
    if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('users'))) {
        return res.status(403).json({ message: 'AccÃ¨s refusÃ©.' });
    }

    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Ordre de suppression pour respecter les clÃ©s Ã©trangÃ¨res
        await connection.execute('DELETE FROM user_instruments WHERE user_id = ?', [id]);
        await connection.execute('DELETE FROM user_orchestras WHERE user_id = ?', [id]);
        // La suppression depuis 'profiles' est en cascade grÃ¢ce Ã  la contrainte FOREIGN KEY, mais on peut Ãªtre explicite
        await connection.execute('DELETE FROM profiles WHERE id = ?', [id]);
        // Finalement, supprimer l'utilisateur
        const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [id]);

        // @ts-ignore
        if (result.affectedRows === 0) {
            throw new Error('Utilisateur non trouvÃ©.');
        }

        await connection.commit();
        res.status(200).json({ message: 'Utilisateur supprimÃ© avec succÃ¨s.' });

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
