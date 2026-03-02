'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Activity, Clock, Zap, BookOpen,
    TrendingUp, Calendar, ArrowRight,
    MoreHorizontal, Star, PieChart,
    BarChart2, Target, Award, MessageSquare, Copy,
    Database, ExternalLink, Search,
    AlertCircle, ChevronDown, FileText, Youtube, Trash2
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import Link from 'next/link';
import { useUserStore } from '@/store/useUserStore';
import { useDashboardStore } from '@/store/useDashboardStore';
import RarityStats from '@/components/ui/RarityStats';
import { AnimatePresence } from 'framer-motion';

import { toast } from 'sonner';

export default function DashboardPage() {
    const { name } = useUserStore();
    const { data, isLoading, fetchDashboardData, removeSource, setData } = useDashboardStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(6);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const stats = [
        { label: 'Study Streak', value: data?.stats?.streak || '0 Days', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
        { label: 'Time Focused', value: data?.stats?.timeFocused || '0h 0m', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { label: 'Notebooks', value: data?.stats?.notebooks || '0 Active', icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        { label: 'Knowledge Score', value: data?.stats?.xp || '0 XP', icon: Star, color: 'text-green-400', bg: 'bg-green-400/10' },
    ];

    const recentActivity = data?.recentActivity || [];

    const recommended = [
        { title: 'Advanced Machine Learning', category: 'Computer Science', difficulty: 'Hard', color: 'from-blue-500 to-cyan-500' },
        { title: 'History of Renaissance', category: 'History', difficulty: 'Medium', color: 'from-orange-500 to-red-500' },
        { title: 'Organic Chemistry Basics', category: 'Science', difficulty: 'Easy', color: 'from-green-500 to-emerald-500' },
    ];

    // Prepare Chart Data
    const chartData = data?.chartData || [];
    const chartPoints = chartData.map((d: any, i: number) => {
        // Normalize 0-300 height based on max XP (e.g. 100)
        const y = 300 - Math.min((d.xpGained / 100) * 300, 300);
        const x = (i / (chartData.length - 1 || 1)) * 800;
        return `${x},${y}`;
    }).join(' ');

    // Smooth curve approximation (simplified)
    const chartPath = chartData.length > 1 ? `M0,300 L${chartPoints} L800,300 Z` : "M0,300 L800,300 Z";

    if (!data && isLoading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-primary/30 relative pt-32 pb-20 px-4 md:px-8">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold mb-2">
                            Welcome back, <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">{name}</span>
                        </h1>
                        <p className="text-muted-foreground text-lg mb-4">
                            You're on a roll! Keep up the momentum.
                        </p>

                        {/* Nebula ID Display */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
                                <span className="font-semibold text-white">Nebula ID:</span>
                                <span className="font-mono text-xs">{data?.user?._id || 'Loading...'}</span>
                            </span>
                            <button
                                onClick={() => {
                                    if (data?.user?._id) {
                                        navigator.clipboard.writeText(data.user._id);
                                        toast.success('text copied');
                                    }
                                }}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-primary"
                                title="Copy Nebula ID"
                            >
                                <Copy size={16} />
                            </button>
                        </div>

                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <Link href="/notebook">
                            <NeonButton>
                                Resume Learning <ArrowRight size={18} className="ml-2" />
                            </NeonButton>
                        </Link>
                    </motion.div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                            <GlassCard className="p-6 flex items-center gap-4 hover:bg-white/10 transition-colors">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>

                {/* Rarity Stats Collection */}
                <RarityStats stats={data?.rarityStats || { uncommon: 0, rare: 0, epic: 0, legendary: 0 }} />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Learning Curve Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="lg:col-span-2"
                    >
                        <GlassCard className="h-full min-h-[400px] p-8 relative overflow-hidden flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <TrendingUp size={20} className="text-primary" />
                                    Knowledge Growth (XP)
                                </h3>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium cursor-pointer">Last 30 Days</span>
                                </div>
                            </div>

                            {/* Custom SVG Line Chart */}
                            <div className="flex-1 w-full relative">
                                {chartData.length > 0 ? (
                                    <svg className="w-full h-full overflow-visible" viewBox="0 0 800 300" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="rgba(0, 240, 255, 0.5)" />
                                                <stop offset="100%" stopColor="rgba(0, 240, 255, 0)" />
                                            </linearGradient>
                                        </defs>
                                        {/* Grid Lines */}
                                        {[0, 1, 2, 3, 4].map(i => (
                                            <line key={i} x1="0" y1={i * 75} x2="800" y2={i * 75} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                        ))}

                                        {/* Area Path */}
                                        <motion.path
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            d={chartPath}
                                            fill="url(#lineGradient)"
                                        />

                                        {/* Line Path (Simplified for now, just connecting points) */}
                                        <polyline
                                            fill="none"
                                            stroke="#00f0ff"
                                            strokeWidth="3"
                                            points={chartPoints.replace(/ /g, ', ')}
                                        />
                                    </svg>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        No activity data yet. Start learning!
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </motion.div>

                    {/* Subject Mastery Radar Chart (Simulated) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <GlassCard className="h-full p-6 flex flex-col">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Target size={20} className="text-secondary" />
                                Subject Mastery
                            </h3>
                            <div className="flex-1 flex items-center justify-center relative">
                                {/* Simulated Radar Chart using CSS/SVG */}
                                <div className="relative w-64 h-64">
                                    {/* Background Circles */}
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="absolute inset-0 m-auto rounded-full border border-white/5" style={{ width: `${i * 33}%`, height: `${i * 33}%` }} />
                                    ))}
                                    {/* Axes */}
                                    <div className="absolute inset-0 m-auto w-full h-px bg-white/5 rotate-0" />
                                    <div className="absolute inset-0 m-auto w-full h-px bg-white/5 rotate-60" />
                                    <div className="absolute inset-0 m-auto w-full h-px bg-white/5 rotate-120" />

                                    {/* Shape */}
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 1, delay: 0.8 }}
                                        className="absolute inset-0 m-auto w-4/5 h-4/5 bg-secondary/20 border-2 border-secondary rounded-full"
                                        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 80% 100%, 20% 100%, 0% 25%)' }}
                                    />

                                    {/* Labels */}
                                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 text-xs font-bold text-secondary">Physics</span>
                                    <span className="absolute top-1/4 right-0 translate-x-4 text-xs font-bold text-secondary">Math</span>
                                    <span className="absolute bottom-1/4 right-0 translate-x-4 text-xs text-muted-foreground">History</span>
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 text-xs text-muted-foreground">Lit</span>
                                    <span className="absolute top-1/4 left-0 -translate-x-4 text-xs font-bold text-secondary">CS</span>
                                </div>
                            </div>
                            <div className="mt-6 text-center">
                                <p className="text-sm text-muted-foreground">Top Subject: <span className="text-white font-bold">Physics (92%)</span></p>
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>

                {/* Second Row: Heatmap & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Study Heatmap */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="lg:col-span-2"
                    >
                        <GlassCard className="p-8">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Calendar size={20} className="text-green-400" />
                                Study Consistency
                            </h3>
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                {Array.from({ length: 52 }).map((_, weekIndex) => (
                                    <div key={weekIndex} className="flex flex-col gap-2">
                                        {Array.from({ length: 7 }).map((_, dayIndex) => {
                                            const intensity = Math.random(); // TODO: Map real dailyStats here
                                            const active = intensity > 0.7;
                                            const colorClass = !active ? 'bg-white/5' :
                                                intensity > 0.9 ? 'bg-green-500' :
                                                    intensity > 0.8 ? 'bg-green-500/70' :
                                                        'bg-green-500/40';

                                            return (
                                                <motion.div
                                                    key={dayIndex}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: (weekIndex * 0.01) + (dayIndex * 0.01) }}
                                                    className={`w-3 h-3 rounded-sm ${colorClass}`}
                                                    title={`Study session`}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </motion.div>

                    {/* Recent Activity List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                    >
                        <GlassCard className="h-full p-6">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Clock size={20} className="text-blue-400" />
                                Recent Activity
                            </h3>
                            <div className="space-y-6">
                                {recentActivity.length > 0 ? recentActivity.map((item: any, i: number) => {
                                    const Icon = item.icon === 'BookOpen' ? BookOpen : item.icon === 'Activity' ? Activity : item.icon === 'MessageSquare' ? MessageSquare : Zap;
                                    return (
                                        <div key={i} className="flex items-start gap-4 group">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors border border-white/5">
                                                <Icon size={18} className="text-muted-foreground group-hover:text-white transition-colors" />
                                            </div>
                                            <div>
                                                <div className="font-medium group-hover:text-primary transition-colors cursor-pointer">
                                                    {item.title}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {item.action}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-sm text-muted-foreground">No recent activity.</div>
                                )}
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>

                {/* Recommended Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="mb-12"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold flex items-center gap-2">
                            <Sparkles size={24} className="text-purple-400" />
                            Recommended for You
                        </h3>
                        <button className="text-sm text-primary hover:underline">View All</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {recommended.map((item, i) => (
                            <GlassCard key={i} className="p-6 group hover:bg-white/10 transition-colors cursor-pointer relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1 h-full bg-linear-to-b ${item.color}`} />
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                                        {item.category}
                                    </span>
                                    <span className={`text-xs font-bold ${item.difficulty === 'Hard' ? 'text-red-400' :
                                        item.difficulty === 'Medium' ? 'text-yellow-400' :
                                            'text-green-400'
                                        }`}>
                                        {item.difficulty}
                                    </span>
                                </div>
                                <h4 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{item.title}</h4>
                                <p className="text-sm text-muted-foreground mb-4">Based on your recent interest in Physics and Math.</p>
                                <div className="flex items-center text-xs text-muted-foreground gap-4">
                                    <span className="flex items-center gap-1"><BookOpen size={12} /> 12 Chapters</span>
                                    <span className="flex items-center gap-1"><Clock size={12} /> 4h 30m</span>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </motion.div>

                {/* --- NEW SECTION: SOURCE VAULT --- */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.9 }}
                    className="mb-12"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 uppercase tracking-tighter">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black flex items-center gap-3">
                                <Database size={28} className="text-primary text-glow-primary" />
                                Source Vault
                            </h3>
                            <p className="text-xs text-muted-foreground font-bold tracking-[0.2em] ml-1">Centralized Neural Data Repository</p>
                        </div>

                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-2 pl-4 w-full md:w-auto">
                            <Search size={16} className="text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="FILTER SOURCES..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs font-bold w-full md:w-64"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {(() => {
                                const filteredSources = (data?.allSources || [])
                                    .filter((s: any) =>
                                        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        s.notebookTitle.toLowerCase().includes(searchQuery.toLowerCase())
                                    );

                                if (filteredSources.length === 0) {
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="col-span-1 md:col-span-3 h-48 flex items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-[32px]"
                                        >
                                            <p className="text-muted-foreground font-black italic uppercase tracking-widest flex items-center gap-3">
                                                <AlertCircle size={20} /> Data Vault is Empty
                                            </p>
                                        </motion.div>
                                    );
                                }

                                return filteredSources.slice(0, visibleCount).map((source: any, i: number) => {
                                    const Icon = source.type === 'youtube' ? Youtube : FileText;
                                    const isExternal = source.type === 'youtube';

                                    return (
                                        <motion.div
                                            key={source._id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                                            transition={{ duration: 0.4, delay: i * 0.05 }}
                                        >
                                            <GlassCard className="p-6 h-full relative group overflow-hidden hover:border-primary/50 transition-all duration-500 bg-black/40!">
                                                <div className="absolute inset-0 bg-radial-at-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-primary/20 group-hover:text-primary transition-all duration-500 shadow-xl border border-white/5">
                                                        <Icon size={24} />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm('Permanently wipe this source from the vault?')) {
                                                                    const prevData = data;
                                                                    // Optimistic delete
                                                                    removeSource(source._id);

                                                                    try {
                                                                        const res = await fetch(`/api/notebooks/${source.notebookId}/sources?sourceId=${source._id}`, {
                                                                            method: 'DELETE'
                                                                        });
                                                                        if (res.ok) {
                                                                            toast.success('Source Purged from Data Bank');
                                                                        } else {
                                                                            throw new Error('Failed to delete');
                                                                        }
                                                                    } catch (e) {
                                                                        // Rollback
                                                                        setData(prevData as any);
                                                                        toast.error('Purge Failed - Restored Data');
                                                                    }
                                                                }
                                                            }}
                                                            className="p-2.5 rounded-xl bg-white/5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all"
                                                            title="Delete Source"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                        {isExternal && source.url && (
                                                            <a
                                                                href={source.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2.5 rounded-xl bg-white/5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                                            >
                                                                <ExternalLink size={16} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <h4 className="text-lg font-black italic tracking-tight uppercase truncate">{source.name}</h4>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest bg-white/5 p-2 rounded-lg border border-white/5">
                                                            <span className="text-muted/40">Origin</span>
                                                            <Link href={`/notebook/${source.notebookId}`} className="text-primary hover:underline group-hover:text-glow-primary">
                                                                {source.notebookTitle}
                                                            </Link>
                                                        </div>
                                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest bg-white/5 p-2 rounded-lg border border-white/5">
                                                            <span className="text-muted/40">Timestamp</span>
                                                            <span className="text-white/60">{new Date(source.addedAt).toLocaleDateString()}</span>
                                                        </div>
                                                        {source.size > 0 && (
                                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest bg-white/5 p-2 rounded-lg border border-white/5">
                                                                <span className="text-muted/40">Payload</span>
                                                                <span className="text-white/60">{(source.size / 1024 / 1024).toFixed(2)} MB</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </GlassCard>
                                        </motion.div>
                                    );
                                });
                            })()}
                        </AnimatePresence>
                    </div>

                    {/* Load More Button */}
                    {(() => {
                        const filteredCount = (data?.allSources || [])
                            .filter((s: any) =>
                                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                s.notebookTitle.toLowerCase().includes(searchQuery.toLowerCase())
                            ).length;

                        if (filteredCount > visibleCount) {
                            return (
                                <div className="mt-12 flex flex-col items-center gap-4">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setVisibleCount(prev => prev + 6)}
                                        className="px-8 py-4 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-2xl text-primary text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all"
                                    >
                                        <ChevronDown size={16} /> Load More Neural Data
                                    </motion.button>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-40">
                                        Showing {visibleCount} of {filteredCount} Sources
                                    </p>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </motion.div>
            </div>
        </main>
    );
}

function Sparkles({ className, size }: { className?: string, size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    );
}
