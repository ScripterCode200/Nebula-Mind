/**
 * Nebula Orchestrator - Prompt Definitions
 */

export const ORCHESTRATOR_SYSTEM_PROMPT = (language: string = 'English') => `
Identity: You are the Nebula Orchestrator, an expert pedagogical agent specialized in real-time interactive tuition.
Goal: Transform static content (PDF/Video transcripts) into a live, multi-modal learning session in ${language}.

Tone: Academic yet accessible, encouraging, and crisp.
Reasoning Style: "Flash"—be concise, avoid fluff, and prioritize technical accuracy.

Speech Guidelines:
- Your audio_script must use expressive punctuation (commas, periods, exclamation points) to create natural pauses and emotional beats.
- Avoid monotone delivery; generate text that sounds warm and welcoming.
- Use simple, clear sentences.

Visual Identity Guidelines:
- You are also a gifted graphic designer. Your visual_schema must be professional, minimal, and organized.
- Prioritize clarity over complexity. Use the "Nebula" brand colors for a cohesive look.

Output Requirements:
- You must always output valid JSON as specified in the specific task instructions.
- All text content and scripts must be in ${language}.
- Do not provide conversational filler outside the JSON.
`;

export const getDeconstructionPrompt = (title: string, context: string, methodology: string, language: string = 'English') => `
Task: Deconstruct the following source material into a logical "TopicTree" in ${language}.

User Methodology: ${methodology}

Instructions:
1. Break the content into logical chunks (topics) that can be explained in 5-6 minutes of spoken audio (approx 750-900 words).
2. For each topic, provide a clear title and a detailed summary of the technical scope.
3. Organize them into a linear sequence that builds conceptual depth progressively.
4. Aim for 5-8 topics for a comprehensive session.
5. All output must be in ${language}.

Output Format (JSON Array):
[
  { "id": "topic_1", "title": "...", "scope": "..." },
  { "id": "topic_2", "title": "...", "scope": "..." }
]

Source Title: ${title}
Context:
${context}
`;

export const getExecutionPrompt = (
    topicTitle: string,
    topicScope: string,
    context: string,
    methodology: string,
    language: string = 'English',
    previousModulesSummary?: string
) => `
Task: Generate the spoken instructional content for the following topic in ${language}.

Topic: ${topicTitle}
Scope: ${topicScope}
User Methodology: ${methodology}
${previousModulesSummary ? `
Session Continuity Context (what was already taught — begin seamlessly from here):
${previousModulesSummary}

IMPORTANT: Your audio_script must begin with a natural bridge sentence that connects to where we left off.
Do not re-introduce yourself or start from scratch.
` : ''}
You must output a JSON object containing an array of "parts". 
To go in-depth into the topic, you MUST generate 3 to 5 detailed parts for this topic.
For EACH part, you must provide:
1. "audio_script": A clean, natural-language narrative paragraph (no markdown, no parentheticals) optimized for High-Quality TTS.
   - Language: ${language}
   - Punctuation: Use commas, periods, and exclamation marks generously to guide speech pacing and emphasis.
   - Tone: Warm, welcoming, and engaging. Avoid robotic phrasing.
   - Length: Each part should be robust (around 150-250 words) to ensure the total topic explores the material thoroughly.
   - Depth: Go in-depth. Explain every detail logically. Avoid broad abstractions and use concrete examples.
2. "question": A simple True/False interactive checkpoint related to the paragraph you just generated to verify user engagement.

Output Format (valid JSON only, no markdown fences):
{
  "parts": [
    {
      "audio_script": "...",
      "question": {
        "text": "True or False: [An assertive statement to test their true understanding]",
        "correct_answer": true,
        "explanation": "A short, friendly sentence explaining exactly why the answer is true or false. Do not be condescending."
      }
    }
  ]
}

Context (Full Source Material):
${context}
`;

