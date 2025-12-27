import mongoose from 'mongoose';

const ExamSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title.'],
        maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    description: {
        type: String,
        required: [true, 'Please provide a description.'],
    },
    subject: {
        type: String,
        required: [true, 'Please provide a subject.'],
    },
    duration: {
        type: String, // e.g., "45 mins"
        required: true,
    },
    rarity: {
        type: String,
        enum: ['Uncommon', 'Rare', 'Epic', 'Legendary'],
        default: 'Uncommon',
        required: true,
    },
    questions: [{
        question: { type: String, required: true },
        type: { type: String, enum: ['MCQ', 'LongAnswer'], default: 'MCQ' },
        options: [{ type: String }], // Comma separated or array? We'll use array of strings
        answer: { type: String }, // Correct option or answer key
    }],
    createdBy: {
        type: String, // User ID
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default mongoose.models.Exam || mongoose.model('Exam', ExamSchema);
