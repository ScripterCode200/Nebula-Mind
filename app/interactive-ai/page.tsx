'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Search, Sparkles, BookOpen, Clock, ChevronRight, Cpu, Plus } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import InteractiveTeacher from '@/components/generators/InteractiveTeacher';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function InteractiveAIPage() {
    const router = useRouter();
    const [notebooks, setNotebooks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNotebook, setSelectedNotebook] = useState<any | null>(null);

    useEffect(() => {
        const fetchNotebooks = async () => {
            try {
                const res = await fetch('/api/notebooks?limit=50');
                const data = await res.json();
                if (res.ok) {
                    setNotebooks(data.notebooks);
                }
            } catch (error) {
                console.error('Failed to fetch notebooks:', error);
                toast.error("Cloud Link Error: Could not sync notebooks.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotebooks();
    }, []);

    const filteredNotebooks = notebooks.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (selectedNotebook) {
        return (
            <div className="min-h-screen bg-[#050505] pt-20">
                <div className="max-w-7xl mx-auto px-4 h-[calc(100vh-100px)]">
                    <div className="flex items-center justify-between mb-4">
                        <button 
                            onClick={() => setSelectedNotebook(null)}
                            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-muted-foreground hover:text-white transition-all flex items-center gap-2"
                        >
                            <ChevronRight size={14} className="rotate-180" /> Back to Library
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                                <Cpu size={14} className="text-primary" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-white">{selectedNotebook.title}</span>
                        </div>
                    </div>
                    <div className="h-full border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                        <InteractiveTeacher 
                            notebookId={selectedNotebook._id} 
                            modelProvider="gemini" 
                            sourceIds={selectedNotebook.sources?.map((s: any) => s._id) || []}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white pt-32 pb-20 px-4 md:px-8 relative overflow-hidden">
             {/* Neural Background */}
             <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,240,255,0.1),transparent_70%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[40px_40px]" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header Section */}
                <div className="relative mb-16">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div className="text-left">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary mb-6 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                            >
                                <Sparkles size={14} className="animate-pulse" />
                                <span>NEBULA ORCHESTRATOR 2.0</span>
                            </motion.div>
                            
                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-4"
                            >
                                Interactive <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">AI Teacher</span>
                            </motion.h1>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <NeonButton 
                                onClick={() => router.push('/sessions')}
                                className="h-14 px-8 text-xs font-black tracking-widest uppercase flex items-center gap-3 group"
                            >
                                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                                New Session
                            </NeonButton>
                        </motion.div>
                    </div>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-muted-foreground text-lg max-w-2xl font-medium"
                    >
                        Transform your notebooks into a live pedagogical stage. Experience multi-modal tuition driven by real-time neural orchestration.
                    </motion.p>
                </div>

                {/* Search & Filter */}
                <div className="relative mb-12">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        <Search size={20} className="text-primary/40" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search your knowledge base..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-16 pr-8 text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium text-lg"
                    />
                </div>

                {/* Notebook Selection Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                        {[1, 2, 4].map(i => (
                            <div key={i} className="h-48 bg-white/5 border border-white/10 rounded-3xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnimatePresence>
                            {filteredNotebooks.map((notebook, index) => (
                                <motion.div
                                    key={notebook._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <GlassCard 
                                        className="p-8 group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
                                        onClick={() => setSelectedNotebook(notebook)}
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full group-hover:bg-primary/10 transition-colors" />
                                        
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-4 bg-primary/10 rounded-2xl text-primary border border-primary/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                                                <BookOpen size={24} />
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Last Synced</span>
                                                <span className="text-xs font-mono text-white/40">{new Date(notebook.updatedAt || notebook.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-black italic tracking-tight uppercase mb-2 group-hover:text-primary transition-colors">
                                            {notebook.title}
                                        </h3>
                                        
                                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-4">
                                            <span className="flex items-center gap-1.5"><Clock size={12} /> {notebook.fileType === 'pdf' ? 'Doc' : 'Video'}</span>
                                            <div className="w-1 h-1 rounded-full bg-white/10" />
                                            <span>Orchestration Ready</span>
                                        </div>

                                        <div className="mt-8 flex items-center justify-between pt-6 border-t border-white/5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="relative">
                                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary blur-[4px] animate-pulse" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
                                                    Start Session
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest group-hover:text-primary/40 transition-colors duration-500">
                                                    Initialize Neural Tutor
                                                </span>
                                                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5 group-hover:bg-primary group-hover:border-primary group-hover:text-black transition-all duration-500 shadow-[0_0_15px_rgba(0,0,0,0.2)] group-hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] group-hover:scale-110">
                                                    <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        {filteredNotebooks.length === 0 && (
                            <div className="col-span-full h-64 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-[32px]">
                                <p className="text-muted-foreground font-black uppercase tracking-widest">No matching knowledge found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
