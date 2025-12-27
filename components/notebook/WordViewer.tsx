'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ZoomIn, ZoomOut, RotateCw,
    Type, Highlighter, Pen, Eraser,
    Undo, Redo, MousePointer2
} from 'lucide-react';
import { toast } from 'sonner';

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
    contentHtml: string;
    notebookId: string;
}

const WordViewer = ({ contentHtml, notebookId }: WordViewerProps) => {
    // Viewer State
    const [scale, setScale] = useState<number>(1.0);
    const containerRef = useRef<HTMLDivElement>(null);
    const htmlContainerRef = useRef<HTMLDivElement>(null);
    const [isToolbarVisible, setIsToolbarVisible] = useState(true);

    // Drawing State
    const [tool, setTool] = useState<'cursor' | 'pen' | 'highlight' | 'eraser'>('cursor');
    const [color, setColor] = useState('#000000');
    const [paths, setPaths] = useState<Path[]>([]);
    const [currentPath, setCurrentPath] = useState<Path | null>(null);
    const [history, setHistory] = useState<Path[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Persistence 
    const loadAnnotations = useCallback(async () => {
        try {
            const response = await fetch(`/api/notebooks/${notebookId}/annotations`);
            if (response.ok) {
                const data = await response.json();
                // For Word doc, we assume all paths are on "page 1" or just stored in a 'word_paths' key
                // But for compatibility with the generic persistence schema, we'll check if it returns a map or array.
                // Since this is a new implementation, let's assume we store it under key "1" for simplicity as one big page, 
                // OR we can store it properly if we update the backend.
                // For now, let's try to load from key "1" if it exists.
                if (data && data.annotations && data.annotations['1']) {
                    setPaths(data.annotations['1']);
                    setHistory([data.annotations['1']]);
                    setHistoryIndex(0);
                }
            }
        } catch (error) {
            console.error('Failed to load annotations:', error);
        }
    }, [notebookId]);

    const saveAnnotations = useCallback(async (newPaths: Path[]) => {
        try {
            // Save all paths under key "1" (treating entire doc as page 1)
            const annotations = { "1": newPaths };
            await fetch(`/api/notebooks/${notebookId}/annotations`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ annotations }),
            });
        } catch (error) {
            console.error('Failed to save annotations:', error);
        }
    }, [notebookId]);

    useEffect(() => {
        loadAnnotations();
    }, [loadAnnotations]);

    // Canvas Drawing Logic
    const drawPath = (ctx: CanvasRenderingContext2D, path: Path) => {
        if (path.points.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);

        // Smooth curve
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
            ctx.strokeStyle = path.color + '40'; // 25% opacity
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

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw saved paths
        paths.forEach(path => drawPath(ctx, path));

        // Draw current path
        if (currentPath) {
            drawPath(ctx, currentPath);
        }
    }, [paths, currentPath]);

    // Update canvas size on resize and initial load
    useEffect(() => {
        const updateCanvasSize = () => {
            if (htmlContainerRef.current && canvasRef.current) {
                const { offsetWidth, offsetHeight } = htmlContainerRef.current;
                canvasRef.current.width = offsetWidth;
                canvasRef.current.height = offsetHeight;
                redrawCanvas();
            }
        };

        const observer = new ResizeObserver(updateCanvasSize);
        if (htmlContainerRef.current) {
            observer.observe(htmlContainerRef.current);
            // Also run once immediately
            updateCanvasSize();
        }

        return () => observer.disconnect();
    }, [redrawCanvas, htmlContainerRef.current]);
    // ^ Added dependency on ref.current, though typicallyrefs don't trigger updates. 
    // The ResizeObserver handles the actual updates.

    useEffect(() => {
        redrawCanvas();
    }, [redrawCanvas]);


    const getPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point | null => {
        if (!canvasRef.current) return null;
        const rect = canvasRef.current.getBoundingClientRect();
        // Calculate coordinate relative to the unscaled canvas
        // The canvas is scaled by CSS transform, but its internal resolution match the unscaled element size
        // We need to divide by scale to get back to local coordinates
        return {
            x: (e.clientX - rect.left) / scale,
            y: (e.clientY - rect.top) / scale
        };
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (tool === 'cursor') return;

        const point = getPoint(e);
        if (!point) return;

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

        // Update history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newPaths);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        // Save to DB
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


    return (
        <div className="flex flex-col h-full bg-[#0A0A0A] relative overflow-hidden group">
            {/* Viewer Area */}
            <div
                className="flex-1 overflow-y-auto overflow-x-hidden flex justify-center p-8 relative scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                ref={containerRef}
                data-lenis-prevent
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]" />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: scale }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative z-10 bg-white text-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-[210mm] min-h-[297mm] h-fit mx-auto"
                    style={{ transformOrigin: 'top center' }}
                    ref={htmlContainerRef}
                >
                    {/* Content Layer */}
                    <div
                        className="p-[2.54cm] prose prose-lg max-w-none text-black prose-headings:font-serif prose-headings:font-bold prose-headings:text-black prose-p:font-serif prose-p:text-left prose-li:text-black prose-strong:text-black [&_*]:text-black pointer-events-auto whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: contentHtml || '<p class="text-center text-gray-500 mt-20 font-serif">No preview available</p>' }}
                    />

                    {/* Canvas Layer */}
                    <canvas
                        ref={canvasRef}
                        className={`absolute inset-0 z-20 ${tool === 'cursor' ? 'pointer-events-none' : 'cursor-crosshair'}`}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />

                </motion.div>
            </div>

            {/* Floating Dock Toolbar - Full Parity with PDFViewer */}
            <AnimatePresence>
                {isToolbarVisible && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[95vw]"
                    >
                        <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#1e1e1e]/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden min-w-[200px] justify-center">

                            {/* Zoom Controls */}
                            <div className="flex items-center gap-1 px-2 flex-shrink-0 border-r border-white/10 pr-3">
                                <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors">
                                    <ZoomOut size={18} />
                                </button>
                                <span className="text-xs font-bold text-white min-w-[3rem] text-center font-mono">{Math.round(scale * 100)}%</span>
                                <button onClick={() => setScale(s => Math.min(3.0, s + 0.1))} className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors">
                                    <ZoomIn size={18} />
                                </button>
                            </div>

                            {/* Tools */}
                            <div className="flex items-center gap-1 px-2">
                                <button
                                    onClick={() => setTool('cursor')}
                                    className={`p-2 rounded-xl transition-colors ${tool === 'cursor' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/70'}`}
                                    title="Cursor"
                                >
                                    <MousePointer2 size={18} />
                                </button>
                                <button
                                    onClick={() => setTool('pen')}
                                    className={`p-2 rounded-xl transition-colors ${tool === 'pen' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/70'}`}
                                    title="Pen"
                                >
                                    <Pen size={18} />
                                </button>
                                <button
                                    onClick={() => setTool('highlight')}
                                    className={`p-2 rounded-xl transition-colors ${tool === 'highlight' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/70'}`}
                                    title="Highlighter"
                                >
                                    <Highlighter size={18} />
                                </button>
                                <button
                                    onClick={() => setTool('eraser')}
                                    className={`p-2 rounded-xl transition-colors ${tool === 'eraser' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/70'}`}
                                    title="Eraser"
                                >
                                    <Eraser size={18} />
                                </button>
                            </div>

                            <div className="w-px h-6 bg-white/10 mx-1" />

                            {/* Colors */}
                            <div className="flex items-center gap-1 px-2">
                                <button
                                    onClick={() => setColor('#000000')}
                                    className={`w-6 h-6 rounded-full border-2 ${color === '#000000' ? 'border-white' : 'border-transparent'}`}
                                    style={{ backgroundColor: '#000000' }}
                                />
                                <button
                                    onClick={() => setColor('#ef4444')}
                                    className={`w-6 h-6 rounded-full border-2 ${color === '#ef4444' ? 'border-white' : 'border-transparent'}`}
                                    style={{ backgroundColor: '#ef4444' }}
                                />
                                <button
                                    onClick={() => setColor('#22c55e')}
                                    className={`w-6 h-6 rounded-full border-2 ${color === '#22c55e' ? 'border-white' : 'border-transparent'}`}
                                    style={{ backgroundColor: '#22c55e' }}
                                />
                                <button
                                    onClick={() => setColor('#3b82f6')}
                                    className={`w-6 h-6 rounded-full border-2 ${color === '#3b82f6' ? 'border-white' : 'border-transparent'}`}
                                    style={{ backgroundColor: '#3b82f6' }}
                                />
                                <button
                                    onClick={() => setColor('#eab308')}
                                    className={`w-6 h-6 rounded-full border-2 ${color === '#eab308' ? 'border-white' : 'border-transparent'}`}
                                    style={{ backgroundColor: '#eab308' }}
                                />
                            </div>

                            <div className="w-px h-6 bg-white/10 mx-1" />

                            {/* History */}
                            <div className="flex items-center gap-1 px-2">
                                <button onClick={handleUndo} disabled={historyIndex < 0} className="p-2 rounded-xl hover:bg-white/10 text-white disabled:opacity-30 transition-colors">
                                    <Undo size={18} />
                                </button>
                                <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-xl hover:bg-white/10 text-white disabled:opacity-30 transition-colors">
                                    <Redo size={18} />
                                </button>
                            </div>

                            <div className="w-px h-6 bg-white/10 mx-1" />

                            <button onClick={() => setIsToolbarVisible(false)} className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors ml-1">
                                <ChevronLeft size={18} className="-rotate-90" />
                            </button>
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
                        <ZoomIn size={16} />
                        <span className="text-xs font-bold">Show Tools</span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WordViewer;
