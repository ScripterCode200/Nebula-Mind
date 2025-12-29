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

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { v4 as uuidv4 } from 'uuid';

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
        let fileType: 'pdf' | 'docx' = 'pdf';
        let contentHtml = '';
        let pdfContent = '';

        // 1. Get File Buffer
        if (file) {
            const arrayBuffer = await file.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);

            const isDocx = file.name.toLowerCase().endsWith('.docx') ||
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

            if (isDocx) {
                fileType = 'docx';
            }
        } else {
            // Fetch from URL
            const response = await fetch(pdfUrlInput);
            if (!response.ok) {
                return NextResponse.json({ error: 'Failed to fetch PDF from URL' }, { status: 400 });
            }
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        }

        // 2. Parse Content (Text Extraction)
        if (fileType === 'docx') {
            console.log('Parsing DOCX...');
            try {
                const result = await mammoth.convertToHtml({ buffer });
                contentHtml = result.value;
                const textResult = await mammoth.extractRawText({ buffer });
                pdfContent = textResult.value;
            } catch (err) {
                console.error('Error parsing DOCX:', err);
                pdfContent = 'Error extracting text from Word document.';
                contentHtml = '<p>Error loading document preview.</p>';
            }
        } else if (fileType === 'pdf') {
            console.log('Starting PDF parsing...');
            let clientPdfContent = formData.get('pdfContent') as string || '';

            if (clientPdfContent) {
                pdfContent = clientPdfContent;
            } else {
                try {
                    pdfContent = await parsePDF(buffer);
                } catch (pdfError: unknown) {
                    console.error('PDF Parse Error:', pdfError);
                    pdfContent = '';
                }
            }
        }

        // 3. Upload to Cloudflare R2
        const uniqueId = uuidv4();
        const pdfKey = `${userId}/${uniqueId}.${fileType}`;
        const contentKey = `${userId}/${uniqueId}.txt`;

        console.log('Uploading file to R2:', pdfKey);

        // Upload Original File
        await r2Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: pdfKey,
            Body: buffer,
            ContentType: fileType === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf',
        }));

        // Upload Extracted Text
        if (pdfContent) {
            console.log('Uploading text content to R2:', contentKey);
            await r2Client.send(new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: contentKey,
                Body: pdfContent,
                ContentType: 'text/plain',
            }));
        }

        // 4. Save to MongoDB
        // Note: contentHtml is still stored in Mongo for DOCX preview ease (usually smaller)
        // unless it's huge, but for now we keep it simple.

        const notebook = await Notebook.create({
            title,
            userId,
            pdfUrl: 'R2_STORAGE', // Placeholder or use public URL if enabled
            pdfContent: '', // Stored in R2 now
            storageProvider: 'r2',
            pdfKey,
            contentKey: pdfContent ? contentKey : undefined,
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
