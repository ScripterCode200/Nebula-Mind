import React from 'react';
import { motion } from 'framer-motion';
import { Target, Shield, Gem, Crown } from 'lucide-react';
import GlassCard from './GlassCard';

interface RarityStatsProps {
    stats: {
        uncommon: number;
        rare: number;
        epic: number;
        legendary: number;
    };
}

const RarityStats = ({ stats }: RarityStatsProps) => {
    const items = [
        {
            label: 'Uncommon',
            value: stats.uncommon || 0,
            icon: Target,
            color: 'text-green-400',
            bg: 'bg-green-400/10',
            border: 'group-hover:border-green-400/50',
            shadow: 'group-hover:shadow-[0_0_20px_rgba(74,222,128,0.2)]'
        },
        {
            label: 'Rare',
            value: stats.rare || 0,
            icon: Shield,
            color: 'text-yellow-400', // Gold/Yellow
            bg: 'bg-yellow-400/10',
            border: 'group-hover:border-yellow-400/50',
            shadow: 'group-hover:shadow-[0_0_20px_rgba(250,204,21,0.2)]'
        },
        {
            label: 'Epic',
            value: stats.epic || 0,
            icon: Gem, // Changed to Gem
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
            border: 'group-hover:border-purple-400/50',
            shadow: 'group-hover:shadow-[0_0_20px_rgba(192,132,252,0.2)]'
        },
        {
            label: 'Legendary',
            value: stats.legendary || 0,
            icon: Crown,
            color: 'text-red-500',
            bg: 'bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]', // Subtle inner glow
            border: 'border-red-500/30',
            shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)] group-hover:shadow-[0_0_25px_rgba(239,68,68,0.3)]', // Subtle outer glow + hover
            pulse: true
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {items.map((item, index) => (
                <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <GlassCard className={`p-4 flex items-center gap-4 transition-all duration-300 border border-white/5 group ${item.border} ${item.shadow}`}>
                        <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
                            <item.icon size={24} className="relative z-10" />
                            {item.pulse && (
                                <div className="absolute inset-0 rounded-xl bg-red-500/10 animate-pulse z-0 duration-1000" />
                            )}
                        </div>
                        <div>
                            <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{item.label}</div>
                        </div>
                    </GlassCard>
                </motion.div>
            ))}
        </div>
    );
};

export default RarityStats;
