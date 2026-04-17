'use client';

import { useUIStore } from '@/store/useUIStore';
import { useUserStore } from '@/store/useUserStore';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from "@/components/ui/Navbar";
import AppSidebar from "@/components/ui/AppSidebar";
import Footer from "@/components/ui/Footer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const { isSidebarOpen } = useUIStore();
    const { user } = useUserStore();
    const [isMobile, setIsMobile] = useState(false);
    const pathname = usePathname();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const isImmersiveSession = pathname?.startsWith('/interactive-ai/session/');
    const isNotebookPage = pathname?.startsWith('/notebook/');

    // Default to closed state (server-side match) until mounted
    const shouldPush = !isImmersiveSession && mounted && user && isSidebarOpen && !isMobile && !isNotebookPage && !pathname?.startsWith('/sessions/live');
    const sidebarWidth = "16rem";

    return (
        <div className="flex min-h-screen">
            {/* Sidebar - only show if not immersive */}
            {!isImmersiveSession && <AppSidebar />}

            <motion.div
                initial={false}
                animate={{
                    marginLeft: shouldPush ? sidebarWidth : "0rem",
                    width: shouldPush ? `calc(100% - ${sidebarWidth})` : "100%"
                }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                }}
                className="flex-1 flex flex-col min-h-screen relative transition-all duration-300 ease-in-out"
            >
                {!isImmersiveSession && <Navbar />}
                
                <main className="flex-1 flex flex-col">
                    {children}
                </main>

                {!isImmersiveSession && <Footer />}
            </motion.div>
        </div>
    );
}
