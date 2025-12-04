import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import ActivityLog from '@/models/ActivityLog';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.userId;

        const { action, entityId, entityType, metadata } = await req.json();

        await connectToDatabase();

        // 1. Log Activity
        await ActivityLog.create({
            userId,
            action,
            entityId,
            entityType,
            metadata
        });

        // 2. Update User XP (Gamification)
        const user = await User.findById(userId);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        let xpGained = 0;
        switch (action) {
            case 'create_notebook': xpGained = 50; break;
            case 'complete_test': xpGained = 100; break;
            case 'create_flashcards': xpGained = 30; break;
            case 'chat_message': xpGained = 5; break;
        }

        if (xpGained > 0) {
            user.stats.xp += xpGained;

            // Update Daily Stats
            const todayStr = new Date().toISOString().split('T')[0];
            if (!user.dailyStats) user.dailyStats = [];

            const dailyStatIndex = user.dailyStats.findIndex((s: any) => s.date === todayStr);
            if (dailyStatIndex > -1) {
                user.dailyStats[dailyStatIndex].xpGained += xpGained;
            } else {
                user.dailyStats.push({ date: todayStr, timeSpent: 0, xpGained });
            }
        }

        // 3. Check Achievements
        const newAchievements = [];
        const achievementsList = [
            { id: 'first_notebook', name: 'Creator', action: 'create_notebook', count: 1 },
            { id: 'notebook_master', name: 'Prolific', action: 'create_notebook', count: 5 },
            { id: 'quiz_whiz', name: 'Quiz Whiz', action: 'complete_test', count: 3 }
        ];

        for (const ach of achievementsList) {
            if (ach.action === action) {
                if (!user.achievements) user.achievements = [];
                const alreadyUnlocked = user.achievements.some((a: any) => a.id === ach.id);
                if (!alreadyUnlocked) {
                    // Count total actions of this type
                    const count = await ActivityLog.countDocuments({ userId, action: ach.action });
                    if (count >= ach.count) {
                        user.achievements.push({ id: ach.id, unlockedAt: new Date() });
                        newAchievements.push(ach);
                    }
                }
            }
        }

        await user.save();

        return NextResponse.json({
            status: 'logged',
            xpGained,
            newAchievements
        });

    } catch (error) {
        console.error('Activity Log Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
