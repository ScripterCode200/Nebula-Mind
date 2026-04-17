import React from 'react';
import type { Metadata } from 'next';
import NotebookWorkspace from '@/components/notebook/NotebookWorkspace';
import connectToDatabase from '@/lib/db';
import Notebook from '@/models/Notebook';
import Chat from '@/models/Chat';
import { notFound } from 'next/navigation';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    await connectToDatabase();
    const { id } = await params;

    try {
        const notebook = await Notebook.findById(id).select('title').lean();
        if (!notebook) {
            return {
                title: 'Notebook Not Found',
            };
        }
        return {
            title: notebook.title,
            description: `Study notes and AI insights for ${notebook.title}`,
            openGraph: {
                title: `${notebook.title} | Nebula Mind`,
                description: `Study notes and AI insights for ${notebook.title}`,
            }
        };
    } catch {
        return {
            title: 'Notebook',
        };
    }
}

export default async function NotebookPage({ params }: PageProps) {
    await connectToDatabase();
    const { id } = await params;

    let notebook;
    let chat;
    try {
        notebook = await Notebook.findById(id).select('-pdfContent').lean();
        chat = await Chat.findOne({ notebookId: id }).lean();
    } catch {
        notFound();
    }

    if (!notebook) {
        notFound();
    }

    // Serialize MongoDB document to plain object
    const sources = notebook.sources || [];

    // Generate presigned URLs for all sources in parallel
    const serializedSources = await Promise.all(sources.map(async (source: any) => {
        let sourceUrl = '';
        try {
            const keyToSign = source.fileKey || source.contentKey;
            if (keyToSign) {
                const command = new GetObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: keyToSign,
                });
                sourceUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
            }
        } catch (e) {
            console.error(`Failed to sign URL for source ${source.name}`, e);
        }

        return {
            _id: source._id.toString(),
            type: source.type,
            name: source.name,
            fileKey: source.fileKey,
            contentKey: source.contentKey,
            addedAt: source.addedAt ? source.addedAt.toISOString() : new Date().toISOString(),
            url: sourceUrl
        };
    }));

    // Generate URL for main PDF (Legacy support)
    // If sources exist, the main PDF might be just the first source, or we might keep pdfUrl as a fallback/primary.
    // For now, allow both. If storageProvider is R2, we sign it.
    let pdfUrl = notebook.pdfUrl || ''; // Default to legacy URL
    if (notebook.storageProvider === 'r2' && notebook.pdfKey) {
        try {
            const command = new GetObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: notebook.pdfKey,
            });
            pdfUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
        } catch (error) {
            console.error("Error generating presigned URL for main PDF:", error);
        }
    }

    const serializedNotebook = {
        _id: notebook._id.toString(),
        title: notebook.title,
        pdfUrl: pdfUrl,
        sources: serializedSources,
        chatHistory: chat ? chat.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString()
        })) : [],
        fileType: notebook.fileType || 'pdf',
        contentHtml: notebook.contentHtml || '',
        contentKey: notebook.contentKey,
        pdfKey: notebook.pdfKey,
    };


    return <NotebookWorkspace notebook={serializedNotebook} />;
}
