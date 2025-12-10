'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import GlassCard from '@/components/ui/GlassCard';
import { toast } from 'sonner';

interface FlashcardGeneratorProps {
    notebookId: string;
    modelProvider: 'gemini' | 'openai' | 'ollama' | 'phi3.5:3.8b';
}

interface Flashcard {
    _id: string;
    front: string;
    back: string;
}

import FuturisticLoader from '@/components/ui/FuturisticLoader';

const FlashcardGenerator = ({ notebookId, modelProvider }: FlashcardGeneratorProps) => {
    const [count, setCount] = useState(5);
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    React.useEffect(() => {
        const fetchCards = async () => {
            try {
                const res = await fetch(`/api/flashcards?notebookId=${notebookId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setCards(data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch flashcards:", error);
            }
        };
        fetchCards();
    }, [notebookId]);

    // Simulated Progress
    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (loading) {
            setProgress(0);
            // Increased duration estimates for smoother, slower progress
            const duration = count * (modelProvider === 'ollama' ? 6000 : 3000);
            const step = 100 / (duration / 100);

            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) return 95; // Hold at 95%
                    return prev + step;
                });
            }, 100);
        } else {
            setProgress(100);
        }
        return () => clearInterval(interval);
    }, [loading, count, modelProvider]);

    const generateCards = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notebookId,
                    type: 'flashcards',
                    config: { count },
                    modelProvider,
                }),
            });
            if (!res.ok) {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await res.json();
                    throw new Error(data.error || res.statusText);
                } else {
                    const text = await res.text();
                    console.error('Non-JSON error response:', text);
                    throw new Error(`Server error: ${res.status} ${res.statusText}`);
                }
            }
            const data = await res.json();

            // Force progress to 100% and wait before showing result
            setProgress(100);
            await new Promise(resolve => setTimeout(resolve, 500));

            if (data.error) {
                toast.error(`Error: ${data.error}`, { description: data.details });
            } else if (Array.isArray(data)) {
                setCards(data);
                setCurrentIndex(0);
                setIsFlipped(false);
                toast.success('Flashcards generated successfully!');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate flashcards. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const nextCard = () => {
        if (currentIndex < cards.length - 1) {
            setIsFlipped(false);
            // Fix race condition: Ensure we don't exceed bounds even if clicked rapidly
            setTimeout(() => setCurrentIndex(prev => Math.min(prev + 1, cards.length - 1)), 200);
        }
    };

    const prevCard = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => Math.max(prev - 1, 0)), 200);
        }
    };

    const currentCard = cards[currentIndex];

    return (
        <div className="h-full p-6 overflow-y-auto flex flex-col overscroll-contain" data-lenis-prevent>
            <div className="flex-shrink-0 mb-6">
                <h2 className="text-2xl font-bold mb-2 text-glow">Flashcards</h2>
                <p className="text-muted mb-6">Master key concepts with AI-generated cards.</p>

                {!cards.length && !loading && (
                    <div className="flex items-end gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-muted">Number of Cards</label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={count}
                                onChange={(e) => setCount(parseInt(e.target.value))}
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 w-24 text-center focus:outline-none focus:border-primary"
                            />
                        </div>
                        <NeonButton onClick={generateCards} isLoading={loading}>
                            <Layers size={18} />
                            Generate Deck
                        </NeonButton>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <FuturisticLoader
                        text="Generating Flashcards"
                        subtext={`Creating ${count} cards with ${modelProvider === 'ollama' ? 'Ollama' : 'AI'}...`}
                        progress={progress}
                    />
                </div>
            ) : cards.length > 0 && currentCard ? (
                <div className="flex-1 flex flex-col items-center justify-center perspective-1000">
                    <div className="relative w-full max-w-md aspect-[3/2] cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
                        <motion.div
                            initial={false}
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                            className="w-full h-full relative preserve-3d"
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            {/* Front */}
                            <div className="absolute inset-0 backface-hidden">
                                <GlassCard className="w-full h-full flex flex-col items-center justify-center p-8 text-center border-primary/30 bg-black/40">
                                    <span className="text-xs text-primary uppercase tracking-widest mb-4">Concept</span>
                                    <h3 className="text-xl font-medium">{currentCard.front}</h3>
                                    <div className="absolute bottom-4 text-muted text-xs flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <RotateCw size={12} /> Click to flip
                                    </div>
                                </GlassCard>
                            </div>

                            {/* Back */}
                            <div
                                className="absolute inset-0 backface-hidden"
                                style={{ transform: 'rotateY(180deg)' }}
                            >
                                <GlassCard className="w-full h-full flex flex-col items-center justify-center p-8 text-center border-secondary/30 bg-black/40">
                                    <span className="text-xs text-secondary uppercase tracking-widest mb-4">Explanation</span>
                                    <p className="text-lg leading-relaxed">{currentCard.back}</p>
                                </GlassCard>
                            </div>
                        </motion.div>
                    </div>

                    <div className="flex items-center gap-6 mt-8">
                        <button
                            onClick={prevCard}
                            disabled={currentIndex === 0}
                            className="p-3 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <span className="text-muted font-mono">
                            {currentIndex + 1} / {cards.length}
                        </span>
                        <button
                            onClick={nextCard}
                            disabled={currentIndex === cards.length - 1}
                            className="p-3 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    <button
                        onClick={() => setCards([])}
                        className="mt-8 text-xs text-muted hover:text-foreground underline"
                    >
                        Generate New Deck
                    </button>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-muted border-2 border-dashed border-white/5 rounded-2xl">
                    <div className="text-center">
                        <Layers size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Your flashcards will appear here</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlashcardGenerator;
