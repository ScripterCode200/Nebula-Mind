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

        const { timezone } = await req.json();

        await connectToDatabase();

        // 1. Rate Limiting (Dedupe Multi-Tab)
        // Check if a heartbeat was logged in the last 55 seconds
        const lastHeartbeat = await ActivityLog.findOne({
            userId,
            action: 'heartbeat',
            createdAt: { $gt: new Date(Date.now() - 45 * 1000) }
        });

        if (lastHeartbeat) {
            console.log('Heartbeat ignored: Too frequent');
            return NextResponse.json({ status: 'ignored' });
        }
        console.log('Heartbeat accepted for user:', userId);

        // 2. Log Heartbeat
        await ActivityLog.create({
            userId,
            action: 'heartbeat'
        });

        // 3. Update User Stats
        const user = await User.findById(userId);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Initialize stats if missing (Lazy Migration)
        if (!user.stats) {
            user.stats = { streak: { current: 0 }, totalTimeSpent: 0, xp: 0, level: 1 };
        }

        // Increment Time
        user.stats.totalTimeSpent += 1;
        user.stats.xp += 5; // 5 XP per minute
        user.lastActiveAt = new Date();

        // 4. Update Daily Stats
        // Calculate "Today" based on User's Timezone
        const now = new Date();
        const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone || 'UTC' }));
        const todayStr = userTime.toISOString().split('T')[0]; // YYYY-MM-DD

        // Initialize dailyStats if missing
        if (!user.dailyStats) {
            user.dailyStats = [];
        }

        const dailyStatIndex = user.dailyStats.findIndex((s: any) => s.date === todayStr);
        if (dailyStatIndex > -1) {
            user.dailyStats[dailyStatIndex].timeSpent += 1;
            user.dailyStats[dailyStatIndex].xpGained += 5;
        } else {
            // Push new day and slice to keep last 30
            user.dailyStats.push({ date: todayStr, timeSpent: 1, xpGained: 5 });
            if (user.dailyStats.length > 30) {
                user.dailyStats.shift(); // Remove oldest
            }
        }

        // 5. Streak Calculation
        const lastLogin = user.stats.streak.lastLoginDate ? new Date(user.stats.streak.lastLoginDate) : null;

        if (lastLogin) {
            const lastLoginUserTime = new Date(lastLogin.toLocaleString('en-US', { timeZone: timezone || 'UTC' }));
            const lastLoginDateStr = lastLoginUserTime.toISOString().split('T')[0];

            if (lastLoginDateStr !== todayStr) {
                // It's a new day
                const yesterday = new Date(userTime);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (lastLoginDateStr === yesterdayStr) {
                    // Consecutive day
                    user.stats.streak.current += 1;
                } else {
                    // Broken streak
                    user.stats.streak.current = 1;
                }
                user.stats.streak.lastLoginDate = now;
            }
            // If same day, do nothing to streak
        } else {
            // First time
            user.stats.streak.current = 1;
            user.stats.streak.lastLoginDate = now;
        }

        // 6. Check Achievements (Simple Example)
        const newAchievements = [];
        const achievementsList = [
            { id: 'study_1h', name: 'Focused', threshold: 60, field: 'totalTimeSpent' },
            { id: 'streak_3d', name: 'Consistent', threshold: 3, field: 'stats.streak.current' },
            { id: 'xp_1000', name: 'Scholar', threshold: 1000, field: 'stats.xp' }
        ];

        // Initialize achievements if missing
        if (!user.achievements) {
            user.achievements = [];
        }

        for (const ach of achievementsList) {
            const alreadyUnlocked = user.achievements.some((a: any) => a.id === ach.id);
            if (!alreadyUnlocked) {
                let value = 0;
                if (ach.field === 'totalTimeSpent') value = user.stats.totalTimeSpent;
                else if (ach.field === 'stats.streak.current') value = user.stats.streak.current;
                else if (ach.field === 'stats.xp') value = user.stats.xp;

                if (value >= ach.threshold) {
                    user.achievements.push({ id: ach.id, unlockedAt: new Date() });
                    newAchievements.push(ach);
                }
            }
        }

        await user.save();

        return NextResponse.json({
            status: 'recorded',
            stats: user.stats,
            newAchievements
        });

    } catch (error) {
        console.error('Heartbeat Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
