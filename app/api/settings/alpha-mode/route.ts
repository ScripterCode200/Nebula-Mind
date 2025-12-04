import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import SystemSetting from '@/models/SystemSetting';

export async function GET() {
    await connectToDatabase();
    const setting = await SystemSetting.findOne({ key: 'alphaMode' });
    return NextResponse.json({ alphaMode: setting ? setting.value : false });
}

export async function POST(req: NextRequest) {
    await connectToDatabase();
    const { enabled } = await req.json();

    await SystemSetting.findOneAndUpdate(
        { key: 'alphaMode' },
        { value: enabled },
        { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, alphaMode: enabled });
}
