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
    setDailyGoals: (dailyGoals) => set({ dailyGoals }),
    addDailyGoal: (goal) => set((state) => ({ dailyGoals: [...state.dailyGoals, goal] })),
    setIsLoading: (isLoading) => set({ isLoading }),
    setIsTestActive: (isTestActive) => set({ isTestActive }),
}));
