
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI;

const notebookSchema = new mongoose.Schema({
    title: String,
    userId: mongoose.Schema.Types.Mixed, // Check raw value
    sharedWith: Array
});

const Notebook = mongoose.models.Notebook || mongoose.model('Notebook', notebookSchema);

async function inspect() {
    try {
        await mongoose.connect(MONGODB_URI);
        const notebooks = await Notebook.find({}).limit(5).lean();
        console.log('Notebooks:', notebooks.map(n => ({
            id: n._id,
            title: n.title,
            userId: n.userId,
            userIdType: typeof n.userId,
            sharedWith: n.sharedWith
        })));
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
