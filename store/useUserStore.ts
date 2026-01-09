import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SavedAccount {
    userId: string;
    name: string;
    email: string;
    token: string;
    avatar?: string;
}

interface UserState {
    user: any | null;
    name: string;
    email: string;
    bio: string;
    dob: Date | null;
    university: string;
    deletionScheduledAt: Date | null;
    isAuthenticated: boolean;
    savedAccounts: SavedAccount[]; // List of logged-in accounts
    setUser: (user: any) => void;
    updateProfile: (data: Partial<UserState>) => Promise<void>;
    updateStats: (stats: any) => void;
    fetchUser: () => Promise<void>;
    logout: () => void;
    scheduleDeletion: () => Promise<void>;
    cancelDeletion: () => Promise<void>;
    saveAccount: (account: SavedAccount) => void;
    removeAccount: (userId: string) => void;
    switchAccount: (token: string) => Promise<void>;
}

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            user: null,
            name: 'User',
            email: '',
            bio: '',
            dob: null,
            university: '',
            deletionScheduledAt: null,
            isAuthenticated: false,
            savedAccounts: [],
            setUser: (user) => set({ user }),
            saveAccount: (account) => set((state) => {
                const exists = state.savedAccounts.some(a => a.userId === account.userId);
                if (exists) {
                    // Update token if already exists
                    return {
                        savedAccounts: state.savedAccounts.map(a =>
                            a.userId === account.userId ? account : a
                        )
                    };
                }
                return { savedAccounts: [...state.savedAccounts, account] };
            }),
            removeAccount: (userId) => set((state) => ({
                savedAccounts: state.savedAccounts.filter(a => a.userId !== userId)
            })),
            switchAccount: async (token) => {
                try {
                    const res = await fetch('/api/auth/switch-account', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token })
                    });

                    if (res.ok) {
                        window.location.reload();
                    } else {
                        console.error('Failed to switch account');
                        // Optional: remove invalid account?
                    }
                } catch (error) {
                    console.error('Switch account error', error);
                }
            },
            updateProfile: async (data) => {
                // Optimistic update
                set((state) => ({ ...state, ...data }));

                try {
                    await fetch('/api/profile', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                } catch (error) {
                    console.error('Failed to save profile', error);
                }
            },
            updateStats: (stats) => set((state) => ({
                user: state.user ? { ...state.user, stats } : null
            })),
            fetchUser: async () => {
                console.log('[useUserStore] fetchUser triggered');
                try {
                    const pathname = window.location.pathname;
                    const isAuthPage = pathname === '/login' || pathname === '/signup';

                    const res = await fetch('/api/auth/me');
                    if (res.ok) {
                        const contentType = res.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            const data = await res.json();
                            if (data.user) {
                                set({
                                    user: data.user,
                                    name: data.user.name || data.user.email.split('@')[0],
                                    email: data.user.email,
                                    bio: data.user.bio || '',
                                    dob: data.user.dob ? new Date(data.user.dob) : null,
                                    university: data.user.university || '',
                                    deletionScheduledAt: data.user.deletionScheduledAt ? new Date(data.user.deletionScheduledAt) : null,
                                    isAuthenticated: true,
                                });

                                // Handle Maintenance Mode
                                if (data.maintenanceMode && data.user.role !== 'admin') {
                                    console.log('[useUserStore] Maintenance mode detected');
                                    if (pathname !== '/maintenance' && !isAuthPage) {
                                        if (pathname === '/login' && window.location.search.includes('admin=true')) {
                                            console.log('[useUserStore] Admin login flow allowed');
                                        } else {
                                            console.log('[useUserStore] Redirecting to /maintenance');
                                            window.location.href = '/maintenance';
                                        }
                                    }
                                }
                            } else {
                                set({ user: null, isAuthenticated: false });
                            }
                        } else {
                            console.warn('[useUserStore] Received non-JSON response from /api/auth/me');
                            set({ user: null, isAuthenticated: false });
                        }
                    } else if (res.status === 403) {
                        const contentType = res.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            const data = await res.json();
                            if (data.isBlocked) {
                                console.log('[useUserStore] User blocked');
                                set({ user: null, isAuthenticated: false });
                                const allowedPaths = ['/login', '/signup', '/blocked'];
                                if (!allowedPaths.includes(pathname)) {
                                    console.log('[useUserStore] Redirecting to /blocked');
                                    window.location.href = '/blocked';
                                }
                            } else {
                                set({ user: null, isAuthenticated: false });
                            }
                        } else {
                            set({ user: null, isAuthenticated: false });
                        }
                    } else {
                        set({ user: null, isAuthenticated: false });
                    }
                } catch (error) {
                    console.error('[useUserStore] Failed to fetch user', error);
                    set({ user: null, isAuthenticated: false });
                }
            },
            logout: async () => {
                try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    set({ user: null, name: 'Guest', email: '', isAuthenticated: false });
                    window.location.href = '/login';
                } catch (error) {
                    console.error('Logout failed', error);
                }
            },
            scheduleDeletion: async () => {
                try {
                    const res = await fetch('/api/auth/delete-account', { method: 'POST' });
                    if (res.ok) {
                        const data = await res.json();
                        set({ deletionScheduledAt: new Date(data.deletionScheduledAt) });
                    }
                } catch (error) {
                    console.error('Failed to schedule deletion', error);
                }
            },
            cancelDeletion: async () => {
                try {
                    const res = await fetch('/api/auth/delete-account', { method: 'DELETE' });
                    if (res.ok) {
                        set({ deletionScheduledAt: null });
                    }
                } catch (error) {
                    console.error('Failed to cancel deletion', error);
                }
            }
        }),
        {
            name: 'user-storage',
        }
    )
);
