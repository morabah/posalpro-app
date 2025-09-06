// Map plan tiers to entitlement keys
export const PLAN_TIER_ENTITLEMENTS: Record<string, string[]> = {
  FREE: [
    'feature.analytics.dashboard',
  ],
  PRO: [
    'feature.analytics.dashboard',
    'feature.analytics.insights',
    'feature.products.analytics',
  ],
  ENTERPRISE: [
    'feature.analytics.dashboard',
    'feature.analytics.insights',
    'feature.analytics.enhanced',
    'feature.products.analytics',
  ],
};

