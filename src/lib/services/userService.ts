/**
 * PosalPro MVP2 - User Service
 * Enhanced with performance optimization and caching
 *
 * 🚀 PHASE 6 OPTIMIZATION: Aggressive caching and query optimization
 * Target: Reduce authentication time from 1138ms to <500ms
 */

import { hashPassword } from '@/lib/auth/passwordUtils';
import { ErrorCodes, processError, StandardError } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logError } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { Role, User } from '@prisma/client';
import { toPrismaJson } from '@/lib/utils/prismaUtils';
import { isPrismaError } from '@/lib/utils/errorUtils';

// ✅ TYPES: Define proper interfaces for user service
interface UserFilters {
  search?: string;
  department?: string;
  status?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

interface UserUpdateData {
  name?: string;
  email?: string;
  department?: string;
  preferences?: Record<string, unknown>;
}

interface NormalizedUserData {
  id: string;
  name: string;
  email: string;
  department: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  roles?: Role[];
  preferences?: Record<string, unknown>;
}

// ✅ CRITICAL: Performance optimization - User cache
const userCache = new Map<string, { user: AuthUserRecord; timestamp: number }>();
const USER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_SIZE = 100;

// ✅ CRITICAL: Performance optimization - Role cache
const roleCache = new Map<string, { roles: Role[]; timestamp: number }>();
const ROLE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ✅ CRITICAL: Cache cleanup function (generic to avoid any)
interface CacheEntryBase {
  timestamp: number;
}
function cleanupCache<T extends CacheEntryBase>(cache: Map<string, T>, maxSize: number) {
  if (cache.size > maxSize) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, Math.floor(maxSize * 0.2)); // Remove 20% of oldest entries
    toDelete.forEach(([key]) => cache.delete(key));
  }
}

// ✅ CRITICAL: Get cached user or fetch from database
async function getCachedUser(email: string): Promise<AuthUserRecord | null> {
  const now = Date.now();
  const cached = userCache.get(email);

  if (cached && now - cached.timestamp < USER_CACHE_TTL) {
    logDebug(`📦 [User Cache] Cache hit for: ${email}`);
    return cached.user;
  }

  logDebug(`🔍 [User Service] Fetching user from database: ${email}`);
  return null;
}

// ✅ CRITICAL: Cache user data
function cacheUser(email: string, user: AuthUserRecord) {
  userCache.set(email, { user, timestamp: Date.now() });
  logDebug(`📦 [User Cache] Cached user: ${email}`);
  cleanupCache(userCache, MAX_CACHE_SIZE);
}

// ✅ CRITICAL: Get cached roles or fetch from database
async function getCachedRoles(): Promise<Role[]> {
  const now = Date.now();
  const cached = roleCache.get('all_roles');

  if (cached && now - cached.timestamp < ROLE_CACHE_TTL) {
    return cached.roles;
  }

  return [];
}

// ✅ CRITICAL: Cache roles data
function cacheRoles(roles: Role[]) {
  roleCache.set('all_roles', { roles, timestamp: Date.now() });
}

/**
 * Get user by email with optimized caching
 * 🚀 PHASE 6: Optimized for <500ms authentication
 */
interface AuthUserRecord {
  id: string;
  email: string;
  name: string;
  department: string;
  tenantId: string;
  status: string;
  password: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
  roles: Array<{ role: { name: string } }>;
}

export interface CreateUserData {
  email: string;
  name: string;
  password?: string; // Optional for OAuth users
  department: string;
}

export type UserWithoutPassword = Omit<User, 'password'>;

export async function createUser(data: CreateUserData): Promise<UserWithoutPassword> {
  // Check for existing user
  const existing = await prisma.user.findUnique({
    where: {
      tenantId_email: {
        tenantId: 'tenant_default',
        email: data.email,
      },
    },
    select: { id: true },
  });
  if (existing) {
    // Keep error message for API route compatibility
    throw new Error('A user with this email already exists');
  }

  // Handle password for traditional vs OAuth users
  let passwordHash: string | undefined;
  if (data.password) {
    passwordHash = await hashPassword(data.password);
  }

  const created = await prisma.user.create({
    data: {
      tenantId: 'tenant_default',
      email: data.email,
      name: data.name,
      password: passwordHash,
      department: data.department,
      status: 'ACTIVE',
    },
  });
  // Omit password
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const { password: _password, ...rest } = created;
  return rest as UserWithoutPassword;
}

