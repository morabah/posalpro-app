/**
 * PosalPro MVP2 - User Service
 * Enhanced with performance optimization and caching
 *
 * 🚀 PHASE 6 OPTIMIZATION: Aggressive caching and query optimization
 * Target: Reduce authentication time from 1138ms to <500ms
 */

import { prisma } from '@/lib/prisma';
import { Role, User } from '@prisma/client';

// ✅ CRITICAL: Performance optimization - User cache
const userCache = new Map<string, { user: AuthUserRecord; timestamp: number }>();
const USER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_SIZE = 100;

// ✅ CRITICAL: Performance optimization - Role cache
const roleCache = new Map<string, { roles: Role[]; timestamp: number }>();
const ROLE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ✅ CRITICAL: Cache cleanup function
function cleanupCache(cache: Map<string, any>, maxSize: number) {
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
    return cached.user;
  }

  return null;
}

// ✅ CRITICAL: Cache user data
function cacheUser(email: string, user: AuthUserRecord) {
  userCache.set(email, { user, timestamp: Date.now() });
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
  status: any;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
  roles: { role: { name: string } }[];
}

export async function getUserByEmail(email: string): Promise<AuthUserRecord | null> {
  try {
    // ✅ CRITICAL: Check cache first
    const cachedUser = await getCachedUser(email);
    if (cachedUser) {
      console.log(`📦 [User Cache] Cache hit for: ${email}`);
      return cachedUser;
    }

    console.log(`🔍 [User Service] Fetching user from database: ${email}`);

    // ✅ PERFORMANCE: Avoid transaction for single read to reduce auth latency
    const result = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
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
      cacheUser(email, result);
      console.log(`📦 [User Cache] Cached user: ${email}`);
    }

    return result;
  } catch (error) {
    console.error('[User Service] Error fetching user:', error);
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
    console.error('[User Service] Error updating last login:', error);
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
    console.error('[User Service] Error fetching users:', error);
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
    console.error('[User Service] Error fetching user roles:', error);
    return [];
  }
}

/**
 * Clear user cache (for testing or cache invalidation)
 */
export function clearUserCache(): void {
  userCache.clear();
  roleCache.clear();
  console.log('🧹 [User Cache] Cache cleared');
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
