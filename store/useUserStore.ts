import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
    user: any | null;
    name: string;
    email: string;
    bio: string;
    dob: Date | null;
    university: string;
    deletionScheduledAt: Date | null;
    isAuthenticated: boolean;
    setUser: (user: any) => void;
    updateProfile: (data: Partial<UserState>) => Promise<void>;
    updateStats: (stats: any) => void;
    fetchUser: () => Promise<void>;
    logout: () => void;
    scheduleDeletion: () => Promise<void>;
    cancelDeletion: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            user: null,
            name: 'Guest',
            email: '',
            bio: '',
            dob: null,
            university: '',
            deletionScheduledAt: null,
            isAuthenticated: false,
            setUser: (user) => set({ user }),
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
                try {
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
                                    // Ensure isSubscribed is passed if it exists on data.user
                                });

                                // Handle Maintenance Mode
                                if (data.maintenanceMode && data.user.role !== 'admin') {
                                    if (window.location.pathname !== '/maintenance') {
                                        // Allow admin login flow
                                        if (window.location.pathname === '/login' && window.location.search.includes('admin=true')) {
                                            // Allow
                                        } else {
                                            window.location.href = '/maintenance';
                                        }
                                    }
                                }
                            } else {
                                set({ user: null, isAuthenticated: false });
                            }
                        } else {
                            // Non-JSON response (likely HTML error page)
                            console.warn('Received non-JSON response from /api/auth/me');
                            set({ user: null, isAuthenticated: false });
                        }
                    } else if (res.status === 403) {
                        const contentType = res.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            const data = await res.json();
                            if (data.isBlocked) {
                                set({ user: null, isAuthenticated: false });
                                const allowedPaths = ['/login', '/signup', '/blocked'];
                                if (!allowedPaths.includes(window.location.pathname)) {
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
                    console.error('Failed to fetch user', error);
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
