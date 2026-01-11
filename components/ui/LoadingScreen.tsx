'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-[#050505]">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[32px_32px]" />
            </div>

            <div className="relative flex flex-col items-center">
                {/* Logo with Breathing Animation */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                        scale: [0.9, 1.1, 0.9],
                        opacity: 1,
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                        scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                        rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                        opacity: { duration: 0.5 }
                    }}
                    className="relative mb-8"
                >
                    <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full" />
                    <div className="relative p-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
                        <Brain size={64} className="text-primary" />
                    </div>
                </motion.div>

                {/* Branded Text */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center"
                >
                    <h2 className="text-2xl font-bold tracking-tighter text-white mb-2">
                        Nebula Mind
                    </h2>
                    <p className="text-muted-foreground text-sm font-medium tracking-[0.2em] uppercase">
                        Initializing Neural Link
                    </p>
                </motion.div>

                {/* Progress Bar Container */}
                <div className="mt-10 w-48 h-1 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                    <motion.div
                        className="absolute inset-y-0 left-0 bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: ["0%", "70%", "85%", "100%"] }}
                        transition={{
                            duration: 10,
                            times: [0, 0.4, 0.8, 1],
                            ease: "easeInOut"
                        }}
                    />
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
