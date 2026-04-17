import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notebook from '@/models/Notebook';
import { getNotebookContent } from '@/lib/notebook-context';
import { getOrchestratorModel } from '@/lib/gemini';
import { ORCHESTRATOR_SYSTEM_PROMPT, getChatAnswerPrompt } from '@/lib/prompts/orchestrator';
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
            question,
            coveredModules,  // [{ title, script }]
            sourceIds,
            methodology = 'Socratic',
            language = 'English'
        } = await req.json();

        if (!question?.trim()) {
            return NextResponse.json({ error: 'Question is required' }, { status: 400 });
        }

        const notebook = await Notebook.findById(notebookId);
        if (!notebook) {
            return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
        }

        const context = await getNotebookContent(notebook, sourceIds);
        if (!context) {
            return NextResponse.json({ error: 'No content available' }, { status: 400 });
        }

        const orchestrator = await getOrchestratorModel({
            systemInstruction: ORCHESTRATOR_SYSTEM_PROMPT(language)
        });

        const prompt = getChatAnswerPrompt(question, coveredModules || [], context, methodology, language);
        const result = await orchestrator.generateContent(prompt);

        const answerText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || 
                           'I could not generate an answer at this time.';

        return NextResponse.json({ answer: answerText });

    } catch (error: any) {
        console.error('[Orchestrator/Chat] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
