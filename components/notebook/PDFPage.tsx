import React, { useRef, useState, useEffect } from 'react';
import { Page } from 'react-pdf';
import { motion } from 'framer-motion';

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

interface PDFPageProps {
    pageNumber: number;
    scale: number;
    rotation: number;
    activeTool: Tool;
    activeColor: string;
    paths: DrawingPath[];
    onPathsChange: (newPaths: DrawingPath[]) => void;
    onPageInteract: () => void;
}

const PDFPage: React.FC<PDFPageProps> = ({
    pageNumber,
    scale,
    rotation,
    activeTool,
    activeColor,
    paths,
    onPathsChange,
    onPageInteract
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);

    // Drawing Logic
    const getCanvasPoint = (e: React.MouseEvent | React.Touch): Point | null => {
        if (!canvasRef.current) return null;
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / scale,
            y: (e.clientY - rect.top) / scale
        };
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (activeTool === 'cursor') return;
        // Prevent default only if drawing to avoid scroll interference
        e.preventDefault();
        const touch = e.touches[0];
        const point = getCanvasPoint(touch);
        if (!point) return;

        startDrawingInternal(point);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDrawing || activeTool === 'cursor') return;
        e.preventDefault();
        const touch = e.touches[0];
        const point = getCanvasPoint(touch);
        if (!point) return;
        drawInternal(point);
    };

    const startDrawing = (e: React.MouseEvent) => {
        onPageInteract();
        if (activeTool === 'cursor') return;
        const point = getCanvasPoint(e);
        if (!point) return;
        startDrawingInternal(point);
    };

    const startDrawingInternal = (point: Point) => {
        setIsDrawing(true);
        setCurrentPath({
            tool: activeTool,
            color: activeTool === 'highlighter' ? activeColor + '80' : activeColor,
            points: [point],
            width: activeTool === 'pen' ? 2 : activeTool === 'highlighter' ? 15 : 20
        });
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing || !currentPath || activeTool === 'cursor') return;
        const point = getCanvasPoint(e);
        if (!point) return;
        drawInternal(point);
    };

    const drawInternal = (point: Point) => {
        setCurrentPath(prev => prev ? {
            ...prev,
            points: [...prev.points, point]
        } : null);
    };

    const stopDrawing = () => {
        if (!isDrawing || !currentPath) return;
        setIsDrawing(false);
        const newPagePaths = [...paths, currentPath];
        onPathsChange(newPagePaths);
        setCurrentPath(null);
    };

    // Canvas Rendering
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (canvasSize) {
            if (canvas.width !== canvasSize.width || canvas.height !== canvasSize.height) {
                canvas.width = canvasSize.width;
                canvas.height = canvasSize.height;
            }
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(scale, scale);

        const allPaths = currentPath ? [...paths, currentPath] : paths;

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
    }, [paths, currentPath, scale, canvasSize]);


    // Custom Cursors - Moved inside to component scope or duplicated? 
    // It's cleaner to duplicate the string generation or pass it down. 
    // I'll duplicate the logic for simplicity as it's self-contained.
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

    return (
        <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="relative mb-8 px-2 md:px-0" // Add horizontal padding for mobile
            style={activeTool !== 'cursor' ? getCursorStyle() : undefined}
            onMouseEnter={onPageInteract} // Track active page
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
                }}
            />

            <canvas
                ref={canvasRef}
                className={`absolute inset-0 z-50 ${activeTool === 'cursor' ? 'pointer-events-none' : ''}`}
                style={{ touchAction: activeTool === 'cursor' ? 'auto' : 'none' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={stopDrawing}
                onTouchCancel={stopDrawing}
            />
        </motion.div>
    );
};

export default PDFPage;
