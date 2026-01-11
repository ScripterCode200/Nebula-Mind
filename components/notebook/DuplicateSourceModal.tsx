import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowRight, X } from 'lucide-react';

interface DuplicateSourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToExisting: () => void;
}

const DuplicateSourceModal = ({ isOpen, onClose, onSwitchToExisting }: DuplicateSourceModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-md pointer-events-auto shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-6 pb-2 flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className="p-3 rounded-full bg-amber-500/10 text-amber-500 shrink-0">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">Source Already Exists</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            This YouTube video is already in your notebook. Adding it again would create a duplicate.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-muted-foreground hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Footer/Actions */}
                            <div className="p-6 pt-6 flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        onSwitchToExisting();
                                        onClose();
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                >
                                    Open Existing
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DuplicateSourceModal;
