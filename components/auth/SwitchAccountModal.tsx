'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Plus, LogOut, Loader2, ArrowRight, Mail, Lock } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { toast } from 'sonner';
import AuthInput from '@/components/auth/AuthInput';
import NeonButton from '@/components/ui/NeonButton';

interface SwitchAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SwitchAccountModal({ isOpen, onClose }: SwitchAccountModalProps) {
    const { user, savedAccounts, switchAccount, saveAccount, removeAccount, logout } = useUserStore();
    const [view, setView] = useState<'list' | 'add_email' | 'add_otp'>('list');
    const [isLoading, setIsLoading] = useState(false);

    // Add Account State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [otpToken, setOtpToken] = useState('');

    const handleSwitch = async (token: string) => {
        setIsLoading(true);
        await switchAccount(token);
        // Page reloads in switchAccount, but if not:
        setIsLoading(false);
        onClose();
    };

    const handleLoginInitiate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                if (data.requiresOtp) {
                    setOtpToken(data.otpToken);
                    setView('add_otp');
                    toast.success('OTP sent to your email');
                } else {
                    // Should not happen with current flow, but if purely password based:
                    // We need the token usually.
                    toast.error('Unexpected login flow');
                }
            } else {
                toast.error(data.error || 'Login failed');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/login/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, otpToken })
            });
            const data = await res.json();

            if (res.ok) {
                // Save new account
                if (data.token) {
                    saveAccount({
                        userId: data.user.id,
                        name: data.user.name,
                        email: data.user.email,
                        token: data.token,
                        avatar: data.user.profileImage
                    });
                }
                toast.success(`Switched to ${data.user.name}`);
                window.location.reload(); // Reload to activate new session
            } else {
                toast.error(data.error || 'Verification failed');
            }
        } catch (error) {
            toast.error('Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                        <h2 className="text-lg font-semibold text-white">
                            {view === 'list' ? 'Switch Account' : 'Add Account'}
                        </h2>
                        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-muted hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6">
                        {view === 'list' ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Your Accounts</p>

                                    {savedAccounts.map((account) => {
                                        const isCurrent = account.userId === user?._id;
                                        return (
                                            <div
                                                key={account.userId}
                                                className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${isCurrent
                                                    ? 'bg-primary/10 border-primary/20'
                                                    : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10 cursor-pointer'
                                                    }`}
                                                onClick={() => !isCurrent && handleSwitch(account.token)}
                                            >
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${isCurrent ? 'bg-primary/20 text-primary' : 'bg-white/10 text-muted-foreground'
                                                    }`}>
                                                    {account.avatar ? (
                                                        <img src={account.avatar} alt={account.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="font-bold text-sm">
                                                            {account.name?.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium truncate ${isCurrent ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                                        {account.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate">{account.email}</p>
                                                </div>
                                                {isCurrent && (
                                                    <div className="px-2 py-1 bg-primary/20 rounded text-[10px] font-bold text-primary">
                                                        ACTIVE
                                                    </div>
                                                )}
                                                {!isCurrent && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeAccount(account.userId);
                                                        }}
                                                        className="p-2 text-muted-foreground hover:text-red-400 hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="h-px bg-white/5 my-4" />

                                <button
                                    onClick={() => setView('add_email')}
                                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 hover:border-primary/50 hover:bg-primary/5 text-muted hover:text-primary transition-all group"
                                >
                                    <div className="p-1 rounded-full bg-white/10 group-hover:bg-primary/20 transition-colors">
                                        <Plus size={16} />
                                    </div>
                                    <span className="text-sm font-medium">Add another account</span>
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={view === 'add_email' ? handleLoginInitiate : handleVerifyOtp} className="space-y-4">
                                {view === 'add_email' && (
                                    <>
                                        <AuthInput
                                            label="Email Identity"
                                            icon={Mail}
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="commander@nebula.ai"
                                        />
                                        <AuthInput
                                            label="Passcode"
                                            icon={Lock}
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                        />
                                        <div className="flex justify-between items-center pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setView('list')}
                                                className="text-sm text-muted hover:text-white"
                                            >
                                                Cancel
                                            </button>
                                            <NeonButton type="submit" isLoading={isLoading} className="px-6">
                                                Next <ArrowRight size={16} className="ml-2" />
                                            </NeonButton>
                                        </div>
                                    </>
                                )}

                                {view === 'add_otp' && (
                                    <>
                                        <div className="text-center mb-6">
                                            <p className="text-muted text-sm">Enter the code sent to <span className="text-white">{email}</span></p>
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                required
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono text-secondary focus:outline-none focus:border-secondary/50 focus:bg-black/60 transition-all"
                                                placeholder="000000"
                                                maxLength={6}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="flex justify-between items-center pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setView('add_email')}
                                                className="text-sm text-muted hover:text-white"
                                            >
                                                Back
                                            </button>
                                            <NeonButton type="submit" isLoading={isLoading} className="px-6" variant="secondary">
                                                Verify & Switch
                                            </NeonButton>
                                        </div>
                                    </>
                                )}
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
