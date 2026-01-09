
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

export async function POST(req: NextRequest) {
    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        // Verify the token
        const secret = new TextEncoder().encode(JWT_SECRET);
        try {
            await jwtVerify(token, secret);
        } catch (error) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        // Set the cookie
        const cookieStore = await cookies();
        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 7 days (match login)
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Switch account error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
