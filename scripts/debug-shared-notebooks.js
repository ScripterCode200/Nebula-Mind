
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

const notebookSchema = new mongoose.Schema({
    title: String,
    userId: String,
    sharedWith: [{
        userId: String,
        sharedAt: Date,
        permission: String
    }]
});

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    _id: mongoose.Schema.Types.ObjectId // Explicitly define as ObjectId
});

const Notebook = mongoose.models.Notebook || mongoose.model('Notebook', notebookSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function debugSharedNotebooks() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. List all users to get IDs
        const users = await User.find({});
        console.log('\n--- Users ---');
        users.forEach(u => console.log(`${u.name} (${u.email}): ${u._id}`));

        // 2. Find notebooks with sharedWith array that is not empty
        const notebooks = await Notebook.find({ 'sharedWith.0': { $exists: true } });
        console.log(`\n--- Notebooks with shares (${notebooks.length}) ---`);

        notebooks.forEach(n => {
            console.log(`\nNotebook: "${n.title}" (Owner: ${n.userId})`);
            console.log('Shared With:');
            n.sharedWith.forEach(s => {
                console.log(`  - User ID: ${s.userId} (Type: ${typeof s.userId}) Permission: ${s.permission}`);

                // Check if this ID matches any user
                const matchingUser = users.find(u => u._id.toString() === s.userId);
                if (matchingUser) {
                    console.log(`    -> MATCHES user: ${matchingUser.name}`);
                } else {
                    console.log(`    -> NO USER FOUND for this ID in User collection!`);
                }
            });
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugSharedNotebooks();
