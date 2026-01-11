
const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/notebook_lm_app';
console.log('Connecting to', MONGODB_URI);

const NotebookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    userId: { type: String, required: true },
    pdfUrl: { type: String, default: '' },
    contentKey: { type: String },
    fileType: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Notebook = mongoose.models.Notebook || mongoose.model('Notebook', NotebookSchema);

async function checkRecentNotebook() {
    try {
        await mongoose.connect(MONGODB_URI);
        const notebook = await Notebook.findOne().sort({ createdAt: -1 });
        console.log('--- Last Notebook ---');
        console.log(JSON.stringify(notebook, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkRecentNotebook();
