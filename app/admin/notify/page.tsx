'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Send, Calendar, Users, User, Mail, Sparkles, AlertCircle, Clock, Link as LinkIcon, Shield, Zap, Info, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import NeonButton from '@/components/ui/NeonButton';
import ConditionBuilder, { Condition } from '@/components/admin/ConditionBuilder';

type TargetType = 'all' | 'specific' | 'email' | 'new_users' | 'inactive' | 'subscribers' | 'bulk_email' | 'bulk_id' | 'custom_condition';
type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'SHARE_NOTEBOOK';

export default function AdminNotifyPage() {
    const [target, setTarget] = useState<TargetType>('all');
    const [recipientId, setRecipientId] = useState('');
    const [email, setEmail] = useState('');
    const [bulkRecipients, setBulkRecipients] = useState('');
    const [conditions, setConditions] = useState<Condition[]>([]);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [link, setLink] = useState('');
    const [type, setType] = useState<NotificationType>('info');
    const [scheduledFor, setScheduledFor] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload: any = {
                target,
                title,
                message,
                type,
                link: link || undefined,
                scheduledFor: scheduledFor || undefined
            };

            if (target === 'specific') payload.recipientId = recipientId;
            if (target === 'email') payload.email = email;
            if (target === 'bulk_email' || target === 'bulk_id') payload.bulkRecipients = bulkRecipients;
            if (target === 'custom_condition') payload.conditions = conditions;

            const res = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || 'Notification broadcasted successfully');
                // Reset core fields but keep some context if needed
                setTitle('');
                setMessage('');
                setLink('');
                setBulkRecipients('');
            } else {
                toast.error(data.error || 'Failed to broadcast');
            }
        } catch (error) {
            toast.error('Network error occurred during broadcast');
        } finally {
            setLoading(false);
        }
    };

    const targetOptions = [
        { id: 'all', label: 'All Users', icon: Users, desc: 'Broadcast to everyone' },
        { id: 'subscribers', label: 'Subscribers', icon: Sparkles, desc: 'Premium members only' },
        { id: 'new_users', label: 'New Users', icon: Zap, desc: 'Joined in last 7 days' },
        { id: 'inactive', label: 'Inactive', icon: Clock, desc: 'Away for > 30 days' },
        { id: 'email', label: 'By Email', icon: Mail, desc: 'Target specific email' },
        { id: 'specific', label: 'By ID', icon: User, desc: 'Target user ID' },
        { id: 'bulk_email', label: 'Bulk Emails', icon: Mail, desc: 'Paste email list' },
        { id: 'bulk_id', label: 'Bulk IDs', icon: User, desc: 'Paste ID list' },
        { id: 'custom_condition', label: 'Custom Query', icon: Sliders, desc: 'Build logic gates' },
    ];

    const typeOptions = [
        { id: 'info', label: 'Info', color: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
        { id: 'success', label: 'Success', color: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' },
        { id: 'warning', label: 'Warning', color: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500' },
        { id: 'error', label: 'Error', color: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
        { id: 'SHARE_NOTEBOOK', label: 'System', color: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500' },
    ];

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 max-w-6xl mx-auto relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-blue-900/10 via-[#050505] to-[#050505] -z-10" />
            <div className="fixed top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse" />

            <div className="mb-10">
                <h1 className="text-4xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
                    <Shield className="text-primary" size={32} />
                    Command <span className="text-primary">Center</span>
                </h1>
                <p className="text-muted-foreground text-lg">Broadcast notifications across the Neural Network.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Target Selection Card */}
                        <div className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary/50 to-purple-500/50" />
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Users size={18} className="text-primary" /> Target Audience
                            </h3>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {targetOptions.map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setTarget(opt.id as TargetType)}
                                        className={cn(
                                            "relative p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 group/btn hover:-translate-y-1 h-24 justify-center",
                                            target === opt.id
                                                ? "bg-primary/10 border-primary/50 text-primary shadow-[0_0_20px_rgba(0,240,255,0.15)]"
                                                : "bg-white/5 border-white/5 text-muted hover:bg-white/10 hover:border-white/20 hover:text-white"
                                        )}
                                    >
                                        <opt.icon size={20} className={cn("transition-transform duration-300", target === opt.id && "scale-110")} />
                                        <div className="text-center">
                                            <div className="text-[10px] font-black uppercase tracking-wider mb-0.5">{opt.label}</div>
                                            <div className="text-[9px] opacity-50 truncate w-full px-1">{opt.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Conditional Inputs */}
                            <AnimatePresence mode='wait'>
                                {target === 'specific' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4"
                                    >
                                        <label className="text-xs font-bold text-white/60 mb-2 block uppercase tracking-wider">User ID</label>
                                        <input
                                            type="text"
                                            value={recipientId}
                                            onChange={(e) => setRecipientId(e.target.value)}
                                            placeholder="Paste Mongo ID here..."
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted/20 font-mono text-sm"
                                        />
                                    </motion.div>
                                )}
                                {target === 'email' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4"
                                    >
                                        <label className="text-xs font-bold text-white/60 mb-2 block uppercase tracking-wider">User Email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="user@example.com"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted/20"
                                        />
                                    </motion.div>
                                )}
                                {(target === 'bulk_email' || target === 'bulk_id') && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4"
                                    >
                                        <label className="text-xs font-bold text-white/60 mb-2 block uppercase tracking-wider">
                                            {target === 'bulk_email' ? 'Paste User Emails (Comma or Newline separated)' : 'Paste User IDs (Comma or Newline separated)'}
                                        </label>
                                        <textarea
                                            value={bulkRecipients}
                                            onChange={(e) => setBulkRecipients(e.target.value)}
                                            placeholder={target === 'bulk_email' ? "user1@example.com\nuser2@example.com" : "65a...\n65b..."}
                                            rows={5}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted/20 font-mono text-xs"
                                        />
                                    </motion.div>
                                )}
                                {target === 'custom_condition' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4"
                                    >
                                        <ConditionBuilder onChange={setConditions} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Content Card */}
                        <div className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-purple-500/50 to-pink-500/50" />
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Send size={18} className="text-purple-500" /> Transmission Content
                            </h3>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-white/60 mb-2 block uppercase tracking-wider">Notification Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Enter a catchy headline..."
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted/20 font-bold text-lg"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-white/60 mb-2 block uppercase tracking-wider">Message Body</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Write your broadcast message..."
                                        rows={4}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted/20 resize-none leading-relaxed"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-xs font-bold text-white/60 mb-2 block uppercase tracking-wider">Action Link (Optional)</label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-3.5 text-muted-foreground/50" size={16} />
                                            <input
                                                type="text"
                                                value={link}
                                                onChange={(e) => setLink(e.target.value)}
                                                placeholder="/dashboard/..."
                                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted/20 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-white/60 mb-2 block uppercase tracking-wider">Schedule (Optional)</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-3.5 text-muted-foreground/50" size={16} />
                                            <input
                                                type="datetime-local"
                                                value={scheduledFor}
                                                onChange={(e) => setScheduledFor(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted/20 text-sm scheme-dark"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-white/60 mb-3 block uppercase tracking-wider">Priority Level</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {typeOptions.map((t) => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setType(t.id as NotificationType)}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-300",
                                                    type === t.id
                                                        ? `${t.text} ${t.border} bg-white/5 shadow-[0_0_15px_rgba(0,0,0,0.5)] scale-105`
                                                        : "text-muted border-transparent bg-white/5 hover:bg-white/10"
                                                )}
                                            >
                                                <span className={cn("inline-block w-2 h-2 rounded-full mr-2", t.color)} />
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <NeonButton
                            className="w-full py-5 text-sm font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(0,240,255,0.3)] hover:shadow-[0_0_60px_rgba(0,240,255,0.5)]"
                            variant="primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2 animate-pulse">
                                    <Sparkles size={16} className="animate-spin" /> Transmitting...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Send size={16} /> Inititate Broadcast
                                </span>
                            )}
                        </NeonButton>
                    </form>
                </div>

                {/* Sidebar Preview */}
                <div className="space-y-6">
                    <div className="bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 p-6 rounded-3xl sticky top-28">
                        <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Zap size={14} className="text-yellow-400" /> Live Preview
                        </h3>

                        <div className={cn(
                            "relative p-5 rounded-2xl border transition-all duration-300 overflow-hidden",
                            "bg-black/60 border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                        )}>
                            <div className="flex gap-4 relative z-10">
                                <div className={cn(
                                    "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border",
                                    type === 'info' && "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
                                    type === 'success' && "bg-green-500/10 border-green-500/20 text-green-400",
                                    type === 'warning' && "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
                                    type === 'error' && "bg-red-500/10 border-red-500/20 text-red-400",
                                    type === 'SHARE_NOTEBOOK' && "bg-purple-500/10 border-purple-500/20 text-purple-400",
                                )}>
                                    <Info size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white text-sm mb-1 truncate">{title || 'Notification Title'}</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                        {message || 'Your broadcast message preview will appear here in real-time.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5">
                            <h4 className="text-xs font-bold text-white/80 mb-3 flex items-center gap-2">
                                <Info size={14} className="text-blue-400" /> Broadcast Guide
                            </h4>
                            <ul className="space-y-3">
                                <li className="flex gap-3 text-xs text-muted-foreground leading-relaxed">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                    <span><b>Subscribers:</b> Targets users with active 'Pro' subscriptions only.</span>
                                </li>
                                <li className="flex gap-3 text-xs text-muted-foreground leading-relaxed">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                                    <span><b>New Users:</b> Users joined &lt; 7 days.</span>
                                </li>
                                <li className="flex gap-3 text-xs text-muted-foreground leading-relaxed">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                    <span><b>Inactive:</b> Dormant for 30+ days.</span>
                                </li>
                                <li className="flex gap-3 text-xs text-muted-foreground leading-relaxed">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                                    <span><b>Bulk:</b> Paste lists of emails/IDs.</span>
                                </li>
                                <li className="flex gap-3 text-xs text-muted-foreground leading-relaxed">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                    <span><b>Custom Query:</b> Logic gates for complex filtering (e.g., Level &gt; 10 AND Interest Contains 'AI').</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
