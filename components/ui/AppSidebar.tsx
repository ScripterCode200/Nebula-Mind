'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Layout, BookOpen, Compass, Settings, Shield,
    FileEdit, LogOut, ChevronLeft, User, CreditCard, Brain, PanelLeftClose, X, Trophy, Rocket, MessageSquare
} from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useUIStore } from '@/store/useUIStore';
import { useEffect, useState } from 'react';
import SwitchAccountModal from '../auth/SwitchAccountModal';
import LogoutModal from '../modals/LogoutModal';

export default function AppSidebar() {
    const pathname = usePathname();
    const { user, logout, savedAccounts, switchAccount, removeAccount } = useUserStore();
    const { isSidebarOpen, closeSidebar, toggleSidebar } = useUIStore();
    const [isMobile, setIsMobile] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    console.log('Current User:', user);
    console.log('Saved Accounts:', savedAccounts);

    // Handle responsiveness
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                // Determine desktop behavior if needed, currently we control via isOpen
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Explicitly hide sidebar on route change on mobile
    useEffect(() => {
        if (isMobile) {
            closeSidebar();
        }
    }, [pathname, isMobile, closeSidebar]);

    // Don't render if on a notebook page (focused workspace) or not logged in


    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: Layout },
        { name: 'My Notebooks', href: '/notebook', icon: BookOpen },
        { name: 'Interactive AI', href: '/interactive-ai', icon: Brain },
        { name: 'Explore', href: '/explore', icon: Compass },
        { name: 'Sessions', href: '/sessions', icon: MessageSquare },
        // { name: 'Play Zone', href: '/learning-booster', icon: Rocket }, // Temporarily removed
        { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
        { name: 'Profile', href: '/profile', icon: User },
    ];

    // Role-based items
    if (user?.role === 'admin' || user?.role === 'editor') {
        navItems.push({ name: 'Editor', href: '/editor', icon: FileEdit });
    }

    if (user?.role === 'admin') {
        navItems.push({ name: 'Admin Panel', href: '/admin', icon: Shield });
    }

    const bottomItems = [
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    const sidebarVariants = {
        open: {
            x: 0,
            width: "16rem", // w-64
            transition: {
                stiffness: 300,
                damping: 30
            }
        },
        closed: {
            x: isMobile ? "-100%" : 0,
            width: isMobile ? "16rem" : "0rem",
            transition: {
                stiffness: 300,
                damping: 30
            }
        }
    };

    const isNotebookPage = pathname?.startsWith('/notebook/') || pathname === '/maintenance' || pathname === '/blocked' || pathname?.startsWith('/sessions/live');
    if (!user || isNotebookPage) return null;

    return (
        <>
            <SwitchAccountModal isOpen={isSwitchModalOpen} onClose={() => setIsSwitchModalOpen(false)} />

            {/* Backdrop for mobile */}
            <AnimatePresence>
                {isSidebarOpen && isMobile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeSidebar}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial="closed"
                animate={isSidebarOpen ? "open" : "closed"}
                variants={sidebarVariants}
                className={cn(
                    "fixed top-0 left-0 h-full z-50 overflow-hidden flex flex-col",
                    "bg-[#050505]/95 backdrop-blur-2xl border-r border-white/5",
                    "shadow-[10px_0_40px_-10px_rgba(0,0,0,0.8)]"
                )}
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-64 bg-primary/5 blur-[80px] pointer-events-none" />

                {/* Header with Logo */}
                <div className="flex items-center gap-3 px-4 h-[64px] shrink-0 border-b border-white/5 relative z-10 box-border">
                    <button
                        onClick={toggleSidebar}
                        className="p-1 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center shrink-0"
                        title="Collapse Sidebar"
                    >
                        <PanelLeftClose size={16} />
                    </button>

                    <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-linear-to-br from-primary to-secondary text-black font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)] shrink-0">
                        <Brain size={16} />
                    </div>
                    <span className="font-bold text-base tracking-tight text-white/90 truncate">Nebula Mind</span>
                </div>

                {/* Content Container */}
                <div className="flex-1 flex flex-col w-70 px-3 py-6 relative z-10 overflow-y-auto custom-scrollbar">

                    {/* Navigation Links */}
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                        isActive
                                            ? "text-primary font-medium"
                                            : "text-muted hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {/* Active Background Indicator */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-primary/10 border-l-[3px] border-primary" />
                                    )}

                                    <item.icon
                                        size={18}
                                        className={cn(
                                            "relative z-10 transition-transform duration-300 group-hover:scale-110",
                                            isActive && "text-primary drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]"
                                        )}
                                    />
                                    <span className="relative z-10 tracking-wide text-sm">{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="flex-1" />

                    {/* Bottom Settings & User */}
                    <div className="space-y-2 pt-4 border-t border-white/10">
                        {bottomItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all hover:bg-white/5 text-muted hover:text-foreground",
                                    pathname === item.href && "text-foreground bg-white/5"
                                )}
                            >
                                <item.icon size={18} />
                                <span className="text-sm font-medium">{item.name}</span>
                            </Link>
                        ))}

                        {/* User Profile & Menu */}
                        <div
                            className="relative mt-2"
                            onMouseEnter={() => setIsUserMenuOpen(true)}
                            onMouseLeave={() => setIsUserMenuOpen(false)}
                        >
                            <AnimatePresence>
                                {isUserMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute bottom-full left-0 w-full mb-2 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20"
                                    >
                                        <div className="p-1 space-y-1">
                                            <button
                                                onClick={() => {
                                                    setIsSwitchModalOpen(true);
                                                    setIsUserMenuOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-muted hover:text-white transition-colors text-sm"
                                            >
                                                <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
                                                    <User size={14} />
                                                </div>
                                                Switch Account
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsLogoutModalOpen(true);
                                                    setIsUserMenuOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors text-sm"
                                            >
                                                <div className="p-1.5 rounded-md bg-red-500/10 text-red-400">
                                                    <LogOut size={14} />
                                                </div>
                                                Log out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border border-transparent",
                                    isUserMenuOpen ? "bg-white/5 border-white/5" : "hover:bg-white/5"
                                )}
                            >
                                <div className="h-9 w-9 rounded-full bg-linear-to-br from-primary/20 to-secondary/20 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                    {user?.profileImage ? (
                                        <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-bold text-primary text-xs">
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 text-left overflow-hidden">
                                    <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </motion.aside>

            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={logout}
            />
        </>
    );
}
