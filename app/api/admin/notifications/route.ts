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

        // target can be 'all', 'specific', 'email', 'new_users', 'inactive', 'subscribers'

        await dbConnect();
        const scheduleDate = scheduledFor ? new Date(scheduledFor) : new Date();

        let recipients: any[] = [];

        if (target === 'all') {
            recipients = await User.find({}, '_id');
        } else if (target === 'specific') {
            if (!recipientId) return NextResponse.json({ error: 'Recipient ID required' }, { status: 400 });
            recipients = [{ _id: recipientId }];
        } else if (target === 'email') {
            if (!body.email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
            const user = await User.findOne({ email: body.email }, '_id');
            if (!user) return NextResponse.json({ error: 'User not found with this email' }, { status: 404 });
            recipients = [user];
        } else if (target === 'bulk_email') {
            if (!body.bulkRecipients) return NextResponse.json({ error: 'Bulk emails required' }, { status: 400 });
            const emails = body.bulkRecipients.split(/[\s,]+/).map((e: string) => e.trim()).filter((e: string) => e);
            if (emails.length === 0) return NextResponse.json({ error: 'No valid emails found' }, { status: 400 });
            recipients = await User.find({ email: { $in: emails } }, '_id');
        } else if (target === 'bulk_id') {
            if (!body.bulkRecipients) return NextResponse.json({ error: 'Bulk IDs required' }, { status: 400 });
            const ids = body.bulkRecipients.split(/[\s,]+/).map((id: string) => id.trim()).filter((id: string) => id);
            if (ids.length === 0) return NextResponse.json({ error: 'No valid IDs found' }, { status: 400 });
            recipients = await User.find({ _id: { $in: ids } }, '_id');
        } else if (target === 'new_users') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            recipients = await User.find({ createdAt: { $gte: sevenDaysAgo } }, '_id');
        } else if (target === 'inactive') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            recipients = await User.find({
                $or: [
                    { lastActiveAt: { $lt: thirtyDaysAgo } },
                    { lastActiveAt: { $exists: false } } // Never active
                ]
            }, '_id');
        } else if (target === 'subscribers') {
            recipients = await User.find({ isSubscribed: true }, '_id');
        } else if (target === 'custom_condition') {
            if (!body.conditions || !Array.isArray(body.conditions)) {
                return NextResponse.json({ error: 'Conditions array required' }, { status: 400 });
            }

            const query: any = {};
            const fieldMap: Record<string, string> = {
                'level': 'stats.level',
                'xp': 'stats.xp',
                'university': 'university',
                'major': 'academic.major',
                'location': 'location',
                'interest': 'interests',
                'streak': 'stats.streak.current',
            };

            body.conditions.forEach((cond: any) => {
                const dbField = fieldMap[cond.field];
                if (!dbField) return; // Skip invalid fields

                let value = cond.value;
                // Numeric conversion
                if (['level', 'xp', 'streak'].includes(cond.field)) {
                    value = Number(value);
                }

                if (cond.operator === 'equals') {
                    query[dbField] = value;
                } else if (cond.operator === 'gt') {
                    query[dbField] = { ...query[dbField], $gt: value };
                } else if (cond.operator === 'lt') {
                    query[dbField] = { ...query[dbField], $lt: value };
                } else if (cond.operator === 'contains') {
                    query[dbField] = { $regex: value, $options: 'i' };
                }
            });

            recipients = await User.find(query, '_id');
        }

        if (recipients.length === 0) {
            return NextResponse.json({ message: 'No users matches the selected target criteria.' }, { status: 404 });
        }

        const notifications = recipients.map(u => ({
            recipientId: u._id, // Ensure we use recipientId as per the model update I did earlier
            title,
            message,
            type: type || 'info',
            link,
            scheduledFor: scheduleDate,
            isRead: false
        }));

        await Notification.insertMany(notifications);
        return NextResponse.json({ message: `Sent to ${recipients.length} users` });

    } catch (error) {
        console.error('Notification creation failed:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
