import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a password based on last name and random numbers
 * Format: lastname + 4 random digits
 * Example: raxmatullayev0804
 * @param lastName - Employee's last name
 * @returns Generated password
 */
export function generatePasswordFromName(lastName: string): string {
  // Convert to lowercase and remove spaces
  const cleanLastName = lastName.toLowerCase().replace(/\s+/g, '');
  
  // Generate 4 random digits
  const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
  
  return cleanLastName + randomDigits;
}

/**
 * Generate a random secure password (legacy - for backward compatibility)
 * @returns Random password (8 characters with mixed types)
 */
export function generatePassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const allChars = uppercase + lowercase + numbers;
  
  let password = '';
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  // Fill remaining 5 characters randomly
  for (let i = 0; i < 5; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
