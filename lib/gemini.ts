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

// Helper to get a model instance with the Vertex SDK
// We wrap it to match the previous export shape if possible, or export the vertex instance
const getModel = (modelName: string): GenerativeModel => {
    return vertex_ai.getGenerativeModel({ model: modelName });
};

export const model = getModel("gemini-2.5-flash");
export const visionModel = getModel("gemini-2.5-flash");

export default vertex_ai;

