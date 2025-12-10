import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { sendOTP } from '@/lib/mail';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { email, password, name } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        console.log('------------------------------------------------');
        console.log(`🆕 SIGNUP OTP for ${email}: ${otp}`);
        console.log('------------------------------------------------');

        // Check if this is the super admin
        // const role = email === 'codstom@gmail.com' ? 'admin' : 'user';
        const role = 'user'; // Default to user, admin must be set manually in DB

        // Auto-verify admin for convenience, or force them to verify too? Let's force verify for consistency.
        const isVerified = false;

        const newUser = await User.create({
            email,
            password: hashedPassword,
            name,
            role,
            otp: isVerified ? undefined : otp,
            otpExpiry: isVerified ? undefined : otpExpiry,
            isVerified
        });

        if (!isVerified) {
            try {
                const { sendOTP } = await import('@/lib/mail');
                const success = await sendOTP(email, otp);
                if (!success) throw new Error('Email sending returned false');
            } catch (emailError) {
                console.error('Failed to send OTP:', emailError);
                await User.findByIdAndDelete(newUser._id);
                return NextResponse.json({ error: 'Failed to send verification email. Please check your email address.' }, { status: 500 });
            }
        }

        return NextResponse.json({
            message: isVerified ? 'Account created' : 'Verification email sent',
            userId: newUser._id,
            requiresVerification: !isVerified
        }, { status: 201 });

    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
