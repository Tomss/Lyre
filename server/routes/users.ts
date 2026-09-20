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
             u.status as user_status,
             u.last_login,
             p.first_name, p.last_name, p.status as profile_status
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      JOIN profiles p ON up.profile_id = p.id
      ORDER BY up.is_primary DESC, up.created_at ASC
    `);

    const linksByProfile = new Map<string, any[]>();
    for (const link of allLinks) {
      if (!linksByProfile.has(link.profile_id)) {
        linksByProfile.set(link.profile_id, []);
      }
      // Trouver les autres profils utilisant le même user_id / email
      const otherNames = allLinks
        .filter((l: any) => l.user_id === link.user_id && l.profile_id !== link.profile_id)
        .map((l: any) => `${l.first_name} ${l.last_name}`);
      const alsoUsedBy = Array.from(new Set(otherNames));

      // Statut de l'e-mail : basé sur la colonne status de users (avec fallback sur profil actif)
      const userLinks = allLinks.filter((l: any) => l.user_id === link.user_id);
      const hasActiveProfile = userLinks.some((l: any) => l.profile_status === 'Active');
      const hasInvitedProfile = userLinks.some((l: any) => l.profile_status === 'Invited');

      const isEmailActive = link.user_status 
        ? link.user_status === 'Active'
        : Boolean(link.has_password && hasActiveProfile);
      const isEmailInvited = link.user_status
        ? link.user_status === 'Invited'
        : (!isEmailActive && !link.has_password && Boolean(link.is_invited || hasInvitedProfile));

      linksByProfile.get(link.profile_id)!.push({
        userId: link.user_id,
        email: link.email,
        isPrimary: Boolean(link.is_primary),
        hasPassword: Boolean(link.has_password),
        isActive: isEmailActive,
        isInvited: isEmailInvited,
        lastLogin: link.last_login,
        alsoUsedBy: alsoUsedBy.length > 0 ? alsoUsedBy : undefined
      });
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
        isActive: Boolean(p.has_password && p.status === 'Active'),
        isInvited: Boolean(!p.has_password && (p.is_invited || p.status === 'Invited')),
        lastLogin: p.last_login
      }] : []);

      // Si un profil n'a aucune adresse active et n'est pas Admin, son statut effectif est Inactif
      const hasAnyActiveEmail = emails.some((e: any) => e.isActive);
      const effectiveStatus = (p.role !== 'Admin' && emails.length > 0 && !hasAnyActiveEmail && p.status === 'Active')
        ? 'Inactive'
        : p.status;

      return {
        ...p,
        status: effectiveStatus,
        has_password: Boolean(p.has_password),
        managed_modules: parsedModules,
        emails
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

// Route pour créer un nouvel utilisateur
router.post('/', async (req, res) => {
  // @ts-ignore
  const userRole = (req as any).user.role;
  if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('users'))) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  const { email, password, firstName, lastName, role, instruments, orchestras, managedModules, secondaryEmails } = req.body;

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

    // Vérifier si un compte existe déjà avec cette adresse principale
    const [existingUser]: any = await connection.query('SELECT id, email, password_hash FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
    let effectiveUserId = '';

    if (existingUser.length > 0) {
      effectiveUserId = existingUser[0].id;
      if (password) {
        if (userRole !== 'Admin') {
          await connection.rollback();
          return res.status(403).json({ message: 'Seul un Administrateur peut définir manuellement un mot de passe.' });
        }
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
        const password_hash = await bcrypt.hash(password, salt);
        await connection.query('UPDATE users SET password_hash = ?, activation_token = NULL, token_expires_at = NULL WHERE id = ?', [password_hash, effectiveUserId]);
      }
    } else {
      let password_hash = null;
      if (password) {
        if (userRole !== 'Admin') {
          await connection.rollback();
          return res.status(403).json({ message: 'Seul un Administrateur peut définir manuellement un mot de passe.' });
        }
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

      effectiveUserId = crypto.randomUUID();
      await connection.query('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)', [
        effectiveUserId,
        normalizedEmail,
        password_hash
      ]);
    }

    const [pwdRow]: any = await connection.query('SELECT password_hash FROM users WHERE id = ?', [effectiveUserId]);
    const status = (pwdRow.length > 0 && pwdRow[0].password_hash) ? 'Active' : 'Inactive';

    await connection.query(
      'INSERT INTO profiles (id, first_name, last_name, role, managed_modules, status) VALUES (?, ?, ?, ?, ?, ?)',
      [newProfileId, firstName, lastName, role, modulesJson, status]
    );

    // Liaison primaire
    await connection.query(
      'INSERT INTO user_profiles (id, user_id, profile_id, is_primary) VALUES (?, ?, ?, 1)',
      [crypto.randomUUID(), effectiveUserId, newProfileId]
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
    res.status(201).json({ message: 'Profil créé avec succès.' });

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

// POST /api/users/:profileId/add-email - Associer une adresse email d'accès à un musicien
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
      message: `L'accès ${normalizedEmail} a été ajouté avec succès.`
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
      // Le compte n'est rattaché à plus aucun profil : suppression totale pour ne pas laisser de compte fantôme actif
      await connection.query('DELETE FROM users WHERE id = ?', [userId]);
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

