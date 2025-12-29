'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Bell, Lock, Monitor,
    Globe, Moon, Volume2, Shield,
    ChevronRight, ToggleLeft, ToggleRight,
    Timer, AlertTriangle, Target, Check, Calendar, BookOpen, AlertCircle
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import CustomSelect from '@/components/ui/CustomSelect';
import { useUserStore } from '@/store/useUserStore';
import { toast } from 'sonner';
import DeleteAccountModal from '@/components/modals/DeleteAccountModal';
import ConfirmSaveModal from '@/components/modals/ConfirmSaveModal';
import { cn } from '@/lib/utils';
import ProfileImageUpload from '@/components/profile/ProfileImageUpload';

// Types for Daily Goal Configuration
type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Subject = 'Physics' | 'Math' | 'Chemistry' | 'Biology' | 'CS' | 'History' | 'English' | 'NEET Prep' | 'JEE Prep' | 'General Knowledge';

interface DailyGoalConfig {
    id: number;
    enabled: boolean;
    subject: Subject;
    difficulty: Difficulty;
    topic: string;
    isTimeBound: boolean;
}

const SUBJECTS: Subject[] = ['Physics', 'Math', 'Chemistry', 'Biology', 'CS', 'History', 'English', 'NEET Prep', 'JEE Prep', 'General Knowledge'];
const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general');
    const { user, name, email, bio, dob, university, deletionScheduledAt, updateProfile, scheduleDeletion, cancelDeletion, fetchUser } = useUserStore();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

    // Initial Mock State for Daily Goals (fallback)
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

    // Hydrate Settings from User Store
    useEffect(() => {
        if (user && user.dailyGoalPreferences && user.dailyGoalPreferences.length > 0) {
            // Ensure data types match our expectation (sometimes topic is null in DB)
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
    }, [user]);

    // Check for modifications
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


    // Local state for form inputs
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        bio: '',
        dob: '',
        university: ''
    });

    // Sync local state with store on mount
    useEffect(() => {
        setFormData({
            name,
            email,
            bio,
            dob: dob ? new Date(dob).toISOString().split('T')[0] : '',
            university
        });
    }, [name, email, bio, dob, university]);

    // Timer Logic
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
        updateProfile({
            ...formData,
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
                // Clear the cache so Explore page regenerates goals with new settings
                localStorage.removeItem('dailyGoalsCache');
                toast.success('Daily goal preferences saved successfully!');

                // Refresh user to get updated preferences and reset isModified
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
        { id: 'daily-goals', label: 'Customize Daily Goals', icon: Target }, // NEW TAB
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

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10"> {/* Changed to max-w-7xl for more space */}
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
                    {/* Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="lg:col-span-1"
                    >
                        <GlassCard className="p-4 space-y-2 sticky top-32">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group",
                                        activeTab === tab.id
                                            ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                                            : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                                    )}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="active-tab-bg"
                                            className="absolute inset-0 bg-primary/10"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                    <div className="relative z-10 flex items-center gap-3">
                                        <tab.icon size={18} />
                                        <span className="font-medium text-sm">{tab.label}</span>
                                    </div>
                                    {activeTab === tab.id && (
                                        <motion.div layoutId="active-indicator" className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                    )}
                                </button>
                            ))}
                        </GlassCard>
                    </motion.div>

                    {/* Content Area */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="lg:col-span-3"
                    >
                        <GlassCard className="p-6 md:p-8 min-h-[500px]">
                            <AnimatePresence mode="wait">
                                {activeTab === 'general' && (
                                    <motion.div
                                        key="general"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-8"
                                    >
                                        {/* ... (Existing General Tab Content) */}
                                        <div className="flex flex-col md:flex-row gap-8 items-start">
                                            <ProfileImageUpload
                                                initialImage={user?.profileImage}
                                                onSuccess={(url) => {
                                                    // Optionally update local user store if it has profileImage
                                                    fetchUser();
                                                }}
                                            />

                                            <div className="flex-1 space-y-6 w-full">
                                                <h2 className="text-2xl font-bold">Profile Information</h2>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-sm text-muted-foreground">Display Name</label>
                                                        <input
                                                            type="text"
                                                            value={formData.name}
                                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 transition-colors"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm text-muted-foreground">Email Address</label>
                                                        <input
                                                            type="email"
                                                            value={formData.email}
                                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 transition-colors"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm text-muted-foreground">Date of Birth</label>
                                                        <input
                                                            type="date"
                                                            value={formData.dob}
                                                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 transition-colors scheme-dark"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm text-muted-foreground">University / School</label>
                                                        <input
                                                            type="text"
                                                            value={formData.university}
                                                            onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 transition-colors"
                                                            placeholder="e.g. Stanford University"
                                                        />
                                                    </div>
                                                    <div className="col-span-full space-y-2">
                                                        <label className="text-sm text-muted-foreground">Bio</label>
                                                        <textarea
                                                            rows={4}
                                                            value={formData.bio}
                                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                                                            placeholder="Tell us a bit about yourself..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-8 border-t border-white/5 flex justify-end">
                                            <NeonButton onClick={handleSave}>Save Changes</NeonButton>
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
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                                    Customize Daily Goals
                                                    <span className="text-sm font-normal text-muted-foreground bg-white/5 px-2 py-1 rounded-md border border-white/10">7 Slots</span>
                                                </h2>
                                                <p className="text-muted-foreground text-sm mt-1">Configure your 7 daily exam slots to match your learning path.</p>
                                            </div>
                                            <NeonButton
                                                onClick={handleSaveDailyGoalsClick}
                                                size="sm"
                                                disabled={!isModified}
                                                className={!isModified ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                                            >
                                                <Check size={16} className="mr-2" />
                                                Save Config
                                            </NeonButton>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {dailyGoalConfigs.map((config, index) => (
                                                <motion.div
                                                    key={config.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:bg-white/[0.07] transition-all p-5 shadow-sm hover:shadow-md hover:border-primary/20"
                                                >
                                                    <div className="absolute inset-0 bg-linear-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                                    <div className="flex flex-col md:flex-row gap-6 relative z-10">
                                                        {/* Slot Info */}
                                                        <div className="flex items-start md:items-center gap-4 min-w-[120px]">
                                                            <div className={cn(
                                                                "w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-lg shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-colors",
                                                                config.enabled
                                                                    ? "bg-black/40 border-primary/30 text-primary shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                                                                    : "bg-white/5 border-white/10 text-muted-foreground"
                                                            )}>
                                                                {index + 1}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className={cn("text-sm font-bold", config.enabled ? "text-white" : "text-muted-foreground")}>Daily Slot {index + 1}</span>
                                                                <button
                                                                    onClick={() => updateGoalConfig(config.id, { enabled: !config.enabled })}
                                                                    className={cn("text-xs text-left transition-colors", config.enabled ? "text-green-400 hover:text-green-300" : "text-muted-foreground hover:text-white")}
                                                                >
                                                                    {config.enabled ? 'Active' : 'Disabled'}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Controls Grid */}
                                                        <div className={cn("flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start focus-within:ring-0 transition-opacity duration-300", !config.enabled && "opacity-40 pointer-events-none select-none")}>

                                                            {/* Subject Select */}
                                                            <div className="space-y-1.5">
                                                                <CustomSelect
                                                                    label="Subject"
                                                                    value={config.subject}
                                                                    onChange={(val) => updateGoalConfig(config.id, { subject: val as Subject })}
                                                                    options={SUBJECTS}
                                                                    placeholder="Select Subject"
                                                                />
                                                            </div>

                                                            {/* Difficulty Toggle */}
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Difficulty</label>
                                                                <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                                                                    {DIFFICULTIES.map(d => (
                                                                        <button
                                                                            key={d}
                                                                            onClick={() => updateGoalConfig(config.id, { difficulty: d })}
                                                                            className={cn(
                                                                                "flex-1 py-1 text-[10px] font-bold uppercase rounded-md transition-all",
                                                                                config.difficulty === d
                                                                                    ? d === 'Easy' ? 'bg-green-500/20 text-green-400'
                                                                                        : d === 'Medium' ? 'bg-yellow-500/20 text-yellow-400'
                                                                                            : 'bg-red-500/20 text-red-400'
                                                                                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                                                                            )}
                                                                        >
                                                                            {d}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Topic Input */}
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Specific Topic</label>
                                                                <div className="relative">
                                                                    <Target size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Any specific topic..."
                                                                        value={config.topic}
                                                                        onChange={(e) => updateGoalConfig(config.id, { topic: e.target.value })}
                                                                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm focus:border-primary/50 focus:outline-none transition-all placeholder:text-muted-foreground/50"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Time Bound Toggle */}
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Timer</label>
                                                                <button
                                                                    onClick={() => updateGoalConfig(config.id, { isTimeBound: !config.isTimeBound })}
                                                                    className={cn(
                                                                        "w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all h-[38px]",
                                                                        config.isTimeBound
                                                                            ? "bg-primary/10 border-primary/30 text-primary"
                                                                            : "bg-black/40 border-white/10 text-muted-foreground hover:bg-white/5"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <Timer size={14} />
                                                                        <span className="text-xs font-medium">{config.isTimeBound ? 'Enabled' : 'Disabled'}</span>
                                                                    </div>
                                                                    {config.isTimeBound ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                                                </button>
                                                            </div>

                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* ... (Rest of the tabs: activeTab === 'appearance', 'notifications', 'privacy' remain unchanged but rendered conditionally) */}
                                {activeTab === 'appearance' && (
                                    <motion.div
                                        key="appearance"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-8"
                                    >
                                        <h2 className="text-2xl font-bold mb-6">Theme & Display</h2>

                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400"><Moon size={20} /></div>
                                                    <div>
                                                        <div className="font-medium">Dark Mode</div>
                                                        <div className="text-sm text-muted-foreground">Use system preference</div>
                                                    </div>
                                                </div>
                                                <ToggleRight size={32} className="text-primary cursor-pointer" />
                                            </div>

                                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400"><Globe size={20} /></div>
                                                    <div>
                                                        <div className="font-medium">Language</div>
                                                        <div className="text-sm text-muted-foreground">English (US)</div>
                                                    </div>
                                                </div>
                                                <ChevronRight size={20} className="text-muted-foreground" />
                                            </div>

                                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 rounded-lg bg-green-500/20 text-green-400"><Volume2 size={20} /></div>
                                                    <div>
                                                        <div className="font-medium">Sound Effects</div>
                                                        <div className="text-sm text-muted-foreground">UI interaction sounds</div>
                                                    </div>
                                                </div>
                                                <ToggleRight size={32} className="text-primary cursor-pointer" />
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
                                        <h2 className="text-2xl font-bold mb-6">Notification Preferences</h2>
                                        <div className="space-y-4">
                                            {['Email Notifications', 'Push Notifications', 'Weekly Digest', 'Product Updates'].map((item, i) => (
                                                <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                                    <span className="font-medium">{item}</span>
                                                    <ToggleRight size={32} className={`cursor-pointer ${i < 2 ? 'text-primary' : 'text-muted-foreground'}`} />
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
                                        <h2 className="text-2xl font-bold mb-6">Privacy & Security</h2>

                                        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 mb-6 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-50">
                                                <AlertTriangle size={100} className="text-red-500/20" />
                                            </div>

                                            <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2 text-lg">
                                                <Shield size={20} /> Danger Zone
                                            </h3>

                                            {deletionScheduledAt && timeLeft ? (
                                                <div className="space-y-6 relative z-10">
                                                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                                                        <p className="text-sm text-red-300 mb-3 font-medium">Account scheduled for deletion in:</p>
                                                        <div className="grid grid-cols-4 gap-2 text-center">
                                                            <div className="bg-black/40 rounded p-2 border border-red-500/20">
                                                                <div className="text-2xl font-bold text-white font-mono">{timeLeft.days}</div>
                                                                <div className="text-[10px] text-red-400 uppercase tracking-wider">Days</div>
                                                            </div>
                                                            <div className="bg-black/40 rounded p-2 border border-red-500/20">
                                                                <div className="text-2xl font-bold text-white font-mono">{timeLeft.hours}</div>
                                                                <div className="text-[10px] text-red-400 uppercase tracking-wider">Hours</div>
                                                            </div>
                                                            <div className="bg-black/40 rounded p-2 border border-red-500/20">
                                                                <div className="text-2xl font-bold text-white font-mono">{timeLeft.minutes}</div>
                                                                <div className="text-[10px] text-red-400 uppercase tracking-wider">Mins</div>
                                                            </div>
                                                            <div className="bg-black/40 rounded p-2 border border-red-500/20">
                                                                <div className="text-2xl font-bold text-white font-mono">{timeLeft.seconds}</div>
                                                                <div className="text-[10px] text-red-400 uppercase tracking-wider">Secs</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs text-muted-foreground">Change your mind?</p>
                                                        <button
                                                            onClick={handleCancelDeletion}
                                                            className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-bold flex items-center gap-2"
                                                        >
                                                            <Shield size={14} />
                                                            Cancel Deletion
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4 relative z-10">
                                                    <p className="text-sm text-red-400/80 max-w-md leading-relaxed">
                                                        Permanently delete your account and all associated data.
                                                        This action starts a 7-day grace period during which you can cancel.
                                                    </p>
                                                    <button
                                                        onClick={() => setIsDeleteModalOpen(true)}
                                                        className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-bold border border-red-500/20 hover:border-red-500/50"
                                                    >
                                                        Delete Account
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-medium">Two-Factor Authentication</div>
                                                    <div className="text-sm text-muted-foreground">Add an extra layer of security</div>
                                                </div>
                                                <NeonButton variant="ghost" size="sm">Enable</NeonButton>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </GlassCard>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
