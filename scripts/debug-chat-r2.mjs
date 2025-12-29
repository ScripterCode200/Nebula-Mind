
import fetch from 'node-fetch';

async function testChatApi() {
    const notebookId = '6952ae647eb97df8be734783';
    const url = 'http://localhost:3000/api/chat';

    console.log(`Testing Chat API for Notebook: ${notebookId}`);

    const payload = {
        notebookId: notebookId,
        message: "What is this document about? Reply in 1 short sentence.",
        history: [],
        modelProvider: "openai" // or "gemini" if configured
    };

    try {
        console.log(`Sending POST to ${url}...`);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            console.log('Error status:', res.status);
            console.log(await res.text());
            return;
        }

        console.log('Response Status:', res.status);

        // The response is a stream, so we read it
        const reader = res.body;
        // node-fetch v3 returns a Node.js Readable stream
        reader.on('data', (chunk) => {
            console.log('Chunk:', chunk.toString());
        });

        reader.on('end', () => {
            console.log('Stream finished.');
        });

    } catch (err) {
        console.error('Fetch failed:', err);
    }
}

testChatApi();
