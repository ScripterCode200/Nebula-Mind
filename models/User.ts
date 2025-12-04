import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password?: string;
    name?: string;
    role?: 'user' | 'admin';
    isBlocked?: boolean;
    isVerified?: boolean;
    otp?: string;
    otpExpiry?: Date;
    // Profile Fields
    bio?: string;
    dob?: Date;
    university?: string;
    // Account Deletion
    deletionScheduledAt?: Date;
    createdAt?: Date;
    isSubscribed?: boolean;
    lastActiveAt?: Date;
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    // Profile Fields
    bio: { type: String, default: '' },
    dob: { type: Date },
    university: { type: String, default: '' },
    // Account Deletion
    deletionScheduledAt: { type: Date },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isSubscribed: {
        type: Boolean,
        default: false
    },
    lastActiveAt: {
        type: Date
    },
    otp: {
        type: String
    },
    otpExpiry: {
        type: Date
    },
    // New Stats Fields
    stats: {
        streak: {
            current: { type: Number, default: 0 },
            lastLoginDate: { type: Date },
            timezone: { type: String }
        },
        totalTimeSpent: { type: Number, default: 0 }, // in minutes
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 }
    },
    achievements: [{
        id: { type: String },
        unlockedAt: { type: Date, default: Date.now }
    }],
    dailyStats: [{
        date: { type: String }, // YYYY-MM-DD
        timeSpent: { type: Number, default: 0 },
        xpGained: { type: Number, default: 0 }
    }],
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
