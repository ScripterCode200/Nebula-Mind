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
        const homeIndex = currentNavItems.findIndex(i => i.name === 'Home');
        if (homeIndex !== -1) {
            currentNavItems[homeIndex] = { name: 'Dashboard', href: '/dashboard' };
        }
    }

    // Role based links
    if (user?.role === 'admin') {
        currentNavItems.push({ name: 'Admin', href: '/admin' });
    }

    if (user?.role === 'admin' || user?.role === 'editor') {
        currentNavItems.push({ name: 'Editor', href: '/editor' });
    }

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
                scrolled || !isHome ? "bg-black/80 backdrop-blur-xl border-white/10 py-3" : "bg-transparent py-5"
            )}
            onMouseLeave={() => setActiveDropdown(null)}
        >
            <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group shrink-0">
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-primary to-secondary text-black font-bold text-xl shadow-[0_0_20px_rgba(0,240,255,0.3)] group-hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-shadow duration-300">
                        <Brain size={20} />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-foreground hidden sm:block">Nebula Mind</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6">
                    {currentNavItems.map((item) => (
                        <div
                            key={item.name}
                            className="relative"
                            onMouseEnter={() => item.dropdown && setActiveDropdown(item.name)}
                        >
                            <Link
                                href={item.href}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 py-2",
                                    pathname === item.href ? "text-primary" : "text-muted"
                                )}
                            >
                                {item.name}
                                {item.dropdown && <ChevronDown size={14} className={cn("transition-transform duration-200", activeDropdown === item.name ? "rotate-180" : "")} />}
                            </Link>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {activeDropdown === item.name && item.dropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-64"
                                        onMouseLeave={() => setActiveDropdown(null)}
                                    >
                                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-2 shadow-2xl backdrop-blur-xl overflow-hidden">
                                            {item.dropdown.map((subItem) => (
                                                <Link
                                                    key={subItem.name}
                                                    href={subItem.href}
                                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                                                >
                                                    <div className="p-2 rounded-md bg-white/5 text-muted group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                                        <subItem.icon size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{subItem.name}</div>
                                                        <div className="text-xs text-muted">{subItem.desc}</div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                {/* Search Bar */}
                <div className={cn(
                    "hidden lg:flex items-center relative transition-all duration-300",
                    searchFocused ? "flex-1 max-w-md" : "w-64"
                )}>
                    <Search size={16} className="absolute left-3 text-muted" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-12 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:bg-black/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        value={searchQuery}
                    />
                    <AnimatePresence>
                        {searchFocused && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-white/10 rounded-xl p-2 shadow-2xl backdrop-blur-xl overflow-hidden z-50 divide-y divide-white/5"
                            >
                                {/* Recent Searches */}
                                {!searchQuery && recentSearches.length > 0 && (
                                    <>
                                        <div className="flex items-center justify-between px-2 py-1.5 opacity-70">
                                            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Recent</span>
                                            <button
                                                onClick={clearRecents}
                                                className="text-[10px] text-muted hover:text-red-400 transition-colors"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                        {recentSearches.map((result, index) => (
                                            <Link
                                                key={`recent-${index}`}
                                                href={result.href}
                                                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 text-sm transition-colors group"
                                                onClick={() => addToRecents(result)}
                                            >
                                                <div className="flex items-center gap-3 text-foreground/80">
                                                    <div className="p-1 rounded bg-white/5 text-muted group-hover:text-primary transition-colors">
                                                        <Search size={12} />
                                                    </div>
                                                    {result.name}
                                                </div>
                                            </Link>
                                        ))}
                                    </>
                                )}

                                {/* Search Results */}
                                {searchQuery && searchResults.length > 0 && (
                                    <>
                                        {/* Settings & Pages Section */}
                                        {searchResults.some(r => r.type !== 'Notebook') && (
                                            <div className="block px-2 text-[10px] font-semibold text-muted uppercase tracking-wider py-1.5 opacity-70">Pages & Settings</div>
                                        )}
                                        {searchResults.filter(r => r.type !== 'Notebook').map((result, index) => (
                                            <Link
                                                key={`page-${index}`}
                                                href={result.href}
                                                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 text-sm transition-colors group"
                                                onClick={() => addToRecents(result)}
                                            >
                                                <div className="flex items-center gap-3 text-foreground">
                                                    <div className="p-1 rounded bg-white/5 text-muted group-hover:text-primary transition-colors">
                                                        {result.type === 'Setting' ? <Settings size={12} /> : (result.type === 'Section' ? <Layout size={12} /> : <Zap size={12} />)}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium mr-2">{result.name}</span>
                                                        {result.type === 'Setting' && <span className="text-[10px] text-muted border border-white/10 px-1 rounded">Setting</span>}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}

                                        {/* Notebooks Section */}
                                        {searchResults.some(r => r.type === 'Notebook') && (
                                            <>
                                                <div className="block px-2 text-[10px] font-semibold text-muted uppercase tracking-wider py-1.5 mt-2 opacity-70">Notebooks</div>
                                                {searchResults.filter(r => r.type === 'Notebook').map((result, index) => (
                                                    <Link
                                                        key={`nb-${index}`}
                                                        href={result.href}
                                                        className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 text-sm transition-colors group"
                                                        onClick={() => addToRecents(result)}
                                                    >
                                                        <div className="flex items-center gap-3 text-foreground">
                                                            <div className="p-1 rounded bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                                                <BookOpen size={12} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{result.name}</span>
                                                                <span className="text-[10px] text-muted">Notebook</span>
                                                            </div>
                                                        </div>
                                                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0" />
                                                    </Link>
                                                ))}
                                            </>
                                        )}
                                    </>
                                )}

                                {/* No Results */}
                                {searchQuery && searchResults.length === 0 && (
                                    <div className="px-3 py-4 text-center text-sm text-muted">
                                        <div className="mb-2 flex justify-center"><Search size={24} className="opacity-20" /></div>
                                        No results found
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="absolute right-2 flex items-center gap-1 pointer-events-none">
                        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <Link href="/notifications" className="relative p-2 text-muted hover:text-foreground transition-colors group">
                        <Bell size={20} className="group-hover:text-primary transition-colors" />
                    </Link>

                    <div className="h-8 w-px bg-white/10 hidden sm:block" />

                    <div className="hidden sm:flex items-center gap-3">
                        {user ? (
                            <>
                                <div className="text-right hidden xl:block">
                                    <div className="text-sm font-medium text-foreground">{name}</div>
                                    <div className="text-xs text-muted">Pro Plan</div>
                                </div>
                                <div
                                    className="relative"
                                    onMouseEnter={() => setActiveDropdown('user')}
                                    onMouseLeave={() => setActiveDropdown(null)}
                                >
                                    <button className="w-9 h-9 cursor-pointer rounded-full bg-linear-to-tr from-primary to-secondary p-px group relative">
                                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                            <User size={18} className="text-white group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-black" />
                                    </button>

                                    <AnimatePresence>
                                        {activeDropdown === 'user' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute top-full right-0 pt-4 w-56"
                                            >
                                                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-2 shadow-2xl backdrop-blur-xl overflow-hidden">
                                                    <div className="px-3 py-2 border-b border-white/5 mb-2">
                                                        <div className="text-sm font-medium text-foreground">{name}</div>
                                                        <div className="text-xs text-muted">{email}</div>
                                                    </div>

                                                    <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-muted hover:text-foreground transition-colors">
                                                        <Layout size={16} />
                                                        Dashboard
                                                    </Link>

                                                    <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-muted hover:text-foreground transition-colors">
                                                        <User size={16} />
                                                        Profile
                                                    </Link>
                                                    <Link href="/settings" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-muted hover:text-foreground transition-colors">
                                                        <Settings size={16} />
                                                        Settings
                                                    </Link>
                                                    <Link href="/billing" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-muted hover:text-foreground transition-colors">
                                                        <CreditCard size={16} />
                                                        Billing
                                                    </Link>

                                                    <div className="h-px bg-white/5 my-2" />

                                                    <button
                                                        onClick={logout}
                                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-sm text-red-400 hover:text-red-300 transition-colors"
                                                    >
                                                        <LogOut size={16} />
                                                        Log Out
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        ) : (
                            <Link href="/login">
                                <NeonButton size="sm" className="px-6">
                                    Log In
                                </NeonButton>
                            </Link>
                        )}
                    </div>

                    {user && (
                        <Link href="/notebook" className="hidden md:block">
                            <NeonButton size="sm" className="px-5 cursor-pointer" variant="secondary">
                                <Sparkles size={16} className="mr-2" />
                                New
                            </NeonButton>
                        </Link>
                    )}

                    <button
                        className="md:hidden text-muted hover:text-foreground p-2"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <motion.div
                initial={false}
                animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden bg-black/95 backdrop-blur-xl border-b border-white/10"
            >
                <div className="px-4 py-6 space-y-4 flex flex-col">
                    <div className="relative mb-4">
                        <Search size={16} className="absolute left-3 top-3 text-muted" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50"
                        />
                    </div>

                    {currentNavItems.map((item) => (
                        <div key={item.name}>
                            <Link
                                href={item.href}
                                onClick={() => !item.dropdown && setIsOpen(false)}
                                className={cn(
                                    "text-lg font-medium transition-colors hover:text-primary flex items-center justify-between",
                                    pathname === item.href ? "text-primary" : "text-muted"
                                )}
                            >
                                {item.name}
                                {item.dropdown && <ChevronDown size={16} />}
                            </Link>
                            {item.dropdown && (
                                <div className="pl-4 mt-2 space-y-2 border-l border-white/10 ml-1">
                                    {item.dropdown.map(sub => (
                                        <Link
                                            key={sub.name}
                                            href={sub.href}
                                            onClick={() => setIsOpen(false)}
                                            className="block text-sm text-muted hover:text-foreground py-1"
                                        >
                                            {sub.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="pt-4 border-t border-white/10">
                        {user ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                        <User size={20} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="font-medium truncate">{name}</div>
                                        <div className="text-xs text-muted truncate">{email}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-foreground">
                                        <Layout size={16} />
                                        Dashboard
                                    </Link>
                                    <Link href="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-foreground">
                                        <User size={16} />
                                        Profile
                                    </Link>
                                    <Link href="/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-foreground">
                                        <Settings size={16} />
                                        Settings
                                    </Link>
                                    <Link href="/billing" onClick={() => setIsOpen(false)} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-foreground">
                                        <CreditCard size={16} />
                                        Billing
                                    </Link>
                                </div>
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors text-sm"
                                >
                                    <LogOut size={16} />
                                    Log Out
                                </button>
                            </div>
                        ) : (
                            <Link href="/login" onClick={() => setIsOpen(false)} className="w-full block">
                                <NeonButton className="w-full">Log In</NeonButton>
                            </Link>
                        )}
                    </div>

                    {user && (
                        <Link href="/notebook" onClick={() => setIsOpen(false)}>
                            <NeonButton className="w-full mt-2" variant="secondary">Launch App</NeonButton>
                        </Link>
                    )}
                </div>
            </motion.div>
        </nav>
    );
}
