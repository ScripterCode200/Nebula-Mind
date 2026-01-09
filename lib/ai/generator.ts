
import genAI from '@/lib/gemini';
import { Schema } from 'mongoose';

export interface GoalPreference {
    id: number;
    enabled: boolean;
    subject: string;
    difficulty: string;
    topic: string;
    isTimeBound: boolean;
}

interface GeneratedGoal {
    title: string;
    description: string;
    subject: string;
    difficulty: string;
    estimatedTime: string;
    questionsCount: number;
    xp: number;
    questions: {
        question: string;
        type: 'LongAnswer';
        idealAnswer: string;
        keyPoints: string[];
        explanation: string;
    }[];
}

export async function generateSingleGoal(preference: GoalPreference, aiModelName: string = 'gemini-2.5-flash'): Promise<GeneratedGoal> {
    const prompt = `
    Generate ONE study goal JSON object for: ${preference.topic || preference.subject}.
    Difficulty: ${preference.difficulty}.
    Subject: ${preference.subject}.
    Format: Long-Answer questions.
    Quantity: Generate EXACTLY 10 questions.

    JSON OBJECT STRUCTURE:
    {
        "title": "Short catchy title",
        "description": "1-sentence summary",
        "subject": "${preference.subject}",
        "difficulty": "${preference.difficulty}",
        "estimatedTime": "60m",
        "questionsCount": 10,
        "xp": 500,
        "questions": [
            {
                "question": "The question text",
                "type": "LongAnswer",
                "idealAnswer": "Comprehensive model answer",
                "keyPoints": ["point 1", "point 2"],
                "explanation": "Brief explanation"
            }
        ]
    }

    Return ONLY the JSON.
    `;

    try {
        const generativeModel = genAI.getGenerativeModel({ model: aiModelName });
        const result = await generativeModel.generateContent(prompt);
        const response = await result.response;

        let text = "";
        if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts && response.candidates[0].content.parts[0].text) {
            text = response.candidates[0].content.parts[0].text;
            console.log("RAW AI RESPONSE:", text);
        } else {
            console.error("Unexpected Vertex AI response structure:", JSON.stringify(response, null, 2));
            throw new Error("Invalid response from AI");
        }

        // Robust JSON Extraction
        let cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

        const start = cleanText.indexOf('{');
        const end = cleanText.lastIndexOf('}');

        if (start === -1 || end === -1) {
            console.error("AI Output did not contain a JSON object. Raw Output:", text);
            throw new Error("AI response format invalid (No JSON object found).");
        }

        const jsonString = cleanText.substring(start, end + 1);

        // Sanitize string: replace control characters (0-31) which are invalid in JSON string literals
        // We replace them with a space to preserve separation if they were used as whitespace,
        // and to prevent breaking the string if they were inside one.
        // Sanitize string: 
        // 1. Replace control characters (0-31)
        // 2. Fix invalid backslash escapes (commonly caused by LaTeX or paths in LLM output)
        const sanitizedJsonString = jsonString
            .replace(/[\x00-\x1F]+/g, " ")
            .replace(/\\(?:["\\/bfnrtu]|u[0-9a-fA-F]{4})|\\/g, (match) => {
                // If it looks like a valid escape sequence (length > 1), keep it
                if (match.length > 1) return match;
                // Otherwise it's an invalid/orphan backslash, double-escape it
                return "\\\\";
            });

        try {
            const goal = JSON.parse(sanitizedJsonString) as GeneratedGoal;

            // Basic validation
            if (!goal.title || !goal.questions || !Array.isArray(goal.questions)) {
                throw new Error("Missing required fields in generated goal");
            }
            // Enforce max 10 questions
            if (goal.questions.length > 10) {
                goal.questions = goal.questions.slice(0, 10);
            }
            goal.questionsCount = goal.questions.length;
            return goal;
        } catch (jsonError) {
            console.error("JSON Parsing/Validation Failed. Raw Text:", text);
            throw jsonError;
        }

    } catch (error) {
        console.error("Single Goal Generation Failed:", error);
        throw error;
    }
}
