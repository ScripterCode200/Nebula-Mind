
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notification from '@/models/Notification';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const auth = await verifyAuth(req);

        if (!auth || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = auth.userId;

        const { searchParams } = new URL(req.url);
        const checkOnly = searchParams.get('check') === 'true';
        const unreadOnly = searchParams.get('unread') === 'true';

        if (checkOnly) {
            const hasUnread = await Notification.exists({ recipientId: userId, isRead: false });
            return NextResponse.json({ hasUnread: !!hasUnread });
        }

        if (unreadOnly) {
            const count = await Notification.countDocuments({ recipientId: userId, isRead: false });
            return NextResponse.json({ count });
        }

        const notifications = await Notification.find({ recipientId: userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        return NextResponse.json(notifications);

    } catch (error) {
        console.error('Notification Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        await connectToDatabase();
        const auth = await verifyAuth(req);

        if (!auth || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = auth.userId;

        const { notificationIds } = await req.json();

        if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
            await Notification.updateMany(
                { _id: { $in: notificationIds }, recipientId: userId },
                { $set: { isRead: true } }
            );
        } else {
            // Mark all as read if no specific IDs provided (optional 'Mark All Read' feature)
            await Notification.updateMany(
                { recipientId: userId, isRead: false },
                { $set: { isRead: true } }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Notification Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const auth = await verifyAuth(req);

        if (!auth || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = auth.userId;

        const { action } = await req.json();

        if (action === 'mark_all_read') {
            await Notification.updateMany(
                { recipientId: userId, isRead: false },
                { $set: { isRead: true } }
            );
        } else if (action === 'clear_all') {
            await Notification.deleteMany({ recipientId: userId });
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Notification Action Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
