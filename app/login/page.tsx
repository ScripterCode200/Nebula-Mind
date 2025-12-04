'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { toast } from 'sonner';
import Link from 'next/link';
import AuthBackground from '@/components/auth/AuthBackground';
import AuthInput from '@/components/auth/AuthInput';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
    const [loading, setLoading] = useState(false);
    const [otpToken, setOtpToken] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                if (data.requiresOtp) {
                    setStep('otp');
                    setOtpToken(data.otpToken);
                    toast.success('OTP sent to your email');
                } else {
                    toast.success('Welcome back!');
                    window.location.href = '/dashboard';
                }
            } else {
                toast.error(data.error || 'Login failed');
            }
        } catch (error) {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, otpToken })
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error(`Server returned ${res.status} ${res.statusText}`);
            }

            if (res.ok) {
                toast.success('Welcome back!');
                window.location.href = '/dashboard';
            } else {
                toast.error(data.error || 'Verification failed');
            }
        } catch (error: any) {
            console.error('Login Error:', error);
            toast.error(error.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthBackground>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <GlassCard className="p-8 md:p-10 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden group">


                    <div className="relative z-10">
                        <div className="text-center mb-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.2)]"
                            >
                                {step === 'credentials' ? <KeyRound size={32} className="text-primary" /> : <ShieldCheck size={32} className="text-secondary" />}
                            </motion.div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-2 tracking-tight">
                                {step === 'credentials' ? 'Welcome Back' : 'Security Check'}
                            </h1>
                            <p className="text-muted text-sm">
                                {step === 'credentials' ? 'Enter your credentials to access the nebula.' : `We've sent a code to ${email}`}
                            </p>
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 'credentials' ? (
                                <motion.form
                                    key="credentials"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onSubmit={handleLogin}
                                    className="space-y-5"
                                >
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

                                    <div className="flex justify-end">
                                        <Link href="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors hover:underline">
                                            Forgot Password?
                                        </Link>
                                    </div>

                                    <NeonButton type="submit" className="w-full mt-2" isLoading={loading} variant="primary">
                                        Initiate Login <ArrowRight size={18} className="ml-2" />
                                    </NeonButton>
                                </motion.form>
                            ) : (
                                <motion.form
                                    key="otp"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleVerifyOtp}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted ml-1 uppercase tracking-wider text-center block">Authentication Code</label>
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-secondary/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                                            <input
                                                type="text"
                                                required
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-center text-3xl tracking-[0.5em] font-mono text-secondary focus:outline-none focus:border-secondary/50 focus:bg-black/60 transition-all relative z-10 placeholder:text-muted/10"
                                                placeholder="000000"
                                                maxLength={6}
                                                autoFocus
                                            />
                                            {/* Style for OTP input autofill */}
                                            <style jsx>{`
                                                input:-webkit-autofill,
                                                input:-webkit-autofill:hover, 
                                                input:-webkit-autofill:focus, 
                                                input:-webkit-autofill:active {
                                                    -webkit-box-shadow: 0 0 0 30px #0a0a0a inset !important;
                                                    -webkit-text-fill-color: #7000FF !important;
                                                    transition: background-color 5000s ease-in-out 0s;
                                                }
                                            `}</style>
                                        </div>
                                    </div>

                                    <NeonButton type="submit" className="w-full" isLoading={loading} variant="secondary">
                                        Verify Access <ArrowRight size={18} className="ml-2" />
                                    </NeonButton>

                                    <button
                                        type="button"
                                        onClick={() => setStep('credentials')}
                                        className="w-full text-sm text-muted hover:text-white transition-colors flex items-center justify-center gap-2"
                                    >
                                        ← Return to Login
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>

                        <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm text-muted">
                            New to the platform?{' '}
                            <Link href="/signup" className="text-primary hover:text-primary/80 transition-colors font-medium hover:underline">
                                Create Account
                            </Link>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>
        </AuthBackground>
    );
}
