import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
}

export interface IChat extends Document {
    notebookId: mongoose.Schema.Types.ObjectId;
    messages: IMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema({
    role: { type: String, required: true, enum: ['user', 'ai'] },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const ChatSchema: Schema = new Schema({
    notebookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notebook', required: true, unique: true },
    messages: [MessageSchema],
}, { timestamps: true });

export default mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);
