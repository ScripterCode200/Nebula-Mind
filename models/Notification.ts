import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    recipientId: string; // User ID (String from Clerk/Auth)
    senderId?: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'SHARE_NOTEBOOK';
    notebookId?: string;
    link?: string;
    isRead: boolean;
    scheduledFor?: Date;
    createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
    recipientId: { type: String, required: true, index: true },
    senderId: { type: String },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error', 'SHARE_NOTEBOOK'],
        default: 'info'
    },
    notebookId: { type: String },
    link: { type: String },
    isRead: { type: Boolean, default: false },
    scheduledFor: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

// Index for efficient querying of user's notifications
NotificationSchema.index({ recipientId: 1, scheduledFor: -1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
