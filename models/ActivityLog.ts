import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
    userId: mongoose.Types.ObjectId;
    action: string;
    entityId?: mongoose.Types.ObjectId;
    entityType?: string;
    metadata?: any;
    createdAt: Date;
}

const ActivityLogSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true }, // e.g., 'create_notebook', 'heartbeat', 'login'
    entityId: { type: Schema.Types.ObjectId },
    entityType: { type: String }, // 'Notebook', 'MockTest'
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now, index: { expires: '90d' } } // TTL Index: Auto-delete after 90 days
});

export default mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
