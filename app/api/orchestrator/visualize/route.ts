import { NextRequest, NextResponse } from 'next/server';
import { getOrchestratorModel } from '@/lib/gemini';
import { ORCHESTRATOR_SYSTEM_PROMPT, getVisualizationPrompt } from '@/lib/prompts/orchestrator';
import { verifyAuth } from '@/lib/auth';

// ═══════════════════════════════════════
// Supported element types (must match NebulaStage renderer)
// ═══════════════════════════════════════
const SUPPORTED_TYPES = new Set(['circle', 'rect', 'line', 'path', 'text', 'ellipse', 'polygon']);

/**
 * Validate and sanitize AI-generated SVG schema.
 * Returns a clean schema or null if completely invalid.
 */
function validateSchema(raw: any): { viewBox: string; elements: any[] } | null {
    if (!raw || typeof raw !== 'object') return null;

    const viewBox = raw.viewBox || '0 0 400 300';
    const elements = raw.elements;

    if (!Array.isArray(elements) || elements.length === 0) return null;

    const seenIds = new Set<string>();
    const sanitized: any[] = [];

    for (const el of elements) {
        if (!el || typeof el !== 'object') continue;
        if (!el.type || !SUPPORTED_TYPES.has(el.type)) continue;

        // Ensure unique ID
        let id = el.id || `auto_${sanitized.length}`;
        if (seenIds.has(id)) id = `${id}_${sanitized.length}`;
        seenIds.add(id);

        // Truncate labels to 18 chars
        if (el.label && typeof el.label === 'string' && el.label.length > 25) {
            el.label = el.label.substring(0, 22) + '...';
        }

        // Clamp coordinates into safe zone (soft — don't reject, just fix)
        if (el.type === 'circle' || el.type === 'ellipse') {
            el.cx = clamp(el.cx, 25, 375);
            el.cy = clamp(el.cy, 25, 275);
        }
        if (el.type === 'rect') {
            el.x = clamp(el.x, 0, 375);
            el.y = clamp(el.y, 0, 275);
        }
        if (el.type === 'text') {
            el.x = clamp(el.x, 10, 390);
            el.y = clamp(el.y, 10, 290);
        }

        sanitized.push({ ...el, id });
    }

    if (sanitized.length === 0) return null;

    return { viewBox, elements: sanitized };
}

function clamp(value: any, min: number, max: number): number {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return (min + max) / 2;
    return Math.max(min, Math.min(max, num));
}

/**
 * Extract JSON from potentially messy AI output.
 * Tries multiple strategies in order of reliability.
 */
function extractJSON(text: string): any | null {
    // Strategy 1: Direct parse (cleanest case)
    try {
        return JSON.parse(text.trim());
    } catch { }

    // Strategy 2: Strip markdown code fences
    const stripped = text.replace(/```(?:json)?\s*\n?/g, '').replace(/\n?```\s*$/g, '').trim();
    try {
        return JSON.parse(stripped);
    } catch { }

    // Strategy 3: Find the outermost { ... } block  
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
            return JSON.parse(text.substring(firstBrace, lastBrace + 1));
        } catch { }
    }

    // Strategy 4: Regex for JSON object containing "elements"
    const match = text.match(/\{[\s\S]*"elements"\s*:\s*\[[\s\S]*\][\s\S]*\}/);
    if (match) {
        try {
            return JSON.parse(match[0]);
        } catch { }
    }

    return null;
}

/**
 * Generate a minimal but informative fallback SVG schema
 * Used when AI generation completely fails.
 */
