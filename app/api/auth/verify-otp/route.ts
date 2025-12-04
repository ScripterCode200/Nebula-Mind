import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import LoginLog from '@/models/LoginLog';

export async function POST(req: NextRequest) {
    await connectToDatabase();
    const { email, otp } = await req.json();

    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
        return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Log the login
    await LoginLog.create({
        email,
        method: 'alpha',
        timestamp: new Date()
    });

    return NextResponse.json({ success: true });
}
