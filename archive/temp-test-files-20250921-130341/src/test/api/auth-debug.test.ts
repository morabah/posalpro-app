/** @jest-environment node */

import { NextRequest } from 'next/server';

describe('Auth Debug API (dev)', () => {
  let debugGet: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    // Ensure non-production behavior is enabled inside the route
    process.env.NODE_ENV = 'test';

    // Mock next-auth session and token
    jest.doMock('next-auth', () => ({
      getServerSession: jest.fn(async () => ({
        user: {
          id: 'user_123',
          email: 'user@example.com',
          name: 'Test User',
          department: 'Sales',
          roles: ['Administrator'],
          permissions: ['*:*'],
          tenantId: 'tenant_001',
        },
        expires: '2099-12-31T23:59:59.000Z',
      })),
    }));

    jest.doMock('next-auth/jwt', () => ({
      getToken: jest.fn(async () => ({
        id: 'user_123',
        email: 'user@example.com',
        roles: ['Administrator'],
        permissions: ['*:*'],
        sessionId: 'sess_abc123',
      })),
    }));

    jest.resetModules();
    ({ GET: debugGet } = await import('../../app/api/auth/debug/route'));
  });

  test('returns session and token data for debugging', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/debug', { method: 'GET' });
    const res = await debugGet(req);

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.environment).toBeDefined();
    expect(data.session?.hasUser).toBe(true);
    expect(data.session?.user?.id).toBe('user_123');
    expect(data.session?.user?.email).toBe('user@example.com');
    expect(data.session?.user?.roles).toContain('Administrator');

    expect(data.token?.id).toBe('user_123');
    expect(data.token?.email).toBe('user@example.com');
    expect(data.token?.roles).toContain('Administrator');
    expect(data.token?.hasSessionId).toBe(true);
  });
});
