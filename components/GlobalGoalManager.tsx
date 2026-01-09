'use client';

import { useEffect } from 'react';
import { useGoalStore } from '@/store/useGoalStore';

export default function GlobalGoalManager() {
    const { dailyGoals, setDailyGoals, addDailyGoal, setIsLoading } = useGoalStore();

    useEffect(() => {
        // If we already have goals (e.g. from hydration or previous nav), don't fetch again unless empty
        // Actually, we should check if they are from "today"
        // But for now, let's assume if the store is populated, we are good.
        // Wait, if user refreshes, store is cleared. So we fetch.

        const generationController = new AbortController();

        const fetchAndGenerate = async () => {
            try {
                // Check Cache First (Client Side Cache)
                const today = new Date().toDateString();
                const cachedData = localStorage.getItem('dailyGoalsCache');
                let currentGoals = dailyGoals;

                if (currentGoals.length === 0 && cachedData) {
                    try {
                        const parsed = JSON.parse(cachedData);
                        if (parsed.date === today && Array.isArray(parsed.goals)) {
                            // Ensure all cached goals have IDs and are unique
                            const uniqueMap = new Map();
                            parsed.goals.forEach((g: any) => {
                                const id = g.id || g._id;
                                if (id) uniqueMap.set(String(id), { ...g, id: String(id) });
                            });
                            currentGoals = Array.from(uniqueMap.values());

                            if (currentGoals.length > 0) {
                                setDailyGoals(currentGoals);
                                if (currentGoals.length >= 7) {
                                    setIsLoading(false);
                                }
                            }
                        }
                    } catch (e) {
                        console.warn("Invalid cache ignored");
                    }
                }

                if (currentGoals.length === 0) {
                    try {
                        const res = await fetch('/api/daily-goals', { signal: generationController.signal });
                        if (res.ok) {
                            const data = await res.json();
                            if (data.goals) {
                                const mapped = data.goals.map((g: any) => ({
                                    ...g,
                                    id: String(g._id),
                                    duration: g.estimatedTime || g.duration
                                }));

                                // Dedupe with existing currentGoals (which should be empty anyway)
                                const uniqueMap = new Map();
                                [...currentGoals, ...mapped].forEach(g => {
                                    if (g.id) uniqueMap.set(g.id, g);
                                });
                                currentGoals = Array.from(uniqueMap.values());

                                setDailyGoals(currentGoals);
                                localStorage.setItem('dailyGoalsCache', JSON.stringify({ date: today, goals: currentGoals }));
                            }
                        }
                    } catch (fetchErr) {
                        // ignore aborts
                        console.log("Initial fetch error or abort", fetchErr);
                    }
                }

                const needed = 7 - currentGoals.length;
                if (currentGoals.length > 0) setIsLoading(false);

                if (needed > 0) {
                    console.log(`[GlobalGoalManager] Needs ${needed} more goals. triggering background generation...`);

                    for (let i = 0; i < needed; i++) {
                        if (generationController.signal.aborted) break;

                        // Wait 1s
                        if (i > 0) await new Promise(resolve => setTimeout(resolve, 1000));
                        if (generationController.signal.aborted) break;

                        // Use actual current length to avoid overlapping indices
                        const latestState = useGoalStore.getState();
                        const offset = latestState.dailyGoals.length;

                        // If we already have enough, stop
                        if (offset >= 7) break;

                        try {
                            const genRes = await fetch('/api/daily-goals', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ index: offset }),
                                signal: generationController.signal
                            });

                            if (!genRes.ok) continue;

                            const genData = await genRes.json();
                            if (genData.goal) {
                                const goalId = String(genData.goal._id);
                                const newGoal = {
                                    ...genData.goal,
                                    id: goalId,
                                    duration: genData.goal.estimatedTime || genData.goal.duration
                                };

                                // addDailyGoal has internal dedupe, but let's be double sure
                                addDailyGoal(newGoal);

                                // Update Cache safely
                                const latestCacheStr = localStorage.getItem('dailyGoalsCache');
                                if (latestCacheStr) {
                                    try {
                                        const latestCache = JSON.parse(latestCacheStr);
                                        if (latestCache.date === today) {
                                            if (!latestCache.goals.some((g: any) => String(g.id) === goalId)) {
                                                latestCache.goals.push(newGoal);
                                                localStorage.setItem('dailyGoalsCache', JSON.stringify(latestCache));
                                            }
                                        }
                                    } catch (e) {
                                        // Silent fail for cache update
                                    }
                                } else {
                                    localStorage.setItem('dailyGoalsCache', JSON.stringify({
                                        date: today,
                                        goals: [newGoal]
                                    }));
                                }
                            }
                            if (i === 0) setIsLoading(false);

                        } catch (err) {
                            console.log("Background gen error", err);
                        }
                    }
                    setIsLoading(false);
                } else {
                    setIsLoading(false);
                }

            } catch (error) {
                console.error("Global Manager Error", error);
                setIsLoading(false);
            }
        };

        fetchAndGenerate();

        return () => generationController.abort();
    }, []); // Run once on mount

    return null; // Renderless component
}
