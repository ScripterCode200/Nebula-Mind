'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, GraduationCap, Search, Filter, X, ChevronDown, Check, Loader2 } from 'lucide-react';
import ExamCard from '@/components/explore/ExamCard';
import DailyGoalCard from '@/components/explore/DailyGoalCard';

import { Exam, DailyGoal, Rarity } from './types';
import { cn } from '@/lib/utils';
import { toZonedTime } from 'date-fns-tz';
import { endOfDay, differenceInSeconds } from 'date-fns';

// ... (Exams Mock Data - Keeping existing data)
// Exams Mock Data Removed
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const rarities: Rarity[] = ['Uncommon', 'Rare', 'Epic', 'Legendary'];

const IST_TIMEZONE = 'Asia/Kolkata';

export default function ExplorePage() {
    const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([]);
    const [dbExams, setDbExams] = useState<Exam[]>([]); // New state for manual exams
    const [activeTab, setActiveTab] = useState<'daily' | 'exams'>('daily');


    const [isLoadingGoals, setIsLoadingGoals] = useState(true);
    const [timeLeft, setTimeLeft] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedRarity, setSelectedRarity] = useState<Rarity | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Fetch Manual Exams
    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await fetch('/api/exams');
                if (res.ok) {
                    const data = await res.json();
                    if (data.exams) {
                        setDbExams(data.exams.map((e: any) => ({
                            id: e._id,
                            title: e.title,
                            subject: e.subject,
                            description: e.description,
                            duration: e.duration,
                            xp: e.rarity === 'Legendary' ? 5000 : e.rarity === 'Epic' ? 2500 : e.rarity === 'Rare' ? 1200 : 500, // XP Logic
                            rarity: e.rarity,
                            rarityPoints: 100 // Default or logic
                        })));
                    }
                }
            } catch (e) {
                console.error("Failed to fetch exams");
            }
        };
        fetchExams();
    }, []);

    // Fetch Daily Goals with Iterative Generation
    useEffect(() => {
        const fetchAndGenerate = async () => {
            try {
                // 1. Check Cache First
                const today = new Date().toDateString();
                const cachedData = localStorage.getItem('dailyGoalsCache');
                let currentGoals: DailyGoal[] = [];

                if (cachedData) {
                    try {
                        const parsed = JSON.parse(cachedData);
                        if (parsed.date === today) {
                            currentGoals = parsed.goals;
                            setDailyGoals(currentGoals);
                            // If we have full set, we still fetch later but we can stop initial spinner
                            if (currentGoals.length >= 7) {
                                setIsLoadingGoals(false);
                            }
                        }
                    } catch (e) {
                        console.warn("Invalid cache ignored");
                    }
                }

                // 2. ALWAYS Fetch Existing from API to ensure consistency with DB (especially after Admin Reset)
                try {
                    const res = await fetch('/api/daily-goals');
                    if (res.ok) {
                        const data = await res.json();
                        if (data.goals) {
                            const mapped = data.goals.map((g: any) => ({ ...g, id: g._id, duration: g.estimatedTime }));

                            // If the API goals differ from our current goals (e.g. after reset, API returns []), update state
                            if (JSON.stringify(mapped) !== JSON.stringify(currentGoals)) {
                                console.log("[Explore] API data differs from cache. Updating...");
                                currentGoals = mapped;
                                setDailyGoals(currentGoals);

                                // Update cache immediately
                                localStorage.setItem('dailyGoalsCache', JSON.stringify({
                                    date: today,
                                    goals: currentGoals
                                }));
                            }
                        }
                    }
                } catch (fetchErr) {
                    console.error("Initial fetch failed:", fetchErr);
                }

                // 3. Generate Missing Slots iteratively
                const needed = 7 - currentGoals.length;

                // If we have at least getting started, we can stop the big spinner 
                if (currentGoals.length > 0) setIsLoadingGoals(false);

                if (needed > 0) {
                    console.log(`[Explore] Needs ${needed} more goals. triggering...`);
                    // Fire requests for missing slots
                    // Sequential Generation Loop to prevent 429/500 errors
                    console.log(`[Explore] Needs ${needed} more goals. triggering sequential generation...`);

                    for (let i = 0; i < needed; i++) {
                        // Add delay to prevent rate limiting
                        if (i > 0) await new Promise(resolve => setTimeout(resolve, 1000));

                        try {
                            const offset = currentGoals.length + i; // Logic remains same: if we had 3, i=0 -> index 3
                            console.log(`[Explore] Requesting slot index: ${offset}`);

                            const genRes = await fetch('/api/daily-goals', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ index: offset })
                            });

                            if (!genRes.ok) {
                                console.error(`[Explore] Slot ${offset} failed with status: ${genRes.status}`);
                                // Continue to next even if one fails
                                continue;
                            }

                            const genData = await genRes.json();

                            if (genData.goal) {
                                console.log(`[Explore] Received goal for slot ${offset}: ${genData.goal.title}`);
                                const newGoal = { ...genData.goal, id: genData.goal._id, duration: genData.goal.estimatedTime };

                                // Update State Immediately
                                setDailyGoals(prev => {
                                    if (prev.some(g => g.id === newGoal.id)) return prev;
                                    const updated = [...prev, newGoal];

                                    // Update Cache
                                    localStorage.setItem('dailyGoalsCache', JSON.stringify({
                                        date: today,
                                        goals: updated
                                    }));

                                    return updated;
                                });

                                // Hide loader after first successful generation if getting started
                                if (i === 0) setIsLoadingGoals(false);
                            }
                        } catch (err) {
                            console.error(`Failed to generate slot with index ${currentGoals.length + i}`, err);
                        }
                    }

                    setIsLoadingGoals(false);
                    console.log("[Explore] All slots processed.");
                } else {
                    console.log("[Explore] No additional slots needed.");
                    setIsLoadingGoals(false);
                }

            } catch (error) {
                console.error("Failed to fetch daily goals:", error);
                setIsLoadingGoals(false);
            }
        };

        fetchAndGenerate();
    }, []);

    // Timer Logic for IST Midnight
    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const istNow = toZonedTime(now, IST_TIMEZONE);
            const istMidnight = endOfDay(istNow);
            const diff = differenceInSeconds(istMidnight, istNow);

            if (diff <= 0) return "00:00:00";

            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;

            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        // Initial set
        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, []);


    // Close filters when clicking outside (simple implementation)
    useEffect(() => {
        const handleClick = () => setIsFilterOpen(false);
        if (isFilterOpen) {
            window.addEventListener('click', handleClick);
        }
        return () => window.removeEventListener('click', handleClick);
    }, [isFilterOpen]);

    const allExams = dbExams;
    const subjects = Array.from(new Set(allExams.map(e => e.subject)));

    const filteredExams = allExams.filter(exam => {
        const matchesSearch =
            exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exam.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exam.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesSubject = selectedSubject ? exam.subject === selectedSubject : true;
        const matchesRarity = selectedRarity ? exam.rarity === selectedRarity : true;

        return matchesSearch && matchesSubject && matchesRarity;
    });

    const activeFiltersCount = (selectedSubject ? 1 : 0) + (selectedRarity ? 1 : 0);

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">

            {/* Header */}
            <div className="mb-12">
                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-white/60 mb-4"
                >
                    Explore
                </motion.h1>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground text-lg max-w-xl"
                    >
                        Discover new challenges, achieve daily goals, and earn rewards to level up your knowledge.
                    </motion.p>
                </div>
            </div>

            {/* Daily Goals Section */}
            <motion.section
                variants={container}
                initial="hidden"
                animate="show"
                className="mb-16"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                        <Target size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Daily Goals</h2>
                    <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-sm font-mono text-muted-foreground shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                        <span className="text-xs uppercase tracking-wider text-green-400/70 font-sans font-semibold mr-1">Reset in</span>
                        <span className="text-green-400 font-bold">{timeLeft}</span>
                    </div>
                </div>

                {isLoadingGoals ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="relative z-10 mb-4"
                        >
                            <Loader2 size={40} className="text-primary" />
                        </motion.div>
                        <h3 className="relative z-10 text-lg font-bold text-white mb-1">Generating New Goals</h3>
                        <p className="relative z-10 text-sm text-muted-foreground">AI is crafting your daily challenges...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {dailyGoals.map((goal) => (
                            <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="h-full"
                            >
                                <DailyGoalCard goal={goal} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.section>

            {/* Test Runner Overlay - REMOVED for Dynamic Routing */}

            {/* Exams Section */}
            <motion.section
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-6"
            >
                {/* Modern Section Header with Enhanced Search & Filter */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 p-1 relative z-20">
                    <div className="flex items-center gap-3 pl-2">
                        <div className="p-2.5 rounded-xl bg-linear-to-br from-primary/20 to-secondary/20 text-white shadow-lg shadow-primary/10 border border-white/10">
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Available Exams</h2>
                            <p className="text-xs text-muted-foreground">Find your next challenge</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto min-w-[300px] lg:min-w-[600px]">
                        {/* Search Input */}
                        <div className="relative flex-1 group">
                            <div className="absolute inset-0 bg-linear-to-r from-primary/20 to-secondary/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                            <div className="relative h-full">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search exams..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-12 bg-black/40 border border-white/10 rounded-xl py-2 pl-12 pr-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all duration-300 shadow-inner"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsFilterOpen(!isFilterOpen);
                                }}
                                className={cn(
                                    "h-12 px-4 rounded-xl border flex items-center gap-2 text-sm font-medium transition-all duration-300 min-w-[140px] justify-between",
                                    isFilterOpen || activeFiltersCount > 0
                                        ? "bg-primary/10 border-primary/50 text-white shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                                        : "bg-black/40 border-white/10 text-muted-foreground hover:text-white hover:bg-white/5"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Filter size={16} />
                                    <span>
                                        {activeFiltersCount === 0 ? "Filters" : `${activeFiltersCount} Active`}
                                    </span>
                                </div>
                                <ChevronDown size={14} className={cn("transition-transform duration-300", isFilterOpen ? "rotate-180" : "")} />
                            </button>

                            <AnimatePresence>
                                {isFilterOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute top-full right-0 mt-2 w-72 bg-[#0A0A0A] border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-xl z-50 overflow-hidden"
                                    >
                                        <div className="space-y-4">
                                            {/* Subject Filter */}
                                            <div>
                                                <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Subject</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {subjects.map(subject => (
                                                        <button
                                                            key={subject}
                                                            onClick={() => setSelectedSubject(selectedSubject === subject ? null : subject)}
                                                            className={cn(
                                                                "text-xs px-2.5 py-1.5 rounded-lg border transition-all duration-200",
                                                                selectedSubject === subject
                                                                    ? "bg-primary/20 border-primary/50 text-white"
                                                                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white"
                                                            )}
                                                        >
                                                            {subject}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="h-px bg-white/10" />

                                            {/* Rarity Filter */}
                                            <div>
                                                <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Rarity</div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {rarities.map(rarity => (
                                                        <button
                                                            key={rarity}
                                                            onClick={() => setSelectedRarity(selectedRarity === rarity ? null : rarity)}
                                                            className={cn(
                                                                "text-xs px-2 py-1.5 rounded-lg border transition-all duration-200 flex items-center justify-between",
                                                                selectedRarity === rarity
                                                                    ? "bg-white/10 border-white/30 text-white"
                                                                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                                                            )}
                                                        >
                                                            {rarity}
                                                            {selectedRarity === rarity && <Check size={12} className="text-primary" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Clear Filters */}
                                            {(selectedSubject || selectedRarity) && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedSubject(null);
                                                        setSelectedRarity(null);
                                                    }}
                                                    className="w-full py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-lg transition-colors mt-2"
                                                >
                                                    Clear All
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredExams.length > 0 ? (
                            filteredExams.map((exam) => (
                                <motion.div
                                    key={exam.id}
                                    variants={item}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="h-full"
                                >
                                    <ExamCard exam={exam} />
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full py-20 text-center flex flex-col items-center justify-center text-muted-foreground"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <Search size={32} className="opacity-20" />
                                </div>
                                <p className="text-lg font-medium text-white">No exams found</p>
                                <p className="text-sm opacity-60 max-w-xs mx-auto mt-1">
                                    We couldn't find any exams matching your current filters.
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedSubject(null);
                                        setSelectedRarity(null);
                                    }}
                                    className="mt-6 text-primary hover:underline text-sm font-medium"
                                >
                                    Clear all filters
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.section>
        </div>
    );
}
