import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

// Schedule Deletion (POST)
export async function POST(req: NextRequest) {
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

        // Schedule for 7 days from now
        const deletionDate = new Date();
        deletionDate.setDate(deletionDate.getDate() + 7);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { deletionScheduledAt: deletionDate },
            { new: true }
        ).select('deletionScheduledAt');

        return NextResponse.json({
            message: 'Account deletion scheduled',
            deletionScheduledAt: updatedUser.deletionScheduledAt
        });

    } catch (error) {
        console.error('Schedule Deletion Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Cancel Deletion (DELETE)
export async function DELETE(req: NextRequest) {
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

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $unset: { deletionScheduledAt: "" } },
            { new: true }
        ).select('deletionScheduledAt');

        return NextResponse.json({
            message: 'Account deletion cancelled',
            deletionScheduledAt: null
        });

    } catch (error) {
        console.error('Cancel Deletion Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
