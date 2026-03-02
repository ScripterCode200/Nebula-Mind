'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, X, Zap, Trophy, Target, Sparkles, Rocket,
    FileText, CheckCircle2, AlertCircle, Gamepad2,
    Brain, Lightbulb, Puzzle, MousePointer2
} from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import NeonButton from '@/components/ui/NeonButton';
import { useDashboardStore } from '@/store/useDashboardStore';
import { Search, Database, Youtube } from 'lucide-react';

// --- Super Cool Components ---

const StarField = () => {
    const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; duration: number }[]>([]);

    useEffect(() => {
        const newStars = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 1,
            duration: Math.random() * 3 + 2
        }));
        setStars(newStars);
    }, []);

    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {stars.map((star) => (
                <motion.div
                    key={star.id}
                    className="absolute bg-white rounded-full"
                    style={{
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                        width: star.size,
                        height: star.size,
                    }}
                    animate={{
                        opacity: [0.1, 0.8, 0.1],
                        scale: [1, 1.5, 1],
                    }}
                    transition={{
                        duration: star.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
};

const ScanningEffect = () => (
    <motion.div
        className="absolute inset-x-0 h-[2px] bg-linear-to-r from-transparent via-primary to-transparent z-20 shadow-[0_0_15px_rgba(0,240,255,0.8)]"
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    />
);

const MovingBackground = () => (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#050505]" />
        <StarField />

        {/* Deep Nebula Orbs */}
        <motion.div
            animate={{
                x: [0, 150, 0],
                y: [0, -80, 0],
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-15%] left-[-10%] w-[800px] h-[800px] bg-primary/20 rounded-full blur-[140px] mix-blend-screen"
        />
        <motion.div
            animate={{
                x: [0, -150, 0],
                y: [0, 100, 0],
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[-20%] right-[-10%] w-[900px] h-[900px] bg-purple-600/15 rounded-full blur-[160px] mix-blend-screen"
        />

        {/* Interactive Floating Particles Layer */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.03)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-size-[24px_24px] bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] opacity-30" />
    </div>
);

const GAME_MODES = [
    { id: 'flashcards', name: 'Neural Flashcards', icon: Brain, desc: 'AI-generated cards for deep memory encoding.', color: 'text-cyan-400', glow: 'shadow-cyan-500/20', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
    { id: 'mock-test', name: 'Simulation Exam', icon: Zap, desc: 'Adaptive testing platform for final mastery.', color: 'text-purple-400', glow: 'shadow-purple-500/20', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    { id: 'summary', name: 'Cognitive Map', icon: Lightbulb, desc: 'Multi-layered summaries of complex topics.', color: 'text-yellow-400', glow: 'shadow-yellow-500/20', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    { id: 'quiz-quest', name: 'Logic Quest', icon: Puzzle, desc: 'Story-driven learning challenges.', color: 'text-emerald-400', glow: 'shadow-emerald-500/20', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { id: 'retention-loop', name: 'Retention Loop', icon: Target, desc: 'Spaced repetition system for long-term growth.', color: 'text-pink-400', glow: 'shadow-pink-500/20', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
    { id: 'speed-recall', name: 'Neural Sprint', icon: Rocket, desc: 'Rapid-fire questions to test your reflexes.', color: 'text-orange-400', glow: 'shadow-orange-500/20', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
];

export default function SinglePlayerPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [selectedVaultSources, setSelectedVaultSources] = useState<any[]>([]);
    const [selectedGames, setSelectedGames] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [genProgress, setGenProgress] = useState(0);
    const [isVaultOpen, setIsVaultOpen] = useState(false);
    const [vaultSearch, setVaultSearch] = useState('');

    const { data: dashboardData, fetchDashboardData, isLoading: isVaultLoading } = useDashboardStore();

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFiles([acceptedFiles[0]]);
            setSelectedVaultSources([]); // Clear vault items when uploading
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
    });

    const toggleGame = (id: string) => {
        setSelectedGames(prev => {
            if (prev.includes(id)) return prev.filter(g => g !== id);
            if (prev.length >= 5) return prev;
            return [...prev, id];
        });
    };

    const toggleVaultSource = (source: any) => {
        const isAlreadySelected = selectedVaultSources.find(s => s._id === source._id);
        if (isAlreadySelected) {
            setSelectedVaultSources([]);
        } else {
            setSelectedVaultSources([source]);
            setFiles([]); // Clear uploads when selecting vault item
        }
    };

    const handleGenerate = () => {
        if ((files.length === 0 && selectedVaultSources.length === 0) || selectedGames.length === 0) return;
        setIsGenerating(true);
        let progress = 0;
        const interval = setInterval(() => {
            progress += 1.5;
            setGenProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => setIsGenerating(false), 800);
            }
        }, 40);
    };

    return (
        <div className="min-h-screen relative overflow-x-hidden selection:bg-primary/30">
            <MovingBackground />

            {/* Increased pt-40 for Navbar clearing */}
            <div className="relative z-10 p-6 md:p-12 pt-40 max-w-7xl mx-auto pb-32">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-16"
                >
                    {/* Header with Float Animation */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                        <motion.div
                            initial={{ x: -30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-4"
                        >
                            <Link href="/learning-booster" className="group text-primary/60 hover:text-primary transition-all text-sm font-bold flex items-center gap-2 mb-6">
                                <motion.span whileHover={{ x: -4 }} className="flex items-center gap-2">
                                    <Rocket size={14} className="-rotate-90 group-hover:text-primary transition-colors" />
                                    TRANSMISSION HUB
                                </motion.span>
                            </Link>
                            <div className="relative">
                                <h1 className="text-5xl md:text-7xl font-bold tracking-tight uppercase">
                                    <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">Single</span>
                                    <br />
                                    <span className="text-primary text-glow-primary">Matrix-X</span>
                                </h1>
                                <motion.div
                                    className="absolute -top-4 -right-8"
                                    animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                >
                                    <Sparkles className="text-primary" size={32} />
                                </motion.div>
                            </div>
                            <p className="text-muted-foreground text-lg max-w-2xl font-normal leading-relaxed border-l-2 border-primary/20 pl-6">
                                Initialize high-fidelity neural simulations from your data banks. Select up to 5 core study algorithms.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ x: 30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-center gap-6 bg-black/60 border border-white/10 rounded-[32px] p-6 backdrop-blur-3xl shadow-2xl relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex flex-col text-right relative z-10">
                                <span className="text-[10px] font-black uppercase text-muted/40 tracking-[0.3em] mb-1">Synchronized Units</span>
                                <div className="flex items-center justify-end gap-2">
                                    <span className="text-4xl font-black text-primary drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">{selectedGames.length}</span>
                                    <span className="text-2xl font-black text-muted/20">/</span>
                                    <span className="text-2xl font-black text-muted/40 font-mono">05</span>
                                </div>
                            </div>
                            <div className="w-px h-12 bg-white/10 mx-2" />
                            <div className="p-3 bg-primary/10 rounded-2xl relative z-10">
                                <Brain className="text-primary animate-pulse" size={28} />
                            </div>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                        {/* LEFT: Upload Section */}
                        <div className="lg:col-span-5 space-y-10">
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold uppercase tracking-wider flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary/20 to-blue-500/10 flex items-center justify-center text-primary border border-primary/30 shadow-lg shadow-primary/10">
                                        <Upload size={20} />
                                    </div>
                                    Data Uplink
                                </h3>

                                <div
                                    {...getRootProps()}
                                    className={`relative group h-[400px] border-2 border-dashed rounded-[40px] flex flex-col items-center justify-center p-12 transition-all duration-700 overflow-hidden ${isDragActive ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-white/5 hover:border-primary/40 bg-white/2 hover:bg-white/4'
                                        }`}
                                >
                                    <input {...getInputProps()} />

                                    {/* Fancy Background Effects for Dropzone */}
                                    <div className="absolute inset-0 bg-radial-at-t from-primary/5 to-transparent transition-opacity opacity-0 group-hover:opacity-100" />
                                    <ScanningEffect />

                                    <div className="relative z-10 text-center space-y-8">
                                        <motion.div
                                            animate={{ y: [0, -15, 0] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                            className="w-24 h-24 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-center mx-auto shadow-2xl backdrop-blur-md group-hover:border-primary/50 group-hover:shadow-primary/20 transition-all"
                                        >
                                            <Upload size={48} className="text-primary/70 group-hover:text-primary transition-colors" />
                                        </motion.div>
                                        <div className="space-y-3">
                                            <p className="text-xl font-bold text-white tracking-tight">ENGAGE UPLINK</p>
                                            <p className="text-muted/60 font-medium uppercase tracking-widest text-[10px]">Inject PDF or Word Fragments</p>
                                        </div>

                                        <div className="flex flex-col items-center gap-4">
                                            <div className="px-6 py-2 rounded-full border border-white/10 text-xs font-bold text-muted/40 uppercase tracking-[0.2em] group-hover:border-primary/20 group-hover:text-primary/60 transition-all">
                                                Secure Channel 01-X
                                            </div>

                                            <div className="w-full h-px bg-white/5" />

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsVaultOpen(true);
                                                }}
                                                className="flex items-center gap-2 text-primary hover:text-white transition-colors text-xs font-black uppercase tracking-widest bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-xl border border-primary/20"
                                            >
                                                <Database size={14} /> Browse Source Vault
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Composite List: Uploads + Vault Sources */}
                                <AnimatePresence mode="popLayout">
                                    {selectedVaultSources.map((source) => (
                                        <motion.div
                                            key={source._id}
                                            initial={{ opacity: 0, x: -30, filter: 'blur(10px)' }}
                                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                            exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                                            className="flex items-center justify-between p-5 bg-primary/5 border border-primary/20 rounded-[24px] group hover:border-primary/50 transition-all backdrop-blur-xl shadow-xl"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                                                    <Database size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-white italic tracking-tight uppercase truncate max-w-[180px]">{source.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_5px_#00f0ff]" />
                                                        <span className="text-[10px] text-primary/60 uppercase tracking-widest font-black">Source Link Stable</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.1, rotate: 90 }}
                                                onClick={() => toggleVaultSource(source)}
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-muted/20 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                            >
                                                <X size={18} />
                                            </motion.button>
                                        </motion.div>
                                    ))}
                                    {files.map((file, i) => (
                                        <motion.div
                                            key={`${file.name}-${i}`}
                                            initial={{ opacity: 0, x: -30, filter: 'blur(10px)' }}
                                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                            exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                                            className="flex items-center justify-between p-5 bg-black/40 border border-white/10 rounded-[24px] group hover:border-primary/50 transition-all backdrop-blur-xl shadow-xl"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-white italic tracking-tight uppercase truncate max-w-[200px]">{file.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                        <span className="text-[10px] text-muted/40 uppercase tracking-widest font-black">Data Decrypted</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.1, rotate: 90 }}
                                                onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-muted/20 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                            >
                                                <X size={18} />
                                            </motion.button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* RIGHT: Game Selection (Simulation Matrix) */}
                        <div className="lg:col-span-7 space-y-10">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-2xl font-black uppercase tracking-widest italic flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-500/20 to-pink-500/10 flex items-center justify-center text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-500/10">
                                            <Gamepad2 size={20} />
                                        </div>
                                        Simulation Core
                                    </h3>
                                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black italic text-muted/40 uppercase tracking-[0.2em]">
                                        <Zap size={10} className="text-yellow-500" />
                                        Algorithm Lock: ON
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {GAME_MODES.map((game, index) => {
                                        const isSelected = selectedGames.includes(game.id);
                                        const isDisabled = !isSelected && selectedGames.length >= 5;

                                        return (
                                            <motion.button
                                                key={game.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 * index }}
                                                whileHover={!isDisabled ? { y: -8, scale: 1.02 } : {}}
                                                whileTap={!isDisabled ? { scale: 0.98 } : {}}
                                                onClick={() => toggleGame(game.id)}
                                                className={`relative text-left p-8 rounded-[36px] border-2 transition-all duration-500 group overflow-hidden ${isSelected
                                                    ? `${game.bg} ${game.border} shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6),0_0_40px_${game.color.replace('text-', '')}30] scale-[1.02]`
                                                    : isDisabled ? 'opacity-10 cursor-not-allowed border-transparent grayscale' : 'bg-white/2 border-white/5 hover:border-white/20'
                                                    }`}
                                            >
                                                {/* Selected Glow Effect */}
                                                {isSelected && (
                                                    <motion.div
                                                        layoutId="glow"
                                                        className="absolute inset-0 bg-radial-at-br from-white/10 to-transparent pointer-events-none"
                                                    />
                                                )}

                                                <div className={`p-4 rounded-2xl ${isSelected ? 'bg-white/10' : 'bg-black/20 group-hover:bg-black/40'} mb-6 w-fit transition-all duration-300 shadow-xl`}>
                                                    <game.icon size={28} className={isSelected ? `${game.color} drop-shadow-[0_0_10px_currentColor]` : 'text-muted/30 group-hover:text-white/60'} />
                                                </div>
                                                <h4 className={`text-xl font-bold tracking-tight mb-2 transition-colors uppercase ${isSelected ? 'text-white' : 'text-white/40 group-hover:text-white/80'}`}>{game.name}</h4>
                                                <p className="text-xs text-muted/40 leading-relaxed font-normal uppercase tracking-wider">{game.desc}</p>

                                                {isSelected && (
                                                    <div className="absolute top-6 right-6 flex flex-col items-center">
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1.2 }}
                                                            className={`${game.bg} p-2 rounded-full border ${game.border}`}
                                                        >
                                                            <CheckCircle2 size={20} className={game.color} />
                                                        </motion.div>
                                                    </div>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Progress & Action */}
                    <div className="pt-16 border-t border-white/5">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className={`w-10 h-10 rounded-full border-2 border-[#050505] flex items-center justify-center bg-white/5 ${i === 1 ? 'text-primary' : 'text-muted/40'}`}>
                                                {i === 1 ? <Target size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="h-4 w-px bg-white/10 mx-2" />
                                    {(files.length === 0 && selectedVaultSources.length === 0 || selectedGames.length === 0) ? (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-amber-500/60 tracking-[0.2em]">Operational Error</span>
                                            <span className="text-sm font-bold text-amber-500/90 italic flex items-center gap-2">
                                                <AlertCircle size={14} /> NO CORE FRAGMENTS DETECTED
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-primary/60 tracking-[0.2em]">Systems Nominal</span>
                                            <span className="text-sm font-bold text-primary italic flex items-center gap-2 uppercase tracking-tight">
                                                <CheckCircle2 size={14} /> Ready for Neural Sequencing
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full md:w-auto relative group"
                            >
                                <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                                <NeonButton
                                    size="lg"
                                    className="w-full md:min-w-[360px] h-20 text-xl font-bold tracking-tight uppercase rounded-[24px] z-10"
                                    disabled={((files.length === 0 && selectedVaultSources.length === 0) || selectedGames.length === 0 || isGenerating)}
                                    onClick={handleGenerate}
                                >
                                    {isGenerating ? (
                                        <div className="flex items-center gap-4">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full"
                                            />
                                            SEQUENCING...
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-4">
                                            INITIATE SESSION <Rocket size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </div>
                                    )}
                                </NeonButton>
                            </motion.div>
                        </div>

                        {/* HIGH-END Generation Sequence Animation */}
                        <AnimatePresence>
                            {isGenerating && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50, filter: 'blur(20px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
                                    className="mt-16 bg-black/40 border border-white/10 rounded-[40px] p-10 overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-linear-to-r from-primary/5 via-purple-500/5 to-transparent animate-pulse" />

                                    <div className="space-y-8 relative z-10">
                                        <div className="flex items-end justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em]">Neural Link Status: Active</span>
                                                </div>
                                                <h5 className="text-3xl font-bold uppercase tracking-tight">Allocating Synaptic Slots</h5>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-6xl font-bold text-glow-primary">{Math.round(genProgress)}%</span>
                                            </div>
                                        </div>

                                        <div className="h-6 w-full bg-white/5 rounded-2xl overflow-hidden border border-white/10 p-1 shadow-inner">
                                            <motion.div
                                                className="h-full bg-linear-to-r from-primary via-blue-400 to-primary bg-size-200% animate-gradient rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${genProgress}%` }}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {['Buffer Check', 'Logic Mapping', 'Data Fetching', 'Core Stability'].map((step, i) => (
                                                <div key={step} className="flex items-center gap-2 text-[10px] font-bold text-muted/30 uppercase tracking-widest italic">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${genProgress > (25 * (i + 1)) ? 'bg-primary shadow-[0_0_5px_currentColor]' : 'bg-white/10'}`} />
                                                    {step}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>

            {/* Source Vault Selector Modal */}
            <AnimatePresence>
                {isVaultOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                        onClick={() => setIsVaultOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] font-sans"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                                        <Database className="text-primary" size={24} /> Source Vault
                                    </h3>
                                    <p className="text-[10px] font-bold text-muted/40 uppercase tracking-widest">Retrieving Synchronized Data Fragments</p>
                                </div>
                                <button
                                    onClick={() => setIsVaultOpen(false)}
                                    className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 bg-black/40">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/40 group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="SCAN VAULT BY NAME OR ORIGIN..."
                                        value={vaultSearch}
                                        onChange={(e) => setVaultSearch(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-xs font-bold uppercase tracking-wider focus:outline-hidden focus:border-primary/40 focus:bg-white/10 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                                {isVaultLoading ? (
                                    <div className="flex flex-col items-center justify-center h-48 gap-4">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full"
                                        />
                                        <p className="text-[10px] font-bold text-primary/40 uppercase tracking-wider">Bridging Neural Uplink...</p>
                                    </div>
                                ) : (dashboardData?.allSources || [])
                                    .filter((s: any) => s.name.toLowerCase().includes(vaultSearch.toLowerCase()) || (s.notebookTitle?.toLowerCase().includes(vaultSearch.toLowerCase())))
                                    .length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-48 text-muted/20 gap-2">
                                        <AlertCircle size={32} />
                                        <p className="text-xs font-bold uppercase tracking-[0.2em]">Matrix Empty: No Records Found</p>
                                    </div>
                                ) : (dashboardData?.allSources || [])
                                    .filter((s: any) => s.name.toLowerCase().includes(vaultSearch.toLowerCase()) || (s.notebookTitle?.toLowerCase().includes(vaultSearch.toLowerCase())))
                                    .map((source: any) => {
                                        const isSelected = selectedVaultSources.find(s => s._id === source._id);
                                        return (
                                            <button
                                                key={source._id}
                                                onClick={() => toggleVaultSource(source)}
                                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group ${isSelected
                                                    ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                                                    : 'bg-white/2 border-white/5 hover:border-white/20 hover:bg-white/4'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4 text-left">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-primary text-[#050505]' : 'bg-white/5 text-muted/40 group-hover:text-white/60'
                                                        }`}>
                                                        {source.type === 'youtube' ? <Youtube size={18} /> : <FileText size={18} />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`text-[11px] font-bold uppercase tracking-tight truncate max-w-[300px] ${isSelected ? 'text-white' : 'text-white/60'
                                                            }`}>{source.name}</span>
                                                        <span className="text-[9px] font-bold text-muted/30 uppercase tracking-wider">{source.notebookTitle || 'INDEPENDENT CORE'}</span>
                                                    </div>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-[#050505]' : 'border-white/10'
                                                    }`}>
                                                    {isSelected && <CheckCircle2 size={12} />}
                                                </div>
                                            </button>
                                        );
                                    })
                                }
                            </div>

                            <div className="p-8 border-t border-white/5 bg-white/2">
                                <NeonButton
                                    className="w-full h-14 font-bold uppercase tracking-tight"
                                    onClick={() => setIsVaultOpen(false)}
                                >
                                    Confirm Source Links ({selectedVaultSources.length})
                                </NeonButton>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
