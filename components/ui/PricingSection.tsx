'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import NeonButton from './NeonButton';

const plans = [
    {
        name: "Starter",
        price: { monthly: "0", yearly: "0" },
        description: "Perfect for trying out Nebula.",
        features: [
            "5 AI Notebooks",
            "Basic Knowledge Graph",
            "10 Mock Tests / month",
            "Community Support"
        ],
        gradient: "from-blue-500/10 to-cyan-500/10",
        border: "border-white/10"
    },
    {
        name: "Pro",
        price: { monthly: "19", yearly: "15" },
        description: "For serious students & power users.",
        features: [
            "Unlimited AI Notebooks",
            "Advanced Knowledge Graph",
            "Unlimited Mock Tests",
            "Priority AI Tutor Access",
            "Export to PDF/Markdown"
        ],
        popular: true,
        gradient: "from-primary/20 to-secondary/20",
        border: "border-primary/50"
    },
    {
        name: "Team",
        price: { monthly: "49", yearly: "39" },
        description: "Collaborate with your study group.",
        features: [
            "Everything in Pro",
            "Shared Workspaces",
            "Team Analytics",
            "Admin Controls",
            "24/7 Priority Support"
        ],
        gradient: "from-purple-500/10 to-pink-500/10",
        border: "border-white/10"
    }
];

export default function PricingSection() {
    const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

    return (
        <section className="py-24 relative">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-4">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-lg text-muted mb-8">
                        Choose the plan that fits your learning journey.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={cn("text-sm font-medium transition-colors", billing === 'monthly' ? "text-white" : "text-muted")}>Monthly</span>
                        <button
                            onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
                            className="w-14 h-8 rounded-full bg-white/10 border border-white/10 relative px-1 transition-colors hover:bg-white/20"
                        >
                            <motion.div
                                animate={{ x: billing === 'monthly' ? 0 : 24 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className="w-6 h-6 rounded-full bg-primary shadow-lg"
                            />
                        </button>
                        <span className={cn("text-sm font-medium transition-colors", billing === 'yearly' ? "text-white" : "text-muted")}>
                            Yearly <span className="text-xs text-green-400 font-bold ml-1">-20%</span>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={cn(
                                "relative p-8 rounded-3xl border bg-black/40 backdrop-blur-sm flex flex-col",
                                plan.border
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-black text-xs font-bold flex items-center gap-1 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                                    <Sparkles size={12} />
                                    MOST POPULAR
                                </div>
                            )}

                            <div className={cn("absolute inset-0 bg-gradient-to-b opacity-50 rounded-3xl pointer-events-none", plan.gradient)} />

                            <div className="relative z-10 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-sm text-muted mb-6">{plan.description}</p>

                                <div className="flex items-baseline gap-1 mb-8">
                                    <span className="text-4xl font-bold text-white">${plan.price[billing]}</span>
                                    <span className="text-muted">/mo</span>
                                </div>

                                <ul className="space-y-4 mb-8 flex-1">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-3 text-sm text-gray-300">
                                            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                                <Check size={12} className="text-primary" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <NeonButton
                                    className="w-full justify-center"
                                    variant={plan.popular ? 'primary' : 'secondary'}
                                >
                                    Get Started
                                </NeonButton>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
