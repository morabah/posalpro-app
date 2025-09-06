import { z } from 'zod';
import { createRoute } from '@/lib/api/route';
import { prisma } from '@/lib/db/prisma';
import { BillingSyncService } from '@/lib/services/BillingSyncService';

const Body = z.object({
  /** Optional: resync a specific tenant (Admins only). Defaults to current tenant. */
  tenantId: z.string().min(1).optional(),
});

export const POST = createRoute(
  { requireAuth: true, roles: ['Administrator', 'System Administrator'], body: Body, apiVersion: '1' },
  async ({ user, body }) => {
    const tenantId = body?.tenantId || (user as any).tenantId;

    // Fetch active subscription + plan for the tenant
    const sub = await prisma.subscription.findFirst({
      where: { tenantId, status: 'ACTIVE' },
      include: { plan: true },
    });
    if (!sub?.plan) {
      return new Response(
        JSON.stringify({ ok: false, error: 'no_active_subscription', message: 'No active subscription/plan for tenant' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Snapshot entitlements before
    const before = await prisma.entitlement.findMany({
      where: { tenantId },
      select: { key: true, enabled: true },
    });
    const beforeMap = new Map(before.map(e => [e.key, e.enabled]));

    // Sync to plan's tier
    await BillingSyncService.syncEntitlementsForPlan(tenantId, sub.plan.tier as any);

    // Snapshot after and compute diff
    const after = await prisma.entitlement.findMany({
      where: { tenantId },
      select: { key: true, enabled: true },
    });
    const enabledNow = after.filter(e => e.enabled).map(e => e.key);
    const disabledNow = after.filter(e => !e.enabled).map(e => e.key);

    const newlyEnabled = enabledNow.filter(k => beforeMap.get(k) !== true);
    const newlyDisabled = disabledNow.filter(k => beforeMap.get(k) !== false);

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          tenantId,
          plan: { id: sub.plan.id, name: sub.plan.name, tier: sub.plan.tier },
          changes: {
            newlyEnabled,
            newlyDisabled,
            totals: { enabled: enabledNow.length, disabled: disabledNow.length },
          },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
);

