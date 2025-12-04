import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

// Helper to verify admin
async function isAdmin() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return false;

        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        return payload.role === 'admin';
    } catch (e) {
        return false;
    }
}

export async function GET() {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    return NextResponse.json(users);
}

export async function POST(req: Request) {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { userId, action } = await req.json();
        await connectToDatabase();

        if (action === 'toggle_block') {
            const user = await User.findById(userId);
            if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

            // Prevent blocking self
            if (user.email === 'codstom@gmail.com') {
                return NextResponse.json({ error: 'Cannot block super admin' }, { status: 400 });
            }

            user.isBlocked = !user.isBlocked;
            await user.save();
            return NextResponse.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}`, user });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
