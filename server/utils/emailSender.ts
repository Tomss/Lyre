import nodemailer from 'nodemailer';

interface SendMailParams {
  from?: string;
  to: string | string[];
  replyTo?: string | string[];
  subject: string;
  html: string;
}

export const sendMail = async ({ from, to, replyTo, subject, html }: SendMailParams): Promise<{ success: boolean; id?: string; error?: any }> => {
  const defaultFrom = 'La Lyre - Communication <communication@lalyre.fr>';
  const finalFrom = from || defaultFrom;
  const recipients = Array.isArray(to) ? to : [to];

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // 1. IF SMTP IS CONFIGURED (e.g. OVH ssl0.ovh.net in Coolify)
  if (smtpHost && smtpUser && smtpPass) {
    try {
      console.log(`[EmailSender] Sending via OVH SMTP (${smtpHost}:${smtpPort}) to ${recipients.join(', ')}...`);
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for 587
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const info = await transporter.sendMail({
        from: finalFrom,
        to: recipients,
        replyTo: replyTo || undefined,
        subject,
        html,
      });

      console.log(`[EmailSender] Success via OVH SMTP! MessageId: ${info.messageId}`);
      return { success: true, id: info.messageId };
    } catch (err: any) {
      console.error('[EmailSender] Error sending via OVH SMTP:', err);
      return { success: false, error: err };
    }
  }

  // 2. FALLBACK TO RESEND API (e.g. on Railway)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('[EmailSender] Error: Neither SMTP nor RESEND_API_KEY is configured.');
    return { success: false, error: 'No email service configured (missing SMTP or Resend credentials).' };
  }

  try {
    console.log(`[EmailSender] Sending via Resend API to ${recipients.join(', ')}...`);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: finalFrom,
        to: recipients,
        reply_to: replyTo || undefined,
        subject,
        html
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[EmailSender] Success via Resend! ID: ${data.id}`);
      return { success: true, id: data.id };
    } else {
      const errData = await response.json();
      console.error('[EmailSender] Error sending via Resend API:', errData);
      return { success: false, error: errData };
    }
  } catch (err: any) {
    console.error('[EmailSender] Error calling Resend API:', err);
    return { success: false, error: err };
  }
};
