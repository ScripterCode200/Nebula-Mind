import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    console.log('Debug OTP route hit');
    return NextResponse.json({ message: 'Debug route working' });
}