export async function getUserByEmail(email: string): Promise<AuthUserRecord | null> {
  try {
    // ✅ CRITICAL: Check cache first
    const cachedUser = await getCachedUser(email);
    if (cachedUser) {
      logDebug(`📦 [User Cache] Cache hit for: ${email}`);
      return cachedUser;
    }

    logDebug(`🔍 [User Service] Fetching user from database: ${email}`);

    // ✅ PERFORMANCE: Avoid transaction for single read to reduce auth latency
    // NOTE: Using findFirst instead of findUnique because we changed the unique constraint
    // to tenantId_email compound key. During authentication, we don't know tenantId yet.
    const result = await prisma.user.findFirst({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        tenantId: true,
        status: true,
        password: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        roles: {
          where: { isActive: true },
          select: {
            role: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (result) {
      // ✅ CRITICAL: Cache the result
      const authUser = {
        id: result.id,
        email: result.email,
        name: result.name,
        department: result.department,
        tenantId: result.tenantId,
        status: result.status,
        password: result.password,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        lastLogin: result.lastLogin,
        roles: result.roles,
      };
      await cacheUser(email, authUser);
      logDebug(`📦 [User Cache] Cached user: ${email}`);
      return authUser;
    }

    return null;
  } catch (error) {
    processError(error, 'Error fetching user', ErrorCodes.DATA.FETCH_FAILED, {
      component: 'UserService',
      operation: 'getUserByEmail',
      email,
    });
    return null;
  }
}

/**
 * Update user's last login time
 * 🚀 PHASE 6: Optimized with minimal database impact
 */
export async function updateLastLogin(userId: string): Promise<void> {
  try {
    // ✅ CRITICAL: Use update instead of findUnique + update
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });
  } catch (error) {
    processError(error, 'Error updating last login', ErrorCodes.DATA.UPDATE_FAILED, {
      component: 'UserService',
      operation: 'updateLastLogin',
      userId,
    });
  }
}

/**
 * Get all users with pagination and caching
 * 🚀 PHASE 6: Optimized for dashboard performance
 */
export async function getUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}): Promise<{ users: User[]; total: number }> {
  try {
    const { page = 1, limit = 10, search, role } = params;
    const skip = (page - 1) * limit;

    // ✅ CRITICAL: Single transaction for users and count
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: {
          AND: [
            search
              ? {
                  OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                  ],
                }
              : {},
            role ? { roles: { some: { role: { name: role }, isActive: true } } } : {},
          ],
        },
        include: {
          roles: {
            where: { isActive: true },
            include: { role: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({
        where: {
          AND: [
            search
              ? {
                  OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                  ],
                }
              : {},
            role ? { roles: { some: { role: { name: role }, isActive: true } } } : {},
          ],
        },
      }),
    ]);

    return { users, total };
  } catch (error) {
    processError(error, 'Error fetching users', ErrorCodes.DATA.FETCH_FAILED, {
      component: 'UserService',
      operation: 'getUsers',
      params,
    });
    return { users: [], total: 0 };
  }
}

/**
 * Get user roles with caching
 * 🚀 PHASE 6: Optimized for role-based access control
 */
export async function getUserRoles(userId: string): Promise<Role[]> {
  try {
    // ✅ CRITICAL: Check cache first
    const cachedRoles = await getCachedRoles();
    if (cachedRoles.length > 0) {
      return cachedRoles;
    }

    // ✅ CRITICAL: Single query for all roles
    const roles = await prisma.role.findMany({
      where: {
        userRoles: {
          some: {
            userId,
            isActive: true,
          },
        },
      },
    });

    // ✅ CRITICAL: Cache roles
    cacheRoles(roles);

    return roles;
  } catch (error) {
    logError('[User Service] Error fetching user roles:', error);
    return [];
  }
}

/**
 * Clear user cache (for testing or cache invalidation)
 */
