import mongoose, { Schema, Document } from 'mongoose';

export interface IFlashcard extends Document {
    notebookId: mongoose.Schema.Types.ObjectId;
    front: string;
    back: string;
    createdAt: Date;
}

const FlashcardSchema: Schema = new Schema({
    notebookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notebook', required: true },
    front: { type: String, required: true },
    back: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Flashcard || mongoose.model<IFlashcard>('Flashcard', FlashcardSchema);
