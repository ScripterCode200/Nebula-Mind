'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import './globals.css';
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Critical Global Error:', error);
    }, [error]);

    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#050505] text-white min-h-screen flex items-center justify-center`}>
                <div className="flex flex-col items-center max-w-md p-6 text-center">
                    <div className="w-24 h-24 rounded-full bg-red-900/20 border border-red-500/30 flex items-center justify-center mb-6 animate-pulse">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>

                    <h1 className="text-4xl font-black mb-4 tracking-tighter">Critical Error</h1>

                    <p className="text-gray-400 mb-8 max-w-xs mx-auto">
                        The application encountered a critical error and cannot recover automatically.
                    </p>

                    <button
                        onClick={() => reset()}
                        className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform active:scale-95"
                    >
                        Reload Application
                    </button>
                </div>
            </body>
        </html>
    );
}
