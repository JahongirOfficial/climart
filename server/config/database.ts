import mongoose from 'mongoose';
import { createAdminUser } from '../utils/createAdmin';
import { resetAdminUsers } from '../utils/resetAdmin';
import { updateAdminPassword } from '../utils/updateAdminPassword';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Configure mongoose settings
    mongoose.set('strictQuery', false);
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connected successfully');
    
    // Reset admin users (only in development)
    if (process.env.RESET_ADMIN === 'true') {
      await resetAdminUsers();
    }
    
    // Create admin user after successful connection
    await createAdminUser();
    
    // Update admin password if needed (development only)
    if (process.env.UPDATE_ADMIN_PASSWORD === 'true') {
      await updateAdminPassword('admin123');
    }
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    // Don't exit in development, allow retry
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;
