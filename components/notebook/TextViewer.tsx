'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, FileText } from 'lucide-react';

interface TextViewerProps {
    url: string;
}

const TextViewer = ({ url }: TextViewerProps) => {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!url) return;

        setLoading(true);
        setError(null);

        fetch(url)
            .then(async (res) => {
                if (!res.ok) throw new Error('Failed to load text content');
                const text = await res.text();
                setContent(text);
            })
            .catch((err) => {
                console.error('TextViewer error:', err);
                setError(err.message || 'Failed to load content');
            })
            .finally(() => setLoading(false));
    }, [url]);

    if (loading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center gap-4 text-muted-foreground p-8">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-sm font-medium animate-pulse">Reading transcript...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center gap-4 text-red-400 p-8 text-center">
                <FileText size={32} className="opacity-20" />
                <div>
                    <p className="font-bold">Error Loading Source</p>
                    <p className="text-xs opacity-70 mt-1">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-auto bg-[#0A0A0A] p-8 md:p-12 selection:bg-primary/30">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                        <FileText size={20} />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Video Transcript</span>
                </div>

                <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap font-sans text-sm md:text-base">
                        {content || 'No content found.'}
                    </p>
                </div>

                {/* Decorative Footer */}
                <div className="mt-12 pt-8 border-t border-white/5 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">End of Transcript</p>
                </div>
            </div>
        </div>
    );
};

export default TextViewer;
