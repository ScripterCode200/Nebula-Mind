
'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, Check, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';

interface Source {
    _id: string;
    type: 'pdf';
    name: string;
    addedAt: string;
}

interface SourceSidebarProps {
    sources: Source[];
    activeSourceId: string | null;
    selectedSourceIds: string[];
    onSourceClick: (id: string) => void;
    onToggledSource: (id: string, checked: boolean) => void;
    onAddSource: (file: File) => Promise<void>;
    isAddingSource: boolean;
}

export default function SourceSidebar({
    sources,
    activeSourceId,
    selectedSourceIds,
    onSourceClick,
    onToggledSource,
    onAddSource,
    isAddingSource
}: SourceSidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [collapsed, setCollapsed] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await onAddSource(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className={`relative h-full flex flex-col border-r border-white/5 bg-[#050505]/95 backdrop-blur-xl transition-all duration-300 z-40 shadow-2xl ${collapsed ? 'w-16' : 'w-72'}`}>
            {/* Header */}
            <div className={`flex items-center h-14 md:h-16 px-4 border-b border-white/5 ${collapsed ? 'justify-center' : 'justify-between'}`}>
                {!collapsed && (
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <FileText size={14} className="text-primary" />
                        Sources
                    </span>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2 custom-scrollbar">
                {sources.map(source => {
                    const isActive = activeSourceId === source._id;
                    const isChecked = selectedSourceIds.includes(source._id);

                    return (
                        <motion.div
                            key={source._id}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`group relative rounded-xl border transition-all duration-200 overflow-hidden ${isActive
                                ? 'bg-primary/5 border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'
                                : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.07]'
                                }`}
                        >
                            {/* Selection Checkbox (Absolute Left) */}
                            {!collapsed && (
                                <div
                                    className="absolute left-0 top-0 bottom-0 w-9 flex items-center justify-center cursor-pointer z-10 hover:bg-white/5 transition-colors border-r border-white/5"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggledSource(source._id, !isChecked);
                                    }}
                                    title={isChecked ? "Remove from AI Context" : "Add to AI Context"}
                                >
                                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${isChecked ? 'bg-primary border-primary text-black scale-100' : 'border-white/30 scale-90 opacity-50 hover:opacity-100'}`}>
                                        {isChecked && <Check size={10} strokeWidth={4} />}
                                    </div>
                                </div>
                            )}

                            {/* Main Click Area */}
                            <div
                                className={`flex items-center gap-3 cursor-pointer ${collapsed ? 'justify-center py-3 px-1' : 'py-3 pl-12 pr-3'}`}
                                onClick={() => onSourceClick(source._id)}
                            >
                                {collapsed && (
                                    <div className={`relative`}>
                                        <div className={`p-2 rounded-lg ${isActive ? 'bg-primary/20 text-primary' : 'bg-white/10 text-muted-foreground'}`}>
                                            <FileText size={18} />
                                        </div>
                                        {isChecked && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-black" />
                                        )}
                                    </div>
                                )}

                                {!collapsed && (
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate leading-tight ${isActive ? 'text-primary' : 'text-gray-200 group-hover:text-white'}`}>
                                            {source.name}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                                            {source.type.toUpperCase()} • <ClientDate date={source.addedAt} />
                                        </p>
                                    </div>
                                )}

                                {/* Active Indicator (Right Edge) */}
                                {isActive && !collapsed && (
                                    <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_10px_var(--primary-color)]" />
                                )}
                            </div>
                        </motion.div>
                    );
                })}

                {/* Empty State */}
                {sources.length === 0 && !collapsed && (
                    <div className="text-center py-8 px-4 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                        <p className="text-xs">No sources added yet.</p>
                    </div>
                )}
            </div>

            {/* Footer / Add Button */}
            <div className="p-4 border-t border-white/5 bg-[#050505]">
                {collapsed ? (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAddingSource}
                        className="w-full flex items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all hover:scale-105 active:scale-95"
                        title="Add Source"
                    >
                        {isAddingSource ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                    </button>
                ) : (
                    <NeonButton
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAddingSource}
                        className="w-full justify-center group"
                        variant="secondary"
                    >
                        {isAddingSource ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} className="group-hover:rotate-90 transition-transform" />}
                        <span className="ml-2">Add New Source</span>
                    </NeonButton>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden"
                />
            </div>
        </div>
    );
}

function ClientDate({ date }: { date: string }) {
    const [mounted, setMounted] = useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <span className="opacity-0">Loading...</span>;

    return <>{new Date(date).toLocaleDateString()}</>;
}
