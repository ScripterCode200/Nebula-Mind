import mongoose from 'mongoose';

const DailyGoalSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title for the goal.'],
        maxlength: [200, 'Title cannot be more than 100 characters'],
    },
    description: {
        type: String,
        required: [true, 'Please provide a description.'],
    },
    subject: {
        type: String,
        required: [true, 'Please provide a subject.'],
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true,
    },
    estimatedTime: {
        type: String,
        required: true,
    },
    questionsCount: {
        type: Number,
        required: true,
    },
    xp: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        required: true,
        index: true, // For querying by date
    },
    slotIndex: {
        type: Number,
        required: false, // Optional to support legacy goals without slotIndex
        index: true
    },
    userId: {
        type: String, // Changed from ObjectId to String to match our String(userId) logic
        required: false // Optional for now to support global goals if needed, or migration
    },
    isTimeBound: {
        type: Boolean,
        default: true
    },
    questions: [{
        question: { type: String, required: true },
        type: { type: String, enum: ['MCQ', 'LongAnswer'], default: 'LongAnswer' },
        options: [{ type: String, required: false }], // Optional for LongAnswer
        answer: { type: String, required: false }, // For MCQ or reference
        idealAnswer: { type: String, required: false }, // For LongAnswer evaluation
        keyPoints: [{ type: String, required: false }], // For LongAnswer evaluation
        explanation: { type: String }
    }]
}, { timestamps: true });

export default mongoose.models.DailyGoal || mongoose.model('DailyGoal', DailyGoalSchema);
