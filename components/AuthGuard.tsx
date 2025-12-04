import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import SystemSetting from '@/models/SystemSetting';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

import { unstable_cache } from 'next/cache';

const getSystemSettings = unstable_cache(
    async () => {
        await connectToDatabase();
        // Use .lean() for faster execution and smaller memory footprint
        return SystemSetting.findOne({ key: 'global' }).lean();
    },
    ['system-settings'],
    {
        revalidate: 60, // Cache for 60 seconds
        tags: ['system-settings']
    }
);

export default async function AuthGuard({ children }: { children: React.ReactNode }) {
    const headersList = await headers();
    const pathname = headersList.get('x-current-path') || '';
    const search = headersList.get('x-current-search') || '';

    // Always allow static assets and API
    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/favicon.ico') {
        return <>{children}</>;
    }

    // Cached DB Call
    const setting = await getSystemSettings();
    const maintenanceMode = setting?.maintenanceMode || false;

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    let user = null;
    if (token) {
        try {
            const secret = new TextEncoder().encode(JWT_SECRET);
            const { payload } = await jwtVerify(token, secret);
            user = await User.findById(payload.userId).select('isBlocked role');
        } catch (e) { }
    }

    // --- Maintenance Logic ---
    if (maintenanceMode) {
        const isAdmin = user?.role === 'admin';
        const isAdminLogin = pathname === '/login' && search.includes('admin=true');

        if (!isAdmin && !isAdminLogin) {
            if (pathname !== '/maintenance') {
                redirect('/maintenance');
            }
        }
    } else {
        // Maintenance is OFF
        if (pathname === '/maintenance') {
            redirect('/');
        }
    }

    // --- Blocked Logic ---
    if (user?.isBlocked) {
        const allowed = ['/login', '/signup', '/blocked'];
        if (!allowed.includes(pathname)) {
            redirect('/blocked');
        }
    } else {
        // User is NOT blocked (or not logged in)
        if (pathname === '/blocked') {
            redirect('/dashboard');
        }
    }

    return <>{children}</>;
}
