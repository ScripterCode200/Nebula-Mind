"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function NotFound() {
    const [stars, setStars] = useState<Array<{ x: string; y: string; scale: number; duration: number; delay: number; size: string }>>([]);

    useEffect(() => {
        const newStars = [...Array(20)].map(() => ({
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            scale: Math.random() * 0.5 + 0.5,
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 2,
            size: Math.random() * 3 + 1 + "px",
        }));
        setStars(newStars);
    }, []);
    return (
        <div className="min-h-screen w-full bg-[#0B0F19] flex flex-col items-center justify-center relative overflow-hidden font-sans text-white selection:bg-cyan-500/30">

            {/* Background Stars Effect */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                {stars.map((star, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-white rounded-full opacity-20"
                        initial={{
                            x: star.x,
                            y: star.y,
                            scale: star.scale,
                        }}
                        animate={{
                            opacity: [0.2, 0.8, 0.2],
                            scale: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: star.duration,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: star.delay,
                        }}
                        style={{
                            width: star.size,
                            height: star.size,
                        }}
                    />
                ))}
            </div>

            {/* Main Content Container */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto px-4">

                {/* Animated Image Container */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative w-full max-w-[500px] aspect-square mb-8"
                >
                    {/* Floating Animation for the whole scene */}
                    <motion.div
                        animate={{ y: [-10, 10, -10] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="w-full h-full relative flex items-center justify-center"
                    >
                        {/* Glow effect behind the image */}
                        <div className="absolute inset-0 bg-cyan-500/10 blur-[100px] rounded-full transform scale-75" />

                        <Image
                            src="/astronaut_404.png"
                            alt="Lost Astronaut"
                            width={600}
                            height={600}
                            className="object-contain relative z-10 drop-shadow-2xl"
                            priority
                            unoptimized
                        />
                    </motion.div>
                </motion.div>

                {/* 404 Text */}
                <motion.h1
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-[120px] md:text-[180px] font-bold leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 to-cyan-600/20 select-none"
                >
                    404
                </motion.h1>

                {/* Message */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="space-y-4"
                >
                    <h2 className="text-2xl md:text-3xl font-medium text-cyan-50">
                        Oops! nobody on this planet
                    </h2>
                    <p className="text-cyan-200/60 text-lg max-w-md mx-auto">
                        You landed on a strange planet, please get back to your capital ship.
                    </p>
                </motion.div>

                {/* Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="mt-10"
                >
                    <Link
                        href="/"
                        className="group relative inline-flex items-center justify-center px-8 py-3 font-medium text-black transition-all duration-300 bg-cyan-400 rounded-lg hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#0B0F19]"
                    >
                        <span className="relative">Go Back Home</span>
                        <div className="absolute inset-0 -z-10 bg-cyan-400/50 blur-lg group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
                    </Link>
                </motion.div>

            </div>
        </div>
    );
}
