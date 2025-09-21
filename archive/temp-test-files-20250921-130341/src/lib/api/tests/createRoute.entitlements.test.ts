/** @jest-environment node */
import type { Jest } from '@jest/types';

// Mock EntitlementService before importing createRoute to avoid loading Prisma
jest.mock('@/lib/services/EntitlementService', () => ({
  __esModule: true,
  EntitlementService: {
    hasEntitlements: jest.fn(),
  },
}));

import { createRoute } from '@/lib/api/route';
import { EntitlementService } from '@/lib/services/EntitlementService';
import { getServerSession } from 'next-auth';

describe('createRoute entitlement enforcement', () => {
  const handler = createRoute(
    { requireAuth: true, entitlements: ['feature.advanced'] },
    async () => new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns 200 when required entitlements present', async () => {
    // Arrange
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'u1',
        email: 'u1@example.com',
        roles: ['admin'],
        tenantId: 't1',
      },
    });
    (EntitlementService.hasEntitlements as jest.Mock).mockResolvedValue(true);

    // Act
    const res = await handler(new Request('http://localhost/api/test'));

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
  });

  test('returns 403 when required entitlements missing', async () => {
    // Arrange
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'u1',
        email: 'u1@example.com',
        roles: ['admin'],
        tenantId: 't1',
      },
    });
    (EntitlementService.hasEntitlements as jest.Mock).mockResolvedValue(false);

    // Act
    const res = await handler(new Request('http://localhost/api/test'));

    // Assert
    expect(res.status).toBe(403);
  });
});

