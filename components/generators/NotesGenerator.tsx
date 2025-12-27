
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Sparkles, Download, Copy, ChevronUp, ChevronDown, ChevronLeft, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import NeonButton from '@/components/ui/NeonButton';
import GlassCard from '@/components/ui/GlassCard';

import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import FuturisticLoader from '@/components/ui/FuturisticLoader';

interface NotesGeneratorProps {
    notebookId: string;
    modelProvider: string;
}

const NotesGenerator = ({ notebookId, modelProvider }: NotesGeneratorProps) => {
    const [type, setType] = useState<'brief' | 'detailed' | 'bullet-points'>('detailed');
    const [notes, setNotes] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

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
                className={`bg-black/90 md:bg-black/20 backdrop-blur-xl md:backdrop-blur-none border-r border-white/5 flex flex-col shrink-0 overflow-hidden absolute md:relative z-30 h-full`}
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
                <div className="shrink-0 p-4 md:p-8 pb-0">
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
                            <GlassCard className="overflow-hidden flex flex-col relative group border-primary/30 bg-black/40 backdrop-blur-xl shadow-[0_0_30px_rgba(0,240,255,0.15)]">
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
                                            if (isDownloading) return;
                                            setIsDownloading(true);
                                            const downloadToast = toast.loading('Generating professional PDF...');

                                            setTimeout(async () => {
                                                try {
                                                    const { jsPDF } = await import('jspdf');
                                                    const autoTable = (await import('jspdf-autotable')).default;
                                                    const doc = new jsPDF({
                                                        orientation: 'p',
                                                        unit: 'mm',
                                                        format: 'a4',
                                                    });

                                                    const margin = 20;
                                                    const pageWidth = doc.internal.pageSize.getWidth();
                                                    const pageHeight = doc.internal.pageSize.getHeight();
                                                    const maxWidth = pageWidth - (margin * 2);
                                                    let cursorY = margin;

                                                    doc.setFont('Helvetica', 'normal');
                                                    doc.setFontSize(16);
                                                    doc.setTextColor(0, 0, 0);

                                                    const lines = notes.split('\n');

                                                    const renderWrappedText = (text: string, xOffset: number, size: number, isHeader = false) => {
                                                        doc.setFontSize(size);
                                                        const words = text.split(/(\*\*.*?\*\*|\s+)/g).filter(Boolean);
                                                        let currentX = xOffset;
                                                        const lineHeight = size * 0.5 + 2;

                                                        const checkPageBreak = () => {
                                                            if (cursorY > pageHeight - margin) {
                                                                doc.addPage();
                                                                cursorY = margin;
                                                                return true;
                                                            }
                                                            return false;
                                                        };

                                                        words.forEach(word => {
                                                            const isBoldMarker = word.startsWith('**') && word.endsWith('**');
                                                            const cleanWord = isBoldMarker ? word.substring(2, word.length - 2) : word;

                                                            doc.setFont('Helvetica', (isBoldMarker || isHeader) ? 'bold' : 'normal');
                                                            const wordWidth = doc.getTextWidth(cleanWord);

                                                            if (currentX + wordWidth > pageWidth - margin && currentX > xOffset) {
                                                                cursorY += lineHeight;
                                                                currentX = xOffset;
                                                                checkPageBreak();
                                                            }

                                                            doc.text(cleanWord, currentX, cursorY);
                                                            currentX += wordWidth;
                                                        });

                                                        cursorY += lineHeight + 2;
                                                    };

                                                    let i = 0;
                                                    while (i < lines.length) {
                                                        const line = lines[i];
                                                        const trimmed = line.trim();

                                                        if (!trimmed && cursorY > margin) {
                                                            cursorY += 5;
                                                            i++;
                                                            continue;
                                                        }

                                                        if (cursorY > pageHeight - margin - 15) {
                                                            doc.addPage();
                                                            cursorY = margin;
                                                        }

                                                        // Table Detection: Improved regex for headers and separators
                                                        const isSeparatorRow = (str: string) => str.trim().match(/^\s*\|?\s*([:-]+\s*\|?\s*)+\s*$/);
                                                        const isTableLine = (str: string) => str.trim().includes('|');
                                                        const matchesTableStart = isTableLine(line) && i + 1 < lines.length && isSeparatorRow(lines[i + 1]);

                                                        if (matchesTableStart) {
                                                            const tableRows: string[][] = [];
                                                            let j = i;

                                                            // Collect all rows that look like table rows
                                                            while (j < lines.length && (isTableLine(lines[j]) || isSeparatorRow(lines[j]))) {
                                                                const rowLine = lines[j].trim();
                                                                // Skip only the separator row
                                                                if (!isSeparatorRow(rowLine)) {
                                                                    const cells = rowLine.split('|')
                                                                        .map(c => c.trim())
                                                                        .filter((c, idx, arr) => {
                                                                            // Remove empty cells only if they are at the edges (caused by leading/trailing pipes)
                                                                            if ((idx === 0 || idx === arr.length - 1) && c === '') return false;
                                                                            return true;
                                                                        });

                                                                    if (cells.length > 0) tableRows.push(cells);
                                                                }
                                                                j++;
                                                            }

                                                            if (tableRows.length > 0) {
                                                                const headers = tableRows[0];
                                                                const body = tableRows.slice(1);

                                                                autoTable(doc, {
                                                                    head: [headers],
                                                                    body: body,
                                                                    startY: cursorY,
                                                                    margin: { left: margin, right: margin },
                                                                    styles: {
                                                                        fontSize: 8.5,
                                                                        cellPadding: 2.5,
                                                                        lineColor: [180, 180, 180],
                                                                        lineWidth: 0.1,
                                                                        font: 'Helvetica'
                                                                    },
                                                                    headStyles: {
                                                                        fillColor: [60, 60, 60],
                                                                        textColor: [255, 255, 255],
                                                                        fontStyle: 'bold',
                                                                        halign: 'center'
                                                                    },
                                                                    columnStyles: {
                                                                        0: { fontStyle: 'bold' } // Often the first column is a label
                                                                    },
                                                                    alternateRowStyles: {
                                                                        fillColor: [248, 248, 248]
                                                                    },
                                                                    theme: 'grid'
                                                                });

                                                                cursorY = (doc as any).lastAutoTable.finalY + 10;
                                                                i = j;
                                                                continue;
                                                            }
                                                        }

                                                        if (trimmed.startsWith('# ')) {
                                                            renderWrappedText(trimmed.substring(2), margin, 22, true);
                                                        } else if (trimmed.startsWith('## ')) {
                                                            renderWrappedText(trimmed.substring(3), margin, 18, true);
                                                        } else if (trimmed.startsWith('### ')) {
                                                            renderWrappedText(trimmed.substring(4), margin, 14, true);
                                                        } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
                                                            doc.setFont('Helvetica', 'normal');
                                                            doc.setFontSize(12);
                                                            doc.text('•', margin + 2, cursorY);
                                                            renderWrappedText(trimmed.substring(2), margin + 7, 12);
                                                        } else {
                                                            renderWrappedText(trimmed, margin, 12);
                                                        }
                                                        i++;
                                                    }

                                                    doc.save(`notes-${notebookId}.pdf`);
                                                    toast.dismiss(downloadToast);
                                                    toast.success('Downloaded professional PDF');
                                                } catch (error) {
                                                    console.error('PDF generation failed:', error);
                                                    toast.dismiss(downloadToast);
                                                    toast.error('Failed to generate PDF document.');
                                                } finally {
                                                    setIsDownloading(false);
                                                }
                                            }, 100);
                                        }}
                                        disabled={isDownloading}
                                        className={cn(
                                            "p-2 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white transition-colors",
                                            isDownloading && "opacity-50 cursor-not-allowed"
                                        )}
                                        title="Download PDF"
                                    >
                                        {isDownloading ? (
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Download size={16} />
                                        )}
                                    </button>
                                </div>

                                <div id="markdown-content" className="p-6 md:p-10 bg-black text-white">
                                    <div className="prose prose-invert prose-lg max-w-none 
                                        prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-white
                                        prose-h1:text-4xl prose-h1:mb-8 prose-h1:border-b prose-h1:border-[#ffffff1a] prose-h1:pb-4
                                        prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-[#00F0FFE6]
                                        prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-secondary
                                        prose-p:text-gray-300 prose-p:leading-loose prose-p:font-serif prose-p:text-lg
                                        prose-li:text-gray-300 prose-li:font-serif prose-li:text-lg
                                        prose-strong:text-white prose-strong:font-semibold
                                        prose-code:text-primary prose-code:bg-[#00F0FF1A] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                                        prose-pre:bg-[#00000080] prose-pre:border prose-pre:border-[#ffffff1a] prose-pre:rounded-xl
                                        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-[#ffffff0d] prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-gray-400
                                        ">
                                        <ReactMarkdown
                                            rehypePlugins={[rehypeHighlight]}
                                            remarkPlugins={[remarkGfm]}
                                        >
                                            {notes}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground/50 border-2 border-dashed border-white/5 rounded-2xl bg-white/2 h-64">
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
