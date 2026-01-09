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
import { useUserStore } from '@/store/useUserStore';

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

            if (data.token) {
                useUserStore.getState().saveAccount({
                    userId: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    token: data.token,
                    avatar: data.user.profileImage
                });
                toast.success('Email verified! Welcome aboard.');
                window.location.href = '/dashboard';
            } else {
                router.push('/login');
            }
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
                        <div className="text-center mb-10">
                            <motion.div
                                initial={{ scale: 0, rotate: 180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                                className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-linear-to-tl from-primary/20 via-black to-secondary/20 border border-white/20 flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.3)] backdrop-blur-3xl relative"
                            >
                                <div className="absolute inset-0 rounded-3xl bg-linear-to-r from-primary/20 to-secondary/20 animate-pulse pointer-events-none" />
                                {step === 'register' ? <UserPlus size={40} className="text-primary drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]" /> : <Sparkles size={40} className="text-secondary drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />}
                            </motion.div>
                            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-linear-to-r from-white via-secondary/50 to-white mb-3 tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                {step === 'register' ? 'Join Nebula' : 'Verify Identity'}
                            </h1>
                            <p className="text-muted-foreground/80 font-medium text-sm max-w-[280px] mx-auto leading-relaxed">
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
                                        className="w-full mt-4 h-12 text-base font-bold tracking-wide shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                                        disabled={loading}
                                        variant="primary"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                            <>Create Account <ArrowRight size={20} className="ml-2" /></>
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
                                            <div key={index} className="relative group perspective-1000">
                                                <div className="absolute inset-0 bg-secondary/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                                                <input
                                                    id={`otp-${index}`}
                                                    type="text"
                                                    maxLength={1}
                                                    value={digit}
                                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                                    className="w-12 h-16 text-center text-2xl font-black bg-black/60 border border-white/20 rounded-xl text-white focus:outline-none focus:border-secondary focus:bg-black/80 transition-all relative z-10 shadow-[inner_0_0_10px_rgba(0,0,0,0.5)] placeholder:text-white/10"
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
