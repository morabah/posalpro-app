// ====================
// PosalPro MVP2 - Version History API Route
// ====================

// Component Traceability Matrix (CTM) - API Route Implementation
// User Stories: US-5.1 (Version History), US-5.2 (Change Tracking)
// Acceptance Criteria: AC-5.1.1 (View version history), AC-5.2.1 (Track changes)
// Hypotheses: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
// Test Cases: TC-H8-120 (Version history pagination), TC-H9-075 (Change tracking display)

import { VersionHistoryQuerySchema } from '@/features/version-history/schemas';
import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import { logInfo } from '@/lib/logger';
import { versionHistoryService } from '@/services/versionHistoryService';
import { z } from 'zod';

// ====================
// Modern API Route - GET /api/proposals/versions
// ====================

/**
 * GET /api/proposals/versions - List proposal version entries with cursor pagination
 *
 * Features:
 * - Cursor-based pagination (recommended for version history)
 * - Automatic caching with Redis
 * - Role-based access control (RBAC)
 * - Comprehensive error handling
 * - Structured logging with hypothesis validation
 * - Component Traceability Matrix integration
 */
export const GET = createRoute(
  {
    roles: ['admin', 'sales', 'viewer', 'System Administrator'],
    query: VersionHistoryQuerySchema,
  },
  async ({ query, user, requestId }) => {
    // Log request with traceability metadata
    logInfo('version_history_api_request', {
      component: 'VersionHistoryAPI',
      operation: 'GET',
      requestId,
      userId: user.id,
      queryParams: query,
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });

    // Use the modernized version history service
    const result = await versionHistoryService.getVersionHistory(query);

    // Check if the response is successful
    if (result.ok) {
      // Log successful response
      logInfo('version_history_api_success', {
        component: 'VersionHistoryAPI',
        operation: 'GET',
        requestId,
        userId: user.id,
        resultCount: result.data.items.length,
        hasNextPage: result.data.pagination.hasNextPage,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      return ok(result.data);
    } else {
      // Log error response
      logInfo('version_history_api_error', {
        component: 'VersionHistoryAPI',
        operation: 'GET',
        requestId,
        userId: user.id,
        errorCode: result.code,
        errorMessage: result.message,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      // Return error response (this will be handled by createRoute's error handling)
      throw new Error(result.message);
    }
  }
);

// ====================
// GET /api/proposals/versions/search - Search version history
// ====================

/**
 * GET /api/proposals/versions/search - Search version history entries
 */
export const POST = createRoute(
  {
    roles: ['admin', 'sales', 'viewer', 'System Administrator'],
    body: z.object({
      query: z.string().min(1, 'Search query is required'),
      proposalId: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      cursorCreatedAt: z.string().optional(),
      cursorId: z.string().optional(),
    }),
  },
  async ({ body, user, requestId }) => {
    logInfo('version_history_search_request', {
      component: 'VersionHistoryAPISearch',
      operation: 'POST',
      requestId,
      userId: user.id,
      query: body.query,
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });

    const result = await versionHistoryService.searchVersionHistory(body.query, {
      proposalId: body.proposalId,
      limit: body.limit,
      cursorCreatedAt: body.cursorCreatedAt,
      cursorId: body.cursorId,
    });

    if (result.ok) {
      logInfo('version_history_search_success', {
        component: 'VersionHistoryAPISearch',
        operation: 'POST',
        requestId,
        userId: user.id,
        query: body.query,
        resultCount: result.data.items.length,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      return ok(result.data);
    } else {
      logInfo('version_history_search_error', {
        component: 'VersionHistoryAPISearch',
        operation: 'POST',
        requestId,
        userId: user.id,
        query: body.query,
        errorCode: result.code,
        errorMessage: result.message,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      throw new Error(result.message);
    }
  }
);

// ====================
// End of main route file
// ====================
// Note: Search and Stats endpoints are implemented in separate files
