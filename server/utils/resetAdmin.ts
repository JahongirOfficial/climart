import { User } from '../models/User';

/**
 * Delete all admin users (for development/testing only)
 */
export async function resetAdminUsers() {
  try {
    const result = await User.deleteMany({ role: 'admin' });
    console.log(`✓ Deleted ${result.deletedCount} admin user(s)`);
  } catch (error) {
    console.error('✗ Error deleting admin users:', error);
  }
}
