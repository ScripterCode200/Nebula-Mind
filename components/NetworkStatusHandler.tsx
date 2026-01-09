'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NeonButton from './ui/NeonButton';

export default function NetworkStatusHandler() {
    const [isOnline, setIsOnline] = useState(true);
    const [isChecking, setIsChecking] = useState(false);

    const checkConnection = async () => {
        setIsChecking(true);
        try {
            // Try to fetch a small resource or ping an endpoint
            // Using a simple fetch to the origin to check connectivity
            const res = await fetch('/favicon.svg', { method: 'HEAD', cache: 'no-store' });
            if (res.ok || res.status === 404) { // 404 means server is reachable

                setIsOnline(true);
            } else {
                // If we get a response but it's not ok/404 (e.g. 500), strictly speaking we are online but server is down.
                // For "offline" check, we usually care if we can reach the server.
                setIsOnline(true);
            }
        } catch (error) {
            // Still offline
            console.log('Still offline', error);
            // Optionally blink the button or show a toast
        } finally {
            // Add a small delay for UX to show the spinner
            setTimeout(() => {
                setIsChecking(false);
            }, 800);
        }
    };

    useEffect(() => {
        // Set initial state based on navigator
        if (typeof window !== 'undefined') {
            setIsOnline(navigator.onLine);
        }

        const handleOnline = () => {
            // Don't trust the browser event blindly, verify it
            checkConnection();
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

    return (
        <AnimatePresence>
            {!isOnline && (
                <div className="fixed inset-0 z-9999 bg-background/95 backdrop-blur-3xl flex flex-col items-center justify-center p-4 text-center pointer-events-auto select-none">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
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
                            You seem to be offline. Please check your internet connection.
                        </p>

                        <div className="flex flex-col gap-4 w-full max-w-xs">
                            <NeonButton
                                onClick={checkConnection}
                                disabled={isChecking}
                                className="w-full justify-center"
                                variant="primary"
                            >
                                {isChecking ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Checking...
                                    </>
                                ) : (
                                    "Try Reconnecting"
                                )}
                            </NeonButton>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
