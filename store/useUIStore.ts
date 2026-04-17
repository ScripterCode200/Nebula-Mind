import { create } from 'zustand';
import { safeFetch } from '@/lib/api-client';

interface UIState {
    isSidebarOpen: boolean;
    hasUnreadNotifications: boolean;
    toggleSidebar: () => void;
    closeSidebar: () => void;
    openSidebar: () => void;
    checkUnreadNotifications: () => Promise<void>;
    setHasUnreadNotifications: (status: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    isSidebarOpen: true,
    hasUnreadNotifications: false,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    closeSidebar: () => set({ isSidebarOpen: false }),
    openSidebar: () => set({ isSidebarOpen: true }),
    setHasUnreadNotifications: (status) => set({ hasUnreadNotifications: status }),
    checkUnreadNotifications: async () => {
        try {
            // Use safeFetch for robust background polling (includes timeout and offline checks)
            const data = await safeFetch<{ hasUnread: boolean }>('/api/notifications?check=true');
            if (data) {
                set({ hasUnreadNotifications: data.hasUnread });
            }
        } catch (error: any) {
            // Mute background polling errors in console unless they are critical
            // Next.js 'Failed to fetch' is usually a 500 Network Error in safeFetch
            if (error.status !== 500 && error.status !== 0) {
                console.debug('Notification check skipped:', error.message);
            }
        }
    }
}));
