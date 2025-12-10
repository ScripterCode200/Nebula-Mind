import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notebook from '@/models/Notebook';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

async function getUserId(req: NextRequest) {
    const token = (await cookies()).get('token')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload.userId as string;
    } catch {
        return null;
    }
}

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserId(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json({ notebooks: [] });
        }

        await connectToDatabase();

        // Search notebooks by title using regex for partial match
        const notebooks = await Notebook.find({
            userId,
            title: { $regex: query, $options: 'i' }
        })
            .select('_id title createdAt')
            .limit(5)
            .sort({ createdAt: -1 });

        return NextResponse.json({ notebooks });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
