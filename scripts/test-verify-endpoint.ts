async function testVerify() {
    try {
        const res = await fetch('http://localhost:3000/api/auth/login/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                otp: '123456',
                otpToken: 'dummy-token'
            })
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text.substring(0, 500)); // Print first 500 chars

    } catch (error) {
        console.error('Error:', error);
    }
}

testVerify();
