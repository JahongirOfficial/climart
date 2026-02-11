import { User } from '../models/User';

/**
 * Transliterate non-Latin characters to Latin equivalents
 * @param text - Text to transliterate
 * @returns Transliterated text
 */
function transliterate(text: string): string {
  const map: Record<string, string> = {
    // Cyrillic to Latin
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    // Uzbek specific
    'ў': 'o', 'қ': 'q', 'ғ': 'g', 'ҳ': 'h',
  };
  
  return text.toLowerCase().split('').map(char => map[char] || char).join('');
}

/**
 * Sanitize text for username (remove spaces and special characters)
 * @param text - Text to sanitize
 * @returns Sanitized text
 */
function sanitize(text: string): string {
  return text.replace(/[^a-z0-9]/g, '');
}

/**
 * Generate a unique username from first and last name
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Unique username
 */
export async function generateUsername(firstName: string, lastName: string): Promise<string> {
  // Combine and process names
  const combined = `${firstName}${lastName}`;
  const transliterated = transliterate(combined);
  const sanitized = sanitize(transliterated);
  
  // Ensure minimum length
  if (sanitized.length < 3) {
    throw new Error('Generated username is too short (minimum 3 characters)');
  }
  
  let username = sanitized;
  let suffix = 1;
  
  // Check for uniqueness and append suffix if needed
  while (await User.findOne({ username })) {
    suffix++;
    username = `${sanitized}${suffix}`;
  }
  
  return username;
}
