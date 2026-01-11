'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Cpu, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface FuturisticSelectProps {
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    className?: string;
}

export default function FuturisticSelect({ value, options, onChange, className }: FuturisticSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(o => o.value === value) || options[0];

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-xl border transition-all duration-300 min-w-[180px] group",
                    isOpen
                        ? "bg-primary/10 border-primary/40 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]"
                        : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                )}
            >
                <div className="p-1 rounded-md bg-white/5 group-hover:bg-primary/10 transition-colors">
                    {selectedOption.icon || <Cpu size={14} className={isOpen ? "text-primary" : "text-muted-foreground"} />}
                </div>

                <div className="flex-1 text-left">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground leading-none mb-1">Model</p>
                    <p className="text-xs font-bold text-white truncate">{selectedOption.label}</p>
                </div>

                <ChevronDown
                    size={14}
                    className={cn(
                        "text-muted-foreground transition-transform duration-300",
                        isOpen && "rotate-180 text-primary"
                    )}
                />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Mobile Backdrop Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-99 md:hidden"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className={cn(
                                "z-100 bg-[#0A0A0A] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden",
                                // Desktop positioning: Absolute below button
                                "md:absolute md:top-full md:left-0 md:right-0 md:mt-2 md:rounded-2xl md:w-full md:min-w-[220px]",
                                // Mobile positioning: Bottom sheet or centered
                                "fixed bottom-0 left-0 right-0 rounded-t-3xl md:relative md:bottom-auto md:left-auto md:right-auto"
                            )}
                        >
                            {/* Mobile Header (Drag indicator/Title) */}
                            <div className="md:hidden flex flex-col items-center py-4 border-b border-white/5">
                                <div className="w-12 h-1 bg-white/10 rounded-full mb-4" />
                                <div className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-primary" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Select Intelligence</span>
                                </div>
                            </div>

                            <div className="p-2 space-y-1">
                                {options.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all group relative",
                                            value === option.value
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-2 rounded-lg bg-white/5",
                                            value === option.value && "bg-primary/20 text-primary"
                                        )}>
                                            {option.icon || <Cpu size={16} />}
                                        </div>

                                        <div className="flex-1 text-left">
                                            <p className="text-xs font-bold leading-none mb-1">{option.label}</p>
                                            <p className="text-[10px] opacity-40 uppercase tracking-tighter">High performance neural engine</p>
                                        </div>

                                        {value === option.value && (
                                            <motion.div
                                                layoutId="selectedIndicator"
                                                className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#00f0ff]"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Mobile Padding for safe areas */}
                            <div className="h-8 md:hidden" />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
