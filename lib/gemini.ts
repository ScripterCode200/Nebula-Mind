import { VertexAI, CachedContent as VertexCachedContent } from '@google-cloud/vertexai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import SystemSetting from '@/models/SystemSetting';
import connectToDatabase from '@/lib/db';

const credentials = {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    project_id: process.env.GOOGLE_PROJECT_ID
};

const vertex_ai = new VertexAI({
    project: process.env.GOOGLE_PROJECT_ID || 'nebula-mind-480116',
    location: 'us-central1',
    googleAuthOptions: { credentials }
});

const standardGenAI = process.env.GEMINI_API_KEY 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) 
    : null;

/**
 * Dedicated SVG Generator instance
 * Uses the user-provided specialized key for 3.1 Flash
 */
export const svgGenAI = process.env.SVG_GENERATOR_KEY
    ? new GoogleGenerativeAI(process.env.SVG_GENERATOR_KEY)
    : standardGenAI;

/**
 * Nebula Orchestrator specialized getter
 * Uses specified model with a robust fallback chain (Vertex AI prioritized)
 */
export const getOrchestratorModel = async (options: { 
    model?: string, 
    cachedContentName?: string,
    systemInstruction?: string,
    useSvgKey?: boolean
}) => {
    // 0. Fetch configured model from DB if no specific override
    let configuredModel = options.model;
    if (!configuredModel) {
        try {
            await connectToDatabase();
            const setting = await SystemSetting.findOne({ key: 'global' }).lean();
            configuredModel = setting?.aiModel;
        } catch (e) {
            console.warn("[Orchestrator] Settings fetch failed. Using hardcoded defaults.");
        }
    }

    // Default to Gemini 2.0 Flash — Currently the most stable workhorse for this project
    const defaultModel = options.useSvgKey ? 'gemini-2.0-flash' : 'gemini-2.0-flash-001';
    const initialModel = configuredModel || defaultModel;
    
    // Fallback list logic: Prioritize 2.5 and 2.0. Relegate 3.1 to secondary fallback due to regional 404s.
    const fallbackList = [initialModel];
    if (initialModel.includes('2.0')) fallbackList.push('gemini-2.5-flash');
    if (initialModel.includes('3.1')) fallbackList.push('gemini-2.0-flash-001', 'gemini-2.5-flash');
    
    // Final defensive fallbacks
    fallbackList.push('gemini-2.0-flash-001', 'gemini-2.5-pro');
    
    let lastError: any = null;

    for (const modelName of fallbackList) {
        try {
            console.log(`[Orchestrator] Attempting to initialize model: ${modelName} (Prefer Vertex: true)`);
            
            let model;
            
            // Default to Vertex AI unless explicitly forced to UseSvgKey (Standard API)
            if (!options.useSvgKey) {
                /* 
                // Context caching is not yet available in the Vertex AI SDK version currently installed.
                if (options.cachedContentName) {
                    try {
                        console.log(`[Orchestrator] Using Context Cache: ${options.cachedContentName}`);
                        model = vertex_ai.getGenerativeModelFromCachedContent({
                            name: options.cachedContentName,
                            model: modelName
                        }, {
                            systemInstruction: options.systemInstruction ? {
                                role: 'system',
                                parts: [{ text: options.systemInstruction }]
                            } : undefined
                        });
                    } catch (e) {
                        console.warn(`[Orchestrator] Cache retrieval failed for ${modelName}, falling back to direct.`);
                    }
                }
                */

                if (!model) {
                    model = vertex_ai.getGenerativeModel({
                        model: modelName,
                        systemInstruction: options.systemInstruction ? {
                            role: 'system',
                            parts: [{ text: options.systemInstruction }]
                        } : undefined
                    });
                }
            } else {
                // Secondary fallback to Standard API if useSvgKey is true
                const genAI = svgGenAI;
                if (!genAI) throw new Error("Generative AI Key is missing for this model.");
                
                model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: options.systemInstruction
                });
            }

            return model;
        } catch (e: any) {
            lastError = e;
            console.warn(`[Orchestrator] Model ${modelName} initialization failed: ${e.message}`);
            // If it's a 404 or 503, continue to the next model in the chain
        }
    }

    throw lastError || new Error(`Failed to initialize any orchestrator model.`);
};

