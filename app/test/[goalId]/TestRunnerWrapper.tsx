'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import TestRunner from '@/components/explore/TestRunner';
import { DailyGoal } from '@/app/explore/types';

export default function TestRunnerWrapper({ goal }: { goal: DailyGoal }) {
    const router = useRouter();

    const handleClose = () => {
        router.push('/explore');
    };

    const handleComplete = (score: number, passed: boolean) => {
        // We could show a specific result page here or redirect
        // For now, let's redirect to explore after a short delay or let the user click "Close" in the runner
        // The TestRunner itself handles the "Results" view state internally. 
        // When the user clicks "Close" or "Claim Rewards" in the Runner's result view, this close handler is called.
        // So we just need to ensure TestRunner calls onClose eventually.

        // Wait, TestRunner's "Close" button calls onClose. 
        // Logic inside TestRunner: 
        // If state is 'results', rendering results view. Button "Close" calls `closeTest` -> `onComplete`.
        // So `onComplete` is where we should navigate.
        router.push('/explore');
    };

    return (
        <TestRunner
            goal={goal}
            onClose={handleClose}
            onComplete={handleComplete}
        />
    );
}
