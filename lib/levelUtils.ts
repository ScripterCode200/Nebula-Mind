export const LEVEL_CONSTANT = 100;

/**
 * Calculates the player's level based on total XP using a quadratic curve.
 * Formula: Level = floor(sqrt(XP / 100)) + 1
 * 
 * scaling:
 * - Level 1: 0 XP
 * - Level 2: 100 XP
 * - Level 10: 8,100 XP
 * - Level 50: 240,100 XP
 * - Level 100: 980,100 XP
 */
export function calculateLevel(xp: number): number {
    if (xp < 0) return 1;
    return Math.floor(Math.sqrt(xp / LEVEL_CONSTANT)) + 1;
}

/**
 * Calculates the total XP required to reach a specific level.
 * Formula: XP = 100 * (Level - 1)^2
 */
export function calculateXpForLevel(level: number): number {
    if (level <= 1) return 0;
    return LEVEL_CONSTANT * Math.pow(level - 1, 2);
}

/**
 * Calculates progress towards the next level as a percentage (0-100).
 */
export function calculateLevelProgress(xp: number): number {
    const currentLevel = calculateLevel(xp);
    const nextLevel = currentLevel + 1;

    const xpForCurrent = calculateXpForLevel(currentLevel);
    const xpForNext = calculateXpForLevel(nextLevel);

    const xpIntoLevel = xp - xpForCurrent;
    const xpNeeded = xpForNext - xpForCurrent;

    if (xpNeeded === 0) return 100; // Cap

    return Math.min(100, Math.max(0, (xpIntoLevel / xpNeeded) * 100));
}

export const RANKS = [
    {
        name: 'Beginner',
        minXp: 0,
        color: '#CBD5E1',
        secondaryColor: '#64748B',
        gradient: 'from-slate-200 via-slate-400 to-slate-500',
        glow: 'rgba(203, 213, 225, 0.4)'
    },
    {
        name: 'Scholar',
        minXp: 1000,
        color: '#34D399',
        secondaryColor: '#059669',
        gradient: 'from-emerald-300 via-emerald-500 to-green-600',
        glow: 'rgba(52, 211, 153, 0.5)'
    },
    {
        name: 'Expert',
        minXp: 5000,
        color: '#A78BFA',
        secondaryColor: '#7C3AED',
        gradient: 'from-violet-300 via-purple-500 to-indigo-600',
        glow: 'rgba(167, 139, 250, 0.6)'
    },
    {
        name: 'Master',
        minXp: 15000,
        color: '#FBBF24',
        secondaryColor: '#D97706',
        gradient: 'from-amber-200 via-yellow-500 to-orange-600',
        glow: 'rgba(251, 191, 36, 0.7)'
    },
];

export function getRank(xp: number) {
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (xp >= RANKS[i].minXp) {
            return RANKS[i];
        }
    }
    return RANKS[0];
}
