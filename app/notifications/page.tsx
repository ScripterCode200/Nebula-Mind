'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, Check, Sparkles, BookOpen,
    Zap, AlertTriangle, Info, Trash2, Lock, User
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

export default function NotificationsPage() {
    const [filter, setFilter] = useState('all');

    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch('/api/notifications');
                const data = await res.json();
                setLogs(data);
            } catch (error) {
                console.error('Failed to fetch notifications');
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const notifications = logs.map((log: any) => ({
        id: log._id,
        type: 'system',
        title: log.method === 'alpha' ? 'Alpha Access Login' : 'New Sign-in',
        desc: `User ${log.email} signed in via ${log.method === 'alpha' ? 'OTP Verification' : 'Standard Login'}.`,
        time: new Date(log.timestamp).toLocaleString(),
        read: false,
        icon: log.method === 'alpha' ? Lock : User,
        color: log.method === 'alpha' ? 'text-primary' : 'text-green-400',
        bg: log.method === 'alpha' ? 'bg-primary/10' : 'bg-green-400/10'
    }));

    const filteredNotifications = filter === 'all'
        ? notifications
        : filter === 'unread'
            ? notifications.filter((n: any) => !n.read)
            : notifications.filter((n: any) => n.type === filter);

    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-primary/30 relative pt-32 pb-20 px-4 md:px-8">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                                <Bell size={32} className="text-primary" />
                            </div>
                            Notifications
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Stay updated with your activity and system announcements.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex gap-3"
                    >
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm font-medium">
                            <Check size={16} /> Mark all read
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 hover:text-red-400 transition-colors text-sm font-medium">
                            <Trash2 size={16} /> Clear all
                        </button>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Filters */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="md:col-span-1"
                    >
                        <GlassCard className="p-2 space-y-1 sticky top-32">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'unread', label: 'Unread' },
                                { id: 'notebook', label: 'Notebooks' },
                                { id: 'system', label: 'System' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setFilter(item.id)}
                                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === item.id
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </GlassCard>
                    </motion.div>

                    {/* List */}
                    <div className="md:col-span-3 space-y-4">
                        <AnimatePresence mode="popLayout">
                            {filteredNotifications.map((notif, i) => (
                                <motion.div
                                    key={notif.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                >
                                    <GlassCard className={`p-4 flex gap-4 transition-all hover:bg-white/10 ${!notif.read ? 'border-l-4 border-l-primary bg-white/5' : ''}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.bg} ${notif.color}`}>
                                            <notif.icon size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className={`font-medium ${!notif.read ? 'text-white' : 'text-muted-foreground'}`}>
                                                    {notif.title}
                                                </h3>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                    {notif.time}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {notif.desc}
                                            </p>
                                        </div>
                                        {!notif.read && (
                                            <div className="self-center">
                                                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
                                            </div>
                                        )}
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {filteredNotifications.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-20 text-muted-foreground"
                            >
                                <Bell size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No notifications found</p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
