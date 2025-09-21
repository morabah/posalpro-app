// Mock Prisma to avoid database dependencies in tests
jest.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    plan: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    subscription: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import {
  getActiveSubscriptionForTenant,
  getSeatStatus,
  getSubscriptionStatus,
  hasAvailableSeat,
} from '@/lib/services/subscriptionService';

describe('SubscriptionService seat status', () => {
  const tenantId = 'tenantSeatTest';

  beforeAll(async () => {
    // Mock the Prisma calls
    (prisma.tenant.create as jest.Mock).mockResolvedValue({
      id: tenantId,
      name: 'Seats Inc',
      domain: 'seats.local',
    });
    (prisma.plan.create as jest.Mock).mockResolvedValue({
      id: 'plan-1',
      name: 'PRO',
      tier: 'PRO',
      active: true,
    });
    (prisma.subscription.create as jest.Mock).mockResolvedValue({
      id: 'sub-1',
      tenantId,
      planId: 'plan-1',
      status: 'ACTIVE',
      seats: 1,
    });
    (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
      id: 'sub-1',
      tenantId,
      planId: 'plan-1',
      status: 'ACTIVE',
      seats: 1,
      plan: { id: 'plan-1', name: 'PRO', tier: 'PRO', active: true },
    });
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user-1',
      tenantId,
      email: 'u1@t.com',
      name: 'U1',
      department: 'Ops',
      status: 'ACTIVE',
    });
    (prisma.user.count as jest.Mock).mockResolvedValue(2); // 2 active users
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

describe('SubscriptionService Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tenant with no subscription', () => {
    it('should use DEFAULT_PLAN_SEATS when no subscription exists', async () => {
      const tenantId = 'no-subscription-tenant';

      // Mock no subscription found
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.count as jest.Mock).mockResolvedValue(3);

      // Set environment variable for default seats
      const originalDefaultSeats = process.env.DEFAULT_PLAN_SEATS;
      process.env.DEFAULT_PLAN_SEATS = '5';

      const status = await getSeatStatus(tenantId);

      expect(status.seats).toBe(5);
      expect(status.activeUsers).toBe(3);
      expect(status.hasAvailableSeat).toBe(true);

      // Restore environment variable
      if (originalDefaultSeats) {
        process.env.DEFAULT_PLAN_SEATS = originalDefaultSeats;
      } else {
        delete process.env.DEFAULT_PLAN_SEATS;
      }
    });

    it('should use default 5 seats when DEFAULT_PLAN_SEATS is not set', async () => {
      const tenantId = 'no-env-default-tenant';

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.count as jest.Mock).mockResolvedValue(2);

      // Ensure DEFAULT_PLAN_SEATS is not set
      delete process.env.DEFAULT_PLAN_SEATS;

      const status = await getSeatStatus(tenantId);

      expect(status.seats).toBe(5); // Default fallback
      expect(status.activeUsers).toBe(2);
      expect(status.hasAvailableSeat).toBe(true);
    });
  });

  describe('Subscription status transitions', () => {
    it('should handle PAST_DUE subscription status', async () => {
      const tenantId = 'past-due-tenant';

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-past-due',
        tenantId,
        planId: 'plan-1',
        status: 'PAST_DUE',
        seats: 10,
        plan: { id: 'plan-1', name: 'PRO', tier: 'PRO', active: true },
      });
      (prisma.user.count as jest.Mock).mockResolvedValue(8);

      const status = await getSeatStatus(tenantId);

      expect(status.seats).toBe(10);
      expect(status.activeUsers).toBe(8);
      expect(status.hasAvailableSeat).toBe(true);
    });

    it('should handle CANCELED subscription status', async () => {
      const tenantId = 'canceled-tenant';

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-canceled',
        tenantId,
        planId: 'plan-1',
        status: 'CANCELED',
        seats: 0,
        plan: { id: 'plan-1', name: 'PRO', tier: 'PRO', active: true },
      });
      (prisma.user.count as jest.Mock).mockResolvedValue(5);

      const status = await getSeatStatus(tenantId);

      expect(status.seats).toBe(0);
      expect(status.activeUsers).toBe(5);
      expect(status.hasAvailableSeat).toBe(false);
    });

    it('should handle TRIALING subscription status', async () => {
      const tenantId = 'trialing-tenant';

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-trialing',
        tenantId,
        planId: 'plan-trial',
        status: 'TRIALING',
        seats: 3,
        plan: { id: 'plan-trial', name: 'TRIAL', tier: 'TRIAL', active: true },
      });
      (prisma.user.count as jest.Mock).mockResolvedValue(2);

      const status = await getSeatStatus(tenantId);

      expect(status.seats).toBe(3);
      expect(status.activeUsers).toBe(2);
      expect(status.hasAvailableSeat).toBe(true);
    });
  });

  describe('Seat limit edge cases', () => {
    it('should handle exactly at seat limit', async () => {
      const tenantId = 'at-limit-tenant';

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-at-limit',
        tenantId,
        planId: 'plan-1',
        status: 'ACTIVE',
        seats: 5,
        plan: { id: 'plan-1', name: 'PRO', tier: 'PRO', active: true },
      });
      (prisma.user.count as jest.Mock).mockResolvedValue(5);

      const status = await getSeatStatus(tenantId);

      expect(status.seats).toBe(5);
      expect(status.activeUsers).toBe(5);
      expect(status.hasAvailableSeat).toBe(false);
    });

    it('should handle zero seats subscription', async () => {
      const tenantId = 'zero-seats-tenant';

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-zero',
        tenantId,
        planId: 'plan-free',
        status: 'ACTIVE',
        seats: 0,
        plan: { id: 'plan-free', name: 'FREE', tier: 'FREE', active: true },
      });
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      const status = await getSeatStatus(tenantId);

      expect(status.seats).toBe(0);
      expect(status.activeUsers).toBe(1);
      expect(status.hasAvailableSeat).toBe(false);
    });

    it('should handle large seat counts', async () => {
      const tenantId = 'enterprise-tenant';

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-enterprise',
        tenantId,
        planId: 'plan-enterprise',
        status: 'ACTIVE',
        seats: 1000,
        plan: { id: 'plan-enterprise', name: 'ENTERPRISE', tier: 'ENTERPRISE', active: true },
      });
      (prisma.user.count as jest.Mock).mockResolvedValue(750);

      const status = await getSeatStatus(tenantId);

      expect(status.seats).toBe(1000);
      expect(status.activeUsers).toBe(750);
      expect(status.hasAvailableSeat).toBe(true);
    });
  });
});

