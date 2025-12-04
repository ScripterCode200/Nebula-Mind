'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    Brain, Menu, X, Search, Bell, ChevronDown,
    User, Sparkles, BookOpen,
    Layout, Zap, MessageSquare,
    Settings, LogOut, CreditCard
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import NeonButton from './NeonButton';
import { useUserStore } from '@/store/useUserStore';

const navItems = [
    { name: 'Home', href: '/' },
    {
        name: 'Features',
        href: '#',
        dropdown: [
            { name: 'AI Notebooks', href: '/notebook', icon: BookOpen, desc: 'Smart note-taking' },
            { name: 'Knowledge Graph', href: '#', icon: Layout, desc: 'Visual learning' },
            { name: 'Mock Tests', href: '#', icon: Zap, desc: 'Exam prep' },
            { name: 'AI Chat', href: '#', icon: MessageSquare, desc: '24/7 Tutor' },
        ]
    },
    { name: 'Pricing', href: '#' },
    { name: 'Docs', href: '/docs' },
];

export default function Navbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [searchFocused, setSearchFocused] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const { name, email, logout, isAuthenticated, user } = useUserStore();

    useEffect(() => {
        useUserStore.getState().fetchUser();

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [pathname]);

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

    const isHome = pathname === '/';

    // Add Admin link if user is admin
    const currentNavItems = [...navItems];
    if (user?.role === 'admin') {
        currentNavItems.push({ name: 'Admin', href: '/admin' });
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
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary text-black font-bold text-xl shadow-[0_0_20px_rgba(0,240,255,0.3)] group-hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-shadow duration-300">
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
                        onBlur={() => setSearchFocused(false)}
                    />
                    <div className="absolute right-2 flex items-center gap-1 pointer-events-none">
                        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <div
                        className="relative hidden sm:block"
                        onMouseEnter={() => setActiveDropdown('notifications')}
                        onMouseLeave={() => setActiveDropdown(null)}
                    >
                        <button className="relative p-2 text-muted hover:text-foreground transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-black" />
                        </button>

                        <AnimatePresence>
                            {activeDropdown === 'notifications' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-full right-0 pt-4 w-80"
                                >
                                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden">
                                        <div className="p-3 border-b border-white/5 flex justify-between items-center">
                                            <span className="text-sm font-medium text-foreground">Notifications</span>
                                            <span className="text-xs text-primary cursor-pointer hover:underline">Mark all read</span>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto">
                                            {[
                                                { title: 'New Feature', desc: 'AI Chat is now available in beta.', time: '2m ago', icon: Sparkles, color: 'text-yellow-400' },
                                                { title: 'Notebook Ready', desc: 'Your "Quantum Physics" notes are ready.', time: '1h ago', icon: BookOpen, color: 'text-blue-400' },
                                                { title: 'System Update', desc: 'Maintenance scheduled for tonight.', time: '5h ago', icon: Zap, color: 'text-purple-400' }
                                            ].map((notif, i) => (
                                                <div key={i} className="flex gap-3 p-3 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0">
                                                    <div className={`mt-1 p-1.5 rounded-full bg-white/5 ${notif.color}`}>
                                                        <notif.icon size={14} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-foreground">{notif.title}</div>
                                                        <div className="text-xs text-muted leading-relaxed">{notif.desc}</div>
                                                        <div className="text-[10px] text-muted/60 mt-1">{notif.time}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-2 border-t border-white/5 text-center">
                                            <Link href="/notifications" className="text-xs text-muted hover:text-foreground transition-colors block w-full py-1">
                                                View all notifications
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />

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
                                    <button className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-secondary p-[1px] group relative">
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

                                                    <div className="h-[1px] bg-white/5 my-2" />

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
                            <NeonButton size="sm" className="px-5" variant="secondary">
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

                    <div className="pt-4 border-t border-white/10 flex items-center gap-4">
                        {user ? (
                            <>
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <User size={20} />
                                </div>
                                <div>
                                    <div className="font-medium">{name}</div>
                                    <div className="text-xs text-muted">{email}</div>
                                </div>
                            </>
                        ) : (
                            <Link href="/login" onClick={() => setIsOpen(false)} className="w-full">
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
