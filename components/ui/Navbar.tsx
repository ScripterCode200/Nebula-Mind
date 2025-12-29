'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    Brain, Menu, X, Search, Bell, ChevronDown,
    User, Sparkles, BookOpen,
    Layout, Zap, MessageSquare,
    Settings, LogOut, CreditCard, ArrowRight
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import NeonButton from './NeonButton';
import { useUserStore } from '@/store/useUserStore';
import { useUIStore } from '@/store/useUIStore';

interface NavItem {
    name: string;
    href: string;
    dropdown?: {
        name: string;
        href: string;
        icon: any;
        desc: string;
    }[];
}

const navItems: NavItem[] = [
    { name: 'Home', href: '/' },
    // {
    //     name: 'Features',
    //     href: '#',
    //     dropdown: [
    //         { name: 'AI Notebooks', href: '/notebook', icon: BookOpen, desc: 'Smart note-taking' },
    //         { name: 'Knowledge Graph', href: '#', icon: Layout, desc: 'Visual learning' },
    //         { name: 'Mock Tests', href: '#', icon: Zap, desc: 'Exam prep' },
    //         { name: 'AI Chat', href: '#', icon: MessageSquare, desc: '24/7 Tutor' },
    //     ]
    // },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'Docs', href: '/docs' },
    { name: 'Explore', href: '/explore' },
];

