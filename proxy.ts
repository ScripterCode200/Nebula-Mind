import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

export async function proxy(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    const { pathname } = req.nextUrl;

    // Public Routes (Allowlist)
    const publicRoutes = [
        '/login',
        '/signup',
        '/maintenance',
        '/blocked',
        '/api/auth/login',
        '/api/auth/signup',
        '/api/auth/verify-email',
        '/api/auth/login/confirm',
        '/api/auth/login/verify',
        '/api/debug-otp',
        '/api/auth/logout',
        '/api/auth/forgot-password',
        '/api/auth/reset-password',
        '/forgot-password',
        '/reset-password',
        '/favicon.ico'
    ];

    // Check if route is public
    const isPublic = publicRoutes.some(route => pathname === route || pathname.startsWith('/_next'));

    // Also allow static assets if needed, but _next usually covers it.
    // If it's the root path '/', we might want to allow it as a landing page?
    const isLandingPage = pathname === '/';

    // Helper to add header to next() response
    const nextWithHeader = () => {
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set('x-current-path', pathname);
        requestHeaders.set('x-current-search', req.nextUrl.search);
        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    };

    if (isPublic || isLandingPage) {
        // Redirect logged-in users away from auth pages
        if ((pathname === '/login' || pathname === '/signup' || pathname === '/') && token) {
            try {
                const secret = new TextEncoder().encode(JWT_SECRET);
                await jwtVerify(token, secret);
                return NextResponse.redirect(new URL('/dashboard', req.url));
            } catch (e) {
                // Token invalid, allow access
            }
        }
        return nextWithHeader();
    }

    // Maintenance Mode Check (Skip for admin routes and api/auth)
    if (!pathname.startsWith('/api/admin') && !pathname.startsWith('/admin') && !pathname.startsWith('/api/auth')) {
        try {
            const res = await fetch(`${req.nextUrl.origin}/api/admin/settings`);
            const settings = await res.json();

            if (settings.maintenanceMode) {
                // Allow maintenance page
                if (pathname === '/maintenance') {
                    return nextWithHeader();
                }

                // Allow login ONLY with admin param
                if (pathname === '/login' && req.nextUrl.searchParams.get('admin') === 'true') {
                    return nextWithHeader();
                }

                let isAdmin = false;
                if (token) {
                    try {
                        const secret = new TextEncoder().encode(JWT_SECRET);
                        const { payload } = await jwtVerify(token, secret);
                        if (payload.role === 'admin') isAdmin = true;
                    } catch (e) { }
                }

                if (!isAdmin) {
                    return NextResponse.redirect(new URL('/maintenance', req.url));
                }
            }
        } catch (e) {
            // Fail open
        }
    }

    // Protected Routes (Everything else)
    if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        // Admin Route Protection
        if (pathname.startsWith('/admin') && payload.role !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        // Editor Route Protection
        if (pathname.startsWith('/editor') && payload.role !== 'admin' && payload.role !== 'editor') {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        return nextWithHeader();
    } catch (error) {
        // Invalid token
        return NextResponse.redirect(new URL('/login', req.url));
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes) -> Exclude to prevent body parsing issues with uploads
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
