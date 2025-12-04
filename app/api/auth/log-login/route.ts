import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import LoginLog from '@/models/LoginLog';

export async function POST(req: NextRequest) {
    await connectToDatabase();
    const { email } = await req.json();

    await LoginLog.create({
        email: email || 'anonymous',
        method: 'normal',
        timestamp: new Date()
    });

    return NextResponse.json({ success: true });
}
