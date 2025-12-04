'use client';

import { ShieldAlert, LogOut, Mail } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import GlassCard from '@/components/ui/GlassCard';
import { useUserStore } from '@/store/useUserStore';

export default function BlockedPage() {
    const { logout } = useUserStore();

    return (
        <main className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px]" />
            </div>

            <GlassCard className="max-w-md w-full p-8 text-center border-red-500/20">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert size={40} className="text-red-500" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-4">Account Suspended</h1>

                <p className="text-muted-foreground mb-8 leading-relaxed">
                    Your account has been suspended due to a violation of our terms of service.
                    If you believe this is a mistake, please contact our support team.
                </p>

                <div className="space-y-4">
                    <a
                        href="mailto:support@nebulamind.ai"
                        className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm font-medium"
                    >
                        <Mail size={16} />
                        Contact Support
                    </a>

                    <NeonButton
                        onClick={logout}
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/50"
                        variant="secondary"
                    >
                        <LogOut size={16} className="mr-2" />
                        Sign Out
                    </NeonButton>
                </div>
            </GlassCard>
        </main>
    );
}
