'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Lock, Unlock, Power, Search } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { toast } from 'sonner';

export default function AdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            // Don't set loading true on background refreshes to avoid flickering
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
            }
        } catch (error) {
            console.error('Failed to refresh admin data');
        } finally {
            setLoading(false);
        }
    };



    const toggleBlockUser = async (userId: string) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action: 'toggle_block' })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setUsers(users.map(u => u._id === userId ? { ...u, isBlocked: !u.isBlocked } : u));
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error('Action failed');
        }
    };

    const toggleMaintenance = async () => {
        try {
            const newState = !maintenanceMode;
            setMaintenanceMode(newState); // Optimistic
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
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Admin...</div>;

    return (
        <main className="min-h-screen bg-[#050505] text-white p-8 pt-32">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Shield className="text-primary" size={32} /> Admin Dashboard
                        </h1>
                        <p className="text-muted-foreground mt-2">System controls and user management</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                            <span className="text-sm font-medium">Maintenance Mode</span>
                            <button
                                onClick={toggleMaintenance}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${maintenanceMode ? 'bg-red-500' : 'bg-white/20'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    <GlassCard className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Users size={20} /> User Management ({users.length})
                            </h2>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-muted-foreground text-sm">
                                        <th className="p-4 font-medium">User</th>
                                        <th className="p-4 font-medium">Role</th>
                                        <th className="p-4 font-medium">Joined</th>
                                        <th className="p-4 font-medium">Status</th>
                                        <th className="p-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-white">{user.name || 'Unknown'}</div>
                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs px-2 py-1 rounded-full border ${user.role === 'admin' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/5 border-white/10 text-muted-foreground'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                {user.isBlocked ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full border border-red-400/20">
                                                        <Lock size={12} /> Blocked
                                                    </span>
                                                ) : (() => {
                                                    const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
                                                    const now = Date.now();
                                                    const diff = now - lastActive;

                                                    // Online: Active in last 2 minutes
                                                    if (diff < 2 * 60 * 1000) {
                                                        return (
                                                            <div className="flex flex-col gap-1">
                                                                <span className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full border border-green-400/20 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                                                                    <span className="relative flex h-2 w-2">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                                    </span>
                                                                    Online
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground ml-1">Active just now</span>
                                                            </div>
                                                        );
                                                    }
                                                    // Away: Active in last 30 minutes
                                                    else if (diff < 30 * 60 * 1000) {
                                                        return (
                                                            <div className="flex flex-col gap-1">
                                                                <span className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full border border-yellow-400/20">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> Away
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground ml-1">{Math.floor(diff / 60000)}m ago</span>
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <div className="flex flex-col gap-1">
                                                                <span className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" /> Offline
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground ml-1">
                                                                    {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Never'}
                                                                </span>
                                                            </div>
                                                        );
                                                    }
                                                })()}
                                            </td>
                                            <td className="p-4 text-right">
                                                {user.role !== 'admin' && (
                                                    <button
                                                        onClick={() => toggleBlockUser(user._id)}
                                                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${user.isBlocked
                                                            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                                            : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                                            }`}
                                                    >
                                                        {user.isBlocked ? 'Unblock' : 'Block'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </main>
    );
}
