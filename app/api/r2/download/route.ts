import { NextRequest, NextResponse } from 'next/server';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const auth = await verifyAuth(req);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');

        if (!key) {
            return NextResponse.json({ error: 'Key is required' }, { status: 400 });
        }

        // Generate Presigned URL
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        });

        const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 }); // 1 hour

        // Return the URL directly to be fetched? 
        // Or redirect? 
        // Since TextViewer does fetch(url), a 307 Redirect works nicely if fetch follows redirects (default yes).
        // BUT if it's CORS restricted on R2 side, we might have issues.
        // Usually R2/S3 presigned URLs work fine.

        return NextResponse.redirect(url);

    } catch (error) {
        console.error('Error generating download URL:', error);
        return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
    }
}
