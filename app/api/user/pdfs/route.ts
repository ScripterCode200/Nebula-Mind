import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db';
import UserPDF from '@/models/UserPDF';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';

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

        const newPDF = await UserPDF.create({
            userId,
            filename,
            r2Key,
            fileSize
        });

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
