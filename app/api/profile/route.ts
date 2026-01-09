import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

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

        const user = await User.findById(userId).select('name email bio dob university stats achievements createdAt deletionScheduledAt profileImage');
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Define all possible achievements
        const allAchievements = [
            { id: 'first_notebook', name: 'Creator', description: 'Created your first notebook', icon: 'Book' },
            { id: 'notebook_master', name: 'Prolific', description: 'Created 5 notebooks', icon: 'Library' },
            { id: 'quiz_whiz', name: 'Quiz Whiz', description: 'Completed 3 mock tests', icon: 'Brain' },
            { id: 'study_1h', name: 'Focused', description: 'Studied for 1 hour total', icon: 'Clock' },
            { id: 'streak_3d', name: 'Consistent', description: '3-day study streak', icon: 'Flame' },
            { id: 'xp_1000', name: 'Scholar', description: 'Earned 1000 XP', icon: 'Award' }
        ];

        // Map user achievements to include metadata
        const userAchievements = allAchievements.map(ach => {
            const unlocked = (user.achievements || []).find((ua: any) => ua.id === ach.id);
            return {
                ...ach,
                unlocked: !!unlocked,
                unlockedAt: unlocked ? unlocked.unlockedAt : null
            };
        });

        return NextResponse.json({
            user: {
                name: user.name,
                email: user.email,
                bio: user.bio,
                dob: user.dob,
                university: user.university,
                joinedAt: user.createdAt,
                deletionScheduledAt: user.deletionScheduledAt,
                profileImage: user.profileImage,
                stats: user.stats || { streak: { current: 0 }, totalTimeSpent: 0, xp: 0, level: 1 }
            },
            achievements: userAchievements
        });

    } catch (error) {
        console.error('Profile API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.userId;

        const body = await req.json();
        const { name, bio, dob, university } = body;

        await connectToDatabase();

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                name,
                bio,
                dob: dob ? new Date(dob) : undefined,
                university
            },
            { new: true }
        ).select('name email bio dob university stats achievements createdAt deletionScheduledAt profileImage');

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            user: {
                name: updatedUser.name,
                email: updatedUser.email,
                bio: updatedUser.bio,
                dob: updatedUser.dob,
                university: updatedUser.university,
                joinedAt: updatedUser.createdAt,
                deletionScheduledAt: updatedUser.deletionScheduledAt,
                profileImage: updatedUser.profileImage,
                stats: updatedUser.stats
            }
        });

    } catch (error) {
        console.error('Profile Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
