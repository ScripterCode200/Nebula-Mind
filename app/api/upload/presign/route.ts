import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { v4 as uuidv4 } from 'uuid';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

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

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserId(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { filename, contentType } = await req.json();

        if (!filename || !contentType) {
            return NextResponse.json({ error: 'Filename and Content-Type are required' }, { status: 400 });
        }

        const fileExtension = filename.split('.').pop();
        const uniqueId = uuidv4();
        const key = `${userId}/${uniqueId}.${fileExtension}`;

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        // Generate Presigned URL (valid for 5 minutes)
        const url = await getSignedUrl(r2Client, command, { expiresIn: 300 });
        const publicDomain = process.env.R2_PUBLIC_DOMAIN;

        return NextResponse.json({ url, key, publicDomain });
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }
}
