import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const setupTestDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/climart-test';
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
  }
};

export const teardownTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

export const clearTestDB = async (collections: string[]) => {
  for (const collection of collections) {
    await mongoose.connection.collection(collection).deleteMany({});
  }
};
