'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NetworkStatusHandler() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Set initial state based on navigator
        if (typeof window !== 'undefined') {
            setIsOnline(navigator.onLine);
        }

        const handleOnline = () => {
            setIsOnline(true);
            window.location.reload();
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-3xl flex flex-col items-center justify-center p-4 text-center pointer-events-auto select-none">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center max-w-md w-full"
            >
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse-slow" />
                    <div className="relative w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <WifiOff className="w-12 h-12 text-red-500" />
                    </div>
                </div>

                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-b from-white to-white/70 mb-4">
                    Connection Lost
                </h2>

                <p className="text-muted-foreground text-lg mb-8">
                    Your internet connection appears to be offline.
                    <br />
                    We'll reconnect you automatically once you're back online.
                </p>

                <div className="flex items-center gap-2 text-sm text-muted-foreground/60 font-mono border border-white/5 rounded-full px-4 py-2 bg-white/5">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-blink" />
                    Waiting for network...
                </div>
            </motion.div>
        </div>
    );
}
