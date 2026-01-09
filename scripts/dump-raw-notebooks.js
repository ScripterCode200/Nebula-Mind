
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI;

const notebookSchema = new mongoose.Schema({}, { strict: false });
const Notebook = mongoose.models.Notebook || mongoose.model('Notebook', notebookSchema);

async function inspect() {
    try {
        await mongoose.connect(MONGODB_URI);
        const notebooks = await Notebook.find({}).limit(5).lean();
        console.log('Notebooks:', JSON.stringify(notebooks, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
