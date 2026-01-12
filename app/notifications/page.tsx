'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Calendar, Info, AlertTriangle, AlertCircle, CheckCircle, Zap, X, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import NeonButton from '@/components/ui/NeonButton';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'SHARE_NOTEBOOK';
    isRead: boolean;
    scheduledFor: string;
    createdAt: string;
    link?: string;
}

import { useUIStore } from '@/store/useUIStore';

// ... other imports

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const { checkUnreadNotifications } = useUIStore();

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                // Sync unread count on load as we might have just read them by visiting
                // Actually, visiting doesn't auto-read unless we implement that. 
                // But let's check anyway to be safe.
                checkUnreadNotifications();
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // Auto-mark as read after 2 seconds
    useEffect(() => {
        if (loading || notifications.length === 0) return;

        const hasUnread = notifications.some(n => !n.isRead);
        if (hasUnread) {
            const timer = setTimeout(async () => {
                try {
                    const res = await fetch('/api/notifications', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'mark_all_read' })
                    });
                    if (res.ok) {
                        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                        checkUnreadNotifications(); // Sync Navbar
                    }
                } catch (error) {
                    console.error('Auto-read failed', error);
                }
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [notifications, loading, checkUnreadNotifications]);

    const markAllRead = async () => {
        if (notifications.every(n => n.isRead)) return;

        try {
            const res = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'mark_all_read' })
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                toast.success('All marked as read');
                checkUnreadNotifications(); // Sync Navbar
            }
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const clearAll = async () => {
        if (notifications.length === 0) return;

        try {
            const res = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clear_all' })
            });
            if (res.ok) {
                setNotifications([]);
                toast.success('All notifications cleared');
                checkUnreadNotifications(); // Sync Navbar
            }
        } catch (error) {
            toast.error('Failed to clear notifications');
        }
    };

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        try {
            await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
            checkUnreadNotifications(); // Sync Navbar
        } catch (error) {
            // Revert if failed
        }
    };

    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setNotifications(prev => prev.filter(n => n._id !== id));
                toast.success('Notification removed');
                checkUnreadNotifications(); // Sync Navbar
            }
        } catch (error) {
            toast.error('Failed to remove notification');
        }
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'success': return {
                icon: CheckCircle,
                color: 'text-green-400',
                bg: 'bg-green-500/10',
                border: 'border-green-500/20',
                glow: 'shadow-[0_0_15px_rgba(34,197,94,0.15)]'
            };
            case 'warning': return {
                icon: AlertTriangle,
                color: 'text-yellow-400',
                bg: 'bg-yellow-500/10',
                border: 'border-yellow-500/20',
                glow: 'shadow-[0_0_15px_rgba(234,179,8,0.15)]'
            };
            case 'error': return {
                icon: AlertCircle,
                color: 'text-red-400',
                bg: 'bg-red-500/10',
                border: 'border-red-500/20',
                glow: 'shadow-[0_0_15px_rgba(248,113,113,0.15)]'
            };
            case 'SHARE_NOTEBOOK': return {
                icon: Zap,
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
                border: 'border-purple-500/20',
                glow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]'
            };
            default: return {
                icon: Info,
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/10',
                border: 'border-cyan-500/20',
                glow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]'
            };
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="min-h-screen pt-28 pb-12 px-4 max-w-5xl mx-auto relative">
            {/* Ambient Background Glows */}
            <div className="fixed top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="fixed bottom-20 right-10 w-64 h-64 bg-purple-500/20 rounded-full blur-[128px] pointer-events-none" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 relative z-10">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 mb-2"
                    >
                        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                            <Bell size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight">
                            Neural <span className="text-primary-foreground text-primary">Stream</span>
                        </h1>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground font-medium"
                    >
                        Direct uplink to your digital workspace activity.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-3"
                >
                    <button
                        onClick={markAllRead}
                        disabled={unreadCount === 0}
                        className={cn(
                            "px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all group",
                            unreadCount > 0
                                ? "bg-white/5 border-white/10 hover:bg-primary/10 hover:border-primary/30 hover:text-primary text-white hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                                : "bg-transparent border-transparent text-muted cursor-not-allowed opacity-50"
                        )}
                    >
                        <Check size={14} className={cn(unreadCount > 0 && "group-hover:scale-110 transition-transform")} />
                        Mark all read
                    </button>
                    <button
                        onClick={clearAll}
                        disabled={notifications.length === 0}
                        className={cn(
                            "px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all group",
                            notifications.length > 0
                                ? "bg-red-500/5 border-red-500/10 hover:bg-red-500/10 hover:border-red-500/30 text-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                : "bg-transparent border-transparent text-muted cursor-not-allowed opacity-50"
                        )}
                    >
                        <Trash2 size={14} className={cn(notifications.length > 0 && "group-hover:scale-110 transition-transform")} />
                        Clear stream
                    </button>
                </motion.div>
            </div>

            {/* Notifications Grid */}
            <div className="relative z-10 min-h-[400px]">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-28 w-full bg-white/5 rounded-3xl animate-pulse border border-white/5 transition-all" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-32 text-center"
                    >
                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 relative border border-white/10">
                            <Bell size={40} className="text-white/20" />
                            <div className="absolute inset-0 border-t border-primary/20 rounded-full animate-[spin_3s_linear_infinite]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">System Silent</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                            No active transmissions. Your neural stream is up to date.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        layout
                        className="grid gap-4"
                    >
                        <AnimatePresence mode='popLayout'>
                            {notifications.map((notification) => {
                                const style = getTypeStyles(notification.type);
                                const Icon = style.icon;

                                return (
                                    <motion.div
                                        key={notification._id}
                                        layout
                                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                        onClick={() => !notification.isRead && markAsRead(notification._id)}
                                        className={cn(
                                            "relative p-6 rounded-3xl border transition-all duration-300 group cursor-pointer overflow-hidden",
                                            notification.isRead
                                                ? "bg-black/40 border-white/5 hover:border-white/10"
                                                : `bg-black/60 border-white/10 ${style.glow} hover:border-white/20 ring-1 ring-inset ring-white/5`
                                        )}
                                    >
                                        {/* Glow Effect for Unread */}
                                        {!notification.isRead && (
                                            <div className={cn("absolute inset-0 opacity-5 pointer-events-none transition-opacity duration-500", style.bg)} />
                                        )}

                                        <div className="flex gap-5 relative z-10">
                                            {/* Icon Box */}
                                            <div className={cn(
                                                "shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300",
                                                notification.isRead
                                                    ? "bg-white/5 border-white/5 text-muted-foreground grayscale"
                                                    : `${style.bg} ${style.border} ${style.color} shadow-lg`
                                            )}>
                                                <Icon size={20} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-4 mb-1">
                                                    <h3 className={cn(
                                                        "font-bold text-lg leading-tight truncate pr-4 transition-colors",
                                                        notification.isRead ? "text-muted-foreground" : "text-white"
                                                    )}>
                                                        {notification.title}
                                                    </h3>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                                                            <Clock size={10} />
                                                            {new Date(notification.createdAt).toLocaleDateString()}
                                                        </div>
                                                        <button
                                                            onClick={deleteNotification.bind(null, notification._id)}
                                                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-muted-foreground/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <p className={cn(
                                                    "text-sm leading-relaxed line-clamp-2 transition-colors",
                                                    notification.isRead ? "text-muted-foreground/60" : "text-muted-foreground"
                                                )}>
                                                    {notification.message}
                                                </p>

                                                {/* Action Footer */}
                                                {!notification.isRead && (
                                                    <div className="mt-4 flex items-center gap-3">
                                                        <span className={cn(
                                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-black/20 border border-white/5",
                                                            style.color
                                                        )}>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                                            New Alert
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Hover Gradient Shine */}
                                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
