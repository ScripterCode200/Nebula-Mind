'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Zap, BrainCircuit, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { StreamText } from '@/components/ui/StreamText';

interface Message {
    role: 'user' | 'ai';
    content: string;
}

const ChatInterface = ({ notebookId, modelProvider, initialHistory, sourceIds }: {
    notebookId: string,
    modelProvider: string,
    initialHistory?: { role: string, content: string }[],
    sourceIds?: string[]
}) => {
    const [messages, setMessages] = useState<Message[]>(() => {
        return initialHistory && initialHistory.length > 0
            ? initialHistory.map(m => ({ role: m.role as 'user' | 'ai', content: m.content }))
            : [{
                role: 'ai',
                content: "Hello! I'm your AI Assistant. I've analyzed your notebook and I'm ready to help you study. Ask me for a summary, key concepts, or quiz questions!"
            }];
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const [useRag, setUseRag] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        // Add a placeholder AI message
        setMessages(prev => [...prev, { role: 'ai', content: '' }]);

        try {
            // Prepare history for API
            const history = messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notebookId,
                    message: userMessage,
                    history: history.filter(m => m.role !== 'ai' || m.content !== 'Hello! I\'ve read your notebook. Ask me anything about it.'),
                    modelProvider,
                    useRag, // Pass the toggle state
                    sourceIds // Pass selected sources
                }),
            });

            if (!res.ok || !res.body) {
                throw new Error(res.statusText);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let aiResponse = '';
            let isFirstChunk = true;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                aiResponse += chunk;

                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'ai') {
                        lastMessage.content = aiResponse;
                    }
                    return newMessages;
                });

                if (isFirstChunk) {
                    isFirstChunk = false;
                }
            }

        } catch (error) {
            console.error(error);
            toast.error('Network error. Please try again.');
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'ai' && !lastMessage.content) {
                    lastMessage.content = 'Sorry, I encountered a network error.';
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.02)_1px,transparent_1px)] bg-size-[30px_30px] pointer-events-none" />


            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-8 relative z-10 min-h-0 overscroll-contain" data-lenis-prevent>
                <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => {
                        const isLastAiMessage = msg.role === 'ai' && idx === messages.length - 1;
                        const isGenerating = isLastAiMessage && isLoading;

                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className={cn(
                                    "flex flex-col gap-2 max-w-full",
                                    msg.role === 'user' ? "items-end" : "items-start"
                                )}
                            >
                                {/* Profile Icon - Top Positioned */}
                                <div className="flex items-center gap-3 px-1">
                                    {msg.role === 'ai' && (
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-secondary/40 blur-md rounded-full group-hover:bg-secondary/60 transition-colors" />
                                            <div className="relative w-8 h-8 rounded-full bg-black border border-secondary/50 flex items-center justify-center overflow-hidden">
                                                <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(168,85,247,0.5)_360deg)] animate-[spin_4s_linear_infinite]" />
                                                <div className="absolute inset-px bg-black rounded-full flex items-center justify-center">
                                                    <BrainCircuit size={14} className="text-secondary relative z-10" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <span className={cn(
                                        "text-[11px] uppercase tracking-wider font-semibold",
                                        msg.role === 'user' ? "text-primary" : "text-secondary"
                                    )}>
                                        {msg.role === 'user' ? 'You' : 'AI Assistant'}
                                    </span>

                                    {msg.role === 'user' && (
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-primary/40 blur-md rounded-lg group-hover:bg-primary/60 transition-colors" />
                                            <div className="relative w-8 h-8 bg-black border border-primary/50 flex items-center justify-center overflow-hidden" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }}>
                                                <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-transparent" />
                                                <User size={14} className="text-primary relative z-10" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Message Bubble */}
                                <div className={cn(
                                    "relative p-5 rounded-2xl text-sm leading-relaxed overflow-hidden shadow-lg backdrop-blur-md transition-all duration-300 w-fit max-w-[90%]",
                                    msg.role === 'user'
                                        ? "bg-primary/5 text-foreground rounded-tr-sm border border-primary/20 hover:border-primary/40"
                                        : "bg-white/5 text-muted-foreground rounded-tl-sm border border-white/10 hover:bg-white/10 hover:border-white/20",
                                    isGenerating && "border-secondary/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                                )}>
                                    {/* Generating Animation Border */}
                                    {isGenerating && (
                                        <div className="absolute inset-0 rounded-2xl rounded-tl-sm overflow-hidden pointer-events-none">
                                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-secondary/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                        </div>
                                    )}

                                    <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-code:text-primary/90">
                                        {msg.role === 'ai' ? (
                                            <StreamText
                                                content={msg.content}
                                                isStreaming={isLastAiMessage && isLoading}
                                            />
                                        ) : (
                                            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        )}
                                        {isGenerating && (
                                            <span className="inline-block w-1.5 h-4 ml-1 bg-secondary align-middle animate-pulse" />
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Thinking State */}
                {isLoading && messages[messages.length - 1].content === '' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-2 items-start max-w-full"
                    >
                        <div className="flex items-center gap-3 px-1">
                            <div className="relative w-8 h-8 rounded-full bg-black border border-secondary/50 flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-secondary/20 animate-pulse" />
                                <BrainCircuit size={14} className="text-secondary relative z-10" />
                            </div>
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-secondary">AI Assistant</span>
                        </div>

                        <div className="bg-white/5 p-4 rounded-2xl rounded-tl-sm border border-white/10 backdrop-blur-md flex items-center gap-3 w-full md:max-w-[90%]">
                            <div className="flex gap-1 h-3 items-center">
                                <motion.div
                                    animate={{ height: [4, 12, 4] }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0 }}
                                    className="w-1 bg-secondary/60 rounded-full"
                                />
                                <motion.div
                                    animate={{ height: [4, 12, 4] }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0.2 }}
                                    className="w-1 bg-secondary/60 rounded-full"
                                />
                                <motion.div
                                    animate={{ height: [4, 12, 4] }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0.4 }}
                                    className="w-1 bg-secondary/60 rounded-full"
                                />
                            </div>
                            <span className="text-xs text-secondary/80 font-medium ml-1">Analyzing...</span>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 relative z-10">
                <GlassCard className="p-1.5 flex items-center gap-2 bg-black/40 border-white/10 backdrop-blur-xl">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
                            placeholder="Type your message..."
                            className="w-full bg-transparent border-none text-sm text-foreground placeholder:text-muted/50 focus:ring-0 px-4 py-3"
                            disabled={isLoading}
                        />
                        {/* Focus indicator line */}
                        <div className="absolute bottom-0 left-4 right-4 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 input-focus-visible:opacity-100" />
                    </div>

                    <NeonButton
                        onClick={handleSubmit}
                        disabled={!input.trim() || isLoading}
                        className="h-10 w-10 p-0 flex items-center justify-center rounded-lg shrink-0"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Send size={18} className="ml-0.5" />
                        )}
                    </NeonButton>
                </GlassCard>

                <div className="text-center mt-2">
                    <p className="text-[10px] text-muted/40 font-mono">AI can make mistakes. Check important info.</p>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
