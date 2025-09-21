/** @jest-environment node */
import { extractSubdomain, runWithTenantContext, getCurrentTenant, getTenantFilter } from '../tenant';

describe('Tenant utils', () => {
  test('extractSubdomain parses correctly', () => {
    expect(extractSubdomain('acme.example.com')).toBe('acme');
    expect(extractSubdomain('acme.example.com:3000')).toBe('acme');
    expect(extractSubdomain('example.com')).toBeNull();
    expect(extractSubdomain('localhost:3000')).toBeNull();
  });

  test('ALS context is honored by getCurrentTenant and filters', async () => {
    await runWithTenantContext({ tenantId: 't_ctx' }, async () => {
      const ctx = getCurrentTenant();
      expect(ctx.tenantId).toBe('t_ctx');
      const filter = getTenantFilter();
      expect(filter).toEqual({ tenantId: 't_ctx' });
    });
  });
});

