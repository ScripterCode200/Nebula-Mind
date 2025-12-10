'use client';

import React, { useState } from 'react';
import { MessageSquare, FileText, Layers, GraduationCap, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatInterface from './ChatInterface';
import NotesGenerator from '../generators/NotesGenerator';
import FlashcardGenerator from '../generators/FlashcardGenerator';
import MockTestGenerator from '../generators/MockTestGenerator';
import { motion } from 'framer-motion';

interface AIToolsPanelProps {
    notebookId: string;
    chatHistory?: {
        role: string;
        content: string;
        timestamp: string;
    }[];
}

const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, component: ChatInterface },
    { id: 'notes', label: 'Notes', icon: FileText, component: NotesGenerator },
    { id: 'flashcards', label: 'Flashcards', icon: Layers, component: FlashcardGenerator },
    { id: 'tests', label: 'Mock Tests', icon: GraduationCap, component: MockTestGenerator },
];

const AIToolsPanel = ({ notebookId, chatHistory }: AIToolsPanelProps) => {
    const [activeTab, setActiveTab] = useState('chat');
    const [modelProvider, setModelProvider] = useState<'gemini' | 'ollama' | 'phi3.5:3.8b'>('gemini');

    return (
        <div className="flex flex-col h-full bg-black/40 backdrop-blur-xl border-l border-white/5 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header with Tabs and Model Selector */}
            <div className="flex flex-col border-b border-white/5 relative z-10 bg-black/20">
                <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">AI Tools</span>

                    <div className="relative group">
                        <select
                            value={modelProvider}
                            onChange={(e) => setModelProvider(e.target.value as 'gemini' | 'ollama' | 'phi3.5:3.8b')}
                            className="appearance-none bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-white pl-3 pr-8 py-1.5 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer hover:bg-white/10"
                        >
                            <option value="gemini" className="bg-[#050505]">Gemini 2.5 Flash</option>
                            <option value="ollama" className="bg-[#050505]">Nebula Ai 2.0</option>
                            <option value="phi3.5:3.8b" className="bg-[#050505]">Nebula AI 3.0</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none group-hover:text-white transition-colors" />
                    </div>
                </div>

                <div className="px-4 pb-0">
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "relative flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-sm font-medium transition-all duration-300 z-10",
                                    activeTab === tab.id
                                        ? "text-white"
                                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                                )}
                            >
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    <tab.icon size={16} className={activeTab === tab.id ? "text-primary" : ""} />
                                    <span className="hidden xl:inline">{tab.label}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-4" /> {/* Spacer */}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative z-0 min-h-0">
                {tabs.map((tab) => {
                    const Component = tab.component;
                    const isActive = activeTab === tab.id;

                    return (
                        <div
                            key={tab.id}
                            className={cn(
                                "absolute inset-0 transition-all duration-300",
                                isActive
                                    ? "opacity-100 translate-y-0 z-10 pointer-events-auto visible"
                                    : "opacity-0 translate-y-4 -z-10 pointer-events-none invisible"
                            )}
                        >
                            <Component
                                key={notebookId} // Force remount when notebook changes
                                notebookId={notebookId}
                                modelProvider={modelProvider}
                                {...(tab.id === 'chat' ? { initialHistory: chatHistory } : {})}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AIToolsPanel;
