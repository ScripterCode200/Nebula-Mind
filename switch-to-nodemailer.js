const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const email = 'codstom@gmail.com';
const pass = 'ngek ttld shnh upzt';

try {
    let content = '';
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
    }

    // Remove old keys to avoid clutter/confusion
    let lines = content.split('\n');
    lines = lines.filter(line =>
        !line.startsWith('RESEND_API_KEY=') &&
        !line.startsWith('NODEMAILER_USER=') &&
        !line.startsWith('NODEMAILER_PASS=')
    );

    // Add new keys
    lines.push(`NODEMAILER_USER="${email}"`);
    lines.push(`NODEMAILER_PASS="${pass}"`);

    fs.writeFileSync(envPath, lines.join('\n'));
    console.log('Successfully updated .env.local with Nodemailer credentials.');
} catch (error) {
    console.error('Failed to update .env.local:', error);
    process.exit(1);
}
