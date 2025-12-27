import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notebook from '@/models/Notebook';
import { parsePDF } from '@/lib/pdf-parser';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import mammoth from 'mammoth';

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
        let fileType: 'pdf' | 'docx' = 'pdf';
        let contentHtml = '';
        let pdfContent = '';

        if (file) {
            const arrayBuffer = await file.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');

            const isDocx = file.name.toLowerCase().endsWith('.docx') ||
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

            if (isDocx) {
                fileType = 'docx';
                finalPdfUrl = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`;
            } else {
                finalPdfUrl = `data:application/pdf;base64,${base64}`;
            }
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

        if (fileType === 'docx') {
            console.log('Parsing DOCX...');
            try {
                const result = await mammoth.convertToHtml({ buffer });
                contentHtml = result.value; // The generated HTML
                const messages = result.messages; // Any messages, such as warnings during conversion
                messages.forEach(msg => console.log('Mammoth msg:', msg));

                const textResult = await mammoth.extractRawText({ buffer });
                pdfContent = textResult.value;
                console.log('DOCX parsed, text length:', pdfContent.length);
            } catch (err) {
                console.error('Error parsing DOCX:', err);
                pdfContent = 'Error extracting text from Word document.';
                contentHtml = '<p>Error loading document preview.</p>';
            }
        } else if (fileType === 'pdf') {
            // Extract text from PDF
            console.log('Starting PDF parsing...');
            let clientPdfContent = formData.get('pdfContent') as string || '';

            if (clientPdfContent) {
                console.log('Using client-provided PDF content, length:', clientPdfContent.length);
                pdfContent = clientPdfContent;
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
        }

        const notebook = await Notebook.create({
            title,
            userId, // Save with userId
            pdfUrl: finalPdfUrl,
            pdfContent,
            fileType,
            contentHtml
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
        const notebooks = await Notebook.find({ userId })
            .select('-pdfContent -contentHtml') // Exclude heavy fields
            .sort({ createdAt: -1 });
        return NextResponse.json(notebooks);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch notebooks' }, { status: 500 });
    }
}
