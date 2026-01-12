import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password?: string;
    name?: string;
    role?: 'user' | 'admin' | 'editor';
    isBlocked?: boolean;
    isVerified?: boolean;
    otp?: string;
    otpExpiry?: Date;
    // Profile Fields
    bio?: string;
    dob?: Date;
    university?: string;
    location?: string;
    socials?: {
        linkedin?: string;
        github?: string;
        twitter?: string;
        website?: string;
    };
    academic?: {
        year?: string;
        major?: string;
        cgpa?: string;
        institution?: string;
    };
    interests?: string[];
    status?: {
        text?: string;
        emoji?: string;
    };
    // Account Deletion
    deletionScheduledAt?: Date;
    createdAt?: Date;
    isSubscribed?: boolean;
    lastActiveAt?: Date;
    dailyGoalPreferences?: {
        id: number;
        enabled: boolean;
        subject: string;
        difficulty: string;
        topic: string;
        isTimeBound: boolean;
    }[];
    preferences?: {
        customThemeColor?: string;
    };
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    // Profile Fields
    bio: { type: String, default: '' },
    dob: { type: Date },
    university: { type: String, default: '' },
    location: { type: String, default: '' },
    socials: {
        linkedin: { type: String, default: '' },
        github: { type: String, default: '' },
        twitter: { type: String, default: '' },
        website: { type: String, default: '' }
    },
    academic: {
        year: { type: String, default: '' },
        major: { type: String, default: '' },
        cgpa: { type: String, default: '' },
        institution: { type: String, default: '' }
    },
    interests: [{ type: String }],
    status: {
        text: { type: String, default: '' },
        emoji: { type: String, default: '' }
    },
    // Daily Goal Preferences
    dailyGoalPreferences: [{
        id: { type: Number },
        enabled: { type: Boolean, default: true },
        subject: { type: String },
        difficulty: { type: String },
        topic: { type: String },
        isTimeBound: { type: Boolean, default: true }
    }],
    preferences: {
        customThemeColor: { type: String, default: '' }
    },
    profileImage: { type: String, default: '' },
    imageKitFileId: { type: String, default: '' },
    // Account Deletion
    deletionScheduledAt: { type: Date },
    role: {
        type: String,
        enum: ['user', 'admin', 'editor'],
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
        level: { type: Number, default: 1 },
        rarityStats: {
            uncommon: { type: Number, default: 0 },
            rare: { type: Number, default: 0 },
            epic: { type: Number, default: 0 },
            legendary: { type: Number, default: 0 }
        }
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
