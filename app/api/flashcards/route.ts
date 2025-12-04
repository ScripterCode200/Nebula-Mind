import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Flashcard from '@/models/Flashcard';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const notebookId = searchParams.get('notebookId');

        if (!notebookId) {
            return NextResponse.json({ error: 'Notebook ID is required' }, { status: 400 });
        }

        const flashcards = await Flashcard.find({ notebookId }).sort({ createdAt: -1 });
        return NextResponse.json(flashcards);
    } catch (error) {
        console.error('Error fetching flashcards:', error);
        return NextResponse.json({ error: 'Failed to fetch flashcards' }, { status: 500 });
    }
}
