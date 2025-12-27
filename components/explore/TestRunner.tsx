'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, ArrowRight, Trophy, Clock, Brain, Shield } from 'lucide-react';
import { DailyGoal } from '@/app/explore/types';
import Confetti from 'react-confetti';
import NeonButton from '../ui/NeonButton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TestRunnerProps {
    goal: DailyGoal;
    onClose: () => void;
    onComplete: (score: number, passed: boolean) => void;
}

export default function TestRunner({ goal, onClose, onComplete }: TestRunnerProps) {
    const [testState, setTestState] = useState<'intro' | 'active' | 'results'>('intro');

    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [evaluations, setEvaluations] = useState<Record<number, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);
    // Local state for the text area - synced with userAnswers when moving nav
    const [currentText, setCurrentText] = useState('');
    const [rewardResult, setRewardResult] = useState<{ type: string, value: any, label?: string } | null>(null);

    const questions = goal.questions || [];
    const currentQuestion = questions[currentIndex];

    // Anti-Cheat State
    const [antiCheatEnabled, setAntiCheatEnabled] = useState(false);
    const [isDisqualified, setIsDisqualified] = useState(false);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);

    // Initialize text area when index changes
    useEffect(() => {
        setCurrentText(userAnswers[currentIndex] || '');
    }, [currentIndex, userAnswers]);

    // Fetch Anti-Cheat Setting
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/admin/settings');
                if (res.ok) {
                    const data = await res.json();
                    setAntiCheatEnabled(data.antiCheatEnabled);
                }
            } catch (err) {
                console.error("Failed to fetch settings");
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
                const res = await fetch(`/api/daily-goals/status?goalId=${goal.id}`, {
                    signal: controller.signal
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'disqualified') {
                        setIsDisqualified(true);
                    }
                }
            } catch (e: any) {
                if (e.name === 'AbortError') {
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

        const reportDisqualification = async (reason: string) => {
            // Persist disqualification in DB
            try {
                await fetch('/api/daily-goals/evaluate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        goalId: goal.id,
                        isDisqualified: true
                    })
                });
            } catch (e) {
                console.error("Failed to report disqualification");
            }
        };

        const failTest = (reason: string) => {
            setIsDisqualified(true);
            setTestState('results');
            toast.error("Test Failed!", {
                description: reason
            });
            reportDisqualification(reason);
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                failTest("Anti-Cheat: Focus detected. Test disqualified.");
            }
        };

        const handleBlur = () => {
            failTest("Anti-Cheat: Window focus lost. Test disqualified.");
        };

        // NEW: Handle Resize
        const handleResize = () => {
            if (window.outerHeight < screen.availHeight * 0.9 && window.outerWidth < screen.availWidth * 0.9) {
                toast.warning("Warning: Browser resizing detected!");
                failTest("Anti-Cheat: Browser window resized. Test disqualified.");
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                failTest("Anti-Cheat: You exited Full Screen mode. Test disqualified.");
            }
        };

        const preventCopyPaste = (e: Event) => {
            e.preventDefault();
            toast.error("Action Prohibited", {
                description: "Copy/Paste is disabled during the test."
            });
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('resize', handleResize);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange); // Firefox support
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Chrome/Safari support
        document.addEventListener('msfullscreenchange', handleFullscreenChange); // IE/Edge support
        document.addEventListener('copy', preventCopyPaste);
        document.addEventListener('paste', preventCopyPaste);
        document.addEventListener('cut', preventCopyPaste);
        document.addEventListener('contextmenu', preventCopyPaste);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
            document.removeEventListener('copy', preventCopyPaste);
            document.removeEventListener('paste', preventCopyPaste);
            document.removeEventListener('cut', preventCopyPaste);
            document.removeEventListener('contextmenu', preventCopyPaste);
        };
    }, [testState, antiCheatEnabled, isDisqualified, goal.id]);

    const handleNext = () => {
        setUserAnswers(prev => ({ ...prev, [currentIndex]: currentText }));
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            handleSubmitTest();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setUserAnswers(prev => ({ ...prev, [currentIndex]: currentText }));
            setCurrentIndex(prev => prev - 1);
        }
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

            const res = await fetch('/api/daily-goals/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goalId: goal.id,
                    submissions
                })
            });

            const data = await res.json();
            if (data.evaluations) {
                const evalMap: Record<number, any> = {};
                data.evaluations.forEach((evalItem: any) => {
                    evalMap[evalItem.questionIndex] = evalItem;
                });
                setEvaluations(evalMap);
                setEvaluations(evalMap);
                setRewardResult({ type: data.rewardType, value: data.rewardValue, label: data.rarityLabel });
                setTestState('results');
            } else {
                toast.error("Failed to evaluate answers.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred during evaluation.");
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
            <div className="fixed inset-0 z-50 bg-[#050505] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-xl w-full bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 to-purple-500" />

                    {/* Disqualified Banner */}
                    {isDisqualified && (
                        <div className="absolute top-0 left-0 w-full bg-red-600/20 text-red-500 text-xs font-bold uppercase tracking-widest text-center py-1">
                            Disqualified
                        </div>
                    )}

                    <div className="text-center mb-8 pt-4">
                        <div className={cn(
                            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border",
                            isDisqualified ? "bg-red-500/10 border-red-500/20" : "bg-primary/10 border-primary/20"
                        )}>
                            {isDisqualified ? <Shield size={40} className="text-red-500" /> : <Brain size={40} className="text-primary" />}
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">{goal.title}</h2>
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
            <div className="fixed inset-0 z-50 bg-[#050505] flex items-center justify-center p-4">
                {passed && <Confetti recycle={false} numberOfPieces={500} />}

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-2xl w-full bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden max-h-[90vh] overflow-y-auto"
                >
                    <div className={cn(
                        "absolute top-0 left-0 w-full h-2",
                        isDisqualified ? "bg-red-600" : (passed ? "bg-green-500" : "bg-red-500")
                    )} />

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
                </motion.div>
            </div>
        );
    }

    if (!currentQuestion) return null;

    return (
        <div className="fixed inset-0 z-50 bg-[#050505] text-white flex flex-col">
            {/* ... (Keep existing Header, Progress Bar, Main Content, Footer) */}
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0A0A0A]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X size={20} className="text-muted-foreground" />
                    </button>
                    <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                            {goal.isExam ? "Exam Session" : "Daily Goal Test"}
                        </div>
                        <div className="font-bold text-sm md:text-base">{goal.title}</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                        <Clock size={14} className="text-blue-400" />
                        <span className="text-sm font-mono">{formatTime(timeElapsed)}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20 text-primary">
                        <Brain size={14} />
                        <span className="text-sm font-bold">{currentIndex + 1}/{questions.length}</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 w-full bg-white/5">
                <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center">
                <div className="max-w-3xl w-full">

                    {/* Question */}
                    <div className="mb-8">
                        <motion.h2
                            key={currentIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl md:text-3xl font-bold leading-tight"
                        >
                            {currentQuestion.question}
                        </motion.h2>
                    </div>

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
                            <textarea
                                value={currentText}
                                onChange={(e) => setCurrentText(e.target.value)}
                                placeholder="Write your detailed answer here..."
                                className="w-full h-64 bg-white/5 border-2 border-white/10 rounded-2xl p-6 text-lg focus:border-primary/50 focus:ring-0 transition-all resize-none outline-none"
                                disabled={isSubmitting}
                            />
                        )}
                    </motion.div>

                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-[#0A0A0A] flex justify-center">
                <div className="max-w-3xl w-full flex justify-between">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0 || isSubmitting}
                        className={cn("text-muted-foreground hover:text-white transition-colors px-4 py-2", (currentIndex === 0 || isSubmitting) && "opacity-0 pointer-events-none")}
                    >
                        Previous
                    </button>

                    <NeonButton
                        onClick={handleNext}
                        disabled={!currentText.trim() || isSubmitting}
                        className={cn("px-8", (!currentText.trim() || isSubmitting) && "opacity-50 cursor-not-allowed")}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Analyzing...
                            </div>
                        ) : (
                            currentIndex < questions.length - 1 ? "Next Question" : "Submit All & Finish"
                        )}
                        {!isSubmitting && <ArrowRight size={18} className="ml-2" />}
                    </NeonButton>
                </div>
            </div>
        </div>
    );
}
