
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
        // 1. Handle File (PDF or Docx)
        if (file) {
            // Sanitize filename
            const cleanName = (name || file.name)
                .replace(/[^a-zA-Z0-9.\-_]/g, '')
                .replace(/\s+/g, '_');

            const extension = cleanName.split('.').pop()?.toLowerCase() || 'pdf';
            const uuid = uuidv4();
            fileKey = `notebooks/${uuid}.${extension}`;

            let contentType = 'application/pdf';
            if (extension === 'docx') {
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            } else if (extension === 'doc') {
                contentType = 'application/msword';
            }

            const fileBuffer = Buffer.from(await file.arrayBuffer());

            await r2Client.send(new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: fileKey,
                Body: fileBuffer,
                ContentType: contentType,
                ContentDisposition: `inline; filename="${cleanName}"`
            }));
        }

        // 2. Handle Text Content
        // If we have textContent, upload it.
        // If we DON'T have textContent/contentKey but we processed a file, we MUST generate a contentKey for the schema.
        if (!finalContentKey) {
            finalContentKey = `notebooks/${uuidv4()}_content.txt`;
            const contentToUpload = textContent || '(No text content extracted)';

            await r2Client.send(new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: finalContentKey,
                Body: contentToUpload,
                ContentType: 'text/plain',
            }));
        }

        notebook.sources = notebook.sources || [];

        // Legacy Migration
        if (notebook.sources.length === 0 && notebook.pdfUrl) {
            notebook.sources.push({
                type: notebook.fileType || 'pdf', // Fix: Use actual notebook type instead of hardcoded 'pdf'
                name: notebook.title || 'Original Document',
                fileKey: notebook.pdfKey,
                contentKey: notebook.contentKey || `legacy_migration_${uuidv4()}.txt`,
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
        
        // Debugging injection to catch mystery 500 error
        const fs = require('fs');
        fs.writeFileSync('C:\\Users\\ASUST\\.gemini\\antigravity\\scratch\\notebook_lm_app2\\backend_error_log.txt', error.stack || error.message || 'Unknown error');
        
        return NextResponse.json({ error: 'Failed to add source', details: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const sourceId = searchParams.get('sourceId');

        if (!sourceId) {
            return NextResponse.json({ error: 'Missing sourceId' }, { status: 400 });
        }

        const notebook = await Notebook.findById(id);
        if (!notebook) {
            return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
        }

        // Find the source to get its keys for cleanup
        const sourceToDelete = (notebook.sources as any[]).find(s => s._id.toString() === sourceId);

        if (!sourceToDelete) {
            return NextResponse.json({ error: 'Source not found in notebook' }, { status: 404 });
        }

        // 1. Remove from database
        notebook.sources = notebook.sources.filter((s: any) => s._id.toString() !== sourceId);
        await notebook.save();

        // 2. Optional: Cleanup R2 files
        try {
            // Only delete File Key if present (User Uploads)
            if (sourceToDelete.fileKey) {
                const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
                await r2Client.send(new DeleteObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: sourceToDelete.fileKey
                }));
            }

            // Only delete Content Key if NOT a global cached transcript
            if (sourceToDelete.contentKey) {
                const CachedTranscript = (await import('@/models/CachedTranscript')).default;
                const isCached = await CachedTranscript.exists({ r2Key: sourceToDelete.contentKey });

                if (isCached) {
                    console.log(`[DELETE CANCELED] Source ${sourceId} uses shared cache ${sourceToDelete.contentKey}. Retaining R2 file.`);
                } else {
                    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
                    await r2Client.send(new DeleteObjectCommand({
                        Bucket: R2_BUCKET_NAME,
                        Key: sourceToDelete.contentKey
                    }));
                }
            }
        } catch (cleanupErr) {
            console.error('Cleanup R2 error:', cleanupErr);
            // Don't fail the request if cleanup fails
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete Source Error:', error);
        return NextResponse.json({ error: 'Failed to delete source', details: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const { sourceId, textContent } = await req.json();

        if (!sourceId || !textContent) {
            return NextResponse.json({ error: 'Missing sourceId or textContent' }, { status: 400 });
        }

        const notebook = await Notebook.findById(id);
        if (!notebook) {
            return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
        }

        const sourceIndex = (notebook.sources as any[]).findIndex(s => s._id.toString() === sourceId);
        if (sourceIndex === -1) {
            return NextResponse.json({ error: 'Source not found' }, { status: 404 });
        }

        const source = notebook.sources[sourceIndex];
        const currentKey = source.contentKey;

        // Fork Logic
        let newKey = currentKey;
        let isShared = false;

        // Check if shared
        if (currentKey) {
            const CachedTranscript = (await import('@/models/CachedTranscript')).default;
            isShared = !!(await CachedTranscript.exists({ r2Key: currentKey }));
        }

        if (isShared || !currentKey) {
            // FORK: Create new private key
            const uuid = uuidv4();
            newKey = `notebooks/${uuid}_fork.txt`;
            console.log(`[Forking] Source ${sourceId} is shared. Creating private fork: ${newKey}`);
        } else {
            // PRIVATE: Overwrite existing
            console.log(`[Overwriting] Source ${sourceId} is private. Updating: ${currentKey}`);
        }

        // Upload to R2
        await r2Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: newKey,
            Body: textContent,
            ContentType: 'text/plain',
        }));

        // Update Notebook source reference
        notebook.sources[sourceIndex].contentKey = newKey;
        // Mark as modified if schema supports it, or just for tracking
        notebook.markModified('sources');
        await notebook.save();

        return NextResponse.json({ success: true, newKey });

    } catch (error: any) {
        console.error('Update Source Error:', error);
        return NextResponse.json({ error: 'Failed to update source', details: error.message }, { status: 500 });
    }
}
