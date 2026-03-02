'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, Lock, Unlock, Zap, Search, Bell, Target, Cpu, Activity, Server, AlertTriangle, UserCheck, Trash2, Edit, User } from 'lucide-react';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { toast } from 'sonner';
import FuturisticConfirmModal from '@/components/admin/FuturisticConfirmModal';
import FuturisticDropdown from '@/components/admin/FuturisticDropdown';
import { cn } from '@/lib/utils';

interface AdminStatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
    delay?: number;
}

const AdminStatCard = ({ icon, label, value, color, delay = 0 }: AdminStatCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="relative group"
    >
        <div className={`absolute inset-0 bg-${color}-500/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
        <div className="relative p-6 rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
            <div className={`absolute right-0 top-0 p-4 opacity-10 text-${color}-500 transform translate-x-1/4 -translate-y-1/4`}>
                <Cpu size={100} />
            </div>

            <div className="flex items-center gap-4 relative z-10">
                <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-500 border border-${color}-500/20 shadow-[0_0_15px_rgba(0,0,0,0.5)] shadow-${color}-500/20`}>
                    {icon}
                </div>
                <div>
                    <h3 className="text-muted-foreground text-xs font-mono uppercase tracking-wider mb-1">{label}</h3>
                    <div className="text-2xl font-bold text-white font-mono">{value}</div>
                </div>
            </div>

            {/* Animated bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.5, delay: 0.5 + delay, ease: "circOut" }}
                    className={`h-full bg-${color}-500 shadow-[0_0_10px_currentColor]`}
                />
            </div>
        </div>
    </motion.div>
);

export default function AdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [antiCheatEnabled, setAntiCheatEnabled] = useState(false);
    const [enableDirectCaptions, setEnableDirectCaptions] = useState(false); // Strategy 1
    const [enableAutoDailyGoals, setEnableAutoDailyGoals] = useState(true);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'danger' | 'warning' | 'success' | 'info';
        actionLabel: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        actionLabel: 'Confirm',
        onConfirm: () => { }
    });

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, settingsRes] = await Promise.all([
                fetch('/api/admin/users'),
                fetch('/api/admin/settings')
            ]);

            if (usersRes.ok) {
                setUsers(await usersRes.json());
            }
            if (settingsRes.ok) {
                const settings = await settingsRes.json();
                setMaintenanceMode(settings.maintenanceMode);
                setAntiCheatEnabled(settings.antiCheatEnabled);
                setEnableDirectCaptions(settings.enableDirectCaptions ?? false); // Default OFF
                setEnableAutoDailyGoals(settings.enableAutoDailyGoals ?? true);
            }
        } catch (error) {
            console.error('Failed to refresh admin data');
        } finally {
            setLoading(false);
        }
    };

    const confirmAction = (config: Omit<typeof modalConfig, 'isOpen'>) => {
        setModalConfig({ ...config, isOpen: true });
    };

    const handleBlockUser = async (userId: string, currentStatus: boolean) => {
        confirmAction({
            title: currentStatus ? 'UNBLOCK USER' : 'BLOCK USER',
            message: `Are you sure you want to ${currentStatus ? 'unblock' : 'block'} this user? ${currentStatus ? 'They will regain access immediately.' : 'They will be disconnected from the system.'}`,
            type: currentStatus ? 'success' : 'warning',
            actionLabel: currentStatus ? 'Unblock' : 'Block',
            onConfirm: async () => {
                try {
                    const res = await fetch('/api/admin/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, action: 'toggle_block' })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        toast.success(data.message);
                        setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBlocked: !u.isBlocked } : u));
                    } else {
                        toast.error(data.error);
                    }
                } catch (error) {
                    toast.error('Action failed');
                }
            }
        });
    };

    const handleDeleteUser = async (userId: string) => {
        confirmAction({
            title: 'TERMINATE USER',
            message: 'CRITICAL WARNING: This action is irreversible. The user/data will be permanently wiped from the database.',
            type: 'danger',
            actionLabel: 'TERMINATE',
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/admin/users?userId=${userId}`, {
                        method: 'DELETE',
                    });
                    const data = await res.json();
                    if (res.ok) {
                        toast.success(data.message);
                        setUsers(prev => prev.filter(u => u._id !== userId));
                    } else {
                        toast.error(data.error);
                    }
                } catch (error) {
                    toast.error('Delete failed');
                }
            }
        });
    };

    const handleRoleUpdate = async (userId: string, newRole: string) => {
        confirmAction({
            title: 'ELEVATE PRIVILEGES',
            message: `You are about to change this user's role to ${newRole.toUpperCase()}. Verify security clearance before proceeding.`,
            type: 'info',
            actionLabel: 'Update Role',
            onConfirm: async () => {
                try {
                    const res = await fetch('/api/admin/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, action: 'update_role', role: newRole })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        toast.success(data.message);
                        setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
                    } else {
                        toast.error(data.error);
                    }
                } catch (error) {
                    toast.error('Role update failed');
                }
            }
        });
    };

    const toggleMaintenanceClick = () => {
        const newState = !maintenanceMode;
        confirmAction({
            title: newState ? 'INITIATE MAINTENANCE' : 'SYSTEM ONLINE',
            message: newState
                ? 'System will be locked for all non-admin users. Proceed?'
                : 'System lock will be lifted. Users will regain access.',
            type: newState ? 'danger' : 'success',
            actionLabel: newState ? 'Lock System' : 'Go Online',
            onConfirm: async () => {
                try {
                    setMaintenanceMode(newState);
                    const res = await fetch('/api/admin/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ maintenanceMode: newState })
                    });
                    if (res.ok) {
                        toast.success(`Maintenance Mode ${newState ? 'Enabled' : 'Disabled'}`);
                    } else {
                        setMaintenanceMode(!newState);
                        toast.error('Failed to update setting');
                    }
                } catch (error) {
                    setMaintenanceMode(!maintenanceMode);
                    toast.error('Failed to update setting');
                }
            }
        });
    };

    const toggleAntiCheatClick = () => {
        const newState = !antiCheatEnabled;
        confirmAction({
            title: newState ? 'ACTIVATE SECURITY' : 'DISENGAGE SECURITY',
            message: newState
                ? 'Anti-Cheat protocols will be active. User behavior will be monitored.'
                : 'Anti-Cheat protocols disabled. System vulnerable to exploits.',
            type: newState ? 'success' : 'warning',
            actionLabel: newState ? 'Activate' : 'Disengage',
            onConfirm: async () => {
                try {
                    setAntiCheatEnabled(newState);
                    const res = await fetch('/api/admin/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ antiCheatEnabled: newState })
                    });
                    if (res.ok) {
                        toast.success(`Anti-Cheat ${newState ? 'Enabled' : 'Disabled'}`);
                    } else {
                        setAntiCheatEnabled(!newState);
                        toast.error('Failed to update setting');
                    }
                } catch (error) {
                    setAntiCheatEnabled(!antiCheatEnabled);
                    toast.error('Failed to update setting');
                }
            }
        });
    };

    const toggleDirectCaptionsClick = () => {
        const newState = !enableDirectCaptions;
        confirmAction({
            title: newState ? 'ENABLE FAST SCRAPING' : 'DISABLE FAST SCRAPING',
            message: newState
                ? 'Enabling Strategy 1 (Direct Captions). Ensure compliance with YouTube ToS.'
                : 'Disabling Strategy 1. System will fallback to AI-only transcription (Safer).',
            type: newState ? 'warning' : 'info',
            actionLabel: newState ? 'Enable' : 'Disable',
            onConfirm: async () => {
                try {
                    setEnableDirectCaptions(newState);
                    const res = await fetch('/api/admin/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ enableDirectCaptions: newState })
                    });
                    if (res.ok) {
                        toast.success(`Fast Scraping ${newState ? 'Enabled' : 'Disabled'}`);
                    } else {
                        setEnableDirectCaptions(!newState);
                        toast.error('Failed to update setting');
                    }
                } catch (error) {
                    setEnableDirectCaptions(!enableDirectCaptions);
                    toast.error('Failed to update setting');
                }
            }
        });
    };

    const toggleAutoGoalsClick = () => {
        const newState = !enableAutoDailyGoals;
        confirmAction({
            title: newState ? 'ENABLE AUTO GOALS' : 'DISABLE AUTO GOALS',
            message: newState
                ? 'Automatic Daily Goal Generation will be enabled for all users.'
                : 'Automatic Daily Goal Generation will be suspended. Users must generate them manually.',
            type: newState ? 'success' : 'warning',
            actionLabel: newState ? 'Enable' : 'Disable',
            onConfirm: async () => {
                try {
                    setEnableAutoDailyGoals(newState);
                    const res = await fetch('/api/admin/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ enableAutoDailyGoals: newState })
                    });
                    if (res.ok) {
                        toast.success(`Auto Goals ${newState ? 'Enabled' : 'Disabled'}`);
                    } else {
                        setEnableAutoDailyGoals(!newState);
                        toast.error('Failed to update setting');
                    }
                } catch (error) {
                    setEnableAutoDailyGoals(!enableAutoDailyGoals);
                    toast.error('Failed to update setting');
                }
            }
        });
    };

    const filteredUsers = users.filter(u =>
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const onlineCount = users.filter(u => {
        const lastActive = u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : 0;
        return (Date.now() - lastActive) < 2 * 60 * 1000;
    }).length;

    const adminsCount = users.filter(u => u.role === 'admin').length;

    if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white space-y-4">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div className="font-mono text-primary animate-pulse">INITIALIZING CORE...</div>
        </div>
    );

    return (
        <main className="min-h-screen bg-[#050505] text-white px-4 md:px-8 pb-4 md:pb-8 pt-32 md:pt-52 overflow-hidden relative">
            {/* Background Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }}
            />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-2 text-primary/80 mb-2 font-mono text-xs tracking-[0.2em] uppercase">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            System Administrator Access
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-white via-white to-white/50">
                            COMMAND CENTER
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end mr-4">
                            <span className="text-xs text-muted-foreground font-mono">SERVER STATUS</span>
                            <span className="text-green-500 font-bold font-mono flex items-center gap-2">
                                ONLINE <Activity size={12} className="animate-pulse" />
                            </span>
                        </div>
                        <Link href="/admin/notify">
                            <NeonButton variant="secondary" className="rounded-none! border-l-4 border-l-primary clip-path-slant">
                                <Bell className="mr-2" size={16} /> BROADCAST
                            </NeonButton>
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <AdminStatCard icon={<Users size={24} />} label="Total Users" value={users.length} color="blue" delay={0.1} />
                    <AdminStatCard icon={<Activity size={24} />} label="Active Now" value={onlineCount} color="green" delay={0.2} />
                    <AdminStatCard icon={<Shield size={24} />} label="Admins" value={adminsCount} color="yellow" delay={0.3} />
                    <AdminStatCard icon={<Server size={24} />} label="System Load" value="12%" color="purple" delay={0.4} />
                </div>

                {/* Controls & Search */}
                <div className="flex flex-col md:flex-row gap-6 mb-8 justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                    {/* Toggles */}
                    <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <button
                            onClick={toggleAntiCheatClick}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-lg border transition-all duration-300 font-mono text-sm uppercase tracking-wider relative overflow-hidden group",
                                antiCheatEnabled
                                    ? "bg-green-500/10 border-green-500/50 text-green-400 shadow-[0_0_20px_-5px_rgba(74,222,128,0.3)]"
                                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                            )}
                        >
                            <Shield size={18} className={cn("transition-all", antiCheatEnabled && "text-green-400")} />
                            Anti-Cheat
                            <div className={cn("w-2 h-2 rounded-full ml-2", antiCheatEnabled ? "bg-green-500 shadow-[0_0_10px_currentColor]" : "bg-white/20")} />
                        </button>

                        <button
                            onClick={toggleMaintenanceClick}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-lg border transition-all duration-300 font-mono text-sm uppercase tracking-wider relative overflow-hidden group",
                                maintenanceMode
                                    ? "bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]"
                                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                            )}
                        >
                            <AlertTriangle size={18} />
                            Maintenance
                            <div className={cn("w-2 h-2 rounded-full ml-2 animate-pulse", maintenanceMode ? "bg-red-500 shadow-[0_0_10px_currentColor]" : "bg-white/20")} />
                        </button>

                        <button
                            onClick={toggleDirectCaptionsClick}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-lg border transition-all duration-300 font-mono text-sm uppercase tracking-wider relative overflow-hidden group",
                                enableDirectCaptions
                                    ? "bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-[0_0_20px_-5px_rgba(251,191,36,0.3)]"
                                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                            )}
                        >
                            <Zap size={18} />
                            Fast Scraping
                            <div className={cn("w-2 h-2 rounded-full ml-2", enableDirectCaptions ? "bg-amber-500 shadow-[0_0_10px_currentColor]" : "bg-white/20")} />
                        </button>

                        <button
                            onClick={toggleAutoGoalsClick}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-lg border transition-all duration-300 font-mono text-sm uppercase tracking-wider relative overflow-hidden group",
                                enableAutoDailyGoals
                                    ? "bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]"
                                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                            )}
                        >
                            <Target size={18} />
                            Auto Goals
                            <div className={cn("w-2 h-2 rounded-full ml-2", enableAutoDailyGoals ? "bg-blue-500 shadow-[0_0_10px_currentColor]" : "bg-white/20")} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-96 group">
                        <div className="absolute inset-0 bg-primary/20 blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="SEARCH DATABASE..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-mono text-white placeholder:text-muted-foreground/50"
                        />
                    </div>
                </div>

                {/* Users Table / Grid */}
                <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5">
                                    <th className="p-4 md:p-6 font-mono text-xs text-muted-foreground uppercase tracking-wider">User Identity</th>
                                    <th className="p-4 md:p-6 font-mono text-xs text-muted-foreground uppercase tracking-wider">Access Level</th>
                                    <th className="p-4 md:p-6 font-mono text-xs text-muted-foreground uppercase tracking-wider">Network Status</th>
                                    <th className="p-4 md:p-6 font-mono text-xs text-muted-foreground uppercase tracking-wider text-right">System Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user, idx) => {
                                    const isSuperAdmin = user.email === 'codstom@gmail.com';
                                    const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
                                    const isOnline = (Date.now() - lastActive) < 2 * 60 * 1000;

                                    return (
                                        <motion.tr
                                            key={user._id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={cn(
                                                "border-b border-white/5 hover:bg-white/5 transition-colors group",
                                                activeDropdownId === user._id ? "relative z-50 bg-white/5" : "relative z-0"
                                            )}
                                        >
                                            <td className="p-4 md:p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg",
                                                        isSuperAdmin ? "bg-linear-to-br from-yellow-500 to-amber-700 text-white shadow-lg" : "bg-white/10 text-white"
                                                    )}>
                                                        {user.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white flex items-center gap-2">
                                                            {user.name || 'Unknown'}
                                                            {isSuperAdmin && <Shield size={14} className="text-yellow-500 fill-yellow-500/20" />}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground font-mono">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="p-4 flex items-center justify-between md:table-cell border-b border-white/5 md:border-none">
                                                <span className="md:hidden text-sm text-muted-foreground font-medium">Role</span>
                                                {isSuperAdmin ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                                                        <Lock size={10} /> SUPER ADMIN
                                                    </span>
                                                ) : (
                                                    <FuturisticDropdown
                                                        value={user.role}
                                                        onChange={(val) => handleRoleUpdate(user._id, val)}
                                                        onOpenChange={(open) => setActiveDropdownId(open ? user._id : null)}
                                                        options={[
                                                            { value: 'user', label: 'User', icon: <User size={12} />, color: 'blue' },
                                                            { value: 'editor', label: 'Editor', icon: <Edit size={12} />, color: 'purple' },
                                                            { value: 'admin', label: 'Admin', icon: <Shield size={12} />, color: 'yellow' }
                                                        ]}
                                                    />
                                                )}
                                            </td>

                                            <td className="p-4 md:p-6">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        isOnline ? "bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse" : "bg-zinc-700"
                                                    )} />
                                                    <span className={cn(
                                                        "text-xs font-mono font-medium",
                                                        isOnline ? "text-green-400" : "text-zinc-500"
                                                    )}>
                                                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="p-4 md:p-6 text-right">
                                                {!isSuperAdmin && (
                                                    <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleBlockUser(user._id, user.isBlocked)}
                                                            className={cn(
                                                                "p-2 rounded-lg border transition-all duration-300",
                                                                user.isBlocked
                                                                    ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                                                                    : "bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
                                                            )}
                                                            title={user.isBlocked ? "Unblock User" : "Block User"}
                                                        >
                                                            {user.isBlocked ? <Unlock size={16} /> : <Lock size={16} />}
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeleteUser(user._id)}
                                                            className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-300"
                                                            title="Terminate User"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <FuturisticConfirmModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                actionLabel={modalConfig.actionLabel}
            />
        </main>
    );
}
