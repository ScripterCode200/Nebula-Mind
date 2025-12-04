import mongoose, { Schema, Document } from 'mongoose';

export interface IMockTest extends Document {
    notebookId: mongoose.Schema.Types.ObjectId;
    questions: {
        question: string;
        options?: string[];
        answer: string; // Correct answer or explanation
        type: 'mcq' | 'true-false' | 'short' | 'long';
    }[];
    userAnswers?: Record<string, string>;
    gradingResults?: Record<string, { score: number; feedback: string }>;
    score?: number;
    createdAt: Date;
}

const MockTestSchema: Schema = new Schema({
    notebookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notebook', required: true },
    questions: [{
        question: { type: String, required: true },
        options: [String],
        answer: { type: String, required: true },
        type: { type: String, enum: ['mcq', 'true-false', 'short', 'long'], required: true },
    }],
    userAnswers: { type: Map, of: String }, // Map of question index to user answer
    gradingResults: { type: Map, of: new Schema({ score: Number, feedback: String }) }, // Map of question index to result
    score: { type: Number },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.MockTest || mongoose.model<IMockTest>('MockTest', MockTestSchema);
