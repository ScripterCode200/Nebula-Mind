const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

// User Schema (Simplified for script)
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    role: { type: String },
    stats: {
        streak: {
            current: { type: Number, default: 0 },
            lastLoginDate: { type: Date },
            timezone: { type: String }
        },
        totalTimeSpent: { type: Number, default: 0 },
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 },
        rarityStats: {
            uncommon: { type: Number, default: 0 },
            rare: { type: Number, default: 0 },
            epic: { type: Number, default: 0 },
            legendary: { type: Number, default: 0 }
        }
    },
    dailyStats: [{
        date: { type: String },
        timeSpent: { type: Number, default: 0 },
        xpGained: { type: Number, default: 0 }
    }],
    achievements: [{
        id: { type: String },
        unlockedAt: { type: Date, default: Date.now }
    }]
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function resetUser() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const targetEmail = "codstom@gmail.com";
        const user = await User.findOne({ email: targetEmail });

        if (!user) {
            console.log(`User ${targetEmail} not found.`);
            process.exit(1);
        }

        console.log(`Found user: ${user.email} (Role: ${user.role}, Level: ${user.stats?.level})`);

        // 1. Reset Stats
        user.stats = {
            streak: { current: 0, lastLoginDate: null, timezone: null },
            totalTimeSpent: 0,
            xp: 0,
            level: 1,
            rarityStats: { uncommon: 0, rare: 0, epic: 0, legendary: 0 }
        };

        // 2. Clear Daily Stats & Achievements
        user.dailyStats = [];
        user.achievements = [];

        // 3. Set Role to Admin
        user.role = 'admin';

        await user.save();
        console.log(`✅ User ${targetEmail} has been reset and promoted to Admin.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

resetUser();
