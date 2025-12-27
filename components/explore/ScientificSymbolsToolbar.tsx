'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, History, Grid } from 'lucide-react';

const SYMBOL_CATEGORIES = [
    {
        name: 'Greek',
        symbols: [
            'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'ς', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω',
            'Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', 'Κ', 'Λ', 'Μ', 'Ν', 'Ξ', 'Ο', 'Π', 'Ρ', 'Σ', 'Τ', 'Υ', 'Φ', 'Χ', 'Ψ', 'Ω'
        ]
    },
    {
        name: 'Math',
        symbols: [
            '+', '−', '±', '×', '÷', '=', '≠', '≈', '<', '>', '≤', '≥', '√', '∛', '∜', '∞', '∝', '∀', '∃', '∈', '∉', '∩', '∪', '⊂', '⊃',
            '⊆', '⊇', '∬', '∭', '∮', '∯', '∰', '∂', '∇', 'ℏ', '∑', '∏', '∫', '∆', '≅', '≡', '⊥', '¬', '⊕', '⊗', 'θ'
        ]
    },
    {
        name: 'Scripts',
        symbols: [
            '⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '⁺', '⁻', '⁼', '⁽', '⁾', 'ⁿ',
            '₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉', '₊', '₋', '₌', '₍', '₎', 'ₙ'
        ]
    },
    {
        name: 'Logic/Geo',
        symbols: [
            '∧', '∨', '¬', '⇒', '⇔', '∴', '∵', '⊦', '⊧', '∀', '∃', '∄',
            '∠', '∟', '⊥', '∥', '≃', '≅', '≡', '∽', '∝', '⊿', '□', '△', '○', '◇'
        ]
    },
    {
        name: 'Misc',
        symbols: [
            '⋅', '⋆', '⋄', '∘', '˙', '˚', '˜', '˘', 'ˇ', '˝', '˛', 'ˆ', '¯', 'ℏ', 'Å', '⌀', '⌬',
            '†', '‡', '§', '¶', '©', '®', '™', '°', '′', '″', '‴', '⁗'
        ]
    },
    {
        name: 'Arrows',
        symbols: [
            '→', '←', '↑', '↓', '↔', '↕', '↗', '↘', '↖', '↙', '⇌', '⇒', '⇐', '⇑', '⇓', '⇔', '⇕'
        ]
    }
];

interface ScientificSymbolsToolbarProps {
    onInsert: (symbol: string) => void;
    className?: string;
}

export default function ScientificSymbolsToolbar({ onInsert, className }: ScientificSymbolsToolbarProps) {
    const [activeCategory, setActiveCategory] = useState(SYMBOL_CATEGORIES[0].name);
    const [searchQuery, setSearchQuery] = useState('');
    const [recentSymbols, setRecentSymbols] = useState<string[]>([]);

    const handleInsert = (symbol: string) => {
        onInsert(symbol);
        setRecentSymbols(prev => {
            const filtered = prev.filter(s => s !== symbol);
            return [symbol, ...filtered].slice(0, 10);
        });
    };

    const filteredSymbols = useMemo(() => {
        if (!searchQuery) {
            const symbols = SYMBOL_CATEGORIES.find(c => c.name === activeCategory)?.symbols || [];
            return Array.from(new Set(symbols));
        }
        const query = searchQuery.toLowerCase();
        let all: string[] = [];
        SYMBOL_CATEGORIES.forEach(c => all = [...all, ...c.symbols]);
        return Array.from(new Set(all)).filter(s => s.toLowerCase().includes(query));
    }, [searchQuery, activeCategory]);

    return (
        <div className={cn("bg-black/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-2xl shadow-2xl", className)}>
            {/* Search & Tabs Header */}
            <div className="p-3 border-b border-white/10 space-y-3">
                <div className="relative group">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search symbols..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-1.5 pl-9 pr-8 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white">
                            <X size={12} />
                        </button>
                    )}
                </div>

                {!searchQuery && (
                    <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                        <button
                            onClick={() => setActiveCategory('Recent')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                                activeCategory === 'Recent' ? "bg-primary/20 text-primary border border-primary/20" : "text-muted-foreground hover:text-white hover:bg-white/5"
                            )}
                        >
                            <History size={12} />
                            RECENT
                        </button>
                        {SYMBOL_CATEGORIES.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setActiveCategory(cat.name)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                                    activeCategory === cat.name ? "bg-primary/20 text-primary border border-primary/20" : "text-muted-foreground hover:text-white hover:bg-white/5"
                                )}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Symbols Grid */}
            <div className="p-3 bg-black/20">
                <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-14 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1" data-lenis-prevent>
                    <AnimatePresence mode="popLayout">
                        {(activeCategory === 'Recent' && !searchQuery ? recentSymbols : filteredSymbols).map((symbol) => (
                            <motion.button
                                key={`${searchQuery ? 'search' : activeCategory}-${symbol}`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                whileHover={{ scale: 1.15, zIndex: 10 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleInsert(symbol)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-primary/20 text-lg font-medium text-white transition-all cursor-pointer shadow-sm shadow-black/20"
                                title={symbol}
                            >
                                {symbol}
                            </motion.button>
                        ))}
                        {activeCategory === 'Recent' && recentSymbols.length === 0 && !searchQuery && (
                            <div className="col-span-full py-8 text-center text-xs text-muted-foreground italic">
                                No recent symbols yet
                            </div>
                        )}
                        {filteredSymbols.length === 0 && searchQuery && (
                            <div className="col-span-full py-8 text-center text-xs text-muted-foreground italic">
                                No symbols match "{searchQuery}"
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer Tip */}
            <div className="px-3 py-1.5 bg-black/40 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">STEM Editor Helper</span>
                <div className="flex gap-2">
                    <Grid size={10} className="text-primary/40" />
                </div>
            </div>
        </div>
    );
}
