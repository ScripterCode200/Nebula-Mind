'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Bell, Lock, Monitor,
    Globe, Moon, Volume2, Shield,
    ChevronRight, ToggleLeft, ToggleRight,
    Timer, AlertTriangle, Target, Check, Calendar, BookOpen, AlertCircle, Trash2,
    MapPin, Link2, Hash, Plus, X, GraduationCap, Github, Linkedin, Twitter, Layout, Activity, Crown
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import CustomSelect from '@/components/ui/CustomSelect';
import { useUserStore } from '@/store/useUserStore';
import { toast } from 'sonner';
import DeleteAccountModal from '@/components/modals/DeleteAccountModal';
import ConfirmSaveModal from '@/components/modals/ConfirmSaveModal';
import { cn } from '@/lib/utils';
import { getRank } from '@/lib/levelUtils';
import ProfileImageUpload from '@/components/profile/ProfileImageUpload';
import PDFUploadManager from '@/components/settings/PDFUploadManager';
import DailyGoalSlotCard from '@/components/settings/DailyGoalSlotCard';

// Types for Daily Goal Configuration
type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Subject = string;

interface DailyGoalConfig {
    id: number;
    enabled: boolean;
    subject: Subject;
    difficulty: Difficulty;
    topic: string;
    isTimeBound: boolean;
}

const SUBJECTS = ['Physics', 'Math', 'Chemistry', 'Biology', 'CS', 'History', 'English', 'NEET Prep', 'JEE Prep', 'General Knowledge'];
const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];

