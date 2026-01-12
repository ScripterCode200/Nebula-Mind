'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    User, Mail, Calendar, Award, Book, Brain, Clock, Flame,
    Library, Trophy, Star, MapPin, GraduationCap, Hash, Link2,
    Github, Linkedin, Twitter, Globe, Settings, Camera, Zap,
    Activity, ChevronRight, Share2, Crown
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import Link from 'next/link';
import { toast } from 'sonner';
import { compressImage } from '@/lib/imageUtils';
import { getRank, calculateLevel, calculateXpForLevel, calculateLevelProgress, calculateRankProgress, getNextRank } from '@/lib/levelUtils';
import { upload } from "@imagekit/next";
import { cn } from '@/lib/utils';

const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const authenticationEndpoint = "/api/imagekit-auth";

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/profile');
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error('Failed to fetch profile', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const toastId = toast.loading('Optimizing image...');

        try {
            const compressedFile = await compressImage(file, 800, 0.7);
            toast.loading('Authenticating...', { id: toastId });

            // 1. Get Authentication Parameters
            const authRes = await fetch(authenticationEndpoint);
            const authData = await authRes.json();
            if (authData.error) throw new Error(authData.error);

            toast.loading('Uploading to Cloud...', { id: toastId });

            // 2. Perform Upload via ImageKit
            const uploadResponse = await upload({
                file: compressedFile,
                fileName: `profile-${Date.now()}`,
                publicKey: publicKey!,
                signature: authData.signature,
                token: authData.token,
                expire: authData.expire,
                useUniqueFileName: true,
                folder: "/profile-pictures"
            });

            const newUrl = uploadResponse.url as string;
            const fileId = uploadResponse.fileId as string;

            toast.loading('Saving to Profile...', { id: toastId });

            // 3. Sync with Backend
            const saveRes = await fetch('/api/user/profile-image', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profileImage: newUrl,
                    imageKitFileId: fileId
                })
            });

            if (!saveRes.ok) throw new Error('Save failed');
            const saveData = await saveRes.json();

            setData((prev: any) => ({
                ...prev,
                user: { ...prev.user, profileImage: saveData.user.profileImage }
            }));

            toast.success('Profile updated', { id: toastId });

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to update profile', { id: toastId });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-t-2 border-cyan-500 animate-spin"></div>
                        <div className="absolute inset-2 rounded-full border-r-2 border-purple-500 animate-spin reverse"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
                <GlassCard className="p-8 border-red-500/20 text-center">
                    <p className="text-red-400 font-bold mb-4">DATA LINK SEVERED</p>
                    <NeonButton onClick={() => window.location.reload()}>Retry Connection</NeonButton>
                </GlassCard>
            </div>
        );
    }

    const { user, achievements } = data;
    const rank = getRank(user.stats?.xp || 0);

    return (
        <main className="min-h-screen bg-[#050505] text-white pt-28 pb-20 px-4 md:px-8 relative overflow-hidden selection:bg-cyan-500/30">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
                <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10 space-y-8">
                {/* Header Section: Identity Node */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <GlassCard className="p-0 border-white/10 bg-black/40 backdrop-blur-3xl overflow-hidden relative group rounded-4xl">
                        <div className="absolute inset-0 bg-linear-to-r from-cyan-500/5 via-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center md:items-start gap-10">
                            {/* Avatar Section */}
                            <div className="relative group/avatar shrink-0">
                                <div className="absolute inset-0 bg-linear-to-tr from-cyan-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-40 group-hover/avatar:opacity-70 transition-opacity duration-500 animate-pulse-slow" />
                                <div className={cn(
                                    "relative w-40 h-40 md:w-48 md:h-48 rounded-full p-[4px] bg-linear-to-br transition-transform duration-500 group-hover/avatar:scale-105",
                                    rank.gradient
                                )}>
                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden border-4 border-black relative">
                                        {user.profileImage ? (
                                            <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-white/20">
                                                <User size={64} />
                                            </div>
                                        )}

                                        {/* Upload Overlay */}
                                        <button
                                            onClick={triggerFileInput}
                                            className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 backdrop-blur-sm cursor-pointer"
                                        >
                                            <Camera size={24} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Update</span>
                                        </button>

                                        {isUploading && (
                                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                                                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Rank Badge */}
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black border border-white/20 shadow-xl flex items-center gap-2 whitespace-nowrap z-20">
                                        <Crown size={12} className={cn("text-transparent bg-clip-text", rank.gradient)} />
                                        <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] bg-clip-text text-transparent bg-linear-to-r", rank.gradient)}>
                                            {rank.name}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Identity Info */}
                            <div className="flex-1 text-center md:text-left space-y-6 w-full">
                                <div className="space-y-2">
                                    <div className="flex flex-col md:flex-row items-center md:items-start justify-center md:justify-between gap-4">
                                        <div>
                                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white via-white to-white/50">
                                                {user.name}
                                            </h1>
                                            <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
                                                {user.status?.text && (
                                                    <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-cyan-200/80 flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                                        {user.status.emoji} {user.status.text}
                                                    </span>
                                                )}
                                                <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white/50 flex items-center gap-2">
                                                    <MapPin size={10} /> {user.location || 'Unknown Sector'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <Link href="/settings?tab=general">
                                                <NeonButton className="h-10 px-6 bg-white/5 border-white/10 hover:bg-white/10 text-xs hover:border-white/20">
                                                    <Settings size={14} className="mr-2" /> EDIT_PROFILE
                                                </NeonButton>
                                            </Link>
                                            <NeonButton variant="secondary" className="h-10 px-4 bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 text-xs hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                                                <Share2 size={14} />
                                            </NeonButton>
                                        </div>
                                    </div>

                                    <p className="text-lg text-white/60 leading-relaxed font-light max-w-2xl mx-auto md:mx-0 border-l-2 border-white/10 pl-4 italic">
                                        "{user.bio || 'Initiating synaptic link...'}"
                                    </p>
                                </div>

                                {/* Social Matrix */}
                                {user.socials && Object.values(user.socials).some(Boolean) && (
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                        {user.socials.linkedin && (
                                            <a href={user.socials.linkedin} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 hover:bg-[#0077b5]/20 hover:text-[#0077b5] border border-white/5 hover:border-[#0077b5]/50 transition-all duration-300">
                                                <Linkedin size={18} />
                                            </a>
                                        )}
                                        {user.socials.github && (
                                            <a href={user.socials.github} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 hover:bg-white/20 hover:text-white border border-white/5 hover:border-white/50 transition-all duration-300">
                                                <Github size={18} />
                                            </a>
                                        )}
                                        {user.socials.twitter && (
                                            <a href={user.socials.twitter} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2] border border-white/5 hover:border-[#1DA1F2]/50 transition-all duration-300">
                                                <Twitter size={18} />
                                            </a>
                                        )}
                                        {user.socials.website && (
                                            <a href={user.socials.website} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-500 border border-white/5 hover:border-emerald-500/50 transition-all duration-300">
                                                <Globe size={18} />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </GlassCard>
                </motion.div>

                {/* Stats Grid - High Energy */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Neural Level', value: calculateLevel(user.stats?.xp || 0), icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
                        { label: 'Total XP', value: user.stats?.xp || 0, icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' },
                        { label: 'Streak', value: user.stats?.streak?.current || 0, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                        { label: 'Time Invested', value: `${Math.floor((user.stats?.totalTimeSpent || 0) / 60)}h`, icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' }
                    ].map((stat, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            key={i}
                        >
                            <div className={cn(
                                "p-6 rounded-3xl border backdrop-blur-xl flex flex-col items-center justify-center gap-2 group transition-all hover:scale-105",
                                stat.bg, stat.border
                            )}>
                                <div className={cn("p-2 rounded-lg bg-black/20 mb-2 transition-transform group-hover:rotate-12", stat.color)}>
                                    <stat.icon size={24} />
                                </div>
                                <span className="text-3xl font-black text-white tracking-tight">{stat.value}</span>
                                <span className={cn("text-[10px] font-black uppercase tracking-widest opacity-60", stat.color)}>{stat.label}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Data Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Academic Node - Vibrant Pink/Purple */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="md:col-span-2 p-8 rounded-[2.5rem] border border-white/10 bg-linear-to-br from-purple-500/10 via-black/60 to-pink-500/5 backdrop-blur-3xl hover:border-purple-500/30 hover:shadow-[0_0_50px_rgba(168,85,247,0.15)] transition-all"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                                <GraduationCap size={20} />
                            </div>
                            <h2 className="text-sm font-black text-white/50 uppercase tracking-[0.3em]">Academic Node</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                            <div className="group">
                                <div className="text-[10px] text-purple-400/60 uppercase font-black tracking-widest mb-1 group-hover:text-purple-400 transition-colors">Institution</div>
                                <div className="text-lg font-bold text-white tracking-tight">{user.academic?.institution || user.university || 'Not Affiliated'}</div>
                            </div>
                            <div className="group">
                                <div className="text-[10px] text-pink-400/60 uppercase font-black tracking-widest mb-1 group-hover:text-pink-400 transition-colors">Specialization</div>
                                <div className="text-lg font-bold text-white tracking-tight">{user.academic?.major || 'General Studies'}</div>
                            </div>
                            <div className="group">
                                <div className="text-[10px] text-purple-400/60 uppercase font-black tracking-widest mb-1 group-hover:text-purple-400 transition-colors">Cohort</div>
                                <div className="text-lg font-mono font-bold text-white/80">{user.academic?.year || 'Unknown'}</div>
                            </div>
                            <div className="group">
                                <div className="text-[10px] text-pink-400/60 uppercase font-black tracking-widest mb-1 group-hover:text-pink-400 transition-colors">Performance Index</div>
                                <div className="inline-flex px-3 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 font-mono font-bold">
                                    {user.academic?.cgpa || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Neural Spectrum - Emerald/Teal */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="p-8 rounded-[2.5rem] border border-white/10 bg-linear-to-br from-emerald-500/10 via-black/60 to-teal-500/5 backdrop-blur-3xl hover:border-emerald-500/30 hover:shadow-[0_0_50px_rgba(16,185,129,0.15)] transition-all flex flex-col"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                <Hash size={20} />
                            </div>
                            <h2 className="text-sm font-black text-white/50 uppercase tracking-[0.3em]">Neural Tags</h2>
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-wrap gap-2">
                                {user.interests && user.interests.length > 0 ? (
                                    user.interests.map((tag: string, i: number) => (
                                        <span key={i} className="px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all cursor-default uppercase tracking-wider">
                                            {tag}
                                        </span>
                                    ))
                                ) : (
                                    <div className="text-center w-full py-10 opacity-30">
                                        <Brain size={48} className="mx-auto mb-2" />
                                        <p className="text-xs uppercase tracking-widest">No Signals</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Tactical Stats & Milestones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                    <GlassCard className="p-8 rounded-[2.5rem] border-white/5">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-black flex items-center gap-3">
                                <Library size={20} className="text-blue-400" /> RARITY DISTRIBUTION
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {[
                                { label: 'Legendary', val: user.stats?.rarityStats?.legendary || 0, color: 'text-yellow-400', bg: 'bg-yellow-400' },
                                { label: 'Epic', val: user.stats?.rarityStats?.epic || 0, color: 'text-purple-400', bg: 'bg-purple-400' },
                                { label: 'Rare', val: user.stats?.rarityStats?.rare || 0, color: 'text-cyan-400', bg: 'bg-cyan-400' },
                                { label: 'Uncommon', val: user.stats?.rarityStats?.uncommon || 0, color: 'text-white/60', bg: 'bg-white' }
                            ].map((rs, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-24 text-[10px] font-black uppercase tracking-wider text-right opacity-60">{rs.label}</div>
                                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, Math.max((rs.val > 0 ? 5 : 0), (rs.val / 20) * 100))}%` }}
                                            transition={{ duration: 1, delay: 0.5 }}
                                            className={cn("h-full", rs.bg)}
                                        />
                                    </div>
                                    <div className={cn("w-8 text-sm font-bold font-mono text-left", rs.color)}>{rs.val}</div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-lg font-black flex items-center gap-3">
                                    <Award size={20} className="text-secondary" /> NEXT EVOLUTION
                                </h2>
                                {(() => {
                                    const nextRank = getNextRank(user.stats?.xp || 0);
                                    return (
                                        <div className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 shadow-inner flex items-center gap-2 relative overflow-hidden group/target">
                                            <div className={cn("absolute inset-0 opacity-0 group-hover/target:opacity-20 transition-opacity duration-500", nextRank?.gradient || rank.gradient)} />
                                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest relative z-10">TARGET:</span>
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-linear-to-r relative z-10",
                                                nextRank?.gradient || rank.gradient
                                            )}>
                                                {nextRank?.name || 'MAX RANK'}
                                            </span>
                                            <div className={cn("absolute bottom-0 left-0 w-full h-px opacity-50", nextRank?.gradient || rank.gradient)} />
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="mb-2 flex justify-between text-xs font-mono opacity-60">
                                <span>RANK PROGRESS</span>
                                <span>
                                    {getNextRank(user.stats?.xp || 0)
                                        ? `${(user.stats?.xp || 0) - rank.minXp} / ${getNextRank(user.stats?.xp || 0)!.minXp - rank.minXp} XP`
                                        : 'MAX LEVEL'}
                                </span>
                            </div>

                            <div className="h-4 w-full bg-black/40 rounded-full p-1 border border-white/5 shadow-inner mb-6">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${calculateRankProgress(user.stats?.xp || 0)}%` }}
                                    transition={{ duration: 1.5, ease: "circOut" }}
                                    className="h-full bg-linear-to-r from-secondary to-cyan-400 rounded-full relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite] skew-x-12" />
                                </motion.div>
                            </div>

                            <p className="text-xs text-white/40 font-mono leading-relaxed">
                                Complete <span className="text-white">Daily Goals</span> and <span className="text-white">Quizzes</span> to accumulate XP. Evolution unlocks new customization modules and feature sets.
                            </p>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </main>
    );
}
