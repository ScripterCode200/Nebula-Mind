'use client';

import dynamic from 'next/dynamic';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, Brain, Zap, BookOpen } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import TiltCard from '@/components/ui/TiltCard';
import { TypewriterEffect } from '@/components/ui/TypewriterEffect';
import Footer from '@/components/ui/Footer';

// Lazy Load Heavy Components
const DashboardPreview = dynamic(() => import('@/components/ui/DashboardPreview'), {
  loading: () => <div className="w-full h-[600px] bg-white/5 animate-pulse rounded-xl border border-white/10" />,
  ssr: false // Disable SSR for dashboard preview as it's heavy and interactive
});

const HowItWorks = dynamic(() => import('@/components/ui/Timeline'), {
  loading: () => <div className="h-96 w-full" />
});

const Developers = dynamic(() => import('@/components/ui/Developers'), {
  loading: () => <div className="h-96 w-full" />
});

const FeaturesSection = dynamic(() => import('@/components/ui/FeaturesSection'), {
  loading: () => <div className="h-96 w-full" />
});

const PricingSection = dynamic(() => import('@/components/ui/PricingSection'), {
  loading: () => <div className="h-96 w-full" />
});



// Neon Button Component
const NeonButton = ({ children, className = "", variant = "primary", size = "md", ...props }: any) => {
  const baseStyles = "relative inline-flex items-center justify-center font-bold transition-all duration-300 rounded-full overflow-hidden group";

  const variants = {
    primary: "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105 hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] border border-cyan-300/20",
    secondary: "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-105 hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] border border-purple-400/20",
    ghost: "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <button className={`${baseStyles} ${variants[variant as keyof typeof variants]} ${sizes[size as keyof typeof sizes]} ${className}`} {...props}>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {variant !== 'ghost' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
      )}
    </button>
  );
};

