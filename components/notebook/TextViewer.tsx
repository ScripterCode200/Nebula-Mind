'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, FileText } from 'lucide-react';

interface TextViewerProps {
    url: string;
    notebookId?: string;
    activeSourceId?: string | null;
}

const TextViewer = ({ url, notebookId, activeSourceId }: TextViewerProps) => {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!url) return;

        setLoading(true);
        setError(null);
        setIsEditing(false);

        fetch(url)
            .then(async (res) => {
                if (!res.ok) throw new Error('Failed to load text content');
                const text = await res.text();
                setContent(text);
                setEditedContent(text);
            })
            .catch((err) => {
                console.error('TextViewer error:', err);
                setError(err.message || 'Failed to load content');
            })
            .finally(() => setLoading(false));
    }, [url]);

    const handleSave = async () => {
        if (!notebookId || !activeSourceId) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/notebooks/${notebookId}/sources`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceId: activeSourceId,
                    textContent: editedContent
                })
            });

            if (!res.ok) throw new Error('Failed to save changes');

            setContent(editedContent);
            setIsEditing(false);
            // ideally show toast
        } catch (e) {
            console.error(e);
            alert('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

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
        <div className="h-full w-full overflow-auto bg-[#0A0A0A] p-8 md:p-12 selection:bg-primary/30 relative">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                            <FileText size={20} />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Video Transcript</span>
                    </div>

                    {/* Edit Controls */}
                    {notebookId && activeSourceId && (
                        <div className="flex items-center gap-2">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditedContent(content);
                                        }}
                                        disabled={isSaving}
                                        className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                                    >
                                        {isSaving && <Loader2 size={12} className="animate-spin" />}
                                        Save Changes
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
                                    title="Edit Transcript (Private Copy)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="prose prose-invert max-w-none">
                    {isEditing ? (
                        <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full h-[60vh] bg-transparent resize-y outline-none font-sans text-sm md:text-base leading-relaxed text-gray-300 p-0 border-0 focus:ring-0"
                        />
                    ) : (
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap font-sans text-sm md:text-base">
                            {content || 'No content found.'}
                        </p>
                    )}
                </div>

                {/* Decorative Footer */}
                {!isEditing && (
                    <div className="mt-12 pt-8 border-t border-white/5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">End of Transcript</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextViewer;
