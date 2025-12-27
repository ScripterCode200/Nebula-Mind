const { VertexAI } = require('@google-cloud/vertexai');
require('dotenv').config({ path: '.env.local' });

async function verify() {
    console.log("Project:", process.env.GOOGLE_PROJECT_ID);

    // Fix newlines in private key
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
        ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined;

    const vertex_ai = new VertexAI({
        project: process.env.GOOGLE_PROJECT_ID || 'nebula-mind-480116',
        location: 'us-central1',
        googleAuthOptions: {
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: privateKey,
                project_id: process.env.GOOGLE_PROJECT_ID
            }
        }
    });

    const models = [
        "gemini-2.5-flash",
        "gemini-2.0-flash-001",
        "gemini-2.0-flash-exp",
        "gemini-1.5-pro-002" // Fallback high qual
    ];

    for (const m of models) {
        try {
            console.log(`Testing ${m}...`);
            const model = vertex_ai.getGenerativeModel({ model: m });
            const resp = await model.generateContent("Hello");
            console.log(`SUCCESS: ${m} works!`);
            const response = await resp.response;
            console.log("Response:", JSON.stringify(response, null, 2));
        } catch (e) {
            console.error(`FAIL: ${m}`, e.message);
        }
    }
}

verify();
