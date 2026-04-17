'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, Youtube } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import { cn } from '@/lib/utils';
const extractPdfText = async (fileOrUrl: File | string): Promise<string> => {
    try {
        // Dynamically import pdfjs to avoid SSR issues (DOMMatrix not defined)
        const { pdfjs } = await import('react-pdf');

        // Configure worker only on client
        if (typeof window !== 'undefined') {
            pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        }

        let loadingTask;
        if (typeof fileOrUrl === 'string') {
            loadingTask = pdfjs.getDocument(fileOrUrl);
        } else {
            const arrayBuffer = await fileOrUrl.arrayBuffer();
            loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        }

        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            
            // Smarter PDF Extraction: Preserve line breaks based on Y-coordinates
            let lastY = -1;
            let pageText = '';
            for (const item of content.items) {
                if ('str' in item && 'transform' in item) {
                    if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
                        pageText += '\n'; 
                    } else if (lastY !== -1) {
                        pageText += ' '; 
                    }
                    pageText += item.str;
                    lastY = item.transform[5];
                }
            }
            fullText += pageText + '\n\n--- Page Break ---\n\n';
        }

        return fullText.trim();
    } catch (error) {
        console.error('Client-side PDF extraction failed:', error);
        return '';
    }
};

const uploadFileToR2 = async (file: File) => {
    try {
        // 1. Get Presigned URL
        const presignRes = await fetch('/api/upload/presign', {
            method: 'POST',
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type
            }),
        });

        if (!presignRes.ok) throw new Error('Failed to get upload URL');
        const { url, key } = await presignRes.json();

        // 2. Upload File directly to R2
        const uploadRes = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });

        if (!uploadRes.ok) throw new Error('Failed to upload file to storage');

        return key;
    } catch (error) {
        console.error('Direct upload failed:', error);
        throw error;
    }
};

