'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Trash2, Loader2, Check, FileUp, Sparkles, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import PurgeConfirmModal from '@/components/modals/PurgeConfirmModal';

interface PDFFile {
    _id: string;
    filename: string;
    fileSize: number;
    uploadedAt: string;
}

interface PDFUploadManagerProps {
    onUpdate?: () => void;
}

export default function PDFUploadManager({ onUpdate }: PDFUploadManagerProps) {
    const [pdfs, setPdfs] = useState<PDFFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
    const [pdfToPurge, setPdfToPurge] = useState<PDFFile | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchPDFs = async () => {
        try {
            const res = await fetch('/api/user/pdfs');
            if (res.ok) {
                const data = await res.json();
                setPdfs(data.pdfs);
                if (onUpdate) onUpdate();
            }
        } catch (error) {
            console.error('Failed to fetch PDFs', error);
        }
    };

    useEffect(() => {
        fetchPDFs();
    }, []);

    const handleFileUpload = async (file: File) => {
        if (pdfs.length >= 7) {
            toast.error('Maximum limit of 7 PDFs reached. Delete some to upload more.');
            return;
        }

        if (file.type !== 'application/pdf') {
            toast.error('Only PDF files are allowed.');
            return;
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            toast.error('File size must be less than 50MB.');
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading('Initiating Secure Upload...', {
            style: { background: '#050505', border: '1px solid rgba(6, 182, 212, 0.2)', color: '#fff' }
        });

        try {
            const presignRes = await fetch('/api/upload/presign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type
                })
            });

            if (!presignRes.ok) throw new Error('Failed to get upload URL');
            const { url, key } = await presignRes.json();

            const uploadRes = await fetch(url, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
            });

            if (!uploadRes.ok) throw new Error('Failed to upload to storage');

            const saveRes = await fetch('/api/user/pdfs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    r2Key: key,
                    fileSize: file.size
                })
            });

            if (!saveRes.ok) throw new Error('Failed to save file metadata');

            toast.success('Sync Complete: PDF Ingested', { id: toastId });
            fetchPDFs();
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('Sync Interrupted: Upload Failed', { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (pdf: PDFFile, e: React.MouseEvent) => {
        e.stopPropagation();
        setPdfToPurge(pdf);
        setIsPurgeModalOpen(true);
    };

    const confirmDeletion = async () => {
        if (!pdfToPurge) return;

        const toastId = toast.loading('Purging Data...', {
            style: { background: '#050505', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fff' }
        });
        try {
            const res = await fetch(`/api/user/pdfs?id=${pdfToPurge._id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('System Purge Successful', { id: toastId });
                fetchPDFs();
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            toast.error('Purge Conflict: Deletion Failed', { id: toastId });
        } finally {
            setPdfToPurge(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                {/* Hidden Input moved here for stability */}
                {pdfs.length < 7 && (
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="application/pdf"
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                handleFileUpload(e.target.files[0]);
                                e.target.value = ''; // Reset to allow same file selection again
                            }
                        }}
                    />
                )}
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-500/70">
                    Source Contexts <span className="text-white/20 ml-2">[{pdfs.length}/7]</span>
                </h3>
                {pdfs.length < 7 && !isUploading && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/30 hover:bg-cyan-500/20 transition-all flex items-center gap-2"
                    >
                        <Plus size={12} />
                        Add New Unit
                    </motion.button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Upload Zone */}
                {pdfs.length < 7 && (
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                            "relative group border border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all duration-500 cursor-pointer min-h-[180px] overflow-hidden",
                            isDragging
                                ? "border-cyan-500 bg-cyan-500/5 shadow-[0_0_30px_rgba(6,182,212,0.15)] scale-[1.02]"
                                : "border-white/10 hover:border-cyan-500/40 hover:bg-white/5",
                            isUploading && "pointer-events-none"
                        )}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {/* Dynamic Background Effects */}
                        <div className="absolute inset-0 bg-linear-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        {/* Scanning Line Effect */}
                        {(isDragging || isUploading) && (
                            <motion.div
                                className="absolute left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-cyan-500 to-transparent z-10 pointer-events-none"
                                animate={{ top: ["0%", "100%", "0%"] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                        )}


                        <div className="relative pointer-events-none">
                            <AnimatePresence mode="wait">
                                {isUploading ? (
                                    <motion.div
                                        key="loader"
                                        initial={{ opacity: 0, rotate: -180 }}
                                        animate={{ opacity: 1, rotate: 0 }}
                                        exit={{ opacity: 0, rotate: 180 }}
                                    >
                                        <Loader2 className="animate-spin text-cyan-400" size={40} />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="icon"
                                        whileHover={{ y: -5 }}
                                        className="relative"
                                    >
                                        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all">
                                            <FileUp size={32} />
                                        </div>
                                        <motion.div
                                            className="absolute -top-1 -right-1"
                                            animate={{ opacity: [0, 1, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <Sparkles size={16} className="text-cyan-400" />
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="text-center z-10 pointer-events-none">
                            <p className="text-sm font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                                {isUploading ? 'SYNCHRONIZING TARGET...' : 'UPLINK NEW PDF CONTEXT'}
                            </p>
                            <div className="mt-2 flex flex-col items-center gap-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                    {isDragging ? 'Drop to Ingest' : 'Drag & Drop or Remote Pulse'}
                                </p>
                                <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-white/40 border border-white/10 mt-1">
                                    PROTOCOL: MAX 50MB
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* PDF List */}
                <AnimatePresence>
                    {pdfs.map((pdf, index) => (
                        <motion.div
                            key={pdf._id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            className="group relative border border-white/5 rounded-2xl p-5 bg-[#0a0a0a]/80 backdrop-blur-xl hover:border-cyan-500/30 transition-all flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                        >
                            {/* Accent Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-start justify-between gap-4 relative z-10">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="p-3 rounded-xl bg-linear-to-br from-red-500/20 to-red-600/5 text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239, 68, 68, 0.1)] group-hover:shadow-[0_0_20px_rgba(239, 68, 68, 0.2)] transition-all">
                                        <FileText size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-sm truncate text-white/90 tracking-tight" title={pdf.filename}>
                                            {pdf.filename}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[10px] font-mono text-cyan-500/80 bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10">
                                                {(pdf.fileSize / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                            <div className="h-1 w-1 rounded-full bg-white/10" />
                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                ID: {pdf._id.slice(-6).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[9px] font-black italic text-white/10 group-hover:text-cyan-500/20 transition-colors uppercase tracking-widest">
                                    Unit {index + 1}
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5 relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                        Active since {new Date(pdf.uploadedAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(pdf, e)}
                                    className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all group/btn hover:scale-110 active:scale-90 border border-transparent hover:border-red-500/20"
                                    title="Purge PDF"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <PurgeConfirmModal
                isOpen={isPurgeModalOpen}
                onClose={() => setIsPurgeModalOpen(false)}
                onConfirm={confirmDeletion}
                fileName={pdfToPurge?.filename || ''}
            />
        </div>
    );
}
