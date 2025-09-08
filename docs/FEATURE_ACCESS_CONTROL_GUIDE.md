# Feature Access Control Guide - PosalPro MVP2

## Overview

PosalPro uses a multi-layered approach to control feature access, combining
entitlements, feature flags, and plan-based access control. This guide explains
how to manage which features are locked/unlocked for different tenants and
users.

## 🏗️ Architecture Overview

### 1. **Entitlement System** (Primary)

- **Database**: `entitlement` table with `tenantId`, `key`, `enabled`, `value`
- **Purpose**: Persistent feature access per tenant
- **Enforcement**: Both client-side (UX) and server-side (security)
- **Management**: Admin interface and scripts

### 2. **Feature Gates** (Client-Side)

- **Component**: `FeatureGate` component
- **Purpose**: Hide/show UI elements based on entitlements
- **Fallback**: Custom locked banners with CTAs

### 3. **Server Route Protection** (Security)

- **System**: `createRoute` with `entitlements` config
- **Purpose**: Block API access for unauthorized features
- **Enforcement**: Automatic 403 responses

### 4. **Plan-Based Access** (Billing)

- **Mapping**: `PLAN_TIER_ENTITLEMENTS` in
  `/src/lib/billing/entitlementMapping.ts`
- **Purpose**: Automatic entitlement assignment by subscription tier
- **Integration**: Stripe webhooks update entitlements

## 🔧 Current Feature Keys

| Feature Key                   | Description                  | Plan Tiers            | Status    |
| ----------------------------- | ---------------------------- | --------------------- | --------- |
| `feature.analytics.dashboard` | Basic analytics dashboard    | FREE, PRO, ENTERPRISE | ✅ Active |
| `feature.analytics.insights`  | Advanced insights and trends | PRO, ENTERPRISE       | ✅ Active |
| `feature.analytics.enhanced`  | Executive dashboard & KPIs   | ENTERPRISE            | ✅ Active |
| `feature.products.analytics`  | Product-specific analytics   | PRO, ENTERPRISE       | ✅ Active |

## 📋 How to Control Feature Access

### Method 1: Admin Interface (Recommended)

**Location**: `/admin/billing`

1. Navigate to Admin → Billing & Entitlements
2. View current entitlements in "Active Entitlements" section
3. Use scripts for manual management (see below)

### Method 2: Database Direct (Advanced)

```sql
-- Enable feature for tenant
INSERT INTO entitlement (tenantId, key, enabled, value)
VALUES ('your-tenant-id', 'feature.analytics.enhanced', true, 'premium')
ON CONFLICT (tenantId, key) DO UPDATE SET enabled = true;

-- Disable feature for tenant
UPDATE entitlement SET enabled = false
WHERE tenantId = 'your-tenant-id' AND key = 'feature.analytics.enhanced';
```

### Method 3: Management Scripts (Quick)

**Enable Feature**:

```bash
# Enable specific feature
node scripts/enable-feature.js feature.analytics.enhanced

# Enable executive dashboard (already done)
node scripts/enable-executive-dashboard.js
```

**Check Status**:

```bash
# Verify feature status
node scripts/verify-feature.js feature.analytics.enhanced
```

### Method 4: Plan-Based Auto-Assignment

**File**: `src/lib/billing/entitlementMapping.ts`

```typescript
export const PLAN_TIER_ENTITLEMENTS: Record<string, string[]> = {
  FREE: [
    'feature.analytics.dashboard',
    // Add new FREE features here
  ],
  PRO: [
    'feature.analytics.dashboard',
    'feature.analytics.insights',
    'feature.products.analytics',
    // Add new PRO features here
  ],
  ENTERPRISE: [
    'feature.analytics.dashboard',
    'feature.analytics.insights',
    'feature.analytics.enhanced',
    'feature.products.analytics',
    // Add new ENTERPRISE features here
  ],
};
```

## 🚀 Adding New Features

### Step 1: Define Feature Key

Choose a consistent naming pattern:

```typescript
// Good examples
'feature.analytics.enhanced'; // Analytics features
'feature.products.bulk-upload'; // Product features
'feature.workflow.automation'; // Workflow features
'feature.admin.user-management'; // Admin features
```

### Step 2: Add to Plan Mapping

Update `src/lib/billing/entitlementMapping.ts`:

```typescript
export const PLAN_TIER_ENTITLEMENTS: Record<string, string[]> = {
  FREE: ['feature.analytics.dashboard'],
  PRO: [
    'feature.analytics.dashboard',
    'feature.analytics.insights',
    // Add your new feature key
    'feature.workflow.automation',
  ],
  ENTERPRISE: [
    'feature.analytics.dashboard',
    'feature.analytics.insights',
    'feature.analytics.enhanced',
    'feature.workflow.automation',
    // Add enterprise-only features
  ],
};
```

