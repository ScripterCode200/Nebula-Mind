import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notebook from '@/models/Notebook';
import Note from '@/models/Note';
import Flashcard from '@/models/Flashcard';
import MockTest from '@/models/MockTest';
import { model } from '@/lib/gemini';
import openai from '@/lib/openai';

// Helper to extract JSON from potential markdown code blocks
function extractJson(text: string) {
    try {
        // Remove markdown code blocks if present
        const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();

        // Try parsing directly first
        return JSON.parse(cleanText);
    } catch {
        // If that fails, try to find the first '[' or '{' and the last ']' or '}'
        const firstOpen = text.search(/[\{\[]/);
        const lastClose = text.search(/[\}\]][^}\]]*$/);

        if (firstOpen !== -1 && lastClose !== -1) {
            const jsonStr = text.substring(firstOpen, lastClose + 1);
            try {
                return JSON.parse(jsonStr);
            } catch {
                throw new Error('Failed to extract valid JSON from response');
            }
        }
        throw new Error('No JSON found in response');
    }
}

async function generateWithProvider(prompt: string, modelProvider: string, options: { jsonMode?: boolean, modelName?: string } = {}) {
    console.log(`[Generate API] Sending request to provider: ${modelProvider}`);
    console.log('[Generate API] Prompt Payload:');
    console.log(prompt);
    if (modelProvider === 'openai') {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o",
            response_format: options.jsonMode ? { type: "json_object" } : undefined,
            stream_options: { include_usage: true }, // Request usage stats
        });
        return completion.choices[0].message.content || '';
    } else if (modelProvider === 'ollama' || modelProvider === 'phi3.5:3.8b') {
        let ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
        let modelName = "llama3.2:latest";

        if (modelProvider === 'phi3.5:3.8b') {
            ollamaBaseUrl = "http://72.61.231.120:11434";
            modelName = "phi3.5:3.8b";
        }

        console.log(`Generating with Ollama (${modelName}) at ${ollamaBaseUrl}...`);

        const body: any = {
            model: modelName,
            messages: [{ role: "user", content: prompt }],
            stream: false
        };

        if (options.jsonMode) {
            body.format = "json";
        }

        const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(600000) // 10 minutes timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ollama Generate API Error:', errorText);
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Ollama Generate Raw Output:', data.message.content);
        return data.message.content;
    } else {
        // Unified AI Logic
        const { getGenerativeModel } = await import('@/lib/gemini');

        // Determine which model to use
        // If modelProvider is a specific Gemini model (e.g. gemini-3.1-flash), use it.
        // If it's the generic 'gemini', check options.modelName or default to the system's preferred flash model.
        let targetModel = "gemini-flash";

        if (modelProvider.startsWith('gemini-') && modelProvider !== 'gemini') {
            targetModel = modelProvider;
        } else if (options.modelName) {
            targetModel = options.modelName;
        }

        const runGenerate = async (modelName: string) => {
            console.log(`[Generate API Helper] Attempting to use model: ${modelName}`);
            const model = await getGenerativeModel({ model: modelName });
            return await model.generateContent(prompt);
        };

        let result;
        try {
            result = await runGenerate(targetModel);
        } catch (error: any) {
            console.warn(`[Generate API Helper] Failed with ${targetModel}: ${error.message}`);

            // Fallback Strategy
            // 1. If we tried a 3.x model, fallback to 2.5
            if (targetModel.includes('3.')) {
                try {
                    console.log('[Generate API Helper] Falling back to gemini-2.5-flash...');
                    result = await runGenerate("gemini-2.5-flash");
                } catch (e) {
                    // 2. If 2.5 fails, throw
                    throw e;
                }
            } else {
                // Legacy fallback for older variants
                try {
                    console.log('[Generate API Helper] Falling back to gemini-2.0-flash-001...');
                    result = await runGenerate("gemini-2.0-flash-001");
                } catch (previewError: any) {
                    throw previewError;
                }
            }
        }

        // Ensure we have a result
        if (!result) throw new Error(`All attempts failed for model ${targetModel}`);

        const response = await result.response;
        if (response.usageMetadata) {
            const { logTokenUsage } = await import('@/lib/token-cost');
            logTokenUsage('Generate API Helper', targetModel, response.usageMetadata);
        }
        return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
}

