import nodemailer from 'nodemailer';

// Configuration du transporteur d'emails
export const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'ssl0.ovh.net',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // false pour le port 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // Ajout de timeouts pour éviter que le serveur ne freeze si OVH ne répond pas
    connectionTimeout: 10000, // 10 secondes
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
        rejectUnauthorized: false
    }
});

export const sendActivationEmail = async (email: string, firstName: string, token: string) => {
    // Le lien frontend où l'utilisateur créera son mot de passe
    const frontendUrl = process.env.VITE_API_URL || 'http://localhost:5173';
    const activationLink = `${frontendUrl}/activer-compte?token=${token}`;

    const mailOptions = {
        from: `"Association La Lyre" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'La Lyre - Activation de votre Espace Membre',
        html: `
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
        `
    };

    try {
        console.log(`[SMTP] Début de l'envoi à ${email}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`[SMTP] Email envoyé ! MessageId: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('[SMTP] Erreur CRITIQUE d\'envoi:', error);
        return false;
    }
};
