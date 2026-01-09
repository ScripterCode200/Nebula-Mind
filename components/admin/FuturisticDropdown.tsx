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
    className?: string;
}

export default function FuturisticDropdown({ value, options, onChange, className }: FuturisticDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const currentOption = options.find(o => o.value === value) || options[0];

    return (
        <div className={cn("relative z-20", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all bg-black/40 border-white/10 hover:border-white/30 text-white min-w-[120px] justify-between group"
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
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] z-20 ring-1 ring-white/5"
                        >
                            <div className="p-1 space-y-1">
                                {options.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all group/item",
                                            value === option.value
                                                ? "bg-white/10 text-white"
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
