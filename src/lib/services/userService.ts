/**
 * PosalPro MVP2 - User Database Service
 * Database operations for user management using Prisma
 */

import { UserStatus } from '@prisma/client';
import { hashPassword } from '../auth/passwordUtils';
import { prisma } from '../prisma';

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  department: string;
}

export interface UserWithoutPassword {
  id: string;
  email: string;
  name: string;
  department: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
}

/**
 * Create a new user in the database
 * @param data - User data including plaintext password
 * @returns Promise resolving to created user (without password)
 */
export async function createUser(data: CreateUserData): Promise<UserWithoutPassword> {
  try {
    // Hash the password before storing
    const hashedPassword = await hashPassword(data.password);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        department: data.department,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });

    console.log('✅ User created successfully:', user.email);
    return user;
  } catch (error) {
    console.error('❌ Error creating user:', error);

    // Handle unique constraint violations (duplicate email)
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      throw new Error('A user with this email already exists');
    }

    throw new Error('Failed to create user');
  }
}

/**
 * Retrieve a user by email address
 * @param email - User's email address
 * @returns Promise resolving to user data or null if not found
 */
export async function getUserByEmail(email: string): Promise<{
  id: string;
  email: string;
  name: string;
  password: string;
  department: string;
  status: UserStatus;
  roles: Array<{
    role: {
      name: string;
    };
  }>;
} | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        department: true,
        status: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (user) {
      console.log('🔍 User found:', user.email);
    } else {
      console.log('❌ User not found:', email);
    }

    return user;
  } catch (error) {
    console.error('❌ Error retrieving user:', error);
    throw new Error('Failed to retrieve user');
  }
}

/**
 * Update user's last login timestamp
 * @param userId - User's ID
 * @returns Promise resolving to success boolean
 */
export async function updateLastLogin(userId: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });

    console.log('✅ Last login updated for user:', userId);
    return true;
  } catch (error) {
    console.error('❌ Error updating last login:', error);
    return false;
  }
}
