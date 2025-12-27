require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

const user = process.env.NODEMAILER_USER;
const pass = process.env.NODEMAILER_PASS;

console.log('Testing SMTP connection...');
console.log(`User: ${user ? user : 'MISSING'}`);
console.log(`Pass: ${pass ? 'HIDDEN (Length: ' + pass.length + ')' : 'MISSING'}`);

if (!user || !pass) {
    console.error('ERROR: Missing environment variables in .env.local');
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass }
});

transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ VERIFICATION FAILED:');
        console.error(error);
    } else {
        console.log('✅ SUCCESS! Credentials are valid.');
        console.log('Server is ready to take our messages.');
        console.log('\nIf this works globally but fails on Vercel, you need to REDEPLOY your Vercel project for the new variables to take effect.');
    }
});
