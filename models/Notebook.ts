import mongoose, { Schema, Document } from 'mongoose';

export interface INotebook extends Document {
    title: string;
    pdfUrl: string;
    pdfContent: string; // Extracted text for AI context
    chatHistory: {
        role: string;
        content: string;
        timestamp: Date;
    }[];
    annotations: Record<number, any[]>; // Page number -> Array of paths
    fileType: 'pdf' | 'docx';
    contentHtml?: string;
    createdAt: Date;
}

const NotebookSchema: Schema = new Schema({
    title: { type: String, required: true },
    userId: { type: String, required: true, index: true }, // Linked to User._id
    pdfUrl: { type: String, required: true },
    pdfContent: { type: String, default: '' },
    // chatHistory moved to separate Chat model
    // chatHistory: [{
    //     role: { type: String, required: true },
    //     content: { type: String, required: true },
    //     timestamp: { type: Date, default: Date.now }
    // }],
    annotations: { type: Map, of: [Object], default: {} },
    fileType: { type: String, enum: ['pdf', 'docx'], default: 'pdf' },
    contentHtml: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Notebook || mongoose.model<INotebook>('Notebook', NotebookSchema);
