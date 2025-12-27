import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import Exam from '@/models/Exam';
import TestResult from '@/models/TestResult';

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

export async function GET() {
    try {
        await connectToDatabase();
        const exams = await Exam.find({ isActive: true }).sort({ createdAt: -1 }).lean();

        let completedExamIds: string[] = [];
        const user = await getUser();

        if (user) {
            const userId = user.userId || user.id || user.sub;
            const results = await TestResult.find({
                userId: String(userId),
                goalId: { $in: exams.map((e: any) => e._id.toString()) },
                status: 'passed'
            }).lean();
            completedExamIds = results.map((r: any) => r.goalId.toString());
        }

        const uncompletedExams = exams.filter((exam: any) =>
            !completedExamIds.includes(exam._id.toString())
        );

        return NextResponse.json({ exams: uncompletedExams });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        // Basic validation
        if (!body.title || !body.questions || body.questions.length === 0) {
            return NextResponse.json({ error: 'Invalid exam data' }, { status: 400 });
        }

        await connectToDatabase();

        const newExam = await Exam.create({
            ...body,
            createdBy: user.userId || user.sub, // robust ID check
        });

        return NextResponse.json({ exam: newExam, message: 'Exam created successfully' });

    } catch (error) {
        console.error("Exam creation failed:", error);
        return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Exam ID required' }, { status: 400 });
        }

        await connectToDatabase();
        const deletedExam = await Exam.findByIdAndDelete(id);

        if (!deletedExam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Exam deleted successfully' });

    } catch (error) {
        console.error("Exam deletion failed:", error);
        return NextResponse.json({ error: 'Failed to delete exam' }, { status: 500 });
    }
}
