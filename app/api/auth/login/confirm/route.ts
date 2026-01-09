import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

export async function POST(req: Request) {
    try {
        const { email, otp, otpToken } = await req.json();

        if (!email || !otp || !otpToken) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedOtp = otp.toString().trim();

        console.log('Verify: Received', { email: normalizedEmail, otp: normalizedOtp, tokenLength: otpToken.length });

        // Verify OTP Token
        const secret = new TextEncoder().encode(JWT_SECRET);
        let payload;
        try {
            const verified = await jwtVerify(otpToken, secret);
            payload = verified.payload;
            console.log('Verify: Token valid', payload);
        } catch (e) {
            console.error('Verify: Token verification failed', e);
            return NextResponse.json({ error: 'OTP expired or invalid. Please login again.' }, { status: 400 });
        }

        if (payload.email !== normalizedEmail || payload.type !== 'login_otp') {
            console.log('Verify: Invalid session data', { payloadEmail: payload.email, reqEmail: normalizedEmail });
            return NextResponse.json({ error: 'Invalid OTP session' }, { status: 400 });
        }

        // Verify OTP Hash
        const isValidOtp = await bcrypt.compare(normalizedOtp, payload.otpHash as string);
        console.log('Verify: Hash comparison result:', isValidOtp);

        if (!isValidOtp) {
            return NextResponse.json({ error: 'Incorrect OTP code' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            console.log('Verify: User not found in DB');
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // No need to clear OTP from DB as we don't save it there anymore

        // Generate JWT
        // Reuse secret from above
        const token = await new SignJWT({
            userId: user._id.toString(),
            email: user.email,
            role: user.role
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('15d')
            .sign(secret);

        // Set Cookie
        const cookieStore = await cookies();
        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 24 * 60 * 60,
            path: '/'
        });

        return NextResponse.json({
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token: token // Return token for client-side multi-account storage
        });

    } catch (error) {
        console.error('Login Verify Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
