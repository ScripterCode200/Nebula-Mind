
async function testChat() {
    console.log('Testing /api/chat with Ollama...');
    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                notebookId: '69296dc895c5efc37addff9d',
                message: 'Hello',
                history: [],
                modelProvider: 'ollama'
            }),
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log('Response Body:', text);
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testChat();
