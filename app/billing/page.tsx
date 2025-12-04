'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    CreditCard, Check, Zap, Shield,
    Download, Clock, AlertCircle
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';

export default function BillingPage() {
    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-primary/30 relative pt-32 pb-20 px-4 md:px-8">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl font-bold mb-4">Billing & Subscription</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Manage your plan, payment methods, and view your invoice history.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Current Plan & Usage */}
                    <div className="lg:col-span-2 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <GlassCard className="p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4">
                                    <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold uppercase tracking-wider border border-green-500/20">
                                        Active
                                    </span>
                                </div>
                                <div className="flex items-start gap-6 mb-8">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.3)]">
                                        <Zap size={32} className="text-black" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold mb-1">Pro Plan</h2>
                                        <p className="text-muted-foreground">$29/month • Renews on Dec 12, 2023</p>
                                    </div>
                                </div>

                                <div className="space-y-6 mb-8">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-muted-foreground">AI Queries Used</span>
                                            <span className="font-bold">2,450 / 5,000</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '49%' }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                                className="h-full rounded-full bg-primary shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-muted-foreground">Storage Used</span>
                                            <span className="font-bold">4.2 GB / 10 GB</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '42%' }}
                                                transition={{ duration: 1, delay: 0.6 }}
                                                className="h-full rounded-full bg-secondary shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <NeonButton variant="ghost">Change Plan</NeonButton>
                                    <button className="px-6 py-3 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-sm font-bold">
                                        Cancel Subscription
                                    </button>
                                </div>
                            </GlassCard>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            <GlassCard className="p-8">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <Clock size={20} className="text-muted-foreground" />
                                    Invoice History
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-white/10">
                                                <th className="pb-4 pl-2">Date</th>
                                                <th className="pb-4">Amount</th>
                                                <th className="pb-4">Status</th>
                                                <th className="pb-4 text-right pr-2">Invoice</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {[
                                                { date: 'Nov 12, 2023', amount: '$29.00', status: 'Paid' },
                                                { date: 'Oct 12, 2023', amount: '$29.00', status: 'Paid' },
                                                { date: 'Sep 12, 2023', amount: '$29.00', status: 'Paid' },
                                            ].map((invoice, i) => (
                                                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                                    <td className="py-4 pl-2">{invoice.date}</td>
                                                    <td className="py-4 font-mono">{invoice.amount}</td>
                                                    <td className="py-4">
                                                        <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold">
                                                            {invoice.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-right pr-2">
                                                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white">
                                                            <Download size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>

                    {/* Right Column - Payment Method & Upgrade */}
                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <GlassCard className="p-6">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <CreditCard size={20} className="text-primary" />
                                    Payment Method
                                </h3>
                                <div className="p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 mb-4 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-50">
                                        <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="12" r="12" fill="#EB001B" fillOpacity="0.5" />
                                            <circle cx="28" cy="12" r="12" fill="#F79E1B" fillOpacity="0.5" />
                                        </svg>
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-1">Mastercard</div>
                                    <div className="font-mono text-lg tracking-wider mb-4">•••• •••• •••• 4242</div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Expiry 12/25</span>
                                        <span>Shivam</span>
                                    </div>
                                </div>
                                <button className="w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors border border-dashed border-primary/30 rounded-lg hover:bg-primary/5">
                                    + Add New Card
                                </button>
                            </GlassCard>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                        >
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl" />
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Shield size={20} className="text-purple-400" />
                                    Enterprise Plan
                                </h3>
                                <ul className="space-y-3 mb-6">
                                    {['Unlimited Notebooks', 'Custom AI Models', 'Priority Support', 'Team Collaboration'].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-white/80">
                                            <Check size={14} className="text-green-400" /> {feature}
                                        </li>
                                    ))}
                                </ul>
                                <NeonButton variant="secondary" className="w-full">Contact Sales</NeonButton>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </main>
    );
}
