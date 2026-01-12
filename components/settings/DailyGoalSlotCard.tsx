'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Timer, Zap, BookOpen, Layers, CheckCircle, XCircle, Power } from 'lucide-react';
import { cn } from '@/lib/utils';
import CustomSelect from '@/components/ui/CustomSelect';

// Types (mirrored from page.tsx for local usage)
type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface DailyGoalConfig {
    id: number;
    enabled: boolean;
    subject: string;
    difficulty: string;
    topic: string;
    isTimeBound: boolean;
}

interface DailyGoalSlotCardProps {
    config: DailyGoalConfig;
    index: number;
    subjectOptions: { value: string; label: string }[];
    onUpdate: (updates: Partial<DailyGoalConfig>) => void;
}

export default function DailyGoalSlotCard({ config, index, subjectOptions, onUpdate }: DailyGoalSlotCardProps) {
    const isEnabled = config.enabled;

    // Difficulty Color Mapping
    const difficultyColors = {
        Easy: 'from-emerald-400 to-emerald-600',
        Medium: 'from-amber-400 to-amber-600',
        Hard: 'from-rose-500 to-red-600',
    };

    const currentDifficultyColor = difficultyColors[config.difficulty as Difficulty] || 'from-blue-400 to-blue-600';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
                "relative group rounded-2xl p-px overflow-hidden transition-all duration-300",
                isEnabled ? "hover:scale-[1.01]" : "opacity-60 grayscale-[0.5]"
            )}
        >
            {/* Animated Border Gradient */}
            <div className={cn(
                "absolute inset-0 bg-linear-to-r via-slate-500/10 to-transparent transition-all duration-500",
                isEnabled
                    ? "from-cyan-500/50 via-purple-500/50 to-pink-500/50 opacity-40 group-hover:opacity-100 animate-gradient-xy"
                    : "from-gray-700 to-gray-800 opacity-20"
            )} />

            {/* Card Content */}
            <div className="relative h-full bg-[#0a0a0a]/90 backdrop-blur-xl rounded-2xl p-5 border border-white/5 shadow-xl flex flex-col gap-6">

                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Slot Number Badge */}
                        <div className={cn(
                            "relative w-12 h-12 flex items-center justify-center rounded-xl font-mono text-xl font-bold border transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.3)]",
                            isEnabled
                                ? "bg-black/50 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                                : "bg-white/5 border-white/10 text-muted-foreground"
                        )}>
                            <span className="relative z-10">{String(index + 1).padStart(2, '0')}</span>
                            {/* Inner Glow */}
                            {isEnabled && <div className="absolute inset-0 bg-cyan-500/10 blur-md rounded-xl" />}
                        </div>

                        <div>
                            <h3 className={cn(
                                "font-bold text-lg tracking-tight transition-colors",
                                isEnabled ? "text-white" : "text-muted-foreground"
                            )}>
                                Daily Slot {index + 1}
                            </h3>
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <span className={cn("w-1.5 h-1.5 rounded-full", isEnabled ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                                {isEnabled ? "Active & Scheduled" : "Disabled"}
                            </div>
                        </div>
                    </div>

                    {/* Enable Toggle Switch */}
                    <button
                        onClick={() => onUpdate({ enabled: !isEnabled })}
                        className={cn(
                            "relative w-14 h-8 rounded-full transition-all duration-300 border flex items-center p-1",
                            isEnabled
                                ? "bg-green-500/10 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                                : "bg-white/5 border-white/10 hover:border-white/30"
                        )}
                    >
                        <motion.div
                            animate={{ x: isEnabled ? 24 : 0 }}
                            className={cn(
                                "w-5 h-5 rounded-full shadow-sm flex items-center justify-center",
                                isEnabled ? "bg-green-400 text-black" : "bg-gray-500 text-white"
                            )}
                        >
                            <Power size={12} strokeWidth={3} />
                        </motion.div>
                    </button>
                </div>

                {/* Controls Section */}
                <div className={cn(
                    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 transition-all duration-500 ease-in-out",
                    !isEnabled && "opacity-30 pointer-events-none blur-[1px]"
                )}>

                    {/* Subject Select (Span 4) */}
                    <div className="lg:col-span-4 space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-cyan-500/70 tracking-wider flex items-center gap-1.5">
                            <BookOpen size={10} /> Source Material
                        </label>
                        <CustomSelect
                            value={config.subject}
                            onChange={(val) => onUpdate({ subject: val })}
                            options={subjectOptions}
                            placeholder="Select Subject..."
                            className="bg-black/40 border-white/10 h-[42px] hover:border-cyan-500/30 transition-colors"
                        />
                    </div>

                    {/* Topic Input (Span 4) */}
                    <div className="lg:col-span-4 space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-purple-500/70 tracking-wider flex items-center gap-1.5">
                            <Target size={10} /> Specific Topic
                        </label>
                        <div className="relative group/input">
                            <input
                                type="text"
                                placeholder="E.g. Quantum Physics..."
                                value={config.topic}
                                onChange={(e) => onUpdate({ topic: e.target.value })}
                                className="w-full h-[42px] px-4 rounded-xl bg-black/40 border border-white/10 text-sm focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all placeholder:text-muted-foreground/30 font-medium"
                            />
                            {/* Focus Beam */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-purple-500 transition-all duration-300 group-focus-within/input:w-full" />
                        </div>
                    </div>

                    {/* Difficulty (Span 2) */}
                    <div className="lg:col-span-2 space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-amber-500/70 tracking-wider flex items-center gap-1.5">
                            <Layers size={10} /> Level
                        </label>
                        <div className="h-[42px] bg-black/40 rounded-xl p-1 border border-white/10 flex relative isolate">
                            {['Easy', 'Medium', 'Hard'].map((diff) => {
                                const active = config.difficulty === diff;
                                return (
                                    <button
                                        key={diff}
                                        onClick={() => onUpdate({ difficulty: diff })}
                                        className={cn(
                                            "flex-1 relative z-10 text-[10px] font-bold uppercase transition-colors duration-300",
                                            active ? "text-black" : "text-muted-foreground hover:text-white"
                                        )}
                                    >
                                        {active && (
                                            <motion.div
                                                layoutId={`diff-bg-${config.id}`}
                                                className={cn("absolute inset-0 rounded-lg bg-linear-to-r", difficultyColors[diff as Difficulty] || 'from-gray-100 to-gray-300')}
                                                initial={false}
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <span className="relative z-20">{diff}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Timer Toggle (Span 2) */}
                    <div className="lg:col-span-2 space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-emerald-500/70 tracking-wider flex items-center gap-1.5">
                            <Timer size={10} /> Timer
                        </label>
                        <button
                            onClick={() => onUpdate({ isTimeBound: !config.isTimeBound })}
                            className={cn(
                                "w-full h-[42px] px-3 rounded-xl border flex items-center justify-between transition-all duration-300 overflow-hidden relative",
                                config.isTimeBound
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                                    : "bg-black/40 border-white/10 text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            <span className="text-xs font-bold z-10">{config.isTimeBound ? 'ON' : 'OFF'}</span>
                            <Zap size={14} className={cn("z-10 transition-transform", config.isTimeBound ? "fill-emerald-400 text-emerald-400" : "text-muted-foreground")} />

                            {config.isTimeBound && (
                                <motion.div
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    className="absolute inset-0 bg-linear-to-r from-transparent via-emerald-500/10 to-transparent w-full skew-x-12"
                                />
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </motion.div>
    );
}
