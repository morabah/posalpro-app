import { prisma } from '@/lib/prisma';

export interface SeatStatus {
  tenantId: string;
  seats: number;
  activeUsers: number;
  hasAvailableSeat: boolean;
}

export async function getActiveSubscriptionForTenant(tenantId: string) {
  return prisma.subscription.findFirst({
    where: { tenantId, status: 'ACTIVE' },
    include: { plan: true },
  });
}

export async function getSeatStatus(tenantId: string): Promise<SeatStatus> {
  const subscription = await getActiveSubscriptionForTenant(tenantId);
  const seats = subscription?.seats ?? Number(process.env.DEFAULT_PLAN_SEATS || 5);
  const activeUsers = await prisma.user.count({ where: { tenantId, status: 'ACTIVE' } });
  return { tenantId, seats, activeUsers, hasAvailableSeat: activeUsers < seats };
}

export async function hasAvailableSeat(tenantId: string): Promise<boolean> {
  const status = await getSeatStatus(tenantId);
  return status.hasAvailableSeat;
}

export type SubscriptionStatusValue = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'NONE';

export async function getSubscriptionStatus(tenantId: string): Promise<{
  tenantId: string;
  status: SubscriptionStatusValue;
  seats: number;
}> {
  const sub = await prisma.subscription.findFirst({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' },
  });
  if (!sub) return { tenantId, status: 'NONE', seats: Number(process.env.DEFAULT_PLAN_SEATS || 5) };
  const status = (sub.status as any) as SubscriptionStatusValue;
  return { tenantId, status, seats: sub.seats };
}
