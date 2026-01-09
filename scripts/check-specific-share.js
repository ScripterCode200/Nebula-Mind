
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI;

// Strict false to see raw data
const notebookSchema = new mongoose.Schema({}, { strict: false });
delete mongoose.models.Notebook;
const Notebook = mongoose.model('Notebook', notebookSchema);

const TARGET_USER_ID = '692dbafd156d36a3faa1ea0c';

async function check() {
    try {
        await mongoose.connect(MONGODB_URI);

        console.log(`Checking for shares with user: ${TARGET_USER_ID}`);

        // Check 1: String match
        const stringMatch = await Notebook.find({ 'sharedWith.userId': TARGET_USER_ID }).lean();
        console.log(`String Match Count: ${stringMatch.length}`);
        if (stringMatch.length > 0) {
            console.log('Sample:', JSON.stringify(stringMatch[0].sharedWith, null, 2));
        }

        // Check 2: All notebooks with any shares
        const anyShare = await Notebook.find({ 'sharedWith': { $exists: true, $not: { $size: 0 } } }).lean();
        console.log(`\nTotal Notebooks with ANY shares: ${anyShare.length}`);

        anyShare.forEach(nb => {
            console.log(`Notebook "${nb.title}" shares:`);
            if (Array.isArray(nb.sharedWith)) {
                nb.sharedWith.forEach(s => {
                    console.log(`  - User: ${s.userId} (Type: ${typeof s.userId})`);
                    if (String(s.userId) === TARGET_USER_ID) {
                        console.log('    *** MATCH FOUND via String conversion ***');
                    }
                });
            } else {
                console.log('  sharedWith is not an array:', nb.sharedWith);
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

check();
