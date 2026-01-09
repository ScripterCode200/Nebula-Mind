import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Check, Search, User as UserIcon, Loader2, Sparkles } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';

interface ShareNotebookModalProps {
    isOpen: boolean;
    onClose: () => void;
    notebookId: string;
    notebookTitle: string;
}

interface UserResult {
    _id: string;
    name: string;
    email: string;
}

export default function ShareNotebookModal({ isOpen, onClose, notebookId, notebookTitle }: ShareNotebookModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserResult[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length >= 2) {
                searchUsers(searchQuery);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const searchUsers = async (query: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                const filtered = data.filter((u: UserResult) => !selectedUsers.some(s => s._id === u._id));
                setSearchResults(filtered);
            }
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectUser = (user: UserResult) => {
        setSelectedUsers([...selectedUsers, user]);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleRemoveUser = (userId: string) => {
        setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
    };

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedUsers.length === 0) return;

        setIsSharing(true);
        setMessage(null);

        try {
            const res = await fetch('/api/notebooks/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notebookId,
                    recipientIds: selectedUsers.map(u => u._id)
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setMessage({ type: 'success', text: `Shared with ${selectedUsers.length} user(s)!` });
                setSelectedUsers([]);
                setTimeout(() => {
                    onClose();
                    setMessage(null);
                }, 2000);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to share.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setIsSharing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh]"
                        >
                            {/* Decorative Glow */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />

                            {/* Header */}
                            <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0 relative z-10">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                        <Share2 size={20} className="text-primary" />
                                        Share Notebook
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-[300px]">
                                        Checking permissions for "{notebookTitle}"
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-full transition-all text-muted-foreground hover:text-white hover:rotate-90"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto flex-1 space-y-6 relative z-10 min-h-[300px]">

                                {/* Selected Users Area */}
                                <div className="space-y-4">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Sparkles size={12} className="text-primary" />
                                        To:
                                    </label>

                                    <div className="flex flex-wrap gap-2 min-h-[40px]">
                                        <AnimatePresence mode='popLayout'>
                                            {selectedUsers.map(user => (
                                                <motion.span
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    key={user._id}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-linear-to-r from-primary/10 to-blue-500/10 border border-primary/20 text-white text-sm group hover:border-primary/40 transition-colors"
                                                >
                                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    {user.name}
                                                    <button
                                                        onClick={() => handleRemoveUser(user._id)}
                                                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors text-primary/70 hover:text-primary"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </motion.span>
                                            ))}
                                        </AnimatePresence>

                                        {/* Search Input Integrated with Tags */}
                                        <div className="relative flex-1 min-w-[200px] group">
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder={selectedUsers.length > 0 ? "Add more people..." : "Search by name or ID..."}
                                                className="w-full bg-transparent border-none text-white placeholder:text-zinc-600 focus:outline-none focus:ring-0 py-2 px-1 text-sm peer"
                                                autoFocus
                                            />
                                            {/* Bottom Border Glow */}
                                            <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10 peer-focus:bg-primary/50 transition-colors" />

                                            {isLoading && (
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                                    <Loader2 size={16} className="animate-spin text-primary" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Suggestions */}
                                <div className="space-y-2">
                                    <AnimatePresence>
                                        {searchResults.map((user, index) => (
                                            <motion.button
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                key={user._id}
                                                onClick={() => handleSelectUser(user)}
                                                className="w-full text-left p-3 rounded-xl hover:bg-white/5 active:bg-white/10 flex items-center justify-between group transition-all border border-transparent hover:border-white/5"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors">
                                                        <UserIcon size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white group-hover:text-primary transition-colors">{user.name}</p>
                                                        <p className="text-xs text-muted-foreground font-mono opacity-60">@{user._id.slice(-6)}</p>
                                                    </div>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary">
                                                    <Check size={18} />
                                                </div>
                                            </motion.button>
                                        ))}
                                    </AnimatePresence>

                                    {searchQuery.length >= 2 && !isLoading && searchResults.length === 0 && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            <Search size={32} className="mx-auto mb-3 opacity-20" />
                                            <p className="text-sm">No users found matching "{searchQuery}"</p>
                                        </motion.div>
                                    )}

                                    {!searchQuery && selectedUsers.length === 0 && (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
                                                <Share2 size={32} className="text-white/20" />
                                            </div>
                                            <p className="text-muted-foreground text-sm">
                                                Search for people to start collaborating
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-white/5 bg-black/20 shrink-0 backdrop-blur-md relative z-10">
                                {message && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`mb-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === 'success'
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-green-500/10'
                                            : 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-red-500/10'
                                            } shadow-lg`}
                                    >
                                        {message.type === 'success' ? <Check size={16} /> : null}
                                        {message.text}
                                    </motion.div>
                                )}

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <NeonButton
                                        onClick={handleShare}
                                        disabled={isSharing || selectedUsers.length === 0}
                                        className={`min-w-[120px] ${selectedUsers.length === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                    >
                                        {isSharing ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Sharing...</span>
                                            </div>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Share2 size={16} />
                                                Share {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                                            </span>
                                        )}
                                    </NeonButton>
                                </div>
                            </div>

                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
