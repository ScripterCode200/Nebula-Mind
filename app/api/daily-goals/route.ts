import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import DailyGoal from '@/models/DailyGoal';
import User from '@/models/User';
import TestResult from '@/models/TestResult';
import SystemSetting from '@/models/SystemSetting';
import { startOfDay, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { generateSingleGoal } from '@/lib/ai/generator';
import { GoalPreference } from '@/lib/ai/generator'; // Import the type if needed, or assume it matches

const IST_TIMEZONE = 'Asia/Kolkata';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

async function getUser() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return null;
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (e) {
        return null;
    }
}

// Fallback preferences if user hasn't set any
const DEFAULT_PREFERENCES = [
    { id: 1, enabled: true, subject: 'Physics', difficulty: 'Hard', topic: 'Quantum Mechanics', isTimeBound: true },
    { id: 2, enabled: true, subject: 'Math', difficulty: 'Hard', topic: 'Calculus', isTimeBound: true },
    { id: 3, enabled: true, subject: 'Chemistry', difficulty: 'Medium', topic: 'Organic Chemistry', isTimeBound: true },
    { id: 4, enabled: true, subject: 'Biology', difficulty: 'Medium', topic: 'Genetics', isTimeBound: true },
    { id: 5, enabled: true, subject: 'CS', difficulty: 'Easy', topic: 'Python Basics', isTimeBound: true },
    { id: 6, enabled: true, subject: 'History', difficulty: 'Easy', topic: 'World War II', isTimeBound: true },
    { id: 7, enabled: true, subject: 'English', difficulty: 'Easy', topic: 'Grammar', isTimeBound: true },
];

export async function GET() {
    try {
        const userPayload = await getUser();
        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        // Get current time in IST
        const now = new Date();
        const istDate = toZonedTime(now, IST_TIMEZONE);

        // Use a wide window for "Today" in IST to avoid boundary issues
        const start = startOfDay(istDate);
        const end = endOfDay(istDate);

        // Standardize User ID Logic (Sync with POST)
        const rawUserId = userPayload.userId || userPayload.id || userPayload.sub;
        const userId = String(rawUserId);

        console.log(`[DailyGoals GET] Searching for goals with userId: ${userId} (type: ${typeof userId})`);

        // Check if goals exist for today (in IST) for THIS USER
        let goals = await DailyGoal.find({
            userId: userId,
            date: {
                $gte: start,
                $lte: end
            }
        }).lean();

        console.log(`[DailyGoals] Date Check:`);
        console.log(`  IST Now: ${istDate.toISOString()}`);
        console.log(`  Query Start: ${start.toISOString()}`);
        console.log(`  Query End: ${end.toISOString()}`);
        console.log(`  Found Goals: ${goals.length}`);

        if (goals.length > 0) {
            // Check Completion Status
            const results = await TestResult.find({
                userId: userId,
                goalId: { $in: goals.map((g: any) => g._id.toString()) },
                status: 'passed'
            }).lean();

            const completedIds = results.map((r: any) => r.goalId.toString());

            const uncompletedGoals = goals.filter((g: any) => !completedIds.includes(g._id.toString()));

            return NextResponse.json({ goals: uncompletedGoals });
        }

        // Return empty if no goals found (Frontend will handle generation)
        return NextResponse.json({ goals: [] });

    } catch (error) {
        console.error('Error fetching/seeding daily goals:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userPayload = await getUser();
        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { index } = body;

        if (typeof index !== 'number') {
            return NextResponse.json({ error: 'Invalid index' }, { status: 400 });
        }

        await connectToDatabase();

        // Get current time in IST
        const now = new Date();
        const istDate = toZonedTime(now, IST_TIMEZONE);
        const start = startOfDay(istDate);

        // 1. Fetch User Preferences and Settings
        // Ensure we retrieve the ID correctly from payload (handled as userId or id usually)
        const rawUserId = userPayload.userId || userPayload.id || userPayload.sub;
        const userId = String(rawUserId);

        console.log(`[DailyGoals] POST Request - User: ${userId}, Slot: ${index}`);

        // IDEMPOTENCY CHECK (Check-Then-Act)
        // Before burning API tokens, check if this slot is already filled for today
        const existingGoal = await DailyGoal.findOne({
            userId: userId,
            date: start,
            slotIndex: index
        });

        if (existingGoal) {
            console.log(`[DailyGoals] Idempotency: Goal already exists for slot ${index}. Returning existing.`);
            return NextResponse.json({ goal: existingGoal });
        }

        console.log(`[DailyGoals] Slot ${index} is empty. Proceeding to generate...`);

        const user = await User.findById(userId);
        let preferences = user?.dailyGoalPreferences || [];
        if (!preferences || preferences.length === 0) preferences = DEFAULT_PREFERENCES;

        const activePrefs = preferences.filter((p: any) => p.enabled);
        const prefsToUse = activePrefs.length > 0 ? activePrefs : DEFAULT_PREFERENCES;

        const systemSetting = await SystemSetting.findOne({ key: 'global' });
        // Default to 2.5 Flash as requested
        const DEFAULT_MODEL = 'gemini-2.5-flash';
        let aiModel = systemSetting?.aiModel || DEFAULT_MODEL;

        // Map older/simpler names to the specific valid Vertex ID if needed
        const modelMap: Record<string, string> = {
            'gemini-2.0-flash': 'gemini-2.5-flash',
            'gemini-2.0-flash-001': 'gemini-2.5-flash',
            'gemini-1.5-flash': 'gemini-2.5-flash',
            'gemini-1.5-flash-001': 'gemini-2.5-flash', // Force upgrade as 1.5 is 404ing
        };
        if (modelMap[aiModel]) aiModel = modelMap[aiModel];

        // 2. Determine Preference for this Slot
        const prefIndex = index % prefsToUse.length;
        const pref = prefsToUse[prefIndex];

        console.log(`Generating single goal [slot ${index}] for user ${userId} using ${aiModel}...`);

        // 3. Generate 
        let attempts = 0;
        let goal: any = null;

        while (attempts < 2 && !goal) {
            try {
                goal = await generateSingleGoal(pref, aiModel);
            } catch (err) {
                attempts++;
                console.warn(`Slot ${index} failed attempt ${attempts}:`, err);
            }
        }

        if (!goal) {
            throw new Error("Failed to generate goal after retries");
        }

        // 4. Save
        const finalUserId = String(userId);
        console.log(`[DailyGoals] Saving goal with userId: ${finalUserId} (original type: ${typeof userId})`);

        const newGoalData = {
            ...goal,
            userId: finalUserId,
            date: start, // Force it to start of IST day
            slotIndex: index // Save the slot index for future checks
        };

        const savedGoal = await DailyGoal.create(newGoalData);

        return NextResponse.json({ goal: savedGoal });

    } catch (error) {
        console.error('Error generating single goal:', error);
        return NextResponse.json({ error: 'Failed to generate goal' }, { status: 500 });
    }
}
