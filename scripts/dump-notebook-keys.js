
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI;

// Use empty schema with strict: false to get everything
const notebookSchema = new mongoose.Schema({}, { strict: false });
// Force new model compilation
delete mongoose.models.Notebook;
const Notebook = mongoose.model('Notebook', notebookSchema);

async function inspect() {
    try {
        await mongoose.connect(MONGODB_URI);
        const notebook = await Notebook.findOne({}).lean();
        if (notebook) {
            console.log('Notebook Keys:', Object.keys(notebook));
            console.log('userId value:', notebook.userId);
            console.log('user value:', notebook.user);
            console.log('owner value:', notebook.owner);
        } else {
            console.log('No notebooks found.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
