'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
    RotateCw, Trash2, ChevronLeft, ChevronRight, Maximize2, Minimize2,
    Download, Settings, Share2, ZoomIn, ZoomOut, MousePointer2, Pen,
    Highlighter, Eraser, Palette, Droplets, Sun, Check
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
    isMobile?: boolean;
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

const PDFViewer = ({ url, isMobile = false }: PDFViewerProps) => {
    const [numPages, setNumPages] = useState<number>(0);
    // Removed pageNumber state for vertical scrolling
    const [scale, setScale] = useState<number>(1.0);
    const [rotation, setRotation] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    const [activePage, setActivePage] = useState<number>(1); // To track which page is active for Undo/Redo
    const [currentPage, setCurrentPage] = useState<number>(1); // For display

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
    // Page tracking intersection observer
    useEffect(() => {
        if (!numPages || !containerRef.current) return;

        const observerOptions = {
            root: containerRef.current,
            threshold: 0.5, // 50% visibility
        };

        const callback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '1');
                    setCurrentPage(pageNum);
                    setActivePage(pageNum);
                }
            });
        };

        const observer = new IntersectionObserver(callback, observerOptions);

        // Wait for pages to render then observe
        const timer = setTimeout(() => {
            const pages = containerRef.current?.querySelectorAll('.pdf-page-container');
            pages?.forEach(page => observer.observe(page));
        }, 1000);

        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, [numPages, url]);

    return (
        <div className="flex flex-col h-full bg-[#0A0A0A] relative overflow-hidden group">
            <ResetAnnotationsModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                onConfirm={clearPage}
            />

            {/* Viewer Area */}
            <div
                className={`flex-1 overflow-auto flex justify-center relative ${isMobile ? 'p-2' : 'p-8'}`}
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
                            <div
                                key={`page_${index + 1}`}
                                className="pdf-page-container"
                                data-page-number={index + 1}
                            >
                                <PDFPage
                                    pageNumber={index + 1}
                                    scale={scale}
                                    rotation={rotation}
                                    activeTool={activeTool}
                                    activeColor={activeColor}
                                    paths={paths[index + 1] || []}
                                    onPathsChange={(newPaths) => handlePathsChange(index + 1, newPaths)}
                                    onPageInteract={() => setActivePage(index + 1)}
                                />
                            </div>
                        ))}
                    </Document>
                </div>
            </div>

            {/* Floating Dock Toolbar */}
            <AnimatePresence>
                {isToolbarVisible && (
                    <motion.div
                        initial={isMobile ? { y: 100 } : { y: 100, opacity: 0 }}
                        animate={isMobile ? { y: 0 } : { y: 0, opacity: 1 }}
                        className={`absolute z-50 ${isMobile ? 'left-0 right-0 bottom-0 w-full' : 'bottom-6 left-1/2 -translate-x-1/2 max-w-[95vw]'}`}
                    >
                        <div className={`${isMobile ? 'flex flex-col gap-4 px-6 py-5 rounded-t-[32px] bg-[#0A0A0A] border-t border-white/10 w-full shadow-[0_-10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl' : 'flex flex-row items-center gap-1.5 md:gap-2 p-1.5 md:p-2 rounded-2xl bg-[#1e1e1e]/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden min-w-fit justify-center'}`}>

                            {/* Mobile Grids or Desktop Row */}
                            <AnimatePresence mode="wait" initial={false}>
                                {isColorPickerOpen ? (
                                    <motion.div
                                        key="color-palette"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`flex items-center gap-4 ${isMobile ? 'flex-col w-full' : 'flex-row px-2'}`}
                                    >
                                        {isMobile && (
                                            <div className="w-full flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-white/50 pl-2">Select Color</span>
                                                <button
                                                    onClick={() => setIsColorPickerOpen(false)}
                                                    className="p-2 rounded-xl bg-white/5 text-white hover:bg-white/10"
                                                >
                                                    <ChevronLeft size={20} />
                                                </button>
                                            </div>
                                        )}

                                        <div className={`flex flex-wrap items-center justify-center gap-3 ${isMobile ? 'w-full' : ''}`}>
                                            {!isMobile && (
                                                <button
                                                    onClick={() => setIsColorPickerOpen(false)}
                                                    className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors mr-2"
                                                >
                                                    <ChevronLeft size={18} />
                                                </button>
                                            )}

                                            {COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => {
                                                        setActiveColor(c);
                                                        setIsColorPickerOpen(false);
                                                    }}
                                                    className={`rounded-full border border-white/10 transition-transform ${isMobile ? 'w-10 h-10' : 'w-8 h-8 hover:scale-110'} ${activeColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e1e1e] scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}

                                            {/* Custom Color Trigger & Sliders */}
                                            <div className={`flex flex-col gap-4 ${isMobile ? 'bg-white/5 p-5 rounded-[28px] w-full mt-2' : 'px-6 py-3 border-l border-white/10 min-w-[280px]'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`rounded-full border-2 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)] shrink-0 transition-all duration-300 ${isMobile ? 'w-16 h-16' : 'w-12 h-12'}`}
                                                        style={{ backgroundColor: activeColor }}
                                                    />
                                                    <div className="flex flex-col gap-5 flex-1">
                                                        {
                                                            (() => {
                                                                // Helper to get HSL values reliably from HEX or HSL
                                                                const getHsl = (color: string) => {
                                                                    if (color.startsWith('hsl')) {
                                                                        const m = color.match(/\d+/g);
                                                                        if (m) return { h: parseInt(m[0]), s: parseInt(m[1]), l: parseInt(m[2]) };
                                                                    }
                                                                    // Simple Hex to HSL
                                                                    let r = 0, g = 0, b = 0;
                                                                    if (color.startsWith('#')) {
                                                                        r = parseInt(color.slice(1, 3), 16) / 255;
                                                                        g = parseInt(color.slice(3, 5), 16) / 255;
                                                                        b = parseInt(color.slice(5, 7), 16) / 255;
                                                                    }
                                                                    const max = Math.max(r, g, b), min = Math.min(r, g, b);
                                                                    let h, s, l = (max + min) / 2;
                                                                    if (max === min) h = s = 0;
                                                                    else {
                                                                        const d = max - min;
                                                                        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                                                                        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
                                                                        else if (max === g) h = (b - r) / d + 2;
                                                                        else h = (r - g) / d + 4;
                                                                        h /= 6;
                                                                    }
                                                                    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
                                                                };

                                                                const { h, s, l } = getHsl(activeColor);

                                                                return (
                                                                    <>
                                                                        {/* Hue Slider */}
                                                                        <div className="flex items-center gap-3">
                                                                            <Palette size={14} className="text-white/40 shrink-0" />
                                                                            <div
                                                                                className="group relative h-3 flex-1 rounded-full shadow-inner px-2"
                                                                                style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
                                                                            >
                                                                                <input
                                                                                    type="range"
                                                                                    min="0"
                                                                                    max="360"
                                                                                    step="1"
                                                                                    value={h}
                                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                                    onChange={(e) => setActiveColor(`hsl(${e.target.value}, ${s}%, ${l}%)`)}
                                                                                />
                                                                                <motion.div
                                                                                    className="absolute top-1/2 w-5 h-5 rounded-full bg-white border-2 border-black/10 shadow-[0_2px_10px_rgba(0,0,0,0.5)] group-hover:scale-110 pointer-events-none z-20"
                                                                                    animate={{
                                                                                        left: `calc(8px + ${(h / 360) * 100}% - ${(h / 360) * 16}px)`,
                                                                                        y: '-50%',
                                                                                        x: '-50%'
                                                                                    }}
                                                                                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {/* Saturation Slider */}
                                                                        <div className="flex items-center gap-3">
                                                                            <Droplets size={14} className="text-white/40 shrink-0" />
                                                                            <div className="group relative h-3 flex-1 rounded-full bg-white/5 px-2">
                                                                                <div
                                                                                    className="absolute inset-0 rounded-full transition-colors duration-300"
                                                                                    style={{
                                                                                        background: `linear-gradient(to right, hsl(${h}, 0%, 50%), hsl(${h}, 100%, 50%))`
                                                                                    }}
                                                                                />
                                                                                <input
                                                                                    type="range"
                                                                                    min="0"
                                                                                    max="100"
                                                                                    step="1"
                                                                                    value={s}
                                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                                    onChange={(e) => setActiveColor(`hsl(${h}, ${e.target.value}%, ${l}%)`)}
                                                                                />
                                                                                <motion.div
                                                                                    className="absolute top-1/2 w-5 h-5 rounded-full bg-white border-2 border-black/10 shadow-[0_2px_10px_rgba(0,0,0,0.5)] group-hover:scale-110 pointer-events-none z-20"
                                                                                    animate={{
                                                                                        left: `calc(8px + ${(s / 100) * 100}% - ${(s / 100) * 16}px)`,
                                                                                        y: '-50%',
                                                                                        x: '-50%'
                                                                                    }}
                                                                                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {/* Lightness Slider */}
                                                                        <div className="flex items-center gap-3">
                                                                            <Sun size={14} className="text-white/40 shrink-0" />
                                                                            <div className="group relative h-3 flex-1 rounded-full bg-white/5 px-2">
                                                                                <div
                                                                                    className="absolute inset-0 rounded-full transition-colors duration-300"
                                                                                    style={{
                                                                                        background: `linear-gradient(to right, #000, hsl(${h}, ${s}%, 50%), #fff)`
                                                                                    }}
                                                                                />
                                                                                <input
                                                                                    type="range"
                                                                                    min="0"
                                                                                    max="100"
                                                                                    step="1"
                                                                                    value={l}
                                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                                    onChange={(e) => setActiveColor(`hsl(${h}, ${s}%, ${e.target.value}%)`)}
                                                                                />
                                                                                <motion.div
                                                                                    className="absolute top-1/2 w-5 h-5 rounded-full bg-white border-2 border-black/10 shadow-[0_2px_10px_rgba(0,0,0,0.5)] group-hover:scale-110 pointer-events-none z-20"
                                                                                    animate={{
                                                                                        left: `calc(8px + ${(l / 100) * 100}% - ${(l / 100) * 16}px)`,
                                                                                        y: '-50%',
                                                                                        x: '-50%'
                                                                                    }}
                                                                                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                );
                                                            })()
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="tools"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={isMobile ? 'flex flex-col gap-6 w-full' : 'flex items-center gap-2 overflow-x-auto no-scrollbar'}
                                    >
                                        {isMobile ? (
                                            // MOBILE LAYOUT
                                            <>
                                                {/* Top Row: Primary Tools */}
                                                <div className="flex items-center justify-between px-2">
                                                    {[
                                                        { id: 'cursor', icon: MousePointer2, label: 'Cursor' },
                                                        { id: 'pen', icon: Pen, label: 'Pen' },
                                                        { id: 'highlighter', icon: Highlighter, label: 'Highlighter' },
                                                        { id: 'eraser', icon: Eraser, label: 'Eraser' },
                                                    ].map((tool) => (
                                                        <button
                                                            key={tool.id}
                                                            onClick={() => setActiveTool(tool.id as Tool)}
                                                            className={`p-3.5 rounded-2xl transition-all relative group ${activeTool === tool.id ? 'bg-primary text-black shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] scale-110' : 'bg-white/5 text-white/70'}`}
                                                        >
                                                            <tool.icon size={22} className={activeTool === tool.id ? "fill-current" : ""} />
                                                        </button>
                                                    ))}

                                                    {/* Color Trigger (if needed next to tools) */}
                                                    {(activeTool === 'pen' || activeTool === 'highlighter') && (
                                                        <button
                                                            onClick={() => setIsColorPickerOpen(true)}
                                                            className="w-[50px] h-[50px] rounded-2xl border-2 border-white/20 flex items-center justify-center shadow-lg"
                                                            style={{ backgroundColor: activeColor }}
                                                        >
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white mix-blend-difference" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Bottom Row: Utilities */}
                                                <div className="flex items-center justify-between px-2 pt-2 border-t border-white/5">
                                                    {/* Zoom Group */}
                                                    <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-xl">
                                                        <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 rounded-lg hover:bg-white/10 text-white"><ZoomOut size={18} /></button>
                                                        <span className="text-xs font-mono font-bold min-w-[3ch] text-center">{Math.round(scale * 100)}%</span>
                                                        <button onClick={() => setScale(s => Math.min(3.0, s + 0.1))} className="p-2 rounded-lg hover:bg-white/10 text-white"><ZoomIn size={18} /></button>
                                                    </div>

                                                    {/* History Group */}
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={undo} disabled={(pageHistoryStep[activePage] ?? -1) < 0} className="p-3 rounded-xl bg-white/5 text-white disabled:opacity-30"><RotateCw size={18} className="-scale-x-100" /></button>
                                                        <button onClick={redo} disabled={(pageHistoryStep[activePage] ?? -1) >= (pageHistory[activePage]?.length || 0) - 1} className="p-3 rounded-xl bg-white/5 text-white disabled:opacity-30"><RotateCw size={18} /></button>
                                                    </div>

                                                    <button onClick={() => setIsResetModalOpen(true)} className="p-3 rounded-xl bg-red-500/10 text-red-400"><Trash2 size={18} /></button>

                                                    {/* Page Number Mobile */}
                                                    <div className="flex flex-col items-center bg-white/5 px-4 py-2 rounded-xl min-w-[80px]">
                                                        <span className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1">Page</span>
                                                        <span className="text-sm font-black text-white leading-none">{currentPage} <span className="text-white/30 text-[10px]">/ {numPages}</span></span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            // DESKTOP LAYOUT (Original)
                                            <>
                                                {/* Page Number Desktop */}
                                                <div className="flex flex-col items-center px-3 border-r border-white/10 shrink-0">
                                                    <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">Navigator</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-sm font-black text-white leading-none">{currentPage}</span>
                                                        <span className="text-[10px] font-bold text-muted-foreground leading-none">/ {numPages}</span>
                                                    </div>
                                                </div>

                                                {/* Zoom */}
                                                <div className="flex items-center gap-0.5 md:gap-1 px-1 md:px-2 border-r border-white/10 shrink-0">
                                                    <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 md:p-2 rounded-xl hover:bg-white/10 text-white transition-colors">
                                                        <ZoomOut size={16} className="md:w-[18px] md:h-[18px]" />
                                                    </button>
                                                    <span className="text-[10px] md:text-xs font-bold text-white min-w-10 md:min-w-12 text-center font-mono">{Math.round(scale * 100)}%</span>
                                                    <button onClick={() => setScale(s => Math.min(3.0, s + 0.1))} className="p-1.5 md:p-2 rounded-xl hover:bg-white/10 text-white transition-colors">
                                                        <ZoomIn size={16} className="md:w-[18px] md:h-[18px]" />
                                                    </button>
                                                </div>

                                                {/* Tools */}
                                                <div className="flex items-center gap-0.5 md:gap-1 px-1 md:px-2 border-r border-white/10 shrink-0">
                                                    {[
                                                        { id: 'cursor', icon: MousePointer2, label: 'Cursor' },
                                                        { id: 'pen', icon: Pen, label: 'Pen' },
                                                        { id: 'highlighter', icon: Highlighter, label: 'Highlighter' },
                                                        { id: 'eraser', icon: Eraser, label: 'Eraser' },
                                                    ].map((tool) => (
                                                        <button
                                                            key={tool.id}
                                                            onClick={() => setActiveTool(tool.id as Tool)}
                                                            className={`p-1.5 md:p-2 rounded-xl transition-all relative group ${activeTool === tool.id ? 'bg-primary text-black shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]' : 'hover:bg-white/10 text-white'}`}
                                                            title={tool.label}
                                                        >
                                                            <tool.icon size={16} className="md:w-[18px] md:h-[18px]" />
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Desktop Color Trigger */}
                                                <AnimatePresence>
                                                    {(activeTool === 'pen' || activeTool === 'highlighter') && (
                                                        <motion.div
                                                            initial={{ width: 0, opacity: 0, scale: 0 }}
                                                            animate={{ width: 'auto', opacity: 1, scale: 1 }}
                                                            exit={{ width: 0, opacity: 0, scale: 0 }}
                                                            className="flex items-center gap-1 px-1 md:px-2 border-r border-white/10 shrink-0 overflow-hidden"
                                                        >
                                                            <button
                                                                onClick={() => setIsColorPickerOpen(true)}
                                                                className="w-7 h-7 md:w-9 md:h-9 rounded-full border-2 border-white/20 flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                                                style={{ backgroundColor: activeColor }}
                                                            />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Actions */}
                                                <div className="flex items-center gap-0.5 md:gap-1 pl-1 md:pl-2 shrink-0">
                                                    <button onClick={undo} disabled={(pageHistoryStep[activePage] ?? -1) < 0} className="p-1.5 md:p-2 rounded-xl hover:bg-white/10 text-white disabled:opacity-30 transition-colors">
                                                        <RotateCw size={16} className="-scale-x-100 md:w-[18px] md:h-[18px]" />
                                                    </button>
                                                    <button onClick={redo} disabled={(pageHistoryStep[activePage] ?? -1) >= (pageHistory[activePage]?.length || 0) - 1} className="p-1.5 md:p-2 rounded-xl hover:bg-white/10 text-white disabled:opacity-30 transition-colors">
                                                        <RotateCw size={16} className="md:w-[18px] md:h-[18px]" />
                                                    </button>
                                                    <div className="w-px h-6 bg-white/10 mx-0.5 md:mx-1" />
                                                    <button onClick={() => setIsResetModalOpen(true)} className="p-1.5 md:p-2 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors">
                                                        <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                                                    </button>
                                                    <button onClick={() => setIsToolbarVisible(false)} className="p-1.5 md:p-2 rounded-xl hover:bg-white/10 text-white transition-colors ml-0.5 md:ml-1">
                                                        <ChevronLeft size={16} className="-rotate-90 md:w-[18px] md:h-[18px]" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
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
                        className={`absolute left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1e1e1e]/80 backdrop-blur-xl border border-white/10 text-white shadow-xl hover:bg-white/10 transition-colors flex items-center gap-2 ${isMobile ? 'bottom-6' : 'bottom-6'}`}
                    >
                        <Palette size={isMobile ? 20 : 16} />
                        <span className="text-xs font-bold">Show Tools</span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PDFViewer;
