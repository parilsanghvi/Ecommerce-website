const { Resend } = require('resend');

const sendEmail = async (options) => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        await resend.emails.send({
            from: 'onboarding@resend.dev', // Use default or your verified domain
            to: options.email,
            subject: options.subject,
            text: options.message,
        });
    } catch (error) {
        console.error("Email sending failed:", error);
        throw new Error("Email sending failed");
    }
}

module.exports = sendEmail;
