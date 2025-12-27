const mongoose = require('mongoose');
const { startOfDay, endOfDay } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');

// Hardcode the URI for debug purposes since we can't easily access env in simple script execution sometimes, 
// or simpler: rely on dotenv.
require('dotenv').config({ path: '.env.local' });

const IST_TIMEZONE = 'Asia/Kolkata';

const goalSchema = new mongoose.Schema({
    title: String,
    date: Date,
    userId: String
}, { strict: false });

const DailyGoal = mongoose.model('DailyGoal', goalSchema);

async function debug() {
    if (!process.env.MONGODB_URI) {
        console.error("No MONGODB_URI found in .env.local");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        // 1. Dump ALL goals
        const allGoals = await DailyGoal.find({}).sort({ date: -1 }).limit(5);
        console.log("--- Last 5 Goals in DB ---");
        allGoals.forEach(g => {
            console.log(`ID: ${g._id}, Date: ${g.date} (ISO: ${g.date.toISOString()}), User: ${g.userId}`);
        });

        // 2. Simulate API Logic
        const now = new Date();
        const istDate = toZonedTime(now, IST_TIMEZONE);

        // API Logic
        const start = startOfDay(istDate);
        const end = endOfDay(istDate);

        console.log("\n--- API Query Params ---");
        console.log(`Now (UTC): ${now.toISOString()}`);
        console.log(`IST Date: ${istDate}`);
        console.log(`Start (IST derived): ${start.toISOString()}`); // This might be UTC representation of IST start?
        console.log(`End (IST derived): ${end.toISOString()}`);

        const queryGoals = await DailyGoal.find({
            date: {
                $gte: start,
                $lte: end
            }
        });

        console.log(`\n--- Query Result ---`);
        console.log(`Found: ${queryGoals.length} goals matching today's query.`);
        queryGoals.forEach(g => console.log(` - ${g.title}`));

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

debug();
