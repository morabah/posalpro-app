/** @jest-environment node */
import { EntitlementService } from '../EntitlementService';

jest.mock('@/lib/db/prisma', () => ({
  __esModule: true,
  default: {
    entitlement: {
      findMany: jest.fn(async ({ where }: any) => {
        if (where?.tenantId === 't1') {
          return [
            { key: 'feature.a', value: null },
            { key: 'feature.b', value: 'on' },
          ];
        }
        return [];
      }),
    },
  },
}));

jest.mock('@/lib/redis', () => ({
  __esModule: true,
  getCache: jest.fn(async () => null),
  setCache: jest.fn(async () => undefined),
}));

describe('EntitlementService', () => {
  test('getEntitlements returns map', async () => {
    const map = await EntitlementService.getEntitlements('t1');
    expect(map['feature.a']).toBe(true);
    expect(map['feature.b']).toBe('on');
  });

  test('hasEntitlement works', async () => {
    expect(await EntitlementService.hasEntitlement('t1', 'feature.a')).toBe(true);
    expect(await EntitlementService.hasEntitlement('t1', 'feature.c')).toBe(false);
  });

  test('hasEntitlements requires all', async () => {
    expect(await EntitlementService.hasEntitlements('t1', ['feature.a', 'feature.b'])).toBe(true);
    expect(await EntitlementService.hasEntitlements('t1', ['feature.a', 'missing'])).toBe(false);
  });
});

