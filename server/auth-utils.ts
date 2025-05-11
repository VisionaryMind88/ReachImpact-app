import { createHash, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Generates a secure hash of a password with a random salt
 * @param password The password to hash
 * @returns A string in the format 'hash.salt'
 */
export function hashPassword(password: string): string {
  // Generate a random salt
  const salt = randomBytes(16).toString('hex');
  
  // Hash the password with the salt
  const hash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  
  // Return the hash and salt together
  return `${hash}.${salt}`;
}

/**
 * Verifies that a password matches a stored hash
 * @param password The password to check
 * @param hashedPassword The stored password hash in the format 'hash.salt'
 * @returns True if the password matches, false otherwise
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  try {
    // Split the hash and salt
    const [storedHash, salt] = hashedPassword.split('.');
    
    // Hash the provided password with the same salt
    const hash = createHash('sha256')
      .update(password + salt)
      .digest('hex');
    
    // Compare the hashes using a constant-time comparison
    // to prevent timing attacks
    const storedHashBuffer = Buffer.from(storedHash, 'hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    
    return storedHashBuffer.length === hashBuffer.length && 
           timingSafeEqual(storedHashBuffer, hashBuffer);
  } catch (error) {
    // If there's any error in the format of the stored hash
    console.error('Error verifying password:', error);
    return false;
  }
}