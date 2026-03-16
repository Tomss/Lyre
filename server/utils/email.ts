import pool from '../db';

export const sendActivationEmail = async (email: string, firstName: string, token: string) => {
    // Le lien frontend où l'utilisateur créera son mot de passe
    const frontendUrl = process.env.VITE_API_URL || 'http://localhost:5173';
    const activationLink = `${frontendUrl}/activer-compte?token=${token}`;
    const resendApiKey = process.env.RESEND_API_KEY;

    console.log(`[Email Debug] API Key présente: ${!!resendApiKey}`);
    if (resendApiKey) {
        console.log(`[Email Debug] Début de la clé: ${resendApiKey.substring(0, 10)}...`);
    }

    if (!resendApiKey || resendApiKey === 'votre_cle_resend_ici') {
        console.error('[Email] Erreur : RESEND_API_KEY est manquante ou invalide.');
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
        console.log(`[Email] Envoi via Resend API à ${email}...`);
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
                from: 'Association La Lyre <onboarding@resend.dev>', // Sera mis à jour après validation du domaine
                to: [email],
                subject: 'La Lyre - Activation de votre Espace Membre',
                html: htmlContent
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`[Email] Succès ! ID: ${data.id}`);
            return true;
        } else {
            const errorData = await response.json();
            console.error('[Email] Échec de l\'envoi via API Resend:', errorData);
            return false;
        }
    } catch (error) {
        console.error('[Email] Erreur critique lors de l\'envoi:', error);
        return false;
    }
};
