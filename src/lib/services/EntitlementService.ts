import { prisma } from '@/lib/prisma';
import { getCache, setCache } from '@/lib/redis';

const TTL = 60; // seconds

export class EntitlementService {
  static async getEntitlements(tenantId: string): Promise<Record<string, string | true>> {
    if (!tenantId) return {};
    const cacheKey = `entitlements:${tenantId}`;
    const cached = await getCache<Record<string, string | true>>(cacheKey);
    if (cached) return cached;

    const rows = await prisma.entitlement.findMany({
      where: { tenantId, enabled: true },
      select: { key: true, value: true },
    });
    const map: Record<string, string | true> = {};
    for (const r of rows) map[r.key] = r.value ?? true;
    await setCache(cacheKey, map, TTL);
    return map;
  }

  static async hasEntitlement(tenantId: string, key: string): Promise<boolean> {
    const ents = await this.getEntitlements(tenantId);
    return Boolean(ents[key]);
  }

  static async hasEntitlements(tenantId: string, keys: string[]): Promise<boolean> {
    if (!keys || keys.length === 0) return true;
    const ents = await this.getEntitlements(tenantId);
    return keys.every(k => Boolean(ents[k]));
  }
}

