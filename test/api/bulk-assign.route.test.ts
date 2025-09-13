/** @jest-environment node */
import { POST as bulkAssign } from '@/app/api/proposals/[id]/product-selections/bulk-assign/route';

// Mock next-auth to always have a session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(async () => ({
    user: { id: 'u1', email: 'u1@test', tenantId: 't1', roles: ['Administrator'] },
  })),
}));

// Mock prisma client used in the route
jest.mock('@/lib/db/prisma', () => ({
  __esModule: true,
  default: {
    proposalProduct: {
      findMany: jest.fn(async ({ where }: any) => {
        // Return two products belonging to proposal p1
        return where.id.in.map((id: string) => ({ id, proposalId: 'p1' }));
      }),
      update: jest.fn(async ({ where, data }: any) => ({ id: where.id, ...data })),
    },
    proposalSection: {
      findMany: jest.fn(async ({ where }: any) => {
        return (where.id.in || []).map((id: string) => ({ id, proposalId: 'p1' }));
      }),
    },
    $transaction: jest.fn(async (ops: any[]) => {
      // Execute all mutation promises
      await Promise.all(ops.map(fn => (typeof fn === 'function' ? fn() : fn)));
      return [];
    }),
  },
}));

describe('bulk-assign route', () => {
  it('assigns multiple rows including null sectionId', async () => {
    const req = new Request('http://localhost/api/proposals/p1/product-selections/bulk-assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignments: [
          { proposalProductId: 'pp1', sectionId: 's1' },
          { proposalProductId: 'pp2', sectionId: null },
        ],
      }),
    });

    const res = await bulkAssign(req as any);
    expect(res.status).toBe(200);
    const json = await (res as Response).json();
    expect(json.ok).toBe(true);
  });
});