function getFallbackSchema(topicTitle: string): { viewBox: string; elements: any[]; type: string } {
    const title = (topicTitle || 'Topic').substring(0, 30);
    return {
        type: 'svg',
        viewBox: '0 0 400 300',
        elements: [
            { type: 'text', id: 'fb_title', x: 200, y: 60, textContent: title, fill: '#00F0FF', fontSize: '14px', fontWeight: 'bold', textAnchor: 'middle', animate: { opacity: [0, 1] } },
            { type: 'rect', id: 'fb_box', x: 80, y: 100, width: 240, height: 100, rx: 16, fill: 'none', stroke: '#7000FF', strokeWidth: 1, animate: { scale: [0, 1] } },
            { type: 'text', id: 'fb_desc', x: 200, y: 145, textContent: 'Visual generation', fill: '#FFFFFF', fontSize: '11px', textAnchor: 'middle', fontWeight: '600', animate: { opacity: [0, 1] } },
            { type: 'text', id: 'fb_sub', x: 200, y: 165, textContent: 'is loading...', fill: '#888888', fontSize: '10px', textAnchor: 'middle', animate: { opacity: [0, 1] } },
            { type: 'circle', id: 'fb_c1', cx: 120, cy: 240, r: 6, fill: '#00F0FF', opacity: 0.3, animate: { scale: [0, 1] } },
            { type: 'circle', id: 'fb_c2', cx: 200, cy: 240, r: 6, fill: '#7000FF', opacity: 0.3, animate: { scale: [0, 1] } },
            { type: 'circle', id: 'fb_c3', cx: 280, cy: 240, r: 6, fill: '#FFB800', opacity: 0.3, animate: { scale: [0, 1] } },
        ]
    };
}

