// Map plan tiers to entitlement keys
export const PLAN_TIER_ENTITLEMENTS: Record<string, string[]> = {
  FREE: [
    'feature.analytics.dashboard',
  ],
  PRO: [
    'feature.analytics.dashboard',
    'feature.analytics.insights',
    'feature.analytics.users',
    'feature.products.create',
    'feature.products.advanced',
    'feature.products.analytics',
    'feature.search.suggestions',
    'feature.users.activity',
  ],
  ENTERPRISE: [
    'feature.analytics.dashboard',
    'feature.analytics.insights',
    'feature.analytics.enhanced',
    'feature.analytics.users',
    'feature.products.create',
    'feature.products.advanced',
    'feature.products.analytics',
    'feature.search.suggestions',
    'feature.users.activity',
  ],
};

// Utility functions for entitlement management
export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';

/**
 * Check if a plan tier has a specific entitlement
 */
export function hasEntitlement(planTier: PlanTier, entitlementKey: string): boolean {
  const entitlements = PLAN_TIER_ENTITLEMENTS[planTier] || [];
  return entitlements.includes(entitlementKey);
}

/**
 * Get all entitlements for a specific plan tier
 */
export function getEntitlementsForPlan(planTier: PlanTier): string[] {
  return PLAN_TIER_ENTITLEMENTS[planTier] || [];
}

/**
 * Get all unique entitlement keys across all plan tiers
 */
export function getAllEntitlementKeys(): string[] {
  const allKeys = new Set<string>();
  Object.values(PLAN_TIER_ENTITLEMENTS).forEach(keys => {
    keys.forEach(key => allKeys.add(key));
  });
  return Array.from(allKeys);
}

/**
 * Check if an entitlement is available in any plan tier
 */
export function isEntitlementAvailable(entitlementKey: string): boolean {
  return getAllEntitlementKeys().includes(entitlementKey);
}

/**
 * Get the minimum plan tier required for an entitlement
 */
export function getMinimumTierForEntitlement(entitlementKey: string): PlanTier | null {
  const tiers: PlanTier[] = ['FREE', 'PRO', 'ENTERPRISE'];

  for (const tier of tiers) {
    if (hasEntitlement(tier, entitlementKey)) {
      return tier;
    }
  }

  return null;
}

/**
 * Get entitlements that are available in higher tiers but not in the current tier
 */
export function getUpgradeEntitlements(currentTier: PlanTier): string[] {
  const currentEntitlements = new Set(getEntitlementsForPlan(currentTier));
  const allEntitlements = new Set(getAllEntitlementKeys());

  return Array.from(allEntitlements).filter(key => !currentEntitlements.has(key));
}
