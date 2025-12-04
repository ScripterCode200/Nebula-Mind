'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Brain, Github, Twitter, Linkedin,
    ArrowRight, Heart, Globe,
    MessageCircle, Code, Zap, Layers
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useUserStore } from '@/store/useUserStore';

const footerLinks = {
    product: [
        { name: 'Features', href: '/#features' },
        { name: 'Notebooks', href: '/notebook' },
        { name: 'Knowledge Graph', href: '#' },
        { name: 'Mock Tests', href: '#' },
        { name: 'Pricing', href: '#' },
        { name: 'Changelog', href: '#' },
    ],
    resources: [
        { name: 'Documentation', href: '#' },
        { name: 'API Reference', href: '#' },
        { name: 'Community Hub', href: '#' },
        { name: 'Blog', href: '#' },
        { name: 'Help Center', href: '#' },
        { name: 'Partners', href: '#' },
    ],
    company: [
        { name: 'About Us', href: '#' },
        { name: 'Careers', href: '#' },
        { name: 'Brand Kit', href: '#' },
        { name: 'Contact', href: '#' },
        { name: 'Privacy Policy', href: '#' },
        { name: 'Terms of Service', href: '#' },
    ],
    useCases: [
        { name: 'For Students', href: '#' },
        { name: 'For Researchers', href: '#' },
        { name: 'For Developers', href: '#' },
        { name: 'For Teams', href: '#' },
    ]
};

const SocialLink = ({ href, icon: Icon }: { href: string, icon: any }) => (
    <Link
        href={href}
        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-all duration-300 group"
    >
        <Icon size={18} className="group-hover:scale-110 transition-transform" />
    </Link>
);

export default function Footer() {
    const pathname = usePathname();

    if (pathname?.startsWith('/notebook')) {
        return null;
    }

    const { user, setUser } = useUserStore();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubscribe = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                // Update local user state
                setUser({ ...user, isSubscribed: data.isSubscribed });
            } else {
                toast.error(data.error || 'Failed to update subscription');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <footer className="relative z-10 border-t border-white/5 bg-[#050505] pt-20 pb-10 overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">

                {/* Top Section: Newsletter & Brand */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-black font-bold shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
                                <Brain size={22} />
                            </div>
                            <span className="font-bold text-2xl tracking-tight text-white">Nebula Mind</span>
                        </Link>
                        <p className="text-muted-foreground text-base leading-relaxed max-w-md">
                            Your AI-powered second brain. Transform how you learn, study, and retain information with advanced neural processing and real-time knowledge synthesis.
                        </p>
                        <div className="flex items-center gap-4">
                            <SocialLink href="#" icon={Github} />
                            <SocialLink href="#" icon={Twitter} />
                            <SocialLink href="#" icon={Linkedin} />
                            <SocialLink href="#" icon={MessageCircle} />
                        </div>
                    </div>

                    <div className="lg:pl-12">
                        <div className="p-6 md:p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-2 text-white">Stay ahead of the curve</h3>
                                <p className="text-muted-foreground mb-6">Join 50,000+ learners getting the latest AI study tips and feature updates.</p>

                                {user ? (
                                    <button
                                        onClick={handleSubscribe}
                                        disabled={isLoading}
                                        className={`w-full font-bold px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${user.isSubscribed
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                                            : 'bg-primary text-black hover:bg-primary/90'
                                            }`}
                                    >
                                        {isLoading ? 'Processing...' : user.isSubscribed ? 'Subscribed' : 'Subscribe to Newsletter'}
                                        {!isLoading && !user.isSubscribed && <ArrowRight size={16} />}
                                        {!isLoading && user.isSubscribed && <Heart size={16} className="fill-current" />}
                                    </button>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="w-full bg-white/5 border border-white/10 text-white font-bold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                                    >
                                        Login to Subscribe
                                        <ArrowRight size={16} />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Links Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-20 border-t border-white/5 pt-16">
                    <div>
                        <h4 className="font-bold text-white mb-6 flex items-center gap-2">
                            <Zap size={16} className="text-primary" />
                            Product
                        </h4>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors block w-fit">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6 flex items-center gap-2">
                            <Layers size={16} className="text-secondary" />
                            Resources
                        </h4>
                        <ul className="space-y-3">
                            {footerLinks.resources.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors block w-fit">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6 flex items-center gap-2">
                            <Globe size={16} className="text-blue-400" />
                            Company
                        </h4>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors block w-fit">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6 flex items-center gap-2">
                            <Code size={16} className="text-green-400" />
                            Use Cases
                        </h4>
                        <ul className="space-y-3">
                            {footerLinks.useCases.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors block w-fit">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <span>© {new Date().getFullYear()} Nebula Mind Inc.</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="flex items-center gap-1">
                            Made with <Heart size={12} className="text-red-500 fill-red-500" /> in India.
                        </span>
                    </div>

                    <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            All Systems Operational
                        </div>
                        <div className="flex items-center gap-6">
                            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                            <Link href="#" className="hover:text-white transition-colors">Cookies</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
