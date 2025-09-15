import prisma from '@/lib/prisma';
import { runWithTenantContext } from '@/lib/tenant';

describe('Prisma tenant middleware', () => {
  const tenantA = { tenantId: 'tenantA' } as any;
  const tenantB = { tenantId: 'tenantB' } as any;
  let productA: { id: string };
  let productB: { id: string };

  beforeAll(async () => {
    // Create tenants
    await prisma.tenant.create({ data: { id: tenantA.tenantId, name: 'A', domain: 'a.local' } });
    await prisma.tenant.create({ data: { id: tenantB.tenantId, name: 'B', domain: 'b.local' } });

    // Create one product per tenant
    productA = (await runWithTenantContext(tenantA, async () =>
      prisma.product.create({
        data: { name: 'PA', description: 'A', sku: 'SKU-A', price: 1, currency: 'USD' },
      })
    )) as any;

    productB = (await runWithTenantContext(tenantB, async () =>
      prisma.product.create({
        data: { name: 'PB', description: 'B', sku: 'SKU-B', price: 2, currency: 'USD' },
      })
    )) as any;
  });

  it('prevents cross-tenant read by id', async () => {
    const seenFromA = await runWithTenantContext(tenantA, async () =>
      prisma.product.findUnique({ where: { id: productB.id } })
    );
    expect(seenFromA).toBeNull();
  });

  it('allows same-tenant read', async () => {
    const seenFromB = await runWithTenantContext(tenantB, async () =>
      prisma.product.findUnique({ where: { id: productB.id } })
    );
    expect(seenFromB).not.toBeNull();
    expect((seenFromB as any).id).toBe(productB.id);
  });
});

