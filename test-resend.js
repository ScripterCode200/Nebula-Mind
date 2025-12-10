const { Resend } = require('resend');

const apiKey = 're_Jkr9cawb_PsSaAJPEAv8m62xTywuw6u6n'; // Hardcoded for testing to rule out env loading
const resend = new Resend(apiKey);

async function testResend() {
    console.log('Testing Resend API...');
    try {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'codstom@gmail.com', // Assuming this is the user's email or a safe test email. 
            // Better to ask user or use a placeholder, but for now I'll use a generic one or try to send to "delivered@resend.dev" which is a blackhole but verifies API.
            // Actually, Resend onboarding only allows sending to the email associated with the account.
            // Since I don't know that email, I'll try sending to 'codstom@gmail.com' as seen in previous logs, hoping it's the owner's.
            subject: 'Resend Test',
            html: '<p>It works!</p>'
        });

        if (error) {
            console.error('Resend Validation Error:', error);
        } else {
            console.log('Success! Email ID:', data.id);
        }
    } catch (e) {
        console.error('Script Error:', e);
    }
}

testResend();
