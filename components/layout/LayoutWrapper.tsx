'use client';

import { useUIStore } from '@/store/useUIStore';
import { useUserStore } from '@/store/useUserStore';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const { isSidebarOpen } = useUIStore();
    const { user } = useUserStore();
    const [isMobile, setIsMobile] = useState(false);
    const pathname = usePathname();

    // Check for special pages where we might NOT want this behavior (like maintenance)
    // But this component is used inside layout where that check is already done mostly.

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // If no user, or mobile, or sidebar text-closed, normal layout (0 margin).
    // If user AND desktop AND sidebar open, add margin.

    // We use padding-left instead of margin to keep the background continuous if needed, 
    // or margin-left to push the layout. Usually margin-left is better for flow.
    // Sidebar width is 18rem (288px) or 20rem. Let's match AppSidebar (18rem).

    const isNotebookPage = pathname?.startsWith('/notebook/');
    const shouldPush = user && isSidebarOpen && !isMobile && !isNotebookPage;
    const sidebarWidth = "16rem";

    return (
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
            {children}
        </motion.div>
    );
}