export function clearUserCache(): void {
  userCache.clear();
  roleCache.clear();
  logDebug('🧹 [User Cache] Cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  userCacheSize: number;
  roleCacheSize: number;
  userCacheHits: number;
  roleCacheHits: number;
} {
  return {
    userCacheSize: userCache.size,
    roleCacheSize: roleCache.size,
    userCacheHits: 0, // TODO: Implement hit tracking
    roleCacheHits: 0, // TODO: Implement hit tracking
  };
}

/**
 * Enhanced User Service class with cursor-based pagination
 * Following CORE_REQUIREMENTS.md service layer patterns
 */
export class UserService {
  /**
   * Cursor-based list method following CORE_REQUIREMENTS.md patterns
   * Returns normalized data with proper transformations
   */
  async listUsersCursor(
    filters: {
      search?: string;
      department?: string;
      role?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      cursor?: string;
    } = {}
  ): Promise<{
    items: User[];
    nextCursor: string | null;
  }> {
    try {
      const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);

      // Validate cursor format if provided
      if (
        filters.cursor &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          filters.cursor
        )
      ) {
        throw new StandardError({
          message: 'Invalid cursor format',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          metadata: {
            component: 'UserService',
            operation: 'listUsersCursor',
            cursor: filters.cursor,
          },
        });
      }

      // Build where clause following service layer patterns
      const where = this.buildWhereClause(filters);

      // Build order by with cursor pagination support
      const orderBy = this.buildOrderByClause(filters);

      // Execute query with cursor pagination
      const rows = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy,
        take: limit + 1, // Take one extra to check if there are more
        ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      });

      // Determine if there are more pages and extract items
      const hasNextPage = rows.length > limit;
      const items = hasNextPage ? rows.slice(0, limit) : rows;
      const nextCursor = hasNextPage ? rows[limit - 1].id : null;

      // Normalize data following service layer patterns
      const normalizedItems = items.map(item => this.normalizeUserData(item));

      return {
        items: normalizedItems as User[],
        nextCursor,
      };
    } catch (error) {
      processError(error);
      throw new StandardError({
        message: 'Failed to list users with cursor pagination',
        code: ErrorCodes.DATA.DATABASE_ERROR,
        cause: error,
        metadata: {
          component: 'UserService',
          operation: 'listUsersCursor',
          filters,
        },
      });
    }
  }

  /**
   * Helper: Build where clause for filtering
   * Following CORE_REQUIREMENTS.md patterns
   */
  private buildWhereClause(filters: UserFilters) {
    const where: Record<string, unknown> = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.department) {
      where.department = filters.department;
    }

    if (filters.role) {
      // Temporarily disable role filtering to test if that's causing the issue
      // where.roles = {
      //   some: {
      //     role: { name: filters.role },
      //     isActive: true
      //   }
      // };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return where;
  }

  /**
   * Helper: Build order by clause with cursor pagination support
   */
  private buildOrderByClause(filters: UserFilters) {
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    const orderBy: Record<string, string>[] = [{ [sortBy]: sortOrder }];

    // Add secondary sort for cursor pagination stability
    if (sortBy !== 'id') {
      orderBy.push({ id: sortOrder });
    }

    return orderBy;
  }

  /**
   * Update user with validation
   * Following CORE_REQUIREMENTS.md service layer patterns
   */
  async updateUserWithValidation(
    userId: string,
    data: UserUpdateData,
    updatedBy: string
  ): Promise<User> {
    try {
      // Check if email is being updated and if it's already taken
      if (data.email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: data.email,
            id: { not: userId },
          },
          select: { id: true },
        });

        if (existingUser) {
          throw new StandardError({
            message: `Email ${data.email} is already in use`,
            code: ErrorCodes.DATA.CONFLICT,
            metadata: {
              component: 'UserService',
              operation: 'updateUserWithValidation',
              userId,
              email: data.email,
            },
          });
        }
      }

      // Update user with proper data normalization
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email }),
          ...(data.department && { department: data.department }),
          ...(data.preferences && {
            preferences: toPrismaJson(data.preferences) as any,
          }),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Normalize and return
      return this.normalizeUserData(updatedUser) as User;
    } catch (error) {
      processError(error);

      if (error instanceof StandardError) {
        throw error;
      }

      if (isPrismaError(error)) {
        throw new StandardError({
          message: `Database operation failed during user update`,
          code: ErrorCodes.DATA.DATABASE_ERROR,
          cause: error,
          metadata: {
            component: 'UserService',
            operation: 'updateUserWithValidation',
            userId,
          },
        });
      }

      throw new StandardError({
        message: 'Failed to update user with validation',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        cause: error,
        metadata: {
          component: 'UserService',
          operation: 'updateUserWithValidation',
        },
      });
    }
  }

  /**
   * Helper: Normalize user data (null handling)
   * Following CORE_REQUIREMENTS.md transformation patterns
   */
  private normalizeUserData(user: any): NormalizedUserData {
    return {
      ...user,
      tenantId: user.tenantId || '',
      name: user.name || '',
      department: user.department || '',
      password: user.password || null,
      lastLogin: user.lastLogin || undefined,
    };
  }
}

// Singleton instance
export const userServiceInstance = new UserService();
