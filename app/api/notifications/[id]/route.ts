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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const userId = user.userId || user.id || user.sub;
    const notification = await Notification.findOne({ _id: id, recipientId: String(userId) });
    if (!notification) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    notification.isRead = true;
    await notification.save();

    return NextResponse.json(notification);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const userId = user.userId || user.id || user.sub;
    await Notification.deleteOne({ _id: id, recipientId: String(userId) });

    return NextResponse.json({ message: 'Deleted' });
}
