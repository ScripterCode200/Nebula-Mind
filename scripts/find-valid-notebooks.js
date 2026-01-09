
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI;

const notebookSchema = new mongoose.Schema({}, { strict: false });
delete mongoose.models.Notebook;
const Notebook = mongoose.model('Notebook', notebookSchema);

async function inspect() {
    try {
        await mongoose.connect(MONGODB_URI);
        const count = await Notebook.countDocuments({ userId: { $exists: true } });
        console.log(`Notebooks with userId: ${count}`);

        if (count > 0) {
            const nb = await Notebook.findOne({ userId: { $exists: true } }).lean();
            console.log('Sample Notebook:', JSON.stringify(nb, null, 2));
        }

        const total = await Notebook.countDocuments({});
        console.log(`Total Notebooks: ${total}`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
