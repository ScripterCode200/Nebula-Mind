'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
    ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
    RotateCw, RefreshCw, Pen, Eraser, Highlighter,
    Trash2, MousePointer2, Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ResetAnnotationsModal from '@/components/modals/ResetAnnotationsModal';
import PDFPage from './PDFPage';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker
// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PDFViewerProps {
    url: string;
}

type Tool = 'cursor' | 'pen' | 'highlighter' | 'eraser';

interface Point {
    x: number;
    y: number;
}

interface DrawingPath {
    tool: Tool;
    color: string;
    points: Point[];
    width: number;
}

const COLORS = [
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#000000', // Black
];

const PDFViewer = ({ url }: PDFViewerProps) => {
    const [numPages, setNumPages] = useState<number>(0);
    // Removed pageNumber state for vertical scrolling
    const [scale, setScale] = useState<number>(1.0);
    const [rotation, setRotation] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    const [activePage, setActivePage] = useState<number>(1); // To track which page is active for Undo/Redo

    useEffect(() => {
        setNumPages(0);
        setIsLoading(true);

        // DEBUG: Verify URL Access from Client
        // ... (logging kept same)
        if (url) {
            fetch(url)
                .then(async res => {
                    // ... (same logging)
                })
                .catch(err => console.error('PDFViewer Fetch Error:', err));
        }

    }, [url]);

    // Annotation State
    const [activeTool, setActiveTool] = useState<Tool>('cursor');
    const [activeColor, setActiveColor] = useState<string>(COLORS[0]);
    const [paths, setPaths] = useState<Record<number, DrawingPath[]>>({});

    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [notebookId, setNotebookId] = useState<string | null>(null);


    // History State
    const [pageHistory, setPageHistory] = useState<Record<number, DrawingPath[][]>>({});
    const [pageHistoryStep, setPageHistoryStep] = useState<Record<number, number>>({});

    const containerRef = useRef<HTMLDivElement>(null);

    // Extract notebookId from URL
    useEffect(() => {
        const match = window.location.pathname.match(/\/notebook\/([^\/]+)/);
        if (match) {
            setNotebookId(match[1]);
        }
    }, []);

    // Load annotations
    useEffect(() => {
        if (!notebookId) return;
        fetch(`/api/notebooks/${notebookId}/annotations`)
            .then(res => res.json())
            .then(data => {
                if (data.annotations) {
                    setPaths(data.annotations);
                }
            })
            .catch(err => console.error('Failed to load annotations:', err));
    }, [notebookId]);

    // Save annotations (debounced)
    useEffect(() => {
        if (!notebookId) return;
        const timeout = setTimeout(() => {
            fetch(`/api/notebooks/${notebookId}/annotations`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ annotations: paths })
            }).catch(err => console.error('Failed to save annotations:', err));
        }, 1000);
        return () => clearTimeout(timeout);
    }, [paths, notebookId]);

    // ... (notebook extraction and annotation loading/saving same)

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setIsLoading(false);
    }

    // Helper to update paths for a specific page
    const handlePathsChange = (page: number, newPaths: DrawingPath[]) => {
        setPaths(prev => ({
            ...prev,
            [page]: newPaths
        }));

        // Save to history
        setPageHistory(prev => {
            const currentStep = pageHistoryStep[page] ?? -1;
            const currentHistory = prev[page] || [];
            const newHistory = currentHistory.slice(0, currentStep + 1);
            return {
                ...prev,
                [page]: [...newHistory, newPaths]
            };
        });
        setPageHistoryStep(prev => ({
            ...prev,
            [page]: (prev[page] ?? -1) + 1
        }));
        setActivePage(page); // Make this page active on interaction
    };


    const undo = () => {
        const page = activePage; // Act heavily on "activePage"
        const currentStep = pageHistoryStep[page] ?? -1;
        if (currentStep < 0) return;

        const newStep = currentStep - 1;
        const history = pageHistory[page] || [];

        let prevPaths: DrawingPath[] = [];
        if (newStep >= 0) {
            prevPaths = history[newStep];
        } else {
            prevPaths = [];
        }

        setPaths(prev => ({ ...prev, [page]: prevPaths }));
        setPageHistoryStep(prev => ({ ...prev, [page]: newStep }));
    };

    const redo = () => {
        const page = activePage;
        const currentStep = pageHistoryStep[page] ?? -1;
        const history = pageHistory[page] || [];
        if (currentStep >= history.length - 1) return;

        const newStep = currentStep + 1;
        const nextPaths = history[newStep];

        setPaths(prev => ({ ...prev, [page]: nextPaths }));
        setPageHistoryStep(prev => ({ ...prev, [page]: newStep }));
    };

    const clearPage = () => {
        // Clear ACTIVE page
        setPaths(prev => ({
            ...prev,
            [activePage]: []
        }));
        // TODO: Add clear to history?
    };

    // Custom Cursors (Global fallback) - mostly handled in PDFPage now, but useful for container
    // ...

    const [isToolbarVisible, setIsToolbarVisible] = useState(true);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

    // Import PDFPage dynamically or normally? Normally is fine.
    // Need to import PDFPage from './PDFPage'

    return (
        <div className="flex flex-col h-full bg-[#0A0A0A] relative overflow-hidden group">
            <ResetAnnotationsModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                onConfirm={clearPage}
            />

            {/* Viewer Area */}
            <div
                className="flex-1 overflow-auto flex justify-center p-8 relative"
                data-lenis-prevent
                ref={containerRef}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] bg-size-[16px_16px]" />
                </div>

                <div className="flex flex-col gap-8 items-center z-10 w-full max-w-4xl">
                    <Document
                        file={url}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                            <div className="absolute inset-0 flex items-center justify-center z-10 text-white">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    <p className="text-sm text-muted-foreground animate-pulse">Loading Document...</p>
                                </div>
                            </div>
                        }
                        className="flex flex-col items-center gap-8 w-full"
                    >
                        {/* Render All Pages */}
                        {Array.from(new Array(numPages), (el, index) => (
                            <PDFPage
                                key={`page_${index + 1}`}
                                pageNumber={index + 1}
                                scale={scale}
                                rotation={rotation}
                                activeTool={activeTool}
                                activeColor={activeColor}
                                paths={paths[index + 1] || []}
                                onPathsChange={(newPaths) => handlePathsChange(index + 1, newPaths)}
                                onPageInteract={() => setActivePage(index + 1)}
                            />
                        ))}
                    </Document>
                </div>
            </div>

            {/* Floating Dock Toolbar */}
            <AnimatePresence>
                {isToolbarVisible && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[95vw]"
                    >
                        <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#1e1e1e]/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden min-w-[300px] justify-center">
                            <AnimatePresence mode="wait" initial={false}>
                                {isColorPickerOpen ? (
                                    // ... Color Picker (Same)
                                    <motion.div
                                        key="color-palette"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className="flex items-center gap-3 px-2"
                                    >
                                        <button
                                            onClick={() => setIsColorPickerOpen(false)}
                                            className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors mr-2"
                                            title="Back to Tools"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>

                                        <div className="flex items-center gap-2">
                                            {COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => {
                                                        setActiveColor(c);
                                                        setIsColorPickerOpen(false);
                                                    }}
                                                    className={`w-8 h-8 rounded-full border border-white/10 transition-transform hover:scale-110 ${activeColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e1e1e] scale-110' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>

                                        <div className="w-px h-6 bg-white/10 mx-1" />

                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="color"
                                                value={activeColor}
                                                onChange={(e) => setActiveColor(e.target.value)}
                                                className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-0 p-0 absolute opacity-0"
                                            />
                                            <div
                                                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-[conic-gradient(from_180deg_at_50%_50%,#FF0000_0deg,#00FF00_120deg,#0000FF_240deg,#FF0000_360deg)]"
                                                title="Custom Color"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-[#1e1e1e]" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="tools"
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="flex items-center gap-2 overflow-x-auto no-scrollbar"
                                    >
                                        {/* REMOVED: Page Nav */}

                                        {/* Zoom */}
                                        <div className="flex items-center gap-1 px-2 border-r border-white/10 shrink-0">
                                            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors">
                                                <ZoomOut size={18} />
                                            </button>
                                            <span className="text-xs font-bold text-white min-w-12 text-center font-mono">{Math.round(scale * 100)}%</span>
                                            <button onClick={() => setScale(s => Math.min(3.0, s + 0.1))} className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors">
                                                <ZoomIn size={18} />
                                            </button>
                                        </div>

                                        {/* Tools */}
                                        <div className="flex items-center gap-1 px-2 border-r border-white/10 shrink-0">
                                            {[
                                                { id: 'cursor', icon: MousePointer2, label: 'Cursor' },
                                                { id: 'pen', icon: Pen, label: 'Pen' },
                                                { id: 'highlighter', icon: Highlighter, label: 'Highlighter' },
                                                { id: 'eraser', icon: Eraser, label: 'Eraser' },
                                            ].map((tool) => (
                                                <button
                                                    key={tool.id}
                                                    onClick={() => setActiveTool(tool.id as Tool)}
                                                    className={`p-2 rounded-xl transition-all relative group ${activeTool === tool.id ? 'bg-primary text-black shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]' : 'hover:bg-white/10 text-white'}`}
                                                    title={tool.label}
                                                >
                                                    <tool.icon size={18} />
                                                    {activeTool === tool.id && (
                                                        <motion.div
                                                            layoutId="activeToolGlow"
                                                            className="absolute inset-0 rounded-xl bg-white/20 blur-sm -z-10"
                                                        />
                                                    )}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Color Picker Toggle (Conditional) */}
                                        <AnimatePresence>
                                            {(activeTool === 'pen' || activeTool === 'highlighter') && (
                                                <motion.div
                                                    initial={{ width: 0, opacity: 0, scale: 0 }}
                                                    animate={{ width: 'auto', opacity: 1, scale: 1 }}
                                                    exit={{ width: 0, opacity: 0, scale: 0 }}
                                                    className="flex items-center gap-1 px-2 border-r border-white/10 shrink-0 overflow-hidden"
                                                >
                                                    <button
                                                        onClick={() => setIsColorPickerOpen(true)}
                                                        className="w-9 h-9 rounded-full border-2 border-white/20 flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                                        style={{ backgroundColor: activeColor }}
                                                        title="Color"
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 pl-2 shrink-0">
                                            <button onClick={undo} disabled={(pageHistoryStep[activePage] ?? -1) < 0} className="p-2 rounded-xl hover:bg-white/10 text-white disabled:opacity-30 transition-colors">
                                                <RotateCw size={18} className="-scale-x-100" />
                                            </button>
                                            <button onClick={redo} disabled={(pageHistoryStep[activePage] ?? -1) >= (pageHistory[activePage]?.length || 0) - 1} className="p-2 rounded-xl hover:bg-white/10 text-white disabled:opacity-30 transition-colors">
                                                <RotateCw size={18} />
                                            </button>
                                            <div className="w-px h-6 bg-white/10 mx-1" />
                                            <button onClick={() => setIsResetModalOpen(true)} className="p-2 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                            <button onClick={() => setIsToolbarVisible(false)} className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors ml-1">
                                                <ChevronLeft size={18} className="-rotate-90" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Show Toolbar Button (when hidden) */}
            {/* ... same ... */}
            <AnimatePresence>
                {!isToolbarVisible && (
                    <motion.button
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        onClick={() => setIsToolbarVisible(true)}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1e1e1e]/80 backdrop-blur-xl border border-white/10 text-white shadow-xl hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                        <Palette size={16} />
                        <span className="text-xs font-bold">Show Tools</span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PDFViewer;
