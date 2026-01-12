'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Sliders, Hash, Zap, BookOpen, MapPin, Search, Users, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import NeonButton from '@/components/ui/NeonButton';

export interface Condition {
    id: string;
    field: string;
    operator: 'equals' | 'gt' | 'lt' | 'contains';
    value: string;
}

interface ConditionBuilderProps {
    onChange: (conditions: Condition[]) => void;
}

export default function ConditionBuilder({ onChange }: ConditionBuilderProps) {
    const [conditions, setConditions] = useState<Condition[]>([
        { id: Math.random().toString(36).substr(2, 9), field: 'level', operator: 'gt', value: '1' }
    ]);

    useEffect(() => {
        onChange(conditions);
    }, [conditions, onChange]);

    const addCondition = () => {
        setConditions([...conditions, {
            id: Math.random().toString(36).substr(2, 9),
            field: 'level',
            operator: 'gt',
            value: ''
        }]);
    };

    const removeCondition = (id: string) => {
        if (conditions.length === 1) return;
        setConditions(conditions.filter(c => c.id !== id));
    };

    const updateCondition = (id: string, key: keyof Condition, val: string) => {
        setConditions(conditions.map(c => c.id === id ? { ...c, [key]: val } : c));
    };

    const fields = [
        { id: 'level', label: 'Neural Level', icon: Zap },
        { id: 'xp', label: 'Total XP', icon: Activity },
        { id: 'streak', label: 'Current Streak', icon: Activity },
        { id: 'university', label: 'University', icon: BookOpen },
        { id: 'major', label: 'Major', icon: BookOpen },
        { id: 'location', label: 'Location', icon: MapPin },
        { id: 'interest', label: 'Interest Tag', icon: Hash },
    ];

    const operators = [
        { id: 'equals', label: 'Is Exactly (=)' },
        { id: 'gt', label: 'Greater Than (>)' },
        { id: 'lt', label: 'Less Than (<)' },
        { id: 'contains', label: 'Contains (Text)' },
    ];

    return (
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-primary to-transparent" />

            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sliders size={16} className="text-primary" /> Logic Gate Builder
                </h3>
                <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-2 py-1 rounded-md border border-white/5">
                    AND Operator
                </span>
            </div>

            <div className="space-y-3">
                <AnimatePresence initial={false}>
                    {conditions.map((condition, index) => (
                        <motion.div
                            key={condition.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-3 bg-black/40 p-1 rounded-xl border border-white/5 group hover:border-white/10 transition-colors"
                        >
                            {/* Connector Line */}
                            <div className="w-8 flex justify-center shrink-0">
                                {index === 0 ? (
                                    <span className="text-[10px] font-black text-primary">IF</span>
                                ) : (
                                    <div className="w-px h-8 bg-white/10" />
                                )}
                            </div>

                            {/* Field Select */}
                            <div className="relative min-w-[140px]">
                                <select
                                    value={condition.field}
                                    onChange={(e) => updateCondition(condition.id, 'field', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-8 text-xs font-bold text-white focus:outline-none focus:border-primary/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                    {fields.map(f => (
                                        <option key={f.id} value={f.id}>{f.label}</option>
                                    ))}
                                </select>
                                <div className="absolute left-3 top-2 pointer-events-none text-muted-foreground">
                                    {(() => {
                                        const Icon = fields.find(f => f.id === condition.field)?.icon || Zap;
                                        return <Icon size={14} />;
                                    })()}
                                </div>
                            </div>

                            {/* Operator Select */}
                            <select
                                value={condition.operator}
                                onChange={(e) => updateCondition(condition.id, 'operator', e.target.value as any)}
                                className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs font-mono text-cyan-400 focus:outline-none focus:border-primary/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors w-32"
                            >
                                {operators.map(op => (
                                    <option key={op.id} value={op.id}>{op.label}</option>
                                ))}
                            </select>

                            {/* Value Input */}
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={condition.value}
                                    onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                                    placeholder="Value..."
                                    className="w-full bg-transparent border-b border-white/10 py-2 px-2 text-sm text-white focus:outline-none focus:border-primary/50 font-mono placeholder:text-muted/20"
                                />
                            </div>

                            {/* Remove Button */}
                            <button
                                onClick={() => removeCondition(condition.id)}
                                disabled={conditions.length === 1}
                                className="p-2 text-muted-foreground hover:text-red-400 disabled:opacity-20 disabled:hover:text-muted-foreground transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <button
                onClick={addCondition}
                type="button"
                className="mt-4 flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/5 w-fit"
            >
                <Plus size={14} />
                ADD CONDITION
            </button>
        </div>
    );
}
