import pool from '../db';
import { sendMail } from './emailSender';

const LOGO_URL = 'https://test.lalyre.fr/uploads/site/logo_lyre.png';

export const sendActivationEmail = async (
    email: string, 
    firstName: string, 
    token: string, 
    isReset: boolean = false,
    req?: any
) => {
    // Dynamic fail-safe frontend URL detection
    let frontendUrl: string | undefined = process.env.FRONTEND_URL;
    if (!frontendUrl && req) {
      const origin = req.headers?.origin;
      if (typeof origin === 'string') {
        frontendUrl = origin;
      } else if (typeof req.headers?.referer === 'string') {
        try {
          frontendUrl = new URL(req.headers.referer).origin;
        } catch (e) {
          // ignore
        }
      }
    }
    if (!frontendUrl) {
      frontendUrl = 'http://localhost:5173';
    }
    frontendUrl = frontendUrl.replace(/\/$/, '');

    const activationLink = `${frontendUrl}/activer-compte?token=${token}`;

    const subject = isReset ? '[La Lyre] Réinitialisation de votre mot de passe' : '[La Lyre] Accès à votre Espace Membre';
    const title = isReset ? 'Demande de réinitialisation' : 'Accès à votre espace membre';
    const introText = isReset 
        ? `Vous avez demandé à réinitialiser votre mot de passe pour votre espace membre sur le site de <strong>La Lyre</strong>.`
        : `Vous recevez ce message pour accéder à votre espace membre sur le site de <strong>La Lyre</strong>.`;
    const actionText = isReset ? 'Réinitialiser mon mot de passe' : 'Activer mon espace membre';

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
                      <p style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">
                        Bonjour ${firstName},
                      </p>

                      <h3 style="color: #4f46e5; font-size: 18px; font-weight: 800; margin-top: 0; margin-bottom: 12px;">${title}</h3>
                      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
                        ${introText}<br/> 
                        Pour continuer, veuillez cliquer sur le bouton ci-dessous pour définir votre mot de passe en toute sécurité.
                      </p>
                      
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${activationLink}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);">
                          ${actionText}
                        </a>
                      </div>
                      
                      <p style="font-size: 12px; color: #64748b; font-style: italic; line-height: 1.5; margin-top: 24px;">
                        Ce lien expire dans 48 heures pour des raisons de sécurité.<br>
                        Si le bouton ne fonctionne pas, copiez-collez ce lien : <br>
                        <a href="${activationLink}" style="color: #4f46e5; word-break: break-all;">${activationLink}</a>
                      </p>
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

    const result = await sendMail({
      from: 'La Lyre - Communication <communication@lalyre.fr>',
      to: email,
      subject,
      html: htmlContent
    });

    return result.success;
};

export const sendContactNotificationEmail = async ({
  name,
  email,
  phone,
  subject,
  message,
}: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  req?: any;
}) => {
  const mailSubject = `[La Lyre] Nouveau message : ${subject || 'Demande de contact'}`;
  
  const formattedDate = new Date().toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${mailSubject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; width: 100%;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width: 100%; background-color: #f8fafc; margin: 0; padding: 24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
              
              <!-- Header -->
              <tr>
                <td style="background-color: #0f172a; padding: 24px 32px; text-align: center; border-bottom: 3px solid #0d9488;">
                  <img src="${LOGO_URL}" alt="La Lyre" style="height: 48px; width: auto; margin-bottom: 8px; display: inline-block; object-fit: contain;" />
                  <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800;">
                    Nouveau Message de Contact
                  </h1>
                  <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; font-weight: 600;">
                    Formulaire du site web
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 32px 32px; background-color: #ffffff;">
                  
                  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #166534; letter-spacing: 0.5px;">Coordonnées du visiteur</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; line-height: 1.6; color: #1e293b;">
                      <tr>
                        <td style="padding: 4px 0; font-weight: 700; width: 110px;">Nom / Prénom :</td>
                        <td style="padding: 4px 0;">${name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-weight: 700;">E-mail :</td>
                        <td style="padding: 4px 0;"><a href="mailto:${email}" style="color: #0d9488; font-weight: 700; text-decoration: underline;">${email}</a></td>
                      </tr>
                      ${phone ? `
                      <tr>
                        <td style="padding: 4px 0; font-weight: 700;">Téléphone :</td>
                        <td style="padding: 4px 0;"><a href="tel:${phone}" style="color: #0f172a; font-weight: 600; text-decoration: none;">${phone}</a></td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 4px 0; font-weight: 700;">Sujet :</td>
                        <td style="padding: 4px 0;"><span style="background-color: #0d9488; color: #ffffff; padding: 2px 10px; border-radius: 6px; font-size: 12px; font-weight: 700;">${subject}</span></td>
                      </tr>
                    </table>
                  </div>

                  <!-- Message Box -->
                  <div style="margin-bottom: 24px;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; color: #475569;">Message transmis :</p>
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; font-size: 14px; line-height: 1.7; color: #0f172a; white-space: pre-wrap;">${message}</div>
                  </div>

                  <!-- Reply Action Button -->
                  <div style="text-align: center; margin-top: 32px; margin-bottom: 12px;">
                    <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" style="background-color: #0d9488; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.3);">
                      Répondre directement à ${name}
                    </a>
                  </div>
                  <p style="text-align: center; margin: 8px 0 0 0; font-size: 11px; color: #94a3b8;">
                    (Ou cliquez simplement sur "Répondre" dans votre logiciel de messagerie)
                  </p>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f1f5f9; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
                  <p style="margin: 0;">Message reçu le ${formattedDate} via le formulaire de contact du site de La Lyre.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await sendMail({
    from: 'La Lyre - Formulaire de Contact <communication@lalyre.fr>',
    to: 'direction@lalyre.fr',
    replyTo: `${name} <${email}>`,
    subject: mailSubject,
    html: htmlContent
  });
};