export default function Navbar() {
    const pathname = usePathname();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const { name, email, logout, isAuthenticated, user } = useUserStore();
    const { isSidebarOpen, toggleSidebar } = useUIStore();

    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [searchFocused, setSearchFocused] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const [recentSearches, setRecentSearches] = useState<any[]>([]);

    const searchablePages = [
        { name: 'Dashboard', href: '/dashboard', type: 'Page' },
        { name: 'Notebooks', href: '/notebook', type: 'Page' },
        { name: 'Profile', href: '/profile', type: 'Page' },
        { name: 'Settings', href: '/settings', type: 'Page' },
        { name: 'Pricing', href: '/#pricing', type: 'Section' },
        { name: 'Docs', href: '/docs', type: 'Page' },
        { name: 'Explore', href: '/explore', type: 'Page' },
        // Expanded Settings
        { name: 'Account Settings', href: '/settings?tab=account', type: 'Setting' },
        { name: 'Security', href: '/settings?tab=security', type: 'Setting' },
        { name: 'Notifications', href: '/settings?tab=notifications', type: 'Setting' },
        { name: 'Billing', href: '/billing', type: 'Setting' },
        { name: 'Appearance', href: '/settings?tab=appearance', type: 'Setting' },
    ];

    // Load recent searches
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    const addToRecents = (item: any) => {
        const newRecents = [item, ...recentSearches.filter(r => r.name !== item.name)].slice(0, 5);
        setRecentSearches(newRecents);
        localStorage.setItem('recentSearches', JSON.stringify(newRecents));
        setSearchQuery('');
    };

    const clearRecents = (e: React.MouseEvent) => {
        e.stopPropagation();
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    };

    // Fetch user on mount
    useEffect(() => {
        useUserStore.getState().fetchUser();
    }, []);

    // Scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [pathname]);

    // Keydown effect for search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Search logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery) {
                // local pages search
                const localResults = searchablePages.filter(page =>
                    page.name.toLowerCase().includes(searchQuery.toLowerCase())
                );

                // api notebooks search
                let notebookResults: any[] = [];
                if (isAuthenticated) {
                    try {
                        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
                        if (res.ok) {
                            const data = await res.json();
                            notebookResults = data.notebooks.map((nb: any) => ({
                                name: nb.title,
                                href: `/notebook/${nb._id}`,
                                type: 'Notebook',
                                icon: BookOpen
                            }));
                        }
                    } catch (err) {
                        console.error('Search failed', err);
                    }
                }

                setSearchResults([...localResults, ...notebookResults]);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, isAuthenticated]);

    const isHome = pathname === '/';

    const currentNavItems = [...navItems];

    // If logged in, replace "Home" with "Dashboard"
    if (user) {
        // Clear desktop links
        currentNavItems.length = 0;
    }

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const sidebarWidth = "16rem";
    const shouldShift = user && isSidebarOpen && !isMobile;

    const isNotebookPage = pathname?.startsWith('/notebook/');
    if (isNotebookPage) return null;

    return (
        <nav
            style={{
                left: shouldShift ? sidebarWidth : 0,
                width: shouldShift ? `calc(100% - ${sidebarWidth})` : '100%'
            }}
            className={cn(
                "fixed top-0 right-0 z-60 transition-all duration-500 border-b border-transparent ease-in-out",
                scrolled || !isHome ? "bg-black/40 backdrop-blur-2xl border-white/5 py-4" : "py-6"
            )}
            onMouseLeave={() => setActiveDropdown(null)}
        >
            <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between gap-6 h-12">
                {/* Left Section: Logo & Toggle */}
                <div className="flex items-center gap-4">
                    {/* Show Menu button ONLY if sidebar is closed */}
                    {user && !isSidebarOpen && (
                        <button
                            onClick={toggleSidebar}
                            className="p-2.5 rounded-2xl text-muted/60 hover:text-primary hover:bg-primary/10 transition-all active:scale-90 border border-transparent hover:border-primary/20"
                        >
                            <Menu size={20} />
                        </button>
                    )}

                    {/* Logo: Show if sidebar is closed OR user is not logged in */}
                    <Link
                        href={user ? "/dashboard" : "/"}
                        className={cn(
                            "flex items-center gap-4 group shrink-0 transition-all duration-500",
                            user && isSidebarOpen && !isMobile ? "opacity-0 pointer-events-none w-0 overflow-hidden" : "opacity-100 translate-x-0"
                        )}
                    >
                        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500">
                            <Brain size={20} className="text-primary filter drop-shadow-[0_0_10px_rgba(0,240,255,0.6)]" />
                        </div>
                        <span className="font-black text-lg tracking-tight text-white leading-none whitespace-nowrap">NEBULA <span className="text-primary">MIND</span></span>
                    </Link>
                </div>

                {/* Center Section: Command Palette Search (Auth Only) */}
                {user && (
                    <div className="flex-1 max-w-md mx-auto hidden md:block group/search">
                        <div className="relative">
                            {/* Animated Aurora Glow Backdrop */}
                            <div className="absolute -inset-[3px] bg-linear-to-r from-primary/40 via-blue-500/10 to-purple-500/40 rounded-[34px] opacity-0 group-focus-within/search:opacity-100 transition-all duration-700 blur-sm animate-pulse" />

                            <div className="relative bg-[#050505]/80 backdrop-blur-3xl border border-white/5 group-focus-within/search:border-primary/50 group-focus-within/search:bg-black/90 rounded-[32px] flex items-center transition-all duration-500 shadow-[20px_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden px-4 ring-1 ring-white/5">
                                <Search size={15} className="text-muted/30 group-focus-within/search:text-primary group-focus-within/search:scale-110 transition-all duration-500 shrink-0" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search command, page, or notebook..."
                                    className="w-full bg-transparent py-3 px-4 text-sm text-foreground placeholder:text-muted/20 focus:outline-none font-medium tracking-tight"
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    value={searchQuery}
                                />

                                {/* Shortcut Layer */}
                                <div className="flex items-center gap-2 group-focus-within/search:opacity-0 transition-opacity duration-300 select-none shrink-0">
                                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 shadow-inner">
                                        <span className="text-[10px] font-black text-muted/40 tracking-tighter">⌘</span>
                                        <span className="text-[10px] font-black text-muted/40">K</span>
                                    </div>
                                </div>
                            </div>

                            {/* Pro-Search Dropdown */}
                            <AnimatePresence>
                                {searchFocused && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
                                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(10px)" }}
                                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                        className="absolute top-full left-0 right-0 mt-4 bg-[#050505]/95 backdrop-blur-3xl border border-white/10 rounded-[32px] p-4 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] overflow-hidden z-50 max-h-[70vh] overflow-y-auto custom-scrollbar ring-1 ring-white/10"
                                    >
                                        {!searchQuery && recentSearches.length > 0 && (
                                            <div className="space-y-1.5">
                                                <div className="px-5 py-3 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] flex justify-between items-center bg-white/5 rounded-2xl mb-2">
                                                    <span>Recent Expeditions</span>
                                                    <button onClick={clearRecents} className="hover:text-red-400 transition-all duration-300">Purge Data</button>
                                                </div>
                                                {recentSearches.map((result, index) => (
                                                    <Link key={`recent-${index}`} href={result.href} className="flex items-center gap-4 px-5 py-4 rounded-[20px] hover:bg-white/5 text-sm text-white/50 hover:text-white transition-all duration-300 group/item" onClick={() => addToRecents(result)}>
                                                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover/item:border-primary/40 group-hover/item:text-primary transition-all duration-300">
                                                            <Search size={16} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold tracking-tight group-hover/item:translate-x-2 transition-transform duration-500">{result.name}</span>
                                                            <span className="text-[10px] opacity-20 group-hover/item:opacity-40 transition-opacity">Quick Launch Cache</span>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                        {searchQuery && searchResults.length > 0 && (
                                            <div className="space-y-1.5">
                                                <div className="px-5 py-3 text-[10px] font-black text-primary/30 uppercase tracking-[0.4em] bg-primary/5 rounded-2xl mb-2">Neural Link Matches</div>
                                                {searchResults.map((result, index) => (
                                                    <Link key={`res-${index}`} href={result.href} className="flex items-center justify-between px-4 py-4 rounded-[24px] hover:bg-primary/10 text-sm transition-all duration-500 group/item overflow-hidden relative" onClick={() => addToRecents(result)}>
                                                        <div className="flex items-center gap-5 text-white/80 group-hover/item:text-white relative z-10">
                                                            <div className={cn("w-12 h-12 rounded-[18px] flex items-center justify-center transition-all duration-500 border border-white/5 group-hover/item:border-primary/40", result.type === 'Notebook' ? "bg-primary/20 text-primary shadow-[0_0_20px_rgba(0,240,255,0.15)]" : "bg-white/10 text-white/40")}>
                                                                {result.type === 'Notebook' ? <BookOpen size={20} /> : <Layout size={20} />}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-base tracking-tight group-hover/item:translate-x-2 transition-transform duration-700">{result.name}</span>
                                                                <span className="text-[10px] text-primary/50 font-black uppercase tracking-[0.2em] mt-0.5">{result.type}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 relative z-10">
                                                            <div className="h-px w-8 bg-primary/0 group-hover/item:bg-primary/40 transition-all duration-500" />
                                                            <ArrowRight size={18} className="opacity-0 -translate-x-6 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-700 text-primary" />
                                                        </div>
                                                        <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-700" />
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {/* Right Section: Standard Nav (Guest) or Profile (Auth) */}
                <div className="flex items-center gap-3">
                    {!user && (
                        <div className="hidden md:flex items-center gap-6">
                            {currentNavItems.map((item) => (
                                <Link key={item.name} href={item.href} className="text-sm font-medium text-muted hover:text-foreground transition-colors">
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Notifications & Profile (Always show if user, else Login) */}
                    {user ? (
                        <>
                            {/* AI Telemetry Monitor (Loaded/Futuristic) */}
                            <div className="hidden xl:flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-1.5 shadow-inner">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
                                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Neural Load</span>
                                    </div>
                                    <div className="h-1 w-20 bg-white/5 rounded-full mt-1 overflow-hidden">
                                        <div className="h-full bg-primary/60 w-[65%] shadow-[0_0_10px_rgba(0,240,255,0.3)]" />
                                    </div>
                                </div>
                                <div className="w-px h-6 bg-white/5" />
                                <div className="flex flex-col text-right">
                                    <span className="text-[8px] font-bold text-primary/40 leading-none uppercase tracking-tighter">Response</span>
                                    <span className="text-[10px] font-black text-white/80 leading-tight mt-0.5">1.2s <span className="text-primary/40">avg</span></span>
                                </div>
                                <div className="w-px h-6 bg-white/5" />
                                <div className="flex flex-col text-right">
                                    <span className="text-[8px] font-bold text-purple-500/40 leading-none uppercase tracking-tighter">Accuracy</span>
                                    <span className="text-[10px] font-black text-white/80 leading-tight mt-0.5">99.8%</span>
                                </div>
                            </div>

                            <Link href="/notifications" className="relative p-3 rounded-2xl text-muted/60 hover:text-primary hover:bg-primary/10 transition-all group overflow-hidden border border-transparent hover:border-primary/20">
                                <Bell size={20} className="relative z-10" />
                                <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary ring-2 ring-[#050505] z-20 shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>

                            <Link href="/notebook" className="hidden md:block">
                                <button className="relative group/btn flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-xs font-bold transition-all border border-primary/20 hover:border-primary/40 group overflow-hidden shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                                    <div className="absolute inset-0 bg-linear-to-r from-primary/20 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                    <Sparkles size={14} className="relative z-10 text-primary animate-pulse" />
                                    <span className="relative z-10 text-white uppercase tracking-widest group-hover/btn:scale-105 transition-transform">Notebook</span>
                                </button>
                            </Link>

                            {/* Ultra Profile Dropdown */}
                            <div className="relative" onMouseEnter={() => setActiveDropdown('user')} onMouseLeave={() => setActiveDropdown(null)}>
                                <button className="relative group/avatar">
                                    <div className="absolute -inset-1 bg-linear-to-r from-primary to-purple-500 rounded-2xl opacity-0 group-hover/avatar:opacity-40 transition-opacity blur-md" />
                                    <div className="w-10 h-10 rounded-2xl bg-white/10 p-0.5 border border-white/20 hover:border-primary/50 transition-all relative z-10 overflow-hidden">
                                        <div className="w-full h-full rounded-xl bg-black flex items-center justify-center text-sm font-black text-white">
                                            {name.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#050505] z-20 shadow-[0_0_8px_rgba(34,197,94,0.6)] flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                    </div>
                                </button>
                                <AnimatePresence>
                                    {activeDropdown === 'user' && (
                                        <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2, ease: "easeOut" }} className="absolute top-full right-0 pt-4 w-64 z-50">
                                            <div className="bg-[#0A0A0A]/95 backdrop-blur-2xl border border-white/10 rounded-[24px] p-2 shadow-[0_30px_60px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
                                                <div className="px-4 py-4 mb-2 bg-white/5 rounded-2xl border border-white/5">
                                                    <div className="text-sm font-black text-white tracking-tight">{name}</div>
                                                    <div className="text-[10px] text-primary/60 font-black uppercase tracking-widest mt-0.5">{user.role || 'Member'}</div>
                                                    <div className="text-xs text-muted/40 truncate mt-2 font-medium">{email}</div>
                                                </div>

                                                <div className="space-y-1">
                                                    <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-sm text-muted/80 hover:text-white transition-all group/link">
                                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/link:text-primary transition-colors">
                                                            <User size={16} />
                                                        </div>
                                                        <span className="font-bold tracking-tight">Identity Profile</span>
                                                    </Link>
                                                    <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-sm text-muted/80 hover:text-white transition-all group/link">
                                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/link:text-primary transition-colors">
                                                            <Settings size={16} />
                                                        </div>
                                                        <span className="font-bold tracking-tight">System Config</span>
                                                    </Link>
                                                    <Link href="/billing" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-sm text-muted/80 hover:text-white transition-all group/link">
                                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/link:text-primary transition-colors">
                                                            <CreditCard size={16} />
                                                        </div>
                                                        <span className="font-bold tracking-tight">Neural Subscriptions</span>
                                                    </Link>
                                                </div>

                                                <div className="h-px bg-white/5 my-2 mx-2" />
                                                <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-sm text-red-400/80 hover:text-red-400 transition-all group/link">
                                                    <div className="w-8 h-8 rounded-lg bg-red-500/5 flex items-center justify-center group-hover/link:bg-red-500/10 transition-colors">
                                                        <LogOut size={16} />
                                                    </div>
                                                    <span className="font-black uppercase tracking-widest text-[10px]">Terminate Session</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link href="/login" className="hidden md:block">
                                <NeonButton size="sm" className="px-6 h-10 text-xs font-black uppercase tracking-widest">Log In</NeonButton>
                            </Link>
                            <button className="md:hidden text-white/60 p-2.5 rounded-xl bg-white/5 border border-white/10" onClick={() => setIsOpen(!isOpen)}>
                                <Menu size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>


            {/* Mobile Menu for GUESTS Only */}
            {!user && (
                <motion.div initial={false} animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }} className="md:hidden overflow-hidden bg-black/95 backdrop-blur-xl border-b border-white/10">
                    <div className="px-4 py-6 space-y-4">
                        {currentNavItems.map(item => (
                            <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)} className="block text-lg font-medium text-muted hover:text-foreground">{item.name}</Link>
                        ))}
                        <Link href="/login" onClick={() => setIsOpen(false)} className="block w-full"><NeonButton className="w-full">Log In</NeonButton></Link>
                    </div>
                </motion.div>
            )}
        </nav>
    );
}
