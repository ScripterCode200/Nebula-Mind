'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, PanelLeftClose, PanelLeftOpen, Share2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import AIToolsPanel from './AIToolsPanel';
import ShareNotebookModal from './ShareNotebookModal';

const PDFViewer = dynamic(() => import('./PDFViewer'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full flex items-center justify-center bg-[#0A0A0A] text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-xs">Loading PDF Viewer...</span>
            </div>
        </div>
    ),
});
const WordViewer = dynamic(() => import('./WordViewer'), { ssr: false });
const TextViewer = dynamic(() => import('./TextViewer'), { ssr: false });

import SourceSidebar from './SourceSidebar';

// Update props interface
interface NotebookWorkspaceProps {
    notebook: {
        _id: string;
        title: string;
        pdfUrl: string;
        sources?: any[]; // Added sources
        chatHistory?: {
            role: string;
            content: string;
            timestamp: string;
        }[];
        fileType?: 'pdf' | 'docx';
        contentHtml?: string;
    };
}

const NotebookWorkspace = ({ notebook }: NotebookWorkspaceProps) => {
    const [isPdfVisible, setIsPdfVisible] = React.useState(true);
    const [isMobile, setIsMobile] = React.useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

    // Multi-source State
    const [sources, setSources] = React.useState<any[]>(() => {
        if (notebook.sources && notebook.sources.length > 0) {
            return notebook.sources;
        }
        // Legacy support: If no sources but pdfUrl/pdfKey exists, create a default source
        if (notebook.pdfUrl) {
            return [{
                _id: 'default-source',
                type: 'pdf',
                name: notebook.title || 'Main Document', // Use notebook title as default name
                url: notebook.pdfUrl,
                fileKey: (notebook as any).pdfKey, // Type assertion if key missing in type def
                addedAt: new Date().toISOString()
            }];
        }
        return [];
    });

    const [activeSourceId, setActiveSourceId] = React.useState<string | null>(() => {
        if (notebook.sources && notebook.sources.length > 0) {
            return notebook.sources[0]._id;
        }
        if (notebook.pdfUrl) {
            return 'default-source';
        }
        return null;
    });

    // Default all checked
    const [selectedSourceIds, setSelectedSourceIds] = React.useState<string[]>(() => {
        if (notebook.sources && notebook.sources.length > 0) {
            return notebook.sources.map(s => s._id);
        }
        if (notebook.pdfUrl) {
            return ['default-source'];
        }
        return [];
    });
    const [isAddingSource, setIsAddingSource] = React.useState(false);
    const [loadingStep, setLoadingStep] = React.useState('');
    const [transcribeProgress, setTranscribeProgress] = React.useState(0);
    const [videoInfo, setVideoInfo] = React.useState<{ title: string; duration: number } | null>(null);

    // Derived active Source Data
    const activeSource = React.useMemo(() => {
        if (activeSourceId && sources.length > 0) {
            return sources.find(s => s._id === activeSourceId);
        }
        return null;
    }, [activeSourceId, sources]);

    const activePdfUrl = activeSource?.url || notebook.pdfUrl;
    const activeSourceType = activeSource?.type || notebook.fileType || 'pdf';

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
                e.preventDefault();
                setIsPdfVisible(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleAddYoutube = async (url: string) => {
        setIsAddingSource(true);
        setTranscribeProgress(0);
        setVideoInfo(null);

        try {
            // 1. Get Metadata
            setLoadingStep('Fetching Video Info...');
            const infoRes = await fetch('/api/transcribe/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const infoData = await infoRes.json();
            if (!infoRes.ok) throw new Error(infoData.error || 'Failed to get video info');

            setVideoInfo({ title: infoData.title, duration: infoData.durationSeconds });

            // 2. Transcribe with Simulation
            setLoadingStep('Transcribing Video...');

            // Simulation
            const estimatedTimeMs = Math.min(60000, (infoData.durationSeconds * 1000) / 10);
            const startTime = Date.now();
            const progressInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(95, Math.floor((elapsed / estimatedTimeMs) * 100));
                setTranscribeProgress(progress);
            }, 500);

            const transcribeRes = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            clearInterval(progressInterval);
            setTranscribeProgress(100);

            const transcribeData = await transcribeRes.json();

            if (!transcribeRes.ok) throw new Error(transcribeData.error || 'Transcription failed');

            // 3. Add Source to Notebook
            setLoadingStep('Saving Source...');
            const formData = new FormData();
            formData.append('type', 'youtube');
            formData.append('name', videoInfo?.title || `YouTube Video`);
            formData.append('url', url);

            if (transcribeData.r2Key) {
                formData.append('contentKey', transcribeData.r2Key);
            } else if (transcribeData.text) {
                // Should not happen for lightweight, but fallback:
                formData.append('textContent', transcribeData.text);
            }

            const sourceRes = await fetch(`/api/notebooks/${notebook._id}/sources`, {
                method: 'POST',
                body: formData
            });

            if (!sourceRes.ok) {
                throw new Error('Failed to save source to notebook');
            }

            // Reload to show new source
            window.location.reload();

        } catch (error) {
            console.error("Failed to add YouTube source", error);
            // Ideally show a toast here
            alert("Failed to add video: " + (error as Error).message);
        } finally {
            setIsAddingSource(false);
        }
    };

    const handleAddSource = async (file: File) => {
        setIsAddingSource(true);
        const formData = new FormData();
        formData.append('file', file);
        // ... (rest of existing logic)
        formData.append('textContent', 'Extracting text on client is hard, ideally backend does it or we use pdfjs here.');

        try {
            // ... (existing PDF logic)
            // Or better: Let's assume the user just wants the PDF for now and we'll fix text parsing later
            // But the backend REQUIREMENTS say 'textContent' is needed.
            // Let's implement a quick extract using the existing utility we have in CreateNotebookModal?
            // Actually, we can't easily reuse that hook here without refactoring.
            // For this iteration, we'll send a placeholder and maybe trigger a server-side parse if we had one.
            // Or better, we import pdfjs dynamically here.
            // ...

            // Re-using existing simplified logic from original file for now to minimize diff risk
            let text = "";
            try {
                const pdfjs = await import('pdfjs-dist');
                pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjs.getDocument(arrayBuffer).promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map((item: any) => item.str).join(' ') + '\n';
                }
            } catch (e) {
                console.error("Client side PDF parse failed", e);
                text = "Text extraction failed.";
            }

            formData.set('textContent', text);

            const res = await fetch(`/api/notebooks/${notebook._id}/sources`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.error("Failed to add source", error);
        } finally {
            setIsAddingSource(false);
        }
    };

    const handleSourceToggle = (id: string) => {
        setSelectedSourceIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    return (
        <div className="flex flex-col h-screen bg-[#050505] overflow-hidden">
            {/* Header */}
            <header className="h-14 md:h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-black/40 backdrop-blur-xl z-50 relative">
                <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                    <Link
                        href="/notebook"
                        className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors group"
                    >
                        <div className="p-1.5 md:p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                            <ArrowLeft size={16} className="md:w-[18px] md:h-[18px]" />
                        </div>
                        <span className="text-sm font-medium hidden sm:inline-block">Back</span>
                    </Link>

                    <div className="h-6 w-px bg-white/10" />

                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary hidden md:block">
                            <Sparkles size={16} />
                        </div>
                        <h1 className="font-bold text-sm md:text-lg text-white truncate">{notebook.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-4">
                    <button
                        onClick={() => setIsPdfVisible(!isPdfVisible)}
                        className="flex items-center gap-2 px-3 py-1.5 md:py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-muted-foreground hover:text-white transition-all border border-white/5 hover:border-white/10"
                        title={isPdfVisible ? "Show AI Tools" : "Show PDF"}
                    >
                        {isPdfVisible ? <PanelLeftClose size={14} className="md:w-4 md:h-4" /> : <PanelLeftOpen size={14} className="md:w-4 md:h-4" />}
                        <span className="inline">{isMobile ? (isPdfVisible ? 'Show Chat' : 'Show PDF') : (isPdfVisible ? 'Hide PDF' : 'Show PDF')}</span>
                    </button>

                    <div className="hidden md:block px-3 py-1.5 rounded-full bg-linear-to-r from-primary/10 to-secondary/10 border border-white/5 text-[10px] font-bold text-primary tracking-wider uppercase">
                        Nebula Workspace
                    </div>

                    <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-primary"
                        title="Share Notebook"
                    >
                        <Share2 size={18} />
                    </button>
                </div>
            </header>

            <ShareNotebookModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                notebookId={notebook._id}
                notebookTitle={notebook.title}
            />

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Background Grid */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
                </div>

                {/* Source Sidebar */}
                <SourceSidebar
                    sources={sources}
                    activeSourceId={activeSourceId}
                    selectedSourceIds={selectedSourceIds}
                    onSourceClick={setActiveSourceId}
                    onToggledSource={handleSourceToggle}
                    onAddSource={handleAddSource}
                    onAddYoutube={handleAddYoutube}
                    isAddingSource={isAddingSource}
                    loadingStep={loadingStep}
                    transcribeProgress={transcribeProgress}
                    videoInfo={videoInfo}
                />

                {/* Left Panel: Viewer (PDF or Word) */}
                <motion.div
                    initial={false}
                    animate={{
                        width: isMobile ? (isPdfVisible ? '100%' : '0%') : (isPdfVisible ? '40%' : '0%'),
                        opacity: isMobile ? (isPdfVisible ? 1 : 0) : (isPdfVisible ? 1 : 0),
                        display: isMobile ? (isPdfVisible ? 'block' : 'none') : (isPdfVisible ? 'block' : 'none')
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="shrink-0 border-r border-white/5 overflow-hidden bg-black/20 relative z-30"
                >
                    <div className="h-full w-full min-w-0">
                        {activeSourceType === 'docx' ? (
                            <WordViewer contentHtml={notebook.contentHtml || ''} notebookId={notebook._id} />
                        ) : activeSourceType === 'youtube' || activeSourceType === 'text' ? (
                            <TextViewer url={activePdfUrl} />
                        ) : (
                            <PDFViewer url={activePdfUrl} />
                        )}
                    </div>
                </motion.div>

                {/* Right Panel: AI Tools */}
                <motion.div
                    layout
                    animate={{
                        width: isMobile ? (isPdfVisible ? '0%' : '100%') : 'auto',
                        display: isMobile ? (isPdfVisible ? 'none' : 'block') : 'block'
                    }}
                    className="flex-1 min-w-0 bg-black/20 relative z-10 h-full"
                >
                    <AIToolsPanel
                        notebookId={notebook._id}
                        chatHistory={notebook.chatHistory}
                        sourceIds={selectedSourceIds} // Pass selected IDs to AI tools
                    />
                </motion.div>
            </div>
        </div>
    );
};

export default NotebookWorkspace;
