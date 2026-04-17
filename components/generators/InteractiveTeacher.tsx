'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, Settings2, Mic, Target, GraduationCap, Globe, 
    FileText, Clock, ChevronUp, ChevronDown, Plus, Youtube, 
    Upload, Loader2, X, BookOpen, ChevronRight 
} from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import GlassCard from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PRESET_SUGGESTIONS = [
    "Explain the main ideas in simple words with examples.",
    "Summarize the most important points and how they connect.",
    "Create a simple study guide with key terms and definitions.",
    "Walk me through the difficult parts step-by-step.",
    "Find the three most challenging topics and explain them simply."
];

const TEACHING_METHODS = [
    {
        id: 'Socratic',
        name: 'Interactive Q&A',
        icon: <GraduationCap size={20} />,
        description: 'Learn through conversation. The AI will ask you questions to help you find the answers yourself.',
        accent: 'text-sky-400',
        bg: 'bg-sky-400/10'
    },
    {
        id: 'Traditional',
        name: 'Guided Lesson',
        icon: <BookOpen size={20} />,
        description: 'A clear, step-by-step explanation. Best for understanding new topics from start to finish.',
        accent: 'text-purple-400',
        bg: 'bg-purple-400/10'
    }
];

interface InteractiveTeacherProps {
    notebookId: string;
    modelProvider?: string;
    sourceIds?: string[];
}

