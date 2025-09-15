// ====================
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
// PosalPro MVP2 - Version History Statistics API Route
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
// GET /api/proposals/versions/stats - Version history statistics
// ====================

/**
 * GET /api/proposals/versions/stats - Get version history statistics
 *
 * Features:
 * - Comprehensive version history analytics
 * - Change type breakdown statistics
 * - User activity tracking
 * - Date range filtering support
 * - Role-based access control
 * - Comprehensive error handling
 * - Structured logging with hypothesis validation
 */
export const GET = createRoute(
  {
    roles: ['admin', 'sales', 'viewer', 'System Administrator'],
    query: z
      .object({
        proposalId: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
      .optional(),
  },
  async ({ query, user, requestId }) => {
    const params = query || {};

    logInfo('version_history_stats_request', {
      component: 'VersionHistoryAPIStats',
      operation: 'GET',
      requestId,
      userId: user.id,
      statsParams: params,
      userStory: 'US-5.2',
      hypothesis: 'H9',
    });

    const result = await versionHistoryService.getVersionHistoryStats(params);

    if (result.ok) {
      logInfo('version_history_stats_success', {
        component: 'VersionHistoryAPIStats',
        operation: 'GET',
        requestId,
        userId: user.id,
        totalVersions: result.data.totalVersions,
        totalProposals: result.data.totalProposals,
        changeTypes: Object.keys(result.data.changeTypeBreakdown || {}),
        userStory: 'US-5.2',
        hypothesis: 'H9',
      });

      return ok(result.data);
    } else {
      logInfo('version_history_stats_error', {
        component: 'VersionHistoryAPIStats',
        operation: 'GET',
        requestId,
        userId: user.id,
        errorCode: result.code,
        errorMessage: result.message,
        userStory: 'US-5.2',
        hypothesis: 'H9',
      });

      throw new Error(result.message);
    }
  }
);
