'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Clock, Zap, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Exam, Rarity } from '@/app/explore/types';

interface ExamCardProps {
    exam: Exam;
}

const rarityColors: Record<Rarity, string> = {
    Uncommon: 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] bg-cyan-950/20', // Neon Blue
    Rare: 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] bg-yellow-950/20', // Neon Yellow
    Epic: 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] bg-purple-950/20', // Neon Purple
    Legendary: 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] bg-red-950/20', // Neon Red
};

const rarityTextColors: Record<Rarity, string> = {
    Uncommon: 'text-cyan-400',
    Rare: 'text-yellow-400',
    Epic: 'text-purple-400',
    Legendary: 'text-red-500',
};

const ExamCard = ({ exam }: ExamCardProps) => {
    const router = useRouter();
    const isLegendary = exam.rarity === 'Legendary';

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className={cn(
                "relative p-6 rounded-2xl border backdrop-blur-xl h-full flex flex-col justify-between transition-all duration-300",
                rarityColors[exam.rarity],
                isLegendary && "animate-[pulse_3s_infinite]"
            )}
        >
            {/* Glossy Effect Overlay */}
            <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-white/5 to-transparent pointer-events-none" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/40 border border-white/10",
                        rarityTextColors[exam.rarity]
                    )}>
                        {exam.rarity}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase">{exam.subject}</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{exam.title}</h3>
                <p className="text-sm text-gray-400 mb-6 line-clamp-3">{exam.description}</p>
            </div>

            <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-300 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-primary" />
                        <span>{exam.duration}</span>
                    </div>
                </div>

                <div className="flex items-center justify-start gap-2">
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-sm",
                        rarityTextColors[exam.rarity]
                    )}>
                        <Star size={14} fill="currentColor" />
                        <span className="font-medium">+{exam.rarityPoints} Pts</span>
                    </div>
                </div>

                <button
                    onClick={() => !exam.completed && router.push(`/test/${exam.id}`)}
                    disabled={exam.completed}
                    className={cn(
                        "w-full py-2.5 mt-2 rounded-xl font-semibold text-sm transition-colors",
                        !exam.completed && "hover:brightness-110 active:scale-95 cursor-pointer",
                        exam.completed
                            ? "bg-green-500/10 border-green-500/20 text-green-500 cursor-not-allowed opacity-80"
                            : "bg-black/50 border border-white/10 hover:bg-white/10 text-white"
                    )}>
                    {exam.completed ? "Completed" : "Start Exam"}
                </button>
            </div>
        </motion.div>
    );
};

export default ExamCard;
