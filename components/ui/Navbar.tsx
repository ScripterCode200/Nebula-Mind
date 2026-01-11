'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    Brain, Menu, X, Search, Bell, ChevronDown,
    User, Sparkles, BookOpen,
    Layout, Zap, MessageSquare,
    Settings, LogOut, CreditCard, ArrowRight, Shield,
    Clock, Timer
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import NeonButton from './NeonButton';
import { useUserStore } from '@/store/useUserStore';
import { useUIStore } from '@/store/useUIStore';
import { useGoalStore } from '@/store/useGoalStore';
import { getRank, RANKS } from '@/lib/levelUtils';


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
    const [topNotebooks, setTopNotebooks] = useState<any[]>([]);
    const [isRankHovered, setIsRankHovered] = useState(false);

    const defaultSettings = [
        { name: 'Account Settings', href: '/settings?tab=account', icon: User, desc: 'Manage your profile' },
        { name: 'Security & Shield', href: '/settings?tab=security', icon: Shield, desc: 'Passwords and sessions' },
        { name: 'Notifications', href: '/settings?tab=notifications', icon: Bell, desc: 'Stay updated' },
        { name: 'Appearance', href: '/settings?tab=appearance', icon: Sparkles, desc: 'Theme and styling' },
        { name: 'Subscriptions', href: '/billing', icon: CreditCard, desc: 'Plan and billing' },
    ];

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

    // Load recent searches and top notebooks
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }

        if (isAuthenticated) {
            fetch('/api/notebooks?limit=4')
                .then(res => res.json())
                .then(data => {
                    if (data.notebooks) {
                        setTopNotebooks(data.notebooks);
                    }
                })
                .catch(err => console.error('Failed to fetch top notebooks', err));
        }
    }, [isAuthenticated]);

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

    // Hide navbar on special pages (Maintenance, Blocked, or Notebook Detail pages)
    // We want Navbar on /notebook (listing), but maybe not on /notebook/[id] (editor)
    const isNotebookDetail = pathname?.startsWith('/notebook/') && pathname !== '/notebook';

    const isTestActive = useGoalStore(state => state.isTestActive);

    if (isNotebookDetail || pathname === '/maintenance' || pathname === '/blocked' || isTestActive) {
        return null;
    }

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
                            <div className="absolute -inset-[3px] bg-linear-to-r from-primary/60 via-blue-500/40 to-purple-500/60 rounded-[34px] opacity-20 group-focus-within/search:opacity-100 transition-all duration-700 blur-sm animate-pulse" />

                            <div className="relative bg-[#050505]/90 backdrop-blur-3xl border border-white/20 group-focus-within/search:border-primary/80 group-focus-within/search:bg-black/95 rounded-[32px] flex items-center transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.5)] group-focus-within/search:shadow-[0_0_40px_rgba(0,240,255,0.2)] overflow-hidden px-4 ring-1 ring-white/10">
                                <Search size={15} className="text-white/60 group-focus-within/search:text-primary group-focus-within/search:scale-125 transition-all duration-500 shrink-0 filter drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search command, page, or notebook..."
                                    className="w-full bg-transparent py-3 px-4 text-sm text-foreground placeholder:text-muted/40 focus:outline-none font-medium tracking-tight"
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
                                        {!searchQuery && (
                                            <div className="space-y-6">
                                                {/* Useful Settings */}
                                                <div>
                                                    <div className="px-5 py-3 text-[10px] font-black text-primary/30 uppercase tracking-[0.4em] bg-primary/5 rounded-2xl mb-4">Command Center</div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {defaultSettings.map((s, i) => (
                                                            <Link key={i} href={s.href} className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group/sitem">
                                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted group-hover/sitem:text-primary transition-colors">
                                                                    <s.icon size={18} />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-white/80 group-hover/sitem:text-white">{s.name}</span>
                                                                    <span className="text-[10px] text-muted/40">{s.desc}</span>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Top Notebooks */}
                                                {topNotebooks.length > 0 && (
                                                    <div>
                                                        <div className="px-5 py-3 text-[10px] font-black text-purple-500/30 uppercase tracking-[0.4em] bg-purple-500/5 rounded-2xl mb-4">Quick Access Notebooks</div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {topNotebooks.map((nb, i) => (
                                                                <Link key={i} href={`/notebook/${nb._id}`} className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group/nbitem">
                                                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                                        <BookOpen size={18} />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-bold text-white/80 group-hover/nbitem:text-white truncate max-w-[150px]">{nb.title}</span>
                                                                        <span className="text-[10px] text-muted/40">Last accessed recently</span>
                                                                    </div>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
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
                            {/* Vibrant Stats Container */}
                            <div
                                className="hidden xl:flex items-center gap-4 bg-black/40 backdrop-blur-3xl border rounded-2xl px-3.5 py-1.5 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative group/stats_container transition-all duration-500"
                                style={{
                                    borderColor: `${getRank(user?.stats?.xp || 0).color}60`,
                                    boxShadow: `0 0 20px ${getRank(user?.stats?.xp || 0).color}20`
                                }}
                            >
                                {/* Animated Background Glow */}
                                <div className="absolute inset-0 bg-linear-to-r from-primary/5 via-purple-500/5 to-primary/5 opacity-0 group-hover/stats_container:opacity-100 transition-opacity duration-1000 rounded-2xl pointer-events-none" />

                                {/* Level Section */}
                                <div className="relative flex items-center gap-2 group/level">
                                    <div className="relative">
                                        {/* Outer Neon Ring */}
                                        <div
                                            className="absolute -inset-1.5 rounded-full blur-sm opacity-30"
                                            style={{ backgroundColor: getRank(user?.stats?.xp || 0).color }}
                                        />

                                        <motion.div
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                            className="relative w-8 h-8 flex items-center justify-center z-10"
                                        >
                                            <div
                                                className="absolute inset-0 bg-linear-to-br from-white/30 via-white/10 to-transparent border border-white/30 shadow-xl"
                                                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                            />
                                            <div
                                                className="absolute inset-[1.5px] opacity-60 blur-[1px]"
                                                style={{
                                                    backgroundColor: getRank(user?.stats?.xp || 0).color,
                                                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                                                }}
                                            />
                                            <span className="relative z-10 text-base font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                                {user?.stats?.level || 1}
                                            </span>
                                        </motion.div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] leading-none mb-0.5">Level</span>
                                        <div className="flex items-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-primary" />
                                            <span className="text-[8px] font-black text-primary uppercase tracking-wider">Active</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Neon Divider */}
                                <div className="w-px h-6 bg-linear-to-b from-transparent via-white/20 to-transparent" />

                                {/* Rank Section */}
                                <div
                                    className="flex flex-col justify-center relative cursor-help"
                                    onMouseEnter={() => setIsRankHovered(true)}
                                    onMouseLeave={() => setIsRankHovered(false)}
                                >
                                    <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] leading-none mb-0.5">Tier</span>
                                    <div
                                        style={{
                                            '--glow': getRank(user?.stats?.xp || 0).color,
                                            filter: `drop-shadow(0 0 3px ${getRank(user?.stats?.xp || 0).color}40)`
                                        } as any}
                                        className={cn(
                                            "text-[10px] font-black bg-clip-text text-transparent bg-linear-to-r tracking-widest uppercase",
                                            getRank(user?.stats?.xp || 0).gradient
                                        )}
                                    >
                                        {getRank(user?.stats?.xp || 0).name}
                                    </div>

                                    <AnimatePresence>
                                        {isRankHovered && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                                className="absolute top-full left-0 mt-3.5 w-80 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-[32px] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.95)] z-50 overflow-hidden ring-1 ring-white/10"
                                            >
                                                {/* Futuristic Background Elements */}
                                                <div className="absolute inset-0 opacity-10 pointer-events-none"
                                                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                                                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary via-purple-500 to-primary" />

                                                {/* Header with Scanline */}
                                                <div className="relative mb-5 overflow-hidden">
                                                    <h4 className="text-[10px] font-black text-white/60 uppercase tracking-[0.5em] flex items-center gap-2">
                                                        <Sparkles size={10} className="text-primary" />
                                                        Rank Evolution
                                                    </h4>
                                                    <motion.div
                                                        animate={{ y: [0, 20, 0] }}
                                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                                        className="absolute inset-x-0 top-0 h-px bg-primary/40 blur-[2px]"
                                                    />
                                                </div>

                                                <div className="space-y-3.5">
                                                    {RANKS.map((r, i) => {
                                                        const isCurrent = getRank(user?.stats?.xp || 0).name === r.name;
                                                        return (
                                                            <div key={i} className={cn(
                                                                "relative p-4 rounded-2xl border transition-all duration-500 overflow-hidden group/rank_item",
                                                                isCurrent ? "bg-white/10 border-white/20 shadow-[0_0_30px_rgba(0,240,255,0.1)] scale-[1.02]" : "bg-white/5 border-transparent opacity-40 hover:opacity-100 hover:bg-white/8"
                                                            )}>
                                                                {/* Rank Background Glow */}
                                                                <div className="absolute inset-0 opacity-0 group-hover/rank_item:opacity-20 transition-opacity bg-linear-to-r" style={{ backgroundImage: `linear-gradient(90deg, ${r.color}22, transparent)` }} />

                                                                <div className="flex items-center justify-between relative z-10">
                                                                    <div className="flex items-center gap-3.5">
                                                                        <div className="relative">
                                                                            <motion.div
                                                                                animate={isCurrent ? { scale: [1, 1.2, 1], rotate: [0, 90, 180, 270, 360] } : {}}
                                                                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                                                                className="absolute -inset-1 blur-md opacity-20 rounded-lg" style={{ backgroundColor: r.color }}
                                                                            />
                                                                            <div className="w-10 h-10 rounded-xl bg-black border p-1 flex items-center justify-center relative overflow-hidden" style={{ borderColor: `${r.color}55` }}>
                                                                                {user.profileImage ? (
                                                                                    <img src={user.profileImage} alt="" className="w-full h-full rounded-lg object-cover opacity-90 group-hover/rank_item:opacity-100 transition-opacity" />
                                                                                ) : (
                                                                                    <span className="text-xs font-black" style={{ color: r.color }}>{name[0]}</span>
                                                                                )}
                                                                                {/* Tech Corners */}
                                                                                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l" style={{ borderColor: r.color }} />
                                                                                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r" style={{ borderColor: r.color }} />
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className={cn("text-xs font-black leading-none bg-clip-text text-transparent bg-linear-to-r tracking-widest uppercase", r.gradient)}>
                                                                                {r.name}
                                                                            </span>
                                                                            <div className="flex items-center gap-1.5 mt-2">
                                                                                <span className="text-[7px] text-white/40 font-black uppercase tracking-[0.2em]">Required XP:</span>
                                                                                <span className="text-[8px] text-white/80 font-mono font-bold">{r.minXp}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    {isCurrent && (
                                                                        <motion.div
                                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                                            animate={{ scale: 1, opacity: 1 }}
                                                                            className="flex items-center gap-1.5 bg-primary/20 px-2.5 py-1 rounded-full border border-primary/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                                                                        >
                                                                            <span className="text-[8px] font-black text-primary uppercase tracking-tighter">Current Unit</span>
                                                                        </motion.div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Neon Divider */}
                                <div className="w-px h-6 bg-linear-to-b from-transparent via-white/20 to-transparent" />

                                {/* Time Section */}
                                <div className="flex items-center gap-2 group/time">
                                    <div className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center group-hover/time:bg-green-500/20 group-hover/time:border-green-500/40 transition-all duration-500">
                                        <Clock size={14} className="text-green-400 group-hover/time:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] leading-none mb-0.5">Time</span>
                                        <div className="flex items-baseline gap-0.5">
                                            <span className="text-xs font-black text-white/90 tracking-tight">
                                                {Math.floor((user?.stats?.totalTimeSpent || 0) / 60)}h
                                            </span>
                                            <span className="text-[9px] font-black text-green-400/60 uppercase">
                                                {(user?.stats?.totalTimeSpent || 0) % 60}m
                                            </span>
                                        </div>
                                    </div>
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
                                    <Sparkles size={14} className="relative z-10 text-primary" />
                                    <span className="relative z-10 text-white uppercase tracking-widest group-hover/btn:scale-105 transition-transform">Notebook</span>
                                </button>
                            </Link>

                            {/* Ultra Profile Dropdown */}
                            <div className="relative" onMouseEnter={() => setActiveDropdown('user')} onMouseLeave={() => setActiveDropdown(null)}>
                                <button className="relative group/avatar">
                                    {/* Animated Avatar Glow */}
                                    <div
                                        className="absolute -inset-1.5 rounded-2xl opacity-40 group-hover/avatar:opacity-100 transition-opacity blur-md"
                                        style={{ backgroundColor: getRank(user?.stats?.xp || 0).color }}
                                    />
                                    <div
                                        className="w-10 h-10 rounded-2xl bg-[#050505] p-0.5 border-2 transition-all relative z-10 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                                        style={{ borderColor: getRank(user?.stats?.xp || 0).color }}
                                    >
                                        {user.profileImage ? (
                                            <img src={user.profileImage} alt={name} className="w-full h-full rounded-xl object-cover" />
                                        ) : (
                                            <div className="w-full h-full rounded-xl bg-black flex items-center justify-center text-sm font-black text-white">
                                                {name.charAt(0)}
                                            </div>
                                        )}
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
