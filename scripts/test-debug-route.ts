async function testDebugRoute() {
    try {
        const res = await fetch('http://localhost:3000/api/debug-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true })
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text.substring(0, 500));

    } catch (error) {
        console.error('Error:', error);
    }
}

testDebugRoute();