// Glass Card Component
const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg p-8 transition-all hover:border-white/20 hover:bg-white/10 ${className}`}>
    {children}
  </div>
);

// Orbiting Line Component (formerly OrbitingTag)
const OrbitLine = ({ radius, duration, delay, reverse = false }: any) => (
  <motion.div
    animate={{ rotate: reverse ? -360 : 360 }}
    transition={{ duration, repeat: Infinity, ease: "linear", delay }}
    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full border border-white/5"
    style={{ width: radius * 2, height: radius * 2 }}
  />
);

export default function Home() {
  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, { damping: 50, stiffness: 400 });

  const scale = useTransform(smoothScrollY, [0, 800], [1, 0.9]);
  const opacity = useTransform(smoothScrollY, [0, 800], [1, 0.6]);
  const y = useTransform(smoothScrollY, [0, 800], [0, -50]);

  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-primary/30">

      {/* Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />

        {/* Floating Orbs */}
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, -100, 0], y: [0, 50, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]"
        />
      </div>

      {/* Hero Section with Stacking Effect */}
      <div className="relative flex flex-col pt-32 md:pt-52 pb-20 z-0">
        <motion.div
          style={{ scale, opacity, y }}
          className="w-full h-full flex flex-col will-change-transform"
        >
          {/* Hero Text Area - Fixed at top */}
          <div className="shrink-0 z-10 flex flex-col items-center justify-center px-4 pb-20 md:pb-40 pt-4 bg-gradient-to-b from-background/0 via-background/50 to-transparent backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center max-w-5xl mx-auto relative"
            >
              {/* Text Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] bg-primary/20 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />

              <div className="relative z-10">
                {/* Orbiting Tags System */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none z-0 opacity-60 hidden md:block">
                  {/* Inner Orbit (30s) */}
                  <OrbitLine radius={280} duration={30} delay={0} />
                  <OrbitLine radius={280} duration={30} delay={15} reverse={true} />

                  {/* Middle Orbit (40s) */}
                  <OrbitLine radius={340} duration={40} delay={20} />

                  {/* Outer Orbit (50s) */}
                  <OrbitLine radius={400} duration={50} delay={5} />
                  <OrbitLine radius={400} duration={50} delay={30} reverse={true} />
                </div>
                <div className="relative z-20 flex flex-col items-center">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary text-xs md:text-sm font-medium mb-8 backdrop-blur-md shadow-lg shadow-primary/10 animate-float">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                    </span>
                    Nebula AI 2.0 is Live
                  </div>

                  <h1 className="text-4xl md:text-7xl font-bold tracking-tighter mb-8 leading-[1.1]">
                    Your Superpower for<br />
                    <TypewriterEffect
                      words={[
                        { text: "Limitless Learning.", className: "text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_auto] animate-gradient" },
                        { text: "Instant Clarity.", className: "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-400 bg-[length:200%_auto] animate-gradient" },
                        { text: "Deep Insights.", className: "text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 bg-[length:200%_auto] animate-gradient" },
                        { text: "Mastering Everything.", className: "text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 bg-[length:200%_auto] animate-gradient" },
                      ]}
                      className="text-4xl md:text-7xl font-bold tracking-tighter"
                      cursorClassName="bg-primary h-10 md:h-20"
                    />
                  </h1>

                  <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed px-4">
                    Transform information into intelligence. Upload documents, generate quizzes, and master any topic with your personal AI companion.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 w-full px-4">
                    <Link href="/dashboard" className="w-full sm:w-auto">
                      <NeonButton size="lg" className="group w-full sm:min-w-[220px] text-lg h-14">
                        Launch App
                        <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                      </NeonButton>
                    </Link>
                    <Link href="https://github.com" target="_blank" className="w-full sm:w-auto">
                      <NeonButton variant="ghost" size="lg" className="w-full sm:min-w-[220px] text-lg h-14">
                        View Source
                      </NeonButton>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Dashboard Area - Scrollable */}
          {/* Developer Note: This container fills the remaining screen height. 
              It has overflow-hidden because the DashboardPreview component handles its own internal scrolling.
              The user perceives this as "scrolling the dashboard" while the header stays pinned. */}
          <div className="flex-1 relative z-20 min-h-0 w-full max-w-7xl mx-auto px-2 md:px-4 pb-4">
            <DashboardPreview className="h-full shadow-2xl" />

            {/* Scroll Hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 1 }}
              className="absolute bottom-8 right-8 z-20 pointer-events-none hidden md:flex items-center gap-2 text-primary/50 text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5"
            >
              <span>Scroll to explore</span>
              <div className="w-4 h-6 rounded-full border border-primary/50 flex justify-center pt-1">
                <div className="w-0.5 h-1.5 bg-primary/50 rounded-full animate-bounce" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <section className="relative z-10 py-20 md:py-32 px-4 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">System Capabilities</h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              Advanced neural networks working in harmony to accelerate your learning process.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 perspective-1000">
            {[
              {
                icon: <Brain size={40} />,
                title: "Neural Analysis",
                desc: "Upload any PDF and let our AI dissect, summarize, and explain complex concepts in seconds.",
                color: "text-primary",
                bg: "bg-primary/10",
                image: "/neural-analysis.png"
              },
              {
                icon: <Zap size={40} />,
                title: "Instant Recall",
                desc: "Generate smart flashcards automatically to reinforce memory pathways and retention.",
                color: "text-secondary",
                bg: "bg-secondary/10",
                image: "/instant-recall.png"
              },
              {
                icon: <BookOpen size={40} />,
                title: "Adaptive Testing",
                desc: "Challenge yourself with AI-generated mock tests that adapt to your knowledge gaps.",
                color: "text-green-500",
                bg: "bg-green-500/10",
                image: "/adaptive-testing.png"
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="h-full"
              >
                <TiltCard className="group">
                  <GlassCard className="h-full flex flex-col items-start gap-6 p-0 !bg-black/40 !backdrop-blur-md border-white/5 overflow-hidden">
                    <div className="relative w-full h-48 overflow-hidden">
                      <div className={`absolute inset-0 ${feature.bg} opacity-20 z-10`} />
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-50 group-hover:opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-20" />
                      <div className={`absolute bottom-4 left-4 p-3 rounded-xl ${feature.bg} ${feature.color} ring-1 ring-inset ring-white/10 z-30`}>
                        {feature.icon}
                      </div>
                    </div>
                    <div className="px-6 pb-8 pt-2">
                      <h3 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                        {feature.desc}
                      </p>
                    </div>
                  </GlassCard>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Developers Section */}
      <Developers />

      {/* Deep Dive Features */}
      <FeaturesSection />

      {/* Pricing Section */}
      <PricingSection />


    </main>
  );
}
