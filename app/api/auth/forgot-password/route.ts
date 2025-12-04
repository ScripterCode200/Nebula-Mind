import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { SignJWT } from 'jose';
import { sendPasswordResetEmail } from '@/lib/mail';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            // Return 200 even if user not found to prevent email enumeration
            return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
        }

        if (user.isBlocked) {
            return NextResponse.json({ error: 'Account is blocked' }, { status: 403 });
        }

        // Generate Reset Token (valid for 1 hour)
        const secret = new TextEncoder().encode(JWT_SECRET);
        const resetToken = await new SignJWT({
            email: user.email,
            type: 'password_reset'
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('1h')
            .sign(secret);

        const resetLink = `${new URL(req.url).origin}/reset-password?token=${resetToken}`;

        const emailSent = await sendPasswordResetEmail(user.email, resetLink);

        if (!emailSent) {
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }

        return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
