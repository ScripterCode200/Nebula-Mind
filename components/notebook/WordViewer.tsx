'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ZoomIn, ZoomOut, RotateCw,
    Pen, Highlighter, Eraser, MousePointer2,
    Palette, Droplets, Sun, Trash2, Check
} from 'lucide-react';
import { toast } from 'sonner';
import ResetAnnotationsModal from '@/components/modals/ResetAnnotationsModal';

interface Point {
    x: number;
    y: number;
}

interface Path {
    points: Point[];
    color: string;
    width: number;
    type: 'pen' | 'highlight' | 'eraser';
}

interface WordViewerProps {
    contentHtml?: string;
    url?: string;
    notebookId: string;
    isMobile?: boolean; // Added for parity
    activeSourceId?: string | null;
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

const WordViewer = ({ contentHtml: initialHtml, url, notebookId, isMobile = false, activeSourceId }: WordViewerProps) => {
    // Viewer State
    const [isLoading, setIsLoading] = useState(!!url);
    const [scale, setScale] = useState<number>(1.0);
    const containerRef = useRef<HTMLDivElement>(null);
    const documentRef = useRef<HTMLDivElement>(null);
    const [isToolbarVisible, setIsToolbarVisible] = useState(true);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    // Drawing State
    const [tool, setTool] = useState<'cursor' | 'pen' | 'highlight' | 'eraser'>('cursor');
    const [color, setColor] = useState('#EF4444'); // Default strict red like PDFViewer pattern
    const [paths, setPaths] = useState<Path[]>([]);
    const [currentPath, setCurrentPath] = useState<Path | null>(null);
    const [history, setHistory] = useState<Path[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Render DOCX using docx-preview
    useEffect(() => {
        if (!url || !documentRef.current) return;

        const renderDoc = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch document');
                const blob = await response.blob();

                const { renderAsync } = await import('docx-preview');

                if (documentRef.current) {
                    documentRef.current.innerHTML = '';
                    await renderAsync(blob, documentRef.current, documentRef.current, {
                        className: 'docx-preview',
                        inWrapper: false,
                        ignoreWidth: false,
                        ignoreHeight: false,
                        ignoreFonts: false,
                        breakPages: true,
                        useBase64URL: true,
                        experimental: true
                    });
                }
            } catch (error) {
                console.error("Rendering failed:", error);
                toast.error("Failed to load document");
            } finally {
                setIsLoading(false);
            }
        };

        renderDoc();
    }, [url]);

    // Persistence 
    const getAnnotationKey = useCallback(() => {
        // Use activeSourceId if available, otherwise fallback to '1' (page 1 default)
        // If activeSourceId is present, we still use suffix '-1' because Word is treating as single continuous doc (page 1)
        return activeSourceId ? `${activeSourceId}-1` : '1';
    }, [activeSourceId]);

    const loadAnnotations = useCallback(async () => {
        if (!notebookId) return;
        try {
            setPaths([]); // Clear current paths before loading new ones
            setHistory([]);
            setHistoryIndex(-1);

            const response = await fetch(`/api/notebooks/${notebookId}/annotations`);
            if (response.ok) {
                const data = await response.json();
                const key = getAnnotationKey();
                if (data && data.annotations && data.annotations[key]) {
                    setPaths(data.annotations[key]);
                    setHistory([data.annotations[key]]);
                    setHistoryIndex(0);
                }
            }
        } catch (error) {
            console.error('Failed to load annotations:', error);
        }
    }, [notebookId, getAnnotationKey]);