interface CreateNotebookModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateNotebookModal = ({ isOpen, onClose }: CreateNotebookModalProps) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'upload' | 'youtube'>('upload');
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [pdfUrl, setPdfUrl] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [loadingStep, setLoadingStep] = useState<string>('');
    const [transcribeProgress, setTranscribeProgress] = useState(0);
    const [videoInfo, setVideoInfo] = useState<{ title: string; duration: number } | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setPdfUrl(''); // Clear URL if file is dropped
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        maxFiles: 1,
        multiple: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title) return;
        if (activeTab === 'upload' && !file && !pdfUrl) return;
        if (activeTab === 'youtube' && !youtubeUrl) return;

        setIsUploading(true);
        setLoadingStep(activeTab === 'youtube' ? 'Transcribing Video...' : 'Reading PDF...');

        const formData = new FormData();
        formData.append('title', title);

        try {
            if (activeTab === 'youtube') {
                // 1. Get Video Metadata
                setLoadingStep('Fetching Video Info...');
                const infoRes = await fetch('/api/transcribe/info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: youtubeUrl })
                });
                const infoData = await infoRes.json();
                if (!infoRes.ok) throw new Error(infoData.error || 'Failed to get video info');

                setVideoInfo({ title: infoData.title, duration: infoData.durationSeconds });

                // 2. Start Simulation & Transcription
                setLoadingStep('Transcribing Video...');

                // Estimated time: ~20% of video duration for processing + download (Max 2 mins for standard)
                const estimatedTimeMs = Math.min(60000, (infoData.durationSeconds * 1000) / 10);
                const startTime = Date.now();

                const progressInterval = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(95, Math.floor((elapsed / estimatedTimeMs) * 100));
                    setTranscribeProgress(progress);
                }, 500);

                const res = await fetch('/api/transcribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: youtubeUrl })
                });

                clearInterval(progressInterval);
                setTranscribeProgress(100);

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Transcription failed');

                if (data.r2Key) {
                    formData.append('contentKey', data.r2Key);
                } else if (data.text) {
                    // Fallback: Create file from text
                    const textFile = new File([data.text], `${title.replace(/[^a-z0-9]/gi, '_')}.txt`, { type: 'text/plain' });
                    const contentKey = await uploadFileToR2(textFile);
                    formData.append('contentKey', contentKey);
                }

                // Optional: Save video ID/URL as metadata?
                formData.append('pdfUrl', youtubeUrl);
                formData.append('type', 'youtube');

            } else {
                // File/PDF Logic
                let extractedText = '';
                let fileKey = '';

                if (file) {
                    fileKey = await uploadFileToR2(file);
                    formData.append('fileKey', fileKey);

                    if (file.type === 'application/pdf') {
                        extractedText = await extractPdfText(file);
                    }
                } else if (pdfUrl) {
                    formData.append('pdfUrl', pdfUrl);
                    if (pdfUrl.toLowerCase().endsWith('.pdf')) {
                        extractedText = await extractPdfText(pdfUrl);
                    }
                }

                if (extractedText) {
                    setLoadingStep('Uploading extracted text...');
                    const textFile = new File([extractedText], `${title.replace(/[^a-z0-9]/gi, '_')}_content.txt`, { type: 'text/plain' });
                    const contentKey = await uploadFileToR2(textFile);
                    formData.append('contentKey', contentKey);
                } else if (!fileKey && !pdfUrl) {
                    // Should not start here
                }
            }
        } catch (err: any) {
            console.error(err);
            setLoadingStep(`Error: ${err.message || 'Operation failed'}`);
            setTimeout(() => setIsUploading(false), 2000);
            return;
        }

        try {
            setLoadingStep('Creating Notebook...');
            const res = await fetch('/api/notebooks', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();

                setLoadingStep('Opening Notebook...');
                router.push(`/notebook/${data.notebookId}`);
            } else {
                const errorData = await res.json();
                console.error('Failed to create notebook:', errorData);
                setLoadingStep(`Error: ${errorData.error || 'Failed to create notebook'}`);
                setTimeout(() => setIsUploading(false), 2000);
            }
        } catch (error) {
            console.error(error);
            setLoadingStep('Error occurred');
            setTimeout(() => setIsUploading(false), 2000);
        }
        // Note: We don't set isUploading(false) on success to prevent button flicker before redirect
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={isUploading ? undefined : onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
                    >
                        <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
                            {/* Background Glow */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary to-secondary" />

                            {!isUploading && (
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            )}

                            <h2 className="text-2xl font-bold mb-6 text-glow">New Notebook</h2>

                            {isUploading && activeTab === 'youtube' && (
                                <div className="mb-8 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Target Video</p>
                                            <p className="text-sm font-medium text-primary truncate">{videoInfo?.title || 'Unknown Video'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-glow">{transcribeProgress}%</p>
                                        </div>
                                    </div>

                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                                        <motion.div
                                            className="h-full bg-linear-to-r from-primary to-secondary"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${transcribeProgress}%` }}
                                            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                                        />
                                    </div>

                                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
                                        <span>{loadingStep}</span>
                                        <span>Est. {videoInfo ? Math.round(videoInfo.duration / 10) : '...'}s left</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 mb-6 border-b border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('upload')}
                                    className={cn(
                                        "pb-2 text-sm font-medium transition-colors relative",
                                        activeTab === 'upload' ? "text-primary" : "text-muted hover:text-foreground"
                                    )}
                                >
                                    Upload File
                                    {activeTab === 'upload' && (
                                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('youtube')}
                                    className={cn(
                                        "pb-2 text-sm font-medium transition-colors relative",
                                        activeTab === 'youtube' ? "text-primary" : "text-muted hover:text-foreground"
                                    )}
                                >
                                    YouTube Video
                                    {activeTab === 'youtube' && (
                                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
                                    )}
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-muted mb-2">Notebook Name</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., Quantum Physics 101"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted/50"
                                        autoFocus
                                        disabled={isUploading}
                                    />
                                </div>

                                {activeTab === 'upload' ? (
                                    <>
                                        <label className="block text-sm font-medium text-muted mb-2">Source Material (PDF or Word)</label>
                                        <div className="space-y-4">
                                            <div
                                                {...getRootProps()}
                                                className={cn(
                                                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300",
                                                    isDragActive ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20 hover:bg-white/5",
                                                    file ? "border-success/50 bg-success/5" : "",
                                                    isUploading ? "opacity-50 cursor-not-allowed" : ""
                                                )}
                                            >
                                                <input {...getInputProps({ disabled: isUploading })} />
                                                {file ? (
                                                    <div className="flex items-center justify-center gap-3 text-success">
                                                        <FileText size={24} />
                                                        <span className="font-medium truncate">{file.name}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-muted">
                                                        <Upload size={24} />
                                                        <p>Drop PDF or Word file here or click to upload</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="relative">
                                                <div className="absolute inset-0 flex items-center">
                                                    <span className="w-full border-t border-white/10" />
                                                </div>
                                                <div className="relative flex justify-center text-xs uppercase">
                                                    <span className="bg-[#0a0a0a] px-2 text-muted">Or enter URL</span>
                                                </div>
                                            </div>

                                            <input
                                                type="url"
                                                value={pdfUrl}
                                                onChange={(e) => setPdfUrl(e.target.value)}
                                                placeholder="https://example.com/document.pdf"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted/50"
                                                disabled={!!file || isUploading}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <label className="block text-sm font-medium text-muted mb-2">YouTube Video URL</label>
                                        <div className="space-y-4">
                                            <input
                                                type="url"
                                                value={youtubeUrl}
                                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                                placeholder="https://www.youtube.com/watch?v=..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted/50"
                                                disabled={isUploading}
                                            />
                                            <p className="text-xs text-muted">
                                                Supports videos with captions. AI Audio transcription (up to 5h) coming soon.
                                            </p>
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-end gap-3 mt-8">
                                    <NeonButton type="button" variant="ghost" onClick={onClose} disabled={isUploading}>
                                        Cancel
                                    </NeonButton>
                                    <NeonButton type="submit" isLoading={isUploading} disabled={!title || (activeTab === 'upload' ? !file && !pdfUrl : !youtubeUrl) || isUploading}>
                                        {isUploading ? loadingStep : 'Create Notebook'}
                                    </NeonButton>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CreateNotebookModal;
