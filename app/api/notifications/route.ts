import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch {
        return null;
    }
}

export async function GET() {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    // Fetch notifications that are scheduled for now or in the past
    const notifications = await Notification.find({
        recipient: user.userId,
        scheduledFor: { $lte: new Date() }
    })
        .sort({ scheduledFor: -1, createdAt: -1 }) // Newest first
        .limit(50); // Limit to 50

    return NextResponse.json(notifications);
}

// Clear all or Mark all read
export async function POST(req: Request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action } = await req.json();
    await dbConnect();

    if (action === 'mark_all_read') {
        await Notification.updateMany(
            { recipient: user.userId, isRead: false, scheduledFor: { $lte: new Date() } },
            { isRead: true }
        );
        return NextResponse.json({ message: 'All marked as read' });
    }

    if (action === 'clear_all') {
        await Notification.deleteMany({
            recipient: user.userId,
            scheduledFor: { $lte: new Date() }
        });
        return NextResponse.json({ message: 'All cleared' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
