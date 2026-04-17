'use client';

import React, { useEffect, useState } from 'react';
import InteractiveSessionContainer from '@/components/generators/InteractiveSessionContainer';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, ShieldX, BookOpen } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import { useRouter } from 'next/navigation';

export default function AISessionPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = React.use(paramsPromise);
    const router = useRouter();
    const [session, setSession] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ code: string; message: string } | null>(null);
    const [isImmersiveReady, setIsImmersiveReady] = useState(false);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch(`/api/orchestrator/session/${params.id}`);
                const data = await res.json();

                if (!res.ok) {
                    setError({ 
                        code: data.error || 'ERROR', 
                        message: data.message || 'Failed to load this session.' 
                    });
                } else {
                    setSession(data);
                }
            } catch (err) {
                setError({ code: 'FS_ERR', message: 'The link to this session has expired.' });
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
    }, [params.id]);

    const enterImmersiveMode = () => {
        // Trigger Fullscreen
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {
                console.warn('Fullscreen request denied by policy.');
            });
        }
        setIsImmersiveReady(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Loading Lesson Data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center space-y-8">
                <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                    {error.code === 'SESSION_EXPIRED' ? <ShieldX size={40} /> : <AlertTriangle size={40} />}
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-white">{error.code === 'SESSION_EXPIRED' ? 'Session Expired' : 'Link Expired'}</h1>
                    <p className="text-muted-foreground max-w-md mx-auto text-sm">{error.message}</p>
                </div>
                <NeonButton onClick={() => router.push('/interactive-ai')} className="px-8 h-12 uppercase tracking-widest text-xs font-black">
                    Go Back
                </NeonButton>
            </div>
        );
    }

    if (!isImmersiveReady) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center space-y-12">
                <div className="space-y-4 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary tracking-widest uppercase">
                        Lesson Ready
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-none">
                        Entering <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">Your Lesson</span>
                    </h1>
                    <p className="text-zinc-400 text-sm font-medium">To keep you focused, we will enter full-screen mode. Your lesson is ready in {session.config.language}.</p>
                </div>

                <div className="flex flex-col items-center gap-6">
                    <NeonButton onClick={enterImmersiveMode} className="w-64 h-16 uppercase tracking-[0.2em] font-black text-xs group relative">
                        Start Lesson
                    </NeonButton>
                    <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                        <BookOpen size={14} /> Finalizing Setup
                    </div>
                </div>

                <p className="text-[9px] text-white/10 font-bold uppercase tracking-widest">Study Assistant — Version 2.0.4</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black overflow-hidden select-none">
            <InteractiveSessionContainer session={session} />
        </main>
    );
}
