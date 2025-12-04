'use client';

import { motion } from 'framer-motion';
import { Brain, Zap, Layout, MessageSquare, Sparkles, Share2, Shield, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
    {
        title: "AI Notebooks",
        description: "Transform your PDFs and notes into interactive study guides. Chat with your documents.",
        icon: Brain,
        className: "md:col-span-2",
        gradient: "from-blue-500/20 to-purple-500/20"
    },
    {
        title: "Knowledge Graph",
        description: "Visualize connections between concepts. Build a mental map of your entire curriculum.",
        icon: Share2,
        className: "md:col-span-1",
        gradient: "from-green-500/20 to-emerald-500/20"
    },
    {
        title: "Smart Grading",
        description: "Get instant, AI-powered feedback on your mock tests with detailed explanations.",
        icon: Zap,
        className: "md:col-span-1",
        gradient: "from-orange-500/20 to-red-500/20"
    },
    {
        title: "24/7 AI Tutor",
        description: "Stuck on a problem? Your personal AI tutor is always ready to explain complex topics.",
        icon: MessageSquare,
        className: "md:col-span-2",
        gradient: "from-pink-500/20 to-rose-500/20"
    }
];

export default function FeaturesSection() {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-primary mb-4"
                    >
                        <Sparkles size={14} />
                        <span>Power Features</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-4"
                    >
                        Everything you need to <br /> master your studies.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg text-muted max-w-2xl mx-auto"
                    >
                        Unleash the full potential of your learning with our suite of advanced AI tools designed for students and professionals.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={cn(
                                "group relative p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden hover:border-primary/50 transition-colors duration-500",
                                feature.className
                            )}
                        >
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                                feature.gradient
                            )} />

                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div className="mb-8">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/10 group-hover:border-white/20">
                                        <feature.icon size={24} className="text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                                    <p className="text-muted group-hover:text-white/80 transition-colors">
                                        {feature.description}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                    Learn more <span className="text-lg">→</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
