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

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [rotation, setRotation] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setNumPages(0);
        setIsLoading(true);
    }, [url]);

    // Annotation State
    const [activeTool, setActiveTool] = useState<Tool>('cursor');
    const [activeColor, setActiveColor] = useState<string>(COLORS[0]);
    const [paths, setPaths] = useState<Record<number, DrawingPath[]>>({});
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [notebookId, setNotebookId] = useState<string | null>(null);

    // History State
    const [pageHistory, setPageHistory] = useState<Record<number, DrawingPath[][]>>({});
    const [pageHistoryStep, setPageHistoryStep] = useState<Record<number, number>>({});

    // Canvas Size State for sync
    const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
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

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setIsLoading(false);
    }

    const handlePageChange = (newPage: number) => {
        setPageNumber(Math.min(Math.max(1, newPage), numPages));
        setCanvasSize(null); // Reset canvas size to force redraw wait
    };

    // Drawing Logic
    const getCanvasPoint = (e: React.MouseEvent | MouseEvent): Point | null => {
        if (!canvasRef.current) return null;
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / scale, // Adjust for scale
            y: (e.clientY - rect.top) / scale
        };
    };

    const startDrawing = (e: React.MouseEvent) => {
        if (activeTool === 'cursor') return;
        const point = getCanvasPoint(e);
        if (!point) return;

        setIsDrawing(true);
        setCurrentPath({
            tool: activeTool,
            color: activeTool === 'highlighter' ? activeColor + '80' : activeColor, // 50% opacity for highlighter
            points: [point],
            width: activeTool === 'pen' ? 2 : activeTool === 'highlighter' ? 15 : 20
        });
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing || !currentPath || activeTool === 'cursor') return;
        const point = getCanvasPoint(e);
        if (!point) return;

        setCurrentPath(prev => prev ? {
            ...prev,
            points: [...prev.points, point]
        } : null);
    };

    const saveToHistory = (page: number, newPaths: DrawingPath[]) => {
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
    };

    const undo = () => {
        const currentStep = pageHistoryStep[pageNumber] ?? -1;
        if (currentStep < 0) return;

        const newStep = currentStep - 1;
        const history = pageHistory[pageNumber] || [];

        let prevPaths: DrawingPath[] = [];
        if (newStep >= 0) {
            prevPaths = history[newStep];
        } else {
            prevPaths = [];
        }

        setPaths(prev => ({ ...prev, [pageNumber]: prevPaths }));
        setPageHistoryStep(prev => ({ ...prev, [pageNumber]: newStep }));
    };

    const redo = () => {
        const currentStep = pageHistoryStep[pageNumber] ?? -1;
        const history = pageHistory[pageNumber] || [];
        if (currentStep >= history.length - 1) return;

        const newStep = currentStep + 1;
        const nextPaths = history[newStep];

        setPaths(prev => ({ ...prev, [pageNumber]: nextPaths }));
        setPageHistoryStep(prev => ({ ...prev, [pageNumber]: newStep }));
    };

    // Canvas Rendering
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Ensure canvas size matches state if available
        if (canvasSize) {
            if (canvas.width !== canvasSize.width || canvas.height !== canvasSize.height) {
                canvas.width = canvasSize.width;
                canvas.height = canvasSize.height;
            }
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Scale context
        ctx.save();
        ctx.scale(scale, scale);

        const pagePaths = paths[pageNumber] || [];
        const allPaths = currentPath ? [...pagePaths, currentPath] : pagePaths;

        allPaths.forEach(path => {
            if (path.points.length < 2) return;

            ctx.beginPath();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = path.width;
            ctx.strokeStyle = path.tool === 'eraser' ? 'rgba(0,0,0,1)' : path.color;

            if (path.tool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
            } else {
                ctx.globalCompositeOperation = 'source-over';
            }

            ctx.moveTo(path.points[0].x, path.points[0].y);
            path.points.forEach((p, i) => {
                if (i > 0) ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
        });

        ctx.restore();
    }, [paths, pageNumber, currentPath, scale, canvasSize]);

    const clearPage = () => {
        setPaths(prev => ({
            ...prev,
            [pageNumber]: []
        }));
    };

    // Custom Cursors
    const getCursorStyle = () => {
        if (activeTool === 'pen') {
            return { cursor: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${encodeURIComponent(activeColor)}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>') 0 24, crosshair` };
        }
        if (activeTool === 'highlighter') {
            return { cursor: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${encodeURIComponent(activeColor)}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>') 0 24, crosshair` };
        }
        if (activeTool === 'eraser') {
            return { cursor: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>') 12 12, crosshair` };
        }
        return {};
    };

    const stopDrawing = () => {
        if (!isDrawing || !currentPath) return;
        setIsDrawing(false);

        const newPagePaths = [...(paths[pageNumber] || []), currentPath];

        setPaths(prev => ({
            ...prev,
            [pageNumber]: newPagePaths
        }));

        saveToHistory(pageNumber, newPagePaths);

        setCurrentPath(null);
    };

    const [isToolbarVisible, setIsToolbarVisible] = useState(true);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

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
                style={getCursorStyle()}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]" />
                </div>

                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                                <p className="text-sm text-muted-foreground animate-pulse">Loading Document...</p>
                            </div>
                        </div>
                    }
                    className="relative z-10"
                >
                    <AnimatePresence mode="wait">
                        {numPages > 0 && (
                            <motion.div
                                key={`${pageNumber}-${rotation}`}
                                initial={{ opacity: 0.8 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                                className="relative"
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    scale={scale}
                                    rotate={rotation}
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                    className="shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 rounded-sm overflow-hidden bg-white"
                                    onLoadSuccess={(page) => {
                                        const viewport = page.getViewport({ scale });
                                        setCanvasSize({ width: viewport.width, height: viewport.height });
                                        if (canvasRef.current) {
                                            canvasRef.current.width = viewport.width;
                                            canvasRef.current.height = viewport.height;
                                        }
                                    }}
                                />

                                {/* Annotation Canvas Layer */}
                                <canvas
                                    ref={canvasRef}
                                    className={`absolute inset-0 z-50 ${activeTool === 'cursor' ? 'pointer-events-none' : ''}`}
                                    style={activeTool !== 'cursor' ? getCursorStyle() : undefined}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Document>
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
                                        {/* Page Nav */}
                                        <div className="flex items-center gap-1 px-2 border-r border-white/10 flex-shrink-0">
                                            <button onClick={() => handlePageChange(pageNumber - 1)} disabled={pageNumber <= 1} className="p-2 rounded-xl hover:bg-white/10 text-white disabled:opacity-30 transition-colors">
                                                <ChevronLeft size={18} />
                                            </button>
                                            <span className="text-xs font-bold text-white min-w-[3rem] text-center font-mono">
                                                {pageNumber}/{numPages || '-'}
                                            </span>
                                            <button onClick={() => handlePageChange(pageNumber + 1)} disabled={pageNumber >= numPages} className="p-2 rounded-xl hover:bg-white/10 text-white disabled:opacity-30 transition-colors">
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>

                                        {/* Zoom */}
                                        <div className="flex items-center gap-1 px-2 border-r border-white/10 flex-shrink-0">
                                            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors">
                                                <ZoomOut size={18} />
                                            </button>
                                            <span className="text-xs font-bold text-white min-w-[3rem] text-center font-mono">{Math.round(scale * 100)}%</span>
                                            <button onClick={() => setScale(s => Math.min(3.0, s + 0.1))} className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors">
                                                <ZoomIn size={18} />
                                            </button>
                                        </div>

                                        {/* Tools */}
                                        <div className="flex items-center gap-1 px-2 border-r border-white/10 flex-shrink-0">
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
                                                    className="flex items-center gap-1 px-2 border-r border-white/10 flex-shrink-0 overflow-hidden"
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
                                        <div className="flex items-center gap-1 pl-2 flex-shrink-0">
                                            <button onClick={undo} disabled={(pageHistoryStep[pageNumber] ?? -1) < 0} className="p-2 rounded-xl hover:bg-white/10 text-white disabled:opacity-30 transition-colors">
                                                <RotateCw size={18} className="-scale-x-100" />
                                            </button>
                                            <button onClick={redo} disabled={(pageHistoryStep[pageNumber] ?? -1) >= (pageHistory[pageNumber]?.length || 0) - 1} className="p-2 rounded-xl hover:bg-white/10 text-white disabled:opacity-30 transition-colors">
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
