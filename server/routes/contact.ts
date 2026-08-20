import { Router, Request, Response } from 'express';
import { sendContactNotificationEmail } from '../utils/email';

const router = Router();

// In-memory rate limiting map: IP -> timestamp array
const ipSubmissions = new Map<string, number[]>();

const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 3; // Max 3 contact messages per 10 minutes per IP

setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of ipSubmissions.entries()) {
    const valid = timestamps.filter(t => now - t < CLEANUP_INTERVAL);
    if (valid.length === 0) {
      ipSubmissions.delete(ip);
    } else {
      ipSubmissions.set(ip, valid);
    }
  }
}, CLEANUP_INTERVAL);

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, subject, message, website, formTime } = req.body;

    // 1. HONEYPOT ANTI-SPAM CHECK
    // Bot trap: if website field (hidden to humans) is filled, ignore submission silently
    if (website && String(website).trim().length > 0) {
      console.warn(`[Anti-Spam] Honeypot triggered by IP: ${req.ip}`);
      return res.status(200).json({
        success: true,
        message: 'Votre message a été envoyé avec succès !'
      });
    }

    // 2. TIME-DELTA ANTI-BOT CHECK
    // If form submitted in under 2 seconds, it is automated bot activity
    if (formTime) {
      const elapsed = Date.now() - Number(formTime);
      if (elapsed < 2000) {
        console.warn(`[Anti-Spam] Sub-2s speed submission detected (${elapsed}ms) by IP: ${req.ip}`);
        return res.status(200).json({
          success: true,
          message: 'Votre message a été envoyé avec succès !'
        });
      }
    }

    // 3. RATE LIMITING PER IP
    const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    const now = Date.now();
    const userTimestamps = (ipSubmissions.get(clientIp) || []).filter(t => now - t < CLEANUP_INTERVAL);

    if (userTimestamps.length >= MAX_REQUESTS) {
      return res.status(429).json({
        message: 'Vous avez envoyé trop de messages. Veuillez réinstaller dans 10 minutes.'
      });
    }

    // 4. FIELD VALIDATION & SANITIZATION
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Veuillez saisir votre nom.' });
    }

    if (!email || !String(email).trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      return res.status(400).json({ message: 'Veuillez saisir une adresse e-mail valide.' });
    }

    if (!message || String(message).trim().length < 10) {
      return res.status(400).json({ message: 'Votre message doit contenir au moins 10 caractères.' });
    }

    const cleanName = String(name).trim().slice(0, 100);
    const cleanEmail = String(email).trim().slice(0, 150);
    const cleanPhone = phone ? String(phone).trim().slice(0, 30) : '';
    const cleanSubject = subject ? String(subject).trim().slice(0, 150) : 'Demande de contact';
    const cleanMessage = String(message).trim().slice(0, 4000);

    // 5. SEND EMAIL TO DIRECTION@LALYRE.FR
    const emailResult = await sendContactNotificationEmail({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      subject: cleanSubject,
      message: cleanMessage,
      req
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || "Échec d'envoi du mail de contact");
    }

    // Record submission for rate limiting
    userTimestamps.push(now);
    ipSubmissions.set(clientIp, userTimestamps);

    return res.status(200).json({
      success: true,
      message: 'Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.'
    });

  } catch (error: any) {
    console.error('[Contact Router Error]:', error);
    return res.status(500).json({
      message: "Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer."
    });
  }
});

export default router;
