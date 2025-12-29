'use client';

import { motion } from 'framer-motion';
import { Trophy, Sparkles, Timer } from 'lucide-react';

export default function LeaderboardPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative group mr-10"
            >
                {/* Aurora Glow Background */}
                <div className="absolute -inset-10 bg-linear-to-r from-primary/20 via-purple-500/10 to-primary/20 rounded-full blur-[80px] opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

                <div className="relative flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center mb-8 relative">
                        <Trophy size={48} className="text-primary animate-pulse" />
                        <div className="absolute -top-2 -right-2 bg-primary/20 text-primary text-[10px] font-black px-4 py-0.5 rounded-full border border-primary/30 uppercase tracking-widest">
                            Neural
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-4 uppercase">
                        The <span className="text-primary italic">Leaderboard</span>
                    </h1>
                    <p className="text-lg text-muted/60 max-w-md mx-auto mb-8 font-medium">
                        Global neural ranking system is currently undergoing synchronization.
                        Prepare for competitive knowledge synthesis.
                    </p>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-[0.2em] text-white/40">
                            <Timer size={14} className="text-primary" /> Synchronizing...
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-[0.2em] text-white/40">
                            <Sparkles size={14} className="text-primary" /> Coming Soon
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
