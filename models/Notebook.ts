import mongoose, { Schema, Document } from 'mongoose';

export interface ISource {
    _id?: string;
    type: 'pdf' | 'youtube' | 'docx';
    name: string;
    fileKey?: string;
    contentKey: string;
    addedAt: Date;
    size?: number;
    url?: string;
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
    fileType: 'pdf' | 'docx' | 'text';
    contentHtml?: string;
    createdAt: Date;
    sharedWith: {
        userId: string;
        sharedAt: Date;
        permission: string;
    }[];
}

const NotebookSchema: Schema = new Schema({
    title: { type: String, required: true },
    userId: { type: String, required: true, index: true }, // Linked to User._id
    pdfUrl: { type: String, default: '' }, // Could be empty if created from YouTube/text content directly
    pdfContent: { type: String, default: '' },
    storageProvider: { type: String, enum: ['mongo', 'r2'], default: 'mongo' },
    pdfKey: { type: String },
    contentKey: { type: String },
    sources: [{
        type: { type: String, enum: ['pdf', 'youtube', 'docx'], default: 'pdf' },
        name: { type: String, required: true },
        fileKey: { type: String }, // R2 Key for the PDF (Optional for YouTube)
        contentKey: { type: String, required: true }, // R2 Key for the extracted text
        addedAt: { type: Date, default: Date.now },
        size: Number,
        url: String // External URL (e.g. YouTube link)
    }],
    // chatHistory moved to separate Chat model
    // chatHistory: [{
    //     role: { type: String, required: true },
    //     content: { type: String, required: true },
    //     timestamp: { type: Date, default: Date.now }
    // }],
    annotations: { type: Map, of: [Object], default: {} },
    fileType: { type: String, enum: ['pdf', 'docx', 'text', 'youtube'], default: 'pdf' },
    contentHtml: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    sharedWith: [{
        userId: { type: String, required: true },
        sharedAt: { type: Date, default: Date.now },
        permission: { type: String, default: 'view' }
    }]
});

export default mongoose.models.Notebook || mongoose.model<INotebook>('Notebook', NotebookSchema);
