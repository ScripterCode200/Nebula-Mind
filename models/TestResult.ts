import mongoose from 'mongoose';

const TestResultSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    goalId: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['passed', 'failed', 'disqualified'],
        required: true
    },
    score: {
        type: Number,
        default: 0
    },
    cheatAttempts: {
        type: Number,
        default: 0
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Compound index to ensure unique result per user per goal? 
// Or allow retries if failed? User said "cannot give that *particular* test again" if disqualified.
// Let's index for quick lookups.
TestResultSchema.index({ userId: 1, goalId: 1 });

export default mongoose.models.TestResult || mongoose.model('TestResult', TestResultSchema);
