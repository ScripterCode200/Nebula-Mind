import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notebook from '@/models/Notebook';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const notebook = await Notebook.findOne({ _id: id, userId: user.userId });

        if (!notebook) {
            return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
        }

        return NextResponse.json({ annotations: notebook.annotations || {} });
    } catch (error) {
        console.error('Error fetching annotations:', error);
        return NextResponse.json({ error: 'Failed to fetch annotations' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { annotations } = await req.json();

        await connectToDatabase();
        const notebook = await Notebook.findOneAndUpdate(
            { _id: id, userId: user.userId },
            { $set: { annotations } },
            { new: true }
        );

        if (!notebook) {
            return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, annotations: notebook.annotations });
    } catch (error) {
        console.error('Error saving annotations:', error);
        return NextResponse.json({ error: 'Failed to save annotations' }, { status: 500 });
    }
}
