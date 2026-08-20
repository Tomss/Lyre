import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import crypto from 'crypto';
import { logActivity } from '../utils/activity';

const router = Router();

router.use(authenticateToken);

const LOGO_URL = 'https://res.cloudinary.com/dr2sbjrms/image/upload/v1774629447/lyre-uploads/ll5sutyvmfrocohfv3yd.png';

const formatFrenchDate = (dateVal: any) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const formatted = d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

// Helper function to check if user has access to communication module
const hasCommunicationAccess = (req: any) => {
  const user = req.user;
  if (!user) return false;
  if (user.role === 'Admin') return true;
  if (user.role === 'Gestionnaire' && user.managedModules && user.managedModules.includes('communication')) return true;
  return false;
};

// GET /api/communication/events - Récupérer UNIQUEMENT les événements à venir
router.get('/events', async (req, res) => {
  if (!hasCommunicationAccess(req)) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  try {
    const [events] = await pool.query(`
      SELECT 
        e.id, e.title, e.description, e.event_type, 
        DATE_FORMAT(e.event_date, '%Y-%m-%dT%H:%i:%s') as event_date,
        e.location, e.practical_info,
        JSON_ARRAYAGG(JSON_OBJECT('id', o.id, 'name', o.name)) AS orchestras
      FROM events e
      LEFT JOIN event_orchestras eo ON e.id = eo.event_id
      LEFT JOIN orchestras o ON eo.orchestra_id = o.id
      WHERE e.event_date >= NOW() - INTERVAL 1 DAY
      GROUP BY e.id, e.title, e.description, e.event_type, e.event_date, e.location, e.practical_info
      ORDER BY e.event_date ASC
    `);
    res.json(events);
  } catch (error) {
    console.error('Error fetching communication events:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/communication/recipients/:eventId - Récupérer la liste des musiciens ciblés par un événement
router.get('/recipients/:eventId', async (req, res) => {
  if (!hasCommunicationAccess(req)) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  const { eventId } = req.params;

  try {
    const [orchestras]: any = await pool.query(`
      SELECT orchestra_id FROM event_orchestras WHERE event_id = ?
    `, [eventId]);

    const orchestraIds = orchestras.map((o: any) => o.orchestra_id);

    if (orchestraIds.length === 0) {
      return res.json([]);
    }

    const placeholders = orchestraIds.map(() => '?').join(',');
    const [recipients]: any = await pool.query(`
      SELECT DISTINCT 
        u.id, 
        u.email, 
        p.first_name AS firstName, 
        p.last_name AS lastName, 
        p.role,
        p.status
      FROM users u
      JOIN profiles p ON u.id = p.id
      JOIN user_orchestras uo ON p.id = uo.user_id
      WHERE uo.orchestra_id IN (${placeholders}) AND p.status != 'Inactive'
      ORDER BY p.last_name ASC, p.first_name ASC
    `, orchestraIds);

    for (const r of recipients) {
      const [orchs]: any = await pool.query(`
        SELECT o.name 
        FROM user_orchestras uo
        JOIN orchestras o ON uo.orchestra_id = o.id
        WHERE uo.user_id = ?
      `, [r.id]);
      r.userOrchestras = orchs.map((o: any) => o.name);
    }

    res.json(recipients);
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({ message: 'Erreur lors du calcul des destinataires.' });
  }
});

// POST /api/communication/recipients-multi - Récupérer les membres ciblés par plusieurs événements (Planning)
router.post('/recipients-multi', async (req, res) => {
  if (!hasCommunicationAccess(req)) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  const { eventIds } = req.body;

  try {
    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      const [allMembers]: any = await pool.query(`
        SELECT u.id, u.email, p.first_name AS firstName, p.last_name AS lastName, p.role, p.status
        FROM users u
        JOIN profiles p ON u.id = p.id
        WHERE p.status != 'Inactive'
        ORDER BY p.last_name ASC, p.first_name ASC
      `);
      for (const r of allMembers) {
        const [orchs]: any = await pool.query(`
          SELECT o.name FROM user_orchestras uo JOIN orchestras o ON uo.orchestra_id = o.id WHERE uo.user_id = ?
        `, [r.id]);
        r.userOrchestras = orchs.map((o: any) => o.name);
      }
      return res.json(allMembers);
    }

    const eventPlaceholders = eventIds.map(() => '?').join(',');
    const [orchestras]: any = await pool.query(`
      SELECT DISTINCT orchestra_id FROM event_orchestras WHERE event_id IN (${eventPlaceholders})
    `, eventIds);

    const orchestraIds = orchestras.map((o: any) => o.orchestra_id);

    if (orchestraIds.length === 0) {
      const [allMembers]: any = await pool.query(`
        SELECT u.id, u.email, p.first_name AS firstName, p.last_name AS lastName, p.role, p.status
        FROM users u
        JOIN profiles p ON u.id = p.id
        WHERE p.status != 'Inactive'
        ORDER BY p.last_name ASC, p.first_name ASC
      `);
      for (const r of allMembers) {
        const [orchs]: any = await pool.query(`
          SELECT o.name FROM user_orchestras uo JOIN orchestras o ON uo.orchestra_id = o.id WHERE uo.user_id = ?
        `, [r.id]);
        r.userOrchestras = orchs.map((o: any) => o.name);
      }
      return res.json(allMembers);
    }

    const orchPlaceholders = orchestraIds.map(() => '?').join(',');
    const [recipients]: any = await pool.query(`
      SELECT DISTINCT 
        u.id, 
        u.email, 
        p.first_name AS firstName, 
        p.last_name AS lastName, 
        p.role,
        p.status
      FROM users u
      JOIN profiles p ON u.id = p.id
      JOIN user_orchestras uo ON p.id = uo.user_id
      WHERE uo.orchestra_id IN (${orchPlaceholders}) AND p.status != 'Inactive'
      ORDER BY p.last_name ASC, p.first_name ASC
    `, orchestraIds);

    for (const r of recipients) {
      const [orchs]: any = await pool.query(`
        SELECT o.name 
        FROM user_orchestras uo
        JOIN orchestras o ON uo.orchestra_id = o.id
        WHERE uo.user_id = ?
      `, [r.id]);
      r.userOrchestras = orchs.map((o: any) => o.name);
    }

    res.json(recipients);
  } catch (error) {
    console.error('Error fetching multi-event recipients:', error);
    res.status(500).json({ message: 'Erreur lors du calcul des destinataires.' });
  }
});

// GET /api/communication/all-members - Récupérer TOUS les membres actifs / invités
router.get('/all-members', async (req, res) => {
  if (!hasCommunicationAccess(req)) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  try {
    const [recipients]: any = await pool.query(`
      SELECT 
        u.id, 
        u.email, 
        p.first_name AS firstName, 
        p.last_name AS lastName, 
        p.role,
        p.status
      FROM users u
      JOIN profiles p ON u.id = p.id
      WHERE p.status != 'Inactive'
      ORDER BY p.last_name ASC, p.first_name ASC
    `);

    for (const r of recipients) {
      const [orchs]: any = await pool.query(`
        SELECT o.name 
        FROM user_orchestras uo
        JOIN orchestras o ON uo.orchestra_id = o.id
        WHERE uo.user_id = ?
      `, [r.id]);
      r.userOrchestras = orchs.map((o: any) => o.name);
    }

    res.json(recipients);
  } catch (error) {
    console.error('Error fetching all members:', error);
    res.status(500).json({ message: 'Erreur lors du chargement des membres.' });
  }
});

// Helper function to format message HTML safely
const formatMessageBody = (text: string) => {
  if (!text) return '';
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return text;
  }
  return text.replace(/\n/g, '<br/>');
};

// POST /api/communication/send - Envoyer une communication par email via Resend
router.post('/send', async (req, res) => {
  if (!hasCommunicationAccess(req)) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  const { type, eventId, selectedEventIds, customSubject, freeMessageContent, customNote, selectedUserIds, isTest } = req.body;

  try {
    let event: any = null;
    let scheduleEvents: any[] = [];
    let finalRecipients: any[] = [];
    let orchestraTag = 'Tous les membres';

    if (type === 'event') {
      const targetIds = (selectedEventIds && Array.isArray(selectedEventIds) && selectedEventIds.length > 0)
        ? selectedEventIds
        : (eventId ? [eventId] : []);

      if (targetIds.length === 0) {
        return res.status(400).json({ message: 'L\'événement cible est requis pour une communication liée à un événement.' });
      }

      const placeholders = targetIds.map(() => '?').join(',');
      const [eventRows]: any = await pool.query(`
        SELECT 
          e.id, e.title, e.description, e.event_type, e.event_date,
          e.location, e.practical_info,
          JSON_ARRAYAGG(o.name) AS orchestra_names
        FROM events e
        LEFT JOIN event_orchestras eo ON e.id = eo.event_id
        LEFT JOIN orchestras o ON eo.orchestra_id = o.id
        WHERE e.id IN (${placeholders})
        GROUP BY e.id, e.title, e.description, e.event_type, e.event_date, e.location, e.practical_info
        ORDER BY e.event_date ASC
      `, targetIds);

      if (!eventRows || eventRows.length === 0) {
        return res.status(404).json({ message: 'Événement non trouvé.' });
      }

      scheduleEvents = (eventRows || []).map((row: any) => ({
        ...row,
        formatted_date: formatFrenchDate(row.event_date)
      }));
      event = scheduleEvents[0];

      const [orchestras]: any = await pool.query(`
        SELECT DISTINCT orchestra_id FROM event_orchestras WHERE event_id IN (${placeholders})
      `, targetIds);
      const orchestraIds = orchestras.map((o: any) => o.orchestra_id);

      if (orchestraIds.length > 0) {
        const orchPlaceholders = orchestraIds.map(() => '?').join(',');
        const [allRecipients]: any = await pool.query(`
          SELECT DISTINCT u.id, u.email, p.first_name AS firstName, p.last_name AS lastName
          FROM users u
          JOIN profiles p ON u.id = p.id
          JOIN user_orchestras uo ON p.id = uo.user_id
          WHERE uo.orchestra_id IN (${orchPlaceholders}) AND p.status != 'Inactive'
        `, orchestraIds);
        finalRecipients = allRecipients;
      }
      orchestraTag = (event.orchestra_names || []).filter(Boolean).join(', ') || 'Tous les ensembles';

    } else if (type === 'schedule') {
      // TYPE 3: PLANNING / PROGRAMME AGENDA
      if (selectedEventIds && Array.isArray(selectedEventIds) && selectedEventIds.length > 0) {
        const placeholders = selectedEventIds.map(() => '?').join(',');
        const [eventRows]: any = await pool.query(`
          SELECT 
            e.id, e.title, e.description, e.event_type, e.event_date,
            e.location, e.practical_info,
            JSON_ARRAYAGG(o.name) AS orchestra_names
          FROM events e
          LEFT JOIN event_orchestras eo ON e.id = eo.event_id
          LEFT JOIN orchestras o ON eo.orchestra_id = o.id
          WHERE e.id IN (${placeholders})
          GROUP BY e.id, e.title, e.description, e.event_type, e.event_date, e.location, e.practical_info
          ORDER BY e.event_date ASC
        `, selectedEventIds);

        scheduleEvents = (eventRows || []).map((row: any) => ({
          ...row,
          formatted_date: formatFrenchDate(row.event_date)
        }));
      }

      const [allRecipients]: any = await pool.query(`
        SELECT u.id, u.email, p.first_name AS firstName, p.last_name AS lastName
        FROM users u
        JOIN profiles p ON u.id = p.id
        WHERE p.status != 'Inactive'
      `);
      finalRecipients = allRecipients;

    } else {
      // Communication Libre
      const [allRecipients]: any = await pool.query(`
        SELECT u.id, u.email, p.first_name AS firstName, p.last_name AS lastName
        FROM users u
        JOIN profiles p ON u.id = p.id
        WHERE p.status != 'Inactive'
      `);
      finalRecipients = allRecipients;
    }

    // Filtrer selon la sélection des identifiants utilisateurs
    if (selectedUserIds && Array.isArray(selectedUserIds) && selectedUserIds.length > 0) {
      finalRecipients = finalRecipients.filter((r: any) => selectedUserIds.includes(r.id));
    }

    if (finalRecipients.length === 0) {
      return res.status(400).json({ message: 'Aucun destinataire sélectionné ou éligible.' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return res.status(500).json({ message: 'Clé d\'API Resend non configurée sur le serveur.' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const subject = customSubject || (
      type === 'event' ? `Rappel : ${event.title}` : (
        type === 'schedule' ? '[La Lyre] Planning & Agenda' : 'Information - La Lyre'
      )
    );
    
    // Store full name + email in recipient list JSON so searching by Name/Surname works!
    const recipientFormattedList = finalRecipients.map((r: any) => `${(r.lastName || '').toUpperCase()} ${r.firstName || ''} (${r.email})`.trim());
    
    let messageToSave = freeMessageContent;
    
    // Custom note box (if provided) placed BEFORE events without title label
    const customNoteHtml = customNote ? `
      <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 14px; padding: 16px 18px; margin: 16px 0 20px 0; font-size: 13.5px; color: #4c1d95; line-height: 1.6;">
        ${formatMessageBody(customNote)}
      </div>
    `.trim() : '';

    if ((type === 'event' || type === 'schedule') && scheduleEvents && scheduleEvents.length > 0) {
      let eventsCardsHtml = '';
      
      if (scheduleEvents.length === 1) {
        const ev = scheduleEvents[0];
        const orchsText = (ev.orchestra_names || []).filter(Boolean).join(', ') || orchestraTag || 'Tous les ensembles';
        eventsCardsHtml = `
          <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; margin: 16px 0;">
            <span style="display: inline-block; background-color: #e0e7ff; color: #3730a3; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 10px;">
              ${ev.event_type === 'concert' ? 'Concert' : (ev.event_type === 'repetition' ? 'Répétition' : 'Événement')}
            </span>
            <h2 style="margin: 6px 0 14px 0; font-size: 20px; font-weight: 800; color: #0f172a;">${ev.title}</h2>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
              <tr>
                <td style="padding: 6px 0; font-weight: 700; width: 110px; color: #64748b;">📅 Date :</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${ev.formatted_date}</td>
              </tr>
              ${ev.location ? `
              <tr>
                <td style="padding: 6px 0; font-weight: 700; color: #64748b;">📍 Lieu :</td>
                <td style="padding: 6px 0; color: #0f172a;">${ev.location}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 6px 0; font-weight: 700; color: #64748b;">🎷 Ensemble(s) :</td>
                <td style="padding: 6px 0; color: #0f172a;">${orchsText}</td>
              </tr>
            </table>

            ${ev.description ? `
              <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid #e2e8f0;">
                <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 800; color: #0f172a;">Description / Programme :</h4>
                <div style="font-size: 13px; color: #334155; line-height: 1.6;">${formatMessageBody(ev.description)}</div>
              </div>
            ` : ''}

            ${ev.practical_info ? `
              <div style="margin-top: 16px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px 16px;">
                <h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; color: #1e40af;">ℹ️ Informations pratiques :</h4>
                <div style="font-size: 12px; color: #1e3a8a; line-height: 1.5;">${formatMessageBody(ev.practical_info)}</div>
              </div>
            ` : ''}
          </div>
        `;
      } else {
        // Multi-event selection (2 or more events)
        let timeline = `
          <div style="margin: 20px 0;">
            <h3 style="margin: 0 0 18px 0; font-size: 17px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
              📅 Programme & Prochaines Échéances (${scheduleEvents.length} événements)
            </h3>
        `;
        for (const ev of scheduleEvents) {
          const orchsText = (ev.orchestra_names || []).filter(Boolean).join(', ') || orchestraTag || 'Tous les ensembles';
          timeline += `
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-left: 5px solid #4f46e5; border-radius: 14px; padding: 20px; margin-bottom: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
              <div style="margin-bottom: 8px;">
                <span style="background-color: #e0e7ff; color: #3730a3; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; display: inline-block; margin-right: 8px;">
                  📅 ${ev.formatted_date}
                </span>
                <span style="background-color: #f1f5f9; color: #475569; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; display: inline-block; text-transform: uppercase;">
                  ${ev.event_type === 'concert' ? 'Concert' : (ev.event_type === 'repetition' ? 'Répétition' : 'Événement')}
                </span>
              </div>
              <h4 style="margin: 8px 0 6px 0; font-size: 17px; font-weight: 800; color: #0f172a;">${ev.title}</h4>
              ${ev.location ? `<p style="margin: 4px 0; font-size: 13px; color: #475569;">📍 <strong>Lieu :</strong> ${ev.location}</p>` : ''}
              ${orchsText ? `<p style="margin: 4px 0; font-size: 13px; color: #475569;">🎷 <strong>Ensemble(s) :</strong> ${orchsText}</p>` : ''}
              ${ev.description ? `<div style="margin-top: 10px; font-size: 13px; color: #334155; line-height: 1.6;">${formatMessageBody(ev.description)}</div>` : ''}
              ${ev.practical_info ? `<div style="margin-top: 10px; background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 12px 14px; border-radius: 10px; font-size: 12px; color: #1e3a8a;"><strong>ℹ️ Infos pratiques :</strong> ${formatMessageBody(ev.practical_info)}</div>` : ''}
            </div>
          `;
        }
        timeline += `</div>`;
        eventsCardsHtml = timeline;
      }

      messageToSave = `${customNoteHtml}${eventsCardsHtml}`;
    } else if (type === 'free') {
      messageToSave = `${customNoteHtml}<div style="margin: 18px 0; font-size: 14px; line-height: 1.7; color: #1e293b;">${freeMessageContent}</div>`;
    }

    let successCount = 0;
    let failCount = 0;

    for (const recipient of finalRecipients) {
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; width: 100%;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width: 100%; background-color: #ffffff; margin: 0; padding: 0; border-collapse: collapse;">
            <tr>
              <td align="center" style="width: 100%; padding: 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width: 100%; background-color: #ffffff;">
                  
                  <!-- Real Logo & Clean Header -->
                  <tr>
                    <td style="background-color: #ffffff; padding: 28px 36px; text-align: center; border-bottom: 3px solid #4f46e5;">
                      <img src="${LOGO_URL}" alt="La Lyre" style="height: 56px; width: auto; max-width: 200px; margin-bottom: 6px; display: inline-block; object-fit: contain;" />
                      <h1 style="margin: 0; color: #0f172a; font-size: 22px; font-weight: 800; letter-spacing: -0.3px;">
                        La Lyre
                      </h1>
                      <p style="margin: 2px 0 0 0; color: #64748b; font-size: 12px; font-weight: 600;">
                        Espace Membre
                      </p>
                    </td>
                  </tr>

                  <!-- Email Content Body -->
                  <tr>
                    <td style="padding: 36px 36px; background-color: #ffffff;">
                      ${isTest ? `
                        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 10px 16px; border-radius: 10px; font-size: 12px; font-weight: bold; margin-bottom: 20px; text-align: center;">
                          ⚠️ EMAIL DE TEST (Envoi d'essai restreint)
                        </div>
                      ` : ''}

                      <p style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 20px;">
                        Bonjour ${recipient.firstName},
                      </p>

                      ${messageToSave}

                      <!-- Clean Indigo Theme Action Button -->
                      <div style="text-align: center; margin: 36px 0 16px 0;">
                        <a href="${frontendUrl}/dashboard" style="background-color: #4f46e5; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);">
                          Accéder à mon Espace Membre
                        </a>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 20px 36px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
                      <p style="margin: 0; font-weight: 700; color: #475569;">La Lyre &bull; Espace Membre</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: 'La Lyre <communication@lalyre.fr>',
            to: [recipient.email],
            subject: subject,
            html: htmlContent
          })
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
          const errData = await response.json();
          console.error(`[Resend Error for ${recipient.email}]:`, errData);
        }
      } catch (e) {
        failCount++;
        console.error(`[Fetch Error for ${recipient.email}]:`, e);
      }
    }

    // Enregistrer dans communication_log avec message_content et formatted recipient names
    const logId = crypto.randomUUID();
    const currentUserId = (req as any).user.id;
    await pool.query(`
      INSERT INTO communication_log (id, event_id, subject, message_content, recipient_count, recipients_list, is_test, sent_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      logId,
      eventId || null,
      subject,
      messageToSave,
      successCount,
      JSON.stringify(recipientFormattedList),
      isTest ? 1 : 0,
      currentUserId
    ]);

    // Loguer l'activité globale pour le dashboard
    await logActivity({
      type: 'event',
      action_type: 'update',
      target_id: eventId || logId,
      created_by: currentUserId,
      title: `Email : ${subject}`,
      message: `Une communication par email a été envoyée à ${successCount} membre(s) (${isTest ? 'Mode Test' : 'Officiel'}).`
    });

    res.json({
      success: true,
      sentCount: successCount,
      failCount: failCount,
      isTest: !!isTest,
      message: `Communication envoyée avec succès à ${successCount} membre(s).`
    });

  } catch (error) {
    console.error('Error sending communication:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi de la communication.' });
  }
});

// GET /api/communication/history - Récupérer l'historique complet avec message_content et noms des destinataires
router.get('/history', async (req, res) => {
  if (!hasCommunicationAccess(req)) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  try {
    const [cols]: any = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'communication_log' 
      AND COLUMN_NAME = 'message_content'
    `);
    const hasMessageContent = cols[0]?.count > 0;
    const selectMessageContent = hasMessageContent ? 'cl.message_content,' : "'' AS message_content,";

    const [usersWithProfiles]: any = await pool.query(`
      SELECT u.email, p.first_name, p.last_name
      FROM users u
      JOIN profiles p ON u.id = p.id
    `);
    const emailToNameMap: Record<string, string> = {};
    for (const u of usersWithProfiles) {
      if (u.email) {
        const fullName = `${(u.last_name || '').toUpperCase()} ${u.first_name || ''}`.trim();
        if (fullName) {
          emailToNameMap[u.email.toLowerCase()] = fullName;
        }
      }
    }

    const [history]: any = await pool.query(`
      SELECT 
        cl.id, cl.subject, ${selectMessageContent} cl.recipient_count, cl.recipients_list, cl.is_test,
        DATE_FORMAT(cl.created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
        e.title AS event_title, e.event_type, e.location AS event_location,
        DATE_FORMAT(e.event_date, '%d/%m/%Y à %H:%i') AS formatted_event_date,
        CONCAT(p.first_name, ' ', p.last_name) AS sender_name
      FROM communication_log cl
      LEFT JOIN events e ON cl.event_id = e.id
      LEFT JOIN profiles p ON cl.sent_by = p.id
      ORDER BY cl.created_at DESC
      LIMIT 100
    `);

    const enrichedHistory = history.map((item: any) => {
      let rawList: string[] = [];
      if (Array.isArray(item.recipients_list)) {
        rawList = item.recipients_list;
      } else if (typeof item.recipients_list === 'string') {
        try {
          rawList = JSON.parse(item.recipients_list);
        } catch (e) {
          rawList = [item.recipients_list];
        }
      }

      const enrichedList = rawList.map((rec: string) => {
        if (typeof rec === 'string') {
          if (rec.includes('(')) return rec;
          const cleanEmail = rec.trim().toLowerCase();
          const name = emailToNameMap[cleanEmail];
          if (name) {
            return `${name} (${rec.trim()})`;
          }
        }
        return rec;
      });

      item.recipients_list = enrichedList;

      if (!item.message_content || item.message_content.trim() === '') {
        if (item.event_title) {
          item.message_content = `<p><strong>Événement :</strong> ${item.event_title}</p><p>📅 <strong>Date :</strong> ${item.formatted_event_date || 'Non spécifiée'}</p>${item.event_location ? `<p>📍 <strong>Lieu :</strong> ${item.event_location}</p>` : ''}`;
        } else {
          item.message_content = `<p className="italic text-slate-400">[Communication libre de test archivée - Contenu non conservé dans l'ancien format]</p>`;
        }
      }

      return item;
    });

    res.json(enrichedHistory);
  } catch (error) {
    console.error('Error fetching communication history:', error);
    res.status(500).json({ message: 'Erreur lors du chargement de l\'historique.' });
  }
});

// DELETE /api/communication/log/:id - Supprimer une communication de l'historique
router.delete('/log/:id', async (req, res) => {
  if (!hasCommunicationAccess(req)) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  const { id } = req.params;

  try {
    const [result]: any = await pool.query(`
      DELETE FROM communication_log WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Entrée d\'historique non trouvée.' });
    }

    res.json({ success: true, message: 'Communication supprimée de l\'historique.' });
  } catch (error) {
    console.error('Error deleting communication log:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
});

export default router;
