import { prisma } from '@/lib/db/prisma';
import { getSeatStatus, hasAvailableSeat } from '@/lib/services/subscriptionService';

describe('SubscriptionService seat status', () => {
  const tenantId = 'tenantSeatTest';

  beforeAll(async () => {
    await prisma.tenant.create({ data: { id: tenantId, name: 'Seats Inc', domain: 'seats.local' } });
    const plan = await prisma.plan.create({ data: { name: 'PRO', tier: 'PRO', active: true } });
    await prisma.subscription.create({ data: { tenantId, planId: plan.id, status: 'ACTIVE', seats: 1 } });
    await prisma.user.create({
      data: {
        tenantId,
        email: 'u1@t.com',
        name: 'U1',
        department: 'Ops',
        status: 'ACTIVE',
        password: 'x',
      },
    });
    await prisma.user.create({
      data: {
        tenantId,
        email: 'u2@t.com',
        name: 'U2',
        department: 'Ops',
        status: 'ACTIVE',
        password: 'y',
      },
    });
  });

  it('reports no available seats when active users >= seats', async () => {
    const status = await getSeatStatus(tenantId);
    expect(status.seats).toBe(1);
    expect(status.activeUsers).toBeGreaterThanOrEqual(1);
    expect(status.hasAvailableSeat).toBe(false);
  });

  it('hasAvailableSeat returns false', async () => {
    const ok = await hasAvailableSeat(tenantId);
    expect(ok).toBe(false);
  });
});

