'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Settings2, Target, GraduationCap, Globe, Clock, FileText, BookOpen, Zap, Users, Plus, Youtube, Check, Loader2, Upload, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NeonButton from '@/components/ui/NeonButton';
import GlassCard from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TEACHING_METHODS = [
    {
        id: 'Socratic',
        name: 'Socratic',
        description: 'Guided discovery through constant questioning. Focuses on critical thinking.',
        icon: <Users size={18} />,
        accent: 'text-blue-400',
        bg: 'bg-blue-400/10'
    },
    {
        id: 'Storyteller',
        name: 'Storyteller',
        description: 'Uses narratives and analogies to make complex topics memorable.',
        icon: <BookOpen size={18} />,
        accent: 'text-purple-400',
        bg: 'bg-purple-400/10'
    },
    {
        id: 'ELI5',
        name: 'ELI5',
        description: 'Breaks down topics into the simplest terms possible. Ideal for new concepts.',
        icon: <Zap size={18} />,
        accent: 'text-yellow-400',
        bg: 'bg-yellow-400/10'
    },
    {
        id: 'Academic',
        name: 'Academic',
        description: 'Detailed, precise, and rigorous. Focuses on structural depth and technicality.',
        icon: <GraduationCap size={18} />,
        accent: 'text-emerald-400',
        bg: 'bg-emerald-400/10'
    }
];

