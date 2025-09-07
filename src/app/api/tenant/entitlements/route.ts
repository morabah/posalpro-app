import { createRoute } from '@/lib/api/route';
import { EntitlementService } from '@/lib/services/EntitlementService';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

// GET /api/tenant/entitlements - Return current tenant entitlements (auth required)
export const GET = createRoute(
  { requireAuth: true, apiVersion: '1' },
  async ({ user }) => {
    const errorHandler = getErrorHandler({
      component: 'TenantEntitlementsAPI',
      operation: 'GET',
    });

    const map = await withAsyncErrorHandler(
      () => EntitlementService.getEntitlements((user as any).tenantId),
      'Failed to retrieve tenant entitlements',
      { component: 'TenantEntitlementsAPI', operation: 'GET' }
    );

    const keys = Object.keys(map).sort();
    const entitlementsData = { keys, map };

    return errorHandler.createSuccessResponse(
      entitlementsData,
      'Tenant entitlements retrieved successfully'
    );
  }
);
