'use client';

import { motion, Variants } from 'framer-motion';
import { Users, User, Zap, Trophy, Target, Sparkles, Rocket } from 'lucide-react';
import Link from 'next/link';
import TiltCard from '@/components/ui/TiltCard';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';

// Dynamic Background Component
const MovingBackground = () => (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Deep Space Base */}
        <div className="absolute inset-0 bg-[#050505]" />

        {/* Moving Orbs */}
        <motion.div
            animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen"
        />
        <motion.div
            animate={{
                x: [0, -100, 0],
                y: [0, 50, 0],
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen"
        />
        <motion.div
            animate={{
                x: [0, 50, -50, 0],
                y: [0, 100, -50, 0],
                opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute top-[30%] left-[40%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] mix-blend-screen"
        />

        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] opacity-20" />
    </div>
);

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15 }
    }
};

const itemVariants: Variants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 100, damping: 20 }
    }
};

export default function LearningBoosterPage() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            <MovingBackground />

            {/* Content Container - Removed fixed margins, relying on LayoutWrapper */}
            <div className="relative z-10 p-6 md:p-12 pt-32 max-w-7xl mx-auto">

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col gap-12"
                >
                    {/* Header Section */}
                    <motion.div variants={itemVariants} className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-2 backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                            <Rocket size={14} className="animate-pulse" />
                            Next-Gen Training
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-white via-white to-white/50 drop-shadow-2xl">
                            Play Zone
                            <span className="text-primary ml-1 inline-block animate-bounce delay-1000">.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
                            Engage in high-velocity learning sessions. Select your mode to begin maximizing your cognitive retention.
                        </p>
                    </motion.div>

                    {/* Cards Grid */}
                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mt-4 perspective-1000">

                        {/* Multiplayer Mode */}
                        <TiltCard className="h-full">
                            <Link href="#" className="block h-full group">
                                <GlassCard className="h-full relative overflow-hidden bg-black/40! backdrop-blur-xl! border border-white/10 group-hover:border-cyan-500/50 transition-all duration-500 p-0!">

                                    {/* Image/Graphic Area */}
                                    <div className="relative h-48 bg-linear-to-br from-cyan-900/20 to-blue-900/20 overflow-hidden">
                                        <div className="absolute inset-0 bg-cyan-500/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                            <Users size={80} className="text-cyan-500/40 group-hover:scale-110 group-hover:text-cyan-400 transition-all duration-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                                        </div>
                                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-xs font-bold text-white/80">LIVE</span>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-8 relative">
                                        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        <h2 className="text-3xl font-bold mb-3 text-white group-hover:text-cyan-400 transition-colors">Multiplayer</h2>
                                        <p className="text-muted-foreground mb-6 leading-relaxed">
                                            Compete against peers in real-time. Climb the global leaderboards and earn exclusive badges.
                                        </p>

                                        <div className="flex flex-wrap gap-3 mb-8">
                                            <span className="px-3 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase">Ranked</span>
                                            <span className="px-3 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase">1v1 Battles</span>
                                        </div>

                                        <button className="w-full py-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/50 text-cyan-400 font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                                            Coming soon <Sparkles size={16} />
                                        </button>
                                    </div>
                                </GlassCard>
                            </Link>
                        </TiltCard>

                        {/* Single Player Mode */}
                        <TiltCard className="h-full">
                            <Link href="/learning-booster/single-player" className="block h-full group">
                                <GlassCard className="h-full relative overflow-hidden bg-black/40! backdrop-blur-xl! border border-white/10 group-hover:border-purple-500/50 transition-all duration-500 p-0!">

                                    {/* Image/Graphic Area */}
                                    <div className="relative h-48 bg-linear-to-br from-purple-900/20 to-pink-900/20 overflow-hidden">
                                        <div className="absolute inset-0 bg-purple-500/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                            <Target size={80} className="text-purple-500/40 group-hover:scale-110 group-hover:text-purple-400 transition-all duration-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-8 relative">
                                        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-purple-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        <h2 className="text-3xl font-bold mb-3 text-white group-hover:text-purple-400 transition-colors">Single Player</h2>
                                        <p className="text-muted-foreground mb-6 leading-relaxed">
                                            Master topics at your own pace. AI-driven adaptive quizzes that evolve with your performance.
                                        </p>

                                        <div className="flex flex-wrap gap-3 mb-8">
                                            <span className="px-3 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase">Adaptive</span>
                                            <span className="px-3 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase">Deep Focus</span>
                                        </div>

                                        <button className="w-full py-4 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/50 text-purple-400 font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                                            Coming soon <Zap size={16} />
                                        </button>
                                    </div>
                                </GlassCard>
                            </Link>
                        </TiltCard>

                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
