import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import AISession from '@/models/AISession';
import { verifyAuth } from '@/lib/auth';

export async function POST(
    req: NextRequest, 
    { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
    try {
        const params = await paramsPromise;
        const auth = await verifyAuth(req);
        if (!auth || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        await connectToDatabase();

        const session = await AISession.findOneAndUpdate(
            { sessionId: params.id, userId: auth.userId },
            { lastActiveAt: new Date() },
            { new: true }
        );

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, lastActiveAt: session.lastActiveAt });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
