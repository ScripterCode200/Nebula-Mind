import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notebook from '@/models/Notebook';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const notebook = await Notebook.findById(id);

        if (!notebook) {
            return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
        }

        // Logic to support R2 Storage
        let pdfUrl = notebook.pdfUrl;

        if (notebook.storageProvider === 'r2' && notebook.pdfKey) {
            console.log('Generating R2 URL for:', notebook.pdfKey);
            // Generate Presigned URL for the PDF/file
            const command = new GetObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: notebook.pdfKey,
            });
            // URL valid for 1 hour
            pdfUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
            console.log('Generated URL:', pdfUrl);
        } else {
            console.log('Not using R2 provider:', notebook.storageProvider);
        }

        // Return a plain object with the updated URL
        // We clone it to avoid mutating the Mongoose document directly if strict
        const responseData = {
            ...notebook.toObject(),
            pdfUrl
        };
        console.log('Sending Response Data pdfUrl:', responseData.pdfUrl);

        return NextResponse.json(responseData);
    } catch (error) {
        console.error("Error fetching notebook:", error);
        return NextResponse.json({ error: 'Failed to fetch notebook' }, { status: 500 });
    }
}
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const deletedNotebook = await Notebook.findByIdAndDelete(id);

        if (!deletedNotebook) {
            return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Notebook deleted successfully' });
    } catch {
        return NextResponse.json({ error: 'Failed to delete notebook' }, { status: 500 });
    }
}
