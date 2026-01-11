import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Shield, Edit, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
    value: string;
    label: string;
    icon?: React.ReactNode;
    color?: string;
}

interface FuturisticDropdownProps {
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    onOpenChange?: (isOpen: boolean) => void;
    className?: string;
}

export default function FuturisticDropdown({ value, options, onChange, onOpenChange, className }: FuturisticDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const currentOption = options.find(o => o.value === value) || options[0];

    const toggleOpen = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        onOpenChange?.(newState);
    };

    const handleClose = () => {
        setIsOpen(false);
        onOpenChange?.(false);
    };

    return (
        <div className={cn("relative z-20", className)}>
            <button
                onClick={toggleOpen}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all bg-black/60 border-white/10 hover:border-white/30 text-white min-w-[120px] justify-between group backdrop-blur-sm"
            >
                <div className="flex items-center gap-2">
                    {currentOption?.icon && (
                        <span className={cn("text-muted-foreground", currentOption.color && `text-${currentOption.color}-400`)}>
                            {currentOption.icon}
                        </span>
                    )}
                    <span className={cn("uppercase tracking-wider", currentOption.color && `text-${currentOption.color}-400`)}>
                        {currentOption?.label}
                    </span>
                </div>
                <ChevronDown
                    size={12}
                    className={cn("text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]"
                            onClick={handleClose}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute top-full left-0 right-0 mt-2 bg-[#050505] border border-white/10 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-50 ring-1 ring-white/10 backdrop-blur-xl"
                        >
                            <div className="p-1.5 space-y-1">
                                {options.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            onChange(option.value);
                                            handleClose();
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all group/item",
                                            value === option.value
                                                ? "bg-white/10 text-white shadow-inner"
                                                : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            {option.icon && (
                                                <span className={cn(
                                                    "transition-colors",
                                                    value === option.value ? `text-${option.color}-400` : "text-muted-foreground group-hover/item:text-white"
                                                )}>
                                                    {option.icon}
                                                </span>
                                            )}
                                            <span className="uppercase tracking-wider">{option.label}</span>
                                        </div>
                                        {value === option.value && (
                                            <Check size={12} className="text-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
