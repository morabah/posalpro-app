/**
 * PosalPro MVP2 - Password Hashing Utilities
 * Secure password operations using bcrypt
 */

import bcrypt from 'bcryptjs';

// Platform compatibility: Using bcryptjs (pure JS) instead of bcrypt (native)
// See IMPLEMENTATION_LOG.md and LESSONS_LEARNED.md for details

// Number of salt rounds for bcrypt (12 provides good security/performance balance)
const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * @param password - Plain text password to hash
 * @returns Promise resolving to hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns Promise resolving to true if passwords match, false otherwise
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Error comparing password:', error);
    throw new Error('Failed to verify password');
  }
}
