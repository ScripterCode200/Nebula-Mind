import { NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectToDB();

        const topUsers = await User.find({
            'stats.xp': { $exists: true }
        })
            .sort({ 'stats.xp': -1 })
            .limit(50)
            .select('name profileImage stats.xp stats.streak.current');

        const leaderboardData = topUsers.map((user, index) => {
            const name = user.name || 'Anonymous User';
            const initials = name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

            return {
                id: user._id.toString(),
                name: name,
                xp: user.stats?.xp || 0,
                rank: index + 1,
                avatar: initials, // Using initials as avatar text for now
                profileImage: user.profileImage, // Including real image if available
                streak: user.stats?.streak?.current || 0,
                trend: 'stable' // Placeholder as we don't track historical rank yet
            };
        });

        return NextResponse.json({ success: true, users: leaderboardData });

    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch leaderboard' },
            { status: 500 }
        );
    }
}
