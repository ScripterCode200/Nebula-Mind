import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId; // User ID
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
    isRead: boolean;
    scheduledFor?: Date;
    createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error'],
        default: 'info'
    },
    link: { type: String },
    isRead: { type: Boolean, default: false },
    scheduledFor: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

// Index for efficient querying of user's notifications
NotificationSchema.index({ recipient: 1, scheduledFor: -1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
