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
                "relative overflow-hidden group border transition-all duration-500 flex flex-col h-full rounded-3xl",
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

            <div className="relative z-10 flex flex-col h-full p-1">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-5">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                                <Brain size={14} className="text-primary" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
                                {goal.subject}
                            </span>
                        </div>
                        <h4 className={cn(
                            "text-xl font-bold tracking-tight transition-colors duration-300",
                            goal.completed ? "text-green-400" : "text-white group-hover:text-primary/90"
                        )}>
                            {goal.title}
                        </h4>
                    </div>

                    <div className={cn(
                        "px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider shadow-sm",
                        difficultyColors[goal.difficulty]
                    )}>
                        {goal.difficulty}
                    </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-6 group-hover:text-muted-foreground/90 transition-colors">
                    {goal.description}
                </p>

                {/* Info Bar */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md">
                        <Timer size={14} className="text-primary/70" />
                        <span className="text-xs font-semibold text-white/80">{goal.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md">
                        <FileQuestion size={14} className="text-secondary/70" />
                        <span className="text-xs font-semibold text-white/80">{goal.questionsCount} Qs</span>
                    </div>
                </div>

                {/* Footer Action Area */}
                <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "p-2 rounded-full",
                            goal.completed ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                        )}>
                            <Zap size={16} fill="currentColor" className="animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Reward</span>
                            <span className={cn(
                                "text-sm font-black",
                                goal.completed ? "text-green-400" : "text-white"
                            )}>{goal.xp} XP</span>
                        </div>
                    </div>

                    <div className="flex-1 max-w-[160px]">
                        {goal.completed ? (
                            <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                                <CheckCircle size={16} className="shrink-0" />
                                <span className="text-xs font-black uppercase tracking-widest">Mastered</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {goal.status === 'disqualified' ? (
                                    <div className="w-full text-center py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.15em]">
                                        Disqualified
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">Attempts</span>
                                            <span className={cn(
                                                "text-[10px] font-black px-2 py-0.5 rounded-md tracking-tighter",
                                                (goal.cheatAttempts || 0) >= 2
                                                    ? "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                                                    : "bg-white/10 text-white/80"
                                            )}>
                                                {3 - (goal.cheatAttempts || 0)}/3
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleStart}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-black hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] text-[11px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer active:scale-[0.98] group/btn"
                                        >
                                            {(goal.cheatAttempts || 0) > 0 ? "Retry Goal" : "Start Goal"}
                                            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
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
