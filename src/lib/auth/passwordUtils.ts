/**
 * PosalPro MVP2 - Password Hashing Utilities
 * Secure password operations using bcrypt
 */

import bcrypt from 'bcryptjs';
import { ErrorCodes, StandardError } from '@/lib/errors';

// Platform compatibility: Using bcryptjs (pure JS) instead of bcrypt (native)
// See IMPLEMENTATION_LOG.md and LESSONS_LEARNED.md for details

// Number of salt rounds for bcrypt
// Use lower cost in development to improve authentication latency
const SALT_ROUNDS = process.env.NODE_ENV === 'development' ? 6 : 12;

/**
 * Hash a password using bcrypt
 * @param password Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    throw StandardError.server(
      'Failed to hash password',
      error,
      {
        component: 'passwordUtils',
        operation: 'hashPassword',
        userFriendlyMessage: 'Unable to process your password. Please try again later.',
      }
    );
  }
}

/**
 * Compare a plain text password with a hashed password
 * @param password Plain text password to compare
 * @param hashedPassword Hashed password to compare against
 * @returns Boolean indicating if passwords match
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw StandardError.server(
      'Failed to compare passwords',
      error,
      {
        component: 'passwordUtils',
        operation: 'comparePassword',
        userFriendlyMessage: 'Unable to verify your password. Please try again later.',
      }
    );
  }
}
