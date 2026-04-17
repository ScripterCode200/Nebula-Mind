import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notebook from '@/models/Notebook';
import { getNotebookContent } from '@/lib/notebook-context';
import { getOrchestratorModel, createContextCache } from '@/lib/gemini';
import { ORCHESTRATOR_SYSTEM_PROMPT, getDeconstructionPrompt } from '@/lib/prompts/orchestrator';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        await connectToDatabase();
        const { 
            notebookId, 
            methodology = 'Socratic', 
            sourceIds, 
            useCache = true,
            language = 'English'
        } = await req.json();

        const notebook = await Notebook.findById(notebookId);
        if (!notebook) {
            return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
        }

        // 1. Fetch Context
        const context = await getNotebookContent(notebook, sourceIds);
        if (!context) {
            return NextResponse.json({ error: 'No content available in selected sources' }, { status: 400 });
        }

        // 2. Initialize Model (Gemini 2.0 Flash)
        const orchestrator = await getOrchestratorModel({
            systemInstruction: ORCHESTRATOR_SYSTEM_PROMPT(language)
        });

        // 3. Deconstruct into TopicTree
        console.log(`[Orchestrator/Init] Deconstructing "${notebook.title}"...`);
        const deconstructionPrompt = getDeconstructionPrompt(notebook.title, context, methodology, language);
        const result = await orchestrator.generateContent(deconstructionPrompt);
        const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        
        // Extract JSON from response
        const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
        let topicTree;
        try {
            topicTree = JSON.parse(cleanJson);
        } catch (e) {
            console.error('[Orchestrator/Init] JSON Parse Error:', responseText);
            throw new Error('Failed to generate a valid TopicTree.');
        }

        // 4. Create Context Cache for "Execute" phase (Optional but Recommended)
        let cacheName = null;
        if (useCache && context.length > 2048) {
            try {
                const cache = await createContextCache({
                    displayName: `Orchestrator_${notebookId}`,
                    model: 'gemini-2.0-flash-001', // Explicitly use a cache-compatible model version
                    contents: [{ role: 'user', parts: [{ text: context }] }],
                    ttlSeconds: 3600 // 1 hour
                });
                cacheName = cache.name;
                console.log(`[Orchestrator/Init] Context Cache Created: ${cacheName}`);
            } catch (cacheError) {
                console.warn('[Orchestrator/Init] Cache creation failed, will use direct injection.', cacheError);
            }
        }

        return NextResponse.json({
            topicTree,
            cacheName,
            notebookTitle: notebook.title
        });

    } catch (error: any) {
        console.error('Orchestrator Init Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
