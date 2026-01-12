import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Trash2, ShieldAlert, Cpu, Zap, Key } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function DeleteAccountModal({ isOpen, onClose, onConfirm }: DeleteAccountModalProps) {
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
                        className="relative w-full max-w-xl perspective-1000"
                    >
                        {/* Outer Glow Halo */}
                        <div className="absolute -inset-4 bg-red-600/10 blur-[80px] rounded-full animate-pulse" />

                        <div className="relative overflow-hidden rounded-2xl border-2 border-red-500/20 bg-[#050505] shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                            {/* Technical Background Mask */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.03)_1px,transparent_1px)] bg-size-[20px_20px] pointer-events-none" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.05),transparent:70%)] pointer-events-none" />

                            {/* Corner Brackets */}
                            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-red-500 z-30" />
                            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-red-500 z-30" />
                            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-red-500 z-30" />
                            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-red-500 z-30" />

                            {/* Scanning Line */}
                            <motion.div
                                className="absolute left-0 right-0 h-1.5 bg-red-500/30 blur-sm z-30"
                                animate={{ top: ["-10%", "110%"] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            />

                            {/* Header Section */}
                            <div className="relative z-10 p-8 border-b border-red-500/20 bg-linear-to-b from-red-500/10 to-transparent">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                                            <ShieldAlert size={32} className="text-red-500 animate-pulse" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">Terminal Deletion</h2>
                                            <p className="text-[10px] font-mono font-bold text-red-500 mt-1 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
                                                Danger Zone Protocol Active
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right font-mono text-[9px] text-red-500/50 space-y-1">
                                        <div className="animate-pulse">S_STATUS: ARMED</div>
                                        <div>P_LEVEL: TERMINAL</div>
                                        <div>NODE_ID: {Math.random().toString(36).substring(7).toUpperCase()}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="absolute top-6 right-6 p-2 rounded-lg bg-white/5 text-white/40 hover:text-white transition-all ring-1 ring-white/10 hover:ring-red-500/50 group"
                                >
                                    <X size={18} className="group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>

                            {/* Body Section */}
                            <div className="relative z-10 p-10 space-y-8">
                                {/* Risk Assessment Box */}
                                <div className="relative p-8 rounded-xl bg-red-950/20 border border-red-500/20 overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <AlertTriangle size={120} />
                                    </div>
                                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 mb-6 flex items-center gap-2">
                                        <Cpu size={14} /> Risk Assessment Report
                                    </h4>
                                    <div className="space-y-6">
                                        <p className="text-sm font-bold text-red-100 leading-relaxed tracking-tight">
                                            Initiating this protocol will result in the total erasure of your cloud identity. All cognitive data, history, and neural links will be severed.
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { icon: Zap, label: "Immediate Deactivation", color: "text-red-400" },
                                                { icon: Key, label: "7-Day Grace Period", color: "text-cyan-400" },
                                                { icon: Trash2, label: "Permanent Data Wipe", color: "text-red-500" },
                                                { icon: ShieldAlert, label: "Irreversible Sequence", color: "text-red-600" }
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-white/5 group/item hover:border-red-500/30 transition-all">
                                                    <item.icon size={16} className={cn(item.color, "group-item-hover:scale-110 transition-transform")} />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">{item.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Security Warning Marquee */}
                                <div className="bg-red-500/5 border-y border-red-500/10 p-2 overflow-hidden whitespace-nowrap">
                                    <motion.p
                                        className="text-[9px] font-mono font-bold text-red-500/60 uppercase tracking-[0.5em]"
                                        animate={{ x: [0, -100, 0] }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    >
                                        WARNING: DATA RECOVERY IMPOSSIBLE AFTER GRACE PERIOD // PROCEED WITH EXTREME CAUTION // SYSTEM ARMED //
                                    </motion.p>
                                </div>
                            </div>

                            {/* Footer Section */}
                            <div className="relative z-10 p-10 pt-0 flex gap-5">
                                <button
                                    onClick={onClose}
                                    className="flex-1 h-16 rounded-xl border border-white/10 bg-white/5 text-white/40 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2 group ring-1 ring-inset ring-transparent hover:ring-white/20"
                                >
                                    Abort Sequence
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className="flex-[1.5] h-16 rounded-xl bg-red-600 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(220,38,38,0.4)] hover:shadow-[0_0_60px_rgba(220,38,38,0.6)] hover:bg-red-500 transition-all active:scale-95 flex items-center justify-center gap-2 border border-red-400/30 relative overflow-hidden group/confirm"
                                >
                                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-confirm-hover:translate-x-full transition-transform duration-1000" />
                                    <Trash2 size={20} className="group-confirm-hover:scale-110 group-confirm-hover:rotate-12 transition-transform" />
                                    Schedule Deletion
                                </button>
                            </div>

                            {/* Bottom Hazard Stripes */}
                            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-[repeating-linear-gradient(45deg,#000,#000_15px,#ff0000_15px,#ff0000_30px)] opacity-40 z-30" />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
