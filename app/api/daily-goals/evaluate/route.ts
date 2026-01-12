import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import DailyGoal from '@/models/DailyGoal';
import Exam from '@/models/Exam';
import vertex_ai from '@/lib/gemini';
import User from '@/models/User';
import TestResult from '@/models/TestResult';
import { calculateLevel } from '@/lib/levelUtils';


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

export async function POST(request: Request) {
    try {
        const userPayload = await getUser();
        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { goalId, submissions, isDisqualified } = await request.json();

        await connectToDatabase();

        // Standardize User ID
        const activeUserId = String(userPayload.userId || userPayload.id || userPayload.sub);

        console.log(`[Evaluate API] GoalId: ${goalId}, UserId: ${activeUserId}, isDisqualified: ${isDisqualified}`);

        // Check if already passed or permanently disqualified
        const existingResult = await TestResult.findOne({ userId: activeUserId, goalId });
        console.log(`[Evaluate API] Existing result found: ${!!existingResult}, current cheatAttempts: ${existingResult?.cheatAttempts || 0}`);
        if (existingResult) {
            if (existingResult.status === 'disqualified') {
                return NextResponse.json({
                    error: 'You have been permanently disqualified from this test due to multiple anti-cheat violations.',
                    isPermanentlyDisqualified: true
                }, { status: 403 });
            }
            if (existingResult.status === 'passed') {
                return NextResponse.json({
                    error: 'You have already passed this test.',
                    status: 'passed'
                }, { status: 403 });
            }
        }

        // Handle Disqualification Submission (One cheat detected)
        if (isDisqualified) {
            const currentAttempts = (existingResult?.cheatAttempts || 0) + 1;
            const maxAttempts = 3;
            const isPermanentlyBlocked = currentAttempts >= maxAttempts;

            const updatedResult = await TestResult.findOneAndUpdate(
                { userId: activeUserId, goalId },
                {
                    $set: {
                        status: isPermanentlyBlocked ? 'disqualified' : 'failed',
                        score: 0,
                        completedAt: new Date()
                    },
                    $inc: { cheatAttempts: 1 }
                },
                { upsert: true, new: true }
            );

            return NextResponse.json({
                message: isPermanentlyBlocked ? 'Permanently Disqualified' : 'Cheat Detected',
                cheatAttempts: updatedResult.cheatAttempts,
                maxAttempts,
                isPermanentlyBlocked
            });
        }

        if (!goalId || !submissions || !Array.isArray(submissions)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let goal = await DailyGoal.findById(goalId).lean();
        let isExam = false;
        if (!goal) {
            goal = await Exam.findById(goalId).lean();
            isExam = true;
        }

        if (!goal) {
            return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }

        // Evaluation Logic
        const evaluationPromises = submissions.map(async (submission: any) => {
            const { questionIndex, userAnswer } = submission;
            const question = (goal as any).questions[questionIndex];
            if (!question) return null;

            // Handle MCQ Direct Evaluation
            if (question.type === 'MCQ') {
                const isCorrect = userAnswer === question.answer;
                return {
                    questionIndex,
                    precisionScore: isCorrect ? 100 : 0,
                    keywordScore: isCorrect ? 100 : 0,
                    qualityScore: isCorrect ? 100 : 0,
                    feedback: isCorrect ? "Correct answer!" : `Incorrect. The correct answer was option ${['A', 'B', 'C', 'D'].find((_, i) => question.options[i] === question.answer) || question.answer}.`,
                    isCorrect
                };
            }

            const prompt = `
            You are an expert academic evaluator. Evaluate the following student answer against the provided ideal answer and key points.
            
            Question: ${question.question}
            Ideal Answer: ${question.idealAnswer || question.answer}
            Key Points to look for: ${question.keyPoints ? question.keyPoints.join(', ') : 'N/A'}
            
            Student's Answer: "${userAnswer}"
            
            Provide your evaluation in STRICT JSON format:
            {
                "questionIndex": ${questionIndex},
                "precisionScore": number (0-100, how accurate and specific the answer is),
                "keywordScore": number (0-100, how many key points/terms were properly used),
                "qualityScore": number (0-100, overall depth and clarity),
                "feedback": "String (Constructive, encouraging feedback)",
                "isCorrect": boolean (true if overall score is >= 60)
            }
            
            ONLY return the JSON object. No other text.
            `;

            try {
                const generativeModel = vertex_ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const result = await generativeModel.generateContent(prompt);
                const response = await result.response;

                let text = "";
                if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
                    text = response.candidates[0].content.parts[0].text;
                } else {
                    return null;
                }

                const start = text.indexOf('{');
                const end = text.lastIndexOf('}');
                if (start === -1 || end === -1) return null;

                const jsonStr = text.substring(start, end + 1);
                const evalData = JSON.parse(jsonStr);

                return { ...evalData, questionIndex };
            } catch (err) {
                console.error(`Error evaluating question ${questionIndex}:`, err);
                return null;
            }
        });

        const rawResults = await Promise.all(evaluationPromises);
        const evaluations = rawResults.filter(r => r !== null);

        // Save Result (Passed/Failed)
        const passedCount = evaluations.filter((e: any) => e.isCorrect).length;
        const totalScore = passedCount;
        const passed = (passedCount / (goal as any).questions.length) >= 0.6;
        const currentAttempts = (existingResult?.cheatAttempts || 0) + 1;
        const maxAttempts = 3;
        const isPermanentlyBlocked = currentAttempts >= maxAttempts && !passed;

        const updatedResult = await TestResult.findOneAndUpdate(
            { userId: activeUserId, goalId },
            {
                $set: {
                    status: passed ? 'passed' : (isPermanentlyBlocked ? 'disqualified' : 'failed'),
                    score: totalScore,
                    completedAt: new Date()
                },
                $inc: { cheatAttempts: 1 }
            },
            { upsert: true, new: true }
        );

        // Update User Stats (XP or Rarity Points)
        let rewardType = 'none';
        let rewardValue: any = 0;

        if (passed) {
            const user = await User.findById(activeUserId);
            if (user) {
                if (!user.stats) user.stats = {};

                // 1. Rarity Points Reward (Exams Only)
                if (isExam && (goal as any).rarity) {
                    const rarityKey = (goal as any).rarity.toLowerCase();
                    if (!user.stats.rarityStats) user.stats.rarityStats = { uncommon: 0, rare: 0, epic: 0, legendary: 0 };

                    if (user.stats.rarityStats[rarityKey] !== undefined) {
                        user.stats.rarityStats[rarityKey] += 1;
                        rewardType = 'Rarity';
                        rewardValue = (goal as any).rarity;
                    }
                }

                // 2. XP Reward (Daily Goals and Exams)
                const xpToAdd = (goal as any).xp || 0;
                user.stats.xp = (user.stats.xp || 0) + xpToAdd;

                const today = new Date().toISOString().split('T')[0];
                if (!user.dailyStats) user.dailyStats = [];
                const dailyStat = user.dailyStats.find((d: any) => d.date === today);
                if (dailyStat) {
                    dailyStat.xpGained += xpToAdd;
                } else {
                    user.dailyStats.push({ date: today, timeSpent: 0, xpGained: xpToAdd });
                }

                // If it wasn't an exam, we mark XP as the primary reward type for the UI
                if (rewardType === 'none') {
                    rewardType = 'XP';
                    rewardValue = xpToAdd;
                }

                // Update Level
                user.stats.level = calculateLevel(user.stats.xp);

                await user.save();
            }
        }

        return NextResponse.json({
            evaluations,
            rewardType,
            rewardValue,
            cheatAttempts: updatedResult.cheatAttempts,
            maxAttempts: 3
        });

    } catch (error) {
        console.error('Error in evaluation API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
