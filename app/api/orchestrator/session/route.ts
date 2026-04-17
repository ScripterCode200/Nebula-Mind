import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import AISession from '@/models/AISession';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        await connectToDatabase();

        const { notebookId, config, topicTree, cacheName } = await req.json();

        if (!notebookId || !config || !topicTree) {
            return NextResponse.json({ error: 'Missing required session data' }, { status: 400 });
        }

        // Generate Custom ID: DDMMYYYYHHmmss + UserId
        const now = new Date();
        const dd = now.getDate().toString().padStart(2, '0');
        const mm = (now.getMonth() + 1).toString().padStart(2, '0');
        const yyyy = now.getFullYear().toString();
        const hh = now.getHours().toString().padStart(2, '0');
        const min = now.getMinutes().toString().padStart(2, '0');
        const sec = now.getSeconds().toString().padStart(2, '0');
        
        const customId = `${dd}${mm}${yyyy}${hh}${min}${sec}${auth.userId}`;

        const session = await AISession.create({
            sessionId: customId,
            notebookId,
            userId: auth.userId,
            config,
            topicTree,
            cacheName,
            status: 'active',
            durationMinutes: parseInt(config.duration) || 30,
            lastActiveAt: new Date()
        });

        console.log(`[Session API] Created custom session: ${session.sessionId}`);

        return NextResponse.json({ 
            sessionId: session.sessionId,
            expiresAt: session.expiresAt 
        });

    } catch (error: any) {
        console.error('Session Create Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
