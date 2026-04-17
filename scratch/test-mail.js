const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function testMail() {
    console.log('Testing Mail Configuration...');
    console.log('Host:', process.env.NODEMAILER_HOST);
    console.log('Port:', process.env.NODEMAILER_PORT);
    console.log('User:', process.env.NODEMAILER_USER);
    
    // Note: Don't log the password for security, but check if it exists
    console.log('Pass exists:', !!process.env.NODEMAILER_PASS);

    const transporter = nodemailer.createTransport({
        host: process.env.NODEMAILER_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.NODEMAILER_PORT || '465'),
        secure: true,
        auth: {
            user: process.env.NODEMAILER_USER,
            pass: process.env.NODEMAILER_PASS
        },
        timeout: 10000 // 10s timeout
    });

    try {
        console.log('Verifying transporter...');
        await transporter.verify();
        console.log('✅ Transporter is ready to take our messages');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: `"Nebula Mind Test" <${process.env.NODEMAILER_USER}>`,
            to: process.env.NODEMAILER_USER, // Send to self
            subject: 'Test Email - Nebula Mind',
            text: 'This is a test email to verify SMTP configuration.',
            html: '<b>This is a test email to verify SMTP configuration.</b>'
        });

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Email sending failed:');
        console.error(error);
    }
}

testMail();
