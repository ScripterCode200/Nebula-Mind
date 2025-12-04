'use client';

import { motion } from 'framer-motion';
import {
    Activity, Clock, Search, Bell, Settings,
    FileText, PieChart, MessageSquare, Zap, Folder, MoreVertical,
    Calendar, Plus, Brain, Target, Database, Cpu, Radio, Share2
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active = false, hasBadge = false }: { icon: any, label: string, active?: boolean, hasBadge?: boolean }) => (
    <div className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
        <div className="flex items-center gap-3">
            <Icon size={16} className={`transition-transform group-hover:scale-110 ${active ? 'animate-pulse' : ''}`} />
            <span className="tracking-wide">{label}</span>
        </div>
        {hasBadge && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse" />}
    </div>
);

const HolographicCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`relative bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(6,182,212,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite]" />
        <div className="relative z-10">{children}</div>
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50 rounded-tl-sm" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/50 rounded-tr-sm" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/50 rounded-bl-sm" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50 rounded-br-sm" />
    </div>
);

const StatCard = ({ icon: Icon, label, value, trend, color }: { icon: any, label: string, value: string, trend: string, color: string }) => (
    <HolographicCard className="p-4 group hover:border-cyan-500/30 transition-colors">
        <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-400 ring-1 ring-${color}-500/20 group-hover:ring-${color}-500/50 transition-all`}>
                <Icon size={18} />
            </div>
            <div className="flex items-center gap-1">
                <Activity size={12} className={`text-${color}-400`} />
                <span className={`text-xs font-mono font-medium ${trend.startsWith('+') ? 'text-cyan-400' : 'text-red-400'}`}>{trend}</span>
            </div>
        </div>
        <div className="text-2xl font-bold mb-1 text-white tracking-tight group-hover:text-cyan-50 transition-colors">{value}</div>
        <div className="text-xs text-gray-500 uppercase tracking-wider font-mono">{label}</div>
    </HolographicCard>
);

const FileRow = ({ name, type, date, size }: { name: string, type: string, date: string, size: string }) => (
    <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-white/5">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-500/10 text-cyan-400 group-hover:text-cyan-300 transition-colors">
                <FileText size={16} />
            </div>
            <div>
                <div className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{name}</div>
                <div className="text-[10px] text-gray-500 font-mono uppercase">{type} • {size}</div>
            </div>
        </div>
        <div className="text-xs text-gray-600 font-mono group-hover:text-cyan-400/70 transition-colors">{date}</div>
    </div>
);

