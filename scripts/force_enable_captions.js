const mongoose = require('mongoose');

// Need to match exactly with .env.local URI
const uri = process.env.MONGODB_URI || "mongodb+srv://codstom_db_user:vE0trbjgxPLrxB8z@learninghub.e1ce3l7.mongodb.net/?appName=LearningHub";

async function fixDb() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB.");

        const SystemSetting = mongoose.models.SystemSetting || mongoose.model('SystemSetting', new mongoose.Schema({
            key: { type: String, required: true },
            value: { type: String, required: true },
            maintenanceMode: { type: Boolean, default: false },
            aiModel: { type: String, default: 'gemini-1.5-flash' },
            antiCheatEnabled: { type: Boolean, default: false },
            enableDirectCaptions: { type: Boolean, default: true },
            enableAutoDailyGoals: { type: Boolean, default: true },
            useVertexAI: { type: Boolean, default: false }
        }, { collection: 'systemsettings' }));

        const result = await SystemSetting.updateOne(
            { key: 'global' },
            { $set: { enableDirectCaptions: true } },
            { upsert: true }
        );

        console.log("Update result:", result);
    } catch (e) {
        console.error("Error updating DB:", e);
    } finally {
        await mongoose.disconnect();
    }
}

fixDb();