describe('SubscriptionService Error Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Database connection failures', () => {
    it('should handle subscription query database errors', async () => {
      const tenantId = 'db-error-tenant';

      (prisma.subscription.findFirst as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(getSeatStatus(tenantId)).rejects.toThrow('Database connection failed');
    });

    it('should handle user count query database errors', async () => {
      const tenantId = 'user-count-error-tenant';

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        tenantId,
        planId: 'plan-1',
        status: 'ACTIVE',
        seats: 5,
        plan: { id: 'plan-1', name: 'PRO', tier: 'PRO', active: true },
      });
      (prisma.user.count as jest.Mock).mockRejectedValue(new Error('User count query failed'));

      await expect(getSeatStatus(tenantId)).rejects.toThrow('User count query failed');
    });

    it('should handle getActiveSubscriptionForTenant database errors', async () => {
      const tenantId = 'active-sub-error-tenant';

      (prisma.subscription.findFirst as jest.Mock).mockRejectedValue(
        new Error('Active subscription query failed')
      );

      await expect(getActiveSubscriptionForTenant(tenantId)).rejects.toThrow(
        'Active subscription query failed'
      );
    });
  });

  describe('Invalid input handling', () => {
    it('should handle null tenant ID', async () => {
      await expect(getSeatStatus(null as any)).rejects.toThrow();
    });

    it('should handle undefined tenant ID', async () => {
      await expect(getSeatStatus(undefined as any)).rejects.toThrow();
    });

    it('should handle empty string tenant ID', async () => {
      const tenantId = '';

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      const status = await getSeatStatus(tenantId);

      expect(status.tenantId).toBe('');
      expect(status.seats).toBe(5); // Default fallback
    });

    it('should handle malformed tenant ID', async () => {
      const tenantId = 'invalid-tenant-id-format-12345';

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      const status = await getSeatStatus(tenantId);

      expect(status.tenantId).toBe(tenantId);
      expect(status.seats).toBe(5); // Default fallback
    });
  });

  describe('Data corruption scenarios', () => {
    it('should handle subscription with null seats', async () => {
      const tenantId = 'null-seats-tenant';

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-null-seats',
        tenantId,
        planId: 'plan-1',
        status: 'ACTIVE',
        seats: null,
        plan: { id: 'plan-1', name: 'PRO', tier: 'PRO', active: true },
      });
      (prisma.user.count as jest.Mock).mockResolvedValue(3);

      const status = await getSeatStatus(tenantId);

      expect(status.seats).toBe(5); // Should fallback to default
      expect(status.activeUsers).toBe(3);
    });

    it('should handle subscription with negative seats', async () => {
      const tenantId = 'negative-seats-tenant';

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-negative-seats',
        tenantId,
        planId: 'plan-1',
        status: 'ACTIVE',
        seats: -5,
        plan: { id: 'plan-1', name: 'PRO', tier: 'PRO', active: true },
      });
      (prisma.user.count as jest.Mock).mockResolvedValue(3);

      const status = await getSeatStatus(tenantId);

      expect(status.seats).toBe(-5); // Should preserve negative value for business logic
      expect(status.activeUsers).toBe(3);
      expect(status.hasAvailableSeat).toBe(false);
    });

    it('should handle subscription with missing plan data', async () => {
      const tenantId = 'missing-plan-tenant';

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-missing-plan',
        tenantId,
        planId: 'plan-1',
        status: 'ACTIVE',
        seats: 5,
        plan: null,
      });
      (prisma.user.count as jest.Mock).mockResolvedValue(3);

      const status = await getSeatStatus(tenantId);

      expect(status.seats).toBe(5);
      expect(status.activeUsers).toBe(3);
      expect(status.hasAvailableSeat).toBe(true);
    });
  });

  describe('Concurrent access scenarios', () => {
    it('should handle rapid concurrent seat status requests', async () => {
      const tenantId = 'concurrent-tenant';

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-concurrent',
        tenantId,
        planId: 'plan-1',
        status: 'ACTIVE',
        seats: 10,
        plan: { id: 'plan-1', name: 'PRO', tier: 'PRO', active: true },
      });
      (prisma.user.count as jest.Mock).mockResolvedValue(5);

      // Simulate concurrent requests
      const promises = Array.from({ length: 10 }, () => getSeatStatus(tenantId));
      const results = await Promise.all(promises);

      // All results should be consistent
      results.forEach(result => {
        expect(result.seats).toBe(10);
        expect(result.activeUsers).toBe(5);
        expect(result.hasAvailableSeat).toBe(true);
      });
    });
  });
});

