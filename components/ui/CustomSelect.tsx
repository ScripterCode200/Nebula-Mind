'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[] | string[];
    placeholder?: string;
    className?: string;
    label?: string;
}

export default function CustomSelect({ value, onChange, options, placeholder = "Select...", className, label }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const clickedInsideContainer = containerRef.current?.contains(target);
            const clickedInsideDropdown = dropdownRef.current?.contains(target);

            if (!clickedInsideContainer && !clickedInsideDropdown) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true); // true for capture (handling nested scroll)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen]);

    const updatePosition = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updatePosition();
        }
    }, [isOpen]);

    const normalizeOptions = (opts: Option[] | string[]): Option[] => {
        if (!opts) return [];
        return opts.map(opt => {
            if (typeof opt === 'string') {
                return { value: opt, label: opt };
            }
            return opt;
        });
    };

    const normalizedOptions = normalizeOptions(options);
    const selectedOption = normalizedOptions.find(opt => opt.value === value);

    const DropdownContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        position: 'absolute',
                        top: coords.top,
                        left: coords.left,
                        width: coords.width,
                        zIndex: 9999
                    }}
                    className="bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto backdrop-blur-xl"
                    data-lenis-prevent
                >
                    <div className="p-1">
                        {normalizedOptions.length > 0 ? (
                            normalizedOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors",
                                        value === option.value
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {value === option.value && <Check size={14} />}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-xs text-muted-foreground text-center">No options</div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <div className={cn("relative", className)} ref={containerRef}>
                {label && <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1.5 block">{label}</label>}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all duration-200",
                        isOpen
                            ? "bg-black/60 border-primary/50 text-white shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                            : "bg-black/40 border-white/10 text-muted-foreground hover:bg-white/5 hover:text-white"
                    )}
                >
                    <span className={cn("truncate", selectedOption ? "text-white" : "text-muted-foreground")}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown size={14} className={cn("transition-transform duration-200 ml-2", isOpen ? "rotate-180" : "")} />
                </button>
            </div>
            {typeof document !== 'undefined' && createPortal(DropdownContent, document.body)}
        </>
    );
}
