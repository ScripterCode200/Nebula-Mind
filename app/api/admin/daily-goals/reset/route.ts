
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import DailyGoal from '@/models/DailyGoal';
import { startOfDay, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

async function isAdmin() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return false;
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload.role === 'admin';
    } catch (e) {
        return false;
    }
}

export async function POST(req: Request) {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        await connectToDatabase();

        // Get current time in IST
        const now = new Date();
        const istDate = toZonedTime(now, IST_TIMEZONE);
        const start = startOfDay(istDate);
        const end = endOfDay(istDate);

        // Delete all goals for the current IST day
        // Ideally, in a multi-user app where everyone gets unique goals, we might want to be more specific.
        // But the requirement says "Always privious Tests delets and new tests load", implying a hard reset for "today".
        // Since we are generating unique goals per user (stored with userId), and if the requirement is to 
        // "Force New Generation" for everyone (or just to test generation), deleting *all* goals for today is the cleanest way
        // to force the /explore page to re-trigger generation for ANY user who visits.

        const result = await DailyGoal.deleteMany({
            date: {
                $gte: start,
                $lte: end
            }
        });

        return NextResponse.json({
            message: 'All daily goals for today have been reset.',
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Error resetting daily goals:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
