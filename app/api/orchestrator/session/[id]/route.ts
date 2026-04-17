import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import AISession from '@/models/AISession';
import { verifyAuth } from '@/lib/auth';

export async function GET(
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

        const session = await AISession.findOne({ sessionId: params.id });
        
        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Security check: must be the same user
        if (session.userId !== auth.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Manual Closure Check
        if (session.status === 'completed') {
            return NextResponse.json({ error: 'SESSION_EXPIRED', message: 'This learning session has already ended.' }, { status: 410 });
        }

        const now = new Date();
        const sessionCreatedAt = new Date(session.createdAt);
        const sessionLastActive = new Date(session.lastActiveAt);
        
        // 2. Inactivity Check (10 minutes grace) - Only applies if session is > 1 min old
        const diffInMinutes = (now.getTime() - sessionLastActive.getTime()) / (1000 * 60);
        const ageInMinutes = (now.getTime() - sessionCreatedAt.getTime()) / (1000 * 60);

        console.log(`[Session Validation] ID: ${params.id}, Age: ${ageInMinutes.toFixed(2)}m, Inactivity: ${diffInMinutes.toFixed(2)}m`);

        if (ageInMinutes > 1 && diffInMinutes > 10) {
            // Auto-complete if inactive for too long
            await AISession.findOneAndUpdate({ sessionId: params.id }, { status: 'completed' });
            return NextResponse.json({ error: 'SESSION_EXPIRED', message: 'This session has ended due to inactivity.' }, { status: 410 });
        }

        // 3. Timeout Check (Configured Duration)
        const durationLimit = session.durationMinutes || 30;
        if (ageInMinutes > durationLimit) {
            // Auto-complete if time is up
            await AISession.findOneAndUpdate({ sessionId: params.id }, { status: 'completed' });
            return NextResponse.json({ error: 'SESSION_TIMEOUT', message: 'Your study session time has ended. Great job!' }, { status: 410 });
        }

        // 4. Fallback Expiry Check (24h)
        if (now > session.expiresAt) {
            return NextResponse.json({ error: 'SESSION_EXPIRED', message: 'This session link has expired.' }, { status: 410 });
        }

        return NextResponse.json(session);

    } catch (error: any) {
        console.error('Session Fetch Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
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

        const { status } = await req.json();

        const session = await AISession.findOneAndUpdate(
            { sessionId: params.id, userId: auth.userId },
            { status },
            { new: true }
        );

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, status: session.status });

    } catch (error: any) {
        console.error('Session Update Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
