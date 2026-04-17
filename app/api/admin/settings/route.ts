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
        // 'value' is required by schema, providing dummy
        setting = await SystemSetting.create({
            key: 'global',
            value: 'system_global',
            maintenanceMode: false,
            antiCheatEnabled: false,
            enableDirectCaptions: false, // Default OFF
            enableAutoDailyGoals: true,
            useVertexAI: false, // Default to standard Gemini
            enableArtificialProxy: true // Default ON
        });
    }
    return NextResponse.json(setting);
}

export async function POST(req: Request) {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { maintenanceMode, aiModel, antiCheatEnabled, enableDirectCaptions, enableAutoDailyGoals, useVertexAI, enableArtificialProxy, orchestratorVisualType } = await req.json();
        await connectToDatabase();

        const updateData: any = {};
        if (maintenanceMode !== undefined) updateData.maintenanceMode = maintenanceMode;
        if (aiModel !== undefined) updateData.aiModel = aiModel;
        if (antiCheatEnabled !== undefined) updateData.antiCheatEnabled = antiCheatEnabled;
        if (enableDirectCaptions !== undefined) updateData.enableDirectCaptions = enableDirectCaptions;
        if (enableAutoDailyGoals !== undefined) updateData.enableAutoDailyGoals = enableAutoDailyGoals;
        if (useVertexAI !== undefined) updateData.useVertexAI = useVertexAI;
        if (enableArtificialProxy !== undefined) updateData.enableArtificialProxy = enableArtificialProxy;
        if (orchestratorVisualType !== undefined) updateData.orchestratorVisualType = orchestratorVisualType;

        // Ensure 'value' exists if upserting a new doc
        const setting = await SystemSetting.findOneAndUpdate(
            { key: 'global' },
            {
                ...updateData,
                $setOnInsert: { value: 'system_global' } // Satisfy required field on insert
            },
            { upsert: true, new: true, setDefaultsOnInsert: true, strict: false }
        );

        return NextResponse.json(setting);
    } catch (error) {
        console.error("Admin Settings POST Error:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
