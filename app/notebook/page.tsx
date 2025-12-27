'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Book, Calendar, Search, Sparkles, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';

const CreateNotebookModal = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('@/components/notebook/CreateNotebookModal'),
    { ssr: false }
);

import DeleteConfirmationModal from '@/components/notebook/DeleteConfirmationModal';
import Link from 'next/link';

interface Notebook {
    _id: string;
    title: string;
    createdAt: string;
    pdfUrl: string;
}

export default function Dashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Delete State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [notebookToDelete, setNotebookToDelete] = useState<Notebook | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchNotebooks();
    }, []);

    const fetchNotebooks = async () => {
        try {
            const res = await fetch('/api/notebooks');
            if (res.ok) {
                const data = await res.json();
                setNotebooks(data);
            }
        } catch {
            console.error('Failed to fetch notebooks');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, notebook: Notebook) => {
        e.preventDefault();
        e.stopPropagation();
        setNotebookToDelete(notebook);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!notebookToDelete) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/notebooks/${notebookToDelete._id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setNotebooks(prev => prev.filter(n => n._id !== notebookToDelete._id));
                setDeleteModalOpen(false);
                setNotebookToDelete(null);
            }
        } catch (error) {
            console.error('Failed to delete notebook', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredNotebooks = notebooks.filter(notebook =>
        notebook.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-primary/30 relative">
            {/* Background Grid & Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
                <div className="absolute inset-0 bg-linear-to-b from-[#050505] via-transparent to-[#050505]" />

                <motion.div
                    animate={{ x: [0, 50, 0], y: [0, -30, 0], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{ x: [0, -50, 0], y: [0, 30, 0], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px]"
                />
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-32 pb-20 relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-medium mb-4 backdrop-blur-md">
                            <Sparkles size={12} />
                            <span>Personal Knowledge Base</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                            Your Notebooks
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
                            Manage your AI-powered study materials. Access your generated quizzes, summaries, and insights all in one place.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-col sm:flex-row gap-4 w-full md:w-auto"
                    >
                        <div className="relative group w-full md:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search notebooks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-white/5 text-white placeholder-muted-foreground focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 sm:text-sm transition-all duration-300"
                            />
                        </div>
                        <NeonButton onClick={() => setIsModalOpen(true)} className="whitespace-nowrap">
                            <Plus size={18} />
                            New Notebook
                        </NeonButton>
                    </motion.div>
                </div>

                {/* Grid Section */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence mode='popLayout'>
                            {filteredNotebooks.map((notebook, index) => (
                                <motion.div
                                    layout
                                    key={notebook._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.4, delay: index * 0.05 }}
                                >
                                    <Link href={`/notebook/${notebook._id}`}>
                                        <GlassCard
                                            hoverEffect
                                            className="h-full flex flex-col justify-between group cursor-pointer! border-white/5 hover:border-primary/30 bg-black/40 backdrop-blur-xl! min-h-[240px] relative overflow-hidden"
                                        >
                                            <div>
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary/10 to-blue-500/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all duration-500 border border-primary/20">
                                                        <Book size={28} />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                                            PDF
                                                        </div>
                                                        <button
                                                            onClick={(e) => handleDeleteClick(e, notebook)}
                                                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-500 transition-colors z-20"
                                                            title="Delete Notebook"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                                                    {notebook.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                                    AI-generated insights and study materials from your uploaded document.
                                                </p>
                                            </div>

                                            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground group-hover:text-white/70 transition-colors">
                                                <div className="flex items-center">
                                                    <Calendar size={12} className="mr-2" />
                                                    {new Date(notebook.createdAt).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                                <span className="group-hover:translate-x-1 transition-transform duration-300">
                                                    Open →
                                                </span>
                                            </div>
                                        </GlassCard>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Empty State */}
                        {!loading && filteredNotebooks.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full flex flex-col items-center justify-center py-32 text-center"
                            >
                                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 relative">
                                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                                    <Search size={40} className="text-muted-foreground relative z-10" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">No notebooks found</h3>
                                <p className="text-muted-foreground max-w-md mb-8">
                                    {searchQuery
                                        ? `We couldn't find any notebooks matching "${searchQuery}".`
                                        : "Get started by creating your first AI notebook from any PDF document."}
                                </p>
                                {!searchQuery && (
                                    <NeonButton onClick={() => setIsModalOpen(true)}>
                                        Create Notebook
                                    </NeonButton>
                                )}
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="text-primary hover:underline underline-offset-4"
                                    >
                                        Clear search
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                )}

                <CreateNotebookModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        fetchNotebooks();
                    }}
                />

                <DeleteConfirmationModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title={notebookToDelete?.title || ''}
                    isDeleting={isDeleting}
                />
            </div>
        </main>
    );
}
