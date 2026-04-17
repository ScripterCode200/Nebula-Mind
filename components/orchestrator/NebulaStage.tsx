'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles } from 'lucide-react';

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════

export interface VisualElement {
    type: 'circle' | 'rect' | 'line' | 'path' | 'text' | 'ellipse' | 'polygon';
    id: string;
    label?: string;
    textContent?: string;
    animate?: Record<string, any>;
    delay?: number;
    [key: string]: any;
}

export interface VisualSchema {
    type?: 'svg' | 'image';
    url?: string;
    prompt?: string;
    viewBox?: string;
    elements?: VisualElement[];
    animations?: any[];
}

interface NebulaStageProps {
    schema: VisualSchema | null;
    isThinking?: boolean;
}

// ═══════════════════════════════════════
// Utilities
// ═══════════════════════════════════════

/** Keys that must never be spread onto a DOM SVG element */
const BLOCKED_PROPS = new Set([
    'children', 'textContent', 'class', 'label', 'animate', 'delay', 'type', 'id',
]);

/**
 * Sanitize AI-generated props: convert kebab-case → camelCase,
 * strip non-DOM keys, and handle React-specific prop names.
 */
const sanitizeSvgProps = (props: Record<string, any>): Record<string, any> => {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(props)) {
        if (BLOCKED_PROPS.has(key)) continue;
        if (value === undefined || value === null) continue;

        // Convert kebab-case to camelCase (e.g., stroke-width -> strokeWidth)
        const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

        if (camelKey === 'className' || key === 'class') {
            result.className = value;
        } else {
            result[camelKey] = value;
        }
    }

    return result;
};

/**
 * Shared label style — crisp white text with a subtle shadow for legibility on dark backgrounds.
 */
const LABEL_STYLE: React.CSSProperties = {
    fill: 'white',
    fontSize: '10px',
    fontWeight: '700',
    pointerEvents: 'none',
    letterSpacing: '0.04em',
    filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.9))',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
};

// ═══════════════════════════════════════
// Element Renderers
// ═══════════════════════════════════════

/** Compute transition with staggered delay from AI schema */
const getTransition = (delay: number = 0, duration: number = 0.8) => ({
    duration,
    ease: 'easeOut' as const,
    delay: Math.min(delay, 3), // Cap delay at 3s
});

