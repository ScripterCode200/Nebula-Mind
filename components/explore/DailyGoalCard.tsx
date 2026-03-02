'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Zap, ArrowRight, Timer, Brain, FileQuestion, ChevronRight, Play, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DailyGoal } from '@/app/explore/types';
import GlassCard from '../ui/GlassCard';

interface DailyGoalCardProps {
    goal: DailyGoal;
    onStart?: (goal: DailyGoal) => void;
}

const difficultyColors = {
    Easy: 'text-green-400 bg-green-500/10 border-green-500/20',
    Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    Hard: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const DailyGoalCard = ({ goal, onStart }: DailyGoalCardProps) => {
    const router = useRouter();

    const handleStart = () => {
        if (onStart) {
            onStart(goal);
        } else {
            router.push(`/test/${goal.id}`);
        }
    };

    return (
        <GlassCard
            hoverEffect
            className={cn(
                "relative overflow-hidden group border transition-all duration-500 flex flex-col h-full rounded-2xl sm:rounded-3xl",
                goal.completed
                    ? "border-green-500/30 bg-green-500/5 shadow-[0_0_30px_rgba(34,197,94,0.1)]"
                    : "border-white/10 bg-white/5 hover:border-primary/40 hover:bg-white/10"
            )}
        >
            {/* Premium Background Accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 blur-[60px] rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
            />

            <div className="relative z-10 flex flex-col h-full p-0.5 sm:p-1">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-4 sm:mb-5">
                    <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1 rounded sm:p-1.5 sm:rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                                <Brain size={12} className="text-primary sm:w-3.5 sm:h-3.5" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 truncate">
                                {goal.subject}
                            </span>
                        </div>
                        <h4 className={cn(
                            "text-lg sm:text-xl font-bold tracking-tight transition-colors duration-300 line-clamp-1 sm:line-clamp-2",
                            goal.completed ? "text-green-400" : "text-white group-hover:text-primary/90"
                        )}>
                            {goal.title}
                        </h4>
                    </div>

                    <div className={cn(
                        "px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-sm ml-2",
                        difficultyColors[goal.difficulty]
                    )}>
                        {goal.difficulty}
                    </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-6 group-hover:text-muted-foreground/90 transition-colors">
                    {goal.description}
                </p>

                {/* Info Bar */}
                <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md">
                        <Timer size={12} className="text-primary/70 sm:w-3.5 sm:h-3.5" />
                        <span className="text-[10px] sm:text-xs font-semibold text-white/80">{goal.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md">
                        <FileQuestion size={12} className="text-secondary/70 sm:w-3.5 sm:h-3.5" />
                        <span className="text-[10px] sm:text-xs font-semibold text-white/80">{goal.questionsCount} Qs</span>
                    </div>
                </div>

                {/* Footer Action Area */}
                <div className="mt-auto pt-4 sm:pt-6 border-t border-white/10 flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "p-1.5 sm:p-2 rounded-full",
                            goal.completed ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                        )}>
                            <Zap size={14} fill="currentColor" className="animate-pulse sm:w-4 sm:h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5">Reward</span>
                            <span className={cn(
                                "text-xs sm:text-sm font-black",
                                goal.completed ? "text-green-400" : "text-white"
                            )}>{goal.xp} <span className="text-[9px] sm:text-[10px] opacity-70">XP</span></span>
                        </div>
                    </div>

                    <div className="flex-1 max-w-[120px] sm:max-w-[160px]">
                        {goal.completed ? (
                            <div className="w-full flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                                <CheckCircle size={14} className="shrink-0 sm:w-4 sm:h-4" />
                                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Done</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1.5 sm:gap-2">
                                {goal.status === 'disqualified' ? (
                                    <div className="w-full text-center py-2 sm:py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest sm:tracking-[0.15em]">
                                        Disqualified
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground/40 uppercase">Tries</span>
                                            <span className={cn(
                                                "text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md",
                                                (goal.cheatAttempts || 0) >= 2
                                                    ? "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                                                    : "bg-white/10 text-white/80"
                                            )}>
                                                {3 - (goal.cheatAttempts || 0)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleStart}
                                            className="w-full flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 rounded-xl bg-primary text-black hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer active:scale-[0.95] group/btn"
                                        >
                                            {(goal.cheatAttempts || 0) > 0 ? "Retry" : "Start"}
                                            <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform sm:w-3.5 sm:h-3.5" />
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};

export default DailyGoalCard;
