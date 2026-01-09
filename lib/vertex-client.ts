import { VertexAI } from '@google-cloud/vertexai';

// Hardcoded credentials as requested by the user
// WARNING: This is not recommended for production. Use environment variables instead.
// Credentials from environment variables
const credentials = {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    project_id: process.env.GOOGLE_PROJECT_ID
};

// Initialize Vertex AI
const vertex_ai = new VertexAI({
    project: process.env.GOOGLE_PROJECT_ID || 'nebula-mind-480116',
    location: 'us-central1',
    googleAuthOptions: {
        credentials
    }
});

// Export the model getter
export const getVertexModel = (modelName: string = 'gemini-2.0-flash') => {
    // Standardize model name for Vertex AI - using Gemini 2.0 Flash as requested
    let sanitizedModel = modelName;
    if (modelName.includes('flash')) sanitizedModel = 'gemini-2.0-flash';

    return vertex_ai.getGenerativeModel({
        model: sanitizedModel,
    });
};

export default vertex_ai;
