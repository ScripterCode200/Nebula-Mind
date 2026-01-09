'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, Check, Loader2, X, ChevronLeft, ChevronRight, Youtube, Upload } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';

interface Source {
    _id: string;
    type: 'pdf' | 'youtube';
    name: string;
    addedAt: string;
    url?: string;
}

interface SourceSidebarProps {
    sources: Source[];
    activeSourceId: string | null;
    selectedSourceIds: string[];
    onSourceClick: (id: string) => void;
    onToggledSource: (id: string) => void;
    onAddSource: (file: File) => void;
    onAddYoutube: (url: string) => Promise<void>;
    isAddingSource?: boolean;
    loadingStep?: string;
    transcribeProgress?: number;
    videoInfo?: { title: string; duration: number } | null;
}

const SourceSidebar = ({
    sources,
    activeSourceId,
    selectedSourceIds,
    onSourceClick,
    onToggledSource,
    onAddSource,
    onAddYoutube,
    isAddingSource = false,
    loadingStep = '',
    transcribeProgress = 0,
    videoInfo = null
}: SourceSidebarProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [collapsed, setCollapsed] = useState(false);
    const [addMode, setAddMode] = useState<'none' | 'upload' | 'youtube'>('none');
    const [youtubeUrl, setYoutubeUrl] = useState('');

    const handleAddYoutube = async () => {
        if (!youtubeUrl) return;
        await onAddYoutube(youtubeUrl);
        setYoutubeUrl('');
        setAddMode('none');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        onAddSource(file);
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
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {sources.map((source) => {
                    const isActive = activeSourceId === source._id;
                    const isChecked = selectedSourceIds.includes(source._id);

                    return (
                        <motion.div
                            key={source._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`group relative rounded-xl transition-all duration-200 ${isActive ? 'bg-primary/10' : 'hover:bg-white/5'}`}
                        >
                            {!collapsed && (
                                <div
                                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-1 cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggledSource(source._id);
                                    }}
                                >
                                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${isChecked ? 'bg-primary border-primary text-black scale-100' : 'border-white/30 scale-90 opacity-50 hover:opacity-100'}`}>
                                        {isChecked && <Check size={10} strokeWidth={4} />}
                                    </div>
                                </div>
                            )}

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

                                {isActive && !collapsed && (
                                    <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_10px_var(--primary-color)]" />
                                )}
                            </div>
                        </motion.div>
                    );
                })}

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
                        onClick={() => setAddMode('upload')}
                        disabled={isAddingSource}
                        className="w-full flex items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all hover:scale-105 active:scale-95"
                        title="Add Source"
                    >
                        {isAddingSource ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                    </button>
                ) : (
                    <div className="space-y-4">
                        {isAddingSource && videoInfo && (
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 animate-in fade-in duration-300">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">Processing</p>
                                        <p className="text-xs font-medium text-primary truncate leading-tight">{videoInfo.title}</p>
                                    </div>
                                    <span className="text-xs font-bold text-glow">{transcribeProgress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-linear-to-r from-primary to-secondary"
                                        animate={{ width: `${transcribeProgress}%` }}
                                        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                                    />
                                </div>
                                <div className="flex justify-between text-[8px] text-muted-foreground uppercase tracking-tighter">
                                    <span>{loadingStep}</span>
                                    <span>~{Math.round(videoInfo.duration / 10)}s est.</span>
                                </div>
                            </div>
                        )}
                        <div className="space-y-3">
                            {addMode === 'none' ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <NeonButton
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isAddingSource}
                                        className="justify-center text-xs px-2"
                                        variant="secondary"
                                    >
                                        <Upload size={14} className="mr-2" />
                                        Upload
                                    </NeonButton>
                                    <NeonButton
                                        onClick={() => setAddMode('youtube')}
                                        disabled={isAddingSource}
                                        className="justify-center text-xs px-2 bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                                        variant="ghost"
                                    >
                                        <Youtube size={14} className="mr-2" />
                                        YouTube
                                    </NeonButton>
                                </div>
                            ) : addMode === 'youtube' ? (
                                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                                            <Youtube size={12} /> YouTube
                                        </span>
                                        <button onClick={() => setAddMode('none')} className="text-muted-foreground hover:text-white"><X size={12} /></button>
                                    </div>
                                    <input
                                        type="url"
                                        value={youtubeUrl}
                                        onChange={(e) => setYoutubeUrl(e.target.value)}
                                        placeholder="Paste video URL..."
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500/50 transition-colors"
                                        autoFocus
                                    />
                                    <NeonButton
                                        onClick={handleAddYoutube}
                                        disabled={!youtubeUrl || isAddingSource}
                                        className="w-full justify-center text-xs"
                                        isLoading={isAddingSource}
                                    >
                                        Add Video
                                    </NeonButton>
                                </div>
                            ) : null}
                        </div>
                    </div>
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
};

export default SourceSidebar;

function ClientDate({ date }: { date: string }) {
    const [mounted, setMounted] = useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <span className="opacity-0">Loading...</span>;
    return <>{new Date(date).toLocaleDateString()}</>;
}
