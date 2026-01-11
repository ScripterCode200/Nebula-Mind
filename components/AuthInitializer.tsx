'use client';

import React, { useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import LoadingScreen from './ui/LoadingScreen';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
    const { isInitialized, fetchUser } = useUserStore();

    useEffect(() => {
        // Trigger the initial authentication check on mount
        fetchUser();
    }, [fetchUser]);

    if (!isInitialized) {
        return <LoadingScreen />;
    }

    return <>{children}</>;
}
