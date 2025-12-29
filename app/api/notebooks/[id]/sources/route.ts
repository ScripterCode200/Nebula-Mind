
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notebook from '@/models/Notebook';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';


export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const notebookId = id;

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const textContent = formData.get('textContent') as string;

        if (!file || !textContent) {
            return NextResponse.json({ error: 'Missing file or text content' }, { status: 400 });
        }

        const notebook = await Notebook.findById(notebookId);
        if (!notebook) {
            return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
        }

        // Upload PDF to R2
        const fileKey = `notebooks/${uuidv4()}.pdf`;
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        await r2Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: fileKey,
            Body: fileBuffer,
            ContentType: 'application/pdf',
        }));

        // Upload Text to R2
        const contentKey = `notebooks/${uuidv4()}_content.txt`;
        await r2Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: contentKey,
            Body: textContent,
            ContentType: 'text/plain',
        }));

        notebook.sources = notebook.sources || [];

        // Legacy Migration: If sources is empty but we have a legacy PDF, add it first
        if (notebook.sources.length === 0 && notebook.pdfUrl) {
            notebook.sources.push({
                type: 'pdf',
                name: notebook.title || 'Original Document',
                fileKey: notebook.pdfKey, // Might be undefined for very old ones, handled gracefully by frontend usually
                contentKey: notebook.contentKey, // Might be undefined
                addedAt: notebook.createdAt || new Date(),
                size: 0 // Unknown size for legacy
            });
        }

        const newSource = {
            type: 'pdf',
            name: file.name,
            fileKey,
            contentKey,
            addedAt: new Date(),
            size: file.size
        };
        notebook.sources.push(newSource);
        await notebook.save();

        return NextResponse.json({ success: true, source: newSource });

    } catch (error: any) {
        console.error('Add Source Error:', error);
        return NextResponse.json({ error: 'Failed to add source', details: error.message }, { status: 500 });
    }
}