export default function SettingsPage() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'general';
    const [activeTab, setActiveTab] = useState(initialTab);
    const { user, name, email, bio, dob, university, location, socials, academic, interests, status, deletionScheduledAt, updateProfile, scheduleDeletion, cancelDeletion, fetchUser } = useUserStore();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

    // PDF State
    const [userPdfs, setUserPdfs] = useState<{ _id: string, filename: string }[]>([]);

    const fetchUserPdfs = async () => {
        try {
            const res = await fetch('/api/user/pdfs');
            if (res.ok) {
                const data = await res.json();
                setUserPdfs(data.pdfs);
            }
        } catch (error) {
            console.error('Failed to fetch PDFs', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'daily-goals') {
            fetchUserPdfs();
        }
    }, [activeTab]);

    const [dailyGoalConfigs, setDailyGoalConfigs] = useState<DailyGoalConfig[]>(
        Array.from({ length: 7 }).map((_, i) => ({
            id: i + 1,
            enabled: true,
            subject: SUBJECTS[i % SUBJECTS.length],
            difficulty: 'Medium',
            topic: '',
            isTimeBound: true
        }))
    );

    const [isModified, setIsModified] = useState(false);

    useEffect(() => {
        if (isModified) return;
        if (user && user.dailyGoalPreferences && user.dailyGoalPreferences.length > 0) {
            const sanitizedPrefs = user.dailyGoalPreferences.map((p: any) => ({
                id: p.id,
                enabled: p.enabled ?? true,
                subject: p.subject,
                difficulty: p.difficulty,
                topic: p.topic || '',
                isTimeBound: p.isTimeBound ?? true
            }));
            setDailyGoalConfigs(sanitizedPrefs);
        }
    }, [user, isModified]);

    useEffect(() => {
        if (!user || !user.dailyGoalPreferences) return;

        const currentJson = JSON.stringify(dailyGoalConfigs);
        const serverJson = JSON.stringify(user.dailyGoalPreferences.map((p: any) => ({
            id: p.id,
            enabled: p.enabled ?? true,
            subject: p.subject,
            difficulty: p.difficulty,
            topic: p.topic || '',
            isTimeBound: p.isTimeBound ?? true
        })));

        setIsModified(currentJson !== serverJson);
    }, [dailyGoalConfigs, user]);


    const [formData, setFormData] = useState({
        name: '',
        email: '',
        bio: '',
        dob: '',
        university: '',
        location: '',
        socials: { linkedin: '', github: '', twitter: '', website: '' },
        academic: { year: '', major: '', cgpa: '', institution: '' },
        interests: [] as string[],
        status: { text: '', emoji: '' }
    });

    const [newInterest, setNewInterest] = useState('');

    const handleAddInterest = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newInterest.trim()) {
            e.preventDefault();
            if (!formData.interests.includes(newInterest.trim())) {
                setFormData(prev => ({ ...prev, interests: [...prev.interests, newInterest.trim()] }));
            }
            setNewInterest('');
        }
    };

    const removeInterest = (tag: string) => {
        setFormData(prev => ({ ...prev, interests: prev.interests.filter(t => t !== tag) }));
    };

    useEffect(() => {
        setFormData({
            name: name || '',
            email: email || '',
            bio: bio || '',
            dob: dob ? new Date(dob).toISOString().split('T')[0] : '',
            university: university || '',
            location: location || '',
            socials: socials || { linkedin: '', github: '', twitter: '', website: '' },
            academic: academic || { year: '', major: '', cgpa: '', institution: '' },
            interests: interests || [],
            status: status || { text: '', emoji: '' }
        });
    }, [name, email, bio, dob, university, location, socials, academic, interests, status]);

    useEffect(() => {
        if (!deletionScheduledAt) {
            setTimeLeft(null);
            return;
        }

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const scheduledTime = new Date(deletionScheduledAt).getTime();
            const difference = scheduledTime - now;

            if (difference > 0) {
                return {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                };
            } else {
                return null;
            }
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const left = calculateTimeLeft();
            setTimeLeft(left);
            if (!left) clearInterval(timer);
        }, 1000);

        return () => clearInterval(timer);
    }, [deletionScheduledAt]);


    const handleSave = () => {
        const updatedInterests = [...formData.interests];
        if (newInterest.trim() && !updatedInterests.includes(newInterest.trim())) {
            updatedInterests.push(newInterest.trim());
            setNewInterest('');
            setFormData(prev => ({ ...prev, interests: updatedInterests }));
        }

        updateProfile({
            ...formData,
            interests: updatedInterests,
            dob: formData.dob ? new Date(formData.dob) : null
        });
        toast.success('Profile updated successfully!');
    };

    const handleDeleteAccount = () => {
        scheduleDeletion();
        toast.info('Account deletion scheduled for 7 days from now.');
    };

    const handleCancelDeletion = () => {
        cancelDeletion();
        toast.success('Account deletion cancelled.');
    };

    const handleSaveDailyGoalsClick = () => {
        if (!isModified) return;
        setIsSaveModalOpen(true);
    };

    const confirmSaveGoals = async () => {
        try {
            const res = await fetch('/api/user/settings/daily-goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preferences: dailyGoalConfigs })
            });

            if (res.ok) {
                localStorage.removeItem('dailyGoalsCache');
                toast.success('Daily goal preferences saved successfully!');
                await fetchUser();
            } else {
                toast.error('Failed to save preferences.');
            }
        } catch (error) {
            toast.error('An error occurred.');
        }
    };

    const updateGoalConfig = (id: number, updates: Partial<DailyGoalConfig>) => {
        setDailyGoalConfigs(prev => prev.map(config =>
            config.id === id ? { ...config, ...updates } : config
        ));
    };

    const tabs = [
        { id: 'general', label: 'General', icon: User },
        { id: 'daily-goals', label: 'Customize Daily Goals', icon: Target },
        { id: 'appearance', label: 'Appearance', icon: Monitor },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'privacy', label: 'Privacy & Security', icon: Lock },
    ];

    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-primary/30 relative pt-32 pb-20 px-4 md:px-8">
            <DeleteAccountModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteAccount}
            />

            <ConfirmSaveModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onConfirm={confirmSaveGoals}
            />

            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl font-bold mb-4">Settings</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Customize your experience and manage your account preferences.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="lg:col-span-1"
                    >
                        <div className="sticky top-32 space-y-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 relative group overflow-hidden",
                                        activeTab === tab.id
                                            ? 'bg-cyan-500/10 text-cyan-400'
                                            : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                                    )}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="active-bar"
                                            className="absolute left-0 top-3 bottom-3 w-1 bg-cyan-500 rounded-r-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}

                                    <div className={cn(
                                        "relative z-10 transition-transform duration-300 group-hover:scale-110",
                                        activeTab === tab.id ? "text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]" : ""
                                    )}>
                                        <tab.icon size={20} />
                                    </div>

                                    <span className={cn(
                                        "font-medium tracking-wide text-sm relative z-10",
                                        activeTab === tab.id ? "font-bold" : ""
                                    )}>
                                        {tab.label}
                                    </span>
                                    <div className="absolute inset-0 bg-linear-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="lg:col-span-3"
                    >
                        <div className="min-h-[500px] relative">
                            <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-white/10 rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-white/10 rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-white/10 rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-white/10 rounded-br-lg" />

                            <GlassCard className="p-6 md:p-10 border-white/5 bg-[#0a0a0a]/50 backdrop-blur-2xl">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'general' && (
                                        <motion.div
                                            key="general"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className="space-y-12"
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                                                <div className="space-y-1 w-full md:w-auto">
                                                    <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter flex flex-col md:flex-row items-start md:items-center gap-4">
                                                        <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)] animate-pulse">
                                                            <User size={28} strokeWidth={3} />
                                                        </div>
                                                        <div className="flex flex-col md:flex-row items-start md:items-center gap-0 md:gap-4">
                                                            IDENTITY <span className="text-cyan-500">PROFILE</span>
                                                        </div>
                                                    </h2>
                                                    <p className="text-white/30 text-xs font-black uppercase tracking-[0.4em] ml-1 md:ml-[4.5rem]">Manage your personal details</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <NeonButton
                                                        onClick={handleSave}
                                                        className="px-10 h-14 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black uppercase tracking-widest shadow-[0_0_30px_rgba(6,182,212,0.3)] border-none transition-all hover:scale-105 active:scale-95"
                                                    >
                                                        Sync Profile
                                                    </NeonButton>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10">
                                                {/* Card 1: Visual Identity & Status (Spans 4) */}
                                                <motion.div
                                                    whileHover={{ y: -5, scale: 1.01 }}
                                                    className="md:col-span-4 space-y-6 md:space-y-8"
                                                >
                                                    <div className="relative group p-6 md:p-10 rounded-3xl md:rounded-[3rem] border border-white/10 bg-linear-to-br from-cyan-500/15 via-black/60 to-blue-600/10 backdrop-blur-3xl transition-all hover:shadow-[0_0_60px_rgba(6,182,212,0.2)] hover:border-cyan-500/30">
                                                        <div className="flex flex-col items-center text-center space-y-8">
                                                            <div className="relative w-full flex justify-center">
                                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/30 blur-[60px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                                                <div className="relative z-10 transition-transform duration-700 group-hover:scale-105">
                                                                    <ProfileImageUpload
                                                                        initialImage={user?.profileImage}
                                                                        onSuccess={(url) => fetchUser()}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="w-full space-y-6">
                                                                <div className="space-y-3 text-left">

                                                                    <label className="text-[10px] font-black text-cyan-400/60 uppercase tracking-[0.4em] block ml-2">Status</label>
                                                                    <div className="flex items-center gap-3 p-2 bg-black/80 rounded-4xl border border-white/10 group-focus-within:border-cyan-500/50 group-focus-within:bg-black transition-all shadow-inner overflow-hidden">
                                                                        {/* Custom Emoji Container */}
                                                                        <div className="relative shrink-0 group/emoji">
                                                                            <div className="w-12 h-12 md:w-14 md:h-12 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5 text-2xl transition-all group-hover/emoji:bg-white/10 group-focus-within/emoji:border-cyan-500/50 group-focus-within/emoji:shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                                                                                {formData.status.emoji || '✨'}
                                                                            </div>
                                                                            <input
                                                                                type="text"
                                                                                value={formData.status.emoji}
                                                                                onChange={(e) => setFormData({ ...formData, status: { ...formData.status, emoji: e.target.value } })}
                                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-center"
                                                                            />
                                                                        </div>

                                                                        <input
                                                                            type="text"
                                                                            value={formData.status.text}
                                                                            onChange={(e) => setFormData({ ...formData, status: { ...formData.status, text: e.target.value } })}
                                                                            className="flex-1 min-w-0 bg-transparent border-none py-3 text-sm text-white focus:ring-0 placeholder:text-white/10 font-bold tracking-wide truncate"
                                                                            placeholder="What's on your mind?"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <motion.div
                                                        whileHover={{ y: -5 }}
                                                        className="p-6 md:p-10 rounded-3xl md:rounded-[3rem] border border-white/10 bg-linear-to-br from-white/5 via-black/40 to-white/1 backdrop-blur-3xl hover:border-white/20 transition-all shadow-2xl"
                                                    >
                                                        <div className="flex items-center gap-3 mb-6">
                                                            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                                                                <BookOpen size={18} />
                                                            </div>
                                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Bio</span>
                                                        </div>
                                                        <textarea
                                                            rows={6}
                                                            value={formData.bio}
                                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                            className="w-full bg-black/40 border border-white/5 rounded-3xl px-6 py-5 text-sm text-white/70 focus:outline-none focus:border-cyan-500/60 focus:bg-cyan-500/3 transition-all resize-none placeholder:text-white/5 leading-relaxed font-medium"
                                                            placeholder="Tell us about yourself..."
                                                        />
                                                    </motion.div>
                                                </motion.div>

                                                {/* Card 2: Core Data (Spans 8) */}
                                                <div className="md:col-span-8 space-y-6 md:space-y-8">
                                                    <motion.div
                                                        whileHover={{ y: -5 }}
                                                        className="p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 bg-linear-to-br from-indigo-600/15 via-black/80 to-purple-700/10 backdrop-blur-3xl hover:border-indigo-500/40 hover:shadow-[0_0_80px_rgba(99,102,241,0.15)] transition-all"
                                                    >
                                                        <div className="flex items-center gap-4 mb-10">
                                                            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 shadow-lg">
                                                                <Target size={22} />
                                                            </div>
                                                            <h3 className="text-lg font-black text-white uppercase tracking-[0.3em]">Basic Info</h3>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                            <div className="space-y-6">
                                                                <div className="space-y-3 group">
                                                                    <label className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em] ml-2 group-focus-within:text-indigo-400 transition-colors">Name</label>
                                                                    <input
                                                                        type="text"
                                                                        value={formData.name}
                                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                                        className="w-full bg-black/50 border-2 border-white/5 rounded-3xl px-8 py-5 text-white text-lg focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-500/10 transition-all outline-none font-black tracking-tight shadow-inner"
                                                                        placeholder="Your Name"
                                                                    />
                                                                </div>
                                                                <div className="space-y-3">
                                                                    <label className="text-[10px] uppercase font-black text-white/10 tracking-[0.3em] ml-2">Email Address</label>
                                                                    <div className="w-full bg-black/30 border border-white/5 rounded-3xl px-8 py-5 text-white/20 cursor-not-allowed italic font-mono text-xs flex items-center gap-3">
                                                                        <Lock size={12} className="opacity-50" />
                                                                        {formData.email}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-6">
                                                                <div className="space-y-3 group">
                                                                    <label className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em] ml-2 group-focus-within:text-purple-400 transition-colors">Date of Birth</label>
                                                                    <input
                                                                        type="date"
                                                                        value={formData.dob}
                                                                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                                                        className="w-full bg-black/50 border-2 border-white/5 rounded-3xl px-8 py-5 text-white focus:outline-none focus:border-purple-500/50 focus:bg-purple-500/10 transition-all outline-none scheme-dark font-mono cursor-pointer font-bold shadow-inner"
                                                                    />
                                                                </div>
                                                                <div className="space-y-3 group">
                                                                    <label className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em] ml-2 group-focus-within:text-cyan-400 transition-colors">Location</label>
                                                                    <div className="relative">
                                                                        <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
                                                                        <input
                                                                            type="text"
                                                                            value={formData.location}
                                                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                                            className="w-full bg-black/50 border-2 border-white/5 rounded-3xl pl-16 pr-8 py-5 text-white focus:outline-none focus:border-cyan-500/50 focus:bg-cyan-500/10 transition-all outline-none font-bold shadow-inner"
                                                                            placeholder="Global position"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        {/* Academic Card */}
                                                        <motion.div
                                                            whileHover={{ y: -5 }}
                                                            className="p-6 md:p-8 rounded-3xl md:rounded-[3rem] border border-white/10 bg-linear-to-br from-pink-500/10 via-black/40 to-purple-500/5 backdrop-blur-3xl hover:border-pink-500/30 transition-all"
                                                        >
                                                            <div className="flex items-center gap-4 mb-6">
                                                                <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400">
                                                                    <GraduationCap size={20} />
                                                                </div>
                                                                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Academic Info</h3>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <input
                                                                    type="text"
                                                                    value={formData.academic.institution}
                                                                    onChange={(e) => setFormData({ ...formData, academic: { ...formData.academic, institution: e.target.value } })}
                                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-pink-500/40 transition-all"
                                                                    placeholder="Institution"
                                                                />
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <input
                                                                        type="text"
                                                                        value={formData.academic.major}
                                                                        onChange={(e) => setFormData({ ...formData, academic: { ...formData.academic, major: e.target.value } })}
                                                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-pink-500/40 transition-all"
                                                                        placeholder="Major"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={formData.academic.year}
                                                                        onChange={(e) => setFormData({ ...formData, academic: { ...formData.academic, year: e.target.value } })}
                                                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-pink-500/40 transition-all"
                                                                        placeholder="Year"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </motion.div>

                                                        {/* Tags Card */}
                                                        <motion.div
                                                            whileHover={{ y: -5 }}
                                                            className="p-6 md:p-8 rounded-3xl md:rounded-[3rem] border border-white/10 bg-linear-to-br from-emerald-500/10 via-black/40 to-teal-500/5 backdrop-blur-3xl hover:border-emerald-500/30 transition-all flex flex-col"
                                                        >
                                                            <div className="flex items-center gap-4 mb-6">
                                                                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                                                                    <Hash size={20} />
                                                                </div>
                                                                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Interests</h3>
                                                            </div>
                                                            <div className="flex-1 space-y-4">
                                                                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto no-scrollbar">
                                                                    {formData.interests.map((tag) => (
                                                                        <span key={tag} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-tighter">
                                                                            {tag}
                                                                            <button onClick={() => removeInterest(tag)} className="hover:text-white transition-colors"><X size={10} /></button>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                                <div className="relative mt-auto">
                                                                    <Plus size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400/40" />
                                                                    <input
                                                                        type="text"
                                                                        value={newInterest}
                                                                        onChange={(e) => setNewInterest(e.target.value)}
                                                                        onKeyDown={handleAddInterest}
                                                                        className="w-full bg-black/60 border border-white/5 rounded-2xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500/40 transition-all"
                                                                        placeholder="Add tags..."
                                                                    />
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    </div>
                                                </div>

                                                {/* Card 3: Social Links (Spans 12) */}
                                                <div className="md:col-span-12">
                                                    <motion.div
                                                        whileHover={{ y: -5 }}
                                                        className="p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 bg-linear-to-br from-cyan-500/5 via-black/40 to-blue-500/5 backdrop-blur-3xl transition-all relative overflow-hidden"
                                                    >
                                                        {/* Subtle Background Glow */}
                                                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] pointer-events-none" />

                                                        <div className="flex items-center gap-4 mb-10 relative z-10">
                                                            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                                                <Link2 size={24} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-black text-white uppercase tracking-[0.3em]">Social Profiles</h3>
                                                                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold mt-1">Connect your social accounts</p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 relative z-10">
                                                            {[
                                                                { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: 'text-[#0A66C2]', glow: 'group-within:border-blue-500/50 group-within:shadow-[0_0_20px_rgba(10,102,194,0.15)]', bg: 'hover:bg-[#0A66C2]/5' },
                                                                { key: 'github', icon: Github, label: 'GitHub', color: 'text-white', glow: 'group-within:border-white/30 group-within:shadow-[0_0_20px_rgba(255,255,255,0.1)]', bg: 'hover:bg-white/5' },
                                                                { key: 'twitter', icon: Twitter, label: 'Twitter', color: 'text-[#1DA1F2]', glow: 'group-within:border-sky-500/50 group-within:shadow-[0_0_20px_rgba(29,161,242,0.15)]', bg: 'hover:bg-[#1DA1F2]/5' },
                                                                { key: 'website', icon: Globe, label: 'Website', color: 'text-emerald-400', glow: 'group-within:border-emerald-500/50 group-within:shadow-[0_0_20px_rgba(52,211,153,0.15)]', bg: 'hover:bg-emerald-500/5' }
                                                            ].map((social) => (
                                                                <div key={social.key} className="flex flex-col gap-2 group">
                                                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-4 group-within:text-white/60 transition-colors">
                                                                        {social.label}
                                                                    </label>
                                                                    <div className={cn(
                                                                        "flex items-center gap-3 p-2 bg-black/60 rounded-4xl border border-white/5 transition-all duration-300 min-w-0 overflow-hidden isolate relative",
                                                                        social.glow,
                                                                        social.bg
                                                                    )}>
                                                                        {/* Inner focus gradient */}
                                                                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/2 to-transparent opacity-0 group-within:opacity-100 transition-opacity pointer-events-none" />

                                                                        <div className={cn(
                                                                            "p-3 rounded-2xl bg-white/5 transition-all duration-300",
                                                                            "group-within:bg-white/10 group-within:scale-95"
                                                                        )}>
                                                                            <social.icon size={18} className={`${social.color} opacity-40 group-within:opacity-100 transition-opacity`} />
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            value={(formData.socials as any)[social.key] || ''}
                                                                            onChange={(e) => setFormData({ ...formData, socials: { ...formData.socials, [social.key]: e.target.value } })}
                                                                            className="flex-1 bg-transparent border-none py-3 text-sm text-white focus:ring-0 placeholder:text-white/10 font-bold min-w-0"
                                                                            placeholder={`Enter ${social.label} link...`}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'daily-goals' && (
                                        <motion.div
                                            key="daily-goals"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className="space-y-8"
                                        >
                                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-2">
                                                <div className="flex-1">
                                                    <h2 className="text-3xl font-bold bg-linear-to-r from-white via-cyan-100 to-cyan-500 bg-clip-text text-transparent inline-flex items-center gap-2">
                                                        Command Center
                                                    </h2>
                                                    <p className="text-muted-foreground/80 text-sm mt-1 max-w-lg">
                                                        Configure your daily learning trajectory. Each slot represents a dedicated session.
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="px-5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)] flex flex-col items-center">
                                                        <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Slots</span>
                                                        <span className="text-xl font-bold text-white leading-none mt-1">
                                                            {dailyGoalConfigs.filter(c => c.enabled).length}/7
                                                        </span>
                                                    </div>
                                                    <NeonButton
                                                        onClick={handleSaveDailyGoalsClick}
                                                        size="md"
                                                        disabled={!isModified}
                                                        className={cn(
                                                            "h-[54px] px-6 min-w-[140px]",
                                                            !isModified ? 'opacity-50 cursor-not-allowed grayscale' : 'shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                                                        )}
                                                    >
                                                        {isModified ? 'Save Config' : 'Saved'}
                                                    </NeonButton>
                                                </div>
                                            </div>

                                            <div className="mb-8 p-px bg-linear-to-br from-white/10 to-transparent rounded-2xl">
                                                <div className="bg-[#0a0a0a]/80 backdrop-blur-md rounded-2xl p-6 border border-white/5">
                                                    <PDFUploadManager onUpdate={fetchUserPdfs} />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {dailyGoalConfigs.map((config, index) => {
                                                    const finalOptions = [
                                                        ...SUBJECTS.map(s => ({ value: s, label: s })),
                                                        ...userPdfs.map(pdf => ({ value: `PDF:${pdf._id}`, label: `Reference: ${pdf.filename}` }))
                                                    ];

                                                    return (
                                                        <DailyGoalSlotCard
                                                            key={config.id}
                                                            config={config}
                                                            index={index}
                                                            subjectOptions={finalOptions}
                                                            onUpdate={(updates) => updateGoalConfig(config.id, updates as any)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'appearance' && (
                                        <motion.div
                                            key="appearance"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className="space-y-8"
                                        >
                                            <div>
                                                <h2 className="text-2xl font-bold mb-2">Interface Modules</h2>
                                                <p className="text-muted-foreground text-sm">Customize visual and auditory feedback.</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all flex items-center justify-between group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                                                            <Moon size={24} />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white group-hover:text-blue-400 transition-colors">Dark Mode</div>
                                                            <div className="text-xs text-muted-foreground">Always active</div>
                                                        </div>
                                                    </div>
                                                    <div className="w-12 h-6 rounded-full bg-blue-500/20 border border-blue-500/50 relative">
                                                        <div className="absolute right-1 top-1 w-3.5 h-3.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                                    </div>
                                                </div>

                                                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all flex items-center justify-between group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
                                                            <Volume2 size={24} />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">Sound FX</div>
                                                            <div className="text-xs text-muted-foreground">Feedback sounds</div>
                                                        </div>
                                                    </div>
                                                    <div className="w-12 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 relative">
                                                        <div className="absolute right-1 top-1 w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                    </div>
                                                </div>

                                                {getRank(user.stats?.xp || 0).name === 'Legend' && (
                                                    <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 hover:border-red-500/40 transition-all md:col-span-2 group relative overflow-hidden">
                                                        <div className="absolute inset-0 bg-linear-to-r from-red-500/5 via-orange-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                                        <div className="relative z-10">
                                                            <div className="flex items-center gap-4 mb-4">
                                                                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-red-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                                                                    <Crown size={24} fill="currentColor" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-black text-transparent bg-clip-text bg-linear-to-r from-red-400 to-orange-400 text-lg">LEGENDARY OVERRIDE</div>
                                                                    <div className="text-xs text-white/50 font-medium">Custom Neural Interface Color</div>
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-3">
                                                                {['#EF4444', '#F97316', '#EAB308', '#84CC16', '#06B6D4', '#8B5CF6', '#EC4899'].map((color) => (
                                                                    <button
                                                                        key={color}
                                                                        onClick={() => {
                                                                            updateProfile({ preferences: { ...user.preferences, customThemeColor: color } });
                                                                            toast.success('Interface theme updated');
                                                                        }}
                                                                        className={cn(
                                                                            "w-10 h-10 rounded-xl border-2 transition-all hover:scale-110",
                                                                            user.preferences?.customThemeColor === color ? "border-white scale-110 shadow-[0_0_15px_currentColor]" : "border-white/10 hover:border-white/50"
                                                                        )}
                                                                        style={{ backgroundColor: color, color: color }}
                                                                    />
                                                                ))}
                                                                <button
                                                                    onClick={() => {
                                                                        updateProfile({ preferences: { ...user.preferences, customThemeColor: '' } });
                                                                        toast.success('Reset to default theme');
                                                                    }}
                                                                    className="w-10 h-10 rounded-xl border-2 border-white/10 flex items-center justify-center bg-black/40 hover:bg-white/5 hover:border-white/30 transition-all text-white/40 hover:text-white"
                                                                    title="Reset Default"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all flex items-center justify-between group md:col-span-2">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all">
                                                            <Globe size={24} />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white group-hover:text-purple-400 transition-colors">System Language</div>
                                                            <div className="text-xs text-muted-foreground">English (United States)</div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={20} className="text-white/30 group-hover:text-purple-400 transition-colors" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'notifications' && (
                                        <motion.div
                                            key="notifications"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className="space-y-8"
                                        >
                                            <div>
                                                <h2 className="text-2xl font-bold mb-2">Comms Grid</h2>
                                                <p className="text-muted-foreground text-sm">Manage incoming transmission protocols.</p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                {['Email Notifications', 'Push Notifications', 'Weekly Digest', 'Product Updates'].map((item, i) => (
                                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/2 border border-white/5 hover:bg-white/5 transition-colors group">
                                                        <span className="font-medium text-sm group-hover:text-white transition-colors">{item}</span>
                                                        <div className={cn(
                                                            "w-10 h-5 rounded-full border relative transition-all",
                                                            i < 2 ? "bg-cyan-500/20 border-cyan-500/50" : "bg-white/5 border-white/10"
                                                        )}>
                                                            <div className={cn(
                                                                "absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all shadow-md",
                                                                i < 2 ? "right-1 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]" : "left-1 bg-white/20"
                                                            )} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'privacy' && (
                                        <motion.div
                                            key="privacy"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className="space-y-8"
                                        >
                                            <div>
                                                <h2 className="text-2xl font-bold mb-2 text-white">Security Protocols</h2>
                                                <p className="text-muted-foreground text-sm">Data retention and system access.</p>
                                            </div>

                                            <div className="p-6 rounded-2xl bg-linear-to-br from-red-950/30 to-red-900/10 border border-red-500/30 relative overflow-hidden group">
                                                <div className="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(45deg,#000,#000_10px,#ff0000_10px,#ff0000_20px)] pointer-events-none" />
                                                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
                                                    <AlertTriangle size={120} className="text-red-500" />
                                                </div>
                                                <div className="relative z-10">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div className="p-2 rounded-lg bg-red-500/20 text-red-500 animate-pulse">
                                                            <Shield size={24} />
                                                        </div>
                                                        <h3 className="text-red-400 font-bold text-xl tracking-wide uppercase">Danger Zone</h3>
                                                    </div>

                                                    {deletionScheduledAt && timeLeft ? (
                                                        <div className="space-y-6">
                                                            <div className="p-5 rounded-xl bg-black/60 border border-red-500/30 backdrop-blur-md">
                                                                <p className="text-sm text-red-300 mb-4 font-bold uppercase tracking-widest text-center">Self-Destruct Sequence Initiated</p>
                                                                <div className="grid grid-cols-4 gap-4 text-center">
                                                                    {['days', 'hours', 'minutes', 'seconds'].map((unit) => (
                                                                        <div key={unit} className="bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                                                                            <div className="text-3xl font-bold text-red-100 font-mono tabular-nums leading-none">
                                                                                {/* @ts-ignore */}
                                                                                {String(timeLeft[unit]).padStart(2, '0')}
                                                                            </div>
                                                                            <div className="text-[9px] text-red-500 uppercase tracking-widest mt-1">{unit}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                                                                <p className="text-xs text-red-300/70 font-mono">Process ID: DEL-77291</p>
                                                                <button
                                                                    onClick={handleCancelDeletion}
                                                                    className="px-5 py-2.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-bold flex items-center gap-2 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)] hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                                                                >
                                                                    <Shield size={16} />
                                                                    Abort Sequence
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-6">
                                                            <p className="text-sm text-red-200/60 max-w-lg leading-relaxed font-mono">
                                                                WARNING: Initiating account deletion will purge all user data, including goal history, PDF contexts, and XP progression. This action is irreversible after the 7-day grace period.
                                                            </p>
                                                            <button
                                                                onClick={() => setIsDeleteModalOpen(true)}
                                                                className="px-6 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-sm font-bold border border-red-500/30 hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] flex items-center gap-2"
                                                            >
                                                                <Trash2 size={16} />
                                                                Initiate Deletion Protocol
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </GlassCard>
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
