
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI;

const notebookSchema = new mongoose.Schema({
    title: String,
    userId: String
});
const Notebook = mongoose.models.Notebook || mongoose.model('Notebook', notebookSchema);

async function getOne() {
    try {
        await mongoose.connect(MONGODB_URI);
        const nb = await Notebook.findOne({ userId: { $exists: true } });
        console.log('Notebook:', nb._id, nb.title, nb.userId);
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

getOne();