export default function DashboardPreview({ className }: { className?: string }) {
    return (
        <div className={`relative w-full max-w-6xl mx-auto perspective-1000 ${className}`}>
            {/* Ambient Glow */}
            <div className="absolute -inset-10 bg-cyan-500/20 blur-[120px] rounded-full opacity-20 pointer-events-none mix-blend-screen" />

            <motion.div
                initial={{ rotateX: 15, y: 50, opacity: 0 }}
                animate={{ rotateX: 0, y: 0, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="relative bg-[#050505]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5"
            >
                {/* Top Navigation Bar */}
                <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-white/[0.02]">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                            <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        </div>
                        <div className="h-6 w-[1px] bg-white/10" />
                        <div className="flex items-center gap-2 text-xs md:text-sm font-mono tracking-wide">
                            <span className="text-cyan-400">NEBULA_OS</span>
                            <span className="text-gray-600 hidden sm:inline">::</span>
                            <span className="text-gray-400 hidden sm:inline">COMMAND_CENTER</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="relative hidden md:flex items-center group">
                            <Search size={14} className="absolute left-3 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="SEARCH_DATABASE..."
                                className="bg-black/40 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] w-64 transition-all font-mono placeholder:text-gray-700"
                            />
                        </div>
                        <div className="flex items-center gap-3 md:gap-4 border-l border-white/10 pl-4 md:pl-6">
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <div className="text-xs font-bold text-white tracking-wider">SHIVAM</div>
                                    <div className="text-[10px] text-cyan-400 font-mono">ADMIN_ACCESS</div>
                                </div>
                                <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 p-[1px] shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                    <div className="w-full h-full rounded-[7px] bg-black flex items-center justify-center text-xs font-bold text-white">S</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-[600px]">
                    {/* Sidebar */}
                    <div className="w-64 border-r border-white/5 bg-black/40 hidden md:flex flex-col p-4 gap-8">
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] px-3 mb-3 font-mono">Navigation</div>
                            <SidebarItem icon={Activity} label="Dashboard" active />
                            <SidebarItem icon={Database} label="Neural Base" hasBadge />
                            <SidebarItem icon={Brain} label="Cortex" />
                            <SidebarItem icon={Target} label="Simulations" />
                        </div>

                        <div className="space-y-1">
                            <div className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] px-3 mb-3 font-mono">Analytics</div>
                            <SidebarItem icon={PieChart} label="Metrics" />
                            <SidebarItem icon={Radio} label="Signals" />
                            <SidebarItem icon={Share2} label="Network" />
                        </div>

                        <div className="mt-auto">
                            <HolographicCard className="p-4 border-cyan-500/20 bg-cyan-950/10">
                                <div className="flex items-center gap-2 mb-2 text-cyan-400">
                                    <Cpu size={16} className="animate-pulse" />
                                    <span className="text-xs font-bold font-mono tracking-wider">SYSTEM_STATUS</span>
                                </div>
                                <div className="text-[10px] text-gray-400 mb-3 font-mono">
                                    Neural Link: <span className="text-green-400">STABLE</span><br />
                                    Memory Usage: <span className="text-yellow-400">42%</span>
                                </div>
                                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full w-[42%] bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                                </div>
                            </HolographicCard>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-4 md:p-8 bg-[url('/grid.svg')] bg-[size:50px_50px] bg-fixed">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold mb-1 text-white tracking-tight">
                                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Shivam</span>
                                </h1>
                                <p className="text-[10px] md:text-xs text-gray-500 font-mono uppercase tracking-widest">System ready for new inputs.</p>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] md:text-xs font-bold hover:bg-cyan-500/20 transition-all font-mono tracking-wide whitespace-nowrap">
                                    <Calendar size={14} />
                                    <span>STARDATE_2025.10.24</span>
                                </button>
                                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-black text-[10px] md:text-xs font-bold hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.4)] font-mono tracking-wide whitespace-nowrap">
                                    <Plus size={14} />
                                    <span>INITIATE_PROJECT</span>
                                </button>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                            <StatCard icon={Clock} label="Active_Time" value="32.5h" trend="+12%" color="cyan" />
                            <StatCard icon={Brain} label="Knowledge_Nodes" value="1,240" trend="+5%" color="purple" />
                            <StatCard icon={Target} label="Accuracy_Rate" value="98.2%" trend="+2.4%" color="green" />
                            <StatCard icon={Zap} label="Neural_Ops" value="856" trend="+18%" color="yellow" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Main Chart Area */}
                            <HolographicCard className="lg:col-span-2 p-4 md:p-6 min-h-[300px] flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="font-bold text-white tracking-wide">Learning Velocity</h3>
                                        <p className="text-[10px] text-gray-500 font-mono uppercase">Data Stream: Live</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <span className="w-1 h-1 bg-cyan-500 rounded-full animate-ping" />
                                            <span className="w-1 h-1 bg-cyan-500 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 flex items-end gap-2 md:gap-3 px-2 pb-2 border-b border-white/5">
                                    {[35, 45, 30, 60, 75, 50, 65, 80, 70, 90, 85, 95].map((h, i) => (
                                        <div key={i} className="w-full bg-cyan-500/5 rounded-sm relative group overflow-hidden">
                                            <div
                                                className="absolute bottom-0 left-0 right-0 bg-cyan-500/40 transition-all duration-500 group-hover:bg-cyan-400 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                                                style={{ height: `${h}%` }}
                                            />
                                            {/* Scanline Effect */}
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent translate-y-[-100%] animate-[scan_2s_infinite]" />
                                        </div>
                                    ))}
                                </div>
                            </HolographicCard>

                            {/* AI Assistant Widget */}
                            <HolographicCard className="p-4 md:p-6 flex flex-col bg-gradient-to-b from-cyan-950/20 to-black/40">
                                <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
                                    <div className="relative">
                                        <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse" />
                                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-cyan-500 animate-ping opacity-50" />
                                    </div>
                                    <h3 className="font-bold text-sm tracking-widest font-mono text-cyan-100">NEBULA_AI</h3>
                                </div>
                                <div className="flex-1 space-y-4 mb-4">
                                    <div className="bg-white/5 border border-white/5 rounded-lg p-3 rounded-tl-none text-xs text-gray-300 leading-relaxed font-mono">
                                        <span className="text-cyan-500">{'>>'}</span> Analysis complete. Detected knowledge gap in <span className="text-cyan-400 font-bold">Quantum Entanglement</span>. Initiating protocol 7.
                                    </div>
                                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 rounded-tr-none text-xs text-cyan-100 ml-auto max-w-[90%] font-mono">
                                        Proceed with simulation.
                                    </div>
                                </div>
                                <div className="mt-auto">
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            placeholder="INPUT_COMMAND..."
                                            className="w-full bg-black/60 border border-white/10 rounded-lg py-2.5 pl-3 pr-10 text-xs focus:outline-none focus:border-cyan-500/50 font-mono text-cyan-400 placeholder:text-gray-700 transition-all group-hover:border-white/20"
                                        />
                                        <Zap size={14} className="absolute right-3 top-2.5 text-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            </HolographicCard>
                        </div>

                        {/* Recent Files & Topics */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <HolographicCard className="p-4 md:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 font-mono">Recent_Logs</h3>
                                    <button className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono uppercase border border-cyan-500/20 px-2 py-1 rounded bg-cyan-500/5">View_All</button>
                                </div>
                                <div className="space-y-1">
                                    <FileRow name="Advanced_Calculus.pdf" type="PDF_DATA" size="4.2 MB" date="T-minus 2h" />
                                    <FileRow name="Rome_History_Logs" type="NOTEBOOK" size="128 KB" date="T-minus 5h" />
                                    <FileRow name="Organic_Chem_Lab" type="PDF_DATA" size="8.5 MB" date="YESTERDAY" />
                                </div>
                            </HolographicCard>

                            <HolographicCard className="p-4 md:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 font-mono">Mastery_Index</h3>
                                    <MoreVertical size={16} className="text-gray-600 cursor-pointer hover:text-white" />
                                </div>
                                <div className="space-y-5">
                                    {[
                                        { label: "Linear_Algebra", val: 92, color: "bg-cyan-500" },
                                        { label: "European_History", val: 78, color: "bg-purple-500" },
                                        { label: "Thermodynamics", val: 45, color: "bg-yellow-500" },
                                    ].map((item, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-[10px] mb-1.5 font-mono">
                                                <span className="text-gray-300">{item.label}</span>
                                                <span className="text-cyan-400">{item.val}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${item.color} shadow-[0_0_10px_currentColor]`}
                                                    style={{ width: `${item.val}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </HolographicCard>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
