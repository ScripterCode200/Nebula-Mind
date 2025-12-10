const notebookId = '692be3544e33ef9bce8b8b15';

async function testChat() {
    try {
        const response = await fetch('http://127.0.0.1:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                notebookId: notebookId,
                message: 'What is this PDF about?',
                history: [],
                modelProvider: 'ollama'
            })
        });

        if (!response.ok) {
            console.error('API Error:', response.status, response.statusText);
            const text = await response.text();
            console.error('Body:', text);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        console.log('--- Stream Start ---');
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            process.stdout.write(decoder.decode(value));
        }
        console.log('\n--- Stream End ---');

    } catch (error) {
        console.error('Request failed:', error);
    }
}

testChat();
