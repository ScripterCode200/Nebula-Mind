import mongoose, { Schema, Document } from 'mongoose';

export interface IAISession extends Document {
    sessionId: string; // The custom ID (DDMMYYYY...)
    notebookId: string;
    userId: string;
    config: {
        teachingStyle: string;
        pace: string;
        language: string;
        voiceStyle: string;
        duration: string;
        customHours: number;
        customMinutes: number;
        focusTopic: string;
    };
    topicTree: any[];
    cacheName?: string;
    status: 'active' | 'completed';
    lastActiveAt: Date;
    durationMinutes: number;
    createdAt: Date;
    expiresAt: Date;
}

const AISessionSchema: Schema = new Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    notebookId: { type: Schema.Types.ObjectId, ref: 'Notebook', required: true },
    userId: { type: String, required: true, index: true },
    config: {
        teachingStyle: String,
        pace: String,
        language: String,
        voiceStyle: String,
        duration: String,
        customHours: Number,
        customMinutes: Number,
        focusTopic: String
    },
    topicTree: { type: [Object], default: [] },
    cacheName: String,
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    lastActiveAt: { type: Date, default: Date.now },
    durationMinutes: { type: Number, default: 30 },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { 
        type: Date, 
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
});

if (mongoose.models.AISession) {
    delete mongoose.models.AISession;
}

export default mongoose.model<IAISession>('AISession', AISessionSchema);
