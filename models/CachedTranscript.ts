import mongoose, { Schema, Document } from 'mongoose';

export interface ICachedTranscript extends Document {
    videoId: string;
    r2Key: string;
    transcriptPreview?: string;
    strategy: string;
    createdAt: Date;
    metadata?: {
        title?: string;
        duration?: number;
    };
}

const CachedTranscriptSchema: Schema = new Schema({
    videoId: { type: String, required: true, unique: true, index: true },
    r2Key: { type: String, required: true },
    transcriptPreview: { type: String, maxLength: 200 },
    strategy: { type: String, default: 'unknown' },
    createdAt: { type: Date, default: Date.now },
    metadata: {
        title: String,
        duration: Number
    }
});

// Create compound index if needed, but videoId unique is sufficient for now.
export default mongoose.models.CachedTranscript || mongoose.model<ICachedTranscript>('CachedTranscript', CachedTranscriptSchema);
