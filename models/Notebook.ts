import mongoose, { Schema, Document } from 'mongoose';

export interface ISource {
    _id?: string;
    type: 'pdf';
    name: string;
    fileKey: string;
    contentKey: string;
    addedAt: Date;
    size?: number;
}

export interface INotebook extends Document {
    title: string;
    pdfUrl: string;
    pdfContent: string; // Extracted text (Legacy or R2 fetched)
    storageProvider: 'mongo' | 'r2';
    pdfKey?: string;
    contentKey?: string;
    sources?: ISource[];
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
    storageProvider: { type: String, enum: ['mongo', 'r2'], default: 'mongo' },
    pdfKey: { type: String },
    contentKey: { type: String },
    sources: [{
        type: { type: String, enum: ['pdf'], default: 'pdf' },
        name: { type: String, required: true },
        fileKey: { type: String, required: true }, // R2 Key for the PDF
        contentKey: { type: String, required: true }, // R2 Key for the extracted text
        addedAt: { type: Date, default: Date.now },
        size: Number
    }],
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
