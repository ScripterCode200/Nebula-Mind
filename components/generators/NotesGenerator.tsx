
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Sparkles, Download, Copy, ChevronUp, ChevronDown, ChevronLeft, PanelLeftOpen } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import GlassCard from '@/components/ui/GlassCard';

import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import FuturisticLoader from '@/components/ui/FuturisticLoader';

interface NotesGeneratorProps {
    notebookId: string;
    modelProvider: 'gemini' | 'openai' | 'ollama';
}

const NotesGenerator = ({ notebookId, modelProvider }: NotesGeneratorProps) => {
    const [type, setType] = useState<'brief' | 'detailed' | 'bullet-points'>('detailed');
    const [notes, setNotes] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [savedNotes, setSavedNotes] = useState<any[]>([]);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

    React.useEffect(() => {
        fetchNotes();
    }, [notebookId]);

    // Simulated Progress
    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (loading) {
            setProgress(0);
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) return 95;
                    return prev + 0.5; // Slow increment
                });
            }, 100);
        } else {
            setProgress(100);
        }
        return () => clearInterval(interval);
    }, [loading]);

    const fetchNotes = async () => {
        try {
            const res = await fetch(`/api/notes?notebookId=${notebookId}`);
            if (res.ok) {
                const data = await res.json();
                setSavedNotes(data);
                if (data.length > 0 && !selectedNoteId) {
                    // Select the most recent note by default if none selected
                    setSelectedNoteId(data[0]._id);
                    setNotes(data[0].content);
                }
            }
        } catch (error) {
            console.error("Failed to fetch notes:", error);
        }
    };

    const handleNoteSelect = (note: any) => {
        setSelectedNoteId(note._id);
        setNotes(note.content);
        // On mobile, maybe close the list? For now, keep simple.
    };

    const [showControls, setShowControls] = useState(true);
    const [showSidebar, setShowSidebar] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    React.useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) {
                setShowControls(true);
                setShowSidebar(true);
            } else {
                // On mobile, default to hidden sidebar
                setShowSidebar(false);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const generateNotes = async () => {
        setLoading(true);
        setProgress(0);
        if (isMobile) setShowControls(false);

        let generatedContent = '';
        setNotes(''); // Clear view for new generation
        setSelectedNoteId(null); // Deselect current note as we are generating a new one

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notebookId,
                    type: 'notes',
                    config: { type },
                    modelProvider,
                }),
            });

            if (!res.ok) {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await res.json();
                    throw new Error(data.error || res.statusText);
                } else {
                    const text = await res.text();
                    console.error('Non-JSON error response:', text);
                    throw new Error(`Server error: ${res.status} ${res.statusText}`);
                }
            }

            if (!res.body) {
                throw new Error('No response body');
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let isFirstChunk = true;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                generatedContent += chunk;
                setNotes(prev => prev + chunk);

                // Hide loader and show streaming text as soon as we have content
                if (isFirstChunk) {
                    setProgress(100);
                    // Short delay to let user see the 100% state
                    await new Promise(resolve => setTimeout(resolve, 500));
                    setLoading(false);
                    isFirstChunk = false;
                }
            }

            // Save the generated note
            const saveRes = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notebookId,
                    title: `Note ${savedNotes.length + 1} (${type})`,
                    content: generatedContent,
                    type
                }),
            });

            if (saveRes.ok) {
                const newNote = await saveRes.json();
                setSavedNotes(prev => [newNote, ...prev]);
                setSelectedNoteId(newNote._id);
                toast.success('Notes generated and saved!');
            } else {
                toast.error('Generated but failed to save.');
            }

        } catch (error: any) {
            console.error(error);
            toast.error(`Failed to generate notes: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
            setProgress(100);
        }
    };

    return (
        <div className="h-full flex flex-col md:flex-row overflow-hidden relative">
            {/* Sidebar / List of Notes */}
            <motion.div
                initial={{ width: 256, opacity: 1, x: 0 }}
                animate={{
                    width: isMobile ? '100%' : (showSidebar ? 256 : 0),
                    opacity: showSidebar ? 1 : 0,
                    x: isMobile && !showSidebar ? '-100%' : 0
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={`bg-black/90 md:bg-black/20 backdrop-blur-xl md:backdrop-blur-none border-r border-white/5 flex flex-col flex-shrink-0 overflow-hidden absolute md:relative z-30 h-full`}
                style={{ pointerEvents: showSidebar ? 'auto' : 'none' }}
            >
                <div className="p-4 border-b border-white/5 flex items-center justify-between min-w-[256px]">
                    <div>
                        <h3 className="font-bold text-white mb-1">Saved Notes</h3>
                        <p className="text-xs text-muted-foreground">{savedNotes.length} notes</p>
                    </div>
                    <button
                        onClick={() => setShowSidebar(false)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 min-w-[256px]" data-lenis-prevent>
                    {savedNotes.map(note => (
                        <button
                            key={note._id}
                            onClick={() => {
                                handleNoteSelect(note);
                                if (isMobile) setShowSidebar(false);
                            }}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${selectedNoteId === note._id
                                ? 'bg-primary/10 border-primary/50 text-white'
                                : 'bg-white/5 border-transparent text-muted-foreground hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <div className="font-medium text-sm truncate">{note.title}</div>
                            <div className="text-[10px] opacity-70 mt-1 flex justify-between">
                                <span className="capitalize">{note.type}</span>
                                <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                            </div>
                        </button>
                    ))}
                    {savedNotes.length === 0 && (
                        <div className="text-center p-4 text-xs text-muted-foreground">
                            No notes yet. Generate one!
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Desktop Sidebar Toggle Button */}
            <AnimatePresence>
                {!showSidebar && !isMobile && (
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onClick={() => setShowSidebar(true)}
                        className="absolute left-4 top-24 z-10 p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-colors hidden md:block"
                        title="Show Notes"
                    >
                        <PanelLeftOpen size={20} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Mobile Floating Action Button (FAB) for Sidebar */}
            <AnimatePresence>
                {!showSidebar && isMobile && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setShowSidebar(true)}
                        className="absolute bottom-6 right-6 z-40 p-3 rounded-full bg-primary text-black shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-shadow md:hidden"
                        title="Show Notes"
                    >
                        <PanelLeftOpen size={24} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <div className="flex-shrink-0 p-4 md:p-8 pb-0">
                    <div className="flex items-start justify-between gap-4 mb-4 md:mb-6">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-white tracking-tight">AI Notes</h2>
                            <p className="text-muted-foreground text-xs md:text-base">Generate comprehensive study notes from your source material.</p>
                        </div>
                        <button
                            onClick={() => setShowControls(!showControls)}
                            className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors border border-white/5"
                        >
                            {showControls ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                    </div>

                    <motion.div
                        initial={false}
                        animate={{
                            height: showControls ? 'auto' : 0,
                            opacity: showControls ? 1 : 0,
                            marginBottom: showControls ? 24 : 0
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex flex-wrap gap-2 md:gap-3 p-1 bg-white/5 rounded-xl w-fit border border-white/10">
                                {['brief', 'detailed', 'bullet-points'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setType(t as 'brief' | 'detailed' | 'bullet-points')}
                                        className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all capitalize ${type === t
                                            ? 'bg-primary/20 text-primary shadow-[0_0_10px_rgba(0,240,255,0.1)]'
                                            : 'text-muted-foreground hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {t.replace('-', ' ')}
                                    </button>
                                ))}
                            </div>
                            <NeonButton onClick={generateNotes} isLoading={loading} size="sm" className="w-full md:w-auto">
                                <Sparkles size={16} />
                                Generate New Note
                            </NeonButton>
                        </div>
                    </motion.div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-black min-h-0 overscroll-contain" data-lenis-prevent>
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <FuturisticLoader
                                text="Generating Notes"
                                subtext={modelProvider === 'ollama' ? "Nebula AI is synthesizing your content..." : "AI is analyzing your document..."}
                                progress={progress}
                            />
                        </div>
                    ) : notes ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="min-h-0 bg-black"
                        >
                            <GlassCard className="overflow-hidden flex flex-col relative group border-primary/30 bg-black/40 backdrop-blur-xl shadow-[0_0_30px_rgba(0,240,255,0.15)] bg-black">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 bg-black/60 p-1 rounded-lg backdrop-blur-md border border-white/10">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(notes);
                                            toast.success('Copied to clipboard');
                                        }}
                                        className="p-2 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const element = document.getElementById('markdown-content');
                                            if (!element) return;

                                            const opt = {
                                                margin: [10, 10],
                                                filename: `notes-${notebookId}.pdf`,
                                                image: { type: 'jpeg', quality: 0.98 },
                                                html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#000000' },
                                                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                                            };

                                            try {
                                                // Dynamically import html2pdf to avoid SSR issues
                                                const html2pdf = (await import('html2pdf.js')).default as any;
                                                await html2pdf().set(opt).from(element).save();
                                                toast.success('Downloaded notes as PDF');
                                            } catch (error) {
                                                console.error('PDF generation failed:', error);
                                                toast.error('Failed to generate PDF');
                                            }
                                        }}
                                        className="p-2 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                                        title="Download PDF"
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>

                                <div id="markdown-content" className="p-6 md:p-10 bg-black text-white">
                                    <div className="prose prose-invert prose-lg max-w-none 
                                        prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-white
                                        prose-h1:text-4xl prose-h1:mb-8 prose-h1:border-b prose-h1:border-white/10 prose-h1:pb-4
                                        prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-primary/90
                                        prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-secondary
                                        prose-p:text-gray-300 prose-p:leading-loose prose-p:font-serif prose-p:text-lg
                                        prose-li:text-gray-300 prose-li:font-serif prose-li:text-lg
                                        prose-strong:text-white prose-strong:font-semibold
                                        prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                                        prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl
                                        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-white/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-gray-400
                                        ">
                                        <ReactMarkdown
                                            rehypePlugins={[rehypeHighlight]}
                                        >
                                            {notes}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground/50 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02] h-64">
                            <div className="text-center p-6">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FileText size={40} className="opacity-50" />
                                </div>
                                <h3 className="text-xl font-medium text-white mb-2">Ready to generate notes</h3>
                                <p className="max-w-sm mx-auto">Select a format above and let AI synthesize your document into clear, structured notes.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotesGenerator;
