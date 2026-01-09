'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, ArrowRight, Trophy, Clock, Brain, Shield, CheckCircle, Zap, Timer, FileQuestion, ChevronRight, Play, Calculator, Star } from 'lucide-react';
import { DailyGoal } from '@/app/explore/types';
import Confetti from 'react-confetti';
import NeonButton from '../ui/NeonButton';
import GlassCard from '../ui/GlassCard';
import ScientificSymbolsToolbar from './ScientificSymbolsToolbar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { safeFetch } from '@/lib/api-client';


import { useGoalStore } from '@/store/useGoalStore';


interface TestRunnerProps {
    goal: DailyGoal;
    onClose: () => void;
    onComplete: (score: number, passed: boolean) => void;
}

export default function TestRunner({ goal, onClose, onComplete }: TestRunnerProps) {
    const setIsTestActive = useGoalStore(state => state.setIsTestActive);
    const [testState, setTestState] = useState<'intro' | 'active' | 'results'>('intro');

    // Manage global test active state for UI components (like Navbar)
    useEffect(() => {
        setIsTestActive(true);
        return () => setIsTestActive(false);
    }, [setIsTestActive]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
    const [isIndexOpen, setIsIndexOpen] = useState(false);
    const [evaluations, setEvaluations] = useState<Record<number, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);
    // Local state for the text area - synced with userAnswers when moving nav
    const [currentText, setCurrentText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [rewardResult, setRewardResult] = useState<{ type: string, value: any, label?: string } | null>(null);

    const questions = goal.questions || [];
    const currentQuestion = questions[currentIndex];

    // Anti-Cheat State
    const [antiCheatEnabled, setAntiCheatEnabled] = useState(false);
    const [isDisqualified, setIsDisqualified] = useState(false);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);

    // Synchronize current text to global state whenever it changes 
    // This makes jumping safer, though handleNext/Prev still do it explicitly
    useEffect(() => {
        if (testState === 'active') {
            setUserAnswers(prev => ({ ...prev, [currentIndex]: currentText }));
        }
    }, [currentText, currentIndex, testState]);

    // Initialize text area when index changes
    useEffect(() => {
        const text = userAnswers[currentIndex] || '';
        setCurrentText(text);
        // We strictly only want to update this when the index changes or initial data loads
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex]);


    // Fetch Anti-Cheat Setting
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await safeFetch<{ antiCheatEnabled: boolean }>('/api/admin/settings');
                setAntiCheatEnabled(data.antiCheatEnabled);
            } catch (err) {
                console.error("Failed to fetch settings", err);
            }
        };
        fetchSettings();
    }, []);


    // Timer
    useEffect(() => {
        if (testState !== 'active') return;
        const timer = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [testState]);

    // Check for previous disqualification or completion
    useEffect(() => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const checkStatus = async () => {
            try {
                const data = await safeFetch<{ status: string }>(`/api/daily-goals/status?goalId=${goal.id}`, {
                    signal: controller.signal
                });
                if (data.status === 'disqualified') {
                    setIsDisqualified(true);
                }
            } catch (e: any) {
                if (e.name === 'AbortError' || e.code === 'TIMEOUT') {
                    console.warn("Status check timed out - allowing start by default");
                    // toast.warning("Network slow, status check skipped.");
                } else {
                    console.error("Failed to check status", e);
                }
            } finally {
                clearTimeout(timeoutId);
                setIsLoadingStatus(false);
            }
        };
        checkStatus();


        return () => {
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, [goal.id]);

    // Anti-Cheat Enforcement
    useEffect(() => {
        if (testState !== 'active' || !antiCheatEnabled || isDisqualified) return;

        // Stabilization: Wait 2 seconds before enforcing anti-cheat 
        // to allow for full-screen transitions and window stabilization
        const stabilizationTimeout = setTimeout(() => {
            console.log("[Anti-Cheat] Enforcement Active");
        }, 2000);

        const reportDisqualification = async (reason: string) => {
            try {
                await safeFetch('/api/daily-goals/evaluate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        goalId: goal.id,
                        isDisqualified: true
                    })
                });
            } catch (e) {
                console.error("Failed to report disqualification", e);
            }
        };


        const failTest = (reason: string) => {
            // Check if stabilization period has passed
            // If the user blurs/resizes immediately during start, we give them a pass 
            // This prevents "Enter Full Screen" button itself from triggering a blur-fail
            setIsDisqualified(true);
            setTestState('results');
            toast.error("Test Failed!", { description: reason });
            reportDisqualification(reason);
        };

        const handleVisibilityChange = () => {
            if (document.hidden) failTest("Anti-Cheat: Focus detected. Test disqualified.");
        };

        const handleBlur = () => {
            // Only fail if it's been a few seconds (allow for transition focus flickers)
            failTest("Anti-Cheat: Window focus lost. Test disqualified.");
        };

        const handleResize = () => {
            // Lenient resize check: allow small changes (e.g. browser chrome adjustments)
            if (window.outerHeight < screen.availHeight * 0.8 || window.outerWidth < screen.availWidth * 0.8) {
                failTest("Anti-Cheat: Browser window resized significantly. Test disqualified.");
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                failTest("Anti-Cheat: You exited Full Screen mode. Test disqualified.");
            }
        };

        const preventCopyPaste = (e: Event) => {
            e.preventDefault();
            toast.error("Action Prohibited", { description: "Copy/Paste is disabled." });
        };

        // Delay attachment of sensitive listeners
        const timer = setTimeout(() => {
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('blur', handleBlur);
            window.addEventListener('resize', handleResize);
            document.addEventListener('fullscreenchange', handleFullscreenChange);
            document.addEventListener('copy', preventCopyPaste);
            document.addEventListener('paste', preventCopyPaste);
            document.addEventListener('cut', preventCopyPaste);
            document.addEventListener('contextmenu', preventCopyPaste);
        }, 3000);

        return () => {
            clearTimeout(stabilizationTimeout);
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('copy', preventCopyPaste);
            document.removeEventListener('paste', preventCopyPaste);
            document.removeEventListener('cut', preventCopyPaste);
            document.removeEventListener('contextmenu', preventCopyPaste);
        };
    }, [testState, antiCheatEnabled, isDisqualified, goal.id]);

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            handleSubmitTest();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const jumpToQuestion = (index: number) => {
        if (index >= 0 && index < questions.length) {
            setCurrentIndex(index);
        }
    };

    const toggleMarkForReview = () => {
        setMarkedForReview(prev => ({
            ...prev,
            [currentIndex]: !prev[currentIndex]
        }));
    };

    const handleInsertSymbol = (symbol: string) => {
        if (!textareaRef.current) return;
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = currentText;
        const before = text.substring(0, start);
        const after = text.substring(end);

        setCurrentText(before + symbol + after);

        // Focus back and set cursor
        setTimeout(() => {
            textarea.focus();
            const newPos = start + symbol.length;
            textarea.setSelectionRange(newPos, newPos);
        }, 0);
    };

    const handleSubmitTest = async () => {
        const finalAnswers = { ...userAnswers, [currentIndex]: currentText };
        setUserAnswers(finalAnswers);

        setIsSubmitting(true);
        try {
            const submissions = Object.keys(finalAnswers).map(index => ({
                questionIndex: parseInt(index),
                userAnswer: finalAnswers[parseInt(index)]
            }));

            const data = await safeFetch<any>('/api/daily-goals/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goalId: goal.id,
                    submissions
                })
            });

            if (data.evaluations) {
                const evalMap: Record<number, any> = {};
                data.evaluations.forEach((evalItem: any) => {
                    evalMap[evalItem.questionIndex] = evalItem;
                });
                setEvaluations(evalMap);
                setRewardResult({ type: data.rewardType, value: data.rewardValue, label: data.rarityLabel });
                setTestState('results');
            } else {
                toast.error("Failed to evaluate answers.");
            }
        } catch (error: any) {
            console.error(error);
            const msg = error?.message || "An error occurred during evaluation.";
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }


    };

    const closeTest = () => {
        if (isDisqualified) {
            onComplete(0, false);
            return;
        }
        const passedCount = Object.values(evaluations).filter((e: any) => e.isCorrect).length;
        const passed = (passedCount / questions.length) >= 0.6;
        const totalScore = passedCount;
        onComplete(totalScore, passed);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const calculateResults = () => {
        if (isDisqualified) {
            return { totalEarnedPoints: 0, maxTotalPoints: questions.length * 10, awardedXP: 0, questionScores: [] };
        }

        let totalEarnedPoints = 0;
        const maxPointsPerQuestion = 10;
        const questionScores = questions.map((_, idx) => {
            const ev = evaluations[idx];
            if (!ev) return 0;
            const avg = (ev.precisionScore + ev.keywordScore + ev.qualityScore) / 3;
            return Math.round(avg / 10);
        });

        totalEarnedPoints = questionScores.reduce((a, b) => a + b, 0);
        const maxTotalPoints = questions.length * maxPointsPerQuestion;
        const ratio = maxTotalPoints > 0 ? (totalEarnedPoints / maxTotalPoints) : 0;
        const awardedXP = Math.round(goal.xp * ratio);

        return { totalEarnedPoints, maxTotalPoints, awardedXP, questionScores };
    };

    const startTest = async () => {
        try {
            await document.documentElement.requestFullscreen();
        } catch (err) {
            console.error("Fullscreen request failed:", err);
        }
        setTestState('active');
    };

    // Updated Start Button Logic
    if (testState === 'intro') {
        const canStart = !isDisqualified && !isLoadingStatus;

        return (
            <div className="fixed inset-0 z-50 bg-[#050505] flex items-center justify-center p-4 overflow-y-auto no-scrollbar" data-lenis-prevent>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-xl w-full bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 md:p-10 relative overflow-hidden my-auto"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 to-purple-500" />

                    {/* Disqualified Banner */}
                    {isDisqualified && (
                        <div className="absolute top-0 left-0 w-full bg-red-600/20 text-red-500 text-xs font-bold uppercase tracking-widest text-center py-1">
                            Disqualified
                        </div>
                    )}

                    <div className="text-center mb-6 pt-4">
                        <div className={cn(
                            "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 border",
                            isDisqualified ? "bg-red-500/10 border-red-500/20" : "bg-primary/10 border-primary/20"
                        )}>
                            {isDisqualified ? <Shield size={32} className="text-red-500" /> : <Brain size={32} className="text-primary" />}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{goal.title}</h2>
                        <p className="text-muted-foreground">
                            {isDisqualified ? "You have been disqualified from this test." : "Ready to challenge yourself?"}
                        </p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                                <AlertCircle size={16} className="text-blue-400" />
                                Tips for Success
                            </h3>
                            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
                                <li>Be precise and specific in your answers.</li>
                                <li>Use relevant keywords and terminology.</li>
                                <li>Explain the 'Why' and 'How', not just the 'What'.</li>
                                <li>Don't rush! Take your time to formulate good responses.</li>
                            </ul>
                        </div>

                        {antiCheatEnabled && (
                            <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                                <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                                    <Shield size={16} />
                                    Anti-Cheat Enabled
                                </h3>
                                <p className="text-xs text-red-300/80">
                                    Strict mode active.
                                    <br />
                                    • Full Screen is REQUIRED.
                                    <br />
                                    • Switching tabs/windows = Disqualification.
                                    <br />
                                    • Exiting Full Screen = Disqualification.
                                </p>
                            </div>
                        )}

                        {!isDisqualified && (
                            <div className="bg-green-500/5 rounded-xl p-4 border border-green-500/10">
                                <p className="text-sm text-green-400 text-center italic">
                                    "Theory is hard, but true mastery comes from deep understanding. You got this!"
                                </p>
                            </div>
                        )}
                    </div>

                    <NeonButton
                        className={cn("w-full justify-center", !canStart && "opacity-50 cursor-not-allowed hover:shadow-none hover:border-white/10 grayscale")}
                        onClick={canStart ? startTest : undefined}
                        disabled={!canStart}
                    >
                        {isLoadingStatus ? "Checking Status..." : (isDisqualified ? "Disqualified" : "Enter Full Screen & Start")}
                    </NeonButton>
                </motion.div>
            </div>
        );
    }

    if (testState === 'results') {
        const { totalEarnedPoints, maxTotalPoints, awardedXP, questionScores } = calculateResults();

        let passed = false;
        if (!isDisqualified) {
            const passedCount = Object.values(evaluations).filter((e: any) => e.isCorrect).length;
            const percentage = Math.round((passedCount / questions.length) * 100);
            passed = percentage >= 60;
        }

        return (
            <div className="fixed inset-0 z-50 bg-[#050505] flex items-center justify-center p-4 overflow-y-auto no-scrollbar" data-lenis-prevent>
                {passed && <Confetti recycle={false} numberOfPieces={500} />}

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-4xl w-full bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 md:p-10 text-center relative max-h-[95vh] flex flex-col my-auto"
                >
                    <div className={cn(
                        "absolute top-0 left-0 w-full h-2 rounded-t-3xl",
                        isDisqualified ? "bg-red-600" : (passed ? "bg-green-500" : "bg-red-500")
                    )} />

                    <div className="flex-1 overflow-y-auto pr-2 no-scrollbar" data-lenis-prevent>

                        <div className="mb-6 flex justify-center">
                            <div className={cn(
                                "w-24 h-24 rounded-full flex items-center justify-center border-4",
                                isDisqualified
                                    ? "border-red-600 bg-red-600/10 text-red-600"
                                    : (passed ? "border-green-500 bg-green-500/10 text-green-500" : "border-red-500 bg-red-500/10 text-red-500")
                            )}>
                                {isDisqualified ? <Shield size={48} /> : (passed ? <Trophy size={48} /> : <AlertCircle size={48} />)}
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold mb-2 text-white">
                            {isDisqualified
                                ? "Disqualified!"
                                : (passed
                                    ? (goal.isExam ? "Exam Completed!" : "Goal Completed!")
                                    : (goal.isExam ? "Exam Failed" : "Goal Failed")
                                )
                            }
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            {isDisqualified
                                ? "Anti-Cheat violation detected. Your test has been voided."
                                : (passed
                                    ? (goal.isExam ? "You passed the exam!" : `You mastered ${goal.title}!`)
                                    : "Review your feedback and try again.")}
                        </p>

                        {/* XP & Score Summary */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-white/5 rounded-2xl p-4">
                                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Score</div>
                                <div className="text-2xl font-bold text-white">
                                    {totalEarnedPoints}/{maxTotalPoints}
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-yellow-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10">
                                    <div className="text-xs text-yellow-500/70 uppercase tracking-wider mb-1 font-bold">
                                        {rewardResult?.type === 'Rarity' ? `${rewardResult.label} Points` : 'XP Earned'}
                                    </div>
                                    <div className="text-2xl font-bold text-yellow-400">
                                        {rewardResult?.type === 'Rarity'
                                            ? `+${rewardResult.value}`
                                            : `+${awardedXP} XP`
                                        }
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4">
                                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Time</div>
                                <div className="text-2xl font-bold text-blue-400">
                                    {formatTime(timeElapsed)}
                                </div>
                            </div>
                        </div>

                        {/* Detailed Feedback List */}
                        <div className="text-left space-y-4 mb-8">
                            <h3 className="text-lg font-bold text-white mb-4">Detailed Feedback</h3>
                            {questions.map((q, idx) => {
                                const evalResult = evaluations[idx];
                                if (!evalResult) return null;
                                const score = questionScores[idx];

                                return (
                                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-sm text-gray-300">Q{idx + 1}</span>
                                            <span className={cn("text-xs font-bold px-2 py-1 rounded", evalResult.isCorrect ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                                                Score: {score}/10
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-white mb-2">{q.question}</p>
                                        <p className="text-sm text-muted-foreground mb-3 italic border-l-2 border-white/10 pl-3">"{userAnswers[idx]?.substring(0, 150)}{userAnswers[idx]?.length > 150 ? '...' : ''}"</p>

                                        <div className="text-sm text-white/80 bg-black/20 p-3 rounded-lg border border-white/5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Brain size={14} className="text-purple-400" />
                                                <span className="text-purple-400 font-bold text-xs uppercase">AI Feedback</span>
                                            </div>
                                            {evalResult.feedback}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="space-y-3">
                            <NeonButton className="w-full justify-center" onClick={closeTest}>
                                {passed ? "Claim Rewards" : "Close"}
                            </NeonButton>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!currentQuestion) return null;

    return (
        <div className="fixed inset-0 z-50 bg-[#020202] text-white flex flex-col overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            </div>

            {/* Top Progress Line (Ultra Thin) */}
            <div className="fixed top-0 left-0 w-full h-[3px] bg-white/5 z-50">
                <motion.div
                    className="h-full bg-linear-to-r from-primary via-blue-400 to-primary shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: questions.length > 0 ? `${((currentIndex + 1) / questions.length) * 100}%` : '100%' }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                />
            </div>

            {/* Header */}
            <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 md:px-12 relative z-10 bg-black/20 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X size={20} className="text-muted-foreground" />
                    </button>
                    <div className="w-px h-8 bg-white/10 hidden md:block" />
                    <button
                        onClick={() => setIsIndexOpen(!isIndexOpen)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
                            isIndexOpen ? "bg-primary text-black" : "bg-white/5 text-white hover:bg-white/10"
                        )}
                    >
                        <FileQuestion size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Index</span>
                    </button>
                    <div className="hidden lg:block">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            {goal.isExam ? "Exam Session" : "Daily Goal Test"}
                        </div>
                        <div className="font-bold text-sm md:text-base">{goal.title}</div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <div className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mb-0.5 opacity-80">
                            Time Integrity
                        </div>
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-xl border border-white/10 shadow-inner">
                            <Clock size={14} className="text-primary animate-pulse" />
                            <span className="text-sm font-mono font-bold tracking-wider">{formatTime(timeElapsed)}</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Side Index Panel */}
                <AnimatePresence>
                    {isIndexOpen && (
                        <motion.aside
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            className="absolute lg:relative z-40 w-[280px] h-full bg-[#0A0A0A] border-r border-white/10 flex flex-col"
                        >
                            <div className="p-6 border-b border-white/5">
                                <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-4">Question Navigator</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {questions.map((_, idx) => {
                                        const isCurrent = currentIndex === idx;
                                        const isAnswered = !!userAnswers[idx]?.trim();
                                        const isMarked = !!markedForReview[idx];

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => jumpToQuestion(idx)}
                                                className={cn(
                                                    "h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all relative border",
                                                    isCurrent ? "border-primary bg-primary/20 text-white shadow-[0_0_15px_rgba(0,240,255,0.3)]" : "border-white/10",
                                                    !isCurrent && isMarked && "bg-purple-500/10 border-purple-500/30 text-purple-400",
                                                    !isCurrent && !isMarked && isAnswered && "bg-green-500/10 border-green-500/30 text-green-400",
                                                    !isCurrent && !isMarked && !isAnswered && "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                                                )}
                                            >
                                                {idx + 1}
                                                {isMarked && !isCurrent && <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-500" />}
                                                {isAnswered && !isCurrent && !isMarked && <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Question Status</div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-white/60">
                                            <div className="w-2.5 h-2.5 rounded bg-primary" /> Current Question
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-white/60">
                                            <div className="w-2.5 h-2.5 rounded bg-green-500" /> Answered
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-white/60">
                                            <div className="w-2.5 h-2.5 rounded bg-purple-500" /> Marked for Review
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-white/60">
                                            <div className="w-2.5 h-2.5 rounded bg-white/10" /> Not Answered
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-white/5 m-4 rounded-xl border border-white/10">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Progress</span>
                                    <span className="text-[10px] font-bold text-primary">{Math.round((Object.values(userAnswers).filter(a => !!a.trim()).length / questions.length) * 100)}%</span>
                                </div>
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary"
                                        style={{ width: `${(Object.values(userAnswers).filter(a => !!a.trim()).length / questions.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    {/* Progress Bar Top */}
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-white/5 z-20">
                        <motion.div
                            className="h-full bg-linear-to-r from-primary via-blue-400 to-primary shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: questions.length > 0 ? `${((currentIndex + 1) / questions.length) * 100}%` : '100%' }}
                            transition={{ type: "spring", stiffness: 50, damping: 20 }}
                        />
                    </div>

                    {/* Main Content */}
                    <main className="flex-1 overflow-y-auto relative z-10 py-12 px-4 md:px-8 no-scrollbar scroll-smooth" data-lenis-prevent>
                        <div className="max-w-5xl mx-auto">
                            {/* Question */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={`q-title-${currentIndex}`}
                                className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-6"
                            >
                                <div className="flex-1 text-center md:text-left">
                                    <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest mb-4">
                                        Question {currentIndex + 1}
                                    </div>
                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-[1.2] tracking-tight bg-linear-to-b from-white to-white/70 bg-clip-text text-transparent">
                                        {currentQuestion.question}
                                    </h2>
                                </div>
                                <div className="flex shrink-0 gap-2 justify-center">
                                    <button
                                        onClick={toggleMarkForReview}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all",
                                            markedForReview[currentIndex]
                                                ? "bg-purple-600 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                                                : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                                        )}
                                    >
                                        <Star size={14} fill={markedForReview[currentIndex] ? "currentColor" : "none"} />
                                        {markedForReview[currentIndex] ? "Marked for Review" : "Mark for Review"}
                                    </button>
                                </div>
                            </motion.div>

                            {/* Answer Input Area: MCQ or Textarea */}
                            <motion.div
                                key={`input-${currentIndex}`} // Force re-render on question change
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mb-8"
                            >
                                {currentQuestion.type === 'MCQ' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(currentQuestion.options || []).map((option: string, idx: number) => {
                                            const isSelected = currentText === option;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => !isSubmitting && setCurrentText(option)}
                                                    disabled={isSubmitting}
                                                    className={cn(
                                                        "p-6 rounded-2xl border-2 text-left transition-all duration-200 group relative overflow-hidden",
                                                        isSelected
                                                            ? "bg-blue-600/20 border-blue-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                                                            : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 text-gray-300"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4 relative z-10">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-colors",
                                                            isSelected
                                                                ? "bg-blue-500 border-blue-500 text-white"
                                                                : "border-white/20 text-muted-foreground group-hover:border-white/40"
                                                        )}>
                                                            {['A', 'B', 'C', 'D'][idx]}
                                                        </div>
                                                        <span className="text-lg font-medium">{option}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                                                <Calculator size={18} />
                                            </div>
                                            <h5 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                                Scientific Tool
                                            </h5>
                                        </div>
                                        <ScientificSymbolsToolbar onInsert={handleInsertSymbol} className="mb-6 shadow-2xl border-white/5 hover:border-white/10 transition-colors" />

                                        <div className="relative group/textarea">
                                            <div className="absolute -inset-1 bg-linear-to-r from-primary/30 to-purple-500/30 rounded-4xl blur-2xl opacity-0 group-focus-within/textarea:opacity-100 transition duration-700" />
                                            <div className="relative">
                                                <textarea
                                                    ref={textareaRef}
                                                    value={currentText}
                                                    onChange={(e) => setCurrentText(e.target.value)}
                                                    placeholder="Synthesize your comprehensive response here..."
                                                    className="w-full h-72 sm:h-96 bg-black/40 border border-white/10 rounded-3xl p-6 sm:p-10 text-lg sm:text-xl font-light focus:border-primary/40 focus:bg-black/60 focus:ring-4 focus:ring-primary/5 transition-all resize-none outline-none leading-relaxed placeholder:text-white/10 custom-scrollbar"
                                                    disabled={isSubmitting}
                                                />
                                                <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-4 text-xs font-mono text-muted-foreground bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-primary">{currentText.split(/\s+/).filter(Boolean).length}</span>
                                                        <span>WORDS</span>
                                                    </div>
                                                    <div className="w-px h-3 bg-white/20" />
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-secondary">{currentText.length}</span>
                                                        <span>CHARS</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </main>

                    {/* Footer */}
                    <footer className="h-auto min-h-24 border-t border-white/5 bg-black/40 backdrop-blur-2xl flex items-center justify-center px-6 md:px-12 relative z-10 py-6 md:py-0">
                        <div className="max-w-5xl w-full flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button
                                    onClick={handlePrev}
                                    disabled={currentIndex === 0 || isSubmitting}
                                    className={cn(
                                        "flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 w-full sm:w-auto justify-center",
                                        (currentIndex === 0 || isSubmitting) ? "opacity-20 pointer-events-none" : "text-muted-foreground hover:text-white"
                                    )}
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={currentIndex === questions.length - 1 || isSubmitting}
                                    className={cn(
                                        "flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 w-full sm:w-auto justify-center",
                                        (currentIndex === questions.length - 1 || isSubmitting) ? "opacity-20 pointer-events-none" : "text-muted-foreground hover:text-white"
                                    )}
                                >
                                    Next
                                </button>
                            </div>

                            <div className="flex gap-4 w-full sm:w-auto">
                                <button
                                    onClick={handleSubmitTest}
                                    disabled={isSubmitting || Object.values(userAnswers).filter(a => !!a.trim()).length === 0}
                                    className={cn(
                                        "flex items-center gap-3 px-10 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all duration-500 shadow-lg w-full sm:w-auto justify-center",
                                        "bg-linear-to-r from-primary to-blue-500 text-black shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5",
                                        (isSubmitting || Object.values(userAnswers).filter(a => !!a.trim()).length === 0) && "opacity-20 grayscale pointer-events-none"
                                    )}
                                >
                                    Complete Session
                                    <Zap size={14} fill="currentColor" />
                                </button>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}
