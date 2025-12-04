'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Bell, Lock, Monitor,
    Globe, Moon, Volume2, Shield,
    ChevronRight, ToggleLeft, ToggleRight,
    Timer, AlertTriangle
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { useUserStore } from '@/store/useUserStore';
import { toast } from 'sonner';
import DeleteAccountModal from '@/components/modals/DeleteAccountModal';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general');
    const { name, email, bio, dob, university, deletionScheduledAt, updateProfile, scheduleDeletion, cancelDeletion } = useUserStore();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

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

    const tabs = [
        { id: 'general', label: 'General', icon: User },
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

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
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
                        <GlassCard className="p-4 space-y-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === tab.id
                                        ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                                        : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <tab.icon size={18} />
                                    <span className="font-medium">{tab.label}</span>
                                    {activeTab === tab.id && (
                                        <motion.div layoutId="active-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
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
                        <GlassCard className="p-8 min-h-[500px]">
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
                                        <div>
                                            <h2 className="text-2xl font-bold mb-6">Profile Information</h2>
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
                                        <div className="pt-8 border-t border-white/5 flex justify-end">
                                            <NeonButton onClick={handleSave}>Save Changes</NeonButton>
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
