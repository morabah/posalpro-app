// ====================
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
// PosalPro MVP2 - Version History Search API Route
// ====================

// Component Traceability Matrix (CTM) - API Route Implementation
// User Stories: US-5.1 (Version History), US-5.2 (Change Tracking)
// Acceptance Criteria: AC-5.1.1 (View version history), AC-5.2.1 (Track changes)
// Hypotheses: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
// Test Cases: TC-H8-120 (Version history pagination), TC-H9-075 (Change tracking display)

import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import { logInfo } from '@/lib/logger';
import { versionHistoryService } from '@/services/versionHistoryService';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ====================
// GET /api/proposals/versions/search - Search version history
// ====================

/**
 * GET /api/proposals/versions/search - Search version history entries
 *
 * Features:
 * - Full-text search across version history
 * - Role-based access control
 * - Cursor-based pagination support
 * - Comprehensive error handling
 * - Structured logging with hypothesis validation
 */
export const GET = createRoute(
  {
    roles: ['admin', 'sales', 'viewer', 'System Administrator'],
    query: z.object({
      q: z.string().min(1, 'Search query is required'),
      proposalId: z.string().optional(),
      limit: z.coerce.number().min(1).max(100).default(20),
      cursorCreatedAt: z.string().optional(),
      cursorId: z.string().optional(),
    }),
  },
  async ({ query, user, requestId }) => {
    logInfo('version_history_search_request', {
      component: 'VersionHistoryAPISearch',
      operation: 'GET',
      requestId,
      userId: user.id,
      query: query.q,
      proposalId: query.proposalId,
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });

    const result = await versionHistoryService.searchVersionHistory(query.q, {
      proposalId: query.proposalId,
      limit: query.limit,
      cursorCreatedAt: query.cursorCreatedAt,
      cursorId: query.cursorId,
    });

    if (result.ok) {
      logInfo('version_history_search_success', {
        component: 'VersionHistoryAPISearch',
        operation: 'GET',
        requestId,
        userId: user.id,
        query: query.q,
        resultCount: result.data.items.length,
        hasNextPage: result.data.pagination.hasNextPage,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      return ok(result.data);
    } else {
      logInfo('version_history_search_error', {
        component: 'VersionHistoryAPISearch',
        operation: 'GET',
        requestId,
        userId: user.id,
        query: query.q,
        errorCode: result.code,
        errorMessage: result.message,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      throw new Error(result.message);
    }
  }
);
