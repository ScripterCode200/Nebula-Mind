import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, Cpu, Zap, ShieldCheck } from 'lucide-react';

interface ConfirmSaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
}

export default function ConfirmSaveModal({
    isOpen,
    onClose,
    onConfirm,
    title = "System Authorization",
    description = "This will update your daily goal configurations. Uncompleted goals for today will be regenerated."
}: ConfirmSaveModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, rotateX: 20 }}
                        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                        exit={{ scale: 0.8, opacity: 0, rotateX: -20 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                        className="relative w-full max-w-lg perspective-1000"
                    >
                        {/* Outer Glow Halo (Cyan) */}
                        <div className="absolute -inset-4 bg-cyan-600/10 blur-[80px] rounded-full animate-pulse" />

                        <div className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/20 bg-[#050505] shadow-[0_0_50px_rgba(6,182,212,0.15)]">
                            {/* Technical Background Mask */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-size-[20px_20px] pointer-events-none" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.05),transparent_70%)] pointer-events-none" />

                            {/* Corner Brackets (Cyan) */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-500 z-30" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-500 z-30" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-500 z-30" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-500 z-30" />

                            {/* Scanning Line (Cyan) */}
                            <motion.div
                                className="absolute left-0 right-0 h-1 bg-cyan-500/40 blur-sm z-30"
                                animate={{ top: ["-10%", "110%"] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            />

                            {/* Header Section */}
                            <div className="relative z-10 p-8 border-b border-cyan-500/20 bg-linear-to-b from-cyan-500/10 to-transparent">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                                            <ShieldCheck size={28} className="text-cyan-500 animate-pulse" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">{title}</h2>
                                            <p className="text-[10px] font-mono font-bold text-cyan-500 mt-1 uppercase tracking-widest">Awaiting Verification...</p>
                                        </div>
                                    </div>
                                    <div className="text-right font-mono text-[9px] text-cyan-500/50 space-y-0.5">
                                        <div className="animate-pulse">S_STATUS: VALIDATED</div>
                                        <div>V_LEVEL: AUTHORIZED</div>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="absolute top-6 right-6 p-2 rounded-lg bg-white/5 text-white/40 hover:text-white transition-all ring-1 ring-white/10 hover:ring-cyan-500/50"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Body Section */}
                            <div className="relative z-10 p-10 space-y-8">
                                {/* Technical Info Box */}
                                <div className="relative p-6 rounded-xl bg-cyan-950/20 border border-cyan-500/20 overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 text-cyan-500">
                                        <ShieldCheck size={60} />
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1">
                                            <Cpu size={20} className="text-cyan-500/60" />
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-sm font-bold text-cyan-100 leading-relaxed tracking-tight">
                                                {description}
                                            </p>
                                            <div className="flex gap-2">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="h-1 w-8 rounded-full bg-cyan-500 animate-[pulse_1.5s_infinite]" style={{ animationDelay: `${i * 0.3}s` }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                                        <Zap size={16} />
                                    </div>
                                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                                        Existing completed modules will be cached and preserved during this synchronization process.
                                    </p>
                                </div>
                            </div>

                            {/* Footer Section */}
                            <div className="relative z-10 p-8 pt-0 flex gap-4">
                                <button
                                    onClick={onClose}
                                    className="flex-1 h-14 rounded-xl border border-white/10 bg-white/5 text-white/40 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className="flex-[1.5] h-14 rounded-xl bg-cyan-500 text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] hover:bg-cyan-400 transition-all active:scale-95 flex items-center justify-center gap-2 group/confirm"
                                >
                                    <Check size={18} className="group-confirm-hover:scale-125 transition-transform" />
                                    Commit Sync Protocol
                                </button>
                            </div>

                            {/* Bottom Accent (Solid Cyan Line) */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-cyan-500/50 z-30" />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
