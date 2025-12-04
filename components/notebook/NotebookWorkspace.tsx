'use client';

import React from 'react';
import dynamic from 'next/dynamic';

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
import AIToolsPanel from './AIToolsPanel';
import { ArrowLeft, PanelLeftClose, PanelLeftOpen, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface NotebookWorkspaceProps {
    notebook: {
        _id: string;
        title: string;
        pdfUrl: string;
        chatHistory?: {
            role: string;
            content: string;
            timestamp: string;
        }[];
    };
}

const NotebookWorkspace = ({ notebook }: NotebookWorkspaceProps) => {
    const [isPdfVisible, setIsPdfVisible] = React.useState(true);
    const [isMobile, setIsMobile] = React.useState(false);
    const [isOptimizing, setIsOptimizing] = React.useState(false);

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

                    <div className="hidden md:block px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-white/5 text-[10px] font-bold text-primary tracking-wider uppercase">
                        Nebula Workspace
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Background Grid */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                </div>

                {/* Left Panel: PDF Viewer */}
                <motion.div
                    initial={false}
                    animate={{
                        width: isMobile ? (isPdfVisible ? '100%' : '0%') : (isPdfVisible ? '50%' : '0%'),
                        opacity: isMobile ? (isPdfVisible ? 1 : 0) : (isPdfVisible ? 1 : 0),
                        x: isMobile ? (isPdfVisible ? 0 : -20) : (isPdfVisible ? 0 : -20),
                        display: isMobile ? (isPdfVisible ? 'block' : 'none') : (isPdfVisible ? 'block' : 'none')
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="flex-shrink-0 border-r border-white/5 overflow-hidden bg-black/20 relative z-30"
                >
                    <div className="h-full w-full min-w-[300px] md:min-w-[500px]">
                        <PDFViewer url={notebook.pdfUrl} />
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
                    <AIToolsPanel notebookId={notebook._id} chatHistory={notebook.chatHistory} />
                </motion.div>
            </div>
        </div>
    );
};

export default NotebookWorkspace;
