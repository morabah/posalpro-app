/**
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
 * PosalPro MVP2 - Users API Routes - Service Layer Architecture
 * Following CORE_REQUIREMENTS.md service layer patterns
 * Component Traceability: US-2.1, US-2.2, H4, H7
 *
 * ✅ SERVICE LAYER COMPLIANCE: Removed direct Prisma calls from routes
 * ✅ BUSINESS LOGIC SEPARATION: Complex logic moved to userService
 * ✅ CURSOR PAGINATION: Uses service layer cursor-based pagination
 * ✅ NORMALIZED TRANSFORMATIONS: Centralized in service layer
 * ✅ ERROR HANDLING: Integrated standardized error handling
 */

import { createRoute } from '@/lib/api/route';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { userServiceInstance } from '@/lib/services/userService';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Component Traceability Matrix:
 * - User Stories: US-2.1 (User Profile Management), US-2.2 (User Activity Tracking), US-6.1 (Performance Optimization)
 * - Acceptance Criteria: AC-2.1.1, AC-2.1.2, AC-2.2.1, AC-2.2.2, AC-6.1.1 (Cursor Pagination)
 * - Hypotheses: H4 (Cross-Department Coordination), H7 (Deadline Management), H8 (Load Time Optimization), H11 (Cache Hit Rate)
 * - Methods: getUserProfile(), updateUserProfile(), getUserActivity(), getCursorPaginatedUsers()
 * - Test Cases: TC-H4-002, TC-H7-002, TC-H8-020, TC-H11-015
 */

/**
 * Simplified validation schemas following service layer patterns
 */
const UserQuerySchema = z.object({
  // Cursor-based pagination
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),

  // Filtering options
  search: z.string().optional(),
  department: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),

  // Sorting options
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * GET /api/users - List users with cursor pagination
 * Accessible to authenticated users for collaboration purposes
 */
export const GET = createRoute(
  {
    query: UserQuerySchema,
    apiVersion: '1',
  },
  async ({ query, user, requestId }) => {
    const errorHandler = getErrorHandler({ component: 'UserAPI', operation: 'GET' });
    const start = performance.now();

    logDebug('API: Fetching users with cursor pagination', {
      component: 'UserAPI',
      operation: 'GET /api/users',
      query,
      userId: user.id,
      requestId,
    });

    try {
      // Convert query to service filters following CORE_REQUIREMENTS.md patterns
      const filters = {
        search: query!.search,
        department: query!.department,
        role: query!.role,
        status: query!.status,
        sortBy: query!.sortBy,
        sortOrder: query!.sortOrder,
        limit: query!.limit,
        cursor: query!.cursor,
      };

      // Delegate to service layer (business logic belongs here)
      const result = await withAsyncErrorHandler(
        () => userServiceInstance.listUsersCursor(filters),
        'GET users failed',
        { component: 'UserAPI', operation: 'GET' }
      );

      const loadTime = performance.now() - start;

      logInfo('API: Users fetched successfully', {
        component: 'UserAPI',
        operation: 'GET /api/users',
        count: result.items.length,
        hasNextPage: !!result.nextCursor,
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      // Return response with pagination metadata
      return NextResponse.json({
        ok: true,
        data: {
          users: result.items,
          pagination: {
            nextCursor: result.nextCursor,
            hasNextPage: !!result.nextCursor,
          },
          meta: {
            paginationType: 'cursor',
            responseTimeMs: Math.round(loadTime),
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
          },
        },
        message: 'Users retrieved successfully',
      });
    } catch (error) {
      const loadTime = performance.now() - start;

      logError('API: Error fetching users', {
        component: 'UserAPI',
        operation: 'GET /api/users',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createErrorResponse(error, 'Fetch failed');
    }
  }
);

/**
 * PUT /api/users - Update current user profile
 * Users can only update their own profile
 */
export const PUT = createRoute(
  {
    body: z.object({
      name: z.string().min(1).max(100).optional(),
      email: z.string().email().optional(),
      department: z.string().max(100).optional(),
      preferences: z.record(z.any()).optional(),
    }),
    apiVersion: '1',
  },
  async ({ body, user, requestId }) => {
    const errorHandler = getErrorHandler({ component: 'UserAPI', operation: 'PUT' });
    const start = performance.now();

    logDebug('API: Updating user profile', {
      component: 'UserAPI',
      operation: 'PUT /api/users',
      data: body,
      userId: user.id,
      requestId,
    });

    try {
      // Users can only update their own profile
      const userId = user.id;

      // Delegate to service layer (business logic belongs here)
      const updatedUser = await withAsyncErrorHandler(
        () => userServiceInstance.updateUserWithValidation(userId, body!, user.id),
        'PUT user failed',
        { component: 'UserAPI', operation: 'PUT' }
      );

      const loadTime = performance.now() - start;

      logInfo('API: User profile updated successfully', {
        component: 'UserAPI',
        operation: 'PUT /api/users',
        updatedUserId: updatedUser.id,
        userName: updatedUser.name,
        loadTime: Math.round(loadTime),
        requestingUserId: user.id,
        requestId,
      });

      // Return response with updated user data
      return NextResponse.json({
        ok: true,
        data: updatedUser,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      const loadTime = performance.now() - start;

      logError('API: Error updating user profile', {
        component: 'UserAPI',
        operation: 'PUT /api/users',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createErrorResponse(error, 'Update failed');
    }
  }
);
