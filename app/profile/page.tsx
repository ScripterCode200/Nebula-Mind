'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Award, Book, Brain, Clock, Flame, Library, Trophy, Star } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import Link from 'next/link';
import { useRef } from 'react';
import { toast } from 'sonner';
import { compressImage } from '@/lib/imageUtils';
import { getRank } from '@/lib/levelUtils';

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
            toast.loading('Uploading...', { id: toastId });
            const presignRes = await fetch('/api/upload/presign', {
                method: 'POST',
                body: JSON.stringify({
                    filename: compressedFile.name,
                    contentType: compressedFile.type
                }),
            });

            if (!presignRes.ok) throw new Error('Upload init failed');
            const { url, key, publicDomain } = await presignRes.json();

            const uploadRes = await fetch(url, {
                method: 'PUT',
                body: compressedFile,
                headers: { 'Content-Type': compressedFile.type }
            });

            if (!uploadRes.ok) throw new Error('Upload failed');
            const domain = publicDomain || 'https://pub-your-r2-domain.r2.dev';
            const finalUrl = `${domain}/${key}`;

            toast.loading('Saving profile...', { id: toastId });
            const saveRes = await fetch('/api/user/profile-image', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profileImage: finalUrl,
                    imageKitFileId: ''
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
                <p>Failed to load profile data.</p>
            </div>
        );
    }

    const { user, achievements } = data;
    const rank = getRank(user.stats?.xp || 0);

    const iconMap: any = {
        Book, Library, Brain, Clock, Flame, Award
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white pt-32 pb-20 px-4 md:px-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Profile Header */}
                <GlassCard className="p-8 mb-12 border-primary/20 bg-black/40 backdrop-blur-3xl overflow-hidden relative">
                    {/* Decorative Scanner Effect */}
                    <motion.div
                        initial={{ top: '-100%' }}
                        animate={{ top: '200%' }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent z-0"
                    />

                    <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                        <div className="relative group shrink-0">
                            <div className={`w-36 h-36 md:w-44 md:h-44 rounded-full bg-linear-to-br ${rank.gradient} p-[3px] shadow-[0_0_40px_${rank.glow}] transition-all duration-500`}>
                                <div className="w-full h-full rounded-full bg-[#050505] flex items-center justify-center overflow-hidden border-4 border-[#050505]">
                                    {user.profileImage ? (
                                        <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <User size={64} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest mt-2">No Image</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={triggerFileInput}
                                className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:backdrop-blur-sm cursor-pointer border-2 border-primary/20"
                            >
                                {isUploading ? (
                                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <Clock size={20} className="text-primary" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Upload Avatar</span>
                                    </div>
                                )}
                            </button>
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
                                    "{user.bio || 'Architecting knowledge through AI-enhanced learning.'}"
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-mono">
                                <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground">
                                    <Mail size={14} className="text-primary/60" /> {user.email}
                                </span>
                                <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground">
                                    <Calendar size={14} className="text-primary/60" /> JOINED_{new Date(user.joinedAt).getFullYear()}
                                </span>
                                {user.university && (
                                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                                        <Library size={14} /> {user.university.toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 shrink-0">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <Link href="/leaderboard" className="w-full">
                                <NeonButton variant="secondary" className="w-full justify-center px-8 h-12 flex items-center gap-2">
                                    <Trophy size={18} />
                                    Ranking
                                </NeonButton>
                            </Link>
                            <NeonButton className="w-full justify-center px-8 h-12" onClick={triggerFileInput} disabled={isUploading}>
                                {isUploading ? 'SYNCING...' : 'UPDATE PROFILE'}
                            </NeonButton>
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
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (rs.val / 50) * 100)}%` }}
                                            className={`h-full bg-current ${rs.color} opacity-30`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-8 border-white/5">
                        <h2 className="text-xl font-black mb-6 flex items-center gap-3 tracking-tight">
                            <Award size={24} className="text-secondary" />
                            NEXT MILESTONE
                        </h2>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-mono">Current: Level {user.stats?.level}</span>
                                <span className="text-secondary font-mono">Target: Level {(user.stats?.level || 1) + 1}</span>
                            </div>
                            <div className="h-4 w-full bg-white/5 rounded-2xl p-1 border border-white/10">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '45%' }} // Actual calculation placeholder
                                    className="h-full bg-linear-to-r from-secondary to-blue-500 rounded-xl relative group"
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse-slow rounded-xl" />
                                </motion.div>
                            </div>
                            <p className="text-xs text-muted-foreground/60 text-center font-mono">
                                Earn more XP by creating notebooks and completing quizzes to evolve your rank.
                            </p>
                        </div>
                    </GlassCard>
                </div>

                {/* Achievements Segment */}
                <h2 className="text-2xl font-black mb-8 flex items-center gap-3 tracking-tighter">
                    <Trophy size={28} className="text-yellow-400" />
                    ACHIEVEMENT_LOG
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {achievements.map((ach: any) => {
                        const Icon = iconMap[ach.icon] || Award;
                        return (
                            <motion.div
                                key={ach.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ y: -5 }}
                            >
                                <GlassCard className={`p-6 relative overflow-hidden transition-all duration-500 ${ach.unlocked ? 'border-primary/40 bg-linear-to-br from-primary/5 to-transparent' : 'opacity-40 grayscale border-white/5'}`}>
                                    {ach.unlocked && (
                                        <div className="absolute top-0 right-0 bg-primary/20 backdrop-blur-md text-primary text-[8px] font-black px-3 py-1 rounded-bl-xl border-l border-b border-primary/20 tracking-tighter">
                                            SECURED
                                        </div>
                                    )}
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-500 ${ach.unlocked ? 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_20px_rgba(34,197,94,0.1)] group-hover:scale-110' : 'bg-white/5 text-muted-foreground border-white/10'}`}>
                                            <Icon size={28} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-sm truncate uppercase tracking-tight">{ach.name}</h3>
                                            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight mt-1">{ach.description}</p>
                                        </div>
                                    </div>
                                    {ach.unlocked && (
                                        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                            <div className="text-[8px] font-mono text-muted-foreground uppercase opacity-50">Discovery Date</div>
                                            <div className="text-[10px] font-mono text-primary font-bold">
                                                {new Date(ach.unlockedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    )}
                                </GlassCard>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}