// PUT /api/users/:profileId/emails/:userId/primary - Définir cette adresse e-mail comme principale
router.put('/:profileId/emails/:userId/primary', async (req, res) => {
  // @ts-ignore
  const userRole = (req as any).user.role;
  if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('users'))) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  const { profileId, userId } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Vérifier que ce lien existe bien
    const [links]: any = await connection.query(
      'SELECT id, is_primary FROM user_profiles WHERE profile_id = ? AND user_id = ?',
      [profileId, userId]
    );

    if (links.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Compte e-mail non associé à ce profil.' });
    }

    // 2. Récupérer l'adresse e-mail correspondante
    const [userRows]: any = await connection.query('SELECT email FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Compte e-mail introuvable.' });
    }
    const newPrimaryEmail = userRows[0].email;

    // 3. Passer tous les liens de ce profil à is_primary = 0
    await connection.query('UPDATE user_profiles SET is_primary = 0 WHERE profile_id = ?', [profileId]);

    // 4. Passer le lien sélectionné à is_primary = 1
    await connection.query('UPDATE user_profiles SET is_primary = 1 WHERE profile_id = ? AND user_id = ?', [profileId, userId]);

    // 5. Mettre à jour l'e-mail dans profiles
    await connection.query('UPDATE profiles SET email = ? WHERE id = ?', [newPrimaryEmail, profileId]);

    await connection.commit();
    res.json({ message: `${newPrimaryEmail} est désormais l'adresse e-mail principale.` });

  } catch (error) {
    await connection.rollback();
    console.error('Error setting primary email:', error);
    res.status(500).json({ message: 'Erreur lors du changement d\'adresse principale.' });
  } finally {
    connection.release();
  }
});

