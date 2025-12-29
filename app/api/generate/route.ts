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
        // Vertex AI Logic
        const { getVertexModel } = await import('@/lib/vertex-client');

        // Determine which model to use
        // If modelProvider is a specific Gemini model (e.g. gemini-3.0-flash), use it.
        // If it's the generic 'gemini', check options.modelName or default to 2.5.
        let targetModel = "gemini-2.5-flash";

        if (modelProvider.startsWith('gemini-') && modelProvider !== 'gemini') {
            targetModel = modelProvider;
        } else if (options.modelName) {
            targetModel = options.modelName;
        }

        const runGenerate = async (modelName: string) => {
            console.log(`[Generate API Helper] Attempting to use model: ${modelName}`);
            const model = getVertexModel(modelName);
            return await model.generateContent(prompt);
        };

        let result;
        try {
            result = await runGenerate(targetModel);
        } catch (error: any) {
            console.warn(`[Generate API Helper] Failed with ${targetModel}: ${error.message}`);

            // Fallback Strategy
            // 1. If we tried 3.0, fallback to 2.5
            if (targetModel.includes('3.0')) {
                try {
                    console.log('[Generate API Helper] Falling back to gemini-2.5-flash...');
                    result = await runGenerate("gemini-2.5-flash");
                } catch (e) {
                    // 2. If 2.5 fails, try 1.5
                    console.log('[Generate API Helper] Falling back to gemini-1.5-flash-001...');
                    result = await runGenerate("gemini-1.5-flash-001");
                }
            } else {
                // Legacy fallback for 2.5
                try {
                    console.log('[Generate API Helper] Falling back to gemini-2.5-flash-preview-001...');
                    result = await runGenerate("gemini-2.5-flash-preview-001");
                } catch (previewError: any) {
                    console.log('[Generate API Helper] Falling back to gemini-1.5-flash-001...');
                    result = await runGenerate("gemini-1.5-flash-001");
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
                prompt = `
          Topic: ${notebook.title}
          
          Based on the Topic and the following context (if available), generate ${config.type} notes.

          ${config.customInstructions ? `
          SPECIAL USER INSTRUCTIONS:
          ${config.customInstructions}
          ` : ''}
          
          FORMATTING INSTRUCTIONS:
          - Use Markdown formatting.
          - IMPORTANT: Do NOT wrap the entire output in a code block (like \`\`\`markdown ... \`\`\`).
          - Return the raw markdown text directly.
          
          Context:
          ${context}
        `;

                const encoder = new TextEncoder();
                const stream = new ReadableStream({
                    async start(controller) {
                        let fullContent = '';
                        let isStreamClosed = false;
                        try {
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
                                // Vertex AI Logic (Dynamic!)
                                const { getVertexModel } = await import('@/lib/vertex-client');

                                // Determine Target Model
                                let targetModel = "gemini-2.5-flash";
                                // If specific gemini model name is passed, use it.
                                if (modelProvider.startsWith('gemini-') && modelProvider !== 'gemini') {
                                    targetModel = modelProvider;
                                } else {
                                    // Otherwise fallback to whatever is default
                                    targetModel = "gemini-2.5-flash";
                                }

                                const runStream = async (modelName: string) => {
                                    console.log(`[Generate API] Attempting to use model: ${modelName}`);
                                    const model = getVertexModel(modelName);
                                    return await model.generateContentStream(prompt);
                                };

                                let result;
                                try {
                                    result = await runStream(targetModel);
                                } catch (error: any) {
                                    console.warn(`[Generate API] Failed with ${targetModel}: ${error.message}`);
                                    // Fallback
                                    if (targetModel.includes('3.0')) {
                                        try {
                                            console.log('[Generate API] Falling back to gemini-2.5-flash...');
                                            result = await runStream("gemini-2.5-flash");
                                        } catch (e) {
                                            console.log('[Generate API] Falling back to gemini-1.5-flash-001...');
                                            result = await runStream("gemini-1.5-flash-001");
                                        }
                                    } else {
                                        // Legacy fallback
                                        try {
                                            console.log('[Generate API] Falling back to gemini-2.5-flash-preview-001...');
                                            result = await runStream("gemini-2.5-flash-preview-001");
                                        } catch (previewError: any) {
                                            console.log('[Generate API] Falling back to gemini-1.5-flash-001...');
                                            result = await runStream("gemini-1.5-flash-001");
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
                    questions: validQuestions,
                    score: 0
                });
                resultData = mockTest;
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
