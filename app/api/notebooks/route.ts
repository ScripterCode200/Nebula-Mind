import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notebook from '@/models/Notebook';
import { parsePDF } from '@/lib/pdf-parser';
import { verifyAuth } from '@/lib/auth';
import User from '@/models/User';
import mammoth from 'mammoth';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 60; // Set timeout to 60 seconds (Vercel limit for Pro)
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = auth.userId;

        await connectToDatabase();

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;
        const pdfUrlInput = formData.get('pdfUrl') as string;
        const fileKeyInput = formData.get('fileKey') as string;
        let finalContentKey = formData.get('contentKey') as string;
        const incomingType = formData.get('type') as string;

        if (!title || (!file && !pdfUrlInput && !fileKeyInput && !finalContentKey)) {
            return NextResponse.json({ error: 'Title and either File, URL, FileKey, or ContentKey are required' }, { status: 400 });
        }

        // Check for duplicate title
        const existingNotebook = await Notebook.findOne({ userId, title });
        if (existingNotebook) {
            return NextResponse.json({
                success: true,
                notebookId: (existingNotebook as { _id: string })._id,
                message: 'Notebook already exists'
            });
        }

        let buffer: Buffer | undefined;
        let fileType: 'pdf' | 'docx' | 'text' | 'youtube' = finalContentKey ? 'text' : 'pdf';

        if (incomingType === 'youtube' || (pdfUrlInput && (pdfUrlInput.includes('youtube.com') || pdfUrlInput.includes('youtu.be')))) {
            fileType = 'youtube';
        }

        let contentHtml = '';
        let pdfContent = '';

        // 1. Get File Buffer (Skip for YouTube)
        if (file) {
            const arrayBuffer = await file.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);

            const isDocx = file.name.toLowerCase().endsWith('.docx') ||
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

            if (isDocx) {
                fileType = 'docx';
            }
        } else if (pdfUrlInput && fileType !== 'youtube') {
            // Dedocde fileType from URL
            if (pdfUrlInput.toLowerCase().endsWith('.docx')) {
                fileType = 'docx';
            } else if (pdfUrlInput.toLowerCase().endsWith('.pdf')) {
                fileType = 'pdf';
            }

            // Fetch from URL
            const response = await fetch(pdfUrlInput);
            if (!response.ok) {
                return NextResponse.json({ error: 'Failed to fetch PDF from URL' }, { status: 400 });
            }
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        } else if (fileKeyInput) {
            // Pre-uploaded file. 
            // Try to deduce fileType from key
            if (fileKeyInput.toLowerCase().endsWith('.docx')) {
                fileType = 'docx';
            } else if (fileKeyInput.toLowerCase().endsWith('.pdf')) {
                fileType = 'pdf';
            }
        }


        // We already extracted finalContentKey from formData at the top
        // let finalContentKey = formData.get('contentKey') as string | undefined;

        // 2. Parse Content (Text Extraction)
        // Skip if we already have a content key (client uploaded text)
        if (!finalContentKey) {
            if (fileType === 'docx' && buffer) {
                console.log('Parsing DOCX...');
                try {
                    const result = await mammoth.convertToHtml({ buffer });
                    contentHtml = result.value;
                    
                    let htmlText = contentHtml;
                    htmlText = htmlText.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n');
                    htmlText = htmlText.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n');
                    htmlText = htmlText.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n');
                    htmlText = htmlText.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
                    htmlText = htmlText.replace(/<b>(.*?)<\/b>/gi, '**$1**');
                    htmlText = htmlText.replace(/<em>(.*?)<\/em>/gi, '*$1*');
                    htmlText = htmlText.replace(/<i>(.*?)<\/i>/gi, '*$1*');
                    htmlText = htmlText.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
                    htmlText = htmlText.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');
                    htmlText = htmlText.replace(/<br\s*\/?>/gi, '\n');
                    htmlText = htmlText.replace(/<[^>]+>/g, ''); 
                    
                    pdfContent = htmlText.replace(/\n\s*\n/g, '\n\n').trim();
                } catch (err) {
                    console.error('Error parsing DOCX:', err);
                    pdfContent = 'Error extracting text from Word document.';
                    contentHtml = '<p>Error loading document preview.</p>';
                }
            } else if (fileType === 'pdf') {
                console.log('Starting PDF parsing...');
                const clientPdfContent = formData.get('pdfContent') as string || '';

                if (clientPdfContent) {
                    pdfContent = clientPdfContent;
                } else if (buffer) {
                    try {
                        pdfContent = await parsePDF(buffer);
                    } catch (pdfError: unknown) {
                        console.error('PDF Parse Error:', pdfError);
                        pdfContent = '';
                    }
                }
            }
        }

        let pdfKey = fileKeyInput;

        if (!pdfKey && buffer) {
            const uniqueId = uuidv4();
            pdfKey = `${userId}/${uniqueId}.${fileType}`;
            console.log('Uploading file to R2:', pdfKey);

            // Upload Original File
            await r2Client.send(new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: pdfKey,
                Body: buffer!,
                ContentType: fileType === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf',
            }));
        } else if (pdfKey) {
            console.log('File already uploaded to R2 with key:', pdfKey);
        }

        // Upload Extracted Text (only if not already uploaded)
        if (!finalContentKey && pdfContent) {
            // Use same ID as pdfKey if possible, cleaning up extension
            const baseId = pdfKey.substring(0, pdfKey.lastIndexOf('.')) || pdfKey;
            const contentKey = `${baseId}.txt`;

            console.log('Uploading text content to R2:', contentKey);
            await r2Client.send(new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: contentKey,
                Body: pdfContent,
                ContentType: 'text/plain',
            }));
            finalContentKey = contentKey;
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
            contentKey: finalContentKey,
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
        const auth = await verifyAuth(req);
        if (!auth || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = auth.userId;

        // Get Pagination Query Params
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '9');
        const search = searchParams.get('search') || '';
        const skip = (page - 1) * limit;

        await connectToDatabase();

        console.log(`Fetching notebooks for user: ${userId}, Page: ${page}, Limit: ${limit}${search ? `, Search: ${search}` : ''}`);

        const query: any = {
            $or: [
                { userId: userId },
                { 'sharedWith.userId': userId }
            ]
        };

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        // Get Total Count
        const total = await Notebook.countDocuments(query);

        // Fetch Paginated Notebooks
        const notebooks = await Notebook.find(query)
            .select('-pdfContent -contentHtml') // Exclude heavy fields
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // Use lean for performance

        // Enhance shared notebooks with owner name
        const sharedNotebooks = notebooks.filter((n: any) => n.userId !== userId);

        if (sharedNotebooks.length > 0) {
            const ownerIds = [...new Set(sharedNotebooks.map((n: any) => n.userId))];

            if (ownerIds.length > 0) {
                const owners = await User.find({ _id: { $in: ownerIds } }).select('name _id profileImage').lean();
                if (owners) {
                    const ownerMap = new Map(owners.map((o: any) => [o._id.toString(), { name: o.name, profileImage: o.profileImage }]));
                    notebooks.forEach((n: any) => {
                        if (n.userId && n.userId !== userId) {
                            const ownerData = ownerMap.get(String(n.userId));
                            n.ownerName = ownerData?.name || 'Unknown User';
                            n.ownerImage = ownerData?.profileImage || '';
                        }
                    });
                }
            }
        }

        const hasMore = skip + notebooks.length < total;

        return NextResponse.json({
            notebooks,
            hasMore,
            total,
            currentPage: page
        });

    } catch (error) {
        console.error('Error fetching notebooks:', error);
        return NextResponse.json({ error: 'Failed to fetch notebooks' }, { status: 500 });
    }
}
