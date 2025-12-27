'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle, XCircle, ChevronRight, ChevronLeft, RotateCcw, Clock, AlertCircle, StopCircle, History, Calendar, Trophy, X, Timer, Pause, PlayCircle } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import GlassCard from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import FuturisticLoader from '@/components/ui/FuturisticLoader';

interface MockTestGeneratorProps {
    notebookId: string;
    modelProvider: string;
}

interface Question {
    question: string;
    options?: string[];
    answer: string;
    type: 'mcq' | 'true-false' | 'short' | 'long';
}

interface MockTest {
    _id: string;
    questions: Question[];
    createdAt?: string;
    score?: number;
    userAnswers?: Record<string, string>;
}

interface GradingResult {
    score: number;
    feedback: string;
}

const MockTestGenerator = ({ notebookId, modelProvider }: MockTestGeneratorProps) => {
    const [step, setStep] = useState<'config' | 'loading' | 'test' | 'grading' | 'result'>('config');
    const [config, setConfig] = useState({
        count: 5,
        difficulty: 'Medium',
        questionTypes: ['mcq', 'true-false'],
        durationMode: 'auto' as 'auto' | 'custom',
        customDuration: 10, // minutes
        timeLimits: {
            mcq: 30,
            trueFalse: 15,
            short: 120,
        }
    });
    const [test, setTest] = useState<MockTest | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const userAnswersRef = useRef<Record<number, string>>({});
    const [gradingResults, setGradingResults] = useState<Record<number, GradingResult>>({});
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // History State
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<MockTest[]>([]);

    // Retake Config State
    const [retakeModalOpen, setRetakeModalOpen] = useState(false);
    const [selectedRetakeTest, setSelectedRetakeTest] = useState<MockTest | null>(null);
    const [retakeTimeMode, setRetakeTimeMode] = useState<'auto' | 'custom'>('auto');
    const [retakeCustomDuration, setRetakeCustomDuration] = useState(10);

    useEffect(() => {
        if (showHistory) {
            fetchHistory();
        }
    }, [showHistory, notebookId]);

    const fetchHistory = async () => {
        try {
            const res = await fetch(`/api/mocktests?notebookId=${notebookId}`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
            toast.error("Failed to load history");
        }
    };

    const calculateTimeLimit = (questions: Question[], mode: 'auto' | 'custom', customDur: number) => {
        if (mode === 'custom') {
            return customDur * 60;
        }

        let totalTime = 0;
        questions.forEach((q) => {
            if (q.type === 'mcq') totalTime += (config.timeLimits.mcq || 30);
            else if (q.type === 'true-false') totalTime += (config.timeLimits.trueFalse || 15);
            else totalTime += (config.timeLimits.short || 60);
        });
        return totalTime > 0 ? totalTime : 60;
    };

    const initiateRetake = (pastTest: MockTest) => {
        setSelectedRetakeTest(pastTest);
        setRetakeTimeMode(config.durationMode);
        setRetakeCustomDuration(config.customDuration);
        setRetakeModalOpen(true);
    };

    const confirmRetake = () => {
        if (!selectedRetakeTest) return;

        // Normalize questions
        const normalizedQuestions = selectedRetakeTest.questions.map((q: Question) => ({
            ...q,
            type: normalizeType(q)
        }));

        const testToRetake = { ...selectedRetakeTest, questions: normalizedQuestions };

        setTest(testToRetake);
        setCurrentQuestion(0);
        setUserAnswers({});
        userAnswersRef.current = {};
        setGradingResults({});
        setScore(0);
        setIsPaused(false);

        // Calculate time based on RETAKE config
        setTimeLeft(calculateTimeLimit(testToRetake.questions, retakeTimeMode, retakeCustomDuration));

        setStep('test');
        setShowHistory(false);
        setRetakeModalOpen(false);
        setSelectedRetakeTest(null);
    };

    // Simulated Progress
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'loading') {
            setProgress(0);
            // Increased duration estimates for smoother, slower progress
            const duration = config.count * (modelProvider === 'ollama' ? 6000 : 3000);
            const stepVal = 100 / (duration / 100);

            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) return 95; // Hold at 95%
                    return prev + stepVal;
                });
            }, 100);
        } else {
            setProgress(100);
        }
        return () => clearInterval(interval);
    }, [step, config.count, modelProvider]);

    // Sync ref with state
    useEffect(() => {
        userAnswersRef.current = userAnswers;
    }, [userAnswers]);

    // Timer Logic
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (step === 'test' && !isPaused) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        submitTest();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [step, isPaused]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const normalizeType = (q: Question): Question['type'] => {
        const t = q.type?.toLowerCase().trim() || '';
        // Heuristics to override/fix AI type hallucinations
        if (q.options && Array.isArray(q.options) && q.options.length > 0) return 'mcq';
        if (q.answer?.toLowerCase() === 'true' || q.answer?.toLowerCase() === 'false') return 'true-false';

        if (t.includes('true') || t.includes('false')) return 'true-false';
        if (t.includes('mcq') || t.includes('multiple')) return 'mcq';
        if (t.includes('short')) return 'short';
        if (t.includes('long')) return 'long';
        return 'short'; // Default fallback
    };

    const generateTest = async () => {
        setStep('loading');
        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notebookId,
                    type: 'mocktest',
                    config: {
                        count: config.count,
                        difficulty: config.difficulty,
                        questionTypes: config.questionTypes
                    },
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
                throw new Error(`${data.error} (${data.details || ''})`);
            }
            // Normalize question types
            const normalizedQuestions = data.questions.map((q: Question) => ({
                ...q,
                type: normalizeType(q)
            }));
            data.questions = normalizedQuestions;

            setTest(data);
            setIsPaused(false);

            // Calculate total time
            setTimeLeft(calculateTimeLimit(data.questions, config.durationMode, config.customDuration));

            setStep('test');
            toast.success('Mock test generated successfully!');
        } catch (error: unknown) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate test';
            toast.error(errorMessage);
            setStep('config');
        }
    };

    const handleAnswer = (answer: string) => {
        setUserAnswers(prev => {
            const next = { ...prev, [currentQuestion]: answer };
            userAnswersRef.current = next;
            return next;
        });
    };

    const normalizeAnswer = (str: string | number) => {
        return String(str)
            .toLowerCase()
            .trim()
            .replace(/[.,!?;]+$/, ''); // Remove trailing punctuation
    };

    const submitTest = async () => {
        if (!test) return;
        setStep('grading');
        let calculatedScore = 0;
        const newGradingResults: Record<number, GradingResult> = {};
        const currentAnswers = userAnswersRef.current; // Use ref for latest state

        try {
            // Process questions sequentially to avoid rate limits
            for (let idx = 0; idx < test.questions.length; idx++) {
                const q = test.questions[idx];
                const answer = currentAnswers[idx] || '';

                if (q.type === 'mcq' || q.type === 'true-false') {
                    if (normalizeAnswer(answer) === normalizeAnswer(q.answer)) {
                        calculatedScore += 10; // Standardize to 10 points per question
                        newGradingResults[idx] = { score: 10, feedback: 'Correct!' };
                    } else {
                        newGradingResults[idx] = { score: 0, feedback: 'Incorrect.' };
                    }
                } else {
                    // AI Grading for Short/Long answers
                    if (!answer.trim()) {
                        newGradingResults[idx] = { score: 0, feedback: 'No answer provided.' };
                        continue;
                    }

                    try {
                        const res = await fetch('/api/generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                notebookId,
                                type: 'grading',
                                config: {
                                    question: q.question,
                                    userAnswer: answer,
                                    referenceAnswer: q.answer
                                },
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
                        if (data.score !== undefined) {
                            calculatedScore += data.score;
                            newGradingResults[idx] = { score: data.score, feedback: data.feedback };
                        } else {
                            calculatedScore += 0; // Fallback
                            newGradingResults[idx] = { score: 0, feedback: 'Grading failed.' };
                        }
                    } catch (e) {
                        console.error("Grading failed for q", idx, e);
                        newGradingResults[idx] = { score: 0, feedback: 'Error during grading.' };
                    }
                }
            }
        } catch (e) {
            console.error("Submission error", e);
            toast.error("Error submitting test");
        }

        const finalScore = Math.round(calculatedScore * 10) / 10;
        setScore(finalScore);
        setGradingResults(newGradingResults);
        setStep('result');

        // Save results to database
        try {
            await fetch('/api/mocktests', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testId: test._id,
                    userAnswers: currentAnswers,
                    gradingResults: newGradingResults,
                    score: finalScore
                })
            });
            toast.success('Test results saved!');
        } catch (error) {
            console.error('Failed to save test results:', error);
            toast.error('Failed to save results');
        }
    };

    const nextQuestion = () => {
        if (!test) return;
        if (currentQuestion < test.questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            submitTest();
        }
    };

    return (
        <div className="h-full p-6 overflow-y-auto flex flex-col relative overflow-x-hidden overscroll-contain" data-lenis-prevent>
            <div className="shrink-0 mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold mb-2 text-glow">Mock Test</h2>
                    <p className="text-muted">Test your knowledge with AI-generated questions.</p>
                </div>
                {step === 'config' && (
                    <NeonButton
                        onClick={() => setShowHistory(true)}
                        className="flex items-center gap-2"
                        variant="secondary"
                    >
                        <History size={16} />
                        History
                    </NeonButton>
                )}
            </div>

            {/* History Sidebar */}
            <AnimatePresence>
                {showHistory && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowHistory(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute top-0 right-0 bottom-0 w-80 bg-black/80 border-l border-white/10 backdrop-blur-xl z-50 p-6 overflow-y-auto shadow-2xl"
                            data-lenis-prevent
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <History size={18} className="text-primary" />
                                    Test History
                                </h3>
                                <button
                                    onClick={() => setShowHistory(false)}
                                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {history.length === 0 ? (
                                    <div className="text-center py-8 text-muted">
                                        <p>No previous tests found.</p>
                                    </div>
                                ) : (
                                    history.map((pastTest, idx) => (
                                        <GlassCard key={pastTest._id || idx} className="p-4 border-white/5 hover:border-primary/30 transition-colors group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2 text-xs text-muted">
                                                    <Calendar size={12} />
                                                    {pastTest.createdAt ? new Date(pastTest.createdAt).toLocaleDateString() : 'Unknown Date'}
                                                </div>
                                                {pastTest.score !== undefined && (
                                                    <div className="flex items-center gap-1 text-xs font-bold text-primary">
                                                        <Trophy size={12} />
                                                        {typeof pastTest.score === 'number' ? pastTest.score.toFixed(1) : pastTest.score} pts
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mb-3">
                                                <p className="text-sm font-medium">{pastTest.questions.length} Questions</p>
                                            </div>

                                            <NeonButton
                                                onClick={() => initiateRetake(pastTest)}
                                                className="w-full text-xs h-8"
                                                variant="secondary"
                                            >
                                                <RotateCcw size={12} className="mr-1.5" />
                                                Retake Test
                                            </NeonButton>
                                        </GlassCard>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Retake Configuration Modal */}
            <AnimatePresence>
                {retakeModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md"
                        >
                            <GlassCard className="p-6 border-primary/30 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-white">Configure Retake</h3>
                                    <button onClick={() => setRetakeModalOpen(false)} className="text-muted hover:text-white">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium text-muted uppercase tracking-wider">Time Limit</label>
                                            <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
                                                <button
                                                    onClick={() => setRetakeTimeMode('auto')}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded text-xs font-medium transition-all",
                                                        retakeTimeMode === 'auto' ? "bg-primary/20 text-primary" : "text-muted hover:text-white"
                                                    )}
                                                >
                                                    Auto
                                                </button>
                                                <button
                                                    onClick={() => setRetakeTimeMode('custom')}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded text-xs font-medium transition-all",
                                                        retakeTimeMode === 'custom' ? "bg-primary/20 text-primary" : "text-muted hover:text-white"
                                                    )}
                                                >
                                                    Custom
                                                </button>
                                            </div>
                                        </div>

                                        {retakeTimeMode === 'custom' ? (
                                            <div className="relative h-8 flex items-center mt-2">
                                                <div className="absolute inset-0 bg-white/5 rounded-md border border-white/10" />
                                                <div
                                                    className="absolute left-0 top-0 bottom-0 bg-primary/10 rounded-l-md border-r border-primary/30 transition-all duration-75"
                                                    style={{ width: `${(retakeCustomDuration / 60) * 100}%` }}
                                                />
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="60"
                                                    step="1"
                                                    value={retakeCustomDuration}
                                                    onChange={(e) => setRetakeCustomDuration(parseInt(e.target.value))}
                                                    className="w-full absolute inset-0 opacity-0 cursor-pointer z-20"
                                                />
                                                <div
                                                    className="absolute h-6 w-3 bg-primary border border-white/50 shadow-[0_0_10px_rgba(0,240,255,0.5)] rounded-[2px] pointer-events-none transition-all duration-75 z-10 flex items-center justify-center"
                                                    style={{ left: `calc(${(retakeCustomDuration / 60) * 100}% - 6px)` }}
                                                >
                                                    <div className="w-px h-3 bg-black/50" />
                                                </div>
                                                <div className="absolute right-2 text-xs font-mono text-primary pointer-events-none">
                                                    {retakeCustomDuration}m
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 p-3 rounded-md bg-white/5 border border-white/10 text-xs text-muted mt-2">
                                                <Clock size={14} className="text-primary" />
                                                <span>AI will calculate optimal time based on questions.</span>
                                            </div>
                                        )}
                                    </div>

                                    <NeonButton onClick={confirmRetake} className="w-full">
                                        <Play size={16} className="mr-2" />
                                        Start Retake
                                    </NeonButton>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {step === 'config' && (
                    <motion.div
                        key="config"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full"
                    >
                        <div className="relative w-full">
                            {/* Decorative Tech Elements - Scaled Down */}
                            <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-primary/30 rounded-tl-lg" />
                            <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-primary/30 rounded-br-lg" />

                            <GlassCard className="w-full p-5 border-primary/20 bg-black/40 backdrop-blur-xl relative overflow-hidden">
                                {/* Background Grid */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-size-[20px_20px]" />

                                <div className="relative z-10">
                                    <div className="text-center mb-5 relative">
                                        <div className="absolute right-0 top-0">
                                            <button
                                                onClick={() => setShowHistory(true)}
                                                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 text-muted hover:text-primary transition-all"
                                                title="View History"
                                            >
                                                <History size={18} />
                                            </button>
                                        </div>
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-mono text-primary mb-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            SYSTEM_READY
                                        </div>
                                        <h3 className="text-lg font-bold text-white tracking-tight">CONFIGURE SIMULATION</h3>
                                    </div>

                                    <div className="space-y-5">
                                        {/* Question Count Slider */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <label className="text-xs font-medium text-muted uppercase tracking-wider">Target Output</label>
                                                <div className="text-2xl font-bold text-primary tabular-nums tracking-tighter leading-none">
                                                    {config.count.toString().padStart(2, '0')}
                                                    <span className="text-xs font-normal text-muted-foreground ml-1.5">QUESTIONS</span>
                                                </div>
                                            </div>

                                            <div className="relative h-8 flex items-center">
                                                <div className="absolute inset-0 bg-white/5 rounded-md border border-white/10" />
                                                <div
                                                    className="absolute left-0 top-0 bottom-0 bg-primary/10 rounded-l-md border-r border-primary/30 transition-all duration-75"
                                                    style={{ width: `${(config.count / 50) * 100}%` }}
                                                />
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="50"
                                                    step="1"
                                                    value={config.count}
                                                    onChange={(e) => setConfig({ ...config, count: parseInt(e.target.value) })}
                                                    className="w-full absolute inset-0 opacity-0 cursor-pointer z-20"
                                                />
                                                {/* Visual Thumb */}
                                                <div
                                                    className="absolute h-6 w-3 bg-primary border border-white/50 shadow-[0_0_10px_rgba(0,240,255,0.5)] rounded-[2px] pointer-events-none transition-all duration-75 z-10 flex items-center justify-center"
                                                    style={{ left: `calc(${(config.count / 50) * 100}% - 6px)` }}
                                                >
                                                    <div className="w-px h-3 bg-black/50" />
                                                </div>

                                                {/* Ticks */}
                                                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 pointer-events-none">
                                                    {[0, 10, 20, 30, 40, 50].map(tick => (
                                                        <div key={tick} className="h-1.5 w-px bg-white/20" />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-muted font-mono">
                                                <span>01</span>
                                                <span>50</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Difficulty Selector */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-muted uppercase tracking-wider">Difficulty</label>
                                                <div className="flex flex-col gap-1.5">
                                                    {['Easy', 'Medium', 'Hard'].map(d => (
                                                        <button
                                                            key={d}
                                                            onClick={() => setConfig({ ...config, difficulty: d })}
                                                            className={cn(
                                                                "relative group overflow-hidden px-3 py-2 rounded-md border text-left transition-all duration-300",
                                                                config.difficulty === d
                                                                    ? "bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(0,240,255,0.15)]"
                                                                    : "bg-white/5 border-white/10 hover:border-white/20 text-muted-foreground hover:text-white"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-300",
                                                                config.difficulty === d ? "bg-primary" : "bg-transparent group-hover:bg-white/20"
                                                            )} />
                                                            <span className="relative z-10 text-sm font-medium">{d}</span>
                                                            {config.difficulty === d && (
                                                                <motion.span
                                                                    layoutId="active-diff"
                                                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(0,240,255,1)]"
                                                                />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Question Types */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-muted uppercase tracking-wider">Modules</label>
                                                <div className="flex flex-col gap-1.5">
                                                    {[
                                                        { id: 'mcq', label: 'Multiple Choice', icon: 'A/B' },
                                                        { id: 'true-false', label: 'True / False', icon: '+/-' },
                                                        { id: 'short', label: 'Short Answer', icon: 'TXT' }
                                                    ].map(t => {
                                                        const isActive = config.questionTypes.includes(t.id);
                                                        return (
                                                            <button
                                                                key={t.id}
                                                                onClick={() => {
                                                                    const types = isActive
                                                                        ? config.questionTypes.filter(x => x !== t.id)
                                                                        : [...config.questionTypes, t.id];
                                                                    if (types.length > 0) setConfig({ ...config, questionTypes: types });
                                                                }}
                                                                className={cn(
                                                                    "flex items-center justify-between px-3 py-2 rounded-md border transition-all duration-300",
                                                                    isActive
                                                                        ? "bg-secondary/10 border-secondary text-secondary shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                                                                        : "bg-white/5 border-white/10 hover:border-white/20 text-muted-foreground hover:text-white"
                                                                )}
                                                            >
                                                                <span className="text-sm font-medium">{t.label}</span>
                                                                <span className={cn(
                                                                    "text-[10px] font-mono px-1.5 py-0.5 rounded border",
                                                                    isActive ? "border-secondary/50 bg-secondary/20" : "border-white/10 bg-white/5"
                                                                )}>{t.icon}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Time Configuration */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-medium text-muted uppercase tracking-wider">Time Limit</label>
                                                <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
                                                    <button
                                                        onClick={() => setConfig({ ...config, durationMode: 'auto' })}
                                                        className={cn(
                                                            "px-2 py-1 rounded text-[10px] font-medium transition-all",
                                                            config.durationMode === 'auto' ? "bg-primary/20 text-primary" : "text-muted hover:text-white"
                                                        )}
                                                    >
                                                        Auto
                                                    </button>
                                                    <button
                                                        onClick={() => setConfig({ ...config, durationMode: 'custom' })}
                                                        className={cn(
                                                            "px-2 py-1 rounded text-[10px] font-medium transition-all",
                                                            config.durationMode === 'custom' ? "bg-primary/20 text-primary" : "text-muted hover:text-white"
                                                        )}
                                                    >
                                                        Custom
                                                    </button>
                                                </div>
                                            </div>

                                            {config.durationMode === 'custom' ? (
                                                <div className="relative h-8 flex items-center">
                                                    <div className="absolute inset-0 bg-white/5 rounded-md border border-white/10" />
                                                    <div
                                                        className="absolute left-0 top-0 bottom-0 bg-primary/10 rounded-l-md border-r border-primary/30 transition-all duration-75"
                                                        style={{ width: `${(config.customDuration / 60) * 100}%` }}
                                                    />
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="60"
                                                        step="1"
                                                        value={config.customDuration}
                                                        onChange={(e) => setConfig({ ...config, customDuration: parseInt(e.target.value) })}
                                                        className="w-full absolute inset-0 opacity-0 cursor-pointer z-20"
                                                    />
                                                    <div
                                                        className="absolute h-6 w-3 bg-primary border border-white/50 shadow-[0_0_10px_rgba(0,240,255,0.5)] rounded-[2px] pointer-events-none transition-all duration-75 z-10 flex items-center justify-center"
                                                        style={{ left: `calc(${(config.customDuration / 60) * 100}% - 6px)` }}
                                                    >
                                                        <div className="w-px h-3 bg-black/50" />
                                                    </div>
                                                    <div className="absolute right-2 text-xs font-mono text-primary pointer-events-none">
                                                        {config.customDuration}m
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 p-2 rounded-md bg-white/5 border border-white/10 text-xs text-muted">
                                                    <Clock size={12} className="text-primary" />
                                                    <span>AI will calculate optimal time based on questions.</span>
                                                </div>
                                            )}
                                        </div>

                                        <NeonButton
                                            onClick={generateTest}
                                            className="w-full mt-4 group relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                            <Play size={16} className="mr-2 group-hover:scale-110 transition-transform" />
                                            INITIALIZE TEST SEQUENCE
                                        </NeonButton>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    </motion.div>
                )}

                {step === 'loading' && (
                    <div className="flex-1 flex items-center justify-center">
                        <FuturisticLoader
                            text="Generating Mock Test"
                            subtext={`Creating ${config.count} ${config.difficulty} questions...`}
                            progress={progress}
                        />
                    </div>
                )}

                {step === 'test' && test && (
                    <motion.div
                        key="test"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="max-w-2xl mx-auto relative"
                    >
                        {/* Paused Overlay */}
                        <AnimatePresence>
                            {isPaused && (
                                <motion.div
                                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                                    animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
                                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 rounded-xl border border-white/10"
                                >
                                    <div className="p-8 rounded-full bg-black/50 border border-primary/30 mb-6 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
                                        <Pause size={48} className="text-primary" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2 tracking-widest">SIMULATION PAUSED</h3>
                                    <p className="text-muted mb-8">Timer stopped. Content hidden.</p>

                                    <NeonButton onClick={() => setIsPaused(false)} className="px-8">
                                        <PlayCircle size={20} className="mr-2" />
                                        RESUME
                                    </NeonButton>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mb-6 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <span className="text-muted">Question {currentQuestion + 1} of {test.questions.length}</span>
                                <div className="flex items-center gap-2">
                                    <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full border transition-colors",
                                        timeLeft < 30 ? "border-destructive text-destructive bg-destructive/10" : "border-primary text-primary bg-primary/10"
                                    )}>
                                        <Clock size={14} />
                                        <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                                    </div>

                                    <button
                                        onClick={() => setIsPaused(!isPaused)}
                                        className="p-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 transition-all text-muted hover:text-primary"
                                        title={isPaused ? "Resume" : "Pause"}
                                    >
                                        {isPaused ? <Play size={14} /> : <Pause size={14} />}
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={submitTest}
                                className="flex items-center gap-2 text-destructive hover:text-destructive/80 transition-colors text-sm font-medium"
                            >
                                <StopCircle size={16} />
                                End Test
                            </button>
                        </div>

                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-6">
                            <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${((currentQuestion + 1) / test.questions.length) * 100}%` }}
                            />
                        </div>

                        <GlassCard className="mb-8 min-h-[300px] flex flex-col justify-center transition-all duration-300">
                            <h3 className="text-xl font-medium mb-6">{test.questions[currentQuestion].question}</h3>

                            <div className="space-y-3">
                                {test.questions[currentQuestion].type === 'mcq' && test.questions[currentQuestion].options?.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(option)}
                                        disabled={isPaused}
                                        className={cn(
                                            "w-full text-left p-4 rounded-xl border transition-all",
                                            userAnswers[currentQuestion] === option
                                                ? "bg-primary/20 border-primary text-primary"
                                                : "bg-white/5 border-white/10 hover:bg-white/10",
                                            isPaused && "opacity-50 pointer-events-none"
                                        )}
                                    >
                                        {option}
                                    </button>
                                ))}

                                {test.questions[currentQuestion].type === 'true-false' && ['True', 'False'].map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => handleAnswer(option)}
                                        disabled={isPaused}
                                        className={cn(
                                            "w-full text-left p-4 rounded-xl border transition-all",
                                            userAnswers[currentQuestion] === option
                                                ? "bg-primary/20 border-primary text-primary"
                                                : "bg-white/5 border-white/10 hover:bg-white/10",
                                            isPaused && "opacity-50 pointer-events-none"
                                        )}
                                    >
                                        {option}
                                    </button>
                                ))}

                                {(test.questions[currentQuestion].type === 'short' || test.questions[currentQuestion].type === 'long') && (
                                    <textarea
                                        value={userAnswers[currentQuestion] || ''}
                                        onChange={(e) => handleAnswer(e.target.value)}
                                        disabled={isPaused}
                                        placeholder="Type your answer here..."
                                        className={cn(
                                            "w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-primary/50",
                                            isPaused && "opacity-50 pointer-events-none"
                                        )}
                                    />
                                )}
                            </div>
                        </GlassCard>

                        <div className="flex justify-between">
                            <NeonButton
                                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestion === 0 || isPaused}
                                className={cn(currentQuestion === 0 && "opacity-50 cursor-not-allowed")}
                            >
                                <ChevronLeft size={18} />
                                Previous
                            </NeonButton>

                            <NeonButton onClick={nextQuestion} disabled={(!userAnswers[currentQuestion] && timeLeft > 0) || isPaused}>
                                {currentQuestion === test.questions.length - 1 ? 'Finish' : 'Next'}
                                <ChevronRight size={18} />
                            </NeonButton>
                        </div>
                    </motion.div>
                )}

                {step === 'grading' && (
                    <motion.div
                        key="grading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center h-full space-y-4"
                    >
                        <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
                        <p className="text-secondary animate-pulse">AI is grading your answers...</p>
                    </motion.div>
                )}

                {step === 'result' && test && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-2xl mx-auto text-center"
                    >
                        <div className="mb-8">
                            <div className="w-32 h-32 mx-auto rounded-full border-4 border-primary flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,240,255,0.3)]">
                                <span className="text-3xl font-bold text-primary">{score.toFixed(1)}</span>
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Test Completed!</h2>
                            <p className="text-muted">Total Score out of {test.questions.length * 10}</p>
                        </div>

                        <div className="space-y-4 text-left mb-8">
                            {test.questions.map((q, idx) => (
                                <GlassCard key={idx} className={cn(
                                    "border-l-4",
                                    gradingResults[idx]?.score >= 5 ? "border-l-success" : "border-l-destructive"
                                )}>
                                    <div className="flex items-start gap-3">
                                        {gradingResults[idx]?.score >= 5
                                            ? <CheckCircle className="text-success shrink-0 mt-1" size={20} />
                                            : <XCircle className="text-destructive shrink-0 mt-1" size={20} />
                                        }
                                        <div className="w-full">
                                            <div className="flex justify-between items-start">
                                                <p className="font-medium mb-2">{q.question}</p>
                                                <span className={cn("text-sm font-bold", gradingResults[idx]?.score >= 5 ? "text-success" : "text-destructive")}>
                                                    {gradingResults[idx]?.score}/10
                                                </span>
                                            </div>

                                            <p className="text-sm text-muted mb-1">Your Answer: <span className="text-foreground">{userAnswers[idx] || '(No answer)'}</span></p>

                                            {(q.type === 'mcq' || q.type === 'true-false') && normalizeAnswer(userAnswers[idx] || '') !== normalizeAnswer(q.answer) && (
                                                <p className="text-sm text-success">Correct Answer: {q.answer}</p>
                                            )}

                                            {(q.type === 'short' || q.type === 'long') && (
                                                <div className="mt-2 p-2 bg-white/5 rounded text-sm">
                                                    <p className="text-xs text-muted uppercase mb-1">AI Feedback</p>
                                                    <p className="text-foreground/80">{gradingResults[idx]?.feedback}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>

                        <NeonButton onClick={() => {
                            setStep('config');
                            setTest(null);
                            setCurrentQuestion(0);
                            setUserAnswers({});
                            setScore(0);
                            setGradingResults({});
                        }}>
                            <RotateCcw size={18} />
                            Take Another Test
                        </NeonButton>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default MockTestGenerator;
