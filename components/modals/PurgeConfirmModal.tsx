'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Trash2, Cpu, Zap, ShieldAlert } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

interface PurgeConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    fileName: string;
}

export default function PurgeConfirmModal({ isOpen, onClose, onConfirm, fileName }: PurgeConfirmModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
                    {/* Backdrop with extreme blur and dark tint */}
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
                        {/* Outer Glow Halo */}
                        <div className="absolute -inset-4 bg-red-600/10 blur-[80px] rounded-full animate-pulse" />

                        <div className="relative overflow-hidden rounded-2xl border-2 border-red-500/20 bg-[#050505] shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                            {/* Technical Background Mask */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.03)_1px,transparent_1px)] bg-size-[20px_20px] pointer-events-none" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.05),transparent_70%)] pointer-events-none" />

                            {/* Corner Brackets */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-500 z-30" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-500 z-30" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-500 z-30" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-500 z-30" />

                            {/* Scanning Line */}
                            <motion.div
                                className="absolute left-0 right-0 h-1 bg-red-500/40 blur-sm z-30"
                                animate={{ top: ["-10%", "110%"] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            />

                            {/* Header Section */}
                            <div className="relative z-10 p-8 border-b border-red-500/20 bg-linear-to-b from-red-500/10 to-transparent">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                                            <ShieldAlert size={28} className="text-red-500 animate-pulse" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">Terminal Purge</h2>
                                            <p className="text-[10px] font-mono font-bold text-red-500 mt-1 uppercase tracking-widest">Awaiting Authorization...</p>
                                        </div>
                                    </div>
                                    <div className="text-right font-mono text-[9px] text-red-500/50 space-y-0.5">
                                        <div className="animate-pulse">S_STATUS: ARMED</div>
                                        <div>P_LEVEL: CRITICAL</div>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="absolute top-6 right-6 p-2 rounded-lg bg-white/5 text-white/40 hover:text-white transition-all ring-1 ring-white/10 hover:ring-red-500/50"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Body Section */}
                            <div className="relative z-10 p-10 space-y-8">
                                {/* Technical Warning Box */}
                                <div className="relative p-6 rounded-xl bg-red-950/20 border border-red-500/20 overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <AlertTriangle size={60} />
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1">
                                            <Cpu size={20} className="text-red-500/60" />
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-sm font-bold text-red-100 leading-relaxed tracking-tight">
                                                You are initiating the permanent erasure of this context unit. Recovery is impossible once the sequence is confirmed.
                                            </p>
                                            <div className="flex gap-2">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="h-1 w-8 rounded-full bg-red-500 animate-[pulse_1s_infinite]" style={{ animationDelay: `${i * 0.2}s` }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Target Unit Visualization */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-1">Target Identification</label>
                                    <div className="relative group p-6 rounded-xl bg-white/2 border border-white/5 hover:border-red-500/30 transition-all duration-500">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500" />
                                        <div className="flex items-center gap-5">
                                            <div className="p-4 rounded-xl bg-linear-to-br from-red-500/20 to-transparent border border-red-500/20 text-red-500">
                                                <Zap size={24} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[9px] font-mono text-red-500/70 font-bold uppercase tracking-widest">Object_ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                                                    <span className="text-[9px] font-mono text-white/20">TYPE: .PDF_CONTEXT</span>
                                                </div>
                                                <h4 className="text-lg font-bold text-white truncate pr-4">{fileName}</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Section */}
                            <div className="relative z-10 p-8 pt-0 flex gap-4">
                                <button
                                    onClick={onClose}
                                    className="flex-1 h-14 rounded-xl border border-white/10 bg-white/5 text-white/40 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2 group"
                                >
                                    <X size={14} className="group-hover:rotate-90 transition-transform" />
                                    Abort Sequence
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className="flex-[1.5] h-14 rounded-xl bg-red-600 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] hover:bg-red-500 transition-all active:scale-95 flex items-center justify-center gap-2 border border-red-400/30 relative overflow-hidden group/confirm"
                                >
                                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-confirm-hover:translate-x-full transition-transform duration-1000" />
                                    <Trash2 size={16} className="group-confirm-hover:scale-125 transition-transform" />
                                    Execute Purge Protocol
                                </button>
                            </div>

                            {/* Bottom Hazard Stripes */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-[repeating-linear-gradient(45deg,#000,#000_10px,#ff0000_10px,#ff0000_20px)] opacity-30 z-30" />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
