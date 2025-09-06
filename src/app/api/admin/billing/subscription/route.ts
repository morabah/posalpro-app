import { z } from 'zod';
import { createRoute } from '@/lib/api/route';
import { prisma } from '@/lib/db/prisma';
import { BillingSyncService } from '@/lib/services/BillingSyncService';
import { getActiveSubscriptionForTenant } from '@/lib/services/subscriptionService';

// GET /api/admin/billing/subscription
export const GET = createRoute({ requireAuth: true, roles: ['Administrator', 'System Administrator'], apiVersion: '1' }, async ({ user }) => {
  const tenantId = (user as any).tenantId;

  const [subscription, tenant, entRows] = await Promise.all([
    getActiveSubscriptionForTenant(tenantId),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, stripeCustomerId: true } }),
    prisma.entitlement.findMany({ where: { tenantId }, select: { key: true, enabled: true } }),
  ]);

  const entitlements = entRows.filter(e => e.enabled).map(e => e.key).sort();

  return new Response(
    JSON.stringify({
      ok: true,
      data: {
        tenantId,
        stripeCustomerId: tenant?.stripeCustomerId || null,
        subscription: subscription
          ? {
              id: subscription.id,
              status: subscription.status,
              seats: subscription.seats,
              stripeSubscriptionId: (subscription as any).stripeSubscriptionId || null,
              plan: { id: subscription.plan.id, name: subscription.plan.name, tier: subscription.plan.tier },
            }
          : null,
        entitlements,
        enforcement: {
          subscription: process.env.SUBSCRIPTION_ENFORCEMENT === 'true',
          seats: process.env.SEAT_ENFORCEMENT === 'true',
        },
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});

// PUT /api/admin/billing/subscription  { planName?: string, seats?: number }
const UpdateBody = z.object({
  planName: z.string().min(1).optional(),
  seats: z.number().int().positive().max(100000).optional(),
});

export const PUT = createRoute(
  { requireAuth: true, roles: ['Administrator', 'System Administrator'], body: UpdateBody, apiVersion: '1' },
  async ({ user, body }) => {
    const tenantId = (user as any).tenantId;

    // Resolve current plan name if not provided
    const current = await getActiveSubscriptionForTenant(tenantId);
    const planName = (body?.planName || current?.plan?.name || 'FREE').toUpperCase();
    const seats = body?.seats ?? current?.seats ?? Number(process.env.DEFAULT_PLAN_SEATS || 5);

    await BillingSyncService.setTenantSubscription(tenantId, planName, seats);

    const updated = await getActiveSubscriptionForTenant(tenantId);
    const entRows = await prisma.entitlement.findMany({ where: { tenantId, enabled: true }, select: { key: true } });

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          subscription: updated
            ? {
                id: updated.id,
                status: updated.status,
                seats: updated.seats,
                stripeSubscriptionId: (updated as any).stripeSubscriptionId || null,
                plan: { id: updated.plan.id, name: updated.plan.name, tier: updated.plan.tier },
              }
            : null,
          entitlements: entRows.map(e => e.key).sort(),
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
);
