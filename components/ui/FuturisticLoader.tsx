'use client';

import { motion } from 'framer-motion';

interface FuturisticLoaderProps {
    text?: string;
    subtext?: string;
    progress?: number;
}

export default function FuturisticLoader({ text = "Loading...", subtext, progress }: FuturisticLoaderProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative w-16 h-16">
                {/* Outer Ring */}
                <motion.div
                    className="absolute inset-0 border-4 border-t-cyan-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />

                {/* Inner Ring */}
                <motion.div
                    className="absolute inset-2 border-4 border-t-transparent border-r-blue-500 border-b-transparent border-l-cyan-500 rounded-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />

                {/* Center Dot or Progress */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {progress !== undefined ? (
                        <span className="text-[10px] font-bold text-white font-mono">{Math.round(progress)}%</span>
                    ) : (
                        <motion.div
                            className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        />
                    )}
                </div>
            </div>

            <div className="text-center space-y-1">
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-sm font-mono text-cyan-400 tracking-widest uppercase"
                >
                    {text}
                </motion.p>

                {subtext && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-xs text-muted-foreground"
                    >
                        {subtext}
                    </motion.p>
                )}
            </div>

            {progress !== undefined && (
                <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                    <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            )}
        </div>
    );
}
