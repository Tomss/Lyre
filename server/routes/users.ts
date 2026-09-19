import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendActivationEmail } from '../utils/email';

const router = Router();

router.use(authenticateToken);

// Route pour récupérer la liste de tous les musiciens avec leurs profils et comptes d'accès
router.get('/', async (req, res) => {
  // @ts-ignore
  const userRole = (req as any).user.role;

  if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('users'))) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  try {
    const [profiles]: any = await pool.query(`
      SELECT 
        p.id, p.first_name, p.last_name, p.role, p.managed_modules, p.status,
        COALESCE(
          (
            SELECT u.email 
            FROM user_profiles up 
            JOIN users u ON up.user_id = u.id 
            WHERE up.profile_id = p.id 
            ORDER BY up.is_primary DESC, up.created_at ASC 
            LIMIT 1
          ),
          (SELECT email FROM users WHERE id = p.id)
        ) as email,
        COALESCE(
          (
            SELECT u.id 
            FROM user_profiles up 
            JOIN users u ON up.user_id = u.id 
            WHERE up.profile_id = p.id 
            ORDER BY up.is_primary DESC, up.created_at ASC 
            LIMIT 1
          ),
          p.id
        ) as primary_user_id,
        (
          SELECT u.last_login 
          FROM user_profiles up 
          JOIN users u ON up.user_id = u.id 
          WHERE up.profile_id = p.id 
          ORDER BY up.is_primary DESC, up.created_at ASC 
          LIMIT 1
        ) as last_login,
        COALESCE(
          (
            SELECT (u.password_hash IS NOT NULL) 
            FROM user_profiles up 
            JOIN users u ON up.user_id = u.id 
            WHERE up.profile_id = p.id 
            ORDER BY up.is_primary DESC, up.created_at ASC 
            LIMIT 1
          ),
          0
        ) as has_password,
        COALESCE(
          (
            SELECT (u.activation_token IS NOT NULL) 
            FROM user_profiles up 
            JOIN users u ON up.user_id = u.id 
            WHERE up.profile_id = p.id 
            ORDER BY up.is_primary DESC, up.created_at ASC 
            LIMIT 1
          ),
          0
        ) as is_invited
      FROM profiles p
      ORDER BY p.last_name, p.first_name
    `);

    // Récupérer toutes les liaisons pour construire la liste complète des emails de chaque profil
    const [allLinks]: any = await pool.query(`
      SELECT up.profile_id, up.user_id, up.is_primary, u.email, 
             (u.password_hash IS NOT NULL) as has_password, 
             (u.activation_token IS NOT NULL) as is_invited, 
             u.last_login
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      ORDER BY up.is_primary DESC, up.created_at ASC
    `);

    // Récupérer les partages de compte (où un user_id a plusieurs profile_id)
    const [sharedLinks]: any = await pool.query(`
      SELECT up1.profile_id as my_profile_id, up2.profile_id as other_profile_id, 
             p2.first_name as other_first_name, p2.last_name as other_last_name, u.email
      FROM user_profiles up1
      JOIN user_profiles up2 ON up1.user_id = up2.user_id AND up1.profile_id != up2.profile_id
      JOIN profiles p2 ON up2.profile_id = p2.id
      JOIN users u ON up1.user_id = u.id
    `);

    const linksByProfile = new Map<string, any[]>();
    for (const link of allLinks) {
      if (!linksByProfile.has(link.profile_id)) {
        linksByProfile.set(link.profile_id, []);
      }
      linksByProfile.get(link.profile_id)!.push({
        userId: link.user_id,
        email: link.email,
        isPrimary: Boolean(link.is_primary),
        hasPassword: Boolean(link.has_password),
        isInvited: Boolean(link.is_invited),
        lastLogin: link.last_login
      });
    }

    const sharedByProfile = new Map<string, any[]>();
    for (const sh of sharedLinks) {
      if (!sharedByProfile.has(sh.my_profile_id)) {
        sharedByProfile.set(sh.my_profile_id, []);
      }
      const current = sharedByProfile.get(sh.my_profile_id)!;
      if (!current.some(c => c.profileId === sh.other_profile_id && c.email === sh.email)) {
        current.push({
          profileId: sh.other_profile_id,
          firstName: sh.other_first_name,
          lastName: sh.other_last_name,
          email: sh.email
        });
      }
    }

    const parsedUsers = profiles.map((p: any) => {
      let parsedModules = [];
      if (p.managed_modules) {
        try {
          parsedModules = typeof p.managed_modules === 'string' ? JSON.parse(p.managed_modules) : p.managed_modules;
        } catch (e) {
          console.error("Failed to parse managed_modules for user " + p.id, e);
        }
      }

      const emails = linksByProfile.get(p.id) || (p.email ? [{
        userId: p.primary_user_id || p.id,
        email: p.email,
        isPrimary: true,
        hasPassword: Boolean(p.has_password),
        isInvited: Boolean(p.is_invited),
        lastLogin: p.last_login
      }] : []);

      const sharedWith = sharedByProfile.get(p.id) || [];

      return {
        ...p,
        has_password: Boolean(p.has_password),
        managed_modules: parsedModules,
        emails,
        sharedWith
      };
    });

    res.json(parsedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs.' });
  }
});

