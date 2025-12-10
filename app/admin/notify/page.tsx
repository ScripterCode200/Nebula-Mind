'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Send, Calendar, Users, User, AlertCircle } from 'lucide-react';

export default function AdminNotifyPage() {
    const [target, setTarget] = useState<'all' | 'specific'>('all');
    const [recipientId, setRecipientId] = useState('');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info');
    const [scheduledFor, setScheduledFor] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target,
                    recipientId: target === 'specific' ? recipientId : undefined,
                    title,
                    message,
                    type,
                    scheduledFor: scheduledFor || undefined
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || 'Notification sent successfully');
                // Reset form
                setTitle('');
                setMessage('');
                setScheduledFor('');
            } else {
                toast.error(data.error || 'Failed to send');
            }
        } catch (error) {
            toast.error('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">System Notifications</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-6">

                        {/* Target Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setTarget('all')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${target === 'all'
                                        ? 'bg-primary/20 border-primary text-primary'
                                        : 'bg-black/20 border-white/10 hover:bg-white/5'
                                    }`}
                            >
                                <Users size={24} />
                                <span className="font-medium">All Users</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTarget('specific')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${target === 'specific'
                                        ? 'bg-primary/20 border-primary text-primary'
                                        : 'bg-black/20 border-white/10 hover:bg-white/5'
                                    }`}
                            >
                                <User size={24} />
                                <span className="font-medium">Specific User</span>
                            </button>
                        </div>

                        {/* Recipient ID (if specific) */}
                        {target === 'specific' && (
                            <div>
                                <label className="block text-sm font-medium mb-2 text-muted-foreground">User ID</label>
                                <input
                                    type="text"
                                    value={recipientId}
                                    onChange={(e) => setRecipientId(e.target.value)}
                                    placeholder="Enter user Mongo ID"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50"
                                    required
                                />
                            </div>
                        )}

                        {/* Content */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-muted-foreground">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Notification Title"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-muted-foreground">Message</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Detailed message..."
                                    rows={4}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 resize-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-muted-foreground">Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50"
                                >
                                    <option value="info">Info (Blue)</option>
                                    <option value="success">Success (Green)</option>
                                    <option value="warning">Warning (Yellow)</option>
                                    <option value="error">Error (Red)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-muted-foreground">Schedule (Optional)</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3.5 text-muted-foreground" size={16} />
                                    <input
                                        type="datetime-local"
                                        value={scheduledFor}
                                        onChange={(e) => setScheduledFor(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-primary/50 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary to-blue-600 text-black font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : (
                                <>
                                    <Send size={20} />
                                    Send Notification
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Instructions / Preview */}
                <div className="space-y-6">
                    <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
                        <h3 className="flex items-center gap-2 font-bold text-blue-400 mb-4">
                            <AlertCircle size={20} />
                            Instructions
                        </h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li className="flex gap-2">
                                <span className="text-blue-500">•</span>
                                <span><b>All Users:</b> Sends this notification to every registered user in the database. Use sparingly.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-blue-500">•</span>
                                <span><b>Scheduling:</b> Notifications will only appear to users AFTER the scheduled time.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-blue-500">•</span>
                                <span><b>Persistence:</b> Notifications are stored in the database until the user clears them.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