interface FlashcardData {
    front: string;
    back: string;
}

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { notebookId, type, config, modelProvider = 'gemini' } = await req.json();
        console.log('Generate Request:', { type, config, modelProvider });

        const notebook = await Notebook.findById(notebookId);
        if (!notebook) {
            return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
        }

        // Context Strategy
        // Context Strategy
        // Use helper to fetch from R2 or Mongo, filtering by config.sourceIds if present
        const { getNotebookContent } = await import('@/lib/notebook-context');
        let context = await getNotebookContent(notebook, config?.sourceIds);

        // Truncate context for Nebula 3 (Phi 3.5) and Ollama as requested
        if (modelProvider === 'phi3.5:3.8b' || modelProvider === 'ollama') {
            const MAX_GENERATE_CONTEXT = 30000;
            if (context.length > MAX_GENERATE_CONTEXT) {
                context = context.substring(0, MAX_GENERATE_CONTEXT);
                console.log(`[Generate API] ${modelProvider} provider. Context truncated to ${MAX_GENERATE_CONTEXT} chars.`);
            } else {
                console.log(`[Generate API] Using full PDF content (length: ${context.length}).`);
            }
        } else {
            console.log(`[Generate API] Using full PDF content (unlimited context) for ${modelProvider}. Length: ${context.length}`);
        }

        let prompt = '';
        let resultData;

        switch (type) {
                        case 'notes':
                const wordCount = context.length / 5;
                const targetIterations = Math.max(2, Math.ceil(wordCount / 450));
                
                if (config.phase === 'primer') {
                    prompt = `
You are an expert Educational Content Architect. Phase 1: The Primer.
Target Iterations for this content: ${targetIterations}.
Based on the content, identify the ${targetIterations} most critical logical milestones.

Before diving into details, provide a high-level orientation:
Overview: A 3-sentence "Big Picture" of the topic.
What You'll Learn: A bulleted list of 3-5 specific learning objectives.
Cognitive Map: A brief explanation of how the following iterations are logically connected.

Constraints & Style:
Tone: Academic yet accessible, encouraging, and crisp.
Formatting: Use Markdown headers (##, ###) for clarity.
IMPORTANT: Return the raw markdown text directly. Do NOT output the actual iterations. Only output Phase 1. Do NOT wrap the entire output in a code block.

Topic: ${notebook.title}
Target Type: ${config.type} notes
${config.customInstructions ? `SPECIAL USER INSTRUCTIONS:
${config.customInstructions}` : ''}

Context (Source Content to Process):
${context}
`;
                } else if (config.phase === 'iteration_batch') {
                    const startIt = config.startIteration || 1;
                    const endIt = config.endIteration || 2;
                    prompt = `
You are an expert Educational Content Architect. Phase 2: The Iterative Deep-Dive.
You are generating Iterations ${startIt} to ${endIt} out of ${targetIterations} total iterations.

Divide the following source content into logical, manageable "iterations" (concepts) as previously mapped.
For EACH iteration from ${startIt} to ${endIt}, produce the following two parts:

Part A: Textual Content
Heading: Iteration Number & Title (e.g., "## Iteration ${startIt}: [Title]").
The "Core" Explanation: A concise, high-density explanation of the concept.
Active Recall Sidebar: One "Why this matters" or "Pro-Tip" insight.
Key Terminology: Bold critical terms with brief definitions.

Part B: Visual Anchor (SVG)
Identify if the concept is a Static Structure (use Static SVG) or a Process/Flow (use Animated SVG).
SVG Code Requirements: 
* ALWAYS wrap everything in a valid <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"> container.
* Output clean, minimalist, responsive SVG code.
* STRICT VISUAL STYLE GUIDE: All SVGs must use stroke-width="2" and a color palette of #3B82F6 (primary nodes), #10B981 (secondary), #94A3B8 (connectors), and #1F2937 (text).
* If Animated, use <animate> or <animateTransform> tags to demonstrate the concept.
* IMPORTANT: You MUST wrap the SVG code in a markdown code block with the language identifier "render-svg". Do NOT output raw tags directly in the main text.

Constraints & Style:
Tone: Academic yet accessible.
Formatting: Use Markdown headers for clarity.
Return the raw markdown text directly, with embedded SVGs inline.

Topic: ${notebook.title}
${config.customInstructions ? `SPECIAL USER INSTRUCTIONS:
${config.customInstructions}` : ''}

Context (Source Content to Process):
${context}
`;
                } else if (config.phase === 'synthesis') {
                    prompt = `
You are an expert Educational Content Architect. Phase 3: The Synthesis.
Once all iterations are complete, provide the final consolidation of the topic:

The Executive TL;DR: A high-level recap of the entire source.
The "Connect the Dots" Summary: One paragraph explaining how all iterations function together as a single system.
Knowledge Check: 3 provocative, open-ended questions designed to test deep understanding.

Constraints & Style:
Tone: Academic yet accessible.
Formatting: Use Markdown headers (##, ###) for clarity.
Return the raw markdown text directly, avoiding code block wrappers.

Topic: ${notebook.title}
${config.customInstructions ? `SPECIAL USER INSTRUCTIONS:
${config.customInstructions}` : ''}

Context (Source Content to Process):
${context}
`;
                } else {
                    prompt = `You are an expert. [Monolithic fallback]`;
                }

                const encoder = new TextEncoder();
                const stream = new ReadableStream({
                    async start(controller) {
                        let fullContent = '';
                        let isStreamClosed = false;
                        try {
                            if (config.phase === 'primer') {
                                const metaStr = `<!-- META_ITERATIONS: ${targetIterations} -->\n\n`;
                                controller.enqueue(encoder.encode(metaStr));
                                fullContent += metaStr;
                            }
                            if (modelProvider === 'openai') {
                                const completion = await openai.chat.completions.create({
                                    messages: [{ role: "user", content: prompt }],
                                    model: "gpt-4o",
                                    stream: true,
                                    stream_options: { include_usage: true },
                                });

                                for await (const chunk of completion) {
                                    const content = chunk.choices[0]?.delta?.content || '';
                                    if (content) {
                                        fullContent += content;
                                        try {
                                            controller.enqueue(encoder.encode(content));
                                        } catch (e) {
                                            console.warn('Controller closed during enqueue (OpenAI), stopping stream.');
                                            isStreamClosed = true;
                                            break;
                                        }
                                    }
                                    if (chunk.usage) {
                                        const { logTokenUsage } = await import('@/lib/token-cost');
                                        logTokenUsage('Generate API (OpenAI)', "gpt-4o", {
                                            promptTokenCount: chunk.usage.prompt_tokens,
                                            candidatesTokenCount: chunk.usage.completion_tokens,
                                            totalTokenCount: chunk.usage.total_tokens
                                        });
                                    }
                                }
                            } else if (modelProvider === 'ollama' || modelProvider === 'phi3.5:3.8b') {
                                let ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
                                let modelName = "llama3.2:latest";

                                if (modelProvider === 'phi3.5:3.8b') {
                                    ollamaBaseUrl = "http://72.61.231.120:11434";
                                    modelName = "phi3.5:3.8b";
                                }

                                const body = {
                                    model: modelName,
                                    messages: [{ role: "user", content: prompt }],
                                    stream: true
                                };

                                const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(body),
                                    signal: AbortSignal.timeout(600000)
                                });

                                if (!response.ok) throw new Error(response.statusText);
                                if (!response.body) throw new Error('No response body');

                                const reader = response.body.getReader();
                                const decoder = new TextDecoder();

                                while (true) {
                                    const { done, value } = await reader.read();
                                    if (done) break;
                                    const chunk = decoder.decode(value, { stream: true });
                                    const lines = chunk.split('\n');

                                    for (const line of lines) {
                                        if (!line.trim()) continue;
                                        try {
                                            const json = JSON.parse(line);
                                            if (json.message?.content) {
                                                const content = json.message.content;
                                                fullContent += content;
                                                controller.enqueue(encoder.encode(content));
                                            }
                                            if (json.done) {
                                                if (json.prompt_eval_count || json.eval_count) {
                                                    const { logTokenUsage } = await import('@/lib/token-cost');
                                                    logTokenUsage('Generate API (Ollama)', modelName, {
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
                                // Unified AI Logic (Dynamic!)
                                const { getGenerativeModel } = await import('@/lib/gemini');

                                // Determine Target Model
                                let targetModel = "gemini-flash";
                                // If specific gemini model name is passed, use it.
                                // Fallback logic is now handled recursively inside getGenerativeModel implementation.
                                if (modelProvider.startsWith('gemini-') && modelProvider !== 'gemini') {
                                    targetModel = modelProvider;
                                }

                                const runStream = async (modelName: string) => {
                                    console.log(`[Generate API] Attempting to use model: ${modelName}`);
                                    const model = await getGenerativeModel({ model: modelName });
                                    return await model.generateContentStream(prompt);
                                };

                                let result;
                                try {
                                    result = await runStream(targetModel);
                                } catch (error: any) {
                                    console.warn(`[Generate API] Failed with ${targetModel}: ${error.message}`);
                                    // Fallback
                                    if (targetModel.includes('3.')) {
                                        try {
                                            console.log('[Generate API] Falling back to gemini-2.5-flash...');
                                            result = await runStream("gemini-2.5-flash");
                                        } catch (e) {
                                            console.log('[Generate API] Falling back to gemini-2.0-flash-001...');
                                            result = await runStream("gemini-2.0-flash-001");
                                        }
                                    } else {
                                        // Legacy fallback
                                        try {
                                            console.log('[Generate API] Falling back to gemini-2.0-flash-001...');
                                            result = await runStream("gemini-2.0-flash-001");
                                        } catch (previewError: any) {
                                            console.log('[Generate API] Falling back to gemini-1.5-flash-002...');
                                            result = await runStream("gemini-1.5-flash-002");
                                        }
                                    }
                                }

                                for await (const chunk of result.stream) {
                                    const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
                                    if (chunkText) {
                                        fullContent += chunkText;
                                        try {
                                            controller.enqueue(encoder.encode(chunkText));
                                        } catch (e) {
                                            console.warn('Controller closed during enqueue (Vertex), stopping stream.');
                                            isStreamClosed = true;
                                            break;
                                        }
                                    }
                                    if (chunk.usageMetadata) {
                                        const { logTokenUsage } = await import('@/lib/token-cost');
                                        logTokenUsage('Generate API', targetModel, chunk.usageMetadata);
                                    }
                                }
                            }

                            // Save to DB logic removed to avoid duplication and validation errors.
                            // The frontend (NotesGenerator.tsx) handles saving the note with a proper title after streaming.


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
            // Note: We break here but the return happens above. 
            // The switch case structure is slightly bypassed by the return, which is fine.


            case 'flashcards':
                console.log(`Generating ${config.count} flashcards...`);

                // Fetch existing flashcards to prevent duplicates
                const existingFlashcards = await Flashcard.find({ notebookId }).select('front');
                const existingQuestions = existingFlashcards.map(f => f.front);
                const existingQuestionsText = existingQuestions.length > 0
                    ? `\nEXISTING QUESTIONS (DO NOT REPEAT THESE):\n${existingQuestions.map(q => `- ${q}`).join('\n')}\n`
                    : '';

                let flashcardsData: FlashcardData[] = [];

                if (modelProvider === 'ollama') {
                    console.log('Using iterative generation for Ollama...');
                    for (let i = 0; i < config.count; i++) {
                        console.log(`Generating card ${i + 1}/${config.count}...`);
                        const singleCardPrompt = `
                            You are an expert tutor.
                            Generate EXACTLY 1 high-quality flashcard based on the provided context.
                            
                            STRICT REQUIREMENTS:
                            1. OUTPUT FORMAT: A valid JSON Array containing exactly 1 object.
                            2. CONTENT:
                               - "front": A clear, specific question.
                               - "back": A concise, accurate answer.
                            3. QUALITY GUIDELINES:
                               - Do NOT generate True/False questions.
                               - Ensure variety (e.g., definitions, cause-effect, comparisons, conceptual).
                               - Avoid simple factual recall; focus on understanding and application.
                               - The question must be self-contained and understandable without the full text.
                            
                            ${existingQuestionsText}

                            Example Output:
                            [{"front": "What is the primary difference between X and Y?", "back": "X focuses on... while Y focuses on..."}]
                            
                            Context:
                            ${context}
                            
                            Return ONLY the JSON array with 1 flashcard.
                        `;

                        try {
                            const flashText = await generateWithProvider(singleCardPrompt, modelProvider, { jsonMode: true });
                            const singleCardData = extractJson(flashText);

                            let cardObj: FlashcardData | null = null;

                            if (Array.isArray(singleCardData) && singleCardData.length > 0) {
                                cardObj = singleCardData[0];
                            } else if (typeof singleCardData === 'object' && singleCardData !== null && 'front' in singleCardData) {
                                cardObj = singleCardData as FlashcardData;
                            }

                            if (cardObj && cardObj.front && cardObj.back) {
                                flashcardsData.push(cardObj);
                            } else {
                                console.warn(`Failed to parse card ${i + 1}:`, singleCardData);
                            }
                        } catch (err) {
                            console.error(`Error generating card ${i + 1}:`, err);
                        }
                    }
                } else {
                    // Default batch generation for other providers
                    prompt = `
                      You are an expert tutor.
                      Your task is to generate EXACTLY ${config.count} high-quality flashcards based on the provided context.
                      
                      STRICT REQUIREMENTS:
                      1. OUTPUT FORMAT: A valid JSON Array containing exactly ${config.count} objects.
                      2. CONTENT:
                         - "front": A clear, specific question.
                         - "back": A concise, accurate answer.
                      3. QUANTITY: You MUST generate exactly ${config.count} cards. Do not generate fewer.
                      4. QUALITY GUIDELINES:
                         - Do NOT generate True/False questions.
                         - Ensure variety (e.g., definitions, cause-effect, comparisons, conceptual).
                         - Avoid simple factual recall; focus on understanding and application.
                         - The question must be self-contained.

                      ${existingQuestionsText}
                      
                      Example Output Structure (if count was 3):
                      [
                        {"front": "What is the significance of X?", "back": "X is significant because..."},
                        {"front": "Compare A and B.", "back": "A is... whereas B is..."},
                        {"front": "Define the concept of Z.", "back": "Z refers to..."}
                      ]
                      
                      Context:
                      ${context}
                      
                      FINAL VERIFICATION STEP:
                      Before responding, count your generated flashcards. Are there exactly ${config.count}? If not, adjust the list to match the required count of ${config.count}.
                      
                      Return ONLY the JSON array.
                    `;

                    try {
                        const flashText = await generateWithProvider(prompt, modelProvider, { jsonMode: true });
                        let parsedData = extractJson(flashText);

                        // Handle case where model wraps array in an object (e.g. { "flashcards": [...] })
                        if (!Array.isArray(parsedData) && typeof parsedData === 'object' && parsedData !== null) {
                            // Check if it's a single flashcard object
                            if ('front' in parsedData && 'back' in parsedData) {
                                parsedData = [parsedData];
                            } else {
                                const values = Object.values(parsedData);
                                const foundArray = values.find(v => Array.isArray(v));
                                if (foundArray) {
                                    parsedData = foundArray;
                                }
                            }
                        }

                        if (Array.isArray(parsedData)) {
                            flashcardsData = parsedData;
                        } else {
                            console.error("Invalid Flashcard Response:", flashText);
                            throw new Error('Response is not an array');
                        }
                    } catch (e) {
                        console.error("Batch generation error:", e);
                        throw e;
                    }
                }

                if (flashcardsData.length === 0) {
                    throw new Error('No flashcards generated');
                }

                // Save all flashcards
                const flashcards = await Promise.all(flashcardsData.map((card: FlashcardData) =>
                    Flashcard.create({
                        notebookId,
                        front: card.front,
                        back: card.back
                    })
                ));
                resultData = flashcards;
                break;

            case 'mocktest':
                let questions: any[] = [];
                const languageContext = config.language
                    ? `Generate the entire mock test strictly in ${config.language}.`
                    : `Generate the entire mock test strictly in English.`;

                if (modelProvider === 'ollama') {
                    console.log(`Generating ${config.count} mock test questions iteratively...`);
                    for (let i = 0; i < config.count; i++) {
                        console.log(`Generating question ${i + 1}/${config.count}...`);

                        // Cycle through question types to ensure variety
                        const typeIndex = i % config.questionTypes.length;
                        const currentType = config.questionTypes[typeIndex];

                        const singleQuestionPrompt = `
                            You are an expert examiner.
                            Generate EXACTLY 1 high-quality ${config.difficulty} ${currentType} question based on the provided context.
                            
                            STRICT JSON OUTPUT REQUIREMENTS:
                            Return ONLY a valid JSON Array containing exactly 1 object with this schema:
                            [{
                              "question": "The question text",
                              "options": ["Option A", "Option B", "Option C", "Option D"],
                              "answer": "The correct answer text",
                              "type": "${currentType}"
                            }]

                            TYPE-SPECIFIC RULES:
                            ${currentType === 'mcq' ? `
                            - "options": Must contain exactly 4 distinct and plausible choices.
                            - "answer": Must be an EXACT string match to one of the options.
                            - "type": Must be "mcq".
                            ` : currentType === 'true-false' ? `
                            - "options": Must be exactly ["True", "False"].
                            - "answer": Must be either "True" or "False".
                            - "type": Must be "true-false".
                            ` : `
                            - "options": Must be an empty array [].
                            - "answer": A concise model answer (1-2 sentences).
                            - "type": Must be "short".
                            `}

                            NEGATIVE CONSTRAINTS (WHAT NOT TO DO):
                            - Do NOT include any markdown formatting (like \`\`\`json).
                            - Do NOT include any conversational text.
                            - Do NOT omit the "options" field (use [] if empty).
                            
                            ${languageContext}

                            Context:
                            ${context}
                            
                            Return ONLY the JSON array.
                        `;

                        try {
                            const qText = await generateWithProvider(singleQuestionPrompt, modelProvider, { jsonMode: true });
                            const qData = extractJson(qText);

                            let qObj: any = null;

                            if (Array.isArray(qData) && qData.length > 0) {
                                qObj = qData[0];
                            } else if (typeof qData === 'object' && qData !== null && 'question' in qData) {
                                qObj = qData;
                            }

                            if (qObj && qObj.question && qObj.answer) {
                                // Default type if missing
                                if (!qObj.type) {
                                    qObj.type = (Array.isArray(qObj.options) && qObj.options.length > 0) ? 'mcq' : 'short';
                                }
                                questions.push(qObj);
                            } else {
                                console.warn(`Failed to parse question ${i + 1}:`, qData);
                            }
                        } catch (err) {
                            console.error(`Error generating question ${i + 1}:`, err);
                        }
                    }
                } else {
                    // Default batch generation for other providers

                    // Calculate distribution
                    const typeCounts: Record<string, number> = {};
                    config.questionTypes.forEach((t: string, idx: number) => {
                        const baseCount = Math.floor(config.count / config.questionTypes.length);
                        const remainder = config.count % config.questionTypes.length;
                        typeCounts[t] = baseCount + (idx < remainder ? 1 : 0);
                    });
                    const distributionStr = Object.entries(typeCounts)
                        .map(([t, c]) => `${c} ${t === 'mcq' ? 'Multiple Choice' : t === 'true-false' ? 'True/False' : 'Short Answer'}`)
                        .join(', ');

                    prompt = `
                      You are an expert examiner.
                      Generate a mock test with ${config.count} questions based on the context provided below.
                      Difficulty: ${config.difficulty}.
                      
                      REQUIRED DISTRIBUTION: ${distributionStr}.
                      
                      ${languageContext}

                      STRICT JSON OUTPUT REQUIREMENTS:
                      Return ONLY a valid JSON Array containing exactly ${config.count} objects.
                      
                      SCHEMA PER OBJECT:
                      {
                        "question": "string", // The question text
                        "options": ["string"], // Array of strings. REQUIRED.
                        "answer": "string", // The correct answer text. REQUIRED.
                        "type": "string" // "mcq" | "true-false" | "short" | "long"
                      }
                      
                      RULES PER TYPE:
                      1. MCQ ("type": "mcq"):
                         - "options": Exactly 4 distinct choices.
                         - "answer": Must match one option exactly.
                      
                      2. True/False ("type": "true-false"):
                         - "options": Exactly ["True", "False"].
                         - "answer": Either "True" or "False".
                      
                      3. Short/Long Answer ("type": "short" or "long"):
                         - "options": Empty array [].
                         - "answer": The model answer.
                      
                      NEGATIVE CONSTRAINTS:
                      - Do NOT include markdown formatting.
                      - Do NOT include explanations outside the JSON.
                      
                      Context:
                      ${context}
                    `;

                    try {
                        const testText = await generateWithProvider(prompt, modelProvider, { jsonMode: true });
                        let parsedQuestions = extractJson(testText);

                        // Handle case where model wraps array in an object
                        if (!Array.isArray(parsedQuestions) && typeof parsedQuestions === 'object' && parsedQuestions !== null) {
                            // Check if it's a single question object
                            if ('question' in parsedQuestions && 'answer' in parsedQuestions) {
                                parsedQuestions = [parsedQuestions];
                            } else {
                                const values = Object.values(parsedQuestions);
                                const foundArray = values.find(v => Array.isArray(v));
                                if (foundArray) {
                                    parsedQuestions = foundArray;
                                }
                            }
                        }

                        if (Array.isArray(parsedQuestions)) {
                            questions = parsedQuestions;
                        } else {
                            console.error("Invalid Mock Test Response:", testText);
                            throw new Error('Response is not an array');
                        }
                    } catch (e) {
                        console.error("Batch mock test generation error:", e);
                        throw e;
                    }
                }

                // Validate and filter questions (common for both paths)
                const validQuestions = questions
                    .filter((q: any) => {
                        return q.question && typeof q.question === 'string' && q.question.trim() !== '' &&
                            q.answer && typeof q.answer === 'string' && q.answer.trim() !== '';
                    })
                    .map((q: any) => {
                        if (!q.type) {
                            // Infer type or default to mcq
                            if (Array.isArray(q.options) && q.options.length > 0) {
                                q.type = 'mcq';
                            } else {
                                q.type = 'short';
                            }
                        }
                        return q;
                    });

                if (validQuestions.length === 0) {
                    throw new Error('No valid questions generated');
                }

                const mockTest = await MockTest.create({
                    notebookId,
                    language: config.language || 'English',
                    questions: validQuestions,
                    score: 0
                });
                resultData = mockTest;
                break;

            case 'mocktest-summary':
                // Generate a holistic performance summary
                if (!config.questions || !config.userAnswers || Object.keys(config.gradingResults).length === 0) {
                    throw new Error("Missing required data for summary generation.");
                }

                const summaryLanguage = config.language || 'English';
                const qsText = config.questions.map((q: any, i: number) => {
                    return "Q: " + q.question + "\n" +
                           "Student's Answer: " + (config.userAnswers[i] || "No answer") + "\n" +
                           "Correct Answer: " + q.answer + "\n" +
                           "Score Received: " + (config.gradingResults[i]?.score || 0) + "/10\n" +
                           "AI Feedback: " + (config.gradingResults[i]?.feedback || "");
                }).join('\n\n');

                const summaryPrompt = `
                    You are an expert, encouraging AI tutor reviewing a student's recent mock test.
                    
                    Here are the test details:
                    Number of Questions: ${config.questions.length}
                    Total Score: ${config.score} out of ${config.questions.length * 10}

                    Questions and Grading Breakdown:
                    ${qsText}

                    Task:
                    Provide a concise, short performance summary formatted in Markdown.
                    Discuss appropriate points based on their performance. Do not make the summary too long.
                    
                    Write the entire summary fluently in ${summaryLanguage}.
                    Do NOT wrap the output in a JSON object. Return raw markdown text only.
                `;

                const rawSummary = await generateWithProvider(summaryPrompt, modelProvider, { jsonMode: false });
                resultData = { summary: rawSummary.trim() };
                break;

            case 'grading':
                const { question, userAnswer, referenceAnswer } = config;
                prompt = `
                  You are a strict but fair teacher.
                  Grade the following student answer based on the reference answer and context.
                  
                  Question: ${question}
                  Reference Answer: ${referenceAnswer}
                  Student Answer: ${userAnswer}
                  
                  Context:
                  ${context}
                  
                  Task:
                  1. Score the answer out of 10. Use decimals (e.g., 8.5).
                  2. Do NOT give a perfect 10 unless it is exceptional. Do NOT give 0 unless irrelevant.
                  3. Provide brief feedback.
                  
                  CRITICAL: Return ONLY a valid JSON object.
                  {
                    "score": number,
                    "feedback": "string"
                  }
                `;
                try {
                    const gradingText = await generateWithProvider(prompt, modelProvider, { jsonMode: true });
                    const gradingResult = extractJson(gradingText);
                    resultData = gradingResult;
                } catch (e: unknown) {
                    console.error("Grading error:", e);
                    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                    return NextResponse.json({ error: 'Failed to grade answer', details: errorMessage }, { status: 500 });
                }
                break;

            default:
                return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        return NextResponse.json(resultData);

    } catch (error: unknown) {
        console.error('Generation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to generate content', details: errorMessage }, { status: 500 });
    }
}
