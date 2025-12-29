// Force build refresh
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
        const { notebookId, message, history, modelProvider, sourceIds } = reqBody;

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
        // Context Retrieval Strategy
        // Use helper to fetch from R2 or Mongo
        const { getNotebookContent } = await import('@/lib/notebook-context');
        let context = await getNotebookContent(notebook, sourceIds);

        // Truncate context for Nebula 3 (Phi 3.5) and Ollama as requested
        if (modelProvider === 'phi3.5:3.8b' || modelProvider === 'ollama') {
            const MAX_CONTEXT_LENGTH = 30000;
            if (context.length > MAX_CONTEXT_LENGTH) {
                context = context.substring(0, MAX_CONTEXT_LENGTH) + "... (truncated)";
                console.log(`[Chat API] ${modelProvider} provider. Context truncated to ${MAX_CONTEXT_LENGTH} chars.`);
            } else {
                console.log(`[Chat API] ${modelProvider} provider. Using full PDF content (length: ${context.length}).`);
            }
        } else {
            console.log(`[Chat API] Using full PDF content (unlimited context) for ${modelProvider}. Length: ${context.length}`);
        }

        // Extract metadata
        const notebookName = notebook.title;
        const pdfName = notebook.pdfUrl.split('/').pop() || 'Unknown PDF';

        const systemPrompt = `You are Nebula, an AI assistant for this notebook: "${notebookName}".
        
        TOPIC: ${notebookName}
        
        CONTEXT (PDF Content):
        ${context}
        
        INSTRUCTIONS:
        - Answer based PRIMARILY on the Context above.
        - If the answer is missing, say so politely.
        - Keep answers concise and helpful.
        - FORMATTING: Use Markdown (bold, lists, code blocks for code snippets only) to make your response easy to read.
        - IMPORTANT: Do NOT wrap your entire response in a markdown code block (like \`\`\`markdown ... \`\`\`). Return the raw markdown directly.`;

        console.log('[Chat API] System Prompt Preview:', systemPrompt.substring(0, 200) + '...');
        console.log('[Chat API] Full Context Length in Prompt:', context.length);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                let fullAiResponse = '';
                let isStreamClosed = false;
                try {
                    if (modelProvider === 'openai') {
                        const messages = [
                            { role: "system" as const, content: systemPrompt },
                            { role: "user" as const, content: message }
                        ];
                        console.log('[Chat API] OpenAI Payload Messages:');
                        messages.forEach((msg, index) => {
                            console.log(`[Message ${index} - ${msg.role}] Length: ${msg.content.length}`);
                            console.log(msg.content);
                        });

                        const completion = await openai.chat.completions.create({
                            model: "gpt-4o",
                            messages: messages,
                            stream: true,
                            stream_options: { include_usage: true },
                        });

                        for await (const chunk of completion) {
                            const chunkText = chunk.choices[0]?.delta?.content || '';
                            if (chunkText) {
                                fullAiResponse += chunkText;
                                try {
                                    controller.enqueue(encoder.encode(chunkText));
                                } catch (e) {
                                    console.warn('Controller closed during enqueue (OpenAI), stopping stream.');
                                    isStreamClosed = true;
                                    break;
                                }
                            }
                            if (chunk.usage) {
                                const { logTokenUsage } = await import('@/lib/token-cost');
                                logTokenUsage('Chat API (OpenAI)', "gpt-4o", {
                                    promptTokenCount: chunk.usage.prompt_tokens,
                                    candidatesTokenCount: chunk.usage.completion_tokens,
                                    totalTokenCount: chunk.usage.total_tokens
                                });
                            }
                        }
                    } else if (modelProvider === 'ollama' || modelProvider === 'phi3.5:3.8b') {
                        const messages = [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: message }
                        ];

                        console.log('[Chat API] Ollama Payload Messages:');
                        messages.forEach((msg, index) => {
                            console.log(`[Message ${index} - ${msg.role}]:`);
                            console.log(msg.content);
                        });

                        let ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
                        let modelName = "llama3.2:latest";

                        if (modelProvider === 'phi3.5:3.8b') {
                            ollamaBaseUrl = "http://72.61.231.120:11434";
                            modelName = "phi3.5:3.8b";
                        }

                        // Robust URL sanitization
                        if (ollamaBaseUrl.endsWith('/')) {
                            ollamaBaseUrl = ollamaBaseUrl.slice(0, -1);
                        }
                        if (ollamaBaseUrl.endsWith('/api/chat')) {
                            ollamaBaseUrl = ollamaBaseUrl.slice(0, -9);
                        }

                        console.log(`[Chat API] Connecting to Ollama at "${ollamaBaseUrl}" with model "${modelName}"...`);

                        const body: any = {
                            model: modelName,
                            messages: messages,
                            stream: true
                        };

                        // Check for "/bye" command to unload model (stop server)
                        if (message.toLowerCase().includes('/bye')) {
                            console.log('[Chat API] "/bye" detected. Setting keep_alive to 0s to unload model.');
                            body.keep_alive = 0;
                        }

                        const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(body),
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
                                // Log partial metrics if available on done (Ollama sometimes sends them in the last chunk or done chunk)
                                // JSON parsing below handles the final chunk content, checking logic there.
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
                                    if (json.done) {
                                        if (json.prompt_eval_count || json.eval_count) {
                                            const { logTokenUsage } = await import('@/lib/token-cost');
                                            logTokenUsage('Chat API (Ollama)', modelName, {
                                                promptTokenCount: json.prompt_eval_count,
                                                candidatesTokenCount: json.eval_count
                                            });
                                        }
                                        break;
                                    }
                                } catch (e: any) {
                                    console.error('Error parsing Ollama chunk:', e);
                                    if (e.message && e.message.includes('closed')) {
                                        isStreamClosed = true;
                                        break;
                                    }
                                }
                            }
                            if (isStreamClosed) break;
                        }
                    } else {
                        // Vertex AI Logic (Gemini 2.5 Flash)
                        const { getVertexModel } = await import('@/lib/vertex-client');

                        // Helper to run chat stream with fallback
                        const runChatStream = async (modelName: string) => {
                            console.log(`[Chat API] Attempting to use model: ${modelName}`);
                            console.log('[Chat API] Gemini User Message:', message);
                            console.log('[Chat API] Gemini System Prompt (First 500 chars):', systemPrompt.substring(0, 500) + '...');
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

                        let activeModel = 'gemini-2.5-flash';
                        let result;
                        try {
                            // Try verified model first
                            result = await runChatStream("gemini-2.5-flash");
                        } catch (error: any) {
                            console.warn(`[Chat API] Failed with gemini-2.5-flash: ${error.message}`);
                            // Try preview model
                            try {
                                console.log('[Chat API] Falling back to gemini-2.5-flash-preview-001...');
                                activeModel = 'gemini-2.5-flash-preview-001';
                                result = await runChatStream("gemini-2.5-flash-preview-001");
                            } catch (previewError: any) {
                                console.warn(`[Chat API] Failed with gemini-2.5-flash-preview-001: ${previewError.message}`);
                                // Fallback to 1.5 Flash
                                if (error.message?.includes('404') || error.message?.includes('NOT_FOUND') || previewError.message?.includes('404')) {
                                    console.log('[Chat API] Falling back to gemini-1.5-flash-001...');
                                    activeModel = 'gemini-1.5-flash-001';
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
                                try {
                                    controller.enqueue(encoder.encode(chunkText));
                                } catch (e) {
                                    console.warn('Controller closed during enqueue (Vertex), stopping stream.');
                                    isStreamClosed = true;
                                    break;
                                }
                            }
                            // Vertex AI sends usage metadata in the last chunk (or cumulatively)
                            if (chunk.usageMetadata) {
                                const { logTokenUsage } = await import('@/lib/token-cost');
                                logTokenUsage('Chat API', activeModel, chunk.usageMetadata);
                            }
                        }
                    }

                    // Save AI Response
                    if (fullAiResponse) {
                        if (modelProvider === 'phi3.5:3.8b') {
                            console.log('Response by Nebula 3.0:', fullAiResponse);
                        } else if (modelProvider === 'openai') {
                            console.log('Response by GPT-4o:', fullAiResponse);
                        } else if (modelProvider === 'gemini') {
                            console.log('Response by Gemini:', fullAiResponse);
                        } else {
                            console.log('Response by Ollama:', fullAiResponse);
                        }

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
                    if (!isStreamClosed) {
                        try {
                            controller.error(error);
                            isStreamClosed = true;
                        } catch (e) { }
                    }
                } finally {
                    if (!isStreamClosed) {
                        try {
                            controller.close();
                        } catch (e) { console.error('Error closing controller:', e) }
                    }
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
