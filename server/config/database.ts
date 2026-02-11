import mongoose from 'mongoose';
import { createAdminUser } from '../utils/createAdmin';
import { resetAdminUsers } from '../utils/resetAdmin';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB connected successfully');
    
    // Reset admin users (only in development)
    if (process.env.RESET_ADMIN === 'true') {
      await resetAdminUsers();
    }
    
    // Create admin user after successful connection
    await createAdminUser();
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

export default connectDB;
