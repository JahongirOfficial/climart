import { User } from '../models/User';
import { hashPassword } from './password';

/**
 * Update admin password
 */
export async function updateAdminPassword(newPassword: string = 'admin123') {
  try {
    const admin = await User.findOne({ username: 'admin' });
    
    if (!admin) {
      console.log('✗ Admin user not found');
      return;
    }
    
    const passwordHash = await hashPassword(newPassword);
    admin.passwordHash = passwordHash;
    await admin.save();
    
    console.log('✓ Admin password updated successfully');
    console.log('  Username: admin');
    console.log('  New Password:', newPassword);
  } catch (error) {
    console.error('✗ Error updating admin password:', error);
  }
}
