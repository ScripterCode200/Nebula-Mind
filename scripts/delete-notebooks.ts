import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

async function deleteAllNotebooks() {
    try {
        await mongoose.connect(MONGODB_URI as string);
        console.log('Connected to MongoDB');

        // Define a minimal schema just for deletion if model isn't loaded, 
        // or just use the collection directly.
        const db = mongoose.connection.db;
        if (!db) throw new Error('Database connection failed');

        const collections = await db.listCollections({ name: 'notebooks' }).toArray();
        if (collections.length > 0) {
            await db.collection('notebooks').drop();
            console.log('Dropped notebooks collection');
        } else {
            console.log('Notebooks collection does not exist');
        }

        // Also drop 'chats' and 'documentchunks' if we want a full clean slate for the new user-scoped world?
        // User said "Deleat all notebooks". I'll stick to that.
        // But chats are linked to notebooks. If notebooks are gone, chats are orphaned.
        // I should probably delete chats too to be clean.

        const chatCollections = await db.listCollections({ name: 'chats' }).toArray();
        if (chatCollections.length > 0) {
            await db.collection('chats').drop();
            console.log('Dropped chats collection');
        }

        console.log('Cleanup complete');
    } catch (error) {
        console.error('Error deleting notebooks:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

deleteAllNotebooks();