/** Render a label near an element */
const renderLabel = (text: string | undefined, x: number, y: number, key: string) => {
    if (!text) return null;
    const displayText = text.length > 22 ? text.substring(0, 19) + '...' : text;
    return (
        <motion.text
            key={`label-${key}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            style={LABEL_STYLE}
        >
            {displayText}
        </motion.text>
    );
};

const RenderCircle = ({ el, index }: { el: VisualElement; index: number }) => {
    const { label, animate, delay, ...rawProps } = el;
    const props = sanitizeSvgProps(rawProps);
    const cx = parseFloat(props.cx || '0');
    const cy = parseFloat(props.cy || '0');

    return (
        <g key={el.id} filter="url(#nebula-glow)">
            <motion.circle
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: props.opacity ?? 1, scale: 1, ...(animate || {}) }}
                transition={getTransition(delay ?? index * 0.15, 0.8)}
                {...props}
            />
            {renderLabel(label, cx, cy, el.id)}
        </g>
    );
};

const RenderEllipse = ({ el, index }: { el: VisualElement; index: number }) => {
    const { label, animate, delay, ...rawProps } = el;
    const props = sanitizeSvgProps(rawProps);
    const cx = parseFloat(props.cx || '0');
    const cy = parseFloat(props.cy || '0');

    return (
        <g key={el.id} filter="url(#nebula-glow)">
            <motion.ellipse
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: props.opacity ?? 1, scale: 1, ...(animate || {}) }}
                transition={getTransition(delay ?? index * 0.15, 0.8)}
                {...props}
            />
            {renderLabel(label, cx, cy, el.id)}
        </g>
    );
};

const RenderRect = ({ el, index }: { el: VisualElement; index: number }) => {
    const { label, animate, delay, ...rawProps } = el;
    const props = sanitizeSvgProps(rawProps);
    const x = parseFloat(props.x || '0');
    const y = parseFloat(props.y || '0');
    const w = parseFloat(props.width || '0');
    const h = parseFloat(props.height || '0');
    const centerX = x + w / 2;
    const centerY = y + h / 2;

    return (
        <g key={el.id} filter="url(#nebula-glow)">
            <motion.rect
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: props.opacity ?? 1, scale: 1, ...(animate || {}) }}
                transition={getTransition(delay ?? index * 0.15, 0.8)}
                {...props}
            />
            {renderLabel(label, centerX, centerY, el.id)}
        </g>
    );
};

const RenderLine = ({ el, index }: { el: VisualElement; index: number }) => {
    const { animate, delay, ...rawProps } = el;
    const props = sanitizeSvgProps(rawProps);

    return (
        <motion.line
            key={el.id}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: props.opacity ?? 0.8, ...(animate || {}) }}
            transition={getTransition(delay ?? 0.5 + index * 0.1, 1.2)}
            filter="url(#nebula-glow)"
            strokeWidth={props.strokeWidth || 1}
            {...props}
        />
    );
};

const RenderPath = ({ el, index }: { el: VisualElement; index: number }) => {
    const { animate, delay, ...rawProps } = el;
    const props = sanitizeSvgProps(rawProps);

    return (
        <motion.path
            key={el.id}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: props.opacity ?? 1, ...(animate || {}) }}
            transition={getTransition(delay ?? 0.5 + index * 0.1, 1.5)}
            filter="url(#nebula-glow)"
            fill={props.fill || 'none'}
            {...props}
        />
    );
};

const RenderText = ({ el, index }: { el: VisualElement; index: number }) => {
    const { label, textContent, animate, delay, ...rawProps } = el;
    const props = sanitizeSvgProps(rawProps);
    const displayText = textContent || label || '';
    
    if (!displayText) return null;

    return (
        <motion.text
            key={el.id}
            initial={{ opacity: 0, y: (parseFloat(props.y || '0') + 5) }}
            animate={{ opacity: props.opacity ?? 1, y: parseFloat(props.y || '0'), ...(animate || {}) }}
            transition={getTransition(delay ?? 0.3 + index * 0.08, 0.6)}
            textAnchor={props.textAnchor || 'middle'}
            dominantBaseline={props.dominantBaseline || 'middle'}
            {...props}
            style={{
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                fill: props.fill || '#FFFFFF',
                fontSize: props.fontSize || '10px',
                fontWeight: props.fontWeight || '600',
                letterSpacing: '0.02em',
                ...((props.style as any) || {}),
            }}
        >
            {displayText}
        </motion.text>
    );
};

const RenderPolygon = ({ el, index }: { el: VisualElement; index: number }) => {
    const { label, animate, delay, ...rawProps } = el;
    const props = sanitizeSvgProps(rawProps);

    return (
        <motion.polygon
            key={el.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: props.opacity ?? 1, scale: 1, ...(animate || {}) }}
            transition={getTransition(delay ?? index * 0.12, 0.5)}
            {...props}
        />
    );
};

// ═══════════════════════════════════════
// Main Component
// ═══════════════════════════════════════

const NebulaStage: React.FC<NebulaStageProps> = ({ schema, isThinking }) => {
    if (!schema || isThinking) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center border border-white/5 bg-[#050505] rounded-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.02),transparent_70%)]" />
                <div className="flex flex-col items-center justify-center gap-6 z-10">
                    <motion.div
                        animate={{ 
                            rotate: 360,
                            boxShadow: ["0 0 20px rgba(0,240,255,0.1)", "0 0 40px rgba(0,240,255,0.2)", "0 0 20px rgba(0,240,255,0.1)"]
                        }}
                        transition={{ rotate: { repeat: Infinity, duration: 8, ease: "linear" }, boxShadow: { repeat: Infinity, duration: 2 } }}
                        className="w-20 h-20 rounded-full border border-primary/20 flex items-center justify-center bg-primary/5 backdrop-blur-sm"
                    >
                        <BookOpen className="text-primary/60" size={28} />
                    </motion.div>
                    <div className="flex flex-col items-center gap-2">
                        <motion.span 
                            animate={{ opacity: [0.4, 1, 0.4] }} 
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="text-[10px] font-black text-primary uppercase tracking-[0.5em]"
                        >
                            Orchestrating
                        </motion.span>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest px-4 py-1.5 bg-white/5 border border-white/5 rounded-full backdrop-blur-md">
                            Generating Visual Context...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // Handle Image Mode Rendering
    if (schema?.type === 'image' && schema.url) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full relative overflow-hidden flex items-center justify-center p-4 md:p-8"
            >
                {/* Cinematic Background Atmosphere */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.05),transparent_70%)]" />
                <div className="absolute inset-0 bg-[#050505]" />
                
                <div className="relative group max-w-5xl w-full aspect-square md:aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_80px_-20px_rgba(0,240,255,0.15)] bg-black/40 backdrop-blur-2xl">
                    <img 
                        src={schema.url} 
                        alt="AI Concept Illustration" 
                        className="w-full h-full object-cover transition-transform duration-2000 group-hover:scale-105"
                    />
                    
                    {/* Glassmorphic Caption */}
                    <div className="absolute inset-x-0 bottom-0 p-8 bg-linear-to-t from-black/90 via-black/40 to-transparent">
                        <div className="flex items-center gap-2 text-[10px] font-black text-primary mb-3 uppercase tracking-[0.2em] drop-shadow-lg">
                            <Sparkles size={14} fill="currentColor" />
                            Neural Visualization
                        </div>
                        <p className="text-xs text-white/80 font-medium leading-relaxed max-w-3xl line-clamp-2 italic drop-shadow-md">
                            &quot;{schema.prompt || 'Synthesized educational concept illustration.'}&quot;
                        </p>
                    </div>

                    {/* Industrial Corners */}
                    <div className="absolute top-0 left-0 p-6 pointer-events-none">
                        <div className="w-12 h-12 border-t-2 border-l-2 border-white/10 rounded-tl-2xl" />
                    </div>
                    <div className="absolute top-0 right-0 p-6 pointer-events-none">
                        <div className="w-12 h-12 border-t-2 border-r-2 border-white/10 rounded-tr-2xl" />
                    </div>
                </div>
            </motion.div>
        );
    }

    // ═══════════════════════════════════════
    // SVG Mode — Render validated elements
    // ═══════════════════════════════════════
    const elements = schema?.elements || [];

    return (
        <div className="w-full h-full bg-[#050505] border border-white/5 rounded-2xl relative overflow-hidden flex items-center justify-center p-4">
            <svg
                viewBox={schema?.viewBox || "0 0 400 300"}
                className="w-full h-full max-w-[800px] drop-shadow-[0_0_25px_rgba(0,240,255,0.15)]"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Shared SVG Definitions */}
                <defs>
                    {/* Glow filter for all elements */}
                    <filter id="nebula-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    {/* Subtle background grid */}
                    <pattern id="nebula-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#nebula-grid)" />

                <AnimatePresence mode="popLayout">
                    {elements.map((el, index) => {
                        // Safety: skip elements with no type or invalid structure
                        if (!el || !el.type || !el.id) return null;

                        try {
                            switch (el.type) {
                                case 'circle':
                                    return <RenderCircle key={el.id} el={el} index={index} />;
                                case 'ellipse':
                                    return <RenderEllipse key={el.id} el={el} index={index} />;
                                case 'rect':
                                    return <RenderRect key={el.id} el={el} index={index} />;
                                case 'line':
                                    return <RenderLine key={el.id} el={el} index={index} />;
                                case 'path':
                                    return <RenderPath key={el.id} el={el} index={index} />;
                                case 'text':
                                    return <RenderText key={el.id} el={el} index={index} />;
                                case 'polygon':
                                    return <RenderPolygon key={el.id} el={el} index={index} />;
                                default:
                                    // Silently skip unsupported types
                                    return null;
                            }
                        } catch (err) {
                            // Catch any per-element render errors so one bad element doesn't kill the whole diagram
                            console.warn(`[NebulaStage] Skipping element "${el.id}" due to render error:`, err);
                            return null;
                        }
                    })}
                </AnimatePresence>
            </svg>
        </div>
    );
};

export default NebulaStage;
