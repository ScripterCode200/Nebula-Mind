import { create } from 'zustand';

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
            const res = await fetch('/api/notifications?check=true');
            if (res.ok) {
                const data = await res.json();
                set({ hasUnreadNotifications: data.hasUnread });
            }
        } catch (error) {
            console.error('Failed to check notifications:', error);
        }
    }
}));
