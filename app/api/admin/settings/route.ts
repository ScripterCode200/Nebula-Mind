import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import SystemSetting from '@/models/SystemSetting';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

async function isAdmin() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return false;
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload.role === 'admin';
    } catch (e) {
        return false;
    }
}

export async function GET() {
    await connectToDatabase();
    // Publicly accessible for middleware check, but maybe we should restrict? 
    // Actually, middleware needs to know this state efficiently. 
    // For now, let's just return the setting.
    let setting = await SystemSetting.findOne({ key: 'global' });
    if (!setting) {
        setting = await SystemSetting.create({ key: 'global', maintenanceMode: false });
    }
    return NextResponse.json(setting);
}

export async function POST(req: Request) {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { maintenanceMode } = await req.json();
        await connectToDatabase();

        const setting = await SystemSetting.findOneAndUpdate(
            { key: 'global' },
            { maintenanceMode },
            { upsert: true, new: true }
        );

        return NextResponse.json(setting);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
