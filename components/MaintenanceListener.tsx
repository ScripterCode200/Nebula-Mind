'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function MaintenanceListener() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check every 5 seconds
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();

                    // 1. Maintenance Mode Enforcement
                    if (data.maintenanceMode) {
                        // If ON, redirect non-admins to maintenance
                        if (data.user?.role !== 'admin' && pathname !== '/maintenance') {
                            window.location.href = '/maintenance';
                        }
                    } else {
                        // If OFF, redirect AWAY from maintenance
                        if (pathname === '/maintenance') {
                            window.location.href = '/';
                        }
                    }

                    // 2. Blocked User Enforcement
                    if (data.user?.isBlocked) {
                        // Removed '/' from allowed list
                        const allowed = ['/login', '/signup', '/blocked'];
                        if (!allowed.includes(pathname)) {
                            window.location.href = '/blocked';
                        }
                    } else {
                        // If NOT blocked, redirect AWAY from blocked
                        if (pathname === '/blocked') {
                            window.location.href = '/dashboard';
                        }
                    }
                } else if (res.status === 403) {
                    // Handle blocked user response if API returns 403
                    const data = await res.json();
                    if (data.isBlocked) {
                        // Removed '/' from allowed list
                        const allowed = ['/login', '/signup', '/blocked'];
                        if (!allowed.includes(pathname)) {
                            window.location.href = '/blocked';
                        }
                    }
                }
            } catch (error) {
                // Ignore errors (network glitches, etc)
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [pathname]);

    return null;
}
