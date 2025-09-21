/**
 * Dashboard API headers and OpenAPI paths tests
 */

import { GET as getStats } from '@/app/api/dashboard/stats/route';
import { GET as getEnhanced } from '@/app/api/dashboard/enhanced-stats/route';
import { GET as getExecutive } from '@/app/api/dashboard/executive/route';
import { GET as getOpenApi } from '@/app/api/docs/openapi.json/route';

// Mock next-auth and next-auth/jwt to avoid ES module issues
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(async () => ({
    user: {
      id: 'u1',
      email: 'admin@example.com',
      roles: ['Administrator'],
      entitlements: ['feature.analytics.dashboard', 'feature.analytics.enhanced', 'feature.analytics.executive']
    },
  })),
}));

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(async () => ({
    sub: 'u1',
    email: 'admin@example.com',
    roles: ['Administrator'],
    entitlements: ['feature.analytics.dashboard', 'feature.analytics.enhanced', 'feature.analytics.executive'],
  })),
}));

// Mock EntitlementService to allow dashboard access
jest.mock('@/lib/services/EntitlementService', () => ({
  EntitlementService: {
    hasEntitlements: jest.fn(async () => true),
  },
}));

// Mock Prisma to avoid database access during tests
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(async () => [{ count: 0 }]),
    $transaction: jest.fn(async (args: any[]) => Promise.all(args)),
    proposal: {
      groupBy: jest.fn(async () => []),
    },
    user: {
      findMany: jest.fn(async () => []),
    },
  },
}));

describe('Dashboard API headers', () => {
  it('stats route adds standard headers', async () => {
    const req = new Request('http://localhost/api/dashboard/stats');
    const res = await getStats(req as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-api-version')).toBe('1');
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });

  it('enhanced-stats route adds standard headers', async () => {
    const req = new Request('http://localhost/api/dashboard/enhanced-stats');
    const res = await getEnhanced(req as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-api-version')).toBe('1');
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });

  it('executive route adds standard headers', async () => {
    const req = new Request('http://localhost/api/dashboard/executive');
    const res = await getExecutive(req as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-api-version')).toBe('1');
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });
});

describe('Dashboard OpenAPI paths', () => {
  it('includes dashboard endpoints', async () => {
    const req = new Request('http://localhost/api/docs/openapi.json');
    const res = await getOpenApi(req as any);
    expect(res.status).toBe(200);
    const doc = await (res as Response).json();
    expect(doc.paths['/dashboard/stats']).toBeTruthy();
    expect(doc.paths['/dashboard/enhanced-stats']).toBeTruthy();
    expect(doc.paths['/dashboard/executive']).toBeTruthy();
  });
});
