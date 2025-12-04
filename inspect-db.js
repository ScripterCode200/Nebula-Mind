require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define schema inline to avoid import issues in standalone script
const NotebookSchema = new Schema({
    title: { type: String, required: true },
    pdfUrl: { type: String, required: true },
    pdfContent: { type: String, required: true }, // Check if this is required
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Notebook = mongoose.models.Notebook || mongoose.model('Notebook', NotebookSchema);

async function inspectDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const notebook = await Notebook.findOne().sort({ createdAt: -1 });
        if (notebook) {
            console.log('Latest Notebook ID:', notebook._id);
            console.log('Title:', notebook.title);
            console.log('PDF URL:', notebook.pdfUrl);
            console.log('PDF Content Length:', notebook.pdfContent ? notebook.pdfContent.length : 0);
            console.log('PDF Content Preview:', notebook.pdfContent ? notebook.pdfContent.substring(0, 200) : 'NULL');
        } else {
            console.log('No notebooks found.');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

inspectDatabase();
