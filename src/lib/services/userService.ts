/**
 * PosalPro MVP2 - User Database Service
 * Database operations for user management using Prisma
 * Implements robust error handling with StandardError and ErrorCodes
 */

import { UserStatus } from '@prisma/client';
import { hashPassword } from '../auth/passwordUtils';
import { prisma } from '../prisma';
import { ErrorCodes, StandardError, errorHandlingService } from '../errors';
import { isPrismaError } from '../utils/errorUtils';

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

    return user;
  } catch (error) {
    errorHandlingService.processError(error);

    // Handle unique constraint violations (duplicate email)
    if (isPrismaError(error) && error.code === 'P2002') {
      throw new StandardError({
        message: 'A user with this email already exists',
        code: ErrorCodes.DATA.CONFLICT,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'UserService',
          operation: 'createUser',
          email: data.email
        },
      });
    }

    throw new StandardError({
      message: 'Failed to create user',
      code: ErrorCodes.DATA.CREATE_FAILED,
      cause: error instanceof Error ? error : undefined,
      metadata: {
        component: 'UserService',
        operation: 'createUser',
        email: data.email
      },
    });
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

    return user;
  } catch (error) {
    errorHandlingService.processError(error);
    throw new StandardError({
      message: 'Failed to retrieve user by email',
      code: ErrorCodes.DATA.QUERY_FAILED,
      cause: error instanceof Error ? error : undefined,
      metadata: {
        component: 'UserService',
        operation: 'getUserByEmail',
        email
      },
    });
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

    return true;
  } catch (error) {
    errorHandlingService.processError(error);
    
    // Check for Prisma not found error
    if (isPrismaError(error) && error.code === 'P2025') {
      throw new StandardError({
        message: 'User not found',
        code: ErrorCodes.DATA.NOT_FOUND,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'UserService',
          operation: 'updateLastLogin',
          userId
        },
      });
    }
    
    throw new StandardError({
      message: 'Failed to update user last login',
      code: ErrorCodes.DATA.UPDATE_FAILED,
      cause: error instanceof Error ? error : undefined,
      metadata: {
        component: 'UserService',
        operation: 'updateLastLogin',
        userId
      },
    });
  }
}
