'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

export default function MaintenancePage() {
    return (
        <main className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg relative z-10 text-center"
            >
                <GlassCard className="p-12 border-yellow-500/20">
                    <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
                        <AlertTriangle size={40} className="text-yellow-500" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">Under Maintenance</h1>
                    <p className="text-muted-foreground text-lg mb-8">
                        We are currently performing scheduled maintenance to improve your experience.
                        Please check back soon.
                    </p>
                    <div className="inline-flex items-center gap-2 text-yellow-500/80 bg-yellow-500/10 px-4 py-2 rounded-full text-sm font-medium">
                        <Clock size={16} /> Estimated downtime: 1 hour
                    </div>
                </GlassCard>
            </motion.div>
        </main>
    );
}
