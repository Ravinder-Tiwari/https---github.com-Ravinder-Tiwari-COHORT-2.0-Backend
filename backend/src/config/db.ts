import mongoose from 'mongoose';
import appConfig from './config.js';




export async function connectToDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(appConfig.MONGO_URI || '')
            .then(() => {
                console.log('Connected to MongoDB successfully.');
            })
    }
    catch (error) {
        console.error('Failed to connect to MongoDB:', error);
    }
}

