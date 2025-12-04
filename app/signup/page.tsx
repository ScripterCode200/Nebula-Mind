'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle, Eye, EyeOff, Sparkles, UserPlus } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { toast } from 'sonner';
import AuthBackground from '@/components/auth/AuthBackground';
import AuthInput from '@/components/auth/AuthInput';

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState<'register' | 'verify'>('register');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Register Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    // OTP Form State
    const [otp, setOtp] = useState(['', '', '', '', '', '']);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            if (data.requiresVerification) {
                setEmail(formData.email);
                setStep('verify');
                toast.success('Verification code sent to your email');
            } else {
                toast.success('Account created successfully');
                router.push('/login');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const otpCode = otp.join('');

        try {
            const res = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otpCode }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            toast.success('Email verified successfully!');
            router.push('/login');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) return; // Only allow 1 char
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    return (
        <AuthBackground>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <GlassCard className="w-full max-w-md p-8 md:p-10 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden group">


                    <div className="relative z-10">
                        <div className="text-center mb-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.2)]"
                            >
                                {step === 'register' ? <UserPlus size={32} className="text-primary" /> : <Sparkles size={32} className="text-secondary" />}
                            </motion.div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-2 tracking-tight">
                                {step === 'register' ? 'Join Nebula' : 'Verify Identity'}
                            </h1>
                            <p className="text-muted text-sm">
                                {step === 'register'
                                    ? 'Begin your journey into advanced learning.'
                                    : `Enter the code sent to ${email}`}
                            </p>
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 'register' ? (
                                <motion.form
                                    key="register"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onSubmit={handleRegister}
                                    className="space-y-5"
                                >
                                    <AuthInput
                                        label="Full Name"
                                        icon={User}
                                        type="text"
                                        placeholder="John Doe"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />

                                    <AuthInput
                                        label="Email Address"
                                        icon={Mail}
                                        type="email"
                                        placeholder="you@example.com"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />

                                    <AuthInput
                                        label="Password"
                                        icon={Lock}
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />

                                    <NeonButton
                                        type="submit"
                                        className="w-full mt-4"
                                        disabled={loading}
                                        variant="primary"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                            <>Create Account <ArrowRight size={18} className="ml-2" /></>
                                        )}
                                    </NeonButton>
                                </motion.form>
                            ) : (
                                <motion.form
                                    key="verify"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleVerify}
                                    className="space-y-6"
                                >
                                    <div className="flex justify-center gap-2">
                                        {otp.map((digit, index) => (
                                            <div key={index} className="relative group">
                                                <div className="absolute inset-0 bg-secondary/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                                                <input
                                                    id={`otp-${index}`}
                                                    type="text"
                                                    maxLength={1}
                                                    value={digit}
                                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                                    className="w-12 h-14 text-center text-xl font-bold bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-secondary/50 focus:bg-black/60 transition-all relative z-10"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <NeonButton
                                        type="submit"
                                        className="w-full"
                                        disabled={loading}
                                        variant="secondary"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                            <>Verify Email <CheckCircle size={18} className="ml-2" /></>
                                        )}
                                    </NeonButton>

                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={() => setStep('register')}
                                            className="text-xs text-muted hover:text-primary transition-colors"
                                        >
                                            Change email address
                                        </button>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>

                        <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm text-muted">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Log in
                            </Link>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>
        </AuthBackground>
    );
}
