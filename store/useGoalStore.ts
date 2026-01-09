import { create } from 'zustand';
import { DailyGoal } from '@/app/explore/types';

interface GoalState {
    dailyGoals: DailyGoal[];
    isLoading: boolean;
    isTestActive: boolean;
    setDailyGoals: (goals: DailyGoal[]) => void;
    addDailyGoal: (goal: DailyGoal) => void;
    setIsLoading: (isLoading: boolean) => void;
    setIsTestActive: (isTestActive: boolean) => void;
}

export const useGoalStore = create<GoalState>((set) => ({
    dailyGoals: [],
    isLoading: true,
    isTestActive: false,
    setDailyGoals: (dailyGoals) => set((state) => {
        // Deduplicate incoming goals by ID
        const uniqueMap = new Map();
        dailyGoals.forEach(g => {
            if (g.id) uniqueMap.set(g.id, g);
        });
        const uniqueGoals = Array.from(uniqueMap.values());
        return { dailyGoals: uniqueGoals };
    }),
    addDailyGoal: (goal) => set((state) => {
        // Prevent duplicates
        if (state.dailyGoals.some(g => g.id === goal.id)) return state;
        return { dailyGoals: [...state.dailyGoals, goal] };
    }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setIsTestActive: (isTestActive) => set({ isTestActive }),
}));
