/** @jest-environment node */
import { createRoute } from '../../api/route';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(async () => ({
    user: { id: 'u1', email: 'u1@test', tenantId: 't1', roles: ['Administrator'] },
  })),
}));

jest.mock('../../services/EntitlementService', () => ({
  EntitlementService: {
    hasEntitlements: jest.fn(async (_tenantId: string, keys: string[]) => {
      // Simulate that only 'feature.a' is granted
      return keys.every(k => k === 'feature.a');
    }),
  },
}));

describe('createRoute entitlement enforcement', () => {
  const okHandler = createRoute(
    { requireAuth: true, entitlements: ['feature.a'] },
    async () => new Response(JSON.stringify({ ok: true }), { status: 200 })
  );
  const deniedHandler = createRoute(
    { requireAuth: true, entitlements: ['feature.b'] },
    async () => new Response(JSON.stringify({ ok: true }), { status: 200 })
  );

  test('allows when entitlements satisfied', async () => {
    const res = await okHandler(new Request('http://localhost/api/test'));
    expect(res.status).toBe(200);
  });

  test('denies when entitlements missing', async () => {
    const res = await deniedHandler(new Request('http://localhost/api/test'));
    expect(res.status).toBe(403);
  });
});

