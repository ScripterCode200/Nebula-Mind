'use client';

import { useScroll, useTransform, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { Upload, Brain, MessageSquare, GraduationCap } from "lucide-react";

interface TimelineEntry {
    title: string;
    content: React.ReactNode;
    icon: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
    const ref = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setHeight(rect.height);
        }
    }, [ref]);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 10%", "end 50%"],
    });

    const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
    const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

    return (
        <div
            className="w-full bg-transparent font-sans md:px-10"
            ref={containerRef}
        >
            <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
                {data.map((item, index) => (
                    <div
                        key={index}
                        className="flex justify-start pt-10 md:pt-40 md:gap-10"
                    >
                        <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
                            <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-black flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                                <div className="h-4 w-4 rounded-full bg-primary border border-primary/50 p-2" />
                            </div>
                            <h3 className="hidden md:block text-xl md:pl-20 md:text-5xl font-bold text-neutral-500 dark:text-neutral-500 ">
                                {item.title}
                            </h3>
                        </div>

                        <div className="relative pl-20 pr-4 md:pl-4 w-full">
                            <h3 className="md:hidden block text-2xl mb-4 text-left font-bold text-neutral-500 dark:text-neutral-500">
                                {item.title}
                            </h3>
                            <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-primary/30 transition-colors duration-500">
                                <div className="mb-4 text-primary">{item.icon}</div>
                                {item.content}
                            </div>
                        </div>
                    </div>
                ))}
                <div
                    style={{
                        height: height + "px",
                    }}
                    className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-200 dark:via-neutral-700 to-transparent to-[99%]  [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] "
                >
                    <motion.div
                        style={{
                            height: heightTransform,
                            opacity: opacityTransform,
                        }}
                        className="absolute inset-x-0 top-0  w-[2px] bg-gradient-to-t from-purple-500 via-blue-500 to-transparent from-[0%] via-[10%] rounded-full"
                    />
                </div>
            </div>
        </div>
    );
};

export default function HowItWorks() {
    const data = [
        {
            title: "Upload",
            icon: <Upload size={32} />,
            content: (
                <div>
                    <p className="text-neutral-200 text-lg mb-4">
                        Drag and drop your PDF documents directly into the Nebula Mind interface.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-20 bg-white/5 rounded-lg border border-white/5 animate-pulse" />
                        <div className="h-20 bg-white/5 rounded-lg border border-white/5 animate-pulse delay-75" />
                    </div>
                </div>
            ),
        },
        {
            title: "Analyze",
            icon: <Brain size={32} />,
            content: (
                <div>
                    <p className="text-neutral-200 text-lg mb-4">
                        Our advanced AI models (Gemini/OpenAI) instantly process and understand the context of your materials.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        {['Semantic Analysis', 'Key Concept Extraction', 'Pattern Recognition'].map(tag => (
                            <span key={tag} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs border border-primary/20">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            ),
        },
        {
            title: "Master",
            icon: <GraduationCap size={32} />,
            content: (
                <div>
                    <p className="text-neutral-200 text-lg mb-4">
                        Generate flashcards, take mock tests, and chat with your documents to achieve mastery.
                    </p>
                </div>
            ),
        },
    ];

    return (
        <section className="w-full py-20">
            <div className="max-w-7xl mx-auto px-4 md:px-8 mb-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-center">How It Works</h2>
                <p className="text-muted text-lg max-w-2xl mx-auto text-center">
                    From static document to interactive knowledge base in three simple steps.
                </p>
            </div>
            <Timeline data={data} />
        </section>
    );
}
