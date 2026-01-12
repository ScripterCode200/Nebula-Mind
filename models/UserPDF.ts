import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserPDF extends Document {
    userId: mongoose.Types.ObjectId;
    filename: string;
    r2Key: string;
    fileSize: number;
    uploadedAt: Date;
}

const UserPDFSchema: Schema<IUserPDF> = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    r2Key: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
});

// Prevent model overwrite in dev
const UserPDF: Model<IUserPDF> = mongoose.models.UserPDF || mongoose.model<IUserPDF>('UserPDF', UserPDFSchema);

export default UserPDF;
