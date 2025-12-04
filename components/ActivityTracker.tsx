'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';

import { useUserStore } from '@/store/useUserStore';

export default function ActivityTracker() {
    const pathname = usePathname();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const { updateStats } = useUserStore();

    useEffect(() => {
        const sendHeartbeat = async () => {
            // 1. Visibility Check (Multi-Tab Fix)
            if (document.visibilityState !== 'visible') return;

            try {
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const res = await fetch('/api/activity/heartbeat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ timezone })
                });

                if (res.ok) {
                    const data = await res.json();

                    // 2. Update Stats in Store
                    if (data.stats) {
                        updateStats(data.stats);
                    }

                    // 3. Achievement Popup
                    if (data.newAchievements && data.newAchievements.length > 0) {
                        data.newAchievements.forEach((ach: any) => {
                            toast.success(`Achievement Unlocked: ${ach.name}!`, {
                                description: 'Check your profile to see your new badge.',
                                duration: 5000,
                            });
                        });
                    }
                }
            } catch (error) {
                // Silent fail
            }
        };

        // Start Interval (1 minute)
        intervalRef.current = setInterval(sendHeartbeat, 60 * 1000);

        // Initial call after 5 seconds (to count short sessions)
        setTimeout(sendHeartbeat, 5000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [updateStats]);

    return null;
}
