import React from 'react';
import { notFound } from 'next/navigation';
import User from '@/models/User'; // Adjust path if needed
import connectToDatabase from '@/lib/db';
import { Mail, Calendar, Award, Book, Brain, Clock, Flame, Library, Share2, User as UserIcon, Star, Trophy } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import Link from 'next/link';
import { getRank } from '@/lib/levelUtils';
import mongoose from 'mongoose';

// Icon mapping for achievements
const iconMap: any = {
    Book, Library, Brain, Clock, Flame, Award
};

async function getUserData(userId: string) {
    try {
        await connectToDatabase();
        if (!userId || userId === 'undefined' || !mongoose.Types.ObjectId.isValid(userId)) {
            return null;
        }
        const user = await User.findById(userId).select('-password -otp -otpExpiry').lean();
        if (!user) return null;

        return JSON.parse(JSON.stringify(user));
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

export default async function PublicProfilePage({ params }: { params: { userId: string } }) {
    const { userId } = await params;
    const user = await getUserData(userId);

    if (!user) {
        notFound();
    }

    const rank = getRank(user.stats?.xp || 0);

    return (
        <main className="min-h-screen bg-[#050505] text-white pt-32 pb-20 px-4 md:px-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Profile Header Dossier */}
                <GlassCard className="p-8 mb-12 border-primary/20 bg-black/40 backdrop-blur-3xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10 font-mono text-[10px] hidden md:block">
                        USER_DOSSIER_ID: {userId.toUpperCase()}
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                        <div className="relative shrink-0">
                            <div className={`w-36 h-36 md:w-44 md:h-44 rounded-full bg-linear-to-br ${rank.gradient} p-[3px] shadow-[0_0_40px_${rank.glow}]`}>
                                <div className="w-full h-full rounded-full bg-[#050505] flex items-center justify-center overflow-hidden border-4 border-[#050505]">
                                    {user.profileImage ? (
                                        <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <UserIcon size={64} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest mt-2">No BioMetric</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#050505] border border-white/10 px-4 py-1 rounded-full shadow-2xl">
                                <span className={`text-[10px] font-black tracking-[0.3em] uppercase bg-clip-text text-transparent bg-linear-to-r ${rank.gradient}`}>
                                    {rank.name}
                                </span>
                            </div>
                        </div>

                        <div className="text-center md:text-left flex-1 space-y-4">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-white to-white/60">
                                    {user.name}
                                </h1>
                                <p className="text-muted-foreground/80 leading-relaxed italic max-w-xl">
                                    "{user.bio || 'This user maintains a classified neural profile.'}"
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-mono">
                                <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground">
                                    <Calendar size={14} className="text-primary/60" /> ESTABLISHED_{new Date(user.createdAt || user.joinedAt).getFullYear()}
                                </span>
                                {user.university && (
                                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                                        <Library size={14} /> {user.university.toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 shrink-0 sm:min-w-[180px]">
                            <NeonButton className="w-full justify-center px-8 h-12 flex items-center gap-2">
                                <Share2 size={18} />
                                Share Dossier
                            </NeonButton>
                            <Link href="/leaderboard" className="w-full">
                                <NeonButton variant="secondary" className="w-full justify-center px-8 h-12 flex items-center gap-2">
                                    <Trophy size={18} />
                                    Global Rank
                                </NeonButton>
                            </Link>
                        </div>
                    </div>
                </GlassCard>

                {/* Tactical Stats Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Neural Level', value: user.stats?.level || 1, icon: Star, color: 'text-primary' },
                        { label: 'Total XP', value: user.stats?.xp || 0, icon: Brain, color: 'text-secondary' },
                        { label: 'Login Streak', value: user.stats?.streak?.current || 0, icon: Flame, color: 'text-orange-400' },
                        { label: 'Hours Invested', value: `${Math.floor((user.stats?.totalTimeSpent || 0) / 60)}h`, icon: Clock, color: 'text-blue-400' }
                    ].map((stat, i) => (
                        <GlassCard key={i} className="p-6 text-center group hover:bg-white/5 transition-all">
                            <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mx-auto mb-4 ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={20} />
                            </div>
                            <div className={`text-4xl font-black mb-1 ${stat.color}`}>{stat.value}</div>
                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                        </GlassCard>
                    ))}
                </div>

                {/* Sub-Stats: Rarity Discoveries */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <GlassCard className="p-8 border-white/5">
                        <h2 className="text-xl font-black mb-8 flex items-center gap-3 tracking-tight">
                            <Library size={24} className="text-primary" />
                            MODULE RARITY STATS
                        </h2>
                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { label: 'Uncommon', val: user.stats?.rarityStats?.uncommon || 0, color: 'text-slate-400' },
                                { label: 'Rare', val: user.stats?.rarityStats?.rare || 0, color: 'text-emerald-400' },
                                { label: 'Epic', val: user.stats?.rarityStats?.epic || 0, color: 'text-purple-400' },
                                { label: 'Legendary', val: user.stats?.rarityStats?.legendary || 0, color: 'text-yellow-400' }
                            ].map((rs, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">{rs.label}</span>
                                        <span className={`text-xl font-black ${rs.color}`}>{rs.val}</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full bg-current ${rs.color} opacity-30 w-[${Math.min(100, (rs.val / 50) * 100)}%] transition-all`} style={{ width: `${Math.min(100, (rs.val / 50) * 100)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-8 border-white/5 relative overflow-hidden">
                        <h2 className="text-xl font-black mb-6 flex items-center gap-3 tracking-tight">
                            <Award size={24} className="text-secondary" />
                            EVOLUTION PROGRESS
                        </h2>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-mono uppercase tracking-tighter">Current Phase: {rank.name}</span>
                                <span className="text-secondary font-mono animate-pulse">Evolving...</span>
                            </div>
                            <div className="h-4 w-full bg-white/5 rounded-2xl p-1 border border-white/10">
                                <div
                                    className="h-full bg-linear-to-r from-secondary to-blue-500 rounded-xl relative overflow-hidden"
                                    style={{ width: '65%' }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse-slow rounded-xl" />
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground/60 text-center font-mono uppercase tracking-widest">
                                Neural synthesis at 65% for next evolution cycle.
                            </p>
                        </div>
                    </GlassCard>
                </div>

                {/* Achievements Segment */}
                <h2 className="text-2xl font-black mb-8 flex items-center gap-3 tracking-tighter">
                    <Trophy size={28} className="text-yellow-400" />
                    ACQUIRED_TROPHIES
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {user.achievements?.map((ach: any) => {
                        const isUnlocked = !!ach.unlockedAt;
                        const Icon = iconMap[ach.icon] || Award;
                        return (
                            <GlassCard key={ach.id} className={`p-6 relative overflow-hidden transition-all duration-500 ${isUnlocked ? 'border-primary/40 bg-linear-to-br from-primary/5 to-transparent' : 'opacity-20 grayscale border-white/5'}`}>
                                {isUnlocked && (
                                    <div className="absolute top-0 right-0 bg-primary/20 backdrop-blur-md text-primary text-[8px] font-black px-3 py-1 rounded-bl-xl border-l border-b border-primary/20 tracking-tighter">
                                        VERIFIED
                                    </div>
                                )}
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-500 ${isUnlocked ? 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'bg-white/5 text-muted-foreground border-white/10'}`}>
                                        <Icon size={28} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-sm truncate uppercase tracking-tight">{ach.name || ach.id}</h3>
                                        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight mt-1">Classification: Level {isUnlocked ? 'S' : 'Pending'}</p>
                                    </div>
                                </div>
                                {isUnlocked && (
                                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-mono">
                                        <div className="text-muted-foreground uppercase opacity-50">Discovery Date</div>
                                        <div className="text-primary font-bold">
                                            {new Date(ach.unlockedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                )}
                            </GlassCard>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
