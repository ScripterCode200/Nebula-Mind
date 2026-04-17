'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mic, Cpu, StopCircle, Maximize2, Sparkles, 
    ChevronLeft, ChevronRight, FileText, 
    Clock, Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const LiveSessionContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    // Parse Config from URL
    const config = {
        focusTopic: searchParams.get('topic') || '',
        teachingStyle: searchParams.get('style') || 'Socratic',
        pace: searchParams.get('pace') || 'Intermediate',
        language: searchParams.get('lang') || 'English',
        duration: searchParams.get('dur') || '30',
    };
    
    const selectedSourceIds = searchParams.get('sources')?.split(',').filter(Boolean) || [];

    // Session State
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [timeLeft, setTimeLeft] = useState(parseInt(config.duration) * 60);
    const [isMuted, setIsMuted] = useState(false);

    // Timer Effect
    useEffect(() => {
        if (timeLeft <= 0) {
            stopSession();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };
    
    // Auto-Fullscreen on mount
    useEffect(() => {
        const enterFullscreen = async () => {
            try {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                    setIsFullscreen(true);
                }
            } catch (err) {
                console.warn("Auto-fullscreen blocked. User interaction required.");
            }
        };
        
        const handleFSChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        
        document.addEventListener('fullscreenchange', handleFSChange);
        enterFullscreen();
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFSChange);
        };
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                toast.error("Error attempting to enable full-screen mode");
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const stopSession = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }
        router.push('/sessions');
    };

    // Mock Slides
    const mockSlides = [
        {
            title: "Introduction to " + (config.focusTopic || "The Source Material"),
            bullets: [
                "We will explore the core concepts defined in your document.",
                "Understanding the foundational principles is key.",
                "Interactive exercises will follow."
            ],
            concept: "Core Foundation"
        },
        {
            title: "Advanced Mechanisms",
            bullets: [
                "Neural pathways and dynamic generation.",
                "Optimization of the learning feedback loop.",
                "Real-time visual synchronization."
            ],
            concept: "Deep Dive"
        }
    ];

    return (
        <div className="fixed inset-0 z-100 bg-[#050505] flex flex-col overflow-hidden font-outfit text-white">
            
            {/* Session Header */}
            <div className="flex justify-between items-center shrink-0 p-4 md:p-6 border-b border-white/5 bg-black/40 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Cpu size={20} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white flex items-center gap-2 tracking-tight">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            LIVE NEURAL TUTOR
                        </h3>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                            {config.language} • {config.teachingStyle} • {config.pace} • {config.duration}m
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Timer */}
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-500",
                        timeLeft < 60 
                            ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse" 
                            : "bg-white/5 border-white/10 text-white/70"
                    )}>
                        <Clock size={16} className={cn(timeLeft < 60 ? "animate-spin-slow" : "")} />
                        <span className="text-sm font-mono font-black tracking-widest">
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    <button
                        onClick={toggleFullscreen}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/10"
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>

                    <button
                        onClick={stopSession}
                        className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-colors flex items-center gap-2 text-xs font-black tracking-widest uppercase"
                    >
                        <StopCircle size={14} />
                        End Session
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row p-4 md:p-6 gap-6 overflow-hidden">
                
                {/* Visual Presentation Pane */}
                <div className="flex-1 h-full bg-black/60 border border-white/5 rounded-3xl relative overflow-hidden flex flex-col group shadow-2xl">
                    <div className="absolute top-6 left-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md z-10">
                        <Maximize2 size={12} className="text-muted-foreground" />
                        <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Neural Visualizer</span>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center p-8 md:p-12 relative">
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={currentSlideIndex}
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 1.05, y: -20 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[32px] p-10 md:p-16 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-primary via-secondary to-primary" />
                                
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-primary/20">
                                    <Sparkles size={12} />
                                    {mockSlides[currentSlideIndex].concept}
                                </div>

                                <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight tracking-tight">
                                    {mockSlides[currentSlideIndex].title}
                                </h2>

                                <ul className="space-y-6">
                                    {mockSlides[currentSlideIndex].bullets.map((bullet, idx) => (
                                        <motion.li 
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 + (idx * 0.1) }}
                                            className="flex items-start gap-5 text-muted-foreground group/li"
                                        >
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2.5 shrink-0 shadow-[0_0_15px_#00f0ff] group-hover/li:scale-125 transition-transform" />
                                            <span className="text-xl md:text-2xl leading-relaxed font-medium group-hover/li:text-white transition-colors">{bullet}</span>
                                        </motion.li>
                                    ))}
                                </ul>

                                <div className="mt-12 h-40 w-full rounded-2xl border border-white/5 bg-white/2 flex items-center justify-center border-dashed relative group/graphic">
                                    <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover/graphic:opacity-100 transition-opacity" />
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em] relative z-10 transition-all group-hover/graphic:tracking-[0.6em]">
                                        Dynamic Neural Reconstruction
                                    </p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Controls */}
                    <div className="h-16 border-t border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md">
                        <button 
                            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                            disabled={currentSlideIndex === 0}
                            className="p-2 rounded-full text-muted-foreground hover:text-white disabled:opacity-20 transition-all hover:bg-white/5"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        
                        <div className="flex items-center gap-2">
                            {mockSlides.map((_, i) => (
                                <div 
                                    key={i} 
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-500",
                                        i === currentSlideIndex ? "w-8 bg-primary shadow-[0_0_10px_#00f0ff]" : "w-1.5 bg-white/10"
                                    )}
                                />
                            ))}
                        </div>

                        <button 
                            onClick={() => setCurrentSlideIndex(Math.min(mockSlides.length - 1, currentSlideIndex + 1))}
                            disabled={currentSlideIndex === mockSlides.length - 1}
                            className="p-2 rounded-full text-muted-foreground hover:text-white disabled:opacity-20 transition-all hover:bg-white/5"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                {/* Interaction Sidebar */}
                <div className="w-full lg:w-80 h-full bg-[#0a0a0a] border border-white/10 rounded-3xl flex flex-col shadow-2xl relative overflow-hidden">
                    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-12 relative text-center">
                        <div className="absolute top-12 left-0 w-full">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">
                                {isThinking ? 'Syncing Neural Pathways' : isListening ? 'Listening for Input' : 'System IDLE'}
                            </span>
                        </div>

                        {/* Neural Particle Star - Theme Dynamic Edition */}
                        <motion.div 
                            animate={{
                                x: isThinking ? [0, -1.5, 1.5, -1.5, 1.5, 0] : 0,
                                y: isThinking ? [0, 1.5, -1.5, 1.5, -1.5, 0] : 0,
                            }}
                            transition={{
                                duration: 0.15,
                                repeat: isThinking ? Infinity : 0,
                                ease: "linear"
                            }}
                            className="relative flex items-center justify-center h-72 w-72 perspective-[1000px]"
                        >
                            
                            {/* Mult-Axis Orbiting Shells */}
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        rotateX: [0, i % 2 === 0 ? 360 : -360],
                                        rotateY: [0, i % 3 === 0 ? 360 : -360],
                                        rotateZ: [0, 360],
                                        scale: isThinking ? [1, 0.8, 1] : 1,
                                    }}
                                    transition={{
                                        rotateX: { duration: 10 + (i * 5), repeat: Infinity, ease: "linear" },
                                        rotateY: { duration: 15 + (i * 3), repeat: Infinity, ease: "linear" },
                                        rotateZ: { duration: 20 + (i * 2), repeat: Infinity, ease: "linear" },
                                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                                    }}
                                    className="absolute rounded-full border border-white/5 z-10"
                                    style={{
                                        width: `${60 + (i * 15)}%`,
                                        height: `${60 + (i * 15)}%`,
                                        // Dynamic Theme Color Mapping
                                        backgroundImage: `radial-gradient(circle at center, transparent 95%, var(--color-primary, #00F0FF) 100%)`,
                                        backgroundSize: '8px 8px',
                                        boxShadow: i % 2 === 0 
                                            ? '0 0 15px var(--color-primary, #00F0FF1A)' 
                                            : '0 0 15px var(--color-secondary, #7000FF1A)',
                                    }}
                                />
                            ))}

                            {/* Singularity Core - Theme Synced */}
                            <motion.div
                                animate={{
                                    scale: isThinking ? [1, 1.3, 1] : isListening ? [1, 1.1, 1] : 1,
                                    opacity: isThinking ? [0.6, 1, 0.6] : 0.4,
                                }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute w-24 h-24 rounded-full z-20 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white blur-[30px] opacity-40" />
                                <div 
                                    className="absolute inset-0 blur-[15px] opacity-60 shadow-[0_0_40px_var(--color-primary, #00F0FFBF)]"
                                    style={{ backgroundColor: 'var(--color-primary, #00F0FF)' }}
                                />
                                <div className="absolute inset-4 bg-white/80 blur-[8px] rounded-full" />
                            </motion.div>

                            {/* Atmospheric Bloom Glow */}
                            <div 
                                className="absolute w-80 h-80 rounded-full blur-[100px] pointer-events-none z-0 opacity-10"
                                style={{ backgroundColor: 'var(--color-primary, #00F0FF)' }}
                            />
                            <div 
                                className="absolute w-96 h-96 rounded-full blur-[120px] pointer-events-none z-0 opacity-5"
                                style={{ backgroundColor: 'var(--color-secondary, #7000FF)' }}
                            />

                            {/* Center Icon Engagement */}
                            <div className="absolute z-30 pointer-events-none">
                                <Cpu 
                                    size={32} 
                                    className={cn(
                                        "transition-all duration-1000", 
                                        isThinking ? "text-white drop-shadow-[0_0_15px_var(--color-primary)] opacity-100" : "text-white/20"
                                    )} 
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Interaction Engagement Section */}
                    <div className="p-10 border-t border-white/10 shrink-0 bg-black/40 flex flex-col items-center gap-6">
                        <button 
                            onClick={() => {
                                if (isThinking) return;
                                if (isListening) {
                                    setIsListening(false);
                                } else {
                                    setIsListening(true);
                                    setTimeout(() => {
                                        setIsListening(false);
                                        setIsThinking(true);
                                        setTimeout(() => setIsThinking(false), 8000);
                                    }, 2000);
                                }
                            }}
                            className={cn(
                                "w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-500 relative group overflow-hidden",
                                isThinking 
                                    ? "bg-primary/40 border-primary text-black cursor-wait shadow-[0_0_20px_var(--color-primary)]" 
                                    : isListening
                                        ? "bg-red-500/20 border-red-500 text-red-500"
                                        : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-primary/50"
                            )}
                            disabled={isThinking}
                        >
                            <div className="absolute inset-0 bg-linear-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            {isThinking ? (
                                <Sparkles size={24} className="animate-spin-slow" />
                            ) : (
                                <Mic size={24} className={cn("transition-transform group-hover:scale-110", isListening && "scale-110 animate-pulse")} />
                            )}
                        </button>
                        
                        <div className="text-center space-y-1.5">
                            <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em]">
                                {isThinking ? 'PROCESSING NEURAL CORE' : isListening ? 'VOICE SYNC ACTIVE' : 'INITIALIZE LINK'}
                            </p>
                            <div className="flex items-center justify-center gap-1.5">
                                <span 
                                    className={cn("w-1 h-1 rounded-full", isThinking ? "animate-ping" : "bg-white/20")}
                                    style={{ backgroundColor: isThinking ? 'var(--color-primary)' : '' }}
                                />
                                <p className="text-[8px] text-white/20 font-mono uppercase tracking-[0.2em]">
                                    Protocol v3.4 // NEURAL_SHIVER_SYNC
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function LiveSessionPage() {
    return (
        <Suspense fallback={<div className="fixed inset-0 bg-[#050505] flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
            <LiveSessionContent />
        </Suspense>
    );
}
