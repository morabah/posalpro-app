import { prisma } from '@/lib/prisma';
import { PLAN_TIER_ENTITLEMENTS } from '@/lib/billing/entitlementMapping';

export class BillingSyncService {
  static async upsertPlan(name: string, tier: 'FREE' | 'PRO' | 'ENTERPRISE') {
    return prisma.plan.upsert({
      where: { name },
      update: { tier, active: true },
      create: { name, tier, active: true },
    });
  }

  static async setTenantSubscription(
    tenantId: string,
    planName: string,
    seats: number,
    options?: { stripeSubscriptionId?: string; actorId?: string; source?: 'webhook' | 'admin' }
  ) {
    const plan = await this.upsertPlan(planName, (planName.toUpperCase() as any) || 'FREE');
    const existing = await prisma.subscription.findFirst({ where: { tenantId } });
    if (existing) {
      const updated = await prisma.subscription.update({
        where: { id: existing.id },
        data: { planId: plan.id, status: 'ACTIVE', seats, stripeSubscriptionId: options?.stripeSubscriptionId },
      });
      // Simple audit
      await prisma.auditLog.create({
        data: {
          actorId: options?.actorId || null,
          model: 'Subscription',
          action: 'UPDATE',
          targetId: updated.id,
          diff: {
            planId: plan.id,
            seats,
            stripeSubscriptionId: options?.stripeSubscriptionId || updated.stripeSubscriptionId || null,
            source: options?.source || 'admin',
          },
        },
      }).catch(() => void 0);
    } else {
      const created = await prisma.subscription.create({
        data: { tenantId, planId: plan.id, status: 'ACTIVE', seats, stripeSubscriptionId: options?.stripeSubscriptionId },
      });
      await prisma.auditLog.create({
        data: {
          actorId: options?.actorId || null,
          model: 'Subscription',
          action: 'CREATE',
          targetId: created.id,
          diff: {
            planId: plan.id,
            seats,
            stripeSubscriptionId: options?.stripeSubscriptionId || null,
            source: options?.source || 'admin',
          },
        },
      }).catch(() => void 0);
    }
    await this.syncEntitlementsForPlan(tenantId, plan.tier);
  }

  static async syncEntitlementsForPlan(tenantId: string, tier: 'FREE' | 'PRO' | 'ENTERPRISE') {
    const entKeys = new Set(PLAN_TIER_ENTITLEMENTS[tier] || []);
    // Enable entitlements present in plan
    await Promise.all(
      Array.from(entKeys).map(key =>
        prisma.entitlement.upsert({
          where: { tenantId_key: { tenantId, key } },
          update: { enabled: true, value: null },
          create: { tenantId, key, enabled: true },
        })
      )
    );
    // Disable other entitlements for tenant
    await prisma.entitlement.updateMany({
      where: { tenantId, key: { notIn: Array.from(entKeys) } },
      data: { enabled: false },
    });
  }
}
