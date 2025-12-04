require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Define Notebook Schema (simplified)
const NotebookSchema = new mongoose.Schema({
    title: String,
    pdfUrl: String,
    pdfContent: String,
    createdAt: Date,
});

const Notebook = mongoose.models.Notebook || mongoose.model('Notebook', NotebookSchema);

async function inspectLatestNotebook() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const notebook = await Notebook.findOne().sort({ createdAt: -1 });

        if (!notebook) {
            console.log('NO_NOTEBOOK');
        } else {
            console.log(notebook._id.toString());
        }

    } catch (error) {
        console.error('Error inspecting notebook:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

inspectLatestNotebook();