const InteractiveTeacher = ({ notebookId }: InteractiveTeacherProps) => {
    const [config, setConfig] = useState({
        teachingStyle: 'Socratic',
        pace: 'Normal',
        language: 'English',
        voiceStyle: 'Sulafat',
        duration: '30',
        customHours: 0,
        customMinutes: 45,
        focusTopic: ''
    });

    const [notebookSources, setNotebookSources] = useState<any[]>([]);
    const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
    const [isLoadingSources, setIsLoadingSources] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    
    const [addMode, setAddMode] = useState<'none' | 'upload' | 'youtube'>('none');
    const [isAddingSource, setIsAddingSource] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchSources = async () => {
        if (!notebookId) return;
        setIsLoadingSources(true);
        try {
            const res = await fetch(`/api/notebooks/${notebookId}`);
            if (res.ok) {
                const data = await res.json();
                setNotebookSources(data.sources || []);
            }
        } catch (error) {
            console.error("Failed to fetch sources:", error);
        } finally {
            setIsLoadingSources(false);
        }
    };

    useEffect(() => {
        fetchSources();
    }, [notebookId]);

    const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSuggestionIndex((prev) => (prev + 1) % PRESET_SUGGESTIONS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab' && config.focusTopic === '') {
            e.preventDefault();
            setConfig({ ...config, focusTopic: PRESET_SUGGESTIONS[currentSuggestionIndex] });
        }
    };

    const handleAddYoutube = async (url: string) => {
        if (!url) return;
        setIsAddingSource(true);
        setLoadingStep('Saving video...');

        try {
            const infoRes = await fetch('/api/transcribe/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const infoData = await infoRes.json();
            if (!infoRes.ok) throw new Error(infoData.error || 'Failed to get video info');

            const transcribeRes = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const transcribeData = await transcribeRes.json();
            if (!transcribeRes.ok) throw new Error(transcribeData.error || 'Transcription failed');

            const formData = new FormData();
            formData.append('type', 'youtube');
            formData.append('name', infoData.title || `YouTube Video`);
            formData.append('url', url);
            if (transcribeData.r2Key) formData.append('contentKey', transcribeData.r2Key);

            const sourceRes = await fetch(`/api/notebooks/${notebookId}/sources`, {
                method: 'POST',
                body: formData
            });

            if (!sourceRes.ok) throw new Error('Failed to save source');

            toast.success('Video added to your library');
            await fetchSources();
            setAddMode('none');
            setYoutubeUrl('');
        } catch (error: any) {
            toast.error("Error: " + error.message);
        } finally {
            setIsAddingSource(false);
        }
    };

    const handleAddSource = async (file: File) => {
        setIsAddingSource(true);
        setLoadingStep('Reading file...');

        try {
            const isDocx = file.name.endsWith('.docx') || file.name.endsWith('.doc');
            let uploadedText = '';

            if (isDocx) {
                const mammoth = await import('mammoth');
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer });
                uploadedText = result.value.replace(/<[^>]+>/g, ' ');
            } else {
                const pdfjs = await import('pdfjs-dist');
                pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjs.getDocument(arrayBuffer).promise;
                for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    uploadedText += content.items.map((it: any) => it.str).join(' ') + '\n';
                }
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', isDocx ? 'docx' : 'pdf');
            formData.append('name', file.name);
            formData.append('textContent', uploadedText);

            const res = await fetch(`/api/notebooks/${notebookId}/sources`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');

            toast.success('File added to your library');
            await fetchSources();
            setAddMode('none');
        } catch (error: any) {
            toast.error("Error: " + error.message);
        } finally {
            setIsAddingSource(false);
        }
    };

    const startSession = async () => {
        if (selectedSourceIds.length === 0) {
            toast.error("Please select at least one study material.");
            return;
        }

        setIsLoading(true);
        setLoadingStep("Starting your session...");

        try {
            setLoadingStep("Organizing your materials...");
            const initRes = await fetch('/api/orchestrator/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notebookId,
                    methodology: config.teachingStyle,
                    sourceIds: selectedSourceIds,
                    focusTopic: config.focusTopic,
                    language: config.language
                })
            });

            const initData = await initRes.json();
            if (!initRes.ok) throw new Error(initData.error);

            setLoadingStep("Connecting to your tutor...");
            const sessionRes = await fetch('/api/orchestrator/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notebookId,
                    config,
                    topicTree: initData.topicTree,
                    cacheName: initData.cacheName
                })
            });

            const sessionData = await sessionRes.json();
            if (!sessionRes.ok) throw new Error(sessionData.error);

            const sessionUrl = `/interactive-ai/session/${sessionData.sessionId}`;
            toast.success("Ready to start!");
            window.open(sessionUrl, '_blank');

        } catch (error: any) {
            toast.error("Failed to start: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 bg-black">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-t-2 border-primary/50 animate-spin" />
                    <BookOpen size={24} className="absolute inset-0 m-auto text-primary animate-pulse" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">{loadingStep}</h3>
                    <p className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] uppercase">Set up almost complete</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#050505] overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto w-full p-6 md:p-10 space-y-12"
            >
                {/* Minimal Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Set Up Your Session</h1>
                    <p className="text-sm text-zinc-400 font-medium">Choose your materials and how you want to learn today.</p>
                </div>

                {/* Materials Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Study Materials</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setAddMode(addMode === 'upload' ? 'none' : 'upload')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-400 hover:text-white hover:border-primary/30 transition-all"
                            >
                                <Plus size={14} /> Add File
                            </button>
                            <button
                                onClick={() => setAddMode(addMode === 'youtube' ? 'none' : 'youtube')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all"
                            >
                                <Youtube size={14} /> Add Video
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {addMode !== 'none' && (
                             <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                {addMode === 'upload' ? (
                                    <div onClick={() => fileInputRef.current?.click()} className="p-8 border border-dashed border-white/20 rounded-2xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group">
                                        <Upload size={20} className="text-primary group-hover:scale-110 transition-transform" />
                                        <p className="text-xs font-bold text-white">Select a PDF or Word document</p>
                                        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.doc" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAddSource(file); }} />
                                    </div>
                                ) : (
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                                        <div className="flex gap-2">
                                            <input type="text" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="Paste YouTube link here..." className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-red-500/50" />
                                            <button onClick={() => handleAddYoutube(youtubeUrl)} disabled={!youtubeUrl || isAddingSource} className="px-5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all text-xs font-bold">
                                                {isAddingSource ? <Loader2 size={14} className="animate-spin" /> : 'Ready'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                             </motion.div>
                        )}
                    </AnimatePresence>

                    {isAddingSource && (
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                            <p className="text-xs font-bold text-primary">{loadingStep}</p>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div className="h-full bg-primary" animate={{ width: '100%' }} transition={{ duration: 10 }} />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {notebookSources.length === 0 ? (
                            <div className="col-span-full py-10 text-center border border-dashed border-white/10 rounded-2xl opacity-40">
                                <BookOpen size={20} className="mx-auto mb-2" />
                                <p className="text-xs font-medium">Your library is empty. Add a material to start.</p>
                            </div>
                        ) : (
                            notebookSources.map(source => {
                                const isSelected = selectedSourceIds.includes(source._id);
                                return (
                                    <button
                                        key={source._id}
                                        onClick={() => setSelectedSourceIds(prev => isSelected ? prev.filter(id => id !== source._id) : [...prev, source._id])}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-xl border transition-all relative overflow-hidden group",
                                            isSelected ? "bg-white/10 border-primary/30" : "bg-white/5 border-white/5 hover:border-white/20"
                                        )}
                                    >
                                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", source.type === 'youtube' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500")}>
                                            {source.type === 'youtube' ? <Youtube size={16} /> : <FileText size={16} />}
                                        </div>
                                        <div className="min-w-0 flex-1 text-left">
                                            <p className="text-xs font-bold text-white truncate">{source.name}</p>
                                        </div>
                                        {isSelected && (
                                            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#00f0ff]" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Options Section */}
                <div className="space-y-10">
                    {/* Focus Topic */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Optional: What do you want to focus on?</label>
                        <div className="relative group">
                            {config.focusTopic === '' && (
                                <div className="absolute inset-0 p-4 text-sm text-zinc-600 pointer-events-none font-medium italic">
                                    {PRESET_SUGGESTIONS[currentSuggestionIndex]}
                                    <span className="ml-3 text-[10px] font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-zinc-500 not-italic uppercase tracking-widest">Tab to Fill</span>
                                </div>
                            )}
                            <textarea
                                value={config.focusTopic}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                onKeyDown={handleKeyDown}
                                onChange={(e) => setConfig({ ...config, focusTopic: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-primary/30 focus:bg-white/[0.07] transition-all h-28 shadow-inner relative z-10"
                            />
                        </div>
                    </div>

                    {/* Learning Style */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Learning Style</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {TEACHING_METHODS.map(method => (
                                <button
                                    key={method.id}
                                    onClick={() => setConfig({ ...config, teachingStyle: method.id })}
                                    className={cn(
                                        "flex flex-col items-start p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group",
                                        config.teachingStyle === method.id 
                                            ? "bg-white/10 border-primary/30" 
                                            : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                                    )}
                                >
                                    <div className={cn("p-2 rounded-xl mb-4", method.bg, method.accent)}>
                                        {method.icon}
                                    </div>
                                    <h4 className="text-base font-bold text-white mb-1">{method.name}</h4>
                                    <p className="text-xs text-zinc-400 font-medium leading-relaxed">{method.description}</p>
                                    
                                    {config.teachingStyle === method.id && (
                                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#00f0ff]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-white/5">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Globe size={12} /> Language
                            </label>
                            <select 
                                value={config.language} 
                                onChange={(e) => setConfig({ ...config, language: e.target.value })} 
                                className="w-full bg-white/5 border border-white/10 text-white text-xs font-bold rounded-xl px-4 py-3 outline-none cursor-pointer focus:border-primary/30"
                            >
                                {['English', 'Hindi', 'Spanish', 'French', 'German'].map(lang => (
                                    <option key={lang} value={lang} className="bg-zinc-900">{lang}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Mic size={12} /> Voice Style
                            </label>
                            <select 
                                value={config.voiceStyle} 
                                onChange={(e) => setConfig({ ...config, voiceStyle: e.target.value })} 
                                className="w-full bg-white/5 border border-white/10 text-white text-xs font-bold rounded-xl px-4 py-3 outline-none cursor-pointer focus:border-primary/30"
                            >
                                {['Achird', 'Sulafat', 'Kore', 'Erinome'].map(v => (
                                    <option key={v} value={v} className="bg-zinc-900">{v}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={12} /> Time Limit
                            </label>
                            <select 
                                value={config.duration} 
                                onChange={(e) => setConfig({ ...config, duration: e.target.value })} 
                                className="w-full bg-white/5 border border-white/10 text-white text-xs font-bold rounded-xl px-4 py-3 outline-none cursor-pointer focus:border-primary/30"
                            >
                                {['15', '30', '60', '120'].map(d => (
                                    <option key={d} value={d} className="bg-zinc-900">{d} Minutes</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 pb-20">
                        <NeonButton 
                            onClick={startSession} 
                            className="w-full h-16 text-xs tracking-[0.2em] font-black uppercase group relative overflow-hidden"
                        >
                            <Play size={18} className="mr-3 group-hover:scale-110 transition-transform" /> 
                            Start Study Session
                        </NeonButton>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default InteractiveTeacher;
