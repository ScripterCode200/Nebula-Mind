import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
    notebookId: mongoose.Schema.Types.ObjectId;
    title: string;
    content: string;
    type: 'brief' | 'detailed' | 'bullet-points';
    createdAt: Date;
}

const NoteSchema: Schema = new Schema({
    notebookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notebook', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['brief', 'detailed', 'bullet-points'], required: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);
