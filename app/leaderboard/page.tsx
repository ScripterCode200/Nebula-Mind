'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Search, Crown, Sparkles, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Types
interface LeaderboardUser {
    id: string;
    name: string;
    xp: number;
    rank: number;
    avatar: string;
    profileImage?: string;
    trend: string;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function LeaderboardPage() {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    React.useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch('/api/leaderboard');
                if (res.ok) {
                    const data = await res.json();
                    if (data.users) {
                        setLeaderboardData(data.users);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch leaderboard:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const filteredData = leaderboardData.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Separate data for "Leaderboard View" vs "Search View"
    const isSearching = searchQuery.length > 0;

    // In standard view: Top 3 go to Podium, rest go to list.
    // In search view: Podium is hidden, ALL matches go to list.
    const topThree = leaderboardData.slice(0, 3);
    const standardList = leaderboardData.slice(3);

    // The list to display in the scrolling section
    const displayList = isSearching ? filteredData : standardList;

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 max-w-[1440px] mx-auto overflow-hidden relative">

            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
            </div>

            {/* Header */}
            <div className={`relative z-10 ${isSearching ? 'mb-8 sm:mb-12' : 'mb-20 sm:mb-32'}`}>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-linear-to-r from-yellow-200 via-yellow-400 to-yellow-600 mb-3 sm:mb-4 drop-shadow-sm flex items-center justify-center gap-2 sm:gap-4">
                        <Trophy className="text-yellow-400 w-8 h-8 sm:w-10 sm:h-10 md:w-16 md:h-16" />
                        Leaderboard
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
                        Celebrate the top performers and see where you stand among the elite.
                    </p>
                </motion.div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : leaderboardData.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">No users found</p>
                </div>
            ) : (
                <>
                    {/* Top 3 Podium - Only show when NOT searching */}
                    {!isSearching && topThree.length > 0 && (
                        <div className="mb-12 sm:mb-16 relative z-10 flex flex-col md:flex-row justify-center items-center md:items-end gap-6 md:gap-8 md:min-h-[400px]">
                            {/* Mobile 1st Place (Shows first on small screens) */}
                            {topThree[0] && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="md:hidden relative flex flex-col items-center z-20 w-full max-w-[280px]"
                                >
                                    <Link href={`/user/${topThree[0].id}`} className="flex flex-col items-center group w-full">
                                        <div className="absolute -top-12 animate-bounce">
                                            <Crown className="w-10 h-10 text-yellow-400 fill-yellow-400/20 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]" />
                                        </div>
                                        <div className="w-24 h-24 rounded-full border-4 border-yellow-400 bg-yellow-900/20 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(250,204,21,0.4)] relative overflow-hidden ring-4 ring-yellow-400/20">
                                            {topThree[0].profileImage ? (
                                                <img src={topThree[0].profileImage} alt={topThree[0].name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-3xl font-bold text-yellow-400">{topThree[0].avatar}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-center p-6 bg-linear-to-b from-yellow-900/40 to-black/60 border border-yellow-500/30 rounded-2xl w-full shadow-2xl relative">
                                            <div className="absolute -top-6">
                                                <Medal className="w-12 h-12 text-yellow-400 drop-shadow-lg" />
                                            </div>
                                            <div className="mt-4 text-center">
                                                <div className="text-xl font-bold text-white mb-1 truncate px-2">{topThree[0].name}</div>
                                                <div className="text-sm text-yellow-400 font-mono font-bold">{topThree[0].xp.toLocaleString()} XP</div>
                                            </div>
                                            <div className="absolute top-4 right-4 text-4xl font-black text-yellow-500/20 select-none">1</div>
                                        </div>
                                    </Link>
                                </motion.div>
                            )}

                            {/* 2nd Place */}
                            {topThree[1] && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="relative order-1 flex flex-col items-center w-full md:w-auto max-w-[280px] md:max-w-none"
                                >
                                    <Link href={`/user/${topThree[1].id}`} className="flex md:flex-col items-center group w-full md:w-auto bg-slate-900/40 md:bg-transparent border border-slate-500/30 md:border-none rounded-2xl md:rounded-none p-4 md:p-0 relative overflow-hidden">
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden text-6xl font-black text-slate-500/20 select-none">2</div>
                                        <div className="w-16 h-16 md:w-32 md:h-32 rounded-full border-2 md:border-4 border-slate-300 bg-slate-900/50 flex items-center justify-center md:mb-8 shadow-[0_0_20px_rgba(203,213,225,0.3)] relative overflow-hidden shrink-0">
                                            {topThree[1].profileImage ? (
                                                <img src={topThree[1].profileImage} alt={topThree[1].name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xl md:text-4xl font-bold text-slate-300">{topThree[1].avatar}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 md:flex-none flex flex-col items-start md:items-center ml-4 md:ml-0 md:p-6 md:bg-slate-900/40 md:border md:border-slate-500/30 md:rounded-t-3xl md:w-48 md:h-64 relative z-10 w-full">
                                            <div className="hidden md:block absolute -top-6">
                                                <Medal className="w-12 h-12 text-slate-300 drop-shadow-lg" />
                                            </div>
                                            <div className="md:mt-6 text-left md:text-center w-full">
                                                <div className="text-lg md:text-xl font-bold text-white mb-0.5 md:mb-1 truncate md:px-2">{topThree[1].name}</div>
                                                <div className="text-xs md:text-sm text-slate-400 font-mono">{topThree[1].xp.toLocaleString()} XP</div>
                                            </div>
                                            <div className="hidden md:block absolute bottom-4 text-6xl font-black text-slate-800/50 select-none">2</div>
                                        </div>
                                    </Link>
                                </motion.div>
                            )}

                            {/* Desktop 1st Place (Hidden on small screens, shown in middle on desktop) */}
                            {topThree[0] && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="hidden md:flex relative order-2 flex-col items-center z-20 -mt-12"
                                >
                                    <Link href={`/user/${topThree[0].id}`} className="flex flex-col items-center group">
                                        <div className="absolute -top-16 animate-bounce">
                                            <Crown className="w-12 h-12 text-yellow-400 fill-yellow-400/20 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]" />
                                        </div>
                                        <div className="w-40 h-40 rounded-full border-4 border-yellow-400 bg-yellow-900/20 backdrop-blur-md flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(250,204,21,0.4)] relative overflow-hidden ring-4 ring-yellow-400/20">
                                            {topThree[0].profileImage ? (
                                                <img src={topThree[0].profileImage} alt={topThree[0].name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-5xl font-bold text-yellow-400">{topThree[0].avatar}</span>
                                            )}
                                            <div className="absolute inset-0 bg-yellow-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>
                                        <div className="flex flex-col items-center p-8 bg-linear-to-b from-yellow-900/40 to-black/60 backdrop-blur-xl border border-yellow-500/30 rounded-t-3xl w-56 h-80 shadow-2xl relative">
                                            <div className="absolute -top-8">
                                                <Medal className="w-16 h-16 text-yellow-400 drop-shadow-lg" />
                                            </div>
                                            <div className="mt-8 text-center">
                                                <div className="text-2xl font-bold text-white mb-1 truncate px-2 w-full">{topThree[0].name}</div>
                                                <div className="text-base text-yellow-400 font-mono font-bold">{topThree[0].xp.toLocaleString()} XP</div>
                                                <div className="mt-2 px-3 py-1 bg-yellow-400/20 rounded-full text-xs text-yellow-300 border border-yellow-400/30 flex items-center gap-1 justify-center mx-auto w-fit">
                                                    <Sparkles size={12} /> Elite
                                                </div>
                                            </div>
                                            <div className="absolute bottom-4 text-8xl font-black text-yellow-500/20 select-none">1</div>
                                        </div>
                                    </Link>
                                </motion.div>
                            )}

                            {/* 3rd Place */}
                            {topThree[2] && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="relative order-3 flex flex-col items-center w-full md:w-auto max-w-[280px] md:max-w-none"
                                >
                                    <Link href={`/user/${topThree[2].id}`} className="flex md:flex-col items-center group w-full md:w-auto bg-amber-900/20 md:bg-transparent border border-amber-700/30 md:border-none rounded-2xl md:rounded-none p-4 md:p-0 relative overflow-hidden">
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden text-6xl font-black text-amber-500/10 select-none">3</div>
                                        <div className="w-16 h-16 md:w-32 md:h-32 rounded-full border-2 md:border-4 border-amber-600 bg-amber-900/30 flex items-center justify-center md:mb-8 shadow-[0_0_20px_rgba(217,119,6,0.3)] relative overflow-hidden shrink-0">
                                            {topThree[2].profileImage ? (
                                                <img src={topThree[2].profileImage} alt={topThree[2].name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xl md:text-4xl font-bold text-amber-600">{topThree[2].avatar}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 md:flex-none flex flex-col items-start md:items-center ml-4 md:ml-0 md:p-6 md:bg-amber-900/20 md:border md:border-amber-700/30 md:rounded-t-3xl md:w-48 md:h-56 relative z-10 w-full">
                                            <div className="hidden md:block absolute -top-6">
                                                <Medal className="w-12 h-12 text-amber-600 drop-shadow-lg" />
                                            </div>
                                            <div className="md:mt-6 text-left md:text-center w-full">
                                                <div className="text-lg md:text-xl font-bold text-white mb-0.5 md:mb-1 truncate md:px-2">{topThree[2].name}</div>
                                                <div className="text-xs md:text-sm text-amber-500 font-mono">{topThree[2].xp.toLocaleString()} XP</div>
                                            </div>
                                            <div className="hidden md:block absolute bottom-4 text-6xl font-black text-amber-800/50 select-none">3</div>
                                        </div>
                                    </Link>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="max-w-md mx-auto mb-10 relative group z-10">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search users by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-full py-3 pl-12 pr-6 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all duration-300 text-sm md:text-base shadow-inner"
                            />
                        </div>
                    </div>

                    {/* List Header */}
                    {displayList.length > 0 && (
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2 grid grid-cols-12 gap-3 sm:gap-4 text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider relative z-10 mb-2">
                            <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
                            <div className="col-span-6 sm:col-span-7">User</div>
                            <div className="col-span-4 sm:col-span-4 text-right">XP</div>
                        </div>
                    )}

                    {/* Leaderboard List */}
                    <motion.div
                        key={isSearching ? 'search-list' : 'standard-list'}
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="max-w-4xl mx-auto flex flex-col gap-3 relative z-10"
                    >
                        {displayList.length > 0 ? (
                            displayList.map((user) => (
                                <motion.div
                                    key={user.id}
                                    variants={item}
                                    className="group relative"
                                >
                                    <Link href={`/user/${user.id}`}>
                                        <div className="absolute inset-0 bg-white/5 rounded-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md" />
                                        <div className="grid grid-cols-12 gap-3 sm:gap-4 items-center bg-black/40 border border-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:border-white/20 transition-all duration-300 hover:transform hover:scale-[1.01] hover:shadow-lg backdrop-blur-sm">
                                            <div className="col-span-2 sm:col-span-1 flex justify-center">
                                                <span className={cn(
                                                    "w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-xs sm:text-sm font-bold font-mono",
                                                    user.rank === 1 ? "bg-yellow-500/20 text-yellow-500" :
                                                        user.rank === 2 ? "bg-slate-300/20 text-slate-300" :
                                                            user.rank === 3 ? "bg-amber-600/20 text-amber-600" :
                                                                "bg-white/5 text-muted-foreground"
                                                )}>
                                                    {user.rank}
                                                </span>
                                            </div>
                                            <div className="col-span-6 sm:col-span-7 flex items-center gap-2 sm:gap-4 min-w-0">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md overflow-hidden relative shrink-0">
                                                    {user.profileImage ? (
                                                        <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{user.avatar}</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span className="text-sm sm:text-base text-white font-medium block truncate">{user.name}</span>
                                                    <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                                                        {user.trend === 'up' && <TrendingUp size={10} className="text-green-400 sm:w-3 sm:h-3" />}
                                                        {user.trend === 'down' && <TrendingUp size={10} className="text-red-400 rotate-180 sm:w-3 sm:h-3" />}
                                                        <span className="hidden sm:inline">
                                                            {user.trend === 'up' ? "Rising" : user.trend === 'down' ? "Falling" : "Stable"}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-span-4 sm:col-span-4 text-right">
                                                <span className="text-sm sm:text-base text-primary font-bold font-mono">{user.xp.toLocaleString()}</span>
                                                <span className="text-[10px] sm:text-xs text-muted-foreground ml-0.5 sm:ml-1 hidden sm:inline">XP</span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))
                        ) : (
                            // No Results State
                            <div className="text-center py-12 text-muted-foreground">
                                <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No users found matching "{searchQuery}"</p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </div>
    );
}
