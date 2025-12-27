const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const goalSchema = new mongoose.Schema({
    title: String,
    date: Date,
    userId: String
}, { strict: false });

const DailyGoal = mongoose.model('DailyGoal', goalSchema);

async function purgeGoals() {
    if (!process.env.MONGODB_URI) {
        console.error("No MONGODB_URI found in .env.local");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB.");

        const result = await DailyGoal.deleteMany({});
        console.log(`✅ Successfully deleted ${result.deletedCount} daily goals.`);

    } catch (e) {
        console.error("Error deleting goals:", e);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

purgeGoals();
