# PosalPro MVP2 - API Key Integration Guide

## Overview
The API key feature provides **feature-flagged API key authentication** for securing sensitive endpoints. This guide shows which parts of the codebase should use this feature.

## Feature Activation
```bash
# Enable API key authentication
FEATURE_API_KEYS=true
```

---

## 🔐 **HIGH PRIORITY - Admin & System Management**

### **Admin Routes** (Immediate Implementation)
```typescript
// src/app/api/admin/users/route.ts
import { assertApiKey } from '@/server/api/apiKeyGuard';

export const POST = createRoute(
  {
    roles: ['System Administrator', 'Administrator'],
    body: UserCreateSchema,
    apiVersion: '1',
  },
  async ({ req, user, body, requestId }) => {
    // Add API key protection for admin operations
    await assertApiKey(req, 'admin:users');

    // ... existing logic
  }
);
```

**Routes to Protect:**
- ✅ `/api/admin/users` - User management
- ✅ `/api/admin/roles` - Role management
- ✅ `/api/admin/permissions` - Permission management
- ✅ `/api/admin/db-sync` - Database operations
- ✅ `/api/admin/db-status` - System health
- ✅ `/api/admin/system` - System configuration
- ✅ `/api/admin/metrics` - System metrics
- ✅ `/api/admin/notifications/generate` - Notification management

---

## 📊 **HIGH PRIORITY - Analytics & Observability**

### **Analytics Dashboard** (Sensitive Business Data)
```typescript
// src/app/api/analytics/dashboard/route.ts
import { assertApiKey } from '@/server/api/apiKeyGuard';

export async function GET(request: NextRequest) {
  // Protect analytics data access
  await assertApiKey(request, 'analytics:read');

  // ... existing logic
}
```

**Routes to Protect:**
- ✅ `/api/analytics/dashboard` - Business analytics
- ✅ `/api/analytics/insights` - Advanced insights
- ✅ `/api/analytics/users` - User analytics
- ✅ `/api/observability/metrics` - System observability
- ✅ `/api/observability/web-vitals` - Performance metrics
- ✅ `/api/performance/optimization` - Performance data
- ✅ `/api/performance` - Performance metrics
- ✅ `/api/database/metrics` - Database metrics

---

## ✏️ **MEDIUM PRIORITY - Data Modification**

### **Bulk Operations** (Destructive Operations)
```typescript
// src/app/api/customers/bulk-delete/route.ts
import { assertApiKey } from '@/server/api/apiKeyGuard';

export const POST = createRoute(
  {
    roles: ['admin', 'System Administrator', 'Administrator'],
    body: BulkDeleteSchema,
  },
  async ({ req, body, user }) => {
    // Protect bulk destructive operations
    await assertApiKey(req, 'admin:customers');

    // ... existing logic
  }
);
```

**Routes to Protect:**
- ✅ `/api/customers/bulk-delete` - Bulk customer operations
- ✅ `/api/products/bulk-delete` - Bulk product operations
- ✅ `/api/proposals/bulk-delete` - Bulk proposal operations
- ✅ `/api/proposals/versions/bulk-delete` - Bulk version operations
- ✅ `/api/validation/issues/[id]/resolve` - Issue resolution
- ✅ `/api/communication/messages` - Message operations
- ✅ `/api/workflows/[id]/executions` - Workflow executions

---

## 🔍 **MEDIUM PRIORITY - Advanced Features**

### **Content & Search Operations**
```typescript
// Advanced content operations
await assertApiKey(request, 'content:write');

// Advanced search with filters
await assertApiKey(request, 'search:advanced');
```

**Routes to Consider:**
- 🔄 `/api/content` - Content management (selective)
- 🔄 `/api/search` - Advanced search features
- 🔄 `/api/validation/rules` - Validation rules management
- 🔄 `/api/sme/assignments` - SME assignment operations
- 🔄 `/api/communications` - Communication management

---

## 📋 **LOW PRIORITY - Public/Read-Only**

### **Public Data Access** (Optional Protection)
```typescript
// Optional: Public read access with rate limiting
// await assertApiKey(request, 'public:read');
```

**Routes that could remain public:**
- 🔄 `/api/health/*` - Health check endpoints
- 🔄 `/api/products` (GET) - Public product catalog
- 🔄 `/api/customers/search` (GET) - Public search
- 🔄 `/api/docs/openapi.json` - API documentation
- 🔄 `/api/config` - Public configuration

---

## 🏗️ **Implementation Strategy**

### **Phase 1: Critical Infrastructure** (Immediate)
```bash
# 1. Enable feature flag
FEATURE_API_KEYS=true

# 2. Create admin API keys
node scripts/manage-api-keys.js create "System Admin" "admin:*,analytics:read"
node scripts/manage-api-keys.js create "Analytics Service" "analytics:read"
node scripts/manage-api-keys.js create "Monitoring Service" "observability:read"

# 3. Protect admin routes
# Edit: src/app/api/admin/*/route.ts
await assertApiKey(request, 'admin:*');
```

### **Phase 2: Business Data Protection** (Week 1)
```bash
# Protect analytics and observability
# Edit: src/app/api/analytics/*/route.ts
await assertApiKey(request, 'analytics:read');

# Edit: src/app/api/observability/*/route.ts
await assertApiKey(request, 'observability:read');
```

