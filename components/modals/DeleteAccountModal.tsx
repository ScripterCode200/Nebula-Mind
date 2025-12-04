'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Trash2, ShieldAlert } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function DeleteAccountModal({ isOpen, onClose, onConfirm }: DeleteAccountModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg"
                    >
                        <GlassCard className="p-0 overflow-hidden border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                            {/* Header */}
                            <div className="relative p-6 bg-red-500/10 border-b border-red-500/20">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                                        <ShieldAlert size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Delete Account</h3>
                                        <p className="text-red-400 text-sm">This action is serious.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-white transition-colors rounded-lg hover:bg-white/5"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-4">
                                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                                    <div className="text-sm text-gray-300 leading-relaxed">
                                        You are about to schedule your account for deletion.
                                        <br /><br />
                                        <span className="text-white font-bold">What happens next?</span>
                                        <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground ml-2">
                                            <li>Your account will be deactivated immediately.</li>
                                            <li>You have a <span className="text-primary">7-day grace period</span> to cancel.</li>
                                            <li>After 7 days, all your data (notebooks, notes, history) will be <span className="text-red-400 font-bold">permanently wiped</span>.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 pt-2 flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 rounded-xl font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                                    Schedule Deletion
                                </button>
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
