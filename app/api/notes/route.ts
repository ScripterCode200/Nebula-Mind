import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Note from '@/models/Note';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const notebookId = searchParams.get('notebookId');

        if (!notebookId) {
            return NextResponse.json({ error: 'Notebook ID is required' }, { status: 400 });
        }

        const notes = await Note.find({ notebookId }).sort({ createdAt: -1 });
        return NextResponse.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { notebookId, title, content, type } = body;

        if (!notebookId || !title || !content || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newNote = await Note.create({
            notebookId,
            title,
            content,
            type
        });

        return NextResponse.json(newNote, { status: 201 });
    } catch (error) {
        console.error('Error creating note:', error);
        return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }
}
