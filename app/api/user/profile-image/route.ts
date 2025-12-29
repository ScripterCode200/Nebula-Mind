import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

async function getUser() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return null;
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (e) {
        return null;
    }
}

export async function PATCH(req: Request) {
    try {
        const userPayload = await getUser();
        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { profileImage, imageKitFileId } = await req.json();
        const rawUserId = userPayload.userId || userPayload.id || userPayload.sub;
        const userId = String(rawUserId);

        await connectToDatabase();

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profileImage, imageKitFileId },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, user: { profileImage: updatedUser.profileImage } });
    } catch (error) {
        console.error("Profile image sync error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