### Step 3: Protect with Feature Gate

Wrap components in `FeatureGate`:

```tsx
import FeatureGate from '@/components/entitlements/FeatureGate';

function MyComponent() {
  return (
    <FeatureGate
      featureKey="feature.workflow.automation"
      bannerTitle="Workflow Automation Locked"
      bannerDescription="Upgrade to unlock automated workflow processing."
      bannerCtaLabel="Upgrade"
      bannerHref="/pricing"
    >
      <MyPremiumFeature />
    </FeatureGate>
  );
}
```

### Step 4: Protect API Routes (Critical)

Use `createRoute` with entitlements:

```typescript
import { createRoute } from '@/lib/api/route';

export const POST = createRoute(
  {
    requireAuth: true,
    entitlements: ['feature.workflow.automation'], // Required entitlements
    apiVersion: '1',
  },
  async ({ user }) => {
    // API logic here
    return { success: true, data: result };
  }
);
```

### Step 5: Create Management Script

```javascript
// scripts/enable-workflow-automation.js
const { PrismaClient } = require('@prisma/client');

async function enableWorkflowAutomation() {
  const prisma = new PrismaClient();
  const tenantId = process.env.DEFAULT_TENANT_ID || 'tenant_default';

  await prisma.entitlement.upsert({
    where: {
      tenantId_key: {
        tenantId,
        key: 'feature.workflow.automation',
      },
    },
    update: { enabled: true },
    create: {
      tenantId,
      key: 'feature.workflow.automation',
      enabled: true,
      value: 'premium',
    },
  });

  console.log('✅ Workflow automation enabled!');
}
```

## 🔍 Troubleshooting

### Feature Not Showing

1. Check entitlement exists:
   `SELECT * FROM entitlement WHERE key = 'your-feature-key'`
2. Verify tenant ID matches
3. Clear browser cache (entitlements cached)
4. Restart development server

### API Access Denied

1. Check route entitlements config
2. Verify server-side entitlement check
3. Confirm user belongs to correct tenant

### Database Issues

1. Check entitlement table schema
2. Verify tenant exists in database
3. Check for unique constraint violations

## 📊 Monitoring & Analytics

### Track Feature Usage

```typescript
// In your feature components
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';

function MyFeature() {
  const analytics = useOptimizedAnalytics();

  useEffect(() => {
    analytics.track('feature_accessed', {
      featureKey: 'feature.workflow.automation',
      userId: user.id,
      tenantId: tenant.id,
    });
  }, []);
}
```

### Entitlement Audit Logs

```sql
-- View recent entitlement changes
SELECT * FROM entitlement
WHERE createdAt > NOW() - INTERVAL '7 days'
ORDER BY createdAt DESC;
```

## 🛡️ Security Best Practices

### Server-Side First

- **Always** protect APIs with `entitlements` in `createRoute`
- **Never** rely on client-side checks alone
- Client-side gates are for UX, not security

### Tenant Isolation

- Entitlements are tenant-scoped
- Users only see their tenant's entitlements
- Cross-tenant access prevented by database constraints

### Audit Trail

- All entitlement changes logged
- Track who enabled/disabled features
- Monitor for unauthorized access attempts

## 🔄 Migration Strategies

### Rolling Out New Features

1. Add feature key to plan mapping (disabled by default)
2. Deploy code with feature gates
3. Enable for beta users via database
4. Gradually roll out to all users
5. Update plan mappings based on feedback

### Feature Deprecation

1. Add deprecation warnings in UI
2. Update plan mappings to remove feature
3. Provide migration path for users
4. Remove feature after grace period

## 📚 Related Documentation

- `CORE_REQUIREMENTS.md` - Entitlements & Feature Gating section
- `WIREFRAME_INTEGRATION_GUIDE.md` - Feature gate implementation
- `ADMIN_MIGRATION_ASSESSMENT.md` - Admin interface patterns
- `PROJECT_REFERENCE.md` - Current feature inventory

## 🎯 Quick Commands

```bash
# Enable executive dashboard
node scripts/enable-executive-dashboard.js

# Check current entitlements
node scripts/verify-executive-dashboard.js

# Enable any feature
node scripts/enable-feature.js <feature-key>

# View all entitlements in database
npx prisma studio --browser none
# Then query: SELECT * FROM entitlement WHERE enabled = true;
```

---

**Remember**: Feature access control is a combination of UX (client-side gates)
and security (server-side enforcement). Always implement both layers for
complete protection.