const SessionsPage = () => {
    const router = useRouter();
    // Configuration State
    const [config, setConfig] = useState({
        focusTopic: '',
        teachingStyle: 'Socratic',
        pace: 'Intermediate',
        language: 'English',
        duration: '30', // Default 30 minutes
        customHours: 0,
        customMinutes: 45
    });

    const [availableSources, setAvailableSources] = useState<any[]>([]);
    const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
    const [isFetchingSources, setIsFetchingSources] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadMode, setUploadMode] = useState<'none' | 'file' | 'link'>('none');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch Sources on load
    const loadSources = async () => {
        setIsFetchingSources(true);
        try {
            const res = await fetch('/api/notebooks?limit=1000');
            if (res.ok) {
                const data = await res.json();
                // Flatten sources from all notebooks with safety checks
                const allSources = data.notebooks?.flatMap((nb: any) => {
                    const sources = nb.sources || [];
                    if (sources.length === 0 && (nb.contentKey || nb.pdfKey)) {
                        // Treat legacy notebook as a single source
                        return [{
                            _id: nb._id, // Use notebook ID as source ID for legacy
                            name: nb.title,
                            type: nb.fileType || 'pdf',
                            fileKey: nb.pdfKey,
                            contentKey: nb.contentKey,
                            addedAt: nb.createdAt,
                            notebookTitle: nb.title,
                            notebookId: nb._id,
                            isLegacy: true
                        }];
                    }
                    return sources.map((s: any) => ({ ...s, notebookTitle: nb.title, notebookId: nb._id }));
                }) || [];
                setAvailableSources(allSources);
            }
        } catch (err) {
            console.error("Failed to fetch sources", err);
            toast.error("Failed to load your archive.");
        } finally {
            setIsFetchingSources(false);
        }
    };

    useEffect(() => {
        loadSources();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // 1. Ensure "Session Sources" notebook exists
            const nbRes = await fetch('/api/notebooks?limit=1000');
            const notebooksData = await nbRes.json();
            let sessionNb = notebooksData.notebooks?.find((n: any) => n.title === "Session Sources");

            if (!sessionNb) {
                const formData = new FormData();
                formData.append('title', "Session Sources");
                formData.append('file', file);
                
                const createNb = await fetch('/api/notebooks', {
                    method: 'POST',
                    body: formData
                });
                
                if (!createNb.ok) throw new Error("Failed to create Session Sources notebook");
                toast.success("Created Session Sources notebook and added source");
                await loadSources();
            } else {
                // 2. Add source to existing notebook
                const formData = new FormData();
                formData.append('file', file);
                formData.append('name', file.name);
                formData.append('type', file.name.endsWith('.pdf') ? 'pdf' : 'docx');

                const addSourceRes = await fetch(`/api/notebooks/${sessionNb._id}/sources`, {
                    method: 'POST',
                    body: formData
                });

                if (!addSourceRes.ok) throw new Error("Source addition failed");
                toast.success("Source uploaded and added to Session Sources");
                await loadSources();
            }
            setUploadMode('none');
        } catch (err) {
            toast.error("Upload failed");
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddYoutube = async () => {
        if (!youtubeUrl) return;
        setIsUploading(true);
        try {
            const res = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: youtubeUrl })
            });

            if (!res.ok) throw new Error("Transcription failed");
            const data = await res.json();

            // Now add to "Session Sources" notebook
            const nbResList = await fetch('/api/notebooks?limit=1000');
            const notebooksData = await nbResList.json();
            let sessionNb = notebooksData.notebooks?.find((n: any) => n.title === "Session Sources");

            if (!sessionNb) {
                // Create it
                const formData = new FormData();
                formData.append('title', "Session Sources");
                formData.append('pdfUrl', youtubeUrl);
                formData.append('type', 'youtube');
                formData.append('contentKey', data.r2Key);

                await fetch('/api/notebooks', {
                    method: 'POST',
                    body: formData
                });
                toast.success("YouTube source added to new Session Sources notebook");
                await loadSources();
            } else {
                const formData = new FormData();
                formData.append('name', `YouTube: ${youtubeUrl.substring(0, 20)}...`);
                formData.append('type', 'youtube');
                formData.append('contentKey', data.r2Key);
                formData.append('url', youtubeUrl);

                const addSourceRes = await fetch(`/api/notebooks/${sessionNb._id}/sources`, {
                    method: 'POST',
                    body: formData
                });
                
                if (!addSourceRes.ok) throw new Error("Failed to add source to notebook");
                
                toast.success("YouTube source added");
                await loadSources();
            }
            setYoutubeUrl('');
            setUploadMode('none');
        } catch (err) {
            toast.error("Failed to add YouTube source");
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    const toggleSource = (id: string) => {
        setSelectedSourceIds(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const startSession = () => {
        if (selectedSourceIds.length === 0) {
            toast.error("Please select at least one source.");
            return;
        }
        
        const params = new URLSearchParams({
            topic: config.focusTopic,
            style: config.teachingStyle,
            pace: config.pace,
            lang: config.language,
            dur: config.duration === 'custom' ? String((config.customHours * 60) + Number(config.customMinutes)) : config.duration,
            sources: selectedSourceIds.join(',')
        });
        
        router.push(`/sessions/live?${params.toString()}`);
    };

    return (
        <div className="min-h-[calc(100vh-64px)] pt-20 px-4 md:px-8 max-w-[1440px] mx-auto w-full flex flex-col relative" data-lenis-prevent>
            <AnimatePresence mode="wait">
                <motion.div
                    key="config"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex-1 overflow-y-auto p-4 md:p-6"
                >
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="text-center mb-8 relative">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary mb-4 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                                <Sparkles size={14} className="text-primary animate-pulse" />
                                <span>NEURAL TUTOR SETUP</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase mb-2">Configure Your Session</h2>
                            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                                Define your learning parameters before entering the real-time interactive teaching environment.
                            </p>
                        </div>

                        {/* Configuration Panel */}
                        <GlassCard className="p-6 border-primary/20 bg-black/40 relative overflow-hidden">
                            {/* Ambient Background lines */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.02)_1px,transparent_1px)] bg-size-[20px_20px]" />

                            <div className="relative z-10 space-y-8">
                                {/* Focus Topic */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-widest">
                                        <Target size={14} className="text-primary" />
                                        Target Focus Topic
                                    </label>
                                    <textarea
                                        value={config.focusTopic}
                                        onChange={(e) => setConfig({ ...config, focusTopic: e.target.value })}
                                        placeholder="What specifically do you want to learn today? (e.g. 'Explain the thermodynamics concepts in chapter 2')"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors resize-none h-24 shadow-inner"
                                    />
                                </div>

                                {/* Source Selection Section */}
                                <div className="space-y-4 pt-4 border-t border-white/10">
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-widest">
                                            <FileText size={14} className="text-primary" />
                                            Knowledge Sources
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => setUploadMode(uploadMode === 'file' ? 'none' : 'file')}
                                                className={cn(
                                                    "p-1.5 rounded-lg border transition-all hover:scale-105 active:scale-95",
                                                    uploadMode === 'file' ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 text-muted"
                                                )}
                                                title="Upload File"
                                            >
                                                <Upload size={14} />
                                            </button>
                                            <button 
                                                onClick={() => setUploadMode(uploadMode === 'link' ? 'none' : 'link')}
                                                className={cn(
                                                    "p-1.5 rounded-lg border transition-all hover:scale-105 active:scale-95",
                                                    uploadMode === 'link' ? "bg-red-500/20 border-red-500 text-red-400" : "bg-white/5 border-white/10 text-muted"
                                                )}
                                                title="Add YouTube Link"
                                            >
                                                <Youtube size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Upload/Link UI */}
                                    <AnimatePresence>
                                        {uploadMode === 'file' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all cursor-pointer group"
                                                >
                                                    <input 
                                                        type="file" 
                                                        ref={fileInputRef} 
                                                        onChange={handleFileUpload} 
                                                        className="hidden" 
                                                        accept=".pdf,.docx"
                                                    />
                                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                        {isUploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-bold text-white">Click or drag to upload</p>
                                                        <p className="text-[10px] text-muted uppercase tracking-widest mt-1">PDF or DOCX (Max 10MB)</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {uploadMode === 'link' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-2">
                                                    <input 
                                                        type="text"
                                                        value={youtubeUrl}
                                                        onChange={(e) => setYoutubeUrl(e.target.value)}
                                                        placeholder="Paste YouTube URL here..."
                                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-red-500/50"
                                                    />
                                                    <NeonButton 
                                                        onClick={handleAddYoutube}
                                                        isLoading={isUploading}
                                                        disabled={!youtubeUrl}
                                                        className="h-10 px-4 bg-red-600 hover:bg-red-500 border-none"
                                                    >
                                                        Add
                                                    </NeonButton>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Source List */}
                                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                        {isFetchingSources ? (
                                            <div className="py-8 flex flex-col items-center justify-center text-muted gap-2">
                                                <Loader2 size={24} className="animate-spin text-primary" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">Scanning Archive...</p>
                                            </div>
                                        ) : availableSources.length > 0 ? (
                                            availableSources.map(source => {
                                                const isSelected = selectedSourceIds.includes(source._id);
                                                return (
                                                    <button
                                                        key={source._id}
                                                        onClick={() => toggleSource(source._id)}
                                                        className={cn(
                                                            "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left relative group",
                                                            isSelected 
                                                                ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(0,240,255,0.05)]" 
                                                                : "bg-white/5 border-white/10 hover:bg-white/10"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                                            source.type === 'youtube' ? "bg-red-500/10 text-red-400" : "bg-primary/10 text-primary"
                                                        )}>
                                                            {source.type === 'youtube' ? <Youtube size={18} /> : <FileText size={18} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={cn("text-xs font-bold truncate", isSelected ? "text-primary" : "text-white")}>
                                                                {source.name}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">
                                                                {source.notebookTitle} • {source.type}
                                                            </p>
                                                        </div>
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                                            isSelected ? "bg-primary border-primary text-black" : "border-white/20 group-hover:border-white/40"
                                                        )}>
                                                            {isSelected && <Check size={12} strokeWidth={3} />}
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl">
                                                <p className="text-xs text-muted">No sources found. Upload your first document!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Teaching Methodology Cards */}
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-widest">
                                        <GraduationCap size={14} className="text-primary" />
                                        Teaching Methodology
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {TEACHING_METHODS.map(method => (
                                            <button
                                                key={method.id}
                                                onClick={() => setConfig({ ...config, teachingStyle: method.id })}
                                                className={cn(
                                                    "flex flex-col items-start p-4 rounded-xl border transition-all duration-300 text-left relative overflow-hidden group",
                                                    config.teachingStyle === method.id
                                                        ? "bg-white/10 border-primary/50 shadow-[0_0_20px_rgba(0,240,255,0.1)]"
                                                        : "bg-white/5 border-white/10 opacity-60 hover:opacity-100 hover:bg-white/10"
                                                )}
                                            >
                                                <div className={cn("p-2 rounded-lg mb-3", method.bg, method.accent)}>
                                                    {method.icon}
                                                </div>
                                                <h4 className="text-sm font-bold text-white mb-1">{method.name}</h4>
                                                <p className="text-[10px] text-muted-foreground leading-relaxed whitespace-normal">
                                                    {method.description}
                                                </p>
                                                {config.teachingStyle === method.id && (
                                                    <motion.div 
                                                        layoutId="active-method"
                                                        className="absolute top-2 right-2"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                    >
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#00f0ff]" />
                                                    </motion.div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-y border-white/10">
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-widest">
                                            <Settings2 size={14} className="text-primary" />
                                            Depth & Pace
                                        </label>
                                        <div className="flex flex-col gap-2">
                                            {['Beginner', 'Intermediate', 'Advanced'].map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setConfig({ ...config, pace: p })}
                                                    className={cn(
                                                        "flex justify-center items-center px-4 py-2 rounded-lg border transition-all duration-300",
                                                        config.pace === p
                                                            ? "bg-primary/20 border-primary text-primary"
                                                            : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                                                    )}
                                                >
                                                    <span className="text-xs font-bold">{p}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Session Duration */}
                                <div className="space-y-3 pt-2">
                                    <label className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-widest">
                                        <Clock size={14} className="text-secondary" />
                                        Session Duration
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {['10', '30', '60', '120'].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setConfig({ ...config, duration: m })}
                                                className={cn(
                                                    "px-4 py-2 rounded-lg border text-xs font-bold transition-all duration-300",
                                                    config.duration === m
                                                        ? "bg-secondary/20 border-secondary text-secondary"
                                                        : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                                                )}
                                            >
                                                {m}m
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setConfig({ ...config, duration: 'custom' })}
                                            className={cn(
                                                "px-4 py-2 rounded-lg border text-xs font-bold transition-all duration-300",
                                                config.duration === 'custom'
                                                    ? "bg-secondary/20 border-secondary text-secondary"
                                                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                                            )}
                                        >
                                            Custom
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {config.duration === 'custom' && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col md:flex-row items-center gap-8 mt-2"
                                            >
                                                {/* Hours */}
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter mb-1">Hours</span>
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={() => setConfig((prev: any) => ({ ...prev, customHours: Math.max(0, prev.customHours - 1) }))}
                                                            className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center border border-white/5 text-secondary hover:bg-secondary/20 transition-colors"
                                                        >
                                                            <ChevronDown size={14} />
                                                        </button>
                                                        <div className="w-16 h-16 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-2xl font-black text-white">
                                                            {String(config.customHours).padStart(2, '0')}
                                                        </div>
                                                        <button 
                                                            onClick={() => setConfig((prev: any) => ({ ...prev, customHours: Math.min(23, prev.customHours + 1) }))}
                                                            className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center border border-white/5 text-secondary hover:bg-secondary/20 transition-colors"
                                                        >
                                                            <ChevronUp size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="hidden md:flex flex-col items-center justify-center pt-5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-secondary/40 mb-2" />
                                                    <div className="w-1.5 h-1.5 rounded-full bg-secondary/40" />
                                                </div>

                                                {/* Minutes */}
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter mb-1">Minutes</span>
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={() => setConfig((prev: any) => ({ ...prev, customMinutes: Math.max(0, prev.customMinutes - 5) }))}
                                                            className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center border border-white/5 text-secondary hover:bg-secondary/20 transition-colors"
                                                        >
                                                            <ChevronDown size={14} />
                                                        </button>
                                                        <div className="w-16 h-16 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-2xl font-black text-white">
                                                            {String(config.customMinutes).padStart(2, '0')}
                                                        </div>
                                                        <button 
                                                            onClick={() => setConfig((prev: any) => ({ ...prev, customMinutes: Math.min(59, prev.customMinutes + 5) }))}
                                                            className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center border border-white/5 text-secondary hover:bg-secondary/20 transition-colors"
                                                        >
                                                            <ChevronUp size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex-1 text-center md:text-left">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1 opacity-50">Total Length</p>
                                                    <p className="text-xl font-black text-secondary">
                                                        {(config.customHours * 60) + Number(config.customMinutes)} <span className="text-xs">MINS</span>
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Language */}
                                <div className="space-y-3 border-t border-white/10 pt-6">
                                    <label className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-widest">
                                        <Globe size={14} className="text-white/50" />
                                        Instruction Language
                                    </label>
                                    <select
                                        value={config.language}
                                        onChange={(e) => setConfig({ ...config, language: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 text-white text-sm font-bold rounded-lg px-4 py-3 outline-none focus:border-primary/50 transition-all cursor-pointer"
                                    >
                                        {['English', 'Spanish', 'French', 'German', 'Hindi', 'Chinese', 'Japanese', 'Arabic', 'Russian', 'Portuguese'].map(lang => (
                                            <option key={lang} value={lang} className="bg-zinc-900 text-white">{lang}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Start Button */}
                        <div className="pt-4 pb-12">
                            <NeonButton
                                onClick={startSession}
                                className="w-full h-14 text-sm tracking-widest uppercase font-black group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <Play size={18} className="mr-2 group-hover:scale-110 transition-transform" />
                                Initialize {selectedSourceIds.length} Source{selectedSourceIds.length !== 1 ? 's' : ''} Session
                            </NeonButton>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default SessionsPage;
