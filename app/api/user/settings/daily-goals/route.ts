import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import DailyGoal from '@/models/DailyGoal';
import TestResult from '@/models/TestResult';
import { startOfDay, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';
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

export async function POST(req: Request) {
    const userPayload = await getUser();
    if (!userPayload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectToDatabase();
        const { preferences } = await req.json();

        if (!Array.isArray(preferences)) {
            return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
        }

        // 1. Update User Preferences
        const userId = userPayload.userId || userPayload.id;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { dailyGoalPreferences: preferences },
            { new: true }
        );

        console.log(`[Settings] Updated preferences for user ${userId}. Auto-regeneration skipped.`);

        return NextResponse.json({
            message: 'Preferences saved',
            preferences: updatedUser.dailyGoalPreferences,
            regeneratedCount: 0
        });

    } catch (error) {
        console.error("Save Error:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
