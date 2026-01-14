const sgMail = require('@sendgrid/mail');

const sendEmail = async (options) => {
    // Check for SendGrid API key
    if (!process.env.sendgrid_api_key) {
        console.warn('⚠️ SendGrid API key missing in .env. Falling back to console log.');
        console.log(`[Would Send Email to] ${options.email}`);
        console.log(`[Subject] ${options.subject}`);
        console.log(`[Message] ${options.message}`);
        return;
    }

    sgMail.setApiKey(process.env.sendgrid_api_key);

    const msg = {
        to: options.email,
        from: process.env.FROM_EMAIL || 'noreply@taskflow.com', // Must be a verified sender in SendGrid
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    try {
        await sgMail.send(msg);
        console.log('Email sent successfully to:', options.email);
    } catch (error) {
        console.error('SendGrid Error:', error);
        if (error.response) {
            console.error('SendGrid Error Body:', error.response.body);
        }
        throw error;
    }
};

module.exports = sendEmail;