describe('SubscriptionService Performance Benchmarks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Seat calculation performance', () => {
    it('should complete seat status calculation within 100ms for small datasets', async () => {
      const tenantId = 'perf-small-tenant';

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-perf-small',
        tenantId,
        planId: 'plan-1',
        status: 'ACTIVE',
        seats: 10,
        plan: { id: 'plan-1', name: 'PRO', tier: 'PRO', active: true },
      });
      (prisma.user.count as jest.Mock).mockResolvedValue(5);

      const startTime = performance.now();
      const status = await getSeatStatus(tenantId);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(100); // Should complete within 100ms
      expect(status.seats).toBe(10);
      expect(status.activeUsers).toBe(5);
    });

    it('should complete seat status calculation within 500ms for large datasets', async () => {
      const tenantId = 'perf-large-tenant';

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-perf-large',
        tenantId,
        planId: 'plan-enterprise',
        status: 'ACTIVE',
        seats: 10000,
        plan: { id: 'plan-enterprise', name: 'ENTERPRISE', tier: 'ENTERPRISE', active: true },
      });
      (prisma.user.count as jest.Mock).mockResolvedValue(7500);

      const startTime = performance.now();
      const status = await getSeatStatus(tenantId);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(500); // Should complete within 500ms
      expect(status.seats).toBe(10000);
      expect(status.activeUsers).toBe(7500);
    });

    it('should handle bulk seat status calculations efficiently', async () => {
      const tenantIds = Array.from({ length: 100 }, (_, i) => `bulk-tenant-${i}`);

      // Mock responses for all tenants
      tenantIds.forEach(tenantId => {
        (prisma.subscription.findFirst as jest.Mock).mockResolvedValueOnce({
          id: `sub-${tenantId}`,
          tenantId,
          planId: 'plan-1',
          status: 'ACTIVE',
          seats: 10,
          plan: { id: 'plan-1', name: 'PRO', tier: 'PRO', active: true },
        });
        (prisma.user.count as jest.Mock).mockResolvedValueOnce(5);
      });

      const startTime = performance.now();
      const results = await Promise.all(tenantIds.map(tenantId => getSeatStatus(tenantId)));
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result.seats).toBe(10);
        expect(result.activeUsers).toBe(5);
      });
    });
  });

  describe('Memory usage benchmarks', () => {
    it('should not leak memory during repeated seat calculations', async () => {
      const tenantId = 'memory-test-tenant';

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-memory',
        tenantId,
        planId: 'plan-1',
        status: 'ACTIVE',
        seats: 10,
        plan: { id: 'plan-1', name: 'PRO', tier: 'PRO', active: true },
      });
      (prisma.user.count as jest.Mock).mockResolvedValue(5);

      const initialMemory = process.memoryUsage().heapUsed;

      // Perform 1000 seat calculations
      for (let i = 0; i < 1000; i++) {
        await getSeatStatus(tenantId);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Subscription status performance', () => {
    it('should complete subscription status lookup within 50ms', async () => {
      const tenantId = 'status-perf-tenant';

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-status',
        tenantId,
        planId: 'plan-1',
        status: 'ACTIVE',
        seats: 10,
      });

      const startTime = performance.now();
      const status = await getSubscriptionStatus(tenantId);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(50); // Should complete within 50ms
      expect(status.tenantId).toBe(tenantId);
      expect(status.status).toBe('ACTIVE');
    });
  });
});
