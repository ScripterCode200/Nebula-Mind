import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notebook from '@/models/Notebook';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const notebook = await Notebook.findById(id);

        if (!notebook) {
            return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
        }

        return NextResponse.json(notebook);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch notebook' }, { status: 500 });
    }
}
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const deletedNotebook = await Notebook.findByIdAndDelete(id);

        if (!deletedNotebook) {
            return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Notebook deleted successfully' });
    } catch {
        return NextResponse.json({ error: 'Failed to delete notebook' }, { status: 500 });
    }
}
