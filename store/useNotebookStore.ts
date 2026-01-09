import { create } from 'zustand';

export interface Notebook {
    _id: string;
    title: string;
    createdAt: string;
    pdfUrl: string;
    ownerName?: string;
    ownerImage?: string;
    userId?: string;
}

interface NotebookState {
    notebooks: Notebook[];
    page: number;
    limit: number;
    hasMore: boolean;
    isLoading: boolean;
    total: number;
    isInitialized: boolean;

    fetchNotebooks: (reset?: boolean) => Promise<void>;
    addNotebook: (notebook: Notebook) => void;
    removeNotebook: (id: string) => void;
    updateNotebook: (id: string, updates: Partial<Notebook>) => void;
    reset: () => void;
}

export const useNotebookStore = create<NotebookState>((set, get) => ({
    notebooks: [],
    page: 1,
    limit: 9,
    hasMore: true,
    isLoading: false,
    total: 0,
    isInitialized: false,

    fetchNotebooks: async (reset = false) => {
        const { page, limit, hasMore, isLoading, isInitialized } = get();

        // If not resetting and already loading or no more items (and already initialized), do nothing
        if (!reset && (isLoading || (!hasMore && isInitialized))) return;

        set({ isLoading: true });

        try {
            const currentPage = reset ? 1 : page;
            const res = await fetch(`/api/notebooks?page=${currentPage}&limit=${limit}`);

            if (res.ok) {
                const data = await res.json();

                set(state => ({
                    notebooks: reset
                        ? data.notebooks
                        : [...state.notebooks, ...data.notebooks],
                    page: currentPage + 1,
                    hasMore: data.hasMore,
                    total: data.total,
                    isInitialized: true,
                    isLoading: false
                }));
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Failed to fetch notebooks', error);
            set({ isLoading: false });
        }
    },

    addNotebook: (notebook) => set(state => ({
        notebooks: [notebook, ...state.notebooks],
        total: state.total + 1
    })),

    removeNotebook: (id) => set(state => ({
        notebooks: state.notebooks.filter(n => n._id !== id),
        total: state.total - 1
    })),

    updateNotebook: (id, updates) => set(state => ({
        notebooks: state.notebooks.map(n => n._id === id ? { ...n, ...updates } : n)
    })),

    reset: () => set({
        notebooks: [],
        page: 1,
        hasMore: true,
        isInitialized: false,
        total: 0
    })
}));
