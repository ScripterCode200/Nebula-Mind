import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db';
import UserPDF from '@/models/UserPDF';
import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { parsePDF } from '@/lib/pdf-parser';
import { Readable } from 'stream';

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

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserId(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const pdfs = await UserPDF.find({ userId }).sort({ uploadedAt: -1 });

        return NextResponse.json({ pdfs });
    } catch (error) {
        console.error('Error fetching PDFs:', error);
        return NextResponse.json({ error: 'Failed to fetch PDFs' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserId(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { filename, r2Key, fileSize } = body;

        if (!filename || !r2Key || !fileSize) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectToDatabase();

        // Count existing PDFs to enforce limit of 7
        const count = await UserPDF.countDocuments({ userId });
        if (count >= 7) {
            return NextResponse.json({ error: 'Maximum limit of 7 PDFs reached' }, { status: 403 });
        }

        console.log(`[PDF Upload] Processing file: ${filename} (Key: ${r2Key})`);

        // 1. Fetch PDF from R2
        let pdfBuffer: Buffer;
        try {
            console.log('[PDF Upload] Fetching original PDF from R2...');
            const pdfObj = await r2Client.send(new GetObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: r2Key
            }));

            if (!pdfObj.Body) throw new Error("Empty PDF body from R2");

            const chunks: any[] = [];
            const stream = pdfObj.Body as Readable;
            for await (const chunk of stream) chunks.push(chunk);
            pdfBuffer = Buffer.concat(chunks);
            console.log(`[PDF Upload] PDF fetched. Size: ${pdfBuffer.length} bytes.`);
        } catch (fetchError) {
            console.error('[PDF Upload] Failed to fetch PDF from R2:', fetchError);
            return NextResponse.json({ error: 'Failed to retrieve uploaded file' }, { status: 500 });
        }

        // 2. Extract Text
        let extractedText = "";
        try {
            console.log('[PDF Upload] Extracting text...');
            extractedText = await parsePDF(pdfBuffer);
            console.log(`[PDF Upload] Extraction complete. Length: ${extractedText.length} chars.`);
        } catch (extractError) {
            console.error('[PDF Upload] Text extraction failed:', extractError);
            extractedText = "Error extracting text from this PDF.";
        }

        // 3. Upload Extracted Text to R2 (Replace PDF)
        // We'll rename the key from .pdf to .txt
        const textKey = r2Key.replace(/\.pdf$/i, '') + '.txt';

        try {
            console.log(`[PDF Upload] Uploading extracted text to R2 key: ${textKey}`);
            // Dynamic Import for PutObject to avoid top-level issues if any
            const { PutObjectCommand } = await import('@aws-sdk/client-s3');

            await r2Client.send(new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: textKey,
                Body: extractedText,
                ContentType: 'text/plain'
            }));
            console.log('[PDF Upload] Text file uploaded successfully.');
        } catch (uploadError) {
            console.error('[PDF Upload] Failed to upload text file to R2:', uploadError);
            return NextResponse.json({ error: 'Failed to save extracted text' }, { status: 500 });
        }

        // 4. Delete Original PDF from R2
        try {
            console.log('[PDF Upload] Deleting original PDF from R2...');
            await r2Client.send(new DeleteObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: r2Key
            }));
            console.log('[PDF Upload] Original PDF deleted.');
        } catch (deleteError) {
            console.warn('[PDF Upload] Warning: Failed to delete original PDF (non-critical):', deleteError);
            // Proceed anyway, as we have the text
        }

        // 5. Save Metadata to DB (Pointing to the TEXT file now)
        const newPDF = await UserPDF.create({
            userId,
            filename, // Keep original filename for display
            r2Key: textKey, // POINT TO .TXT FILE
            fileSize // Use original size or text size? Keeping original gives user context of what they uploaded.
        });

        console.log('[PDF Upload] Database record created.');

        return NextResponse.json({ pdf: newPDF });
    } catch (error) {
        console.error('Error saving PDF metadata:', error);
        return NextResponse.json({ error: 'Failed to save PDF metadata' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const userId = await getUserId(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'PDF ID is required' }, { status: 400 });
        }

        await connectToDatabase();
        const pdf = await UserPDF.findOne({ _id: id, userId });

        if (!pdf) {
            return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
        }

        // Delete from R2
        try {
            await r2Client.send(new DeleteObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: pdf.r2Key
            }));
        } catch (r2Error) {
            console.error('Failed to delete from R2 (proceeding to delete from DB):', r2Error);
        }

        // Delete from DB
        await UserPDF.deleteOne({ _id: id });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting PDF:', error);
        return NextResponse.json({ error: 'Failed to delete PDF' }, { status: 500 });
    }
}