export async function POST(req: NextRequest) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            topicTitle,
            topicScope,
            audioScript,
            language = 'English'
        } = await req.json();

        if (!audioScript) {
            return NextResponse.json({ error: 'Missing audio script context' }, { status: 400 });
        }

        // 0. Check System Preference
        const connectToDatabase = (await import('@/lib/db')).default;
        const SystemSetting = (await import('@/models/SystemSetting')).default;
        await connectToDatabase();
        const globalSetting = await SystemSetting.findOne({ key: 'global' });
        const visualType = globalSetting?.orchestratorVisualType || 'svg';

        if (visualType === 'image') {
            try {
                const { imagenModel } = await import('@/lib/gemini');
                const { getImagenPrompt } = await import('@/lib/prompts/orchestrator');
                
                // Step 1: Generate a high-quality Imagen prompt using Gemini
                const promptGenerator = await getOrchestratorModel({
                    systemInstruction: "You are an expert prompt engineer for Gemini Imagen 3. Your goal is to create a vivid, cinematic, and educational image prompt.",
                });
                
                const promptRequest = getImagenPrompt(topicTitle, audioScript);
                const promptResult = await promptGenerator.generateContent(promptRequest);
                const imagenPrompt = promptResult.response.candidates?.[0]?.content?.parts?.[0]?.text || `High quality educational illustration of ${topicTitle}, nebula style, dark background blue glow.`;

                console.log(`[Orchestrator/Visualize] Generated Imagen Prompt: ${imagenPrompt.substring(0, 100)}...`);

                // Step 2: Generate Image with Gemini Imagen 3
                const imageResult = await imagenModel.generateContent(imagenPrompt);
                
                // Imagen 3 returns image data in the response parts
                const imagePart = imageResult.response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData || p.fileData);
                
                if (imagePart?.inlineData) {
                    const base64Data = imagePart.inlineData.data;
                    return NextResponse.json({
                        type: 'image',
                        url: `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${base64Data}`,
                        prompt: imagenPrompt
                    });
                }

                throw new Error("Imagen 3 did not return image data. Falling back to SVG.");
            } catch (imageError: any) {
                console.warn(`[Orchestrator/Visualize] Imagen generation failed: ${imageError.message}. Falling back to SVG.`);
                // Continue to SVG mode below...
            }
        }

        // ═══════════════════════════════════════
        // SVG Mode — Multi-attempt with validation
        // ═══════════════════════════════════════
        const prompt = getVisualizationPrompt(topicTitle, topicScope, audioScript, language);
        
        // Attempt 1: Primary model (SVG Key)
        let schema = await attemptGeneration(prompt, language, { useSvgKey: true });

        // Attempt 2: Fallback model (Vertex AI)
        if (!schema) {
            console.warn(`[Orchestrator/Visualize] Attempt 1 failed. Retrying with Vertex AI fallback.`);
            schema = await attemptGeneration(prompt, language, { useSvgKey: false });
        }

        // Attempt 3: Simplified prompt on a different model
        if (!schema) {
            console.warn(`[Orchestrator/Visualize] Attempt 2 failed. Trying simplified prompt on gemini-2.0-flash-001.`);
            const simplePrompt = getSimplifiedPrompt(topicTitle, audioScript);
            schema = await attemptGeneration(simplePrompt, language, { model: 'gemini-2.0-flash-001' });
        }

        // Final fallback: Return a placeholder diagram
        if (!schema) {
            console.error(`[Orchestrator/Visualize] All attempts failed. Returning fallback placeholder.`);
            return NextResponse.json(getFallbackSchema(topicTitle));
        }

        return NextResponse.json({ ...schema, type: 'svg' });

    } catch (error: any) {
        console.error('Visualization Error:', error);
        return new NextResponse(JSON.stringify({ 
            error: error.message, 
            details: "Please check your Vertex AI model access or wait for regional rollout." 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Single generation attempt with full error handling.
 * Returns a validated schema or null.
 */
async function attemptGeneration(
    prompt: string, 
    language: string, 
    opts: { useSvgKey?: boolean; model?: string }
): Promise<{ viewBox: string; elements: any[] } | null> {
    try {
        const designer = await getOrchestratorModel({
            model: opts.model,
            systemInstruction: ORCHESTRATOR_SYSTEM_PROMPT(language),
            useSvgKey: opts.useSvgKey
        });

        const result = await designer.generateContent(prompt);
        const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (!text) {
            console.warn(`[Orchestrator/Visualize] Model returned empty text.`);
            return null;
        }

        const parsed = extractJSON(text);
        if (!parsed) {
            console.warn(`[Orchestrator/Visualize] Could not extract valid JSON from model output (first 200 chars): ${text.substring(0, 200)}`);
            return null;
        }

        const validated = validateSchema(parsed);
        if (!validated) {
            console.warn(`[Orchestrator/Visualize] Schema validation failed. Parsed keys: ${Object.keys(parsed).join(', ')}`);
            return null;
        }

        console.log(`[Orchestrator/Visualize] ✓ Generated ${validated.elements.length} elements successfully.`);
        return validated;

    } catch (error: any) {
        console.warn(`[Orchestrator/Visualize] Generation attempt failed: ${error.message}`);
        return null;
    }
}

/**
 * Simplified prompt for last-resort attempts.
 * Much shorter, focuses on just getting valid JSON output.
 */
function getSimplifiedPrompt(topicTitle: string, audioScript: string): string {
    return `Generate a simple educational SVG diagram as JSON for the topic: "${topicTitle}".

Content summary: "${audioScript.substring(0, 500)}"

Rules:
- Output ONLY valid JSON, no markdown fences
- Use viewBox "0 0 400 300"  
- Element types allowed: circle, rect, line, path, text, ellipse, polygon
- Each element needs: type, id, and positioning props
- Text elements need textContent
- Include at least 6 elements
- Use colors: #00F0FF, #7000FF, #FFB800, #FFFFFF, #888888
- CRITICAL: The example format below is JUST the layout. Replace "Concept 1" and "Concept 2" with actual real terms from the script!

Example format:
{
  "viewBox": "0 0 400 300",
  "elements": [
    { "type": "text", "id": "t1", "x": 200, "y": 30, "textContent": "${topicTitle.substring(0, 25)}", "fill": "#00F0FF", "fontSize": "13px", "textAnchor": "middle", "fontWeight": "bold" },
    { "type": "circle", "id": "c1", "cx": 100, "cy": 120, "r": 25, "fill": "none", "stroke": "#00F0FF", "strokeWidth": 1.5, "label": "Concept 1" },
    { "type": "line", "id": "l1", "x1": 125, "y1": 120, "x2": 175, "y2": 120, "stroke": "#FFFFFF", "strokeWidth": 1 },
    { "type": "circle", "id": "c2", "cx": 200, "cy": 120, "r": 25, "fill": "none", "stroke": "#7000FF", "strokeWidth": 1.5, "label": "Concept 2" }
  ]
}

Generate the diagram now (raw JSON only):`;
}
