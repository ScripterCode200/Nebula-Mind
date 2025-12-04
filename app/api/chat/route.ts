import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notebook from '@/models/Notebook';
import Chat from '@/models/Chat';
import openai from '@/lib/openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Removed RAG imports

// Initialize Gemini
// Initialize Gemini lazily inside handler

interface ChatMessage {
    role: string;
    content: string;
}

export async function POST(req: NextRequest) {
    try {
        console.log('[Chat API] Request received');
        await connectToDatabase();
        const reqBody = await req.json();
        const { notebookId, message, history, modelProvider } = reqBody;

        if (!notebookId || !message) {
            return NextResponse.json({ error: 'Notebook ID and message are required' }, { status: 400 });
        }

        const notebook = await Notebook.findById(notebookId);
        if (!notebook) {
            return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
        }

        // Find or Create Chat Session
        let chat = await Chat.findOne({ notebookId });
        if (!chat) {
            chat = await Chat.create({ notebookId, messages: [] });
        }

        // Save User Message
        console.log(`[Chat API] Saving user message for notebook ${notebookId}`);
        chat.messages.push({ role: 'user', content: message, timestamp: new Date() });
        await chat.save();
        console.log(`[Chat API] User message saved. History length: ${chat.messages.length}`);

        // Context Retrieval Strategy
        // RAG has been removed. Using full PDF content.
        let context = notebook.pdfContent || '';
        console.log('[Chat API] Using full PDF content');

        // Truncate if still too long (safety net)
        // Truncate if still too long (safety net), but allow full context for Gemini
        if (modelProvider !== 'gemini') {
            const MAX_CONTEXT_LENGTH = 8000; // Keep conservative for OpenAI/Ollama
            if (context.length > MAX_CONTEXT_LENGTH) {
                context = context.substring(0, MAX_CONTEXT_LENGTH) + "... (truncated)";
            }
        } else {
            console.log('[Chat API] Gemini provider detected. Using full PDF content (unlimited context).');
        }

        // Extract metadata
        const notebookName = notebook.title;
        const pdfName = notebook.pdfUrl.split('/').pop() || 'Unknown PDF';

        const systemPrompt = `You are Nebula, an AI assistant for this notebook: "${notebookName}".
        
        CONTEXT (PDF Content):
        ${context}
        
        INSTRUCTIONS:
        - Answer based PRIMARILY on the Context above.
        - If the answer is missing, say so politely.
        - Keep answers concise and helpful.
        - FORMATTING: Use Markdown (bold, lists, code blocks) to make your response easy to read.`;

        console.log('[Chat API] System Prompt Preview:', systemPrompt.substring(0, 200) + '...');
        console.log('[Chat API] Full Context Length in Prompt:', context.length);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                let fullAiResponse = '';
                try {
                    if (modelProvider === 'openai') {
                        const completion = await openai.chat.completions.create({
                            model: "gpt-4o",
                            messages: [
                                { role: "system", content: systemPrompt },
                                { role: "user", content: message }
                            ],
                            stream: true,
                        });

                        for await (const chunk of completion) {
                            const content = chunk.choices[0]?.delta?.content || '';
                            if (content) {
                                fullAiResponse += content;
                                controller.enqueue(encoder.encode(content));
                            }
                        }
                    } else if (modelProvider === 'ollama') {
                        const messages = [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: message }
                        ];

                        console.log('[Chat API] Ollama Payload Messages (Preview):');
                        messages.forEach((msg, index) => {
                            const preview = msg.content.length > 500 ? msg.content.substring(0, 500) + '... [truncated]' : msg.content;
                            console.log(`[Message ${index} - ${msg.role}]: ${preview}`);
                        });

                        let ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

                        // Robust URL sanitization
                        if (ollamaBaseUrl.endsWith('/')) {
                            ollamaBaseUrl = ollamaBaseUrl.slice(0, -1);
                        }
                        if (ollamaBaseUrl.endsWith('/api/chat')) {
                            ollamaBaseUrl = ollamaBaseUrl.slice(0, -9);
                        }

                        console.log(`[Chat API] Connecting to Ollama at "${ollamaBaseUrl}"...`);
                        const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                model: "llama3.2:latest",
                                messages: messages,
                                stream: true
                            }),
                            signal: AbortSignal.timeout(480000) // 8 minutes timeout
                        });

                        console.log(`[Chat API] Ollama response status: ${response.status}`);

                        if (!response.ok) {
                            throw new Error(`Ollama API error: ${response.statusText}`);
                        }

                        if (!response.body) throw new Error('No response body');
                        const reader = response.body.getReader();
                        const decoder = new TextDecoder();
                        console.log('[Chat API] Starting to read Ollama stream...');

                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) {
                                console.log('[Chat API] Ollama stream finished.');
                                break;
                            }
                            // console.log('[Chat API] Received chunk'); // Too noisy
                            const chunk = decoder.decode(value, { stream: true });
                            const lines = chunk.split('\n');

                            for (const line of lines) {
                                if (!line.trim()) continue;
                                try {
                                    const json = JSON.parse(line);
                                    if (json.message?.content) {
                                        const content = json.message.content;
                                        fullAiResponse += content;
                                        controller.enqueue(encoder.encode(content));
                                    }
                                    if (json.done) break;
                                } catch (e) {
                                    console.error('Error parsing Ollama chunk:', e);
                                }
                            }
                        }
                    } else {
                        // Vertex AI Logic (Gemini 2.5 Flash)
                        const { getVertexModel } = await import('@/lib/vertex-client');

                        // Helper to run chat stream with fallback
                        const runChatStream = async (modelName: string) => {
                            console.log(`[Chat API] Attempting to use model: ${modelName}`);
                            const model = getVertexModel(modelName);
                            const chat = model.startChat({
                                history: [
                                    {
                                        role: "user",
                                        parts: [{ text: systemPrompt }],
                                    },
                                    {
                                        role: "model",
                                        parts: [{ text: "Understood. I am ready to answer questions about the notebook content." }],
                                    },
                                ],
                            });
                            return await chat.sendMessageStream(message);
                        };

                        let result;
                        try {
                            // Try verified model first
                            result = await runChatStream("gemini-2.5-flash");
                        } catch (error: any) {
                            console.warn(`[Chat API] Failed with gemini-2.5-flash: ${error.message}`);
                            // Try preview model
                            try {
                                console.log('[Chat API] Falling back to gemini-2.5-flash-preview-001...');
                                result = await runChatStream("gemini-2.5-flash-preview-001");
                            } catch (previewError: any) {
                                console.warn(`[Chat API] Failed with gemini-2.5-flash-preview-001: ${previewError.message}`);
                                // Fallback to 1.5 Flash
                                if (error.message?.includes('404') || error.message?.includes('NOT_FOUND') || previewError.message?.includes('404')) {
                                    console.log('[Chat API] Falling back to gemini-1.5-flash-001...');
                                    result = await runChatStream("gemini-1.5-flash-001");
                                } else {
                                    throw error;
                                }
                            }
                        }

                        for await (const chunk of result.stream) {
                            const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
                            if (chunkText) {
                                fullAiResponse += chunkText;
                                controller.enqueue(encoder.encode(chunkText));
                            }
                            // Vertex AI sends usage metadata in the last chunk (or cumulatively)
                            if (chunk.usageMetadata) {
                                const { logTokenUsage } = await import('@/lib/token-cost');
                                logTokenUsage('Chat API', chunk.usageMetadata);
                            }
                        }
                    }

                    // Save AI Response
                    if (fullAiResponse) {
                        console.log(`[Chat API] Saving AI response for notebook ${notebookId}`);
                        await Chat.findOneAndUpdate(
                            { notebookId },
                            {
                                $push: {
                                    messages: {
                                        role: 'ai',
                                        content: fullAiResponse,
                                        timestamp: new Date()
                                    }
                                }
                            }
                        );
                        console.log(`[Chat API] AI response saved.`);
                    }

                } catch (error) {
                    console.error('Streaming error:', error);
                    controller.error(error);
                } finally {
                    controller.close();
                }
            }
        });

        return new NextResponse(stream);

    } catch (error: unknown) {
        console.error('Chat error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            error: 'Failed to generate response',
            details: errorMessage
        }, { status: 500 });
    }
}
