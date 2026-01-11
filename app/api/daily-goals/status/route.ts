import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import TestResult from '@/models/TestResult';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

async function getUser() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return null;
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (e) {
        return null;
    }
}

export async function GET(request: Request) {
    try {
        const userPayload = await getUser();
        if (!userPayload) {
            console.log('[Status API] Unauthorized access attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const goalId = searchParams.get('goalId');

        if (!goalId) {
            console.log('[Status API] Missing goalId');
            return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });
        }

        // console.log(`[Status API] Checking status for goal: ${goalId}`);

        await connectToDatabase();
        // Standardize User ID
        const activeUserId = String(userPayload.userId || userPayload.id || userPayload.sub);

        console.log(`[Status API] GoalId: ${goalId}, UserId: ${activeUserId}`);

        // Set a timeout for the DB query to prevent hanging
        const result = await TestResult.findOne({ userId: activeUserId, goalId }).maxTimeMS(3000);
        console.log(`[Status API] Found result: ${!!result}, status: ${result?.status}, cheatAttempts: ${result?.cheatAttempts || 0}`);

        return NextResponse.json({
            status: result ? result.status : 'pending',
            score: result ? result.score : 0,
            cheatAttempts: result ? result.cheatAttempts : 0,
            maxAttempts: 3
        });

    } catch (error) {
        console.error('[Status API] Error checking status:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
