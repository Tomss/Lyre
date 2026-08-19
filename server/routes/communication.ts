import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import crypto from 'crypto';
import { logActivity } from '../utils/activity';

const router = Router();

router.use(authenticateToken);

const LOGO_URL = 'https://res.cloudinary.com/dr2sbjrms/image/upload/v1774629447/lyre-uploads/ll5sutyvmfrocohfv3yd.png';

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
    // 1. Récupérer les orchestres de cet événement
    const [orchestras]: any = await pool.query(`
      SELECT orchestra_id FROM event_orchestras WHERE event_id = ?
    `, [eventId]);

    const orchestraIds = orchestras.map((o: any) => o.orchestra_id);

    if (orchestraIds.length === 0) {
      return res.json([]);
    }

    // 2. Récupérer tous les musiciens membres de ces orchestres
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

    // 3. Récupérer les noms des orchestres pour chaque membre
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
  // If text already has HTML tags like <p>, <b>, <i>, <br>, keep it; otherwise replace \n with <br/>
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

  const { type, eventId, customSubject, freeMessageContent, customNote, selectedUserIds, isTest } = req.body;

  try {
    let event: any = null;
    let finalRecipients: any[] = [];
    let orchestraTag = 'Tous les membres';

    if (type === 'event') {
      if (!eventId) {
        return res.status(400).json({ message: 'L\'événement cible est requis pour une communication liée à un événement.' });
      }

      // Récupérer l'événement et ses orchestres
      const [eventRows]: any = await pool.query(`
        SELECT 
          e.id, e.title, e.description, e.event_type, 
          DATE_FORMAT(e.event_date, '%d/%m/%Y à %H:%i') as formatted_date,
          e.location, e.practical_info,
          JSON_ARRAYAGG(o.name) AS orchestra_names
        FROM events e
        LEFT JOIN event_orchestras eo ON e.id = eo.event_id
        LEFT JOIN orchestras o ON eo.orchestra_id = o.id
        WHERE e.id = ?
        GROUP BY e.id, e.title, e.description, e.event_type, e.event_date, e.location, e.practical_info
      `, [eventId]);

      if (!eventRows || eventRows.length === 0) {
        return res.status(404).json({ message: 'Événement non trouvé.' });
      }

      event = eventRows[0];

      // Récupérer les orchestres
      const [orchestras]: any = await pool.query(`
        SELECT orchestra_id FROM event_orchestras WHERE event_id = ?
      `, [eventId]);
      const orchestraIds = orchestras.map((o: any) => o.orchestra_id);

      if (orchestraIds.length > 0) {
        const placeholders = orchestraIds.map(() => '?').join(',');
        const [allRecipients]: any = await pool.query(`
          SELECT DISTINCT u.id, u.email, p.first_name AS firstName, p.last_name AS lastName
          FROM users u
          JOIN profiles p ON u.id = p.id
          JOIN user_orchestras uo ON p.id = uo.user_id
          WHERE uo.orchestra_id IN (${placeholders}) AND p.status != 'Inactive'
        `, orchestraIds);
        finalRecipients = allRecipients;
      }
      orchestraTag = (event.orchestra_names || []).filter(Boolean).join(', ') || 'Tous les ensembles';
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
    const subject = customSubject || (type === 'event' ? `Rappel : ${event.title}` : 'Information - La Lyre');
    const recipientEmails = finalRecipients.map((r: any) => r.email);

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
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 10px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); border: 1px solid #e2e8f0;">
                  
                  <!-- Real Logo & Clean Header (No Saxophone, No Chalindrey, Just "La Lyre") -->
                  <tr>
                    <td style="background-color: #ffffff; padding: 26px 30px; text-align: center; border-bottom: 2px solid #4f46e5;">
                      <img src="${LOGO_URL}" alt="La Lyre" style="height: 54px; width: auto; max-width: 180px; margin-bottom: 6px; display: inline-block; object-fit: contain;" />
                      <h1 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 800; letter-spacing: -0.3px;">
                        La Lyre
                      </h1>
                      <p style="margin: 2px 0 0 0; color: #64748b; font-size: 12px; font-weight: 600;">
                        Espace Membre
                      </p>
                    </td>
                  </tr>

                  <!-- Email Content Body -->
                  <tr>
                    <td style="padding: 32px 28px; background-color: #ffffff;">
                      ${isTest ? `
                        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 10px 16px; border-radius: 10px; font-size: 12px; font-weight: bold; margin-bottom: 20px; text-align: center;">
                          ⚠️ EMAIL DE TEST (Envoi d'essai restreint)
                        </div>
                      ` : ''}

                      <p style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 18px;">
                        Bonjour ${recipient.firstName},
                      </p>

                      ${type === 'event' && event ? `
                        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 18px 0; border: 1px solid #e2e8f0;">
                          <span style="display: inline-block; background-color: #e0e7ff; color: #3730a3; font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 8px;">
                            ${event.event_type === 'concert' ? 'Concert' : (event.event_type === 'repetition' ? 'Répétition' : 'Événement')}
                          </span>
                          <h2 style="margin: 4px 0 12px 0; font-size: 18px; font-weight: 800; color: #0f172a;">${event.title}</h2>
                          
                          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
                            <tr>
                              <td style="padding: 5px 0; font-weight: 700; width: 100px; color: #64748b;">📅 Date :</td>
                              <td style="padding: 5px 0; color: #0f172a; font-weight: 700;">${event.formatted_date}</td>
                            </tr>
                            ${event.location ? `
                            <tr>
                              <td style="padding: 5px 0; font-weight: 700; color: #64748b;">📍 Lieu :</td>
                              <td style="padding: 5px 0; color: #0f172a;">${event.location}</td>
                            </tr>
                            ` : ''}
                            <tr>
                              <td style="padding: 5px 0; font-weight: 700; color: #64748b;">🎷 Ensemble :</td>
                              <td style="padding: 5px 0; color: #0f172a;">${orchestraTag}</td>
                            </tr>
                          </table>
                        </div>

                        ${event.description ? `
                          <div style="margin-bottom: 18px;">
                            <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #0f172a;">Description :</h4>
                            <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #334155;">${event.description}</p>
                          </div>
                        ` : ''}

                        ${event.practical_info ? `
                          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px; margin-bottom: 18px;">
                            <h4 style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #1e40af;">ℹ️ Informations pratiques :</h4>
                            <p style="margin: 0; font-size: 12px; color: #1e3a8a; line-height: 1.5;">${event.practical_info}</p>
                          </div>
                        ` : ''}

                        ${customNote ? `
                          <div style="background-color: #f8fafc; border: 1px border-slate-200; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
                            <h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #0f172a;">Note du responsable :</h4>
                            <div style="font-size: 13px; color: #1e293b; line-height: 1.6;">${formatMessageBody(customNote)}</div>
                          </div>
                        ` : ''}
                      ` : `
                        <!-- Communication libre (CLEAN BACKGROUND, NO LEFT VERTICAL BORDER BAR) -->
                        <div style="background-color: #f8fafc; padding: 22px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 18px 0; font-size: 14px; line-height: 1.7; color: #1e293b;">
                          ${formatMessageBody(freeMessageContent || '')}
                        </div>
                      `}

                      <!-- Clean Indigo Theme Action Button -->
                      <div style="text-align: center; margin: 32px 0 12px 0;">
                        <a href="${frontendUrl}/dashboard" style="background-color: #4f46e5; color: #ffffff; font-weight: 700; font-size: 13px; text-decoration: none; padding: 13px 26px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);">
                          Accéder à mon Espace Membre
                        </a>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 18px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
                      <p style="margin: 0 0 2px 0; font-weight: 700; color: #334155;">La Lyre &bull; Espace Membre</p>
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

    // Enregistrer dans communication_log
    const logId = crypto.randomUUID();
    const currentUserId = (req as any).user.id;
    await pool.query(`
      INSERT INTO communication_log (id, event_id, subject, recipient_count, recipients_list, is_test, sent_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      logId,
      eventId || null,
      subject,
      successCount,
      JSON.stringify(recipientEmails),
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

// GET /api/communication/history - Récupérer l'historique
router.get('/history', async (req, res) => {
  if (!hasCommunicationAccess(req)) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  try {
    const [history] = await pool.query(`
      SELECT 
        cl.id, cl.subject, cl.recipient_count, cl.recipients_list, cl.is_test,
        DATE_FORMAT(cl.created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
        e.title AS event_title, e.event_type,
        CONCAT(p.first_name, ' ', p.last_name) AS sender_name
      FROM communication_log cl
      LEFT JOIN events e ON cl.event_id = e.id
      LEFT JOIN profiles p ON cl.sent_by = p.id
      ORDER BY cl.created_at DESC
      LIMIT 50
    `);
    res.json(history);
  } catch (error) {
    console.error('Error fetching communication history:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

export default router;
