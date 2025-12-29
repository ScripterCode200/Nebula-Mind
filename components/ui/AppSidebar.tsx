'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Layout, BookOpen, Compass, Settings, Shield,
    FileEdit, LogOut, ChevronLeft, User, CreditCard, Brain, PanelLeftClose, X, Trophy
} from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useUIStore } from '@/store/useUIStore';
import { useEffect, useState } from 'react';

export default function AppSidebar() {
    const pathname = usePathname();
    const { user, logout } = useUserStore();
    const { isSidebarOpen, closeSidebar, toggleSidebar } = useUIStore();
    const [isMobile, setIsMobile] = useState(false);

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
    const isNotebookPage = pathname?.startsWith('/notebook/');
    if (!user || isNotebookPage) return null;

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: Layout },
        { name: 'My Notebooks', href: '/notebook', icon: BookOpen },
        { name: 'Explore', href: '/explore', icon: Compass },
        { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    ];

    // Role-based items
    if (user.role === 'admin' || user.role === 'editor') {
        navItems.push({ name: 'Editor', href: '/editor', icon: FileEdit });
    }

    if (user.role === 'admin') {
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

    return (
        <>
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

                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut size={18} />
                            <span className="text-sm font-medium">Log out</span>
                        </button>
                    </div>
                </div>
            </motion.aside>
        </>
    );
}
