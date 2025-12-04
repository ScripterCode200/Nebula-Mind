import mongoose, { Schema, Document } from 'mongoose';

export interface ILoginLog extends Document {
    email: string;
    timestamp: Date;
    method: 'alpha' | 'normal';
}

const LoginLogSchema: Schema = new Schema({
    email: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    method: { type: String, enum: ['alpha', 'normal'], required: true }
});

export default mongoose.models.LoginLog || mongoose.model<ILoginLog>('LoginLog', LoginLogSchema);
