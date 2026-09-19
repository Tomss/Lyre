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

    // Récupérer les délégations d'accès unidirectionnelles
    let delegationRows: any[] = [];
    try {
      const [rows]: any = await pool.query(`
        SELECT pd.parent_profile_id, pd.child_profile_id, 
               cp.first_name as child_first_name, cp.last_name as child_last_name, cp.role as child_role
        FROM profile_delegations pd
        JOIN profiles cp ON pd.child_profile_id = cp.id
        ORDER BY cp.last_name ASC, cp.first_name ASC
      `);
      delegationRows = rows;
    } catch (delErr: any) {
      console.warn('[Users Warning] Erreur récupération délégations (table en cours de migration):', delErr.message);
    }

    const delegationsByParent = new Map<string, any[]>();
    for (const d of delegationRows) {
      if (!delegationsByParent.has(d.parent_profile_id)) {
        delegationsByParent.set(d.parent_profile_id, []);
      }
      delegationsByParent.get(d.parent_profile_id)!.push({
        id: d.child_profile_id,
        firstName: d.child_first_name,
        lastName: d.child_last_name,
        role: d.child_role
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
        isInvited: Boolean(p.is_invited),
        lastLogin: p.last_login
      }] : []);

      const sharedWith = sharedByProfile.get(p.id) || [];
      const delegatedProfiles = delegationsByParent.get(p.id) || [];

      return {
        ...p,
        has_password: Boolean(p.has_password),
        managed_modules: parsedModules,
        emails,
        sharedWith,
        delegatedProfiles
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

  const { email, password, firstName, lastName, role, instruments, orchestras, managedModules, linkToExistingUserId, secondaryEmails, delegatedProfileIds } = req.body;

  if (!email || !firstName || !lastName || !role) {
    return res.status(400).json({ message: 'Les informations utilisateur de base sont requises.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const modulesJson = (role === 'Gestionnaire' && managedModules) ? JSON.stringify(managedModules) : null;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const newProfileId = crypto.randomUUID();

    const attachDelegatedProfiles = async () => {
      if (Array.isArray(delegatedProfileIds) && delegatedProfileIds.length > 0) {
        for (const childId of delegatedProfileIds) {
          if (childId && childId !== newProfileId) {
            await connection.query(
              'INSERT IGNORE INTO profile_delegations (id, parent_profile_id, child_profile_id) VALUES (?, ?, ?)',
              [crypto.randomUUID(), newProfileId, childId]
            );
          }
        }
      }
    };

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

      // Attacher les délégations d'accès
      await attachDelegatedProfiles();

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

    // Attacher les délégations d'accès
    await attachDelegatedProfiles();

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
  const { email, confirmShare } = req.body;

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

    // Vérifier si cet e-mail est déjà utilisé par un ou plusieurs autres profils
    const [existingWithProfiles]: any = await connection.query(`
      SELECT u.id as user_id, p.id as profile_id, p.first_name, p.last_name
      FROM users u
      JOIN user_profiles up ON u.id = up.user_id
      JOIN profiles p ON up.profile_id = p.id
      WHERE LOWER(u.email) = ?
    `, [normalizedEmail]);

    if (existingWithProfiles.length > 0) {
      const existingProfileIds = existingWithProfiles.map((r: any) => r.profile_id).filter((pid: string) => pid !== profileId);
      if (existingProfileIds.length > 0) {
        const [delegationRows]: any = await connection.query(`
          SELECT pd.id, p2.first_name, p2.last_name
          FROM profile_delegations pd
          JOIN profiles p2 ON p2.id = CASE WHEN pd.parent_profile_id = ? THEN pd.child_profile_id ELSE pd.parent_profile_id END
          WHERE (pd.parent_profile_id = ? AND pd.child_profile_id IN (?))
             OR (pd.parent_profile_id IN (?) AND pd.child_profile_id = ?)
        `, [profileId, profileId, existingProfileIds, existingProfileIds, profileId]);

        if (delegationRows.length > 0) {
          await connection.rollback();
          return res.status(400).json({
            message: `Impossible d'ajouter cet e-mail en compte partagé : ce profil est déjà lié par un Accès délégué avec ${delegationRows[0].first_name} ${delegationRows[0].last_name}. Vous ne pouvez pas cumuler Compte partagé et Accès délégué pour la même personne.`
          });
        }
      }

      if (!confirmShare) {
        await connection.rollback();
        return res.status(409).json({
          code: 'EMAIL_ALREADY_USED',
          message: 'Cet e-mail est déjà associé à un autre musicien.',
          existingProfiles: existingWithProfiles.map((r: any) => ({
            id: r.profile_id,
            firstName: r.first_name,
            lastName: r.last_name
          }))
        });
      }
    }

    const [existingUsers]: any = await connection.query('SELECT id FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
    let targetUserId = '';

    // Si le compte existait mais n'était lié à aucun profil (orphelin), on le nettoie pour repartir sur une invitation propre
    if (existingUsers.length > 0 && existingWithProfiles.length === 0) {
      await connection.query('DELETE FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
      existingUsers.length = 0;
    }

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

// DELETE /api/users/:parentProfileId/delegations/:childProfileId - Retirer une délégation d'accès
router.delete('/:parentProfileId/delegations/:childProfileId', async (req, res) => {
  // @ts-ignore
  const userRole = (req as any).user.role;
  if (userRole !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('users'))) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  const { parentProfileId, childProfileId } = req.params;

  try {
    await pool.query(
      'DELETE FROM profile_delegations WHERE parent_profile_id = ? AND child_profile_id = ?',
      [parentProfileId, childProfileId]
    );
    res.json({ message: 'Accès délégué retiré avec succès.' });
  } catch (error) {
    console.error('Error removing delegation:', error);
    res.status(500).json({ message: 'Erreur lors du retrait de l\'accès délégué.' });
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
  const { firstName, lastName, email, role, managedModules, instruments, orchestras, password, status, delegatedProfileIds } = req.body;

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

        // Vérifier l'absence de conflit avec un accès délégué
        const [conflictDelegations]: any = await connection.query(`
          SELECT pd.id, p.first_name, p.last_name
          FROM profile_delegations pd
          JOIN user_profiles up ON (
            (pd.parent_profile_id = up.profile_id AND pd.child_profile_id = ?) OR
            (pd.child_profile_id = up.profile_id AND pd.parent_profile_id = ?)
          )
          JOIN profiles p ON up.profile_id = p.id
          WHERE up.user_id = ?
        `, [id, id, targetUserId]);

        if (conflictDelegations.length > 0) {
          await connection.rollback();
          return res.status(400).json({
            message: `Impossible d'associer cet e-mail : ce profil a déjà un Accès délégué avec ${conflictDelegations[0].first_name} ${conflictDelegations[0].last_name}. Vous ne pouvez pas cumuler Compte partagé et Accès délégué pour la même personne.`
          });
        }

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
      const [userRows]: any = await connection.query('SELECT password_hash FROM users WHERE id = ?', [effectiveUserId]);
      if (userRows.length > 0 && !userRows[0].password_hash) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ message: "Impossible de passer en 'Actif' un utilisateur qui n'a pas encore de mot de passe. L'utilisateur doit d'abord l'activer via son mail ou vous devez lui en définir un." });
      }
    }

    const modulesJson = JSON.stringify(managedModules || []);
    await connection.query(
      'UPDATE profiles SET first_name = ?, last_name = ?, role = ?, managed_modules = ?, status = ? WHERE id = ?',
      [firstName, lastName, role, modulesJson, status || 'Inactive', id]
    );

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

    // Synchroniser les accès délégués (délégations unidirectionnelles accordées à ce profil)
    if (Array.isArray(delegatedProfileIds)) {
      await connection.query('DELETE FROM profile_delegations WHERE parent_profile_id = ?', [id]);

      // Trouver les profils avec lesquels cet utilisateur partage déjà un compte (e-mail partagé)
      const [sharedRows]: any = await connection.query(`
        SELECT up2.profile_id
        FROM user_profiles up1
        JOIN user_profiles up2 ON up1.user_id = up2.user_id AND up1.profile_id != up2.profile_id
        WHERE up1.profile_id = ?
      `, [id]);
      const sharedProfileIds = new Set(sharedRows.map((r: any) => r.profile_id));

      for (const childId of delegatedProfileIds) {
        if (childId && childId !== id && !sharedProfileIds.has(childId)) {
          await connection.query(
            'INSERT IGNORE INTO profile_delegations (id, parent_profile_id, child_profile_id) VALUES (?, ?, ?)',
            [crypto.randomUUID(), id, childId]
          );
        }
      }
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

    await connection.execute('DELETE FROM profile_delegations WHERE parent_profile_id = ? OR child_profile_id = ?', [id, id]);
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
