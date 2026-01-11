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

const SYMBOL_METADATA: Record<string, string[]> = {
    // Greek Lower
    'α': ['alpha', 'greek', 'a'],
    'β': ['beta', 'greek', 'b'],
    'γ': ['gamma', 'greek', 'g'],
    'δ': ['delta', 'greek', 'd'],
    'ε': ['epsilon', 'greek', 'e'],
    'ζ': ['zeta', 'greek', 'z'],
    'η': ['eta', 'greek', 'h'],
    'θ': ['theta', 'greek', 'th', 'angle'],
    'ι': ['iota', 'greek', 'i'],
    'κ': ['kappa', 'greek', 'k'],
    'λ': ['lambda', 'greek', 'l'],
    'μ': ['mu', 'micro', 'greek', 'm'],
    'ν': ['nu', 'greek', 'n'],
    'ξ': ['xi', 'greek', 'x'],
    'ο': ['omicron', 'greek', 'o'],
    'π': ['pi', 'peak', 'greek', 'p'],
    'ρ': ['rho', 'greek', 'r'],
    'σ': ['sigma', 'greek', 's'],
    'ς': ['sigma', 'greek', 's', 'tail'],
    'τ': ['tau', 'greek', 't'],
    'υ': ['upsilon', 'greek', 'u'],
    'φ': ['phi', 'greek', 'f'],
    'χ': ['chi', 'greek', 'x', 'cross'],
    'ψ': ['psi', 'greek', 'ps'],
    'ω': ['omega', 'greek', 'w'],
    // Greek Capital
    'Α': ['alpha', 'greek', 'a', 'capital'],
    'Β': ['beta', 'greek', 'b', 'capital'],
    'Γ': ['gamma', 'greek', 'g', 'capital'],
    'Δ': ['delta', 'triangle', 'greek', 'd', 'capital'],
    'Ε': ['epsilon', 'greek', 'e', 'capital'],
    'Ζ': ['zeta', 'greek', 'z', 'capital'],
    'Η': ['eta', 'greek', 'h', 'capital'],
    'Θ': ['theta', 'greek', 'th', 'capital'],
    'Ι': ['iota', 'greek', 'i', 'capital'],
    'Κ': ['kappa', 'greek', 'k', 'capital'],
    'Λ': ['lambda', 'greek', 'l', 'capital'],
    'Μ': ['mu', 'greek', 'm', 'capital'],
    'Ν': ['nu', 'greek', 'n', 'capital'],
    'Ξ': ['xi', 'greek', 'x', 'capital'],
    'Ο': ['omicron', 'greek', 'o', 'capital'],
    'Π': ['pi', 'product', 'greek', 'p', 'capital'],
    'Ρ': ['rho', 'greek', 'r', 'capital'],
    'Σ': ['sigma', 'sum', 'summation', 'greek', 's', 'capital'],
    'Τ': ['tau', 'greek', 't', 'capital'],
    'Υ': ['upsilon', 'greek', 'u', 'capital'],
    'Φ': ['phi', 'greek', 'f', 'capital'],
    'Χ': ['chi', 'greek', 'x', 'capital'],
    'Ψ': ['psi', 'greek', 'ps', 'capital'],
    'Ω': ['omega', 'ohm', 'greek', 'w', 'capital'],
    // Math Operators
    '+': ['plus', 'add', 'positive', 'sum'],
    '−': ['minus', 'subtract', 'negative', 'dash'],
    '±': ['plus minus', 'positive negative', 'tolerance'],
    '×': ['times', 'multiplication', 'multiply', 'cross'],
    '÷': ['divide', 'division'],
    '=': ['equal', 'same', 'equation'],
    '≠': ['not equal', 'different'],
    '≈': ['approx', 'approximately', 'similar', 'estimation'],
    '<': ['less than', 'smaller'],
    '>': ['greater than', 'bigger'],
    '≤': ['less than equal', 'smaller equal'],
    '≥': ['greater than equal', 'bigger equal', 'at least'],
    '√': ['square root', 'root', 'sqrt'],
    '∛': ['cube root', '3rd root'],
    '∜': ['fourth root', '4th root'],
    '∞': ['infinity', 'forever', 'endless'],
    '∝': ['proportional', 'varies as'],
    '∀': ['for all', 'universal quantifier'],
    '∃': ['exists', 'there exists', 'existential quantifier'],
    '∄': ['not exist', 'not exists'],
    '∈': ['element of', 'belongs to', 'in'],
    '∉': ['not element of', 'not in'],
    '∩': ['intersection', 'cap', 'and'],
    '∪': ['union', 'cup', 'or'],
    '⊂': ['subset', 'contained in'],
    '⊃': ['superset', 'contains'],
    '⊆': ['subset equal'],
    '⊇': ['superset equal'],
    '∬': ['double integral'],
    '∭': ['triple integral'],
    '∮': ['contour integral', 'line integral'],
    '∯': ['surface integral'],
    '∰': ['volume integral'],
    '∂': ['partial', 'derivative', 'd'],
    '∇': ['nabla', 'gradient', 'del', 'vector derivative'],
    'ℏ': ['h bar', 'planck constant', 'reduced planck', 'quantum', 'hbar'],
    'Å': ['angstrom', 'units', 'length', 'swedish a'],
    '⌀': ['diameter', 'circle cross', 'null'],
    '⌬': ['benzene', 'ring', 'hexagon', 'chemistry', 'aromatic'],
    '°': ['degree', 'temperature', 'angle', 'units'],
    '→': ['arrow', 'right arrow', 'implies', 'to', 'then', 'forward'],
    '←': ['arrow', 'left arrow', 'from', 'back', 'previous'],
    '↑': ['arrow', 'up arrow', 'increase', 'top'],
    '↓': ['arrow', 'down arrow', 'decrease', 'bottom'],
    '↔': ['arrow', 'left right arrow', 'horizontal', 'range'],
    '↕': ['arrow', 'up down arrow', 'vertical', 'height'],
    '↗': ['arrow', 'up right', 'northeast', 'increase'],
    '↘': ['arrow', 'down right', 'southeast', 'decrease'],
    '↖': ['arrow', 'up left', 'northwest'],
    '↙': ['arrow', 'down left', 'southwest'],
    '⇌': ['equilibrium', 'reversible', 'reaction', 'chemistry'],
    '℅': ['care of', 'address'],
    'ℓ': ['liter', 'script l', 'units'],
    '№': ['number sign', 'numero'],
    '™': ['trademark', 'tm', 'brand'],
    '©': ['copyright', 'legal'],
    '®': ['registered', 'brand'],
    '§': ['section', 'legal', 'clause'],
    '¶': ['paragraph', 'legal'],
    '†': ['dagger', 'obelisk', 'footnote'],
    '‡': ['double dagger', 'footnote'],
    '′': ['prime', 'minutes', 'feet', 'derivative'],
    '″': ['double prime', 'seconds', 'inches'],
    '‴': ['triple prime'],
    '⁗': ['quadruple prime'],
    '∆': ['delta', 'triangle', 'difference', 'change', 'increment', 'laplacian'],
    '∑': ['sum', 'summation', 'sigma', 'total', 'add'],
    '∏': ['product', 'pi', 'multiply'],
    '∫': ['integral', 'integrate', 'calculus', 'area', 'antiderivative'],
};

