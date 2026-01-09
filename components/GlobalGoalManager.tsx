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
                        if (parsed.date === today) {
                            currentGoals = parsed.goals;
                            setDailyGoals(currentGoals);
                            if (currentGoals.length >= 7) {
                                setIsLoading(false);
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
                                const mapped = data.goals.map((g: any) => ({ ...g, id: g._id, duration: g.estimatedTime }));
                                // Dedupe
                                const uniqueMap = new Map();
                                [...currentGoals, ...mapped].forEach(g => uniqueMap.set(g.id, g));
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

                        const offset = currentGoals.length + i;

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
                                const newGoal = { ...genData.goal, id: genData.goal._id, duration: genData.goal.estimatedTime };
                                addDailyGoal(newGoal);

                                // Update Cache
                                // Note: we need the *latest* state here. 
                                // Since we are in a loop, 'currentGoals' is stale.
                                // But we can just read from store or update cache with the new goal appended.
                                // For simplicity, let's just update cache with what we know + new goal.
                                // Better: use a functional update for cache next time, but here we can just append to local 'currentGoals' to keep track in this loop
                                // currentGoals.push(newGoal); // This mutates local variable, fine for cache
                                // localStorage.setItem('dailyGoalsCache', JSON.stringify({ date: today, goals: currentGoals }));

                                // Actually, let's just pull from store in a safer way or just trust the additive process
                                // Re-reading from LS is safer to avoid race conditions with other tabs? No, single thread JS.
                                const latestCache = JSON.parse(localStorage.getItem('dailyGoalsCache') || '{"goals":[]}');
                                if (latestCache.date === today) {
                                    latestCache.goals.push(newGoal);
                                    localStorage.setItem('dailyGoalsCache', JSON.stringify(latestCache));
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
