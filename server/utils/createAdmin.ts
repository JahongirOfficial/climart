import { User } from '../models/User';
import { hashPassword } from './password';

/**
 * Create default admin user if it doesn't exist
 */
export async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('✓ Admin user already exists');
      return;
    }
    
    // Get admin credentials from environment or use defaults
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminPhone = process.env.ADMIN_PHONE || '+998901234567';
    
    // Hash password
    const passwordHash = await hashPassword(adminPassword);
    
    // Create admin user
    await User.create({
      username: adminUsername,
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      phoneNumber: adminPhone,
      role: 'admin',
      permissions: [],
      isActive: true,
    });
    
    console.log('✓ Admin user created successfully');
    console.log('  Username:', adminUsername);
    console.log('  Password:', adminPassword);
    console.log('  Phone:', adminPhone);
    console.log('  ⚠️  Please change the default password after first login!');
  } catch (error) {
    console.error('✗ Error creating admin user:', error);
  }
}
