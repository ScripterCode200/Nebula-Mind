'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FancyProgressBarProps {
    progress: number; // 0 to 100
    label?: string;
    className?: string;
    color?: string; // Hex or Tailwind class prefix
}

const FancyProgressBar = ({ progress, label, className, color = 'primary' }: FancyProgressBarProps) => {
    return (
        <div className={cn("w-full max-w-md mx-auto", className)}>
            {label && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-muted-foreground">{label}</span>
                    <span className="text-sm font-bold text-white">{Math.round(progress)}%</span>
                </div>
            )}

            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
                {/* Background Glow */}
                <div className={cn(
                    "absolute inset-0 opacity-20 blur-sm transition-all duration-500",
                    `bg-${color}`
                )} />

                {/* Progress Bar */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                    className={cn(
                        "h-full relative rounded-full shadow-[0_0_10px_rgba(0,240,255,0.5)]",
                        color === 'primary' ? "bg-primary shadow-primary/50" :
                            color === 'secondary' ? "bg-secondary shadow-secondary/50" :
                                "bg-white shadow-white/50"
                    )}
                >
                    {/* Shimmer Effect */}
                    <motion.div
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2"
                    />
                </motion.div>
            </div>
        </div>
    );
};

export default FancyProgressBar;
