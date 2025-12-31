const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // strict check for required env vars
    if (!process.env.SMTP_HOST || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        console.warn('⚠️ SMTP settings missing in .env. Falling back to console log.');
        console.log(`[Would Send Email to] ${options.email}`);
        console.log(`[Subject] ${options.subject}`);
        console.log(`[Message] ${options.message}`);
        return;
    }

    let transportConfig = {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        tls: {
            rejectUnauthorized: false
        }
    };

    // Check if OAuth credentials are provided
    if (process.env.CLIENT_ID && process.env.CLIENT_SECRET) {
        transportConfig.service = 'gmail';
        transportConfig.auth = {
            type: 'OAuth2',
            user: process.env.SMTP_EMAIL,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN, // Optional, might work if access token is somehow managed or for service accounts, but usually needed
            pass: process.env.SMTP_PASSWORD // Fallback or if using app password with same email
        };
    } else {
        // Standard SMTP Auth
        transportConfig.auth = {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    const message = {
        from: `${process.env.FROM_NAME || 'TaskFlow'} <${process.env.SMTP_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
