


async function testGenerate() {
    console.log('Testing /api/generate with Ollama...');
    try {
        const response = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                notebookId: '69296dc895c5efc37addff9d', // Use the ID from the user's state
                type: 'notes',
                config: { type: 'detailed' },
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

testGenerate();