### **Phase 3: Operational Security** (Week 2)
```bash
# Protect bulk operations and destructive actions
# Edit: src/app/api/*/bulk-delete/route.ts
await assertApiKey(request, 'admin:*');
```

### **Phase 4: Advanced Features** (Optional)
```bash
# Protect advanced features as needed
await assertApiKey(request, 'advanced:feature');
```

---

## 🔑 **Recommended API Key Scopes**

### **Admin Scopes**
```typescript
const ADMIN_SCOPES = [
  'admin:users',        // User management
  'admin:roles',        // Role management
  'admin:system',       // System configuration
  'admin:database',     // Database operations
  'admin:metrics'       // System metrics
];
```

### **Analytics Scopes**
```typescript
const ANALYTICS_SCOPES = [
  'analytics:read',     // Read analytics data
  'analytics:write',    // Write analytics data
  'analytics:admin'     // Analytics administration
];
```

### **Business Scopes**
```typescript
const BUSINESS_SCOPES = [
  'customers:read',     // Read customer data
  'customers:write',    // Write customer data
  'customers:admin',    // Customer administration
  'products:read',      // Read product data
  'products:write',     // Write product data
  'proposals:read',     // Read proposal data
  'proposals:write',    // Write proposal data
];
```

---

## 📊 **Usage Examples**

### **1. API Key Creation**
```bash
# Create different types of API keys
node scripts/manage-api-keys.js create "Admin Dashboard" "admin:*,analytics:read"
node scripts/manage-api-keys.js create "BI Analytics" "analytics:read,observability:read"
node scripts/manage-api-keys.js create "Mobile App" "read:profile,write:posts"
node scripts/manage-api-keys.js create "ETL Service" "read:*,write:analytics"
```

### **2. API Key Usage in Routes**
```typescript
// Admin route protection
export async function DELETE(request: NextRequest) {
  await assertApiKey(request, 'admin:users');
  // Delete user logic...
}

// Analytics route protection
export async function GET(request: NextRequest) {
  await assertApiKey(request, 'analytics:read');
  // Return analytics data...
}

// Bulk operation protection
export const POST = createRoute(
  { roles: ['admin'], body: BulkDeleteSchema },
  async ({ req, body, user }) => {
    await assertApiKey(req, 'admin:bulk');
    // Bulk delete logic...
  }
);
```

### **3. API Key Testing**
```bash
# Test key permissions
node scripts/manage-api-keys.js test "sk-abc123..." "analytics:read"

# List all keys
node scripts/manage-api-keys.js list

# Revoke compromised keys
node scripts/manage-api-keys.js revoke "key-id"
```

---

## 🚨 **Security Considerations**

### **🔐 Key Management**
- ✅ Rotate keys regularly (90 days)
- ✅ Use descriptive labels for tracking
- ✅ Implement key expiration policies
- ✅ Monitor API key usage patterns
- ✅ Use HTTPS for all API communication

### **🎯 Scope Design**
- ✅ **Principle of Least Privilege**: Grant minimal required scopes
- ✅ **Resource-Based Scopes**: `customers:read`, `products:write`
- ✅ **Action-Based Scopes**: `read`, `write`, `admin`
- ✅ **Hierarchical Scopes**: `admin:*` for full access

### **📊 Monitoring & Auditing**
- ✅ Log API key usage with audit trails
- ✅ Monitor for suspicious activity
- ✅ Implement rate limiting per API key
- ✅ Track key lifecycle events

---

## 🎯 **Priority Implementation**

### **Immediate (This Week)**
1. ✅ Enable `FEATURE_API_KEYS=true`
2. ✅ Create admin API keys
3. ✅ Protect all `/api/admin/*` routes
4. ✅ Protect `/api/analytics/dashboard` and `/api/observability/*`

### **Short Term (Next Week)**
1. 🔄 Protect bulk delete operations
2. 🔄 Protect sensitive data modification routes
3. 🔄 Implement API key rotation policies

### **Future (As Needed)**
1. 🔄 Advanced scope hierarchies
2. 🔄 API key expiration and renewal
3. 🔄 Integration with external identity providers

---

## 📈 **Benefits of API Key Protection**

### **Security Benefits**
- ✅ **Granular Access Control**: Scope-based permissions
- ✅ **Audit Trail**: Complete API usage logging
- ✅ **Key Management**: Easy key lifecycle management
- ✅ **Rate Limiting**: Per-key usage controls

### **Operational Benefits**
- ✅ **Third-Party Integration**: Secure API access for partners
- ✅ **Service Authentication**: Machine-to-machine authentication
- ✅ **Usage Analytics**: Track API consumption patterns
- ✅ **Access Revocation**: Immediate key deactivation

### **Business Benefits**
- ✅ **Data Protection**: Secure sensitive business data
- ✅ **Compliance**: Enhanced security posture
- ✅ **Scalability**: Support for external integrations
- ✅ **Monitoring**: Comprehensive API usage insights

---

## 🏁 **Conclusion**

The API key feature should be implemented across **all sensitive endpoints** in your PosalPro MVP2 application, with particular focus on:

1. **🔴 HIGH**: Admin routes (`/api/admin/*`)
2. **🟡 MEDIUM**: Analytics and observability (`/api/analytics/*`, `/api/observability/*`)
3. **🟢 LOW**: Bulk operations and advanced features

**Start with the admin routes and analytics endpoints** for maximum security impact, then expand to other sensitive operations as needed.

The feature is **production-ready** and provides **enterprise-grade API security** for your application! 🚀
