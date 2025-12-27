import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';

// Credentials provided by user in .env.local
const credentials = {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    project_id: process.env.GOOGLE_PROJECT_ID
};

const vertex_ai = new VertexAI({
    project: process.env.GOOGLE_PROJECT_ID || 'nebula-mind-480116',
    location: 'us-central1',
    googleAuthOptions: {
        credentials
    }
});

const getModel = (modelName: string): GenerativeModel => {
    // Standardize model name for Vertex AI - 1.5-flash-002 is stable and fast
    let sanitizedModel = modelName;
    if (modelName === 'gemini-2.5-flash' || modelName.includes('2.5')) sanitizedModel = 'gemini-1.5-flash-002';

    return vertex_ai.getGenerativeModel({ model: sanitizedModel });
};

export const model = getModel("gemini-1.5-flash-002");
export const visionModel = getModel("gemini-1.5-flash-002");

export default vertex_ai;

