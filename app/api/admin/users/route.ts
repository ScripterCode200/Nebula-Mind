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
        const { userId, action, role } = await req.json();
        await connectToDatabase();

        const user = await User.findById(userId);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // PROTECT SUPER ADMIN
        if (user.email === 'codstom@gmail.com') {
            return NextResponse.json({ error: 'Cannot modify the Super Admin account' }, { status: 403 });
        }

        if (action === 'toggle_block') {
            // Prevent blocking other admins (optional, but good practice, though user might want to demote then block)
            // For now, allowing blocking admins unless it's the super admin handled above.

            user.isBlocked = !user.isBlocked;
            await user.save();
            return NextResponse.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}`, user });
        }

        if (action === 'update_role') {
            if (!['user', 'editor', 'admin'].includes(role)) {
                return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
            }
            user.role = role;
            await user.save();
            return NextResponse.json({ message: `User role updated to ${role}`, user });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        await connectToDatabase();
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // PROTECT SUPER ADMIN
        if (user.email === 'codstom@gmail.com') {
            return NextResponse.json({ error: 'Cannot delete the Super Admin account' }, { status: 403 });
        }

        await User.findByIdAndDelete(userId);
        return NextResponse.json({ message: 'User deleted successfully' });

    } catch (error) {
        console.error("Delete user error:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
