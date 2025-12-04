'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Code2, Cpu, Globe, Github, Linkedin, Instagram } from 'lucide-react';
import TiltCard from './TiltCard';

const developers = [
    {
        name: "Shivam Saini",
        role: "Full Stack Architect",
        icon: <Code2 size={40} />,
        color: "from-cyan-400 via-blue-500 to-purple-600",
        glow: "shadow-[0_0_30px_rgba(34,211,238,0.3)]",
        desc: "Architecting the neural backbone and seamless system integration.",
        socials: {
            github: "https://github.com/ScripterCode200",
            linkedin: "https://www.linkedin.com/in/shivam-saini-a6a041393/",
            instagram: "https://www.instagram.com/shivam_____9211/"
        }
    },
    {
        name: "Archit Jain",
        role: "AI Systems Engineer",
        icon: <Cpu size={40} />,
        color: "from-fuchsia-500 via-pink-500 to-rose-500",
        glow: "shadow-[0_0_30px_rgba(232,121,249,0.3)]",
        desc: "Optimizing the RAG pipeline and high-dimensional vector retrieval.",
        socials: {
            github: "https://github.com/ScripterCode200",
            linkedin: "https://www.linkedin.com/in/archeet-jain-596ab6379",
            instagram: "https://www.instagram.com/shivam_____9211/"
        }
    },
    {
        name: "Durvish Kumawat",
        role: "Frontend Visionary",
        icon: <Globe size={40} />,
        color: "from-emerald-400 via-green-500 to-teal-500",
        glow: "shadow-[0_0_30px_rgba(52,211,153,0.3)]",
        desc: "Crafting fluid, holographic interfaces for the next generation of web.",
        socials: {
            github: "https://github.com/DurvishRAJ",
            linkedin: "https://www.linkedin.com/in/durvish-raj-kumawat-84962437b",
            instagram: "https://www.instagram.com/durvish.raj/"
        }
    }
];

const Developers = () => {
    return (
        <section className="relative py-20 md:py-40 px-4 overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[#030303]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12 md:mb-24"
                >
                    <h2 className="text-4xl md:text-7xl font-bold mb-6 tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                            The Developers
                        </span>
                    </h2>
                    <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent mb-6" />
                    <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-light tracking-wide">
                        The minds behind the intelligence. Building the future of learning, one line of code at a time.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 px-2 md:px-4">
                    {developers.map((dev, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.2 }}
                            className="relative"
                        >
                            {/* Floating Animation Wrapper */}
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: idx * 1.5 // Staggered floating
                                }}
                                className="h-full"
                            >
                                <TiltCard className="h-full group perspective-1000">
                                    <div className="relative h-full rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-1 overflow-hidden transition-all duration-500 group-hover:border-white/20 group-hover:shadow-2xl group-hover:shadow-primary/10">

                                        {/* Holographic Gradient Border Effect */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${dev.color} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} style={{ padding: '1px' }}>
                                            <div className="h-full w-full bg-black/90 rounded-[22px]" />
                                        </div>

                                        <div className="relative h-full p-6 md:p-8 flex flex-col items-center text-center z-10">

                                            {/* Glowing Avatar/Icon */}
                                            <div className="relative mb-6 md:mb-8">
                                                <div className={`absolute inset-0 bg-gradient-to-r ${dev.color} blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
                                                <div className={`relative p-5 md:p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 ${dev.glow} group-hover:scale-110 transition-transform duration-500`}>
                                                    <div className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                                        {dev.icon}
                                                    </div>
                                                </div>
                                            </div>

                                            <h3 className="text-2xl md:text-3xl font-bold mb-2 text-white tracking-wide group-hover:scale-105 transition-transform duration-300">
                                                {dev.name}
                                            </h3>

                                            <div className={`text-xs md:text-sm font-bold tracking-widest uppercase mb-4 md:mb-6 bg-gradient-to-r ${dev.color} bg-clip-text text-transparent`}>
                                                {dev.role}
                                            </div>

                                            <p className="text-gray-400 leading-relaxed mb-6 md:mb-8 font-light text-sm md:text-base">
                                                {dev.desc}
                                            </p>

                                            {/* Socials with Magnetic Feel */}
                                            <div className="mt-auto flex gap-6">
                                                <a href={dev.socials.github} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors hover:scale-125 duration-300">
                                                    <Github size={20} />
                                                </a>
                                                <a href={dev.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors hover:scale-125 duration-300">
                                                    <Linkedin size={20} />
                                                </a>
                                                <a href={dev.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors hover:scale-125 duration-300">
                                                    <Instagram size={20} />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </TiltCard>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Developers;
