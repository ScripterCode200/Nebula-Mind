import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notebook from '@/models/Notebook';
import { parsePDF } from '@/lib/pdf-parser';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

async function getUserId(req: NextRequest) {
    const token = (await cookies()).get('token')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload.userId as string;
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserId(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;
        const pdfUrlInput = formData.get('pdfUrl') as string;

        if (!title || (!file && !pdfUrlInput)) {
            return NextResponse.json({ error: 'Title and either File or URL are required' }, { status: 400 });
        }

        // Check for duplicate title
        const existingNotebook = await Notebook.findOne({ userId, title });
        if (existingNotebook) {
            return NextResponse.json({
                success: true,
                notebookId: existingNotebook._id,
                message: 'Notebook already exists'
            });
        }

        let buffer: Buffer;
        let finalPdfUrl: string;

        if (file) {
            const arrayBuffer = await file.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');
            finalPdfUrl = `data:application/pdf;base64,${base64}`;
        } else {
            // Fetch from URL
            const response = await fetch(pdfUrlInput);
            if (!response.ok) {
                return NextResponse.json({ error: 'Failed to fetch PDF from URL' }, { status: 400 });
            }
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');
            finalPdfUrl = `data:application/pdf;base64,${base64}`;
        }

        // Extract text from PDF
        console.log('Starting PDF parsing...');
        let pdfContent = formData.get('pdfContent') as string || '';

        if (pdfContent) {
            console.log('Using client-provided PDF content, length:', pdfContent.length);
        } else {
            // Server-side fallback
            try {
                pdfContent = await parsePDF(buffer);
                console.log('PDF parsed successfully on server, length:', pdfContent.length);
            } catch (pdfError: unknown) {
                console.error('PDF Parse Error:', pdfError);
                // Don't fail, just log
                pdfContent = '';
            }
        }

        const notebook = await Notebook.create({
            title,
            userId, // Save with userId
            pdfUrl: finalPdfUrl,
            pdfContent,
        });

        return NextResponse.json({ success: true, notebookId: notebook._id });
    } catch (error: unknown) {
        console.error('Error creating notebook:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const stack = error instanceof Error ? error.stack : undefined;
        return NextResponse.json({ error: 'Failed to create notebook', details: errorMessage, stack }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserId(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const notebooks = await Notebook.find({ userId }).sort({ createdAt: -1 });
        return NextResponse.json(notebooks);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch notebooks' }, { status: 500 });
    }
}
