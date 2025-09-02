// ====================
// PosalPro MVP2 - Bulk Version History Operations API Route
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

// ====================
// DELETE /api/proposals/versions/bulk-delete - Bulk delete version history entries
// ====================

/**
 * DELETE /api/proposals/versions/bulk-delete - Bulk delete version history entries
 *
 * Features:
 * - Bulk operations for administrative tasks
 * - Role-based access control (admin only)
 * - Comprehensive error handling
 * - Structured logging with hypothesis validation
 * - Component Traceability Matrix integration
 */
export const DELETE = createRoute(
  {
    roles: ['admin', 'System Administrator'],
    body: z.object({
      ids: z
        .array(z.string())
        .min(1, 'At least one ID is required')
        .max(100, 'Maximum 100 IDs allowed'),
    }),
  },
  async ({ body, user, requestId }) => {
    logInfo('version_history_bulk_delete_request', {
      component: 'VersionHistoryAPIBulkDelete',
      operation: 'DELETE',
      requestId,
      userId: user.id,
      requestedCount: body.ids.length,
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });

    const result = await versionHistoryService.bulkDeleteVersionHistory(body.ids);

    if (result.ok) {
      logInfo('version_history_bulk_delete_success', {
        component: 'VersionHistoryAPIBulkDelete',
        operation: 'DELETE',
        requestId,
        userId: user.id,
        requested: body.ids.length,
        deleted: result.data.deleted,
        failed: result.data.failed,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      return ok(result.data);
    } else {
      logInfo('version_history_bulk_delete_error', {
        component: 'VersionHistoryAPIBulkDelete',
        operation: 'DELETE',
        requestId,
        userId: user.id,
        errorCode: result.code,
        errorMessage: result.message,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      throw new Error(result.message);
    }
  }
);
