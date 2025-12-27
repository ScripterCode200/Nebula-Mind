'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

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
    title = "Save Changes?",
    description = "This will update your daily goal configurations. Uncompleted goals for today will be regenerated."
}: ConfirmSaveModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
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
                        className="relative w-full max-w-md"
                    >
                        <GlassCard className="p-0 overflow-hidden border-primary/30 shadow-[0_0_50px_rgba(0,240,255,0.15)]">
                            {/* Header */}
                            <div className="relative p-6 bg-primary/10 border-b border-primary/20">
                                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-cyan-500 to-purple-500" />
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-primary/20 text-primary shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{title}</h3>
                                        <p className="text-primary/80 text-sm">Confirmation Required</p>
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
                            <div className="p-6">
                                <div className="text-sm text-gray-300 leading-relaxed">
                                    {description}
                                    <br />
                                    <span className="text-primary/70 text-xs mt-3 block font-mono bg-primary/5 p-2 rounded border border-primary/10">
                                        * Existing completed goals will be preserved.
                                    </span>
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
                                    className="flex-1 px-4 py-3 rounded-xl font-bold bg-primary hover:bg-primary/80 text-black shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Check size={18} className="group-hover:scale-110 transition-transform" />
                                    Confirm Save
                                </button>
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
