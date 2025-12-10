'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Calendar, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isRead: boolean;
    scheduledFor: string;
    createdAt: string;
    link?: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
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

    const markAllRead = async () => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'mark_all_read' })
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                toast.success('All marked as read');
            }
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const clearAll = async () => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clear_all' })
            });
            if (res.ok) {
                setNotifications([]);
                toast.success('All notifications cleared');
            }
        } catch (error) {
            toast.error('Failed to clear notifications');
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            }
        } catch (error) {
            // fail silently or toast
        }
    };

    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setNotifications(prev => prev.filter(n => n._id !== id));
                toast.success('Notification removed');
            }
        } catch (error) {
            toast.error('Failed to remove notification');
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="text-green-400" size={20} />;
            case 'warning': return <AlertTriangle className="text-yellow-400" size={20} />;
            case 'error': return <AlertCircle className="text-red-400" size={20} />;
            default: return <Info className="text-blue-400" size={20} />;
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500 mb-2">
                        Notifications
                    </h1>
                    <p className="text-muted-foreground">Stay updated with your latest alerts and announcements.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={markAllRead}
                        className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                        <Check size={16} />
                        Mark all read
                    </button>
                    <button
                        onClick={clearAll}
                        className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        Clear all
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 w-full bg-white/5 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                    <Bell size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No notifications yet</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence>
                        {notifications.map((notification) => (
                            <motion.div
                                key={notification._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                layout
                                onClick={() => !notification.isRead && markAsRead(notification._id)}
                                className={`
                                    relative p-6 rounded-2xl border transition-all cursor-pointer group
                                    ${notification.isRead
                                        ? 'bg-black/20 border-white/5 text-muted-foreground'
                                        : 'bg-white/5 border-primary/20 shadow-[0_0_15px_rgba(0,0,0,0.2)]'
                                    }
                                `}
                            >
                                <div className="flex gap-4">
                                    <div className="mt-1 shrink-0 p-2 rounded-full bg-white/5">
                                        {getTypeIcon(notification.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start gap-4">
                                            <h3 className={`font-semibold text-lg mb-1 ${notification.isRead ? '' : 'text-foreground'}`}>
                                                {notification.title}
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs opacity-50 whitespace-nowrap">
                                                    {new Date(notification.scheduledFor).toLocaleDateString()}
                                                </span>
                                                <button
                                                    onClick={(e) => deleteNotification(notification._id, e)}
                                                    className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm leading-relaxed opacity-80 mb-2">
                                            {notification.message}
                                        </p>
                                        {!notification.isRead && (
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                                                New
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
