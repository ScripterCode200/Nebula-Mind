import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import DailyGoal from '@/models/DailyGoal';
import Exam from '@/models/Exam';
import TestResult from '@/models/TestResult';
import TestRunnerWrapper from '@/app/test/[goalId]/TestRunnerWrapper';
import { DailyGoal as IDailyGoal } from '@/app/explore/types';

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

export default async function TestPage({ params }: { params: Promise<{ goalId: string }> }) {
    const userPayload = await getUser();
    if (!userPayload) {
        redirect('/login');
    }

    const { goalId } = await params;
    await connectToDatabase();

    // 1. Try Fetching Daily Goal (Personal)
    let goalDoc = await DailyGoal.findOne({
        _id: goalId,
        userId: userPayload.userId || userPayload.id || userPayload.sub
    }).lean();

    let isExam = false;

    // 2. If not found, Try Fetching Public Exam
    if (!goalDoc) {
        const examDoc = await Exam.findById(goalId).lean();
        if (examDoc) {
            goalDoc = examDoc;
            isExam = true;
        }
    }

    if (!goalDoc) {
        redirect('/explore');
    }

    // Security: Prevent retaking passed tests
    const userId = String(userPayload.userId || userPayload.id || userPayload.sub);
    const previousResult = await TestResult.findOne({
        userId: userId,
        goalId: goalDoc._id.toString(),
        status: 'passed'
    });

    if (previousResult) {
        redirect('/explore');
    }

    // Deeply sanitize and normalize properties
    const questions = goalDoc.questions.map((q: any) => ({
        question: q.question,
        type: q.type,
        options: q.options ? JSON.parse(JSON.stringify(q.options)) : [],
        // Unify Answer Fields: DailyGoal uses idealAnswer/explanation, Exam uses answer
        idealAnswer: q.idealAnswer || q.answer,
        keyPoints: q.keyPoints ? JSON.parse(JSON.stringify(q.keyPoints)) : [],
        explanation: q.explanation || "No explanation provided.",
        id: q._id ? q._id.toString() : undefined
    }));

    const questionsCount = goalDoc.questionsCount || (goalDoc.questions ? goalDoc.questions.length : 0);
    // XP mapping for Exams if not stored directly
    const xp = goalDoc.xp || (goalDoc.rarity === 'Legendary' ? 5000 : 500);

    const goal: IDailyGoal = {
        id: goalDoc._id.toString(),
        title: goalDoc.title,
        description: goalDoc.description,
        subject: goalDoc.subject,
        difficulty: (goalDoc.difficulty || goalDoc.rarity || 'Uncommon') as any, // Fallback for Exam rarity
        estimatedTime: goalDoc.estimatedTime || goalDoc.duration, // Map duration
        questionsCount: questionsCount,
        xp: xp,
        duration: goalDoc.estimatedTime || goalDoc.duration,
        completed: goalDoc.completed || false,
        // Serialize Dates
        createdAt: goalDoc.createdAt?.toISOString(),
        updatedAt: goalDoc.updatedAt?.toISOString(),
        date: goalDoc.date?.toISOString(),
        // Sanitize Questions Array
        questions: questions,
        isExam: isExam,
    } as any;

    return <TestRunnerWrapper goal={goal} />;
}
