'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            // Always show success message for security
            setSubmitted(true);
            toast.success('If an account exists, a reset link has been sent.');
        } catch (error) {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <GlassCard className="p-8 border-white/10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-2">
                            Reset Password
                        </h1>
                        <p className="text-muted">
                            Enter your email to receive a reset link
                        </p>
                    </div>

                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted ml-1">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-3 text-muted group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 focus:bg-black/50 transition-all"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <NeonButton type="submit" className="w-full mt-6" isLoading={loading}>
                                Send Reset Link <ArrowRight size={18} />
                            </NeonButton>
                        </form>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                                <Mail className="text-green-400" size={32} />
                            </div>
                            <h3 className="text-xl font-semibold text-white">Check your email</h3>
                            <p className="text-sm text-muted">
                                We've sent a password reset link to <strong>{email}</strong>.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Did not receive the email? Check your spam folder or try again.
                            </p>
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <Link href="/login" className="text-sm text-muted hover:text-white transition-colors flex items-center justify-center gap-2">
                            <ArrowLeft size={16} /> Back to Login
                        </Link>
                    </div>
                </GlassCard>
            </motion.div>
        </main>
    );
}
