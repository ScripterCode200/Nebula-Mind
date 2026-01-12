import React from 'react';
import { notFound } from 'next/navigation';
import User from '@/models/User';
import connectToDatabase from '@/lib/db';
import PublicProfileContent from '@/components/profile/PublicProfileContent';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import mongoose from 'mongoose';

async function getUserData(userId: string) {
    try {
        await connectToDatabase();
        if (!userId || userId === 'undefined' || !mongoose.Types.ObjectId.isValid(userId)) {
            return null;
        }
        const user = await User.findById(userId).select('-password -otp -otpExpiry').lean();
        if (!user) return null;

        return JSON.parse(JSON.stringify(user));
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

export default async function PublicProfilePage({ params }: { params: { userId: string } }) {
    const { userId } = await params;
    const user = await getUserData(userId);

    if (!user) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white pt-28 pb-20 px-4 md:px-8 relative overflow-hidden selection:bg-cyan-500/30">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
                <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
            </div>

            <div className="max-w-7xl mx-auto">
                <PublicProfileContent user={user} />
            </div>
        </main>
    );
}