// POST /api/users/check-email - Vérifier si un email existe déjà et quels profils lui sont liés
router.post('/check-email', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email requis.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const [rows]: any = await pool.query(`
      SELECT u.id as user_id, u.email, p.id as profile_id, p.first_name, p.last_name
      FROM users u
      JOIN user_profiles up ON u.id = up.user_id
      JOIN profiles p ON up.profile_id = p.id
      WHERE LOWER(u.email) = ?
    `, [normalizedEmail]);

    if (rows.length > 0) {
      return res.json({
        exists: true,
        userId: rows[0].user_id,
        email: rows[0].email,
        profiles: rows.map((r: any) => ({
          id: r.profile_id,
          firstName: r.first_name,
          lastName: r.last_name
        }))
      });
    }

    const [userOnly]: any = await pool.query('SELECT id, email FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
    if (userOnly.length > 0) {
      return res.json({
        exists: true,
        userId: userOnly[0].id,
        email: userOnly[0].email,
        profiles: []
      });
    }

    return res.json({ exists: false });
  } catch (err) {
    console.error('Error checking email:', err);
    res.status(500).json({ message: 'Erreur lors de la vérification de l\'email.' });
  }
});

// Route pour créer un nouvel utilisateur (ou rattacher à un compte existant)
router.post('/', async (req, res) => {
  // @ts-ignore
  const userRole = (req as any).user.role;
  if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('users'))) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  const { email, password, firstName, lastName, role, instruments, orchestras, managedModules, linkToExistingUserId, secondaryEmails } = req.body;

  if (!email || !firstName || !lastName || !role) {
    return res.status(400).json({ message: 'Les informations utilisateur de base sont requises.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const modulesJson = (role === 'Gestionnaire' && managedModules) ? JSON.stringify(managedModules) : null;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const newProfileId = crypto.randomUUID();

    const attachSecondaryEmails = async () => {
      if (Array.isArray(secondaryEmails) && secondaryEmails.length > 0) {
        for (const rawSec of secondaryEmails) {
          const sec = (typeof rawSec === 'string' ? rawSec : '').trim().toLowerCase();
          if (!sec || sec === normalizedEmail) continue;

          const [existingSec]: any = await connection.query('SELECT id FROM users WHERE LOWER(email) = ?', [sec]);
          let secUserId = '';
          if (existingSec.length > 0) {
            secUserId = existingSec[0].id;
          } else {
            secUserId = crypto.randomUUID();
            await connection.query('INSERT INTO users (id, email, password_hash) VALUES (?, ?, NULL)', [secUserId, sec]);
          }

          const [existingLink]: any = await connection.query(
            'SELECT id FROM user_profiles WHERE user_id = ? AND profile_id = ?',
            [secUserId, newProfileId]
          );
          if (existingLink.length === 0) {
            await connection.query(
              'INSERT INTO user_profiles (id, user_id, profile_id, is_primary) VALUES (?, ?, ?, 0)',
              [crypto.randomUUID(), secUserId, newProfileId]
            );
          }
        }
      }
    };

    // CAS 1 : Rattachement à un compte existant confirmé par l'administrateur
    if (linkToExistingUserId) {
      const [existingUser]: any = await connection.query('SELECT id, email, password_hash FROM users WHERE id = ?', [linkToExistingUserId]);
      if (existingUser.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Compte existant introuvable.' });
      }

      // Le compte a déjà un mot de passe -> le profil est actif
      const status = existingUser[0].password_hash ? 'Active' : 'Inactive';

      await connection.query(
        'INSERT INTO profiles (id, first_name, last_name, role, managed_modules, status) VALUES (?, ?, ?, ?, ?, ?)',
        [newProfileId, firstName, lastName, role, modulesJson, status]
      );

      // Créer la liaison user_profiles (is_primary = 0 pour le profil rattaché)
      await connection.query(
        'INSERT INTO user_profiles (id, user_id, profile_id, is_primary) VALUES (?, ?, ?, 0)',
        [crypto.randomUUID(), linkToExistingUserId, newProfileId]
      );

      // Attacher les adresses secondaires s'il y en a
      await attachSecondaryEmails();

      // Associer instruments et orchestres
      if (instruments && instruments.length > 0) {
        const instrumentValues = instruments.map((instId: string) => [crypto.randomUUID(), newProfileId, instId]);
        await connection.query('INSERT INTO user_instruments (id, user_id, instrument_id) VALUES ?', [instrumentValues]);
      }
      if (orchestras && orchestras.length > 0) {
        const orchestraValues = orchestras.map((orchId: string) => [crypto.randomUUID(), newProfileId, orchId]);
        await connection.query('INSERT INTO user_orchestras (id, user_id, orchestra_id) VALUES ?', [orchestraValues]);
      }

      await connection.commit();
      return res.status(201).json({ message: 'Profil créé et rattaché au compte existant avec succès.' });
    }

    // CAS 2 : Création standard d'un compte + profil
    // Vérifier si l'email existe déjà
    const [dupUser]: any = await connection.query(`
      SELECT u.id, p.first_name, p.last_name
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN profiles p ON up.profile_id = p.id
      WHERE LOWER(u.email) = ?
    `, [normalizedEmail]);

    if (dupUser.length > 0) {
      await connection.rollback();
      const existingNames = dupUser.filter((d: any) => d.first_name).map((d: any) => `${d.first_name} ${d.last_name}`).join(', ');
      return res.status(409).json({
        code: 'EMAIL_EXISTS',
        message: `Cette adresse email est déjà associée au compte de ${existingNames || 'un utilisateur'}.`,
        existingUserId: dupUser[0].id,
        existingUserName: existingNames || 'un utilisateur',
        existingProfiles: dupUser.filter((d: any) => d.first_name).map((d: any) => ({
          id: d.id,
          firstName: d.first_name,
          lastName: d.last_name
        }))
      });
    }

    // Hasher le mot de passe si fourni
    let password_hash = null;
    if (password) {
      const isMinLength = password.length >= 8;
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasDigit = /[0-9]/.test(password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password);

      if (!isMinLength || !hasUppercase || !hasLowercase || !hasDigit || !hasSpecialChar) {
        await connection.rollback();
        return res.status(400).json({ 
          message: 'Le mot de passe ne respecte pas les exigences de sécurité : au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.' 
        });
      }

      const salt = await bcrypt.genSalt(10);
      password_hash = await bcrypt.hash(password, salt);
    }

    const newUserId = crypto.randomUUID();
    await connection.query('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)', [
      newUserId,
      normalizedEmail,
      password_hash
    ]);

    const status = password_hash ? 'Active' : 'Inactive';
    await connection.query(
      'INSERT INTO profiles (id, first_name, last_name, role, managed_modules, status) VALUES (?, ?, ?, ?, ?, ?)',
      [newProfileId, firstName, lastName, role, modulesJson, status]
    );

    // Liaison primaire
    await connection.query(
      'INSERT INTO user_profiles (id, user_id, profile_id, is_primary) VALUES (?, ?, ?, 1)',
      [crypto.randomUUID(), newUserId, newProfileId]
    );

    // Attacher les adresses secondaires s'il y en a
    await attachSecondaryEmails();

    if (instruments && instruments.length > 0) {
      const instrumentValues = instruments.map((instId: string) => [crypto.randomUUID(), newProfileId, instId]);
      await connection.query('INSERT INTO user_instruments (id, user_id, instrument_id) VALUES ?', [instrumentValues]);
    }

    if (orchestras && orchestras.length > 0) {
      const orchestraValues = orchestras.map((orchId: string) => [crypto.randomUUID(), newProfileId, orchId]);
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

// POST /api/users/:profileId/add-email - Associer un second compte email à un musicien (aucun email automatique)
router.post('/:profileId/add-email', async (req, res) => {
  // @ts-ignore
  const userRole = (req as any).user.role;
  if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('users'))) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  const { profileId } = req.params;
  const { email } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ message: 'Adresse email requise.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [profiles]: any = await connection.query('SELECT id, first_name, last_name FROM profiles WHERE id = ?', [profileId]);
    if (profiles.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Profil musicien introuvable.' });
    }

    const [existingLink]: any = await connection.query(`
      SELECT up.id FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      WHERE up.profile_id = ? AND LOWER(u.email) = ?
    `, [profileId, normalizedEmail]);

    if (existingLink.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Cette adresse email est déjà associée à ce profil.' });
    }

    const [existingUsers]: any = await connection.query('SELECT id FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
    let targetUserId = '';

    if (existingUsers.length > 0) {
      targetUserId = existingUsers[0].id;
    } else {
      targetUserId = crypto.randomUUID();
      await connection.query('INSERT INTO users (id, email) VALUES (?, ?)', [targetUserId, normalizedEmail]);
    }

    await connection.query(
      'INSERT INTO user_profiles (id, user_id, profile_id, is_primary) VALUES (?, ?, ?, 0)',
      [crypto.randomUUID(), targetUserId, profileId]
    );

    await connection.commit();
    res.json({
      message: `L'accès ${normalizedEmail} a été ajouté avec succès. Vous pouvez lui envoyer son lien d'activation via le bouton dédié.`
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error adding email to profile:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'adresse email.' });
  } finally {
    connection.release();
  }
});

// DELETE /api/users/:profileId/emails/:userId - Retirer un accès email d'un profil
router.delete('/:profileId/emails/:userId', async (req, res) => {
  // @ts-ignore
  const userRole = (req as any).user.role;
  if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('users'))) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  const { profileId, userId } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [links]: any = await connection.query('SELECT id, user_id, is_primary FROM user_profiles WHERE profile_id = ?', [profileId]);
    if (links.length <= 1) {
      await connection.rollback();
      return res.status(400).json({ message: 'Impossible de retirer le seul compte d\'accès associé à ce musicien.' });
    }

    await connection.query('DELETE FROM user_profiles WHERE profile_id = ? AND user_id = ?', [profileId, userId]);

    const wasPrimary = links.find((l: any) => l.user_id === userId)?.is_primary;
    if (wasPrimary) {
      await connection.query(`
        UPDATE user_profiles 
        SET is_primary = 1 
        WHERE profile_id = ? 
        ORDER BY created_at ASC 
        LIMIT 1
      `, [profileId]);
    }

    const [remainingProfiles]: any = await connection.query('SELECT id FROM user_profiles WHERE user_id = ?', [userId]);
    if (remainingProfiles.length === 0) {
      const [userRow]: any = await connection.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
      if (userRow.length > 0 && !userRow[0].password_hash) {
        await connection.query('DELETE FROM users WHERE id = ?', [userId]);
      }
    }

    await connection.commit();
    res.json({ message: 'Accès email retiré avec succès.' });

  } catch (error) {
    await connection.rollback();
    console.error('Error removing email link:', error);
    res.status(500).json({ message: 'Erreur lors du retrait de l\'accès email.' });
  } finally {
    connection.release();
  }
});

