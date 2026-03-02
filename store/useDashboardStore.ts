import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DashboardData {
    stats: {
        streak: string;
        timeFocused: string;
        notebooks: string;
        xp: string;
    };
    rarityStats: {
        uncommon: number;
        rare: number;
        epic: number;
        legendary: number;
    };
    recentActivity: Array<{
        title: string;
        action: string;
        icon: string;
        date: string;
    }>;
    chartData: any[];
    allSources: any[];
    achievements: any[];
    user: {
        _id: string;
        name: string;
        email: string;
    };
}

interface DashboardState {
    data: DashboardData | null;
    isLoading: boolean;
    lastFetched: number | null;
    fetchDashboardData: (force?: boolean) => Promise<void>;
    removeSource: (sourceId: string) => void;
    setData: (data: DashboardData) => void;
}

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set, get) => ({
            data: null,
            isLoading: false,
            lastFetched: null,

            fetchDashboardData: async (force = false) => {
                const { lastFetched, data } = get();
                const now = Date.now();
                const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

                // Only fetch if forced or cache is stale or missing
                if (!force && data && lastFetched && (now - lastFetched < CACHE_DURATION)) {
                    console.log('[DashboardStore] Using cached data');
                    return;
                }

                set({ isLoading: true });
                try {
                    const res = await fetch('/api/dashboard');
                    if (res.ok) {
                        const payload = await res.json();
                        set({
                            data: payload,
                            lastFetched: now,
                            isLoading: false
                        });
                    } else {
                        console.error('[DashboardStore] Failed to fetch dashboard data');
                        set({ isLoading: false });
                    }
                } catch (error) {
                    console.error('[DashboardStore] Error fetching dashboard data:', error);
                    set({ isLoading: false });
                }
            },

            removeSource: (sourceId) => {
                const { data } = get();
                if (!data) return;

                const updatedSources = data.allSources.filter(s => s._id !== sourceId);
                set({
                    data: {
                        ...data,
                        allSources: updatedSources
                    }
                });
            },

            setData: (data) => set({ data }),
        }),
        {
            name: 'dashboard-storage',
            // Custom storage wrapper to prevent QuotaExceededError from crashing the app
            storage: {
                getItem: (name) => {
                    const str = localStorage.getItem(name);
                    return str ? JSON.parse(str) : null;
                },
                setItem: (name, value) => {
                    try {
                        localStorage.setItem(name, JSON.stringify(value));
                    } catch (e) {
                        console.warn('[DashboardStore] Storage quota exceeded, skipping persistence', e);
                    }
                },
                removeItem: (name) => localStorage.removeItem(name),
            },
            // Prune data to avoid exceeding localStorage quota (5MB limit)
            partialize: (state): any => ({
                data: state.data ? {
                    ...state.data,
                    // Only cache first 10 sources to save space
                    allSources: state.data.allSources.slice(0, 10),
                } : null,
                lastFetched: state.lastFetched
            }),
        }
    )
);
