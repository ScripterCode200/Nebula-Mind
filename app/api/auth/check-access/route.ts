import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import SystemSetting from '@/models/SystemSetting';
import { sendOTP } from '@/lib/mail';

export async function POST(req: NextRequest) {
    await connectToDatabase();
    const { email } = await req.json();

    // 1. Check if Alpha Mode is ON
    const setting = await SystemSetting.findOne({ key: 'alphaMode' });
    const isAlphaMode = setting ? setting.value : false;

    if (!isAlphaMode) {
        return NextResponse.json({ allowed: true, mode: 'normal' });
    }

    // 2. Check if user exists in whitelist
    const user = await User.findOne({ email });
    if (!user || !user.isAllowed) {
        return NextResponse.json({ allowed: false, error: 'Access Restricted' }, { status: 403 });
    }

    // 3. Generate and Send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    const sent = await sendOTP(email, otp);
    if (!sent) {
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
    }

    return NextResponse.json({ allowed: true, mode: 'alpha', requireOtp: true });
}
