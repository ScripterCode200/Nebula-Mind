import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        if (user.isBlocked) {
            return NextResponse.json({ error: 'Account is blocked. Please contact support.' }, { status: 403 });
        }



        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        console.log('------------------------------------------------');
        console.log(`🔐 LOGIN OTP for ${user.email}: ${otp}`);
        console.log('------------------------------------------------');

        // Hash OTP for stateless verification
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, salt);

        // Create OTP Token (Stateless)
        const secret = new TextEncoder().encode(JWT_SECRET);
        const otpToken = await new SignJWT({
            email: user.email,
            otpHash: otpHash,
            type: 'login_otp'
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('10m') // 10 minutes expiry
            .sign(secret);

        // Send OTP Email
        const { sendOTP } = await import('@/lib/mail');
        await sendOTP(user.email, otp);

        return NextResponse.json({
            message: 'OTP sent to your email',
            requiresOtp: true,
            email: user.email,
            otpToken: otpToken // Send token to client to send back
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
