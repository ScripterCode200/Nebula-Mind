async function testRemoteOllama() {
    const url = 'http://72.61.231.120:11434/api/chat';
    console.log(`Testing ${url}...`);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.2:latest',
                messages: [{ role: 'user', content: 'hi' }],
                stream: true
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log('Body:', text.substring(0, 200));
    } catch (error) {
        console.error('Error:', error);
    }
}

testRemoteOllama();
