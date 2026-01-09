
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI;

const notebookSchema = new mongoose.Schema({}, { strict: false });
delete mongoose.models.Notebook;
const Notebook = mongoose.model('Notebook', notebookSchema);

const NOTEBOOK_ID = '6958ee85c229621a5da5e96e';

async function inspect() {
    try {
        await mongoose.connect(MONGODB_URI);
        const nb = await Notebook.findById(NOTEBOOK_ID).lean();
        if (nb) {
            console.log(`Notebook: ${nb.title} (${nb._id})`);
            console.log('sharedWith RAW:', JSON.stringify(nb.sharedWith, null, 2));
            if (nb.sharedWith && nb.sharedWith.length > 0) {
                const firstShare = nb.sharedWith[0];
                console.log('Type of sharedWith.userId:', typeof firstShare.userId);
            }
        } else {
            console.log('Notebook not found');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
