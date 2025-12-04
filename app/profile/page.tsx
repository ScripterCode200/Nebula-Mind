'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Award, Book, Brain, Clock, Flame, Library } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

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

    const iconMap: any = {
        Book, Library, Brain, Clock, Flame, Award
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white pt-32 pb-20 px-4 md:px-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Profile Header */}
                <GlassCard className="p-8 mb-12 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px]">
                        <div className="w-full h-full rounded-full bg-[#050505] flex items-center justify-center">
                            <User size={64} className="text-muted-foreground" />
                        </div>
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
                        <p className="text-muted-foreground mb-4">{user.bio || 'No bio yet.'}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-2"><Mail size={16} /> {user.email}</span>
                            <span className="flex items-center gap-2"><Calendar size={16} /> Joined {new Date(user.joinedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <NeonButton className="px-6">Edit Profile</NeonButton>
                    </div>
                </GlassCard>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                    <GlassCard className="p-6 text-center">
                        <div className="text-3xl font-bold text-primary mb-1">{user.stats?.level || 1}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Level</div>
                    </GlassCard>
                    <GlassCard className="p-6 text-center">
                        <div className="text-3xl font-bold text-secondary mb-1">{user.stats?.xp || 0}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Total XP</div>
                    </GlassCard>
                    <GlassCard className="p-6 text-center">
                        <div className="text-3xl font-bold text-yellow-400 mb-1">{user.stats?.streak?.current || 0}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Day Streak</div>
                    </GlassCard>
                    <GlassCard className="p-6 text-center">
                        <div className="text-3xl font-bold text-blue-400 mb-1">{Math.floor((user.stats?.totalTimeSpent || 0) / 60)}h</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Time Spent</div>
                    </GlassCard>
                </div>

                {/* Achievements Grid */}
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Award size={24} className="text-purple-400" />
                    Achievements
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {achievements.map((ach: any) => {
                        const Icon = iconMap[ach.icon] || Award;
                        return (
                            <motion.div
                                key={ach.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <GlassCard className={`p-6 relative overflow-hidden ${ach.unlocked ? 'border-primary/50' : 'opacity-50 grayscale'}`}>
                                    {ach.unlocked && (
                                        <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                            UNLOCKED
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ach.unlocked ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'}`}>
                                            <Icon size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold">{ach.name}</h3>
                                            <p className="text-xs text-muted-foreground">{ach.description}</p>
                                        </div>
                                    </div>
                                    {ach.unlocked && (
                                        <div className="text-xs text-primary text-right">
                                            {new Date(ach.unlockedAt).toLocaleDateString()}
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
