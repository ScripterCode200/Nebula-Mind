import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import LoginLog from '@/models/LoginLog';

export async function GET() {
    await connectToDatabase();
    const logs = await LoginLog.find().sort({ timestamp: -1 }).limit(50);
    return NextResponse.json(logs);
}
