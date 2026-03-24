const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.sendShortlistEmail = async (applicantEmail, applicantName, vacancyTitle) => {
    try {
        const mailOptions = {
            from: `"HRMS Admin" <${process.env.EMAIL_USER}>`,
            to: applicantEmail,
            subject: `Shortlisted for ${vacancyTitle}`,
            text: `Dear ${applicantName},\n\nCongratulations! You have been shortlisted for the position of ${vacancyTitle}. We will contact you soon for the next steps.\n\nBest regards,\nHR Team`,
            html: `<p>Dear ${applicantName},</p>
             <p>Congratulations! You have been <strong>shortlisted</strong> for the position of <strong>${vacancyTitle}</strong>.</p>
             <p>We will contact you soon for the next steps.</p>
             <p>Best regards,<br>HR Team</p>`,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};


exports.testEmailConnection = async () => {
    try {
        await transporter.verify();
        console.log('✅ Email server is ready to send messages');
        return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
        console.error('❌ Email server connection failed:', error);
        return { success: false, error: error.message };
    }
};