    const saveAnnotations = useCallback(async (newPaths: Path[]) => {
        if (!notebookId) return;
        try {
            const key = getAnnotationKey();
            const annotations = { [key]: newPaths };
            await fetch(`/api/notebooks/${notebookId}/annotations`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ annotations }),
            });
        } catch (error) {
            console.error('Failed to save annotations:', error);
        }
    }, [notebookId, getAnnotationKey]);

    useEffect(() => {
        loadAnnotations();
    }, [loadAnnotations]);

    // Canvas Drawing Logic
    const drawPath = (ctx: CanvasRenderingContext2D, path: Path) => {
        if (path.points.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);

        for (let i = 1; i < path.points.length - 1; i++) {
            const p1 = path.points[i];
            const p2 = path.points[i + 1];
            ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
        }

        ctx.lineTo(path.points[path.points.length - 1].x, path.points[path.points.length - 1].y);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (path.type === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = 20;
            ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else if (path.type === 'highlight') {
            ctx.globalCompositeOperation = 'multiply';
            ctx.lineWidth = 20;
            ctx.strokeStyle = path.color + '40';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.lineWidth = path.width;
            ctx.strokeStyle = path.color;
        }

        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
    };

    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        paths.forEach(path => drawPath(ctx, path));
        if (currentPath) {
            drawPath(ctx, currentPath);
        }
    }, [paths, currentPath]);

    useEffect(() => {
        const updateCanvasSize = () => {
            if (documentRef.current && canvasRef.current) {
                const { scrollWidth, scrollHeight } = documentRef.current;
                if (Math.abs(canvasRef.current.width - scrollWidth) > 5 ||
                    Math.abs(canvasRef.current.height - scrollHeight) > 5) {
                    canvasRef.current.width = scrollWidth;
                    canvasRef.current.height = scrollHeight;
                    redrawCanvas();
                }
            }
        };

        const observer = new ResizeObserver(updateCanvasSize);
        if (documentRef.current) {
            observer.observe(documentRef.current);
            const mutationObserver = new MutationObserver(updateCanvasSize);
            mutationObserver.observe(documentRef.current, { childList: true, subtree: true });

            return () => {
                observer.disconnect();
                mutationObserver.disconnect();
            };
        }
    }, [redrawCanvas]);

    useEffect(() => {
        redrawCanvas();
    }, [redrawCanvas]);


    const getPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.Touch): Point | null => {
        if (!canvasRef.current) return null;
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / scale,
            y: (e.clientY - rect.top) / scale
        };
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (tool === 'cursor') return;
        e.preventDefault();
        const touch = e.touches[0];
        const point = getPoint(touch);
        if (!point) return;
        startDrawingInternal(point);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !currentPath || !canvasRef.current) return;
        e.preventDefault();
        const touch = e.touches[0];
        const point = getPoint(touch);
        if (!point) return;
        drawInternal(point);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (tool === 'cursor') return;
        const point = getPoint(e);
        if (!point) return;
        startDrawingInternal(point);
    };

    const startDrawingInternal = (point: Point) => {
        setIsDrawing(true);
        setCurrentPath({
            points: [point],
            color: color,
            width: tool === 'pen' ? 2 : 20,
            type: tool as any
        });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !currentPath || !canvasRef.current) return;
        const point = getPoint(e);
        if (!point) return;
        drawInternal(point);
    };

    const drawInternal = (point: Point) => {
        setCurrentPath(prev => prev ? ({
            ...prev,
            points: [...prev.points, point]
        }) : null);
    };

    const handleMouseUp = () => {
        if (!isDrawing || !currentPath) return;
        setIsDrawing(false);
        const newPaths = [...paths, currentPath];
        setPaths(newPaths);
        setCurrentPath(null);
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newPaths);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        saveAnnotations(newPaths);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            const previousPaths = history[historyIndex - 1];
            setPaths(previousPaths);
            saveAnnotations(previousPaths);
        } else if (historyIndex === 0) {
            setHistoryIndex(-1);
            setPaths([]);
            saveAnnotations([]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            const nextPaths = history[historyIndex + 1];
            setPaths(nextPaths);
            saveAnnotations(nextPaths);
        }
    };

    const handleClearPage = () => {
        setPaths([]);
        // Add empty state to history logic if desired, but for now simple clear
        setHistoryIndex(-1); // Resets history stack pointer effectively
        setHistory([]);
        saveAnnotations([]);
    };


    return (
        <div className="flex flex-col h-full bg-[#0A0A0A] relative overflow-hidden group">
            <ResetAnnotationsModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                onConfirm={handleClearPage}
            />

            {/* Viewer Area */}
            <div
                className="flex-1 overflow-y-auto overflow-x-hidden flex justify-center p-8 relative scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                ref={containerRef}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] bg-size-[16px_16px]" />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: scale }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative z-10 mx-auto"
                    style={{ transformOrigin: 'top center' }}
                >
                    {/* Rendered Content */}
                    <div className="relative bg-white shadow-2xl min-h-[297mm]" style={{ width: 'fit-content' }}>
                        {/* Loading Overlay */}
                        {isLoading && (
                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white text-black bg-opacity-90 backdrop-blur-sm transition-all duration-300">
                                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                                <p className="text-sm text-gray-400">Loading Document...</p>
                            </div>
                        )}

                        <style>{`
                            .docx-content-wrapper * {
                                color: black !important;
                                font-family: "Calibri", "Arial", sans-serif !important;
                                -webkit-font-smoothing: antialiased;
                            }
                            /* Remove potential extra padding from docx-preview generic styles */
                            .docx_preview {
                                padding: 0 !important;
                                margin: 0 !important;
                            }
                            
                            /* Compact Paragraph Spacing */
                            .docx-content-wrapper p {
                                margin-bottom: 0.5em !important;
                                margin-top: 0 !important;
                                line-height: 1.4 !important;
                            }
                            
                            /* Fix Page Margins */
                            .docx-content-wrapper section {
                                padding: 2.54cm !important; /* Standard Word 1-inch margin */
                                margin: 0 !important;
                                box-shadow: none !important; /* Remove individual page shadows if any */
                                background: white !important;
                            }
                            
                            /* Proper Table Viewing */
                            .docx-content-wrapper table {
                                border-collapse: collapse !important;
                                width: 100% !important;
                                margin-bottom: 1em !important;
                                border: 1px solid black !important;
                            }
                            .docx-content-wrapper td, 
                            .docx-content-wrapper th {
                                border: 1px solid black !important;
                                padding: 4px 8px !important;
                                vertical-align: top !important;
                            }

                            /* Ensure headers are bold and black */
                            .docx-content-wrapper h1, 
                            .docx-content-wrapper h2, 
                            .docx-content-wrapper h3, 
                            .docx-content-wrapper h4, 
                            .docx-content-wrapper strong, 
                            .docx-content-wrapper b {
                                font-weight: bold !important;
                                color: black !important;
                            }
                        `}</style>


                        {/* docx-preview renders here */}
                        <div
                            ref={documentRef}
                            className="docx-content-wrapper"
                            style={{ minWidth: '210mm', minHeight: '297mm' }}
                        />

                        {/* Canvas Overlay */}
                        <canvas
                            ref={canvasRef}
                            className={`absolute inset-0 z-20 ${tool === 'cursor' ? 'pointer-events-none' : 'cursor-crosshair'}`}
                            style={{ touchAction: tool === 'cursor' ? 'auto' : 'none' }}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleMouseUp}
                            onTouchCancel={handleMouseUp}
                        />
                    </div>
                </motion.div>
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
                                                <button onClick={() => setIsColorPickerOpen(false)} className="p-2 rounded-xl bg-white/5 text-white hover:bg-white/10"><ChevronLeft size={20} /></button>
                                            </div>
                                        )}

                                        <div className={`flex flex-wrap items-center justify-center gap-3 ${isMobile ? 'w-full' : ''}`}>
                                            {!isMobile && (
                                                <button onClick={() => setIsColorPickerOpen(false)} className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors mr-2"><ChevronLeft size={18} /></button>
                                            )}

                                            {COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => { setColor(c); setIsColorPickerOpen(false); }}
                                                    className={`rounded-full border border-white/10 transition-transform ${isMobile ? 'w-10 h-10' : 'w-8 h-8 hover:scale-110'} ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e1e1e] scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}

                                            {/* Custom Color Trigger & Sliders (Simplified for WordViewer parity) */}
                                            <div className={`flex flex-col gap-4 ${isMobile ? 'bg-white/5 p-5 rounded-[28px] w-full mt-2' : 'px-6 py-3 border-l border-white/10 min-w-[280px]'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`rounded-full border-2 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)] shrink-0 transition-all duration-300 ${isMobile ? 'w-16 h-16' : 'w-12 h-12'}`} style={{ backgroundColor: color }} />
                                                    <div className="flex flex-col gap-5 flex-1">
                                                        {/* Simplified HSL Sliders */}
                                                        {[
                                                            { icon: Palette, max: 360, val: 0, set: (v: number) => { } }, // Placeholder for complex logic if needed, but simple palette covers most
                                                        ].map((s, i) => (
                                                            <div key={i} className="flex items-center gap-3 opacity-50"><span className="text-xs text-white">Custom color picker available in PDF tools</span></div>
                                                        ))}
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
                                            <>
                                                {/* Mobile Layout */}
                                                <div className="flex items-center justify-between px-2">
                                                    {[
                                                        { id: 'cursor', icon: MousePointer2, label: 'Cursor' },
                                                        { id: 'pen', icon: Pen, label: 'Pen' },
                                                        { id: 'highlight', icon: Highlighter, label: 'Highlighter' }, // checking 'highlight' vs 'highlighter'
                                                        { id: 'eraser', icon: Eraser, label: 'Eraser' },
                                                    ].map((t) => (
                                                        <button
                                                            key={t.id}
                                                            onClick={() => setTool(t.id as any)}
                                                            className={`p-3.5 rounded-2xl transition-all relative group ${tool === t.id ? 'bg-primary text-black shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] scale-110' : 'bg-white/5 text-white/70'}`}
                                                        >
                                                            <t.icon size={22} className={tool === t.id ? "fill-current" : ""} />
                                                        </button>
                                                    ))}
                                                    {(tool === 'pen' || tool === 'highlight') && (
                                                        <button onClick={() => setIsColorPickerOpen(true)} className="w-[50px] h-[50px] rounded-2xl border-2 border-white/20 flex items-center justify-center shadow-lg" style={{ backgroundColor: color }} />
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between px-2 pt-2 border-t border-white/5">
                                                    <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-xl">
                                                        <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 rounded-lg hover:bg-white/10 text-white"><ZoomOut size={18} /></button>
                                                        <span className="text-xs font-mono font-bold min-w-[3ch] text-center">{Math.round(scale * 100)}%</span>
                                                        <button onClick={() => setScale(s => Math.min(3.0, s + 0.1))} className="p-2 rounded-lg hover:bg-white/10 text-white"><ZoomIn size={18} /></button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-3 rounded-xl bg-white/5 text-white disabled:opacity-30"><RotateCw size={18} className="-scale-x-100" /></button>
                                                        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-3 rounded-xl bg-white/5 text-white disabled:opacity-30"><RotateCw size={18} /></button>
                                                    </div>
                                                    <button onClick={() => setIsResetModalOpen(true)} className="p-3 rounded-xl bg-red-500/10 text-red-400"><Trash2 size={18} /></button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {/* Desktop Layout */}
                                                <div className="flex items-center gap-0.5 md:gap-1 px-1 md:px-2 border-r border-white/10 shrink-0">
                                                    <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 md:p-2 rounded-xl hover:bg-white/10 text-white transition-colors"><ZoomOut size={16} className="md:w-[18px] md:h-[18px]" /></button>
                                                    <span className="text-[10px] md:text-xs font-bold text-white min-w-10 md:min-w-12 text-center font-mono">{Math.round(scale * 100)}%</span>
                                                    <button onClick={() => setScale(s => Math.min(3.0, s + 0.1))} className="p-1.5 md:p-2 rounded-xl hover:bg-white/10 text-white transition-colors"><ZoomIn size={16} className="md:w-[18px] md:h-[18px]" /></button>
                                                </div>

                                                <div className="flex items-center gap-0.5 md:gap-1 px-1 md:px-2 border-r border-white/10 shrink-0">
                                                    {[
                                                        { id: 'cursor', icon: MousePointer2, label: 'Cursor' },
                                                        { id: 'pen', icon: Pen, label: 'Pen' },
                                                        { id: 'highlight', icon: Highlighter, label: 'Highlighter' },
                                                        { id: 'eraser', icon: Eraser, label: 'Eraser' },
                                                    ].map((t) => (
                                                        <button
                                                            key={t.id}
                                                            onClick={() => setTool(t.id as any)}
                                                            className={`p-1.5 md:p-2 rounded-xl transition-all relative group ${tool === t.id ? 'bg-primary text-black shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]' : 'hover:bg-white/10 text-white'}`}
                                                            title={t.label}
                                                        >
                                                            <t.icon size={16} className="md:w-[18px] md:h-[18px]" />
                                                        </button>
                                                    ))}
                                                </div>

                                                <AnimatePresence>
                                                    {(tool === 'pen' || tool === 'highlight') && (
                                                        <motion.div
                                                            initial={{ width: 0, opacity: 0, scale: 0 }}
                                                            animate={{ width: 'auto', opacity: 1, scale: 1 }}
                                                            exit={{ width: 0, opacity: 0, scale: 0 }}
                                                            className="flex items-center gap-1 px-1 md:px-2 border-r border-white/10 shrink-0 overflow-hidden"
                                                        >
                                                            <button
                                                                onClick={() => setIsColorPickerOpen(true)}
                                                                className="w-7 h-7 md:w-9 md:h-9 rounded-full border-2 border-white/20 flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <div className="flex items-center gap-0.5 md:gap-1 pl-1 md:pl-2 shrink-0">
                                                    <button onClick={handleUndo} disabled={historyIndex < 0} className="p-1.5 md:p-2 rounded-xl hover:bg-white/10 text-white disabled:opacity-30 transition-colors"><RotateCw size={16} className="-scale-x-100 md:w-[18px] md:h-[18px]" /></button>
                                                    <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-1.5 md:p-2 rounded-xl hover:bg-white/10 text-white disabled:opacity-30 transition-colors"><RotateCw size={16} className="md:w-[18px] md:h-[18px]" /></button>
                                                    <div className="w-px h-6 bg-white/10 mx-0.5 md:mx-1" />
                                                    <button onClick={() => setIsResetModalOpen(true)} className="p-1.5 md:p-2 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors"><Trash2 size={16} className="md:w-[18px] md:h-[18px]" /></button>
                                                    <button onClick={() => setIsToolbarVisible(false)} className="p-1.5 md:p-2 rounded-xl hover:bg-white/10 text-white transition-colors ml-0.5 md:ml-1"><ChevronLeft size={16} className="-rotate-90 md:w-[18px] md:h-[18px]" /></button>
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

            {/* Show Toolbar Button */}
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

export default WordViewer;
