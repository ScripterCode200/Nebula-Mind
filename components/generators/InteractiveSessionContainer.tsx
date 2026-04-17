'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, Pause, Mic, Target, GraduationCap, Globe, 
    StopCircle, Maximize2, FileText, ChevronLeft, ChevronRight, BookOpen 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import NebulaStage, { VisualSchema } from '../orchestrator/NebulaStage';
import { useRouter } from 'next/navigation';

interface Props {
    session: any; // From AISession model
}

const playAudioWithSync = (
    base64: string,
    wordCount: number,
    onWordIndex: (i: number) => void,
    onEnd: () => void
): HTMLAudioElement => {
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audio.ontimeupdate = () => {
        const pct = audio.currentTime / (audio.duration || 1);
        const idx = Math.floor(pct * wordCount);
        onWordIndex(Math.min(idx, wordCount - 1));
    };
    audio.onended = () => { onWordIndex(wordCount); onEnd(); };
    audio.onerror = () => onEnd();
    audio.play().catch(() => onEnd());
    return audio;
};

export default function InteractiveSessionContainer({ session }: Props) {
    const router = useRouter();
    const { _id, notebookId, config, topicTree, cacheName } = session;

    const [currentTopicIndex, setCurrentTopicIndex] = useState(-1);
    const [visualSchema, setVisualSchema] = useState<VisualSchema | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [chatHistory, setChatHistory] = useState<any[]>([]);
    const [prefetchedIndices, setPrefetchedIndices] = useState<Set<number>>(new Set());
    
    const [activeWordIndex, setActiveWordIndex] = useState(-1);
    const [activeScriptWords, setActiveScriptWords] = useState<string[]>([]);
    
    // Guided Interaction State
    const [waitingForAdvance, setWaitingForAdvance] = useState(false);
    const [isBridgeActive, setIsBridgeActive] = useState(false);
    
    const [activeQuiz, setActiveQuiz] = useState<any>(null);
    const activeQuizResolver = useRef<((res: boolean) => void) | null>(null);

    const activeAudioRef = useRef<HTMLAudioElement | null>(null);
    const coveredModules = useRef<{ title: string; script: string }[]>([]);
    const moduleCache = useRef<Map<number, any>>(new Map());
    const prefetchingSet = useRef<Set<number>>(new Set());
    const sessionGenRef = useRef(0);

    const getLanguageCode = (lang: string) => {
        const mapping: Record<string, string> = {
            'English': 'en-US', 'Hindi': 'hi-IN', 'Spanish': 'es-ES',
            'French': 'fr-FR', 'German': 'de-DE'
        };
        return mapping[lang] || 'en-US';
    };

    /**
     * Helper to play a short, fixed AI phrase (Transition or Bridge)
     */
    const playAIPhrase = async (text: string, onEnd?: () => void) => {
        try {
            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text,
                    languageCode: getLanguageCode(config.language),
                    voiceStyle: config.voiceStyle,
                    prompt: "Read aloud in a warm, welcoming tone."
                })
            });
            const data = await res.json();
            if (data.audioContent) {
                const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
                audio.onended = () => { onEnd?.(); };
                audio.play().catch(() => onEnd?.());
                activeAudioRef.current = audio;
            } else {
                onEnd?.();
            }
        } catch (e) {
            onEnd?.();
        }
    };

    const stopSession = async () => {
        sessionGenRef.current++;
        if (activeAudioRef.current) {
            activeAudioRef.current.pause();
            activeAudioRef.current = null;
        }
        
        try {
            await fetch(`/api/orchestrator/session/${_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' })
            });
            toast.success('Study session ended.');
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
            router.push('/interactive-ai');
        } catch (e) {
            router.push('/interactive-ai');
        }
    };

    const handlePauseResume = () => {
        if (!activeAudioRef.current) return;
        if (isPaused) {
            activeAudioRef.current.play().catch(() => {});
            setIsPaused(false);
        } else {
            activeAudioRef.current.pause();
            setIsPaused(true);
        }
    };

    const buildPreviousSummary = (): string | undefined => {
        if (coveredModules.current.length === 0) return undefined;
        return coveredModules.current
            .map((m, i) => `Topic ${i + 1} (${m.title}): ${m.script.substring(0, 400)}`)
            .join('\n\n');
    };

    const fetchModulePayload = async (index: number): Promise<any> => {
        // Check cache first
        const cached = moduleCache.current.get(index);
        if (cached?.audio_script) return cached;

        const topic = topicTree[index];
        const res = await fetch('/api/orchestrator/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                notebookId,
                topic,
                methodology: config.teachingStyle,
                cacheName,
                language: config.language,
                previousModulesSummary: buildPreviousSummary()
            })
        });

        if (!res.ok) throw new Error(`Content load failed`);
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';
        while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            accumulatedText += decoder.decode(value, { stream: true });
        }

        let payload;
        try {
            payload = JSON.parse(accumulatedText.replace(/```json\n?|\n?```/g, '').trim());
        } catch {
            const match = accumulatedText.match(/\{[\s\S]*\}/);
            if (match) {
                try { payload = JSON.parse(match[0]); } catch { }
            }
            if (!payload) payload = { audio_script: accumulatedText, visual_schema: null, interaction_point: null };
        }

        // Initialize cache for this module if it doesn't exist
        moduleCache.current.set(index, { ...payload });
        return payload;
    };

    const prefetchModule = useCallback(async (index: number) => {
        if (index < 0 || index >= topicTree.length || moduleCache.current.get(index)?.audio_script || prefetchingSet.current.has(index)) return;
        prefetchingSet.current.add(index);
        try {
            await fetchModulePayload(index);
            setPrefetchedIndices(prev => new Set(prev).add(index));
        } catch (e) {
        } finally {
            prefetchingSet.current.delete(index);
        }
    }, [topicTree, cacheName, notebookId]);

    const fetchVisualization = async (topicIndex: number, partIndex: number, script: string, gen: number) => {
        const cached = moduleCache.current.get(topicIndex);
        if (cached?.parts?.[partIndex]?.visual_schema) {
            setVisualSchema(cached.parts[partIndex].visual_schema);
            return;
        }

        const topic = topicTree[topicIndex];
        try {
            const res = await fetch('/api/orchestrator/visualize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topicTitle: `${topic.title} (Part ${partIndex + 1})`,
                    topicScope: topic.scope,
                    audioScript: script,
                    language: config.language
                })
            });
            if (!res.ok) return;
            const schema = await res.json();
            
            // Save to cache
            const current = moduleCache.current.get(topicIndex) || {};
            if (!current.parts) current.parts = [];
            if (!current.parts[partIndex]) current.parts[partIndex] = {};
            current.parts[partIndex].visual_schema = schema;
            moduleCache.current.set(topicIndex, current);

            // Only update UI if the session generation matches (meaning we haven't skipped to next topic)
            if (sessionGenRef.current === gen) {
                setVisualSchema(schema);
            }
        } catch (e) {
            console.error("Visualization failed", e);
        }
    };

    const executeTopic = async (index: number) => {
        if (index < 0 || index >= topicTree.length) {
            if (index >= topicTree.length) toast.success('🎓 Lesson complete! Great job.');
            return;
        }

        const gen = ++sessionGenRef.current;
        const isAborted = () => sessionGenRef.current !== gen;

        if (activeAudioRef.current) {
            activeAudioRef.current.pause();
            activeAudioRef.current = null;
        }
        
        setIsPaused(false);
        setWaitingForAdvance(false);
        setCurrentTopicIndex(index);
        setActiveWordIndex(-1);
        setActiveScriptWords([]);

        try {
            let payload = moduleCache.current.get(index);
            const isCached = !!payload?.audio_script;

            if (!isCached) {
                setIsThinking(true);
                setVisualSchema(null); // Clear previous visual for new content
                payload = await fetchModulePayload(index);
                if (isAborted()) return;
            } else {
                setIsThinking(false);
            }

            let parts: any[] = payload.parts;
            if (!parts || !Array.isArray(parts)) {
                parts = [{
                    audio_script: payload.audio_script || payload.text || 'Showing content.',
                    visual_schema: payload.visual_schema || null,
                    question: payload.interaction_point ? {
                        text: payload.interaction_point,
                        correct_answer: true,
                        explanation: "Let's continue."
                    } : null
                }];
            }

            prefetchModule(index + 1);
            prefetchModule(index + 2);

            setIsThinking(false);

            // Execute Parts Sequentially
            for (let pIdx = 0; pIdx < parts.length; pIdx++) {
                if (isAborted()) return;
                const part = parts[pIdx];
                const scriptText = part.audio_script;
                
                // --- SUB-MODULE VISUALIZATION ---
                setVisualSchema(part.visual_schema || null);
                if (!part.visual_schema) {
                    fetchVisualization(index, pIdx, scriptText, gen);
                }

                const words = scriptText.split(/\s+/);
                setActiveScriptWords(words);
                setActiveWordIndex(-1);

                // Sync Chat History for current part
                setChatHistory((prev: any[]) => {
                    const standard = prev.map(m => ({ ...m, isActive: false }));
                    return [...standard, {
                        role: 'ai',
                        text: scriptText,
                        time: pIdx === 0 ? (topicTree[index]?.title || 'Now') : 'Continued',
                        isActive: true,
                        moduleIndex: index
                    }];
                });
                
                try {
                    let audioContent = part.audioContent;
                    if (!audioContent) {
                        const ttsRes = await fetch('/api/tts', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                text: scriptText.substring(0, 4096),
                                languageCode: getLanguageCode(config.language),
                                voiceStyle: config.voiceStyle,
                                prompt: "Read aloud in a warm, welcoming tone."
                            })
                        });
                        if (isAborted()) return;
                        const ttsData = await ttsRes.json();
                        audioContent = ttsData.audioContent;
                        part.audioContent = audioContent;
                        
                        // Update cache
                        const current = moduleCache.current.get(index) || payload;
                        current.parts = parts;
                        moduleCache.current.set(index, current);
                    }

                    if (audioContent) {
                        await new Promise<void>((resolve) => {
                            if (isAborted()) { resolve(); return; }
                            const audio = playAudioWithSync(
                                audioContent,
                                words.length,
                                (idx) => setActiveWordIndex(idx),
                                () => {
                                    setActiveWordIndex(-1);
                                    setIsPaused(false);
                                    resolve();
                                }
                            );
                            activeAudioRef.current = audio;
                        });
                    }
                } catch (ttsErr) {
                    console.error("TTS Playback Error", ttsErr);
                }

                if (isAborted()) return;
                
                // Track Module Completion
                if (pIdx === parts.length - 1 && !coveredModules.current.find(m => m.title === topicTree[index]?.title)) {
                    coveredModules.current.push({
                        title: topicTree[index]?.title || `Topic ${index + 1}`,
                        script: fullScriptText
                    });
                }

                // Interaction Checkpoint for this part
                if (part.question) {
                    setChatHistory((prev: any[]) => [...prev, {
                        role: 'ai',
                        text: `❓ ${part.question.text}`,
                        time: 'Checkpoint'
                    }]);
                    
                    setIsThinking(true);
                    await playAIPhrase(`Here's a quick question. ${part.question.text}`, () => setIsThinking(false));
                    if (isAborted()) return;

                    setActiveQuiz(part.question);
                    
                    const isCorrect = await new Promise<boolean>((resolve) => {
                        activeQuizResolver.current = resolve;
                    });
                    
                    setActiveQuiz(null);
                    if (isAborted()) return;

                    if (isCorrect) {
                        setChatHistory((prev: any[]) => [...prev, { role: 'ai', text: '✅ Correct!', time: 'System' }]);
                        await playAIPhrase("That is correct! Let's continue.");
                    } else {
                        setChatHistory((prev: any[]) => [...prev, { role: 'ai', text: `❌ Not quite. ${part.question.explanation}`, time: 'System' }]);
                        await playAIPhrase(`Not quite. ${part.question.explanation}. Let's continue.`);
                    }
                    if (isAborted()) return;
                }
            } // end loop

            if (isAborted()) return;

            // Trigger Guided Transition
            if (index < topicTree.length - 1) {
                const transitionPhrases = [
                    "Shall we move on to the next topic?",
                    "Ready to continue to the next part?",
                    "Should we explore the next module now?",
                    "I'm ready for the next section, are you?",
                    "Ready to dive into the next topic?"
                ];
                const selectedPhrase = transitionPhrases[Math.floor(Math.random() * transitionPhrases.length)];
                
                setIsThinking(true);
                await playAIPhrase(selectedPhrase, () => {
                    setIsThinking(false);
                    setWaitingForAdvance(true);
                });

                setChatHistory((prev: any[]) => [...prev, {
                    role: 'ai',
                    text: selectedPhrase,
                    time: 'Next?'
                }]);
            } else {
                toast.success('Lesson finished! Great work.');
            }

        } catch (error: any) {
            if (!isAborted()) toast.error('Error: ' + error.message);
        } finally {
            if (!isAborted()) setIsThinking(false);
        }
    };

    const handleMicInteraction = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            toast.error('Voice input is not supported in this browser. Please use Chrome.');
            return;
        }

        if (isListening) {
            setIsListening(false);
            return;
        }

        const curriculumAudio = activeAudioRef.current;
        const hadAudio = !!curriculumAudio;
        if (curriculumAudio) {
            curriculumAudio.pause();
            setIsPaused(true);
        }

        setIsListening(true);
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = getLanguageCode(config.language);
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = async (event: any) => {
            const question = event.results[0][0].transcript;
            setIsListening(false);
            if (!question.trim()) {
                if (hadAudio && curriculumAudio) {
                    curriculumAudio.play().catch(() => {});
                    setIsPaused(false);
                }
                return;
            }

            setChatHistory((prev: any[]) => [...prev, {
                role: 'user',
                text: question,
                time: 'You'
            }]);

            setIsThinking(true);
            try {
                const res = await fetch('/api/orchestrator/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        notebookId,
                        question,
                        coveredModules: coveredModules.current,
                        methodology: config.teachingStyle,
                        language: config.language
                    })
                });
                const data = await res.json();
                const answer = data.answer || 'I am sorry, I could not process that.';

                setChatHistory((prev: any[]) => [...prev, {
                    role: 'ai',
                    text: answer,
                    time: 'Tutor'
                }]);

                const ttsRes = await fetch('/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        text: answer.substring(0, 2048),
                        languageCode: getLanguageCode(config.language),
                        voiceStyle: config.voiceStyle,
                        prompt: "Read aloud in a warm, welcoming tone."
                    })
                });
                const ttsData = await ttsRes.json();
                if (ttsData.audioContent) {
                    const answerAudio = new Audio(`data:audio/mp3;base64,${ttsData.audioContent}`);
                    activeAudioRef.current = answerAudio;
                    
                    answerAudio.onended = async () => {
                        // Play bridge phrase after doubt answer
                        setIsBridgeActive(true);
                        await playAIPhrase("Okay!, let's continue with the topic again.", () => {
                            setIsBridgeActive(false);
                            if (hadAudio && curriculumAudio) {
                                // Resume curriculum audio correctly
                                activeAudioRef.current = curriculumAudio;
                                curriculumAudio.play().catch(() => {});
                                setIsPaused(false);
                            }
                        });
                    };
                    answerAudio.play();
                } else if (hadAudio && curriculumAudio) {
                    curriculumAudio.play().catch(() => {});
                    setIsPaused(false);
                }
            } catch (e) {
                if (hadAudio && curriculumAudio) {
                    curriculumAudio.play().catch(() => {});
                    setIsPaused(false);
                }
            } finally {
                setIsThinking(false);
            }
        };

        recognition.onerror = () => {
            setIsListening(false);
            if (hadAudio && activeAudioRef.current) {
                activeAudioRef.current.play().catch(() => {});
                setIsPaused(false);
            }
        };

        recognition.start();
    };

    // Heartbeat: Prevent inactivity timeout (Every 30s)
    useEffect(() => {
        const ping = async () => {
            try {
                await fetch(`/api/orchestrator/session/${_id}/heartbeat`, { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (e) {
                console.warn("Heartbeat failed", e);
            }
        };

        const interval = setInterval(ping, 30000);
        return () => clearInterval(interval);
    }, [_id]);

    // Session Timer: Check for timeout locally
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const durationLimit = parseInt(config.duration) || 30;
    const hasStartedRef = useRef(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedSeconds(prev => {
                const next = prev + 1;
                if (next >= durationLimit * 60) {
                    toast.info("Session time is up! Saving your progress...");
                    stopSession();
                    return prev;
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [durationLimit]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is in an input (though rare here)
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            const key = e.key.toLowerCase();
            
            // L key - Toggle Mic
            if (key === 'l') {
                e.preventDefault();
                handleMicInteraction();
            }

            // Spacebar - Toggle Pause/Resume
            if (e.code === 'Space') {
                e.preventDefault();
                handlePauseResume();
            }

            // Right Arrow - Next Module / Advance
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (waitingForAdvance) {
                    executeTopic(currentTopicIndex + 1);
                } else if (!isThinking && currentTopicIndex < topicTree.length - 1) {
                    executeTopic(currentTopicIndex + 1);
                }
            }

            // Left Arrow - Previous Module
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (!isThinking && currentTopicIndex > 0) {
                    executeTopic(currentTopicIndex - 1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isListening, isPaused, currentTopicIndex, waitingForAdvance, isThinking, topicTree]);

    // Initial Welcome and Start
    useEffect(() => {
        if (hasStartedRef.current) return;
        hasStartedRef.current = true;

        const start = async () => {
            const gen = sessionGenRef.current;
            const isAborted = () => sessionGenRef.current !== gen;

            const welcomeText = `Hi! I've organized your lesson into ${topicTree.length} parts. Let's start with "${topicTree[0].title}".`;
            setChatHistory([{ role: 'ai', text: welcomeText, time: 'Just now' }]);

            try {
                const ttsRes = await fetch('/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        text: welcomeText, 
                        languageCode: getLanguageCode(config.language),
                        voiceStyle: config.voiceStyle,
                        prompt: "Read aloud in a warm, welcoming tone."
                    })
                });
                
                if (isAborted()) return;

                const ttsData = await ttsRes.json();
                if (ttsData.audioContent) {
                    const audio = new Audio(`data:audio/mp3;base64,${ttsData.audioContent}`);
                    activeAudioRef.current = audio;
                    audio.onended = () => {
                        if (!isAborted()) executeTopic(0);
                    };
                    audio.play().catch(() => {
                        if (!isAborted()) executeTopic(0);
                    });
                } else {
                    if (!isAborted()) executeTopic(0);
                }
            } catch {
                if (!isAborted()) executeTopic(0);
            }
        };
        start();
    }, []);

    // Auto-scroll chat
    useEffect(() => {
        const el = document.getElementById('chat-scroll');
        if (el) el.scrollTop = el.scrollHeight;
    }, [chatHistory, isThinking, activeWordIndex]);

    const remainingMinutes = Math.max(0, Math.floor((durationLimit * 60 - elapsedSeconds) / 60));
    const remainingSeconds = Math.max(0, (durationLimit * 60 - elapsedSeconds) % 60);

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col p-2 md:p-6 gap-4 bg-[#050505] selection:bg-primary/30 fixed inset-0 z-50">
            {/* Session Header */}
            <div className="flex justify-between items-center shrink-0 px-2 md:px-0">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            STUDYING NOW
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[10px] text-primary/80 font-bold uppercase tracking-widest">{config.language}</span>
                           <div className="w-1 h-1 rounded-full bg-white/10" />
                           <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                             {remainingMinutes}:{remainingSeconds.toString().padStart(2, '0')} LEFT
                           </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {(activeWordIndex >= 0 || isPaused) && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handlePauseResume}
                            className={cn(
                                "px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-bold transition-all border",
                                isPaused
                                    ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                                    : "bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10"
                            )}
                        >
                            {isPaused ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
                            {isPaused ? 'RESUME' : 'PAUSE'}
                            <span className="opacity-40 ml-1 font-mono uppercase text-[8px]">[SPACE]</span>
                        </motion.button>
                    )}
                    <button
                        onClick={stopSession}
                        className="px-4 py-2 rounded-xl bg-red-500/5 hover:bg-red-500/15 text-red-500/90 border border-red-500/10 transition-colors flex items-center gap-2 text-[10px] font-bold"
                    >
                        <StopCircle size={14} />
                        END
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4">
                {/* Visual Area */}
                <div className="flex-2 md:h-full bg-[#050505] border border-white/5 rounded-3xl relative overflow-hidden flex flex-col group">
                    <div className="absolute top-5 left-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl z-10">
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
                        <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-400">Study Guide</span>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-4 relative">
                        <NebulaStage schema={visualSchema} isThinking={isThinking} />
                    </div>

                    <div className="h-16 border-t border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-xl">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => executeTopic(currentTopicIndex - 1)}
                                disabled={currentTopicIndex <= 0 || isThinking}
                                className="text-zinc-500 hover:text-white transition-colors disabled:opacity-20 translate-y-px"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="text-[10px] font-bold text-white uppercase tracking-widest">
                                {currentTopicIndex >= 0 ? topicTree[currentTopicIndex]?.title : "Thinking..."}
                            </div>
                            <button
                                onClick={() => executeTopic(currentTopicIndex + 1)}
                                disabled={currentTopicIndex >= topicTree.length - 1 || isThinking}
                                className="text-zinc-500 hover:text-white transition-colors disabled:opacity-20 translate-y-px"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <div className="hidden md:flex items-center gap-2">
                            {topicTree.map((_: any, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => executeTopic(i)}
                                    disabled={isThinking}
                                    className={cn(
                                        "h-1 rounded-full transition-all duration-500",
                                        i === currentTopicIndex ? "w-6 bg-primary" :
                                        i < currentTopicIndex ? "w-3 bg-primary/30" : "w-1.5 bg-white/10"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 md:h-full bg-white/2 border border-white/10 rounded-3xl flex flex-col shadow-2xl">
                    <div className="p-5 border-b border-white/5 shrink-0 flex items-center justify-between font-bold text-zinc-500 uppercase tracking-widest text-[9px]">
                        Lesson Chat
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-5 text-white scrollbar-hide" id="chat-scroll">
                        {chatHistory.map((msg: any, idx: number) => {
                            const isActiveSpeaking = msg.isActive && idx === chatHistory.length - 1 && activeWordIndex >= 0;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn("flex flex-col max-w-[90%]", msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}
                                >
                                    <div className={cn(
                                        "p-4 rounded-3xl text-sm leading-relaxed",
                                        msg.role === 'user'
                                            ? "bg-primary/10 text-white rounded-tr-md border border-primary/20"
                                            : "bg-white/5 text-zinc-200 rounded-tl-md border border-white/5"
                                    )}>
                                        {isActiveSpeaking ? (
                                            <span className="inline">
                                                {activeScriptWords.map((word, wi) => (
                                                    <span key={wi} className={cn("transition-all duration-150 inline-block mr-1", wi < activeWordIndex ? "opacity-30" : wi === activeWordIndex ? "text-primary font-bold scale-105" : "opacity-90")}>
                                                        {word}
                                                    </span>
                                                ))}
                                            </span>
                                        ) : msg.text}
                                    </div>
                                    <span className="text-[9px] font-bold text-zinc-600 mt-2 px-1 uppercase tracking-tighter">{msg.time}</span>
                                </motion.div>
                            );
                        })}
                        {isThinking && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5 p-4 bg-white/5 rounded-2xl w-fit">
                                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                            </motion.div>
                        )}
                    </div>

                    <div className="p-6 border-t border-white/5 shrink-0 bg-black/20 space-y-4">
                        <AnimatePresence>
                            {waitingForAdvance && (
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    onClick={() => executeTopic(currentTopicIndex + 1)}
                                    className="w-full h-14 rounded-2xl bg-primary text-black font-black text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,240,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    Continue to Next Topic
                                    <span className="text-[10px] opacity-60 ml-2 font-mono">[→]</span>
                                </motion.button>
                            )}
                            
                            {activeQuiz && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="grid grid-cols-2 gap-3"
                                >
                                    <button
                                        onClick={() => activeQuizResolver.current?.(true === activeQuiz.correct_answer)}
                                        className="h-16 rounded-2xl bg-white/5 border border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-400 text-white font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        True
                                    </button>
                                    <button
                                        onClick={() => activeQuizResolver.current?.(false === activeQuiz.correct_answer)}
                                        className="h-16 rounded-2xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 text-white font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        False
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {(!activeQuiz && !waitingForAdvance) && (
                            <button
                                onClick={handleMicInteraction}
                                disabled={isThinking}
                                className={cn(
                                    "h-16 w-full rounded-2xl border flex items-center justify-center relative overflow-hidden transition-all duration-500",
                                    isListening ? "bg-red-500/10 border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.2)]" : "bg-black/40 border-white/10 hover:border-primary/40"
                                )}
                            >
                                 <div className="absolute inset-x-0 bottom-0 h-1 flex items-end justify-center gap-1 overflow-hidden">
                                     {/* ... visual bars logic ... */}
                                    {[...Array(30)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className={cn("w-full h-full", isListening ? "bg-red-500" : "bg-primary/20")}
                                            animate={{ scaleY: (isListening || activeWordIndex >= 0) ? [1, Math.random() * 20 + 2, 1] : 1 }}
                                            transition={{ repeat: Infinity, duration: Math.random() * 0.5 + 0.2 }}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className={cn("p-2 rounded-full", isListening ? "bg-red-500 text-white animate-pulse" : "bg-white/5 text-zinc-400")}>
                                        <Mic size={18} />
                                    </div>
                                    <span className={cn("text-xs font-bold tracking-tight", isListening ? "text-red-500" : "text-zinc-500")}>
                                        {isListening ? "Listening..." : "Tap to ask a question"}
                                        {!isListening && <span className="text-[9px] opacity-40 ml-2 font-mono uppercase">[L]</span>}
                                    </span>
                                </div>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
