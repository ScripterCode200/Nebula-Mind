import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notebook from '@/models/Notebook';
import { getNotebookContent } from '@/lib/notebook-context';
import { getOrchestratorModel } from '@/lib/gemini';
import { ORCHESTRATOR_SYSTEM_PROMPT, getExecutionPrompt } from '@/lib/prompts/orchestrator';
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
            topic,
            methodology = 'Socratic',
            cacheName,
            sourceIds,
            previousModulesSummary,
            language = 'English'
        } = await req.json();

        if (!topic || !topic.title || !topic.scope) {
            return NextResponse.json({ error: 'Missing topic metadata' }, { status: 400 });
        }

        const notebook = await Notebook.findById(notebookId);
        if (!notebook) {
            return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
        }

        // Always fetch context directly (caching disabled - using direct injection)
        const context = await getNotebookContent(notebook, sourceIds);
        if (!context) {
            return NextResponse.json({ error: 'No content available' }, { status: 400 });
        }

        // Initialize Model
        const orchestrator = await getOrchestratorModel({
            systemInstruction: ORCHESTRATOR_SYSTEM_PROMPT(language),
            cachedContentName: cacheName
        });

        // Generate with seamless context continuity
        const executionPrompt = getExecutionPrompt(
            topic.title,
            topic.scope,
            context,
            methodology,
            language,
            previousModulesSummary
        );
        
        let result;
        try {
            result = await orchestrator.generateContentStream(executionPrompt);
        } catch (error: any) {
            console.warn(`[Orchestrator/Execute] Primary model failed, falling back to Gemini 2.5 Pro. Error: ${error.message}`);
            const fallbackOrchestrator = await getOrchestratorModel({
                model: 'gemini-2.0-flash-001',
                systemInstruction: ORCHESTRATOR_SYSTEM_PROMPT(language),
                cachedContentName: cacheName
            });
            result = await fallbackOrchestrator.generateContentStream(executionPrompt);
        }

        // 4. Stream Response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.stream) {
                        const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        if (chunkText) {
                            controller.enqueue(encoder.encode(chunkText));
                        }
                    }
                } catch (error) {
                    console.error('[Orchestrator/Execute] Streaming Error:', error);
                    controller.error(error);
                } finally {
                    controller.close();
                }
            }
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked'
            }
        });

    } catch (error: any) {
        console.error('Orchestrator Execute Error:', error);
        // Ensure we ALWAYS return JSON
        return new NextResponse(JSON.stringify({ 
            error: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
