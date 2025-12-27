const { VertexAI } = require('@google-cloud/vertexai');

// Hardcode env vars for the test script or use dotenv
require('dotenv').config({ path: '.env.local' });

const project = process.env.GOOGLE_PROJECT_ID;
const location = 'us-central1'; // Common location, checking if this is the issue too
const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS; // If file based, but here we likely rely on key content in env

// If using the manual auth method from lib/gemini.ts structure:
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

async function testModel(modelName) {
    console.log(`\nTesting: ${modelName}`);
    try {
        const vertex_ai = new VertexAI({
            project: project, location: location, googleAuthOptions: {
                credentials: {
                    client_email: clientEmail,
                    private_key: privateKey
                }
            }
        });
        const model = vertex_ai.getGenerativeModel({ model: modelName });

        const req = {
            contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
        };

        const res = await model.generateContent(req);
        const text = res.response.candidates[0].content.parts[0].text;
        console.log(`✅ SUCCESS: ${modelName} responded: "${text.trim()}"`);
        return true;
    } catch (e) {
        console.log(`❌ FAILED: ${modelName} - ${e.message.split(' ').slice(0, 10).join(' ')}...`);
        return false;
    }
}

async function run() {
    if (!project || !clientEmail || !privateKey) {
        console.error("Missing Env credentials");
        return;
    }

    const candidates = [
        'gemini-2.0-flash-exp',
        'gemini-2.0-flash',
        'gemini-2.0-flash-001',
        'gemini-1.5-flash-002',
        'gemini-1.5-flash',
        'gemini-1.5-pro-002'
    ];

    for (const m of candidates) {
        await testModel(m);
    }
}

run();
