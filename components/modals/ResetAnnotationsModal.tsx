'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Eraser } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

interface ResetAnnotationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function ResetAnnotationsModal({ isOpen, onClose, onConfirm }: ResetAnnotationsModalProps) {
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
                        className="relative w-full max-w-md"
                    >
                        <GlassCard className="p-0 overflow-hidden border-orange-500/30 shadow-[0_0_50px_rgba(249,115,22,0.2)]">
                            {/* Header */}
                            <div className="relative p-6 bg-orange-500/10 border-b border-orange-500/20">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-orange-500/20 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                                        <Eraser size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Clear Page?</h3>
                                        <p className="text-orange-400 text-sm">Remove all annotations</p>
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
                                    Are you sure you want to clear all drawings and highlights from this page?
                                    <br />
                                    <span className="text-orange-400/80 text-xs mt-2 block">This action cannot be undone.</span>
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
                                    className="flex-1 px-4 py-3 rounded-xl font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                                    Clear All
                                </button>
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