// PUT /api/users/:id - Mettre à jour un musicien
router.put('/:id', async (req, res) => {
  // @ts-ignore
  const userRole = (req as any).user.role;
  if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('users'))) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  const { id } = req.params; // profile_id
  const { firstName, lastName, email, role, managedModules, instruments, orchestras, password, status } = req.body;

  if (!firstName || !lastName || !role || !email) {
    return res.status(400).json({ message: 'Les informations de base (prénom, nom, rôle, email) sont requises.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [primaryLink]: any = await connection.query(`
      SELECT up.user_id, u.email, u.password_hash 
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      WHERE up.profile_id = ?
      ORDER BY up.is_primary DESC
      LIMIT 1
    `, [id]);

    const primaryUserId = primaryLink.length > 0 ? primaryLink[0].user_id : id;

    if (status === 'Active' && !password) {
      const [userRows]: any = await connection.query('SELECT password_hash FROM users WHERE id = ?', [primaryUserId]);
      if (userRows.length > 0 && !userRows[0].password_hash) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ message: "Impossible de passer en 'Actif' un utilisateur qui n'a pas encore de mot de passe. L'utilisateur doit d'abord l'activer via son mail ou vous devez lui en définir un." });
      }
    }

    if (primaryUserId) {
      await connection.query('UPDATE users SET email = ? WHERE id = ?', [normalizedEmail, primaryUserId]);
    }

    const modulesJson = JSON.stringify(managedModules || []);
    await connection.query(
      'UPDATE profiles SET first_name = ?, last_name = ?, role = ?, managed_modules = ?, status = ? WHERE id = ?',
      [firstName, lastName, role, modulesJson, status || 'Inactive', id]
    );

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      if (primaryUserId) {
        await connection.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, primaryUserId]);
      }
      await connection.query('UPDATE profiles SET status = ? WHERE id = ?', ['Active', id]);
    }

    await connection.query('DELETE FROM user_instruments WHERE user_id = ?', [id]);
    if (instruments && instruments.length > 0) {
      const instrumentValues = instruments.map((instId: string) => [crypto.randomUUID(), id, instId]);
      await connection.query('INSERT INTO user_instruments (id, user_id, instrument_id) VALUES ?', [instrumentValues]);
    }

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

// DELETE /api/users/:id - Supprimer un profil musicien
router.delete('/:id', async (req, res) => {
  // @ts-ignore
  const userRole = (req as any).user.role;
  if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('users'))) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  const { id } = req.params; // profile_id

  const currentUserId = (req as any).user.id;
  if (id === currentUserId) {
    return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [links]: any = await connection.query('SELECT user_id FROM user_profiles WHERE profile_id = ?', [id]);
    const linkedUserIds = links.map((l: any) => l.user_id);

    await connection.execute('DELETE FROM user_instruments WHERE user_id = ?', [id]);
    await connection.execute('DELETE FROM user_orchestras WHERE user_id = ?', [id]);
    await connection.execute('DELETE FROM event_attendances WHERE user_id = ?', [id]);
    await connection.execute('DELETE FROM user_profiles WHERE profile_id = ?', [id]);
    await connection.execute('DELETE FROM profiles WHERE id = ?', [id]);

    for (const uid of linkedUserIds) {
      const [remaining]: any = await connection.query('SELECT id FROM user_profiles WHERE user_id = ?', [uid]);
      if (remaining.length === 0) {
        await connection.execute('DELETE FROM users WHERE id = ?', [uid]);
      }
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

// POST /api/users/:id/invite - Générer un token et envoyer l'e-mail d'invitation (manuel)
router.post('/:id/invite', async (req, res) => {
  // @ts-ignore
  const userRole = (req as any).user.role;
  if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('users'))) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  const { id } = req.params; // profile_id
  const { userId: targetedUserId } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [profiles]: any = await connection.query('SELECT id, first_name, last_name, status FROM profiles WHERE id = ?', [id]);
    if (profiles.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Profil introuvable.' });
    }
    const profile = profiles[0];

    let userRow: any = null;
    if (targetedUserId) {
      const [uRows]: any = await connection.query('SELECT id, email, password_hash FROM users WHERE id = ?', [targetedUserId]);
      if (uRows.length > 0) userRow = uRows[0];
    } else {
      const [uRows]: any = await connection.query(`
        SELECT u.id, u.email, u.password_hash 
        FROM user_profiles up
        JOIN users u ON up.user_id = u.id
        WHERE up.profile_id = ?
        ORDER BY up.is_primary DESC
        LIMIT 1
      `, [id]);
      if (uRows.length > 0) userRow = uRows[0];
    }

    if (!userRow) {
      await connection.rollback();
      return res.status(404).json({ message: 'Aucun compte email associé trouvé pour ce profil.' });
    }

    const isReset = Boolean(userRow.password_hash);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    await connection.query('UPDATE users SET activation_token = ?, token_expires_at = ? WHERE id = ?', [
      token,
      expiresAt,
      userRow.id
    ]);

    console.log(`[API] Envoi email invitation/reset à ${userRow.email} pour le profil ${profile.first_name} ${profile.last_name}`);
    const emailSent = await sendActivationEmail(userRow.email, profile.first_name, token, isReset, req);

    if (!emailSent) {
      await connection.rollback();
      return res.status(500).json({ message: "Échec de l'envoi de l'email via Resend." });
    }

    if (!isReset && profile.status !== 'Active') {
      await connection.query('UPDATE profiles SET status = ? WHERE id = ?', ['Invited', id]);
    }

    await connection.commit();
    const successMsg = isReset ? 'Lien de réinitialisation envoyé avec succès' : 'Invitation envoyée avec succès';
    res.status(200).json({ message: `${successMsg} sur ${userRow.email}` });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error sending invite:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'invitation.' });
  } finally {
    if (connection) connection.release();
  }
});

export default router;
