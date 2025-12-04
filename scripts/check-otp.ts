import mongoose from 'mongoose';
import User from '../models/User';

const MONGODB_URI = "mongodb+srv://codstom_db_user:vE0trbjgxPLrxB8z@learninghub.e1ce3l7.mongodb.net/?appName=LearningHub";

async function checkOtp() {
    try {
        await mongoose.connect(MONGODB_URI);
        const user = await User.findOne({ email: 'codstom@gmail.com' });
        if (user) {
            console.log('User found:', user.email);
            console.log('Stored OTP:', user.otp);
            console.log('OTP Expiry:', user.otpExpiry);
            console.log('Now:', new Date());
        } else {
            console.log('User not found');
        }
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkOtp();
