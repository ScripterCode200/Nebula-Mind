import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Hardcoded URI from lib/db.ts
const MONGODB_URI = "mongodb+srv://codstom_db_user:vE0trbjgxPLrxB8z@learninghub.e1ce3l7.mongodb.net/?appName=LearningHub";

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

// Define User Schema inline to avoid import issues in standalone script
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    isAllowed: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const usersToAdd = [
    'durvishrajkumawat11@gmail.com', // Corrected from durvishrajkumawat11gmail.com
    'archeetjain28@gmail.com',
    'codstom@gmail.com',
    'shivamsainishivam5211@gmail.com',
    '2025bcaaimlshivam21074@poornima.edu.in'
];

async function seedUsers() {
    try {
        await mongoose.connect(MONGODB_URI as string);
        console.log('Connected to MongoDB');

        for (const email of usersToAdd) {
            await User.findOneAndUpdate(
                { email },
                { email, isAllowed: true },
                { upsert: true, new: true }
            );
            console.log(`Whitelisted: ${email}`);
        }

        console.log('All users added successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
}

seedUsers();
