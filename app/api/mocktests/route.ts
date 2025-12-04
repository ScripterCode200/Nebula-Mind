import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import MockTest from '@/models/MockTest';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const notebookId = searchParams.get('notebookId');

        if (!notebookId) {
            return NextResponse.json({ error: 'Notebook ID is required' }, { status: 400 });
        }

        const mockTests = await MockTest.find({ notebookId }).sort({ createdAt: -1 });
        return NextResponse.json(mockTests);
    } catch (error) {
        console.error('Error fetching mock tests:', error);
        return NextResponse.json({ error: 'Failed to fetch mock tests' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await connectToDatabase();
        const { testId, userAnswers, gradingResults, score } = await req.json();

        if (!testId) {
            return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
        }

        const updatedTest = await MockTest.findByIdAndUpdate(
            testId,
            {
                userAnswers,
                gradingResults,
                score
            },
            { new: true }
        );

        if (!updatedTest) {
            return NextResponse.json({ error: 'Test not found' }, { status: 404 });
        }

        return NextResponse.json(updatedTest);
    } catch (error) {
        console.error('Error saving mock test results:', error);
        return NextResponse.json({ error: 'Failed to save results' }, { status: 500 });
    }
}
