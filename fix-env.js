const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const apiKey = 're_Jkr9cawb_PsSaAJPEAv8m62xTywuw6u6n';

try {
    let content = '';
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
    }

    // Remove existing RESEND lines to avoid duplicates
    const lines = content.split('\n').filter(line => !line.startsWith('RESEND_API_KEY='));

    // Add new key
    lines.push(`RESEND_API_KEY="${apiKey}"`);

    fs.writeFileSync(envPath, lines.join('\n'));
    console.log('Successfully updated .env.local');
} catch (error) {
    console.error('Failed to update .env.local:', error);
    process.exit(1);
}
