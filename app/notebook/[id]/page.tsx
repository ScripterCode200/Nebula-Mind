import React from 'react';
import type { Metadata } from 'next';
import NotebookWorkspace from '@/components/notebook/NotebookWorkspace';
import connectToDatabase from '@/lib/db';
import Notebook from '@/models/Notebook';
import Chat from '@/models/Chat';
import { notFound } from 'next/navigation';

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
    const serializedNotebook = {
        _id: notebook._id.toString(),
        title: notebook.title,
        pdfUrl: notebook.pdfUrl,
        chatHistory: chat ? chat.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString()
        })) : [],
        // We don't pass pdfContent to client to save bandwidth, 
        // it will be used by server actions/API
    };


    return <NotebookWorkspace notebook={serializedNotebook} />;
}
