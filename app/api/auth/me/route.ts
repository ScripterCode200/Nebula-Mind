import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        await connectToDatabase();
        const user = await User.findById(payload.userId).select('-password');

        if (!user) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        // Check for Account Deletion
        if (user.deletionScheduledAt && new Date() > new Date(user.deletionScheduledAt)) {
            console.log(`[Hard Delete] Deleting user ${user._id} (Scheduled: ${user.deletionScheduledAt})`);

            // Import all models for cleanup
            const Notebook = (await import('@/models/Notebook')).default;
            const Note = (await import('@/models/Note')).default;
            const Flashcard = (await import('@/models/Flashcard')).default;
            const MockTest = (await import('@/models/MockTest')).default;
            const Chat = (await import('@/models/Chat')).default;

            // Delete all related data
            await Promise.all([
                Notebook.deleteMany({ userId: user._id }),
                Note.deleteMany({ userId: user._id }),
                Flashcard.deleteMany({ userId: user._id }),
                MockTest.deleteMany({ userId: user._id }),
                Chat.deleteMany({ userId: user._id }),
                User.findByIdAndDelete(user._id)
            ]);

            return NextResponse.json({ user: null, error: 'Account deleted' }, { status: 401 });
        }

        if (user.isBlocked) {
            return NextResponse.json({ user: null, isBlocked: true }, { status: 403 });
        }

        // Check Maintenance Mode
        const SystemSetting = (await import('@/models/SystemSetting')).default;
        const setting = await SystemSetting.findOne({ key: 'global' });
        const maintenanceMode = setting?.maintenanceMode || false;

        return NextResponse.json({ user, maintenanceMode });

    } catch (error) {
        console.error('Me API Error:', error);
        return NextResponse.json({ user: null }, { status: 401 });
    }
}
