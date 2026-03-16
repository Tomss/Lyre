import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const host = process.env.EMAIL_HOST;
    const port = 587;
    const secure = false;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    console.log(`Testing SMTP: ${host}:${port} (secure: ${secure})`);
    console.log(`User: ${user}`);

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: {
            rejectUnauthorized: false // Helps in local dev with some SMTP servers
        }
    });

    try {
        console.log("Starting verification...");
        const result = await transporter.verify();
        console.log("Verification result:", result);

        console.log("Sending test email...");
        const info = await transporter.sendMail({
            from: `"Test Lyre" <${user}>`,
            to: user,
            subject: "Test SMTP Lyre",
            text: "Ceci est un test de connexion SMTP."
        });
        console.log("Email sent successfully!");
        console.log("Message ID:", info.messageId);
        process.exit(0);
    } catch (error) {
        console.error("SMTP Error Detail:");
        console.error(error);
        process.exit(1);
    }
}

test();
