import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import ActivityLog from '@/models/ActivityLog';
import Notebook from '@/models/Notebook';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.userId;

        await connectToDatabase();

        const user = await User.findById(userId).select('stats dailyStats achievements');
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 1. Recent Activity
        const recentLogs = await ActivityLog.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        const recentActivity = recentLogs.map((log: any) => {
            let icon = 'Zap';
            let title = 'Activity';
            let action = 'Performed an action';

            switch (log.action) {
                case 'create_notebook':
                    icon = 'BookOpen';
                    title = log.metadata?.title || 'New Notebook';
                    action = 'Created a notebook';
                    break;
                case 'complete_test':
                    icon = 'Activity';
                    title = log.metadata?.title || 'Mock Test';
                    action = `Score: ${log.metadata?.score}%`;
                    break;
                case 'chat_message':
                    icon = 'MessageSquare';
                    title = 'AI Chat';
                    action = 'Asked a question';
                    break;
            }

            return { title, action, icon, date: log.createdAt };
        });

        // 2. Notebook Count
        const notebookCount = await Notebook.countDocuments({ userId });

        // 3. Format Stats
        const stats = {
            streak: `${user.stats?.streak?.current || 0} Days`,
            timeFocused: `${Math.floor((user.stats?.totalTimeSpent || 0) / 60)}h ${(user.stats?.totalTimeSpent || 0) % 60}m`,
            notebooks: `${notebookCount} Active`,
            xp: `${user.stats?.xp || 0} XP`
        };

        // 4. Daily Stats (for Chart)
        // Ensure we send last 7 days at least, filling gaps with 0
        const chartData = user.dailyStats || [];

        return NextResponse.json({
            stats,
            rarityStats: user.stats?.rarityStats || { uncommon: 0, rare: 0, epic: 0, legendary: 0 },
            recentActivity,
            chartData,
            achievements: user.achievements
        });

    } catch (error) {
        console.error('Dashboard API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
