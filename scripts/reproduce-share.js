
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI;

// Define full schema to ensure validation doesn't interfere weirdly
const notebookSchema = new mongoose.Schema({
    title: String,
    userId: String,
    sharedWith: [{
        userId: { type: String, required: true },
        sharedAt: { type: Date, default: Date.now },
        permission: { type: String, default: 'view' }
    }]
});
// Need to delete previous model if it exists in cache (rare in script)
delete mongoose.models.Notebook;
const Notebook = mongoose.model('Notebook', notebookSchema);

async function reproduce() {
    try {
        await mongoose.connect(MONGODB_URI);
        const notebookId = '692ddd90b066fa78405169a0';
        const recipientId = '507f1f77bcf86cd799439011'; // Dummy valid objectId string

        console.log(`Sharing ${notebookId} with ${recipientId}...`);

        const res = await Notebook.updateOne(
            { _id: notebookId },
            {
                $addToSet: {
                    sharedWith: {
                        userId: recipientId,
                        sharedAt: new Date(),
                        permission: 'view'
                    }
                }
            }
        );

        console.log('Update Result:', res);

        const updated = await Notebook.findById(notebookId);
        console.log('Updated Notebook sharedWith:', updated.sharedWith);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

reproduce();
