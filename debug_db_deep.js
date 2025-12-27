const mongoose = require('mongoose');
const { startOfDay, endOfDay } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');

require('dotenv').config({ path: '.env.local' });

async function debug() {
    if (!process.env.MONGODB_URI) {
        console.error("No MONGODB_URI");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        // Use 'dailygoals' (lowercase) or 'DailyGoal' depending on collection name. 
        // Mongoose usually pluralizes 'DailyGoal' -> 'dailygoals'
        const collection = mongoose.connection.collection('dailygoals');

        const count = await collection.countDocuments();
        console.log(`Total Documents in 'dailygoals': ${count}`);

        const docs = await collection.find({}).sort({ _id: -1 }).limit(3).toArray();
        console.log("\n--- Last 3 Raw Documents ---");
        console.dir(docs, { depth: null });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

debug();
