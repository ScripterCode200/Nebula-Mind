'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText } from 'lucide-react';
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
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
        }

        return fullText.trim();
    } catch (error) {
        console.error('Client-side PDF extraction failed:', error);
        return '';
    }
};

interface CreateNotebookModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateNotebookModal = ({ isOpen, onClose }: CreateNotebookModalProps) => {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [pdfUrl, setPdfUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [loadingStep, setLoadingStep] = useState<string>('');

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
        if (!title || (!file && !pdfUrl)) return;

        setIsUploading(true);
        setLoadingStep('Reading PDF...');

        const formData = new FormData();
        formData.append('title', title);

        // Extract text on client side (PDF only)
        let extractedText = '';
        if (file && file.type === 'application/pdf') {
            formData.append('file', file);
            extractedText = await extractPdfText(file);
        } else if (file) {
            // DOCX or other
            formData.append('file', file);
        } else if (pdfUrl) {
            formData.append('pdfUrl', pdfUrl);
            if (pdfUrl.toLowerCase().endsWith('.pdf')) {
                extractedText = await extractPdfText(pdfUrl);
            }
        }

        if (extractedText) {
            formData.append('pdfContent', extractedText);
            console.log('Client-side extraction successful, length:', extractedText.length);
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
                                <div className="flex justify-end gap-3 mt-8">
                                    <NeonButton type="button" variant="ghost" onClick={onClose} disabled={isUploading}>
                                        Cancel
                                    </NeonButton>
                                    <NeonButton type="submit" isLoading={isUploading} disabled={!title || (!file && !pdfUrl) || isUploading}>
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
