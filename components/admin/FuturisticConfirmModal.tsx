import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, CheckCircle, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FuturisticConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'success' | 'info';
    actionLabel?: string;
}

export default function FuturisticConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'warning',
    actionLabel = 'Confirm'
}: FuturisticConfirmModalProps) {
    if (!isOpen) return null;

    const colors = {
        danger: 'red',
        warning: 'yellow',
        success: 'green',
        info: 'cyan'
    };

    const color = colors[type];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Window */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className={cn(
                            "relative w-full max-w-md bg-black/90 border-2 rounded-xl overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]",
                            `border-${color}-500/50 shadow-[0_0_30px_-5px_var(--shadow-color)]`
                        )}
                        style={{ '--shadow-color': `var(--${color}-500)` } as any}
                    >
                        {/* Decorative scanning line */}
                        <div className={cn(
                            "absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-current to-transparent opacity-50",
                            `text-${color}-500`
                        )} />

                        <div className="p-6 relative z-10">
                            <div className="flex flex-col items-center text-center space-y-4">
                                {/* Icon Container */}
                                <div className={cn(
                                    "w-16 h-16 rounded-full flex items-center justify-center border-2 mb-2",
                                    `border-${color}-500/30 bg-${color}-500/10 text-${color}-500`
                                )}>
                                    {type === 'danger' && <ShieldAlert size={32} />}
                                    {type === 'warning' && <AlertTriangle size={32} />}
                                    {type === 'success' && <CheckCircle size={32} />}
                                    {type === 'info' && <Info size={32} />}
                                </div>

                                <motion.h3
                                    className="text-2xl font-bold text-white tracking-wider uppercase font-mono"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    {title}
                                </motion.h3>

                                <motion.p
                                    className="text-gray-400 text-sm leading-relaxed"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    {message}
                                </motion.p>

                                {/* Action Buttons */}
                                <motion.div
                                    className="flex w-full gap-3 mt-6"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-4 py-3 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white transition-all font-mono text-sm uppercase tracking-wider"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            onConfirm();
                                            onClose();
                                        }}
                                        className={cn(
                                            "flex-1 px-4 py-3 rounded-lg font-bold text-black transition-all font-mono text-sm uppercase tracking-wider shadow-[0_0_20px_-5px_currentColor]",
                                            {
                                                'bg-red-500 hover:bg-red-400 text-white': type === 'danger',
                                                'bg-yellow-500 hover:bg-yellow-400': type === 'warning',
                                                'bg-green-500 hover:bg-green-400': type === 'success',
                                                'bg-cyan-500 hover:bg-cyan-400': type === 'info',
                                            }
                                        )}
                                    >
                                        {actionLabel}
                                    </button>
                                </motion.div>
                            </div>
                        </div>

                        {/* Background Grid/Tech Effect */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
