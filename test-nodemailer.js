const nodemailer = require('nodemailer');

const user = 'codstom@gmail.com';
const pass = 'ngek ttld shnh upzt';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass }
});

async function testSend() {
    console.log('Testing Nodemailer with provided App Password...');
    try {
        const info = await transporter.sendMail({
            from: `"Test Script" <${user}>`,
            to: user,
            subject: 'Nodemailer Restore Test',
            text: 'If you see this, Nodemailer is back!'
        });
        console.log('Success! Message ID:', info.messageId);
    } catch (error) {
        console.error('Sending Failed:', error);
    }
}

testSend();