// PUT /api/users/emails/:userId/status - Activer ou désactiver directement une adresse e-mail
router.put('/emails/:userId/status', async (req, res) => {
  // @ts-ignore
  const userRole = (req as any).user.role;
  if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('users'))) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  const { userId } = req.params;
  const { status } = req.body; // 'Active' | 'Inactive'

  if (!status || !['Active', 'Inactive'].includes(status)) {
    return res.status(400).json({ message: 'Statut invalide.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [userRows]: any = await connection.query('SELECT id, email, password_hash FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Adresse e-mail introuvable.' });
    }
    const targetUser = userRows[0];

    if (status === 'Active' && !targetUser.password_hash) {
      await connection.rollback();
      return res.status(400).json({ message: "Impossible d'activer une adresse sans mot de passe. Envoyez d'abord une invitation." });
    }

    // 1. Mettre à jour le statut de l'adresse e-mail
    await connection.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);

    // 2. Trouver tous les profils associés à cette adresse
    const [linkedProfiles]: any = await connection.query(`
      SELECT p.id, p.role, p.status 
      FROM profiles p
      JOIN user_profiles up ON p.id = up.profile_id
      WHERE up.user_id = ?
    `, [userId]);

    if (status === 'Inactive') {
      // Pour chaque profil associé : s'il n'a PLUS AUCUNE adresse e-mail active, passer le profil en Inactive
      for (const prof of linkedProfiles) {
        if (prof.role === 'Admin') continue; // Les admins peuvent rester actifs
        const [activeCountRow]: any = await connection.query(`
          SELECT COUNT(*) as count
          FROM user_profiles up
          JOIN users u ON up.user_id = u.id
          WHERE up.profile_id = ? AND u.status = 'Active'
        `, [prof.id]);

        if (activeCountRow[0].count === 0) {
          await connection.query('UPDATE profiles SET status = ? WHERE id = ?', ['Inactive', prof.id]);
        }
      }
    } else {
      // status === 'Active' : passer en Active les profils associés qui étaient Inactifs
      for (const prof of linkedProfiles) {
        if (prof.status === 'Inactive') {
          await connection.query('UPDATE profiles SET status = ? WHERE id = ?', ['Active', prof.id]);
        }
      }
    }

    await connection.commit();
    res.status(200).json({ 
      message: `Adresse e-mail ${status === 'Active' ? 'activée' : 'désactivée'} avec succès.` 
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error toggling email status:', error);
    res.status(500).json({ message: "Erreur lors de la modification du statut de l'e-mail." });
  } finally {
    if (connection) connection.release();
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
    const currentEmail = primaryLink.length > 0 ? (primaryLink[0].email || '').toLowerCase() : '';
    let effectiveUserId = primaryUserId;

    if (normalizedEmail !== currentEmail) {
      // Vérifier si le compte actuel est partagé avec d'autres profils
      const [otherProfiles]: any = await connection.query(
        'SELECT profile_id FROM user_profiles WHERE user_id = ? AND profile_id != ?',
        [primaryUserId, id]
      );
      const isCurrentlyShared = otherProfiles.length > 0;

      // Vérifier si la nouvelle adresse appartient déjà à un compte existant
      const [existingUsers]: any = await connection.query(`
        SELECT id, email, password_hash FROM users WHERE LOWER(email) = ?
      `, [normalizedEmail]);

      if (existingUsers.length > 0 && existingUsers[0].id !== primaryUserId) {
        const targetUserId = existingUsers[0].id;

        // Retirer l'ancienne liaison primaire de ce profil
        await connection.query('DELETE FROM user_profiles WHERE user_id = ? AND profile_id = ?', [primaryUserId, id]);

        // Nettoyer l'ancien compte s'il n'est plus utilisé par aucun profil
        const [remainingLinks]: any = await connection.query('SELECT id FROM user_profiles WHERE user_id = ?', [primaryUserId]);
        if (remainingLinks.length === 0) {
          await connection.query('DELETE FROM users WHERE id = ?', [primaryUserId]);
        }

        // Rattacher ce profil au compte existant en tant que primaire
        const [alreadyLinked]: any = await connection.query(
          'SELECT id FROM user_profiles WHERE user_id = ? AND profile_id = ?',
          [targetUserId, id]
        );
        if (alreadyLinked.length > 0) {
          await connection.query('UPDATE user_profiles SET is_primary = 1 WHERE user_id = ? AND profile_id = ?', [targetUserId, id]);
        } else {
          await connection.query(
            'INSERT INTO user_profiles (id, user_id, profile_id, is_primary) VALUES (?, ?, ?, 1)',
            [crypto.randomUUID(), targetUserId, id]
          );
        }

        effectiveUserId = targetUserId;
      } else if (isCurrentlyShared) {
        // Le compte était partagé et la nouvelle adresse est nouvelle :
        // On dissocie ce profil pour lui créer son propre compte personnel indépendant
        const newUserId = crypto.randomUUID();
        const passwordHashToKeep = password ? null : (primaryLink[0]?.password_hash || null);

        await connection.query(
          'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
          [newUserId, normalizedEmail, passwordHashToKeep]
        );

        // Retirer l'ancienne liaison du compte partagé
        await connection.query('DELETE FROM user_profiles WHERE user_id = ? AND profile_id = ?', [primaryUserId, id]);

        // Lier au nouveau compte indépendant en tant que primaire
        await connection.query(
          'INSERT INTO user_profiles (id, user_id, profile_id, is_primary) VALUES (?, ?, ?, 1)',
          [crypto.randomUUID(), newUserId, id]
        );

        effectiveUserId = newUserId;
      } else if (primaryUserId) {
        // Le compte n'est pas partagé : renommage classique
        await connection.query('UPDATE users SET email = ? WHERE id = ?', [normalizedEmail, primaryUserId]);
      }
    }

    if (status === 'Active' && !password) {
      // Vérifier si au moins un des e-mails associés à ce profil possède un mot de passe
      const [pwdRows]: any = await connection.query(`
        SELECT COUNT(*) as count 
        FROM user_profiles up
        JOIN users u ON up.user_id = u.id
        WHERE up.profile_id = ? AND u.password_hash IS NOT NULL
      `, [id]);
      
      const hasAnyPassword = pwdRows.length > 0 && pwdRows[0].count > 0;
      if (!hasAnyPassword) {
        const [userRows]: any = await connection.query('SELECT password_hash FROM users WHERE id = ?', [effectiveUserId]);
        if (userRows.length === 0 || !userRows[0].password_hash) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ message: "Impossible de passer en 'Actif' un utilisateur qui n'a pas encore de mot de passe. L'utilisateur doit d'abord l'activer via son mail ou vous devez lui en définir un." });
        }
      }
    }

    const modulesJson = JSON.stringify(managedModules || []);
    await connection.query(
      'UPDATE profiles SET first_name = ?, last_name = ?, role = ?, managed_modules = ?, status = ? WHERE id = ?',
      [firstName, lastName, role, modulesJson, status || 'Inactive', id]
    );

    // Cascades lors du changement de statut d'un profil
    if (status === 'Inactive' && effectiveUserId) {
      // Désactiver le compte e-mail principal associé
      await connection.query('UPDATE users SET status = ? WHERE id = ?', ['Inactive', effectiveUserId]);

      // Vérifier les autres profils partageant cet e-mail : s'ils n'ont plus d'autre e-mail actif, les passer en Inactive
      const [sharedProfiles]: any = await connection.query(`
        SELECT p.id, p.role 
        FROM profiles p
        JOIN user_profiles up ON p.id = up.profile_id
        WHERE up.user_id = ? AND p.id != ?
      `, [effectiveUserId, id]);

      for (const sp of sharedProfiles) {
        if (sp.role === 'Admin') continue;
        const [actCount]: any = await connection.query(`
          SELECT COUNT(*) as count 
          FROM user_profiles up
          JOIN users u ON up.user_id = u.id
          WHERE up.profile_id = ? AND u.status = 'Active'
        `, [sp.id]);
        if (actCount[0].count === 0) {
          await connection.query('UPDATE profiles SET status = ? WHERE id = ?', ['Inactive', sp.id]);
        }
      }
    } else if (status === 'Active' && effectiveUserId) {
      await connection.query('UPDATE users SET status = ? WHERE id = ? AND password_hash IS NOT NULL', ['Active', effectiveUserId]);

      // Passer en Active les profils partageant cet e-mail qui étaient Inactifs
      await connection.query(`
        UPDATE profiles p
        JOIN user_profiles up ON p.id = up.profile_id
        SET p.status = 'Active'
        WHERE up.user_id = ? AND p.status = 'Inactive'
      `, [effectiveUserId]);
    }

    if (password) {
      if (userRole !== 'Admin') {
        await connection.rollback();
        return res.status(403).json({ message: 'Seul un Administrateur peut définir ou forcer directement un mot de passe.' });
      }

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
      const password_hash = await bcrypt.hash(password, salt);
      if (effectiveUserId) {
        await connection.query('UPDATE users SET password_hash = ?, activation_token = NULL, token_expires_at = NULL WHERE id = ?', [password_hash, effectiveUserId]);
        await connection.query(`
          UPDATE profiles p
          JOIN user_profiles up ON p.id = up.profile_id
          SET p.status = 'Active'
          WHERE up.user_id = ? AND p.status IN ('Inactive', 'Invited')
        `, [effectiveUserId]);
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

  } catch (error: any) {
    await connection.rollback();
    console.error(`Error updating user with id ${id}:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Cette adresse e-mail est déjà utilisée.' });
    }
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue.';
    res.status(500).json({ message: `Erreur lors de la mise à jour de l'utilisateur: ${errorMessage}` });
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
    const [directUsers]: any = await connection.query('SELECT id FROM users WHERE id = ?', [id]);
    for (const du of directUsers) {
      if (!linkedUserIds.includes(du.id)) linkedUserIds.push(du.id);
    }

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

// POST /api/users/:id/set-password - Définir/forcer manuellement un mot de passe (Admin uniquement)
router.post('/:id/set-password', async (req, res) => {
  // @ts-ignore
  const userRole = (req as any).user.role;
  if (userRole !== 'Admin') {
    return res.status(403).json({ message: 'Seul un Administrateur peut définir ou forcer un mot de passe.' });
  }

  const { id } = req.params; // profile_id
  const { userId: targetedUserId, password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Le mot de passe est requis.' });
  }

  const isMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password);

  if (!isMinLength || !hasUppercase || !hasLowercase || !hasDigit || !hasSpecialChar) {
    return res.status(400).json({ 
      message: 'Le mot de passe ne respecte pas les exigences de sécurité : au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.' 
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [profiles]: any = await connection.query('SELECT id, first_name, last_name, status FROM profiles WHERE id = ?', [id]);
    if (profiles.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Profil introuvable.' });
    }

    let targetUserId = targetedUserId;
    if (!targetUserId) {
      const [uRows]: any = await connection.query(`
        SELECT u.id, u.email 
        FROM user_profiles up
        JOIN users u ON up.user_id = u.id
        WHERE up.profile_id = ?
        ORDER BY up.is_primary DESC
        LIMIT 1
      `, [id]);
      if (uRows.length > 0) {
        targetUserId = uRows[0].id;
      }
    }

    if (!targetUserId) {
      await connection.rollback();
      return res.status(404).json({ message: 'Aucun compte email associé trouvé pour ce profil.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    await connection.query(`
      UPDATE users 
      SET password_hash = ?, activation_token = NULL, token_expires_at = NULL 
      WHERE id = ?
    `, [password_hash, targetUserId]);

    // Mettre à jour en 'Active' tous les profils rattachés à ce compte utilisateur
    await connection.query(`
      UPDATE profiles p
      JOIN user_profiles up ON p.id = up.profile_id
      SET p.status = 'Active'
      WHERE up.user_id = ? AND p.status IN ('Inactive', 'Invited')
    `, [targetUserId]);

    await connection.query('UPDATE profiles SET status = ? WHERE id = ?', ['Active', id]);

    await connection.commit();
    res.status(200).json({ message: 'Mot de passe défini avec succès. Le compte est immédiatement activé.' });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error setting password manually:', error);
    res.status(500).json({ message: 'Erreur lors de la définition du mot de passe.' });
  } finally {
    if (connection) connection.release();
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

    let userRows: any[] = [];
    if (targetedUserId) {
      const [uRows]: any = await connection.query('SELECT id, email, password_hash FROM users WHERE id = ?', [targetedUserId]);
      if (uRows.length > 0) userRows = uRows;
    } else {
      const [uRows]: any = await connection.query(`
        SELECT u.id, u.email, u.password_hash 
        FROM user_profiles up
        JOIN users u ON up.user_id = u.id
        WHERE up.profile_id = ?
        ORDER BY up.is_primary DESC, up.created_at ASC
      `, [id]);
      userRows = uRows;
    }

    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Aucun compte email associé trouvé pour ce profil.' });
    }

    const sentEmails: string[] = [];
    for (const userRow of userRows) {
      // Si aucun profil associé à cet e-mail n'est actif, envoyer une invitation d'activation et non un reset
      const [activeProfiles]: any = await connection.query(`
        SELECT p.id FROM profiles p
        JOIN user_profiles up ON p.id = up.profile_id
        WHERE up.user_id = ? AND p.status = 'Active'
      `, [userRow.id]);

      const isReset = Boolean(userRow.password_hash && activeProfiles.length > 0);
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      await connection.query('UPDATE users SET activation_token = ?, token_expires_at = ?, status = ? WHERE id = ?', [
        token,
        expiresAt,
        isReset ? (userRow.status || 'Active') : 'Invited',
        userRow.id
      ]);

      console.log(`[API] Envoi email invitation/reset à ${userRow.email} pour le profil ${profile.first_name} ${profile.last_name}`);
      const emailSent = await sendActivationEmail(userRow.email, profile.first_name, token, isReset, req);
      if (emailSent) {
        sentEmails.push(userRow.email);
      }
    }

    if (sentEmails.length === 0) {
      await connection.rollback();
      return res.status(500).json({ message: "Échec de l'envoi des e-mails via Resend." });
    }

    if (profile.status !== 'Active') {
      await connection.query('UPDATE profiles SET status = ? WHERE id = ?', ['Invited', id]);
    }

    await connection.commit();
    const successMsg = sentEmails.length > 1
      ? `Invitations envoyées avec succès (${sentEmails.length}) à : ${sentEmails.join(', ')}`
      : `Invitation envoyée avec succès sur ${sentEmails[0]}`;
    res.status(200).json({ message: successMsg });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error sending invite:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'invitation.' });
  } finally {
    if (connection) connection.release();
  }
});

export default router;
