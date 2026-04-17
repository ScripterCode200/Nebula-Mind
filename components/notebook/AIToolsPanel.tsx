'use client';

import React, { useState } from 'react';
import { MessageSquare, FileText, Layers, GraduationCap, ChevronDown, Sparkles, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatInterface from './ChatInterface';
import NotesGenerator from '../generators/NotesGenerator';
import FlashcardGenerator from '../generators/FlashcardGenerator';
import MockTestGenerator from '../generators/MockTestGenerator';
import InteractiveTeacher from '../generators/InteractiveTeacher';
import { motion, AnimatePresence } from 'framer-motion';
import FuturisticSelect from '../ui/FuturisticSelect';

// Removed InteractiveAIPlaceholder

interface AIToolsPanelProps {
    notebookId: string;
    chatHistory?: {
        role: string;
        content: string;
        timestamp: string;
    }[];
    sourceIds: string[];
}

const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, component: ChatInterface },
    { id: 'notes', label: 'Notes', icon: FileText, component: NotesGenerator },
    { id: 'flashcards', label: 'Flashcards', icon: Layers, component: FlashcardGenerator },
    { id: 'tests', label: 'Mock Tests', icon: GraduationCap, component: MockTestGenerator },
    { id: 'interactive', label: 'Interactive AI', icon: Cpu, component: InteractiveTeacher },
];

const AIToolsPanel = ({ notebookId, chatHistory, sourceIds }: AIToolsPanelProps) => {
    const [activeTab, setActiveTab] = useState('chat');
    const [modelProvider, setModelProvider] = useState<string>('gemini');

    return (
        <div className="flex flex-col md:flex-row h-full md:pt-[75px] bg-[#050505]/40 backdrop-blur-3xl relative overflow-hidden">
            {/* Ambient Neural Backgrounds - Subtle */}
            <div className="absolute -top-[100px] -right-[100px] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none opacity-40" />
            <div className="absolute -bottom-[50px] -left-[50px] w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none opacity-20" />

            {/* Desktop Side Dock (Hidden on Mobile) */}
            <div className="hidden md:flex flex-col w-[64px] bg-black/60 border-r border-white/5 relative z-20 shrink-0 items-center py-6">
                <div className="flex flex-col gap-3 w-full px-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "group relative flex flex-col items-center justify-center aspect-square w-full rounded-xl transition-all duration-300",
                                activeTab === tab.id
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
                            )}
                        >
                            {/* Internal Active Indicator - No Overlap */}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="dockInternalIndicator"
                                    className="absolute left-1 w-1 h-1/2 bg-primary rounded-full shadow-[0_0_10px_#00f0ff]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}

                            <tab.icon size={20} className={cn("transition-transform duration-300", activeTab === tab.id && "drop-shadow-[0_0_8px_#00f0ff]")} />

                            {/* Hover Tooltip */}
                            <div className="absolute left-[72px] px-3 py-1.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap z-50 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                                {tab.label}
                                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0A0A0A] border-l border-t border-white/10 -rotate-45" />
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-auto px-2">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center opacity-40">
                        <Cpu size={18} className="text-white" />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative z-10 min-h-0 flex flex-col bg-black/20">
                {/* Unified Header (Desktop + Mobile Header integration) */}
                <div className="flex items-center justify-between px-4 py-2 bg-black/20 border-b border-white/5 shrink-0 relative z-20">
                    <div className="flex items-center gap-3">
                        {/* Tab Title Display - Desktop context */}
                        <div className="hidden md:flex items-center gap-2">
                            {tabs.find(t => t.id === activeTab)?.icon && React.createElement(tabs.find(t => t.id === activeTab)!.icon, { size: 14, className: "text-primary" })}
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{tabs.find(t => t.id === activeTab)?.label}</span>
                        </div>
                        {/* Mobile Brand Name */}
                        <div className="md:hidden flex items-center gap-2">
                            <Sparkles size={12} className="text-primary animate-pulse" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Neural Hub</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <FuturisticSelect
                            value={modelProvider}
                            onChange={setModelProvider}
                            options={[
                                { value: 'gemini', label: 'Nebula 3.0 (Latest)', icon: <Sparkles size={14} className="text-yellow-400" /> },
                                { value: 'gemini-3.0-flash', label: 'Nebula 2.0', icon: <Sparkles size={14} className="text-purple-400" /> },
                                { value: 'ollama', label: 'Nebula 1.0', icon: <Cpu size={14} className="text-primary" /> }
                            ]}
                        />
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 relative overflow-hidden">
                    {tabs.map((tab) => {
                        const Component = tab.component;
                        const isActive = activeTab === tab.id;

                        return (
                            <div
                                key={tab.id}
                                className={cn(
                                    "absolute inset-0 transition-opacity duration-300 ease-in-out",
                                    isActive
                                        ? "opacity-100 z-10 pointer-events-auto visible"
                                        : "opacity-0 z-0 pointer-events-none invisible"
                                )}
                            >
                                <Component
                                    key={notebookId}
                                    notebookId={notebookId}
                                    modelProvider={modelProvider}
                                    sourceIds={sourceIds}
                                    {...(tab.id === 'chat' ? { initialHistory: chatHistory } : {})}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Mobile Bottom Dock Island - Compacted */}
                <div className="md:hidden px-4 pb-4 pt-1 h-auto shrink-0 relative z-30 pointer-events-none">
                    <div className="flex items-center justify-around bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/5 rounded-2xl p-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)] pointer-events-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "relative flex items-center gap-2 py-2 px-3 rounded-xl transition-all duration-300",
                                    activeTab === tab.id ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-white/5"
                                )}
                            >
                                <tab.icon size={16} className={activeTab === tab.id ? "drop-shadow-[0_0_5px_#00f0ff]" : ""} />
                                {activeTab === tab.id && (
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
                                    >
                                        {tab.id === 'interactive' ? 'AI' : tab.label}
                                    </motion.span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIToolsPanel;
