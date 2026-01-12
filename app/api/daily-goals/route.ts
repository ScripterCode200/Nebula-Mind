import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import DailyGoal from '@/models/DailyGoal';
import User from '@/models/User';
import TestResult from '@/models/TestResult';
import SystemSetting from '@/models/SystemSetting';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { generateSingleGoal, GoalPreference } from '@/lib/ai/generator';
import UserPDF from '@/models/UserPDF';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { parsePDF } from '@/lib/pdf-parser';
import { Readable } from 'stream';

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
const DEFAULT_PREFERENCES: GoalPreference[] = [
    { id: 1, enabled: true, subject: 'Physics', difficulty: 'Hard', topic: 'Quantum Mechanics', isTimeBound: true },
    { id: 2, enabled: true, subject: 'Math', difficulty: 'Hard', topic: 'Calculus', isTimeBound: true },
    { id: 3, enabled: true, subject: 'Chemistry', difficulty: 'Medium', topic: 'Organic Chemistry', isTimeBound: true },
    { id: 4, enabled: true, subject: 'Biology', difficulty: 'Medium', topic: 'Genetics', isTimeBound: true },
    { id: 5, enabled: true, subject: 'CS', difficulty: 'Easy', topic: 'Python Basics', isTimeBound: true },
    { id: 6, enabled: true, subject: 'History', difficulty: 'Easy', topic: 'World War II', isTimeBound: true },
    { id: 7, enabled: true, subject: 'English', difficulty: 'Easy', topic: 'Grammar', isTimeBound: true },
];

// Helper to convert stream to buffer
async function streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

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
            // Self-Correction: Deduplicate by slotIndex
            const uniqueGoals: any[] = [];
            const duplicatesToDelete: string[] = [];
            const seenSlots = new Set<number>();

            // Sort by creation time (keep oldest or newest? Let's keep oldest stable)
            goals.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            goals.forEach((g: any) => {
                if (typeof g.slotIndex === 'number') {
                    if (seenSlots.has(g.slotIndex)) {
                        duplicatesToDelete.push(g._id.toString());
                    } else {
                        seenSlots.add(g.slotIndex);
                        uniqueGoals.push(g);
                    }
                } else {
                    // Legacy goals without slotIndex: allow them but maybe limit total?
                    // For now, just include them.
                    uniqueGoals.push(g);
                }
            });

            // Async cleanup (don't block response too long, but await to ensure safety)
            if (duplicatesToDelete.length > 0) {
                console.log(`[DailyGoals] Cleaning up ${duplicatesToDelete.length} duplicates...`);
                await DailyGoal.deleteMany({ _id: { $in: duplicatesToDelete } });
            }

            // Check Status for UNIQUE goals
            const results = await TestResult.find({
                userId: userId,
                goalId: { $in: uniqueGoals.map((g: any) => g._id.toString()) }
            }).lean();

            const resultMap = new Map();
            results.forEach((r: any) => resultMap.set(r.goalId.toString(), r));

            const goalsWithStatus = uniqueGoals.map((g: any) => {
                const res = resultMap.get(g._id.toString());
                return {
                    ...g,
                    id: g._id.toString(),
                    completed: res?.status === 'passed',
                    status: res?.status || 'pending',
                    cheatAttempts: res?.cheatAttempts || 0,
                    maxAttempts: 3,
                    isTimeBound: g.isTimeBound ?? true
                };
            });

            return NextResponse.json({ goals: goalsWithStatus });
        }

        // Return empty if no goals found
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
        // Use Gemini 2.0 Flash as the default stable model
        const DEFAULT_MODEL = 'gemini-2.0-flash';
        let aiModel = systemSetting?.aiModel || DEFAULT_MODEL;

        // Map older/simpler names to valid Vertex AI IDs
        const modelMap: Record<string, string> = {
            'gemini-2.5-flash': 'gemini-2.0-flash',
            'gemini-2.0-flash': 'gemini-2.0-flash',
            'gemini-2.0-flash-001': 'gemini-2.0-flash',
            'gemini-1.5-flash': 'gemini-2.0-flash',
            'gemini-1.5-flash-001': 'gemini-2.0-flash',
            'gemini-1.5-flash-002': 'gemini-2.0-flash',
        };
        if (modelMap[aiModel]) aiModel = modelMap[aiModel];

        // 2. Determine Preference for this Slot
        const prefIndex = index % prefsToUse.length;
        const pref = prefsToUse[prefIndex];
        let contextText = undefined;
        let finalSubject = pref.subject;

        // Check if subject is a PDF reference
        if (pref.subject && pref.subject.startsWith('PDF:')) {
            try {
                const pdfId = pref.subject.split('PDF:')[1];
                console.log(`[DailyGoals] Slot ${index} uses PDF source: ${pdfId}`);

                const pdfDoc = await UserPDF.findById(pdfId);
                if (pdfDoc) {
                    finalSubject = pdfDoc.filename; // Use filename as subject
                    pref.subject = pdfDoc.filename; // Update pref object too for generator

                    console.log(`[DailyGoals] Fetching PDF from R2: ${pdfDoc.r2Key}`);

                    const pdfObj = await r2Client.send(new GetObjectCommand({
                        Bucket: R2_BUCKET_NAME,
                        Key: pdfDoc.r2Key
                    }));

                    if (pdfObj.Body) {
                        const buffer = await streamToBuffer(pdfObj.Body as Readable);
                        console.log(`[DailyGoals] Parsing PDF buffer: ${buffer.length} bytes`);
                        contextText = await parsePDF(buffer);
                        console.log(`[DailyGoals] Context extracted, length: ${contextText.length}`);
                    }
                } else {
                    console.warn(`[DailyGoals] Referenced PDF ${pdfId} not found in DB`);
                }
            } catch (err) {
                console.error(`[DailyGoals] Error processing PDF source:`, err);
                // Fallback to generating without context, maybe set subject to "General"
            }
        }

        // 2a. Check for duplicate usage of this PDF in the last 4 days
        // This ensures the model rotates through different questions for the same content.
        let previousQuestions: string[] = [];
        if (pref.subject && pref.subject.startsWith('PDF:')) {
            const historyStart = subDays(start, 3); // Look back 3 days + today = 4 days
            const recentGoals = await DailyGoal.find({
                userId: userId,
                date: { $gte: historyStart, $lte: endOfDay(istDate) }
            });

            recentGoals.forEach((g: any) => {
                if (g.subject === finalSubject && g.questions && Array.isArray(g.questions)) {
                    g.questions.forEach((q: any) => {
                        if (q.question) previousQuestions.push(q.question);
                    });
                }
            });

            console.log(`[DailyGoals] Found ${previousQuestions.length} historical questions for subject '${finalSubject}' in the last 4 days.`);
        }

        console.log(`Generating single goal [slot ${index}] for user ${userId} using ${aiModel}...`);

        // 3. Generate 
        let attempts = 0;
        let goal: any = null;

        while (attempts < 2 && !goal) {
            try {
                goal = await generateSingleGoal(pref, aiModel, contextText, previousQuestions);
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
            slotIndex: index, // Save the slot index for future checks
            isTimeBound: pref.isTimeBound ?? true
        };

        const savedGoal = await DailyGoal.create(newGoalData);

        return NextResponse.json({ goal: savedGoal });

    } catch (error) {
        console.error('Error generating single goal:', error);
        return NextResponse.json({ error: 'Failed to generate goal' }, { status: 500 });
    }
}
