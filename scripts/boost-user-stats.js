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

async function boostUser() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const targetEmail = "codstom@gmail.com";
        const user = await User.findOne({ email: targetEmail });

        if (!user) {
            console.log(`User ${targetEmail} not found.`);
            process.exit(1);
        }

        console.log(`Boosting user: ${user.email} (Current Level: ${user.stats?.level || 1})`);

        // Update Stats to massive values
        user.stats = {
            streak: { current: 15, lastLoginDate: new Date(), timezone: 'UTC' },
            totalTimeSpent: 124500, // Large amount of seconds
            xp: 250000,           // Level 50+
            level: 51,
            rarityStats: {
                uncommon: 85,
                rare: 42,
                epic: 12,
                legendary: 3
            }
        };

        // Add some achievements if empty
        if (!user.achievements || user.achievements.length === 0) {
            user.achievements = [
                { id: 'first_notebook', unlockedAt: new Date() },
                { id: 'xp_warrior', unlockedAt: new Date() },
                { id: 'legendary_discovery', unlockedAt: new Date() }
            ];
        }

        await user.save();
        console.log(`✅ User ${targetEmail} stats have been boosted!`);
        console.log(`New Stats: Level ${user.stats.level}, XP ${user.stats.xp}, legendary: ${user.stats.rarityStats.legendary}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

boostUser();