/**
 * Cache Management Helper
 * NOTE: Vertex AI Context Caching requires the Preview SDK version and specific
 * project allowlisting. Currently disabled — using direct context injection instead.
 */
export const createContextCache = async (metadata: {
    displayName: string,
    model: string,
    contents: any[],
    ttlSeconds?: number
}): Promise<any> => {
    // Intentionally disabled: vertex_ai.cachedContents is not available in this SDK version.
    // The orchestrator falls back gracefully to direct context injection.
    throw new Error('Context caching is not available in this environment. Using direct injection.');
};

// The central factory for AI models
export const getGenerativeModel = async (options: { model: string, [key: string]: any }) => {
    await connectToDatabase();
    const setting = await SystemSetting.findOne({ key: 'global' }).lean();
    const useVertex = setting?.useVertexAI === true;
    const dbModel = setting?.aiModel;

    // Use requested model string, or fall back to DB setting if requested was just 'flash' or similar
    let targetModel = options.model;
    if (targetModel === 'flash' || targetModel === 'gemini-flash') {
        targetModel = dbModel || 'gemini-2.0-flash-001';
    }

    if (useVertex) {
        let sanitizedModel = targetModel;
        
        // Map common aliases to specific Vertex identifiers if needed
        if (sanitizedModel === 'gemini-2.0-flash') sanitizedModel = 'gemini-2.0-flash-001';
        if (sanitizedModel === 'gemini-3.1-flash') sanitizedModel = 'gemini-3.1-flash-001'; // Try numbered version
        
        const vertexModel = vertex_ai.getGenerativeModel({ ...options, model: sanitizedModel });
        
        // Wrap generateContent to fallback to standard Gemini if Vertex fails
        const originalGenerateContent = vertexModel.generateContent.bind(vertexModel);
        const originalGenerateContentStream = vertexModel.generateContentStream?.bind(vertexModel);

        const safeGenerateContent = async (...args: any[]) => {
            try {
                return await originalGenerateContent(args[0]);
            } catch (error: any) {
                console.warn(`[AI Route] Vertex AI Failed (${error.message}). Falling back to Standard Gemini API.`);
                if (!standardGenAI) throw new Error("Fallback failed: Standard GEMINI_API_KEY is not configured.");
                const stdModel = standardGenAI.getGenerativeModel({ ...options, model: 'gemini-2.0-flash' });
                return await stdModel.generateContent(args[0]);
            }
        };

        const safeGenerateContentStream = async (...args: any[]) => {
            try {
                if (!originalGenerateContentStream) throw new Error("Stream not supported by client");
                return await originalGenerateContentStream(args[0]);
            } catch (error: any) {
                console.warn(`[AI Route] Vertex AI Stream Failed (${error.message}). Falling back to Standard Gemini API.`);
                if (!standardGenAI) throw new Error("Fallback failed: Standard GEMINI_API_KEY is not configured.");
                const stdModel = standardGenAI.getGenerativeModel({ ...options, model: 'gemini-2.0-flash' });
                return await stdModel.generateContentStream(args[0]);
            }
        };

        return {
            ...vertexModel,
            generateContent: safeGenerateContent,
            generateContentStream: safeGenerateContentStream
        } as any;
    }

    // Default to Standard Gemini API
    if (!standardGenAI) {
        console.error("CRITICAL ERROR: GEMINI_API_KEY is missing, but Vertex AI is disabled.");
        throw new Error("Standard Gemini API Key is missing. Please configure GEMINI_API_KEY in .env.local.");
    }
    
    return standardGenAI.getGenerativeModel({ ...options, model: targetModel });
};

// Default high-performance references (using Gemini 2.0 as Backbone)
export const model = vertex_ai.getGenerativeModel({ model: "gemini-2.0-flash-001" });
export const visionModel = vertex_ai.getGenerativeModel({ model: "gemini-2.0-flash-001" });
export const imagenModel = vertex_ai.getGenerativeModel({ model: "imagen-3.0-generate-001" });
export default vertex_ai;



