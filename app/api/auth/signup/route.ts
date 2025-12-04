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

        // Check if this is the super admin
        const role = email === 'codstom@gmail.com' ? 'admin' : 'user';
        // Auto-verify admin for convenience, or force them to verify too? Let's force verify for consistency.
        // Actually, let's auto-verify admin to avoid getting locked out if email fails.
        const isVerified = email === 'codstom@gmail.com';

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
                await sendOTP(email, otp);
            } catch (emailError) {
                console.error('Failed to send OTP:', emailError);
                // We still create the user, but they will need to resend OTP.
                // Or should we fail? Better to fail so they can try again or fix email.
                // But if we fail, we should delete the user.
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
