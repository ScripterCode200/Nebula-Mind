'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Target, Shield, Users, Lock, Bell } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import CustomSelect, { Option } from '@/components/ui/CustomSelect';
import { toast } from 'sonner';

import { Trash2, Plus, Save, Eye, X } from 'lucide-react';

export default function EditorPage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiModel, setAiModel] = useState('gemini-2.5-flash');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [examForm, setExamForm] = useState({
        title: '',
        subject: '',
        description: '',
        duration: '',
        rarity: 'Uncommon',
        questions: [{ question: '', type: 'MCQ', options: ['', '', '', ''], answer: '' }]
    });

    const [examsList, setExamsList] = useState<any[]>([]);
    const [viewingExam, setViewingExam] = useState<any>(null);

    const fetchExams = async () => {
        try {
            const res = await fetch('/api/exams');
            if (res.ok) {
                const data = await res.json();
                setExamsList(data.exams || []);
            }
        } catch (e) {
            console.error("Failed to fetch exams", e);
        }
    };

    // Initial Fetch
    React.useEffect(() => {
        fetchExams();
    }, []);

    const handleDeleteExam = async (id: string) => {
        if (!confirm('Are you sure you want to delete this exam?')) return;
        try {
            const res = await fetch(`/api/exams?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Exam deleted');
                setExamsList(prev => prev.filter(e => e._id !== id));
            } else {
                toast.error('Failed to delete');
            }
        } catch (e) {
            toast.error('Error deleting exam');
        }
    };

    const handleAddQuestion = (type: 'MCQ' | 'LongAnswer') => {
        setExamForm(prev => ({
            ...prev,
            questions: [...prev.questions, { question: '', type, options: ['', '', '', ''], answer: '' }]
        }));
    };

    const handleRemoveQuestion = (index: number) => {
        setExamForm(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    };

    const handleQuestionChange = (index: number, field: string, value: string) => {
        const newQuestions = [...examForm.questions];
        // @ts-ignore
        newQuestions[index][field] = value;
        setExamForm(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
        const newQuestions = [...examForm.questions];
        const currentOptions = [...(newQuestions[qIndex].options as unknown as string[])];
        currentOptions[optIndex] = value;
        // @ts-ignore
        newQuestions[qIndex].options = currentOptions;
        setExamForm(prev => ({ ...prev, questions: newQuestions }));
    };

    const submitExam = async () => {
        // Validation: Title, Subject, and Questions must have content. 
        // MCQs need options/answer. Long Answer just needs the question.
        if (!examForm.title || !examForm.subject || examForm.questions.length === 0) {
            toast.error('Please fill in required fields and add questions');
            return;
        }

        const invalidQuestion = examForm.questions.find(q => {
            if (!q.question) return true;
            // For MCQ, check if at least 2 options are filled and answer is selected
            if (q.type === 'MCQ') {
                const filledOptions = (q.options as unknown as string[]).filter(Boolean);
                if (filledOptions.length < 2 || !q.answer) return true;
            }
            return false;
        });

        if (invalidQuestion) {
            toast.error('Please complete all question fields (Min 2 options & Answer for MCQs)');
            return;
        }

        setIsSubmitting(true);
        try {
            // Process options (already array, just filter empty)
            const payload = {
                ...examForm,
                questions: examForm.questions.map(q => ({
                    ...q,
                    options: q.type === 'MCQ' ? (q.options as unknown as string[]).filter(Boolean) : []
                }))
            };

            const res = await fetch('/api/exams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success('Exam Created Successfully!');
                // Reset form
                setExamForm({
                    title: '',
                    subject: '',
                    description: '',
                    duration: '',
                    rarity: 'Uncommon',
                    questions: [{ question: '', type: 'MCQ', options: ['', '', '', ''], answer: '' }]
                });
            } else {
                toast.error('Failed to create exam');
            }
        } catch (e) {
            toast.error('Error submitting exam');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white pt-24 px-8 pb-12 relative overflow-hidden" >
            {/* Background */}
            < div className="absolute inset-0 z-0 opacity-20 pointer-events-none" >
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px]" />
            </div >

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-pink-400">
                            Editor Dashboard
                        </h1>
                        <p className="text-muted-foreground">Manage content and resources.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* Daily Tests Controller - Moved from Admin */}
                    <GlassCard className="p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Target size={120} className="text-primary" />
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                                <Target size={20} className="text-primary" /> Daily Tests Controller
                            </h2>
                            <p className="text-muted-foreground text-sm mb-6 max-w-2xl">
                                Manage the AI generation engine and test cycles. Force a system-wide reset to trigger fresh content generation based on user preferences.
                            </p>

                            <div className="flex flex-col md:flex-row items-end gap-6">
                                {/* AI Model Selector */}
                                <div className="space-y-2 w-full md:w-auto">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active AI Model</label>
                                    <div className="relative">
                                        <CustomSelect
                                            value={aiModel}
                                            onChange={async (val) => {
                                                setAiModel(val);
                                                try {
                                                    await fetch('/api/admin/settings', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ aiModel: val })
                                                    });
                                                    toast.success(`AI Model switched to ${val}`);
                                                } catch (err) {
                                                    toast.error('Failed to update model');
                                                }
                                            }}
                                            options={[
                                                { value: 'gemini-3.0-pro', label: 'Gemini 3.0 Pro' },
                                                { value: 'gemini-3.0-flash', label: 'Gemini 3.0 Flash' },
                                                { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
                                                { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
                                                { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
                                            ]}
                                            className="w-full md:w-64"
                                        />
                                    </div>
                                </div>

                                {/* Force Gen Button */}
                                <div className="w-full md:w-auto">
                                    <NeonButton
                                        onClick={async () => {
                                            if (isGenerating) return;
                                            setIsGenerating(true);
                                            try {
                                                console.log("Resetting goals...");
                                                // 1. Reset
                                                const resetRes = await fetch('/api/admin/daily-goals/reset', { method: 'POST' });
                                                if (!resetRes.ok) throw new Error('Reset failed');

                                                // 2. Clear Local Cache (Important so admin sees fresh results on Explore)
                                                localStorage.removeItem('dailyGoalsCache');
                                                toast.info('Database reset. Triggering fresh generations...');

                                                // 3. Generate Multiple Cards (Slots 0, 1, 2)
                                                // Triggering multiple ensures the user sees a "fuller" set immediately
                                                const slotsToTrigger = [0, 1, 2];
                                                let successCount = 0;

                                                for (const slot of slotsToTrigger) {
                                                    try {
                                                        const genRes = await fetch('/api/daily-goals', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ index: slot })
                                                        });
                                                        if (genRes.ok) successCount++;
                                                    } catch (err) {
                                                        console.error(`Failed to trigger slot ${slot}`, err);
                                                    }
                                                }

                                                if (successCount > 0) {
                                                    toast.success(`Reset & ${successCount} Cards Generated! Check Explore page.`);
                                                } else {
                                                    toast.warning('Reset done, but initial generation failed. Explore page will retry.');
                                                }
                                            } catch (e) {
                                                console.error(e);
                                                toast.error('Operation failed');
                                            } finally {
                                                setIsGenerating(false);
                                            }
                                        }}
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? (
                                            <Target size={16} className="mr-2 animate-spin text-white" />
                                        ) : (
                                            <Target size={16} className="mr-2" />
                                        )}
                                        {isGenerating ? 'Generating...' : 'Test Card Generation'}
                                    </NeonButton>
                                    <p className="text-[10px] text-muted-foreground mt-2 text-center md:text-left">
                                        *Deletes today's cards & forces regeneration
                                    </p>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <div className="md:col-span-2 lg:col-span-3"> {/* Full width container for the form */}
                        <GlassCard className="p-6">
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                                <Save size={20} className="text-primary" /> Create New Exam
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Title</label>
                                        <input
                                            value={examForm.title}
                                            onChange={e => setExamForm({ ...examForm, title: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-primary/50 outline-none"
                                            placeholder="e.g. Advanced Quantum Physics"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
                                        <textarea
                                            value={examForm.description}
                                            onChange={e => setExamForm({ ...examForm, description: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-primary/50 outline-none h-24"
                                            placeholder="Short description of the exam..."
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Subject</label>
                                            <input
                                                value={examForm.subject}
                                                onChange={e => setExamForm({ ...examForm, subject: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-primary/50 outline-none"
                                                placeholder="Physics"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Duration</label>
                                            <input
                                                value={examForm.duration}
                                                onChange={e => setExamForm({ ...examForm, duration: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-primary/50 outline-none"
                                                placeholder="45 mins"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <CustomSelect
                                            label="Rarity"
                                            value={examForm.rarity}
                                            onChange={(val) => setExamForm({ ...examForm, rarity: val })}
                                            options={['Uncommon', 'Rare', 'Epic', 'Legendary']}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Questions Section */}
                            <div className="border-t border-white/10 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-lg">Questions ({examForm.questions.length})</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAddQuestion('MCQ')} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                                            <Plus size={14} /> Add MCQ
                                        </button>
                                        <button onClick={() => handleAddQuestion('LongAnswer')} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                                            <Plus size={14} /> Add Theory
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {examForm.questions.map((q, i) => (
                                        <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-muted-foreground mr-1">Q{i + 1}</span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${q.type === 'MCQ' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' : 'border-purple-500/30 text-purple-400 bg-purple-500/10'}`}>
                                                        {q.type === 'MCQ' ? 'Multiple Choice' : 'Theory / Long Answer'}
                                                    </span>
                                                </div>
                                                <button onClick={() => handleRemoveQuestion(i)} className="text-red-400 hover:text-red-300">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                <textarea
                                                    value={q.question}
                                                    onChange={e => handleQuestionChange(i, 'question', e.target.value)}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm min-h-[60px] resize-y focus:border-primary/50 outline-none"
                                                    placeholder="Enter question text here (multiple lines supported)..."
                                                />

                                                {q.type === 'MCQ' && (
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {/* Options A, B, C, D */}
                                                            {['A', 'B', 'C', 'D'].map((optLabel, optIdx) => (
                                                                <div key={optLabel} className="relative">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">{optLabel}</span>
                                                                    <input
                                                                        // @ts-ignore
                                                                        value={q.options[optIdx]}
                                                                        onChange={e => handleOptionChange(i, optIdx, e.target.value)}
                                                                        className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-8 pr-3 text-sm focus:border-primary/50 outline-none"
                                                                        placeholder={`Option ${optLabel}`}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Correct Answer Dropdown */}
                                                        <div>
                                                            <CustomSelect
                                                                value={q.answer}
                                                                onChange={(val) => handleQuestionChange(i, 'answer', val)}
                                                                options={(q.options as unknown as string[]).map((opt, optIdx) => {
                                                                    const label = ['A', 'B', 'C', 'D'][optIdx];
                                                                    return opt ? {
                                                                        value: opt,
                                                                        label: `Option ${label}: ${opt.substring(0, 20)}${opt.length > 20 ? '...' : ''}`
                                                                    } : null;
                                                                }).filter(Boolean) as Option[]}
                                                                placeholder="Select Correct Answer"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {q.type === 'LongAnswer' && (
                                                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                                            <Target size={14} className="text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-blue-200">AI Auto-Evaluation Active</p>
                                                            <p className="text-[10px] text-blue-300/70">The system will dynamically evaluate student responses based on the question context.</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <NeonButton
                                        onClick={submitExam}
                                        disabled={isSubmitting}
                                        className="w-full md:w-auto justify-center"
                                        variant="primary"
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create Exam'}
                                    </NeonButton>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Manage Exams Section */}
                        <div className="mt-8">
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-white">
                                <Shield size={20} className="text-primary" /> Manage Existing Exams
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {examsList.map((exam) => (
                                    <GlassCard key={exam._id} className="p-5 flex flex-col justify-between group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Target size={80} className="text-primary" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider ${exam.rarity === 'Legendary' ? 'border-red-500/50 text-red-400 bg-red-500/10' :
                                                    exam.rarity === 'Epic' ? 'border-purple-500/50 text-purple-400 bg-purple-500/10' :
                                                        exam.rarity === 'Rare' ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10' :
                                                            'border-blue-500/50 text-blue-400 bg-blue-500/10'
                                                    }`}>
                                                    {exam.rarity}
                                                </span>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => setViewingExam(exam)}
                                                        className="text-muted-foreground hover:text-blue-400 transition-colors p-1"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteExam(exam._id)}
                                                        className="text-muted-foreground hover:text-red-400 transition-colors p-1"
                                                        title="Delete Exam"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-lg text-white mb-1 line-clamp-1">{exam.title}</h3>
                                            <p className="text-xs text-muted-foreground mb-4">{exam.subject} • {exam.questions?.length || 0} Qs</p>

                                            <div className="text-xs bg-black/20 rounded p-2 text-white/50 line-clamp-2 min-h-[40px]">
                                                {exam.description || 'No description provided.'}
                                            </div>
                                        </div>
                                    </GlassCard>
                                ))}

                                {examsList.length === 0 && (
                                    <div className="col-span-full py-10 text-center text-muted-foreground border border-dashed border-white/10 rounded-xl bg-white/5">
                                        No exams found. Create one above!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Exam Details Modal */}
            {viewingExam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <GlassCard className="w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 relative">
                        <div className="p-6 border-b border-white/10 flex justify-between items-start bg-white/5">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">{viewingExam.title}</h2>
                                <p className="text-sm text-muted-foreground">{viewingExam.subject} • {viewingExam.rarity} • {viewingExam.duration}</p>
                            </div>
                            <button
                                onClick={() => setViewingExam(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                            <div className="text-sm text-gray-400 bg-white/5 p-4 rounded-lg border border-white/10">
                                {viewingExam.description || "No description provided."}
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-lg text-white sticky top-0 bg-[#0a0a0a] py-2 z-10">
                                    Questions ({viewingExam.questions?.length || 0})
                                </h3>
                                {viewingExam.questions?.map((q: any, i: number) => (
                                    <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <div className="flex items-start gap-3 mb-2">
                                            <span className="bg-white/10 text-xs font-bold px-2 py-1 rounded text-muted-foreground shrink-0 mt-0.5">Q{i + 1}</span>
                                            <div>
                                                <p className="text-sm font-medium text-white mb-2">{q.question}</p>
                                                <div className="text-xs text-muted-foreground flex items-center gap-2 mb-3">
                                                    <span className={`px-1.5 py-0.5 rounded border ${q.type === 'MCQ' ? 'border-blue-500/30 text-blue-400' : 'border-purple-500/30 text-purple-400'}`}>
                                                        {q.type === 'MCQ' ? 'Multiple Choice' : 'Theory'}
                                                    </span>
                                                </div>

                                                {q.type === 'MCQ' && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {q.options?.map((opt: string, idx: number) => {
                                                            const isCorrect = opt === q.answer;
                                                            return (
                                                                <div key={idx} className={`text-xs p-2 rounded border ${isCorrect ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-black/20 border-white/5 text-gray-400'}`}>
                                                                    <span className="font-bold mr-2">{['A', 'B', 'C', 'D'][idx]}.</span> {opt}
                                                                    {isCorrect && <span className="ml-2">✓</span>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {q.type === 'LongAnswer' && (
                                                    <div className="text-xs bg-purple-500/5 border border-purple-500/20 p-3 rounded text-purple-300">
                                                        <span className="font-bold uppercase tracking-wider text-[10px] block mb-1 opacity-70">AI Grading Criteria</span>
                                                        {q.answer || "Auto-evaluated based on context."}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}
        </main >
    );
}
