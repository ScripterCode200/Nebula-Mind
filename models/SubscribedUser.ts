import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscribedUser extends Document {
    email: string;
    subscribedAt: Date;
}

const SubscribedUserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    subscribedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Subscribed_User || mongoose.model<ISubscribedUser>('Subscribed_User', SubscribedUserSchema);
