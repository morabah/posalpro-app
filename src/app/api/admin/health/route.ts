/**
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
 * PosalPro MVP2 - Admin Health API Route
 * Token-protected health endpoint for admin checks with modern createRoute wrapper
 * Based on ADMIN_MIGRATION_ASSESSMENT.md and CORE_REQUIREMENTS.md
 */

import { createRoute } from '@/lib/api/route';
import { ok } from '@/lib/api/response';
import { logInfo } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Component Traceability Matrix
 */
const COMPONENT_MAPPING = {
  userStories: ['US-7.1', 'US-7.2'],
  acceptanceCriteria: ['AC-7.1.1', 'AC-7.2.1'],
  methods: ['getHealth()'],
  hypotheses: ['H8'],
  testCases: ['TC-H8-001'],
};

// GET /api/admin/health - Admin health check with modern createRoute wrapper
export const GET = createRoute(
  {
    roles: ['System Administrator', 'Administrator'],
    apiVersion: '1',
  },
  async ({ req, user, requestId }) => {
    logInfo('Admin health check successful', {
      component: 'AdminHealthAPI',
      operation: 'GET',
      userId: user.id,
      requestId,
      scope: 'admin',
    });

    return ok({
      scope: 'admin',
      timestamp: new Date().toISOString(),
    });
  }
);
