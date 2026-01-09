'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function MaintenanceListener() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check every 5 seconds
        const interval = setInterval(async () => {
            console.log(`[MaintenanceListener] Check triggered at ${pathname}`);
            try {
                // Skip checks for login/signup pages to prevent unintended reloads during entry
                const isAuthPage = pathname === '/login' || pathname === '/signup';

                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();

                    // 1. Maintenance Mode Enforcement
                    if (data.maintenanceMode) {
                        console.log('[MaintenanceListener] Maintenance mode active');
                        // If ON, redirect non-admins to maintenance (but NOT if they are on auth pages)
                        if (data.user?.role !== 'admin' && pathname !== '/maintenance' && !isAuthPage) {
                            console.log('[MaintenanceListener] Redirecting non-admin to /maintenance');
                            window.location.href = '/maintenance';
                        }
                    } else {
                        // If OFF, redirect AWAY from maintenance
                        if (pathname === '/maintenance') {
                            console.log('[MaintenanceListener] Maintenance off, redirecting to /');
                            window.location.href = '/';
                        }
                    }

                    // 2. Blocked User Enforcement
                    if (data.user?.isBlocked) {
                        console.log('[MaintenanceListener] User is blocked');
                        const allowed = ['/login', '/signup', '/blocked'];
                        if (!allowed.includes(pathname)) {
                            console.log('[MaintenanceListener] Redirecting blocked user to /blocked');
                            window.location.href = '/blocked';
                        }
                    } else {
                        // If NOT blocked, redirect AWAY from blocked
                        if (pathname === '/blocked') {
                            console.log('[MaintenanceListener] User unblocked, redirecting to /dashboard');
                            window.location.href = '/dashboard';
                        }
                    }
                } else if (res.status === 403) {
                    // Handle blocked user response if API returns 403
                    const data = await res.json();
                    if (data.isBlocked) {
                        console.log('[MaintenanceListener] User blocked (403)');
                        const allowed = ['/login', '/signup', '/blocked'];
                        if (!allowed.includes(pathname)) {
                            console.log('[MaintenanceListener] Redirecting blocked user to /blocked');
                            window.location.href = '/blocked';
                        }
                    }
                }
            } catch (error) {
                // Ignore errors (network glitches, etc)
                console.warn('[MaintenanceListener] Check failed', error);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [pathname]);

    return null;
}
