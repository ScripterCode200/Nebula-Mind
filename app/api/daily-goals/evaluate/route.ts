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

        // Check if already taken
        const existingResult = await TestResult.findOne({ userId: activeUserId, goalId });
        if (existingResult && existingResult.status === 'disqualified') {
            return NextResponse.json({ error: 'You have been disqualified from this test.' }, { status: 403 });
        }

        // Handle Disqualification Submission
        if (isDisqualified) {
            await TestResult.create({
                userId: activeUserId,
                goalId,
                status: 'disqualified',
                score: 0
            });
            return NextResponse.json({ message: 'Disqualification recorded' });
        }

        if (!goalId || !submissions || !Array.isArray(submissions)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let goal = await DailyGoal.findById(goalId).lean();
        let isExam = false;

        if (!goal) {
            goal = await Exam.findById(goalId).lean();
            if (goal) isExam = true;
        }

        // Robust check: if it has rarity, it's an exam
        if (goal && (goal as any).rarity) {
            isExam = true;
            console.log("Identified as Exam via rarity:", (goal as any).rarity);
        }
        if (!goal) {
            return NextResponse.json({ error: 'Goal/Exam not found' }, { status: 404 });
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
                const generativeModel = vertex_ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
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

        // Update or Create Result
        await TestResult.findOneAndUpdate(
            { userId: activeUserId, goalId },
            {
                status: passed ? 'passed' : 'failed',
                score: totalScore,
                completedAt: new Date()
            },
            { upsert: true }
        );

        // Update User Stats (XP or Rarity Points)
        let rewardType = 'none';
        let rewardValue: any = 0;

        if (passed) {
            const user = await User.findById(activeUserId);
            if (user) {
                if (isExam && (goal as any).rarity) {
                    const rarityKey = (goal as any).rarity.toLowerCase();
                    if (!user.stats) user.stats = {};
                    if (!user.stats.rarityStats) user.stats.rarityStats = { uncommon: 0, rare: 0, epic: 0, legendary: 0 };

                    if (user.stats.rarityStats[rarityKey] !== undefined) {
                        user.stats.rarityStats[rarityKey] += 1;
                        rewardType = 'Rarity';
                        rewardValue = (goal as any).rarity;
                    }
                } else {
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

                    rewardType = 'XP';
                    rewardValue = xpToAdd;

                    // Update Level
                    user.stats.level = calculateLevel(user.stats.xp);
                }
                await user.save();

            }
        }

        return NextResponse.json({ evaluations, rewardType, rewardValue });

    } catch (error) {
        console.error('Error in evaluation API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
