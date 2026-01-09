import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.isVerified) {
            return NextResponse.json({ message: 'Email already verified' }, { status: 200 });
        }

        if (user.otp !== otp) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        if (user.otpExpiry && new Date() > user.otpExpiry) {
            return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        // Generate Session Token
        const secret = new TextEncoder().encode(JWT_SECRET);
        const token = await new SignJWT({ userId: user._id, email: user.email })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(secret);

        // Set Cookie
        const cookieStore = await cookies();
        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 24 * 60 * 60, // 15 days
            path: '/'
        });

        return NextResponse.json({
            message: 'Email verified successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
