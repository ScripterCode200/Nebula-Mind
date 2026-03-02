'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Clock, Zap, Target, Shield, Gem, Crown, CheckCircle, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Exam, Rarity } from '@/app/explore/types';

interface ExamCardProps {
    exam: Exam;
}

const rarityColors: Record<Rarity, string> = {
    Uncommon: 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] bg-green-950/20', // Emerald
    Rare: 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] bg-yellow-950/20', // Neon Yellow
    Epic: 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] bg-purple-950/20', // Neon Purple
    Legendary: 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] bg-red-950/20', // Neon Red
};

const rarityTextColors: Record<Rarity, string> = {
    Uncommon: 'text-green-400',
    Rare: 'text-yellow-400',
    Epic: 'text-purple-400',
    Legendary: 'text-red-500',
};

const rarityIcons: Record<Rarity, any> = {
    Uncommon: Target,
    Rare: Shield,
    Epic: Gem,
    Legendary: Crown,
};

const ExamCard = ({ exam }: ExamCardProps) => {
    const router = useRouter();
    const isLegendary = exam.rarity === 'Legendary';
    const RarityIcon = rarityIcons[exam.rarity] || Star;

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className={cn(
                "relative p-5 sm:p-6 rounded-2xl sm:rounded-3xl border backdrop-blur-xl h-full flex flex-col justify-between transition-all duration-500 overflow-hidden group",
                rarityColors[exam.rarity],
                isLegendary && "animate-[pulse_4s_infinite]"
            )}
        >
            {/* Premium Background Accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors duration-500" />

            {/* Glossy Effect Overlay */}
            <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-white/10 to-transparent pointer-events-none" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4 sm:mb-5 gap-2">
                    <span className={cn(
                        "px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-black/40 border border-white/10 shadow-lg flex items-center gap-1 sm:gap-1.5 shrink-0",
                        rarityTextColors[exam.rarity]
                    )}>
                        <RarityIcon size={12} fill="currentColor" className="sm:w-3 sm:h-3" />
                        {exam.rarity}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em] sm:tracking-[0.2em] truncate">{exam.subject}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white mb-2 sm:mb-3 tracking-tight line-clamp-1 sm:line-clamp-2 leading-tight group-hover:text-primary/90 transition-colors duration-300">
                    {exam.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                    {exam.description}
                </p>
            </div>

            <div className="relative z-10 space-y-4 sm:space-y-5">
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-300 border-t border-white/10 pt-4 sm:pt-5">
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-black/30 border border-white/5 backdrop-blur-md">
                        <Clock size={14} className="text-primary/70 sm:w-4 sm:h-4" />
                        <span className="font-semibold text-white/80">{exam.duration}</span>
                    </div>

                    <div className={cn(
                        "flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-black/40 border border-white/10 text-[9px] sm:text-xs shadow-inner",
                        rarityTextColors[exam.rarity]
                    )}>
                        <RarityIcon size={12} fill="currentColor" className={cn("sm:w-3.5 sm:h-3.5", isLegendary && "animate-pulse")} />
                        <span className="font-black">1 Point</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {exam.completed ? (
                        <div className="w-full py-3 rounded-2xl font-black text-xs bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                            <CheckCircle size={16} />
                            <span className="uppercase tracking-widest">Mastered</span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {exam.status === 'disqualified' ? (
                                <div className="w-full py-3 rounded-2xl font-black text-[10px] bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center uppercase tracking-[0.2em]">
                                    Disqualified
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground/40 uppercase">Tries</span>
                                        <span className={cn(
                                            "text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-sm",
                                            (exam.cheatAttempts || 0) >= 2
                                                ? "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                                                : "bg-white/10 text-white/80"
                                        )}>
                                            {3 - (exam.cheatAttempts || 0)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/test/${exam.id}`)}
                                        className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs transition-all duration-300 bg-white text-black hover:bg-white/90 hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] flex items-center justify-center gap-1.5 sm:gap-2 uppercase tracking-widest cursor-pointer active:scale-[0.95]"
                                    >
                                        {(exam.cheatAttempts || 0) > 0 ? "Retry" : "Start"}
                                        <RarityIcon size={12} className="group-hover:rotate-12 transition-transform sm:w-3.5 sm:h-3.5" />
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ExamCard;
