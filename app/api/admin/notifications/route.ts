import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

async function isAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return false;

    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload.role === 'admin';
    } catch {
        return false;
    }
}

export async function POST(req: Request) {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { recipientId, target, title, message, type, link, scheduledFor } = body;

        // target can be 'all' or 'specific'
        // if target == 'specific', recipientId is required

        await dbConnect();
        const scheduleDate = scheduledFor ? new Date(scheduledFor) : new Date();

        if (target === 'all') {
            const users = await User.find({}, '_id');
            const notifications = users.map(u => ({
                recipient: u._id,
                title,
                message,
                type: type || 'info',
                link,
                scheduledFor: scheduleDate,
                isRead: false
            }));
            await Notification.insertMany(notifications);
            return NextResponse.json({ message: `Sent to ${users.length} users` });
        } else {
            if (!recipientId) return NextResponse.json({ error: 'Recipient ID required' }, { status: 400 });

            await Notification.create({
                recipient: recipientId,
                title,
                message,
                type: type || 'info',
                link,
                scheduledFor: scheduleDate,
                isRead: false
            });
            return NextResponse.json({ message: 'Notification sent' });
        }

    } catch (error) {
        console.error('Notification creation failed:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
