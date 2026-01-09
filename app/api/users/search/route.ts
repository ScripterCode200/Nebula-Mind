
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const auth = await verifyAuth(req);
        if (!auth || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = auth.userId;

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json([]);
        }

        // Search by Name (Regex) or ID (Exact)
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(query);

        let filter: any = {};

        if (isObjectId) {
            // If searching by specific ID
            if (query === userId) {
                // User searching for themselves - return empty or let it return empty from DB query if we exclude
                return NextResponse.json([]);
            }
            filter = { _id: query };
        } else {
            // Search by Name or Email, excluding current user
            filter = {
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { email: { $regex: query, $options: 'i' } }
                ],
                _id: { $ne: userId }
            };
        }

        const users = await User.find(filter)
            .select('name _id email profileImage') // Return minimal info
            .limit(10)
            .lean();

        return NextResponse.json(users);

    } catch (error) {
        console.error('User Search Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
