import pool from '../db';

export const sendActivationEmail = async (email: string, firstName: string, token: string) => {
    // Le lien frontend où l'utilisateur créera son mot de passe
    const frontendUrl = process.env.VITE_API_URL || 'http://localhost:5173';
    const activationLink = `${frontendUrl}/activer-compte?token=${token}`;
    const brevoApiKey = process.env.BREVO_API_KEY;

    if (!brevoApiKey) {
        console.error('[Email] Erreur : BREVO_API_KEY est manquante dans les variables d\'environnement.');
        return false;
    }

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="text-align: center; padding: 20px;">
                <img src="${frontendUrl}/logo.png" alt="Logo La Lyre" style="height: 80px;" onerror="this.style.display='none'" />
            </div>
            
            <div style="background-color: #f9fafb; padding: 30px; border-radius: 10px;">
                <h2 style="color: #4f46e5; margin-top: 0;">Bonjour ${firstName},</h2>
                <p style="font-size: 16px; line-height: 1.5;">
                    Votre espace membre sur le site de <strong>La Lyre</strong> a été créé. Pour y accéder, 
                    vous devez simplement activer votre compte en définissant votre mot de passe privé.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${activationLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Activer mon espace membre
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #666; font-style: italic;">
                    Ce lien expire dans 48 heures pour des raisons de sécurité.<br>
                    Si le bouton ne fonctionne pas, copiez-collez ce lien : <br>
                    <a href="${activationLink}" style="color: #4f46e5;">${activationLink}</a>
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
                Ceci est un email automatique, merci de ne pas y répondre.
            </div>
        </div>
    `;

    try {
        console.log(`[Email] Envoi via Brevo API à ${email}...`);
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'api-key': brevoApiKey
            },
            body: JSON.stringify({
                sender: { name: 'Association La Lyre', email: process.env.EMAIL_USER || 'communication@lalyre.fr' },
                to: [{ email: email, name: firstName }],
                subject: 'La Lyre - Activation de votre Espace Membre',
                htmlContent: htmlContent
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`[Email] Succès ! MessageId: ${data.messageId}`);
            return true;
        } else {
            const errorData = await response.json();
            console.error('[Email] Échec de l\'envoi via API:', errorData);
            return false;
        }
    } catch (error) {
        console.error('[Email] Erreur critique lors de l\'envois:', error);
        return false;
    }
};
