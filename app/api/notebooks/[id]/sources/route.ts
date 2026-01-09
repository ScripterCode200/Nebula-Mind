
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
        const file = formData.get('file') as File | null; // Nullable

        // These can be provided if text/content is already handled (e.g. YouTube)
        const type = formData.get('type') as string || 'pdf';
        const name = formData.get('name') as string;
        const contentKeyInput = formData.get('contentKey') as string;

        // Legacy/Direct Text
        const textContent = formData.get('textContent') as string;

        // Validation
        if (!file && !contentKeyInput && !textContent) {
            return NextResponse.json({ error: 'Missing file, content key, or text content' }, { status: 400 });
        }

        const notebook = await Notebook.findById(notebookId);
        if (!notebook) {
            return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
        }

        let fileKey = '';
        let finalContentKey = contentKeyInput;

        // 1. Handle File Upload (PDF)
        // 1. Handle File (PDF)
        if (file) {
            fileKey = `notebooks/${uuidv4()}.pdf`;
            const fileBuffer = Buffer.from(await file.arrayBuffer());

            await r2Client.send(new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: fileKey,
                Body: fileBuffer,
                ContentType: 'application/pdf',
            }));
        }

        // 2. Handle Text Content (Fallback if no contentKey yet)
        if (textContent && !finalContentKey) {
            finalContentKey = `notebooks/${uuidv4()}_content.txt`;
            await r2Client.send(new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: finalContentKey,
                Body: textContent,
                ContentType: 'text/plain',
            }));
        }

        notebook.sources = notebook.sources || [];

        // Legacy Migration
        if (notebook.sources.length === 0 && notebook.pdfUrl) {
            notebook.sources.push({
                type: 'pdf',
                name: notebook.title || 'Original Document',
                fileKey: notebook.pdfKey,
                contentKey: notebook.contentKey,
                addedAt: notebook.createdAt || new Date(),
                size: 0
            });
        }

        const newSource = {
            type: type, // 'pdf' or 'youtube'
            name: name || (file ? file.name : 'New Source'),
            fileKey: fileKey,  // Might be empty for YouTube
            contentKey: finalContentKey,
            addedAt: new Date(),
            size: file ? file.size : 0,
            url: formData.get('url') as string || '' // Optional external URL (e.g. youtube link)
        };

        notebook.sources.push(newSource);
        await notebook.save();

        return NextResponse.json({ success: true, source: newSource });

    } catch (error: any) {
        console.error('Add Source Error:', error);
        return NextResponse.json({ error: 'Failed to add source', details: error.message }, { status: 500 });
    }
}
