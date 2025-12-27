'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Zap, ArrowRight, Timer, Brain, FileQuestion, ChevronRight, Play } from 'lucide-react';
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
                "relative overflow-hidden group border transition-all duration-300 flex flex-col h-full",
                goal.completed
                    ? "border-green-500/30 bg-green-950/10"
                    : "border-white/10 bg-white/5 hover:border-primary/30"
            )}
        >
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}
            />

            <div className="relative z-10 flex flex-col h-full">
                {/* Header Row */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <Brain size={12} className="text-primary" />
                            {goal.subject}
                        </span>
                        <h4 className={cn(
                            "text-lg font-bold leading-tight transition-colors",
                            goal.completed ? "text-green-100" : "text-white group-hover:text-primary"
                        )}>
                            {goal.title}
                        </h4>
                    </div>

                    {/* Difficulty Badge */}
                    <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
                        difficultyColors[goal.difficulty]
                    )}>
                        {goal.difficulty}
                    </span>
                </div>

                <p className="text-sm text-gray-400 mb-5 line-clamp-2 leading-relaxed grow">
                    {goal.description}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-black/20 border border-white/5">
                        <Timer size={14} className="text-blue-400" />
                        <span className="text-xs font-medium text-gray-300">{goal.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-black/20 border border-white/5">
                        <FileQuestion size={14} className="text-purple-400" />
                        <span className="text-xs font-medium text-gray-300">{goal.questionsCount} Qs</span>
                    </div>
                </div>

                {/* Footer / Action */}
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                    <div className={cn(
                        "flex items-center gap-1.5",
                        goal.completed ? "text-green-400" : "text-yellow-400"
                    )}>
                        <Zap size={16} fill="currentColor" />
                        <span className="text-sm font-bold">{goal.xp} XP</span>
                    </div>

                    {goal.completed ? (
                        <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                            <CheckCircle size={14} />
                            <span className="text-xs font-bold uppercase tracking-wide">Done</span>
                        </div>
                    ) : (
                        <button
                            onClick={handleStart}
                            className="flex-1 max-w-[120px] flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer group/btn">
                            Start Test
                            <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </GlassCard>
    );
};

export default DailyGoalCard;
