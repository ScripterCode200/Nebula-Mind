
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X, Power, Wifi, ShieldCheck, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import NeonButton from '@/components/ui/NeonButton';

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
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
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md perspective-1000"
                    >
                        {/* Outer Glow Halo */}
                        <div className="absolute -inset-4 bg-cyan-500/20 blur-[60px] rounded-full opacity-50 pointer-events-none" />

                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A] shadow-[0_0_40px_rgba(6,182,212,0.15)]">
                            {/* Decorative Background Patterns */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-size-[20px_20px] pointer-events-none" />

                            {/* Header Section */}
                            <div className="relative z-10 p-6 border-b border-white/5 bg-linear-to-b from-cyan-500/5 to-transparent flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                                        <Power size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white tracking-tight">End Session</h2>
                                        <p className="text-[10px] text-cyan-500/60 font-mono uppercase tracking-widest">Confirm Disconnect</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Body Section */}
                            <div className="relative z-10 p-6 space-y-6">
                                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-1">Unsaved Progress?</h3>
                                        <p className="text-xs text-white/50 leading-relaxed">
                                            Any ongoing tasks or unsaved notes might be lost if you disconnect now. Ensure your data is synced.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs font-mono text-white/30 px-2">
                                    <span className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        SYSTEM ONLINE
                                    </span>
                                    <span>ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                                </div>
                            </div>

                            {/* Footer Section */}
                            <div className="relative z-10 p-6 pt-0 flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 h-10 rounded-lg border border-white/10 bg-white/5 text-white/60 text-xs font-bold hover:bg-white/10 hover:text-white transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <NeonButton
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    variant="primary"
                                    className="flex-1 h-10 text-xs shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
                                >
                                    <LogOut size={14} className="mr-2" /> Disconnect
                                </NeonButton>
                            </div>

                            {/* Bottom Scanning Line */}
                            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-linear-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
