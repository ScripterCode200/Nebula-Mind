'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ArrowRight, ShieldAlert, CheckCircle } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import { toast } from 'sonner';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const [isChecking, setIsChecking] = useState(true);
    const [isAlphaMode, setIsAlphaMode] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Auth State
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkMode();
    }, []);

    const checkMode = async () => {
        try {
            const res = await fetch('/api/settings/alpha-mode');
            if (!res.ok) {
                console.warn('Failed to check alpha mode');
                setIsAuthenticated(true);
                return;
            }
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await res.json();
                setIsAlphaMode(data.alphaMode);

                // If not alpha mode, or if already authenticated in session (mocked here by localStorage for simplicity)
                if (!data.alphaMode || localStorage.getItem('alpha_auth') === 'true') {
                    setIsAuthenticated(true);
                    if (!data.alphaMode && !localStorage.getItem('alpha_auth')) {
                        // Log normal login once per session if not already logged
                        logNormalLogin();
                    }
                }
            } else {
                console.warn('Non-JSON response for alpha mode check');
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error('Failed to check alpha mode', error);
            // Default to open if check fails? Or closed? Open for now to avoid lockout on error.
            setIsAuthenticated(true);
        } finally {
            setIsChecking(false);
        }
    };

    const logNormalLogin = async () => {
        try {
            await fetch('/api/auth/log-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'anonymous' }) // Or get from user store if available
            });
            localStorage.setItem('alpha_auth', 'true'); // Mark session as "logged in"
        } catch (e) {
            console.error(e);
        }
    };

    const handleCheckEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/auth/check-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const contentType = res.headers.get('content-type');
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await res.json();
            } else {
                throw new Error('Server error: Invalid response');
            }

            if (res.ok) {
                if (data.requireOtp) {
                    setStep('otp');
                    toast.success('Access Code sent to your email');
                } else {
                    // Allowed without OTP? (Shouldn't happen based on requirements, but safe fallback)
                    setIsAuthenticated(true);
                    localStorage.setItem('alpha_auth', 'true');
                }
            } else {
                toast.error(data.error || 'Access Restricted');
            }
        } catch (error) {
            toast.error('Failed to verify email');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });

            if (res.ok) {
                setIsAuthenticated(true);
                localStorage.setItem('alpha_auth', 'true');
                toast.success('Welcome to Alpha Access');
            } else {
                toast.error('Invalid Access Code');
            }
        } catch (error) {
            toast.error('Verification failed');
        } finally {
            setLoading(false);
        }
    };

    if (isChecking) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated && isAlphaMode) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md relative z-10"
                >
                    <div className="glass-panel p-8 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                <Lock size={32} className="text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Alpha Access Only</h1>
                            <p className="text-muted-foreground">This environment is restricted to authorized testers.</p>
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 'email' ? (
                                <motion.form
                                    key="email"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleCheckEmail}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                                                placeholder="tester@example.com"
                                            />
                                        </div>
                                    </div>
                                    <NeonButton type="submit" className="w-full" isLoading={loading}>
                                        Verify Access <ArrowRight size={18} />
                                    </NeonButton>
                                </motion.form>
                            ) : (
                                <motion.form
                                    key="otp"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleVerifyOtp}
                                    className="space-y-4"
                                >
                                    <div className="text-center mb-4">
                                        <div className="text-sm text-muted-foreground">Code sent to</div>
                                        <div className="font-medium text-white">{email}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">Access Code</label>
                                        <div className="relative">
                                            <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                            <input
                                                type="text"
                                                required
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors tracking-widest text-center text-lg font-mono"
                                                placeholder="000000"
                                                maxLength={6}
                                            />
                                        </div>
                                    </div>
                                    <NeonButton type="submit" className="w-full" isLoading={loading}>
                                        Enter <CheckCircle size={18} />
                                    </NeonButton>
                                    <button
                                        type="button"
                                        onClick={() => setStep('email')}
                                        className="w-full text-xs text-muted-foreground hover:text-white mt-4"
                                    >
                                        Use different email
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        );
    }

    return <>{children}</>;
}