// Lightweight fuzzy match helper
function fuzzyMatch(query: string, target: string): boolean {
    if (!query) return true;
    const q = query.toLowerCase();
    const t = target.toLowerCase();

    // Direct inclusion
    if (t.includes(q)) return true;

    // Typos: check if at least 80% of query characters are in target in order, 
    // or if distance is very small (for short words)
    if (q.length < 3) return t.includes(q);

    let matchCount = 0;
    let targetIdx = 0;
    for (let i = 0; i < q.length; i++) {
        const foundIdx = t.indexOf(q[i], targetIdx);
        if (foundIdx !== -1) {
            matchCount++;
            targetIdx = foundIdx + 1;
        }
    }

    // Allow 1 typo for words length 4-6, 2 for 7+
    const maxErrors = q.length > 6 ? 2 : (q.length > 3 ? 1 : 0);
    return matchCount >= q.length - maxErrors;
}

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

        const uniqueSymbols = Array.from(new Set(all));

        return uniqueSymbols.filter(s => {
            // 1. Exact match
            if (s === searchQuery) return true;

            // 2. Character match (simple)
            if (s.toLowerCase().includes(query)) return true;

            // 3. Metadata Keywords match (fuzzy)
            const tags = SYMBOL_METADATA[s] || [];
            return tags.some(tag => fuzzyMatch(query, tag));
        });
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
