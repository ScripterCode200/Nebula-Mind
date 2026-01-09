'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import { useRouter } from 'next/navigation';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Unhandled app error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#050505] text-white">
            <div className="max-w-md w-full bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">

                {/* Ambient background glow */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-primary via-blue-500 to-primary shadow-[0_0_15px_rgba(0,240,255,0.4)]" />
                <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>

                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-b from-white to-white/70 mb-2">
                        Something went wrong!
                    </h2>

                    <p className="text-muted-foreground text-sm mb-8">
                        We encountered an unexpected error. Our team has been notified.
                    </p>

                    <div className="flex flex-col gap-3 w-full">
                        <NeonButton
                            onClick={() => reset()}
                            variant="primary"
                            className="w-full justify-center"
                        >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Try Again
                        </NeonButton>

                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center justify-center w-full py-3 px-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium text-muted-foreground hover:text-white"
                        >
                            <Home className="mr-2 h-4 w-4" />
                            Back to Home
                        </button>
                    </div>

                    {error.digest && (
                        <div className="mt-8 pt-4 border-t border-white/5 w-full">
                            <p className="text-[10px] text-muted-foreground/40 font-mono">
                                Error ID: {error.digest}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
