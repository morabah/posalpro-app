import { createRoute } from '@/lib/api/route';
import { EntitlementService } from '@/lib/services/EntitlementService';

// GET /api/tenant/entitlements - Return current tenant entitlements (auth required)
export const GET = createRoute(
  { requireAuth: true, apiVersion: '1' },
  async ({ user }) => {
    const map = await EntitlementService.getEntitlements((user as any).tenantId);
    const keys = Object.keys(map).sort();
    return new Response(
      JSON.stringify({ ok: true, data: { keys, map } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
);

