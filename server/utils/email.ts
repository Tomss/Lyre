import pool from '../db';
import { sendMail } from './emailSender';

const LOGO_URL = 'https://res.cloudinary.com/dr2sbjrms/image/upload/v1774629447/lyre-uploads/ll5sutyvmfrocohfv3yd.png';

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
