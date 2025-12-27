
const { VertexAI } = require('@google-cloud/vertexai');
require('dotenv').config({ path: '.env.local' });

async function check() {
    console.log("Checking 2.5...");
    const vertex_ai = new VertexAI({
        project: process.env.GOOGLE_PROJECT_ID || 'nebula-mind-480116',
        location: 'us-central1'
    });

    try {
        const model = vertex_ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const resp = await model.generateContent("Hello");
        console.log(`SUCCESS: gemini-2.5-flash worked!`);
    } catch (e) {
        console.log(`FAIL: gemini-2.5-flash - ${e.message}`);
    }
}

check();