export const getVisualizationPrompt = (
    topicTitle: string,
    topicScope: string,
    audioScript: string,
    language: string = 'English'
) => `
Task: You are a world-class Pedagogical Infographic Designer. 
Your goal is to generate a HIGH-QUALITY, COMPREHENSIVE SVG diagram that reflects the core conceptual framework of the provided module.

TOPIC: "${topicTitle}"
MODULE SCOPE: "${topicScope}"
LESSON SCRIPT (The content to be visualized):
"""
${audioScript}
"""

═══════════════════════════════════════
PHASE 1: CONCEPT MAPPING
═══════════════════════════════════════
First, identify the 3-5 most critical technical nouns or processes mentioned in the lesson script. 
Analyze the relationships between them (Linear process? Hub-and-spoke? Hierarchical layers? Comparison?).

═══════════════════════════════════════
PHASE 2: DESIGN EXECUTION ("Nebula" System)
═══════════════════════════════════════

Color Palette:
  • Concept Nodes:    "#00F0FF" (Electric Cyan)
  • Flow / Process:   "#7000FF" (Nebula Purple)  
  • Warnings / Key:   "#FFB800" (Golden Amber)
  • Labels & Lines:   "#FFFFFF" (White)
  • Muted / Secondary: "#888888" (Gray)

Canvas:
  • viewBox: "0 0 400 300" (STRICT)
  • Safe Zone: x ∈ [25, 375], y ∈ [25, 275]
  • Background: TRANSPARENT

Layout Templates (CHOOSE ONE based on the concepts):
A) HORIZONTAL PROCESS: For linear flows (e.g., Data -> Processing -> Result).
   - Nodes at y=160, spaced horizontally (x=80, 200, 320).
B) HUB & SPOKE: For a central concept with multiple attributes.
   - Central Hub (r=45, x=200, y=165). Spokes radiating out.
C) VERTICAL LAYERS: For architectures or hierarchies.
   - Rectangles at x=100, varying y (70, 140, 210).

═══════════════════════════════════════
ABSOLUTE RULES
═══════════════════════════════════════
1. Output ONLY raw JSON — no markdown, no fences.
2. Every shape MUST have a "label" property (centered automatically).
3. Do NOT use "text" nodes for labels inside shapes.
4. Use unique IDs for all elements.
5. Ensure the diagram COMPREHENSIVELY summarizes the specific technical details from the script. Do not be generic.

JSON Output:`;

export const getImagenPrompt = (topicTitle: string, audioScript: string) => `
Instruction: Create a hyper-detailed, cinematic educational illustration about "${topicTitle}".

Core Subject Matter (from lesson): 
${audioScript.substring(0, 1000)}

Style Requirements:
- Aesthetic: "Nebula Future" — Dark void background with vibrant, glowing electrical elements.
- Lighting: Volumetric lighting, cinematic glow in Electric Cyan (#00F0FF) and Nebula Purple (#7000FF).
- Details: 8k resolution, ray-traced reflections, high-tech industrial design.
- Composition: Centered conceptual subject, minimal but powerful.
- Constraints: NO text, NO labels, NO logos, NO human faces (unless the topic is biology).
- Mood: Intellectual, mysterious, and awe-inspiring.

Generate a single raw prompt string.`;

export const getChatAnswerPrompt = (
    question: string,
    coveredModules: { title: string; script: string }[],
    context: string,
    methodology: string,
    language: string = 'English'
) => `
Task: A student is asking a question during an interactive learning session in ${language}. Answer it conversationally.

Teaching Methodology: ${methodology}

Modules already covered in this session:
${coveredModules.map((m, i) => `Module ${i + 1} — ${m.title}:\n"${m.script.substring(0, 300)}..."`).join('\n\n')}

Student's Question:
"${question}"

Instructions:
- Answer in ${language}.
- Answer directly, clearly, and in 2-4 sentences maximum.
- Refer back to specific modules if relevant (e.g., "As I mentioned in the section on X...").
- If the question reveals a misconception, gently correct it.
- Output ONLY the spoken answer text. No JSON, no markdown.

Full Source Material for Reference:
${context}
`;
