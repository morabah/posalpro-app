# PosalPro MVP2 - Lessons Learned

This document captures key insights, patterns, and solutions discovered during
development.

## Critical RBAC Role Extraction Issue - January 2025

### **🚨 CRITICAL LESSON: Frontend Session Role Structure vs Backend Role Mapping**

#### **Problem Encountered:**

Administrators were getting "Access Denied" on customer pages despite having
proper permissions. The API endpoint returned 200 OK for admin users, but the
frontend `RBACGuard` was denying access.

#### **Root Cause:**

The session data structure in the frontend was different from what the role
extraction logic expected:

- **Expected**: `session.user.roles` as array of objects with `name` property
- **Actual**: `session.user.roles` as array of strings
  `["System Administrator"]`
- **Result**: Role extraction failed, returning `[undefined]` instead of
  `["SYSTEM_ADMINISTRATOR"]`

#### **Technical Details:**

```typescript
// ❌ BEFORE: Expected object structure
const roleName = role.name; // role.name was undefined for string roles

// ✅ AFTER: Handle both object and string role structures
let roleName = role.name || role.role || role.roleName || role.title;
if (!roleName && typeof role === 'string') {
  roleName = role; // Extract from string directly
}
```

#### **Debugging Process:**

1. **API vs Frontend Isolation**: Used `app-cli` to confirm API endpoint worked
   (200 OK)
2. **Session Analysis**: Added extensive `logDebug` statements to inspect
   session structure
3. **Role Mapping**: Discovered `originalRoles: [undefined]` in debug logs
4. **Root Cause**: Role extraction logic didn't handle string-based role arrays

#### **Solution:**

Implemented robust role extraction logic in `getUserRoles` function:

```typescript
// ✅ COMPREHENSIVE FIX: Handle multiple role structures
const getUserRoles = (session: Session | null): string[] => {
  if (!session?.user?.roles || !Array.isArray(session.user.roles)) {
    return [];
  }

  const mappedRoles = session.user.roles
    .map((role: any) => {
      // ✅ RBAC: Try different possible role name properties
      let roleName = role.name || role.role || role.roleName || role.title;

      // ✅ RBAC: If still undefined, try to extract from the role object itself
      if (!roleName && typeof role === 'string') {
        roleName = role;
      }

      // ✅ RBAC: If still undefined, skip this role
      if (!roleName) {
        return null;
      }

      return mapBackendRoleToRBACRole(roleName);
    })
    .filter(Boolean); // Remove null values

  return mappedRoles;
};
```

#### **Implementation Changes:**

1. **Enhanced Role Extraction**: Try multiple properties (`name`, `role`,
   `roleName`, `title`)
2. **String Role Handling**: Handle cases where role itself is a string
3. **Defensive Filtering**: Filter out roles that cannot be extracted
4. **Comprehensive Logging**: Added detailed debug logs for troubleshooting
5. **Applied to Both Pages**: Fixed in both `customers/page.tsx` and
   `customers/create/page.tsx`

#### **Prevention Strategy:**

- **✅ Always handle multiple session data structures** in role extraction
- **✅ Add comprehensive debug logging** for RBAC troubleshooting
- **✅ Test role extraction with different session formats**
- **✅ Use defensive programming** with fallbacks and null filtering
- **✅ Verify role mapping** works for both object and string role formats

#### **RBAC Debugging Checklist:**

1. **Session Analysis**
   - Log raw session structure: `session.user.roles`
   - Check if roles is array and has expected structure
   - Verify role extraction attempts each property

2. **Role Mapping Verification**
   - Log original roles before mapping
   - Log mapped roles after transformation
   - Verify `mapBackendRoleToRBACRole` function works

3. **Permission Validation**
   - Check if mapped roles include required permissions
   - Verify RBAC cache hits/misses
   - Confirm permission validation logic

#### **Key Takeaway:**

**Session data structures can vary between frontend and backend contexts. Role
extraction logic must be robust enough to handle multiple formats (objects with
properties, plain strings, etc.) and include comprehensive debugging to identify
structural mismatches.**

This lesson prevents **hours of debugging** for RBAC issues by ensuring role
extraction handles all possible session data formats and provides detailed
logging for troubleshooting.

## Critical Bridge Migration Provider Issue - January 2025

### **🚨 CRITICAL LESSON: Bridge Architecture Requires Proper Provider Hierarchy**

#### **Problem Encountered:**

After successfully migrating the dashboard page to use
`DashboardManagementBridge`, the application crashed with the error:

```
Error: useGlobalState must be used within a GlobalStateProvider
```

#### **Root Cause:**

The `DashboardManagementBridge` uses `useStateBridge()` which internally calls
`useGlobalState()`. However, the `GlobalStateProvider` was not included in the
dashboard layout hierarchy, causing all bridge-related hooks to fail.

#### **Technical Details:**

- **Component Flow**: `DashboardManagementBridge` → `useStateBridge()` →
  `useGlobalState()` → **Missing Provider** ❌
- **Error Location**: During component initialization when bridge hooks are
  called
- **Impact**: Complete dashboard page crash, preventing any bridge functionality

#### **Solution:**

Add `GlobalStateProvider` to the dashboard layout hierarchy:

```tsx
// BEFORE (❌ Missing GlobalStateProvider):
<AuthProvider session={session}>
  <ProtectedLayout>{children}</ProtectedLayout>
</AuthProvider>

// AFTER (✅ With GlobalStateProvider):
<AuthProvider session={session}>
  <GlobalStateProvider>
    <ProtectedLayout>{children}</ProtectedLayout>
  </GlobalStateProvider>
</AuthProvider>
```

#### **Implementation Steps:**

1. **Import the provider**:
   `import { GlobalStateProvider } from '@/lib/bridges/StateBridge';`
2. **Add to layout hierarchy**: Wrap `ProtectedLayout` with
   `GlobalStateProvider`
3. **Verify placement**: Must be inside `AuthProvider` but outside
   `ProtectedLayout`

#### **Prevention Strategy:**

- **✅ Always check provider dependencies** when migrating components to bridge
  architecture
- **✅ Update layout files** before migrating page components
- **✅ Test provider hierarchy** in development before deploying
- **✅ Document provider requirements** in bridge migration checklist

#### **Bridge Migration Checklist (Updated):**

1. **Provider Setup** ✅ **CRITICAL FIRST STEP**
   - Ensure `GlobalStateProvider` is in layout hierarchy
   - Verify provider placement and nesting order
   - Test that `useGlobalState()` hook works

2. **Component Migration**
   - Wrap pages with bridge providers (e.g., `DashboardManagementBridge`)
   - Replace direct API calls with bridge hooks
   - Add error handling and analytics

3. **Testing & Validation**
   - Verify no provider-related errors
   - Test all bridge functionality
   - Confirm TypeScript compliance

#### **Key Takeaway:**

**Bridge architecture is a system-wide change that requires updating both the
layout provider hierarchy AND individual components. Always start with the
provider setup before migrating any components to bridges.**

This lesson prevents **8+ hours of debugging** for future bridge migrations by
ensuring the provider hierarchy is correctly established from the start.

## Critical API URL Construction Issue - January 2025

### **🚨 CRITICAL LESSON: API Client Base URL vs Endpoint URL Prefixing**

#### **Problem Encountered:**

After fixing the provider hierarchy issue, the dashboard was still failing with
404 errors. The API client was constructing URLs with double `/api` prefixes:

```
❌ http://localhost:3000/api/api/dashboard/proposals/active?limit=10
✅ http://localhost:3000/api/dashboard/proposals/active?limit=10
```

#### **Root Cause:**

The dashboard API (`src/lib/dashboard/api.ts`) was calling `apiClient.get()`
with URLs that already started with `/api/`, but the API client's base URL was
already `/api`, causing double prefixing.

#### **Technical Details:**

- **API Client Base URL**: `/api` (configured in `src/lib/api/client.ts`)
- **Dashboard API Calls**: `/api/dashboard/...` (incorrect - double prefix)
- **Correct Calls**: `/dashboard/...` (correct - single prefix)

#### **Solution:**

Remove the `/api` prefix from all dashboard API calls:

```typescript
// BEFORE (❌ Double /api prefix):
const response = await apiClient.get<ProposalSummary[]>(
  `/api/dashboard/proposals/active?${queryParams.toString()}`
);

// AFTER (✅ Single /api prefix):
const response = await apiClient.get<ProposalSummary[]>(
  `/dashboard/proposals/active?${queryParams.toString()}`
);
```

#### **Files Fixed:**

- `src/lib/dashboard/api.ts` - All 8 API calls updated:
  - `/api/dashboard/proposals/active` → `/dashboard/proposals/active`
  - `/api/dashboard/proposals/activity` → `/dashboard/proposals/activity`
  - `/api/dashboard/proposals/metrics` → `/dashboard/proposals/metrics`
  - `/api/dashboard/activity` → `/dashboard/activity`
  - `/api/dashboard/team` → `/dashboard/team`
  - `/api/dashboard/deadlines` → `/dashboard/deadlines`
  - `/api/dashboard/performance` → `/dashboard/performance`
  - `/api/dashboard/notifications` → `/dashboard/notifications`
  - `/api/dashboard/notifications/${id}` → `/dashboard/notifications/${id}`

#### **Prevention Strategy:**

- **✅ Always check API client base URL** before constructing endpoint URLs
- **✅ Use relative paths** when API client already has base URL configured
- **✅ Test API endpoints** in development to catch URL construction issues
- **✅ Document URL construction patterns** for each API client configuration

#### **API URL Construction Rules:**

1. **If API client base URL is `/api`**: Use `/endpoint` (not `/api/endpoint`)
2. **If API client base URL is empty**: Use `/api/endpoint`
3. **If API client base URL is absolute**: Use `/endpoint` (relative to base)

#### **Key Takeaway:**

**API URL construction must account for the API client's base URL configuration.
Double prefixing causes 404 errors and breaks all API functionality.**

This lesson prevents **API endpoint failures** and ensures proper URL
construction across all API integrations.

## Critical Dashboard API Endpoint Mapping Issue - January 2025

### **🚨 CRITICAL LESSON: Dashboard API Must Use Existing Endpoints**

#### **Problem Encountered:**

After fixing the double `/api` prefix issue, the dashboard was still failing
with 404 errors because the dashboard API was trying to call endpoints that
don't exist on the server.

#### **Root Cause:**

The dashboard API in `src/lib/dashboard/api.ts` was calling non-existent
endpoints:

- **❌ Called**: `/dashboard/proposals/active`, `/dashboard/activity`,
  `/dashboard/team`, `/dashboard/deadlines`, `/dashboard/performance`,
  `/dashboard/notifications`
- **✅ Available**: `/dashboard/enhanced-stats`, `/dashboard/executive`,
  `/dashboard/stats`

#### **Technical Details:**

- **API Directory Structure**: Only 3 endpoints exist in
  `src/app/api/dashboard/`
- **Dashboard API Logic**: Tried to fetch 6 separate endpoints in parallel
- **Result**: All API calls returned 404 errors, causing complete dashboard
  failure

#### **Solution:**

Replace multiple non-existent endpoint calls with a single call to the existing
`/dashboard/enhanced-stats` endpoint:

```typescript
// BEFORE (❌ Multiple non-existent endpoints):
const [
  proposalData,
  activityData,
  teamData,
  deadlineData,
  performanceData,
  notificationData,
] = await Promise.allSettled([
  this.getProposalData(options), // → /dashboard/proposals/active (404)
  this.getActivityFeed(options), // → /dashboard/activity (404)
  this.getTeamStatus(options), // → /dashboard/team (404)
  this.getUpcomingDeadlines(options), // → /dashboard/deadlines (404)
  this.getPerformanceMetrics(options), // → /dashboard/performance (404)
  this.getNotifications(options), // → /dashboard/notifications (404)
]);

// AFTER (✅ Single existing endpoint):
const response = await apiClient.get<any>(
  `/dashboard/enhanced-stats?${queryParams.toString()}`
);
const enhancedStats = response.data;

// Transform enhanced stats data to dashboard data format
const dashboardData: DashboardData = {
  proposals: {
    metrics: {
      total: enhancedStats.totalProposals || 0,
      active: enhancedStats.activeProposals || 0,
      completed: enhancedStats.wonProposals || 0,
      winRate: enhancedStats.winRate || 0,
      // ... other fields mapped from enhancedStats
    },
  },
  // ... other sections
};
```

#### **Implementation Changes:**

1. **Main Dashboard Method**: Uses `/dashboard/enhanced-stats` endpoint
   exclusively
2. **Individual Methods**: Now delegate to main dashboard method instead of
   separate API calls
3. **Data Transformation**: Maps enhanced stats response to expected dashboard
   data format
4. **Caching**: Maintained existing caching logic but with single endpoint
5. **Error Handling**: Simplified error handling with single point of failure

#### **Prevention Strategy:**

- **✅ Always verify API endpoints exist** before implementing frontend API
  calls
- **✅ Check `src/app/api/` directory structure** to see what routes are
  available
- **✅ Use existing comprehensive endpoints** instead of creating multiple
  granular calls
- **✅ Test API endpoints in development** to catch missing routes early

#### **API Endpoint Verification Process:**

1. **Check Directory Structure**: `ls src/app/api/dashboard/`
2. **Verify Route Files**: Ensure `route.ts` files exist in each subdirectory
3. **Test Endpoints**: Use CLI or browser to verify endpoints return data
4. **Map Responses**: Understand what data each endpoint provides
5. **Choose Best Fit**: Use comprehensive endpoints over multiple specific ones

#### **Key Takeaway:**

**Always verify that API endpoints exist on the server before implementing
frontend code that calls them. Use comprehensive endpoints that provide all
needed data in one call rather than multiple specific endpoints.**

This lesson prevents **complete dashboard failures** and ensures
frontend-backend API integration works correctly.

---

## React Bridge Pattern Implementation - Critical Integration Issues & Solutions

**Date**: 2025-01-21 • **Category**: Architecture / React Patterns / Performance
• **Impact**: Critical

### Context

Implemented comprehensive React Bridge patterns (API Bridge, State Bridge, Event
Bridge, and combined ProposalManagementBridge) for the proposals management
page. The integration revealed critical React-specific issues that required
systematic resolution to achieve stable, production-ready bridge functionality.

### Problems Encountered

**1. Maximum Update Depth Exceeded**

- Bridge state updates triggered infinite re-render loops
- Unstable dependencies in useEffect arrays caused continuous re-execution
- Event listeners and analytics tracking created circular dependencies

**2. setState During Render Errors**

- Bridge calls (`bridge.setFilters`, `bridge.trackAction`) executed during
  render cycles
- GlobalStateProvider updates triggered while rendering different components
- Synchronous state updates during component rendering caused React violations

**3. React Hydration Mismatches**

- JavaScript-based responsive detection caused SSR/CSR rendering differences
- Conditional class applications based on `useResponsive` hook created
  inconsistent HTML
- Inline style attributes with dynamic values caused hydration errors

**4. Authentication & API Integration Issues**

- Unauthenticated API requests causing 400/500 errors
- Missing authentication context in bridge-enabled components
- Session state not properly synchronized with bridge operations

**5. API Validation & Case Sensitivity**

- Frontend filter values not matching backend enum expectations
- Case-sensitive status/priority validation causing API rejections
- Zod schema validation failing due to case mismatch

### Solutions Implemented

**1. Bridge State Update Deferral Pattern**

```typescript
// ✅ CORRECT: Defer bridge calls to prevent setState during render
const updateFilters = useCallback(
  (newFilters: Partial<Filters>) => {
    setFilters(prev => {
      const updatedFilters = { ...prev, ...newFilters };
      setTimeout(() => {
        // Defer bridge calls
        bridge.setFilters(updatedFilters);
        bridge.trackAction('filters_changed', { filters: newFilters });
        bridge.addNotification({
          type: 'info',
          message:
            `Filters updated: ${newFilters.status || ''} ${newFilters.priority || ''}`.trim(),
        });
      }, 0);
      return updatedFilters;
    });
  },
  [bridge]
);
```

**2. Mount-Only Effect Dependencies**

```typescript
// ✅ CORRECT: Empty dependency arrays for one-time initialization
useEffect(() => {
  bridge.trackPageView('proposals_manage');
}, []); // Empty dependency array to run only once

useEffect(() => {
  const proposalCreatedListener = eventBridge.subscribe(
    'PROPOSAL_CREATED',
    (payload: any) => {
      refetch();
      bridge.addNotification({
        type: 'success',
        message: `New proposal "${payload.title || 'Unknown'}" created successfully`,
      });
    },
    { component: 'ProposalsManagePage' }
  );

  return () => {
    eventBridge.unsubscribe('PROPOSAL_CREATED', proposalCreatedListener);
  };
}, []); // Empty dependency array to prevent infinite loops
```

**3. CSS-Only Responsive Design**

```typescript
// ✅ CORRECT: Remove JavaScript-based responsive detection
// Before: useResponsive hook with conditional classes
// After: CSS-only Tailwind responsive classes
className={cn(
  // Mobile (default)
  'px-4 py-3 text-base rounded-lg border-2',
  'focus:ring-4 focus:ring-blue-100',
  'touch-manipulation will-change-transform',
  'active:scale-[0.98]',
  'relative z-10 pointer-events-auto',
  'min-h-[48px]', // WCAG 2.1 AA touch target

  // Tablet and up (md:)
  'md:px-3.5 md:py-2.5 md:text-sm md:rounded-md md:border',
  'md:focus:ring-1',

  // Desktop and up (lg:)
  'lg:px-3 lg:py-2',

  className
)}
```

**4. Authentication Integration Pattern**

```typescript
// ✅ CORRECT: Authentication check with loading state
const { data: session, status } = useSession();

useEffect(() => {
  if (status === 'loading') return;

  if (!session?.user) {
    logInfo('Authentication required - redirecting to login', {
      component: 'ProposalsManagePage',
      status,
    });
    router.push('/auth/signin');
    return;
  }
}, [session, status, router]);

// Show loading while checking authentication
if (status === 'loading') {
  return (
    <div className="space-y-6 p-6" data-testid="proposals-manage-page">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    </div>
  );
}

// Don't render if not authenticated (will redirect)
if (!session?.user) {
  return null;
}
```

**5. Case-Insensitive API Validation**

```typescript
// ✅ CORRECT: Zod preprocess for case-insensitive validation
const ProposalQuerySchema = z.object({
  status: z.preprocess(
    val => {
      if (!val || typeof val !== 'string') return undefined;
      const upperVal = val.toUpperCase();
      const validStatuses = [
        'DRAFT',
        'IN_REVIEW',
        'PENDING_APPROVAL',
        'APPROVED',
        'REJECTED',
        'SUBMITTED',
        'ACCEPTED',
        'DECLINED',
      ];
      return validStatuses.includes(upperVal) ? upperVal : undefined;
    },
    z
      .enum([
        'DRAFT',
        'IN_REVIEW',
        'PENDING_APPROVAL',
        'APPROVED',
        'REJECTED',
        'SUBMITTED',
        'ACCEPTED',
        'DECLINED',
      ])
      .optional()
  ),
  priority: z.preprocess(
    val => {
      if (!val || typeof val !== 'string') return undefined;
      const upperVal = val.toUpperCase();
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      return validPriorities.includes(upperVal) ? upperVal : undefined;
    },
    z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional()
  ),
});
```

### Key Insights

**1. Bridge State Management**

- Bridge calls must be deferred using `setTimeout(..., 0)` to prevent setState
  during render
- Global state updates should never occur synchronously during component
  rendering
- Event listeners must be properly cleaned up to prevent memory leaks

**2. React Effect Dependencies**

- Use empty dependency arrays `[]` for one-time initialization effects
- Never include unstable functions (analytics, error handlers, API clients) in
  dependency arrays
- Bridge event subscriptions should be mount-only with proper cleanup

**3. SSR/CSR Consistency**

- Remove all JavaScript-based responsive detection to prevent hydration
  mismatches
- Use CSS-only responsive design with Tailwind classes
- Avoid inline styles and dynamic class applications that differ between server
  and client

**4. Authentication Integration**

- Bridge-enabled components must check authentication status before API calls
- Implement loading states during authentication checks
- Redirect unauthenticated users gracefully with proper logging

**5. API Validation Patterns**

- Use Zod `preprocess` for case-insensitive validation
- Handle both string and undefined values in validation schemas
- Provide fallback values for missing or invalid data

### Bridge Benefits Achieved

**1. Real-Time Collaboration**

- Cross-component communication via EventBridge
- Automatic UI updates when proposals are created/updated
- Instant notifications for user actions

**2. Smart Analytics & Business Intelligence**

- Every user action tracked with bridge analytics
- Performance metrics and user behavior insights
- Data-driven optimization opportunities

**3. Performance Optimization**

- Smart caching through StateBridge
- Optimized data fetching with API Bridge
- Reduced API calls through intelligent state management

**4. Enhanced User Experience**

- Instant feedback for all actions
- Smart notifications with contextual messages
- Error recovery with helpful suggestions

### Prevention Standards

**1. Bridge Integration Checklist**

- [ ] Defer all bridge calls using `setTimeout(..., 0)`
- [ ] Use empty dependency arrays for mount-only effects
- [ ] Implement proper authentication checks
- [ ] Remove JavaScript-based responsive detection
- [ ] Use case-insensitive API validation
- [ ] Add proper error boundaries and loading states

**2. Bridge State Management Rules**

- Never call bridge methods directly during render
- Always defer state updates to next tick
- Implement proper cleanup for event listeners
- Use stable references for bridge instances

**3. Authentication Integration Rules**

- Check session status before API calls
- Show loading states during authentication checks
- Redirect unauthenticated users gracefully
- Log authentication events for debugging

**4. Performance Optimization Rules**

- Use CSS-only responsive design
- Implement proper effect dependencies
- Avoid circular dependencies in bridge calls
- Monitor bridge performance impact

### Anti-Patterns to Avoid

- ❌ Calling bridge methods directly during render cycles
- ❌ Including unstable functions in useEffect dependencies
- ❌ Using JavaScript-based responsive detection
- ❌ Making API calls without authentication checks
- ❌ Case-sensitive validation without preprocessing
- ❌ Missing cleanup for bridge event listeners

### Verification Checklist

- [ ] No "Maximum update depth exceeded" errors in console
- [ ] No "setState during render" warnings
- [ ] No hydration mismatch errors
- [ ] Authentication flows work correctly
- [ ] Filters and search functionality work
- [ ] Bridge events trigger properly
- [ ] Performance remains optimal
- [ ] TypeScript compliance maintained

### Related

- [CORE_REQUIREMENTS.md → React Query Patterns](#react-query-patterns-mandatory)
- [CORE_REQUIREMENTS.md → Error Handling & Type Safety](#error-handling--type-safety)
- [CORE_REQUIREMENTS.md → Performance & Analytics](#performance--analytics)
- [ProposalManagementBridge.tsx](src/components/bridges/ProposalManagementBridge.tsx)
- [EventBridge.ts](src/lib/bridges/EventBridge.ts)
- [StateBridge.ts](src/lib/bridges/StateBridge.ts)

---

## Gold Standard Compliance Audit - Migration Requirements

**Date**: 2025-01-08 • **Category**: Performance / Architecture • **Impact**:
Critical

### Context

Conducted comprehensive audit to identify components not following the
`/products` page and `ProductList` gold standard patterns for data fetching,
error handling, performance, and structure.

### Problem

Approximately 40% of the codebase uses non-standard patterns:

- Manual loading state management instead of React Query's built-in states
- Custom caching systems instead of React Query's caching
- Direct fetch calls instead of `useApiClient` pattern
- Complex useEffect data fetching instead of React Query hooks
- Custom data fetching hooks instead of standardized patterns

### Solution

**Migration Strategy**:

1. **HIGH PRIORITY Components** (Critical Performance Impact):
   - `src/hooks/dashboard/useDashboardData.ts` - Convert to React Query hooks
   - `src/app/(dashboard)/proposals/[id]/page.tsx` - Convert to React Query
     hooks
   - `src/app/(dashboard)/customers/[id]/CustomerProfileClient.tsx` - Convert to
     React Query hooks

2. **MEDIUM PRIORITY Components** (Performance & Maintainability):
   - `src/hooks/entities/useUser.ts` - Convert to React Query hooks
   - `src/hooks/entities/useAuth.ts` - Convert to React Query hooks
   - `src/components/analytics/HypothesisTrackingDashboard.tsx` - Convert to
     React Query hooks

3. **LOW PRIORITY Components** (Infrastructure Cleanup):
   - Custom caching systems - Remove and rely on React Query caching
   - Direct fetch calls - Replace with `useApiClient` pattern

**Migration Checklist**:

- [ ] Replace manual `useState` loading with React Query's `isLoading`
- [ ] Replace manual error states with React Query's `error`
- [ ] Replace manual data fetching with React Query hooks
- [ ] Remove custom caching logic
- [ ] Use proper query keys following the factory pattern
- [ ] Implement proper error handling with `ErrorHandlingService`
- [ ] Add Component Traceability Matrix metadata
- [ ] Follow the exact patterns from `useProducts.ts` and `ProductList.tsx`

### Key Insights

1. **Gold Standard Components** (60% of codebase):
   - `src/hooks/useProducts.ts` - ✅ Proper React Query implementation
   - `src/hooks/useCustomers.ts` - ✅ Proper React Query implementation
   - `src/hooks/useAnalytics.ts` - ✅ Proper React Query implementation
   - `src/components/products/ProductList.tsx` - ✅ Uses React Query hooks
     properly

2. **Forbidden Patterns Identified**:
   - Custom caching with localStorage/memory maps
   - Direct `fetch()` calls or `axios` usage
   - Manual loading state management when React Query can handle it
   - Multiple useEffect dependencies causing re-fetches
   - Client-side filtering of large datasets
   - Nested API calls in render loops

3. **Performance Impact**:
   - Expected 70-80% performance improvement for migrated components
   - Target load times: <2s for all navigation links
   - Memory optimization through reduced bundle size and improved caching

### Prevention

1. **Always follow established patterns** from gold standard components
2. **Use React Query for complex data fetching** (lists, forms, mutations)
3. **Use `useApiClient` only for simple one-time fetches**
4. **Never implement custom caching systems** - rely on React Query's built-in
   caching
5. **Maintain 100% TypeScript compliance** during all migrations
6. **Follow CORE_REQUIREMENTS.md** for all new implementations

### Related

- [CORE_REQUIREMENTS.md → Data Fetching & Performance](#data-fetching--performance-critical)
- [CORE_REQUIREMENTS.md → React Query Patterns](#react-query-patterns-mandatory)
- [useProducts.ts](src/hooks/useProducts.ts) - Gold standard implementation
- [ProductList.tsx](src/components/products/ProductList.tsx) - Gold standard
  component

---

# Lessons Learned - PosalPro MVP2 (Curated)

This document is a curated, de-duplicated collection of the most relevant and
actionable lessons for ongoing development. Older detailed entries remain
available in git history.

---

## Performance & Auth Session Stabilization (PosalPro MVP2)

**Date**: 2025-08-08 • **Phase**: 2.3.x – Proposal Management & Auth
Optimization • **Category**: Performance, Authentication, Memory

### Context

Automated performance testing via `scripts/test-proposals-authenticated.js`
exposed dev-mode spikes in NextAuth session endpoints, intermittent dashboard
component mounting (`RecentProposals`), and high memory during
`/proposals/create`.

### Problems

- Bursty `/api/auth/session` and `/api/auth/providers` during rapid
  navigation/tests
- Fragmented session sources causing inconsistent mounts
- High JS heap on `/proposals/create`
- Dev-mode compile-time skew corrupting initial metrics

### Solutions

1. Auth state unification

- Standardize `useAuth` import to `@/components/providers/AuthProvider`
- SessionProvider: `refetchOnWindowFocus=false`, `refetchInterval=600`

2. Dev-only session smoothing

- Ultra-short (2s) throttle around `callbacks.session` in development only
- Short-lived SW caching for `/api/auth/session` and `/api/auth/providers` (dev
  only)
- Remove any session preloads from layout (e.g.,
  `<link rel="preload" href="/api/auth/session">`) to avoid chatty fetches

3. Database & API efficiency

- Dev bcrypt rounds = 6 (prod >= 12)
- Remove transactions for single reads in auth; make `updateLastLogin`
  fire-and-forget
- 60s in-memory caches for `/api/dashboard/stats` and `/api/proposals/list`
- Disable Redis in dev; in-memory fallback with short timeouts

4. ProposalWizard memory optimization

- Lazy initialize steps; step-local state (no generic top-level buckets)
- Defer customer fetch until user intent; smaller default pages (`limit=10`,
  `sort=name`)
- Memory logs behind `NEXT_PUBLIC_ENABLE_MEMORY_LOGS`; fix interval cleanup with
  `clearInterval`

5. Testing & dev-mode skew

- Warm key routes before measuring; prefer `data-testid` selectors with heading
  fallbacks

### Key Insights

- Unifying session source eliminates redundant session calls and inconsistent
  mounts
- Dev-only throttling flattens spikes without masking production performance
- Step-local state + deferred fetches deliver the largest heap reduction for
  wizards
- Minimal SELECTs and no-COUNT pagination materially reduce TTFB

### Prevention / Standards

- Always import `useAuth` from `@/components/providers/AuthProvider`
- Keep dev-only session throttle and SW caches strictly disabled in prod
- Disable Redis in dev; use in-memory fallbacks
- Wizard: lazy steps, step-local state, deferred fetches
- Minimal default selects; relations opt-in; `limit+1` pagination
- Warm-up in performance scripts; prefer `data-testid`

---

## Hydration Mismatch From Wrapper Swaps (SSR/CSR Consistency)

**Date**: 2025-08-20 • **Category**: React/Next.js Hydration, Auth/Layout

### Context

`/settings` intermittently showed a recoverable hydration error. Server HTML
rendered a different wrapper for the breadcrumbs/header than the client tree
(e.g., server `<div class="mb-8">` vs client `<nav ...>`), and different
branches (loading/unauthenticated/success) rendered different header structures.
Under the `(dashboard)` route-group, the page also relied on client session
resolving, increasing the likelihood of divergent trees.

### Problem

- Server and client produced different markup for the same component due to
  conditional wrapper logic and branch-specific headers.
- Some branches omitted breadcrumbs while others included them, causing
  structure changes post-hydration.
- Route-group layout lacked explicit per-request session propagation, leading to
  stalled client auth and timing-related drift.

### Solution

1. Stabilize shared wrappers:

- Make `Breadcrumbs` always render a stable `<nav>` on both server and client
  (never return `null` or a different wrapper based on mount state).
- In pages, include the exact same header/breadcrumb block in all render
  branches (loading, unauthenticated, success, error).

2. Route-group auth/session alignment:

- Convert `(dashboard)/layout.tsx` to an async server layout and pass
  `session={await getServerSession(authOptions)}` into `AuthProvider`.
- Mark layout as `export const dynamic = 'force-dynamic'` when session affects
  the response to avoid stale SSR caches.

### Example (Generalized)

```tsx
// Stable Breadcrumbs
export function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; href: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb navigation">
      <ol>
        {items.map(i => (
          <li key={i.href}>{i.label}</li>
        ))}
      </ol>
    </nav>
  );
}

// Page header reused verbatim in all branches
const header = (
  <Breadcrumbs
    items={[
      { label: 'Home', href: '/dashboard' },
      { label: 'Settings', href: '/settings' },
    ]}
  />
);
if (loading)
  return (
    <div>
      {header}
      {/* skeleton */}
    </div>
  );
if (!isAuthenticated)
  return (
    <div>
      {header}
      {/* auth required */}
    </div>
  );
return (
  <div>
    {header}
    {/* main */}
  </div>
);
```

### Key Insights

- Hydration stability requires identical wrapper structure between SSR and CSR.
- Auth-provided layouts should receive server session to prevent client-only
  session races.
- Dynamic route-group layouts should opt out of static caching when
  session-bound.

### Prevention / Standards

- Always render the same header/breadcrumb wrapper in all branches.
- Avoid `typeof window` branches that change structure; only mutate content, not
  wrappers.
- Never use time/locale/random values to build structure/keys at SSR.
- Pass `getServerSession` result into auth provider at the layout level and mark
  such layouts `dynamic = 'force-dynamic'` when needed.

### Verification

- View page-source and client-rendered nodes; wrappers match (e.g., `<nav>`
  present in both).
- Network logs show no excessive `/api/auth/session` loops and layout resolves
  quickly.
- CLI confirms preference persistence via `/api/user/preferences` (no UI
  reliance).

---

## React Key Warnings: Stable Keys and Defensive Fallbacks

**Date**: 2025-08-21 • **Category**: React / Rendering

### Context

Dashboard charts emitted "Each child in a list should have a unique 'key' prop"
warnings when upstream data occasionally lacked expected ID fields.

### Problem

- Some arrays (employees/products/bundles) had missing/undefined identifier
  properties. Using those directly in `key={id}` triggered React warnings.

### Solution

- Use stable IDs when available. Otherwise, prefer deterministic composites
  (e.g., `${aId}-${bId}`). As last resort, use a namespaced index fallback
  (`employee-${index}`, `product-${index}`, etc.).

### Standard

- Do not use random/time-based keys. Avoid index keys for reorderable lists.
- Ensure API contracts include stable identifiers where possible; add defensive
  UI fallbacks when integrating historical/aggregate data.

### Verification

- No React key warnings in console. Lists render and update without reordering
  glitches.

---

## Chrome-Only Fast Refresh/Webpack Stale Chunk Errors

**Date**: 2025-08-21 • **Category**: Dev Experience / Build System

### Context

In Chrome during development, occasional errors appeared after edits:
`TypeError: Cannot read properties of undefined (reading 'call')`. Private
window worked; normal window failed until caches were cleared, indicating stale
module chunks and HMR cache interactions.

### Root Cause

- Dev persistent webpack cache + aggressive chunk reuse combined with browser
  caching and Fast Refresh produced stale module references.
- `experimental.optimizePackageImports` included React packages, increasing the
  likelihood of RSC/HMR edge cases.

### Solution

Applied dev-hardening in `next.config.js`:

- Remove React packages from `optimizePackageImports` (keep only non-React).
- Disable webpack persistent cache in dev (`config.cache = false`) and clear
  `snapshot.managedPaths`/`immutablePaths`.
- Set `optimization.realContentHash = false` in dev.
- Add dev-only no-store headers for `/_next/static/*` to avoid stale chunk
  reuse.
- If needed, run with `FAST_REFRESH=false npm run dev:smart` temporarily.

### Verification

- Hard refresh (or Empty Caches) resolves previously sticky errors.
- Subsequent edits no longer trigger Chrome-only HMR failures.

### Prevention / Standards

- Keep the dev config changes in place; do not reintroduce React into
  `optimizePackageImports`.
- Prefer `npm run dev:smart` always; use hard refresh/Empty Caches after config
  changes.

## Critical Performance Pattern: Always Use useApiClient for Client Fetching

**Date**: 2025-06-23 • **Category**: Performance / Architecture • **Impact**:
Critical

### Insight

Fast-loading components use the simple `useApiClient` pattern. Custom client
caches (memory/localStorage) and complex fetching logic add latency and bugs.

### Pattern

```typescript
const apiClient = useApiClient();
useEffect(() => {
  const run = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/endpoint');
      if (res.success && res.data) setData(res.data);
    } finally {
      setLoading(false);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  run();
}, []);
```

### Forbidden

- Custom client caching systems, direct `fetch()`/`axios` use, complex loading
  states, multi-dependency effects that refetch.

---

## Browser-Safe Environment Configuration (DATABASE_URL Separation)

**Date**: 2025-07-xx • **Category**: Security / Config

### Problem

Client-side code attempted to access server-only env like `DATABASE_URL`,
causing errors and potential exposure.

### Solution

Browser-safe env with `typeof window !== 'undefined'` guards; server-only values
resolved only on server.

### Standard

- Never resolve server secrets in browser bundles.
- Centralize env parsing in `src/lib/env.ts` with server/browser branches.

---

## Prisma Schema Validation & Field Mapping Corrections

**Date**: 2025-07-xx • **Category**: Database / Reliability

### Problems

- 500s from schema mismatches, invalid field mappings, and incorrect relation
  assumptions

### Solutions

- Corrected field mappings (e.g., `type`→`entityType`, workflow fields, junction
  tables)
- Verified actual Prisma schema before implementing validation
- Defensive conversions for dynamic access (`String()` where needed)

### Standard

- “Schema-first”: validate with `npx prisma migrate status` and check
  `schema.prisma` before coding
- Use separate reads for user and roles in auth; avoid deep nested relations in
  auth-critical paths

---

## NextAuth / Netlify Production Cookie Configuration

**Date**: 2025-07-xx • **Category**: Deployment / Authentication

### Problem

Prod API 500s due to cookie name mismatch and missing secure cookie settings in
serverless environment.

### Solutions

- `useSecureCookies` with production-specific cookie names
  (`__Secure-next-auth.session-token`)
- Verified API routes return JSON, not HTML, under serverless platform

### Standard

- Enforce secure cookies in production (`secure: true`, `sameSite`), correct
  cookie names
- Validate deployment configs with a prod readiness checklist

---

## React Effects: Avoid Infinite Loops from Unstable Dependencies

**Date**: 2025-07-xx • **Category**: React / Stability

### Problem

Including unstable functions (analytics, error handlers, API clients) in
dependency arrays caused infinite re-renders.

### Solutions

- Use mount-only effects (`[]`) for one-time initialization and data loading,
  with documented ESLint suppressions where appropriate
- Stabilize complex dependencies (e.g., arrays via `.join(',')`) judiciously
- Debounce user-driven actions; throttle analytics

### Standard

- Never include unstable objects/functions in deps for mount-only operations
- Keep effects minimal; prefer callbacks or explicit triggers for refreshes

---

## Controlled Components: Tabs and onValueChange Contract

**Date**: 2025-07-xx • **Category**: UI / Stability

### Problem

Using `defaultValue` with a Tabs component that requires `value`/`onValueChange`
triggered runtime errors.

### Solution

Implement controlled Tabs with `value` and `onValueChange` state handlers.

### Standard

- Follow component contracts; controlled components must be state-driven

---

## Standardized Error Handling System

**Date**: 2025-07-xx • **Category**: Reliability / UX

### Problem

Inconsistent error handling across components reduced observability and UX.

### Solution

Adopted `ErrorHandlingService`, `StandardError`, `ErrorCodes`, and
`useErrorHandler` everywhere.

### Standard

- Use `errorHandlingService.processError()` in all catches with metadata
- Use `getUserFriendlyMessage()` for user-facing text

---

## Pagination Without COUNT(\*) and Selective Hydration

**Date**: 2025-07-xx • **Category**: Performance / Database

### Problems

- Large table pagination spent time in `COUNT(*)`
- Over-fetching relations by default

### Solutions

- Use `limit + 1` to infer `hasMore`
- Minimal default selects; relations opt-in via query params

### Standard

- Maintain per-entity minimal field whitelist

---

## CUID vs UUID: Validation That Matches Reality

**Date**: 2025-07-xx • **Category**: Validation / Database

### Problem

UUID validation used where DB uses CUIDs (`@default(cuid())`), causing invalid
uuid errors.

### Standard

Use flexible string validation for IDs, not format-specific UUID checks, unless
schema confirms UUID.

---

## Analytics Throttling to Prevent Render Feedback Loops

**Date**: 2025-07-xx • **Category**: Analytics / Performance

### Problem

Unthrottled analytics events triggered state changes and re-renders.

### Solutions

- Throttle analytics (e.g., >=60s) for background metrics collection
- Avoid analytics calls inside mount-sensitive effects unless debounced

### Standard

- Treat analytics as side-effects with rate limits and guard conditions

---

## Documentation & Testing Practices for Performance

**Date**: 2025-07-xx • **Category**: QA / Tooling

### Practices

- Performance scripts warm key routes before measurement
- Validate on prod build (`next build && next start`)
- Prefer `data-testid` for selectors; provide coverage on critical widgets and
  wizard steps

---

## Single‑Query Resolution Pattern (Generalized N+1 Elimination)

**Date**: 2025-08-13 • **Category**: Database / API Performance

### Problem

Endpoints and UIs often fetched IDs first and then issued extra calls to resolve
names (users, products, customers). This created N+1 query patterns and doubled
network round‑trips.

### Solution

- Design endpoints to return all user‑visible labels and related fields in one
  query.
- Use set‑based joins and in‑clauses to resolve many names at once.
- For complex reads (array containment, denormalized snapshots), compute
  everything in a single `$queryRaw` (parameterized) and return compact lookup
  maps.

### Standard

- Prefer one database round‑trip per endpoint for the primary view.
- Techniques:
  - LEFT JOIN `users` once to include `createdByName` (version history list).
  - Single detail query computes `diff` and returns `productsMap` and
    `customerName` (version detail).
  - Use `findMany({ where: { id: { in: ids } }, select: { id, name } })` to
    resolve many labels at once.
  - Only use `$transaction` when multiple statements must be consistent;
    otherwise one query.
- Response contract: include `usersMap`/`productsMap`/`customersMap` so the
  client does not make follow‑up calls; UI uses these maps and falls back only
  on rare misses.

### Verification

- Network panel shows a single request for the view; no extra name‑resolution
  calls.
- DB logs show set‑based queries (joins or IN lists), not per‑row selects.

### Anti‑Patterns

- Fetch IDs then call another endpoint just to get display names.
- Per‑row `.findUnique()` inside loops.

---

---

## Netlify Production Deployment Requirements (Next.js App Router)

**Date**: 2025-07-xx • **Category**: Deployment

### Lessons

- Do not set `output: 'standalone'` in `next.config.js` (breaks Netlify
  serverless functions; API routes may return HTML instead of JSON).
- Ensure the catch-all redirect `/* -> /index.html` is the last rule in
  `netlify.toml` to preserve App Router client-side navigation.
- All NextAuth-referenced pages must exist before deployment (e.g.,
  `/auth/error`, `/contact`).
- Validate that API endpoints return JSON (not HTML) post-deploy.

---

## Schema Evolution & Historical Data Expectations

**Date**: 2025-08-07 • **Category**: Data Model / UX

### Context

Older entities created before schema enhancements may lack newly added fields
(e.g., proposal contact fields). Empty values are expected and not necessarily
bugs.

### Standards

- UI must gracefully handle missing historical fields with sensible defaults and
  clear empty states.
- Tests must cover both historical and newly created data cohorts.
- Prefer forward-only migrations and backfill jobs when needed; avoid breaking
  changes.

---

## Selective Field Retrieval Contract (fields param)

**Date**: 2025-07-xx • **Category**: API / Performance

### Pattern

- Endpoints accept a `fields` query parameter (comma-separated) parsed by
  `parseFieldsParam` and mapped by `getPrismaSelect`.
- Default (no fields specified) returns minimal, documented per-entity columns.
- Relations are opt-in via explicit field selections.

### Benefit

- Minimizes payloads, reduces DB load, and improves TTFB consistently across
  list/detail endpoints.

---

## No Mock Data in UI Paths

**Date**: 2025-07-xx • **Category**: Data Integrity / UX

### Standard

- UI components must fetch real data from the database (via `useApiClient`) and
  present proper empty/loading/error states.
- Use seed data in development environments instead of hardcoded mock arrays.
- Example: `TeamAssignmentStep` fetches real users by role (Managers,
  Executives, SMEs) rather than using mock constants.

---

## TypeScript Strict Mode & Zod at All Boundaries

**Date**: 2025-07-xx • **Category**: Type Safety / Validation

### Lessons

- Maintain 100% TypeScript compliance (0 errors) as a non-negotiable standard.
- Use Zod schemas for runtime validation at all boundaries (API routes, forms)
  with inference for static types.
- Share schemas between client and server where possible to ensure parity.

---

## Prisma Datasource URL: Avoid `prisma://` in Local Dev

**Date**: 2025-08-12 • **Category**: Database / Config

### Problem

- API routes returned 500s with Prisma errors like:
  `the URL must start with the protocol 'prisma://'`.
- Health checks showed Postgres reachable, but Prisma validated the datasource
  against an unexpected protocol.

### Root Cause

- Prisma client was conditionally using `CLOUD_DATABASE_URL` (prisma data proxy
  style `prisma://...`) in some environments.
- Local `.env` had a correct Postgres `DATABASE_URL=postgresql://...`, but
  runtime configuration could still pick the cloud URL depending on `NODE_ENV`
  or residual env state during dev.

### Fix

1. Simplified Prisma client configuration to always use `DATABASE_URL` for the
   datasource in all environments we control.
   - File: `src/lib/db/prisma.ts`
   - Change: set `datasources.db.url` to `process.env.DATABASE_URL` and
     hard-require it at startup.
2. Regenerated Prisma client: `npx prisma generate`.
3. Restarted dev server to reload env and client.

### Standard

- In app code, always prefer `DATABASE_URL` for Prisma datasource unless
  explicitly deploying behind Prisma Data Proxy.
- Keep any cloud-only URLs (e.g., `CLOUD_DATABASE_URL`) out of Prisma client
  initialization paths for local/dev.
- Validate presence of required envs early and fail fast with clear messages.

### Verification

- `npm run dev:smart` passes DB health check and API health validation.
- Admin APIs (e.g., `/api/admin/users`, `/api/admin/metrics`) return 200s.
- Prisma logs show standard Postgres queries; no `prisma://` validation errors.

### Snippet

```ts
// src/lib/db/prisma.ts (excerpt)
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
  log:
    process.env.NODE_ENV === 'production'
      ? ['error']
      : ['query', 'error', 'warn'],
});
```

---

## Database Transactions & Related Writes

**Date**: 2025-07-xx • **Category**: Database / Consistency

### Lessons

- Use `prisma.$transaction` for logically related multi-statement sequences to
  ensure atomicity and consistency.
- Avoid transactions for single reads where they add latency with no benefit.
- Never use `Promise.all` for related writes—wrap in a single transaction
  instead.

---

## Timer Management & Memory Leaks Prevention

**Date**: 2025-07-xx • **Category**: React / Performance

### Lessons

- Use `clearInterval` for `setInterval` and `clearTimeout` for `setTimeout`,
  always cleaning up timers on unmount.
- Store timer IDs in `useRef` to prevent stale closures and ensure proper
  cleanup.
- Avoid periodic memory monitoring in production unless required; gate debug
  logs behind env flags.

---

## List View Performance Optimization: Minimal Fields & Client-Side Transformation

**Date**: 2025-01-08 • **Category**: Performance / Data Fetching • **Impact**:
Critical

### Context

The proposals/manage page was loading slowly compared to the dashboard due to
heavy initial data fetching with full relation hydration and server-side UI
transformation.

### Problem

- Initial load requested 50+ items with `includeCustomer=true&includeTeam=true`
- Server was doing complex UI transformation instead of returning raw data
- Large payloads (100+ fields per item) causing slow TTFB
- Multiple relation joins creating database performance bottlenecks

### Solution

**1. Minimal Field Selection**

```typescript
// ✅ OPTIMIZED: Request only needed fields
const endpoint = `/proposals?limit=30&sortBy=updatedAt&sortOrder=desc&includeCustomer=false&includeTeam=false&fields=id,title,status,priority,createdAt,updatedAt,dueDate,value,tags,customerName,creatorName`;

// ❌ BEFORE: Heavy relation hydration
const endpoint = `/proposals?limit=50&includeCustomer=true&includeTeam=true&fields=id,title,status,priority,createdAt,updatedAt,dueDate,value,tags,customer(id,name,industry),assignedTo(id,name,role),creator(id,name,email)`;
```

**2. Client-Side Transformation with Fallbacks**

```typescript
// ✅ CORRECT: Defensive client-side mapping
const transformedData = apiData.map(item => ({
  id: String(item.id || ''),
  title: String(item.title || ''),
  client: item.customerName || 'Unknown Client',
  status: mapApiStatusToUIStatus(String(item.status || 'draft')),
  priority: mapApiPriorityToUIPriority(String(item.priority || 'medium')),
  dueDate: new Date(item.dueDate || new Date()),
  estimatedValue: typeof item.value === 'number' ? item.value : 0,
  teamLead: item.creatorName || 'Unassigned',
  // ... other fields with fallbacks
}));
```

**3. Optimized Page Size**

- Reduced from 50 to 30 items per initial load
- Faster TTFB and render time
- Better perceived performance

### Key Insights

- **Denormalized fields** (`customerName`, `creatorName`) eliminate relation
  joins
- **Client-side transformation** with fallbacks is more resilient than
  server-side
- **Minimal field selection** reduces payload size by 60-80%
- **Smaller page sizes** (30 vs 50) improve initial load time significantly
- **Defensive mapping** handles missing data gracefully without errors

### Performance Impact

- **TTFB**: Reduced from 800ms to 200ms
- **Payload Size**: Reduced from 15KB to 5KB per page
- **Database Queries**: Eliminated N+1 relation queries
- **User Experience**: Instant loading vs noticeable delay

### Standard Pattern

**For any list view implementation:**

1. **API Endpoint Design**:
   - Use `fields` parameter with minimal columns
   - Disable relation hydration (`includeCustomer=false&includeTeam=false`)
   - Prefer denormalized fields over relations
   - Use cursor pagination with `limit+1` pattern

2. **Client-Side Processing**:
   - Transform API data to UI format with defensive fallbacks
   - Handle missing data gracefully (`'Unknown Client'`, `'Unassigned'`)
   - Use type-safe mapping with `String()`, `Number()` conversions
   - Implement proper error boundaries for transformation failures

3. **Performance Targets**:
   - Initial load: <500ms TTFB
   - Page size: 30-50 items maximum
   - Payload: <10KB per page
   - Database queries: Single query per page load

### Anti-Patterns to Avoid

- ❌ Requesting 100+ items with full relation hydration
- ❌ Server-side UI transformation instead of raw data
- ❌ Large page sizes (>50) for initial loads
- ❌ Missing fallbacks in client-side mapping
- ❌ Complex relation joins for list views

### Verification Checklist

- [ ] API endpoint uses minimal `fields` parameter
- [ ] Relation hydration disabled (`includeCustomer=false&includeTeam=false`)
- [ ] Client-side transformation with defensive fallbacks
- [ ] Page size ≤50 items for initial load
- [ ] TTFB <500ms measured
- [ ] Graceful handling of missing data
- [ ] Type-safe data mapping with conversions

---

End of curated list. All earlier detailed entries are preserved in the
repository history for reference.

---

## Engineering Workflow & Quality Gates

**Date**: 2025-07-xx • **Category**: Process / DX

### Standards

- Use `npm run dev:smart` during development (health checks + smart startup).
- Run quality gates before commit: `npm run type-check`,
  `npm run quality:check`, `npm run test` (where applicable).
- Documentation updates are mandatory after implementations (update
  `IMPLEMENTATION_LOG.md`; add lessons here if significant).
- Avoid duplicates: search existing patterns before adding new code; follow the
  File Responsibility Matrix.
- Prefer automated scripts for endpoint testing over manual browser steps when
  possible.

---

## Wizard Cross‑Step Hydration and Derived Defaults (General Pattern)

**Date**: 2025-08-09 • **Category**: Data Hydration / UX / Wizards

### Context

Multi-step wizards often have downstream steps that depend on data selected
upstream (e.g., team selections → section assignments, content selections →
ownership). A common failure mode is rendering an empty downstream map on first
visit even though earlier steps are complete.

### Problem (Generalized)

- Downstream step state (e.g., `assignments`, `owners`, `mappings`) is
  initialized empty and shown directly in the UI.
- Hydration only considers the current step’s stored state and ignores upstream
  sources.
- Key mismatches (id vs title/name) prevent matching even when data exists.
- Result: users see blank fields despite having completed earlier steps.

### Standard Solution

Implement a non-destructive, layered derivation when computing downstream step
data. If the core mapping is empty or missing keys, derive defaults from prior
steps and local hints:

1. Current step explicit data (highest precedence)
2. Current step local hints (e.g., `sections[].assignedTo`)
3. Upstream step outputs (team selections, content selections, etc.)
4. Heuristics (normalized title/name matching)

Merge order must preserve user input. Only fill missing keys; never overwrite
explicit values.

### Key Techniques

- Normalization: define a single helper used across steps: lowercase → strip
  non-alphanumerics → trim. Use both stable ids and `normalize(title)` keys when
  merging.
- Guarded seeding: only derive when the downstream map is empty or a specific
  key is missing.
- Persistence: after deriving, push the hydrated data up to the wizard state so
  subsequent renders are stable.
- Logging: log counts and key sets (not entire payloads) to verify hydration
  without noise.

### Anti‑Patterns

- Showing the downstream map without attempting derivation when empty.
- Overwriting user-entered downstream values with upstream heuristics.
- Relying on string equality without normalization across sources (id vs
  title/name).

### Diagnostic Signals

- Console repeatedly shows an empty key set for the downstream map on first
  visit.
- Navigating back shows upstream selections intact, but downstream remains
  blank.
- Downstream becomes populated only after manual edits (indicates missing
  derivation).

### Implementation Checklist (Apply to any wizard step with dependencies)

- [ ] Identify upstream sources required to seed this step.
- [ ] Implement `deriveDefaults()` that builds a map using the precedence order
      above.
- [ ] Normalize keys consistently; support both id and normalized title/name
      lookups.
- [ ] Merge non-destructively into current step state; fill only missing keys.
- [ ] Persist the merged result to the parent wizard state on first hydration.
- [ ] Add unit tests: empty current map + populated upstream → derived map is
      correct.
- [ ] Add e2e test: complete upstream step → first visit to downstream step
      shows prefilled values.

### Example Merge Precedence (Abstract)

CurrentStep.map > CurrentStep.localHints > UpstreamStep.outputs >
HeuristicMapping

This rule applies broadly: owners, reviewers, assignments, default dates/hours,
etc.

---

## SME Prefill Hydration – TeamAssignmentStep (Resolved)

**Date**: 2025-08-09 • **Phase**: 2.3.x – Proposal Management • **Category**:
Data Hydration / UX

### Context

Editing an existing proposal showed correct SMEs in summary but empty SME
selects in Step 2.

### Problem

- `TeamAssignmentStep` received an empty `subjectMatterExperts` object even
  though the API returned valid SME data.
- Data existed in multiple possible locations (`metadata.teamAssignments`,
  top-level `teamAssignments`, and `wizardData.step2`).

### Root Cause

- Hydration relied primarily on `metadata` and a narrow readiness check.
- Missing fallbacks meant SMEs were dropped when data landed in alternate
  shapes/paths.

### Solution

- Implemented defensive merge in `ProposalWizard` for Step 2:
  - Merge sources in priority order:
    1. `proposal.metadata.teamAssignments.subjectMatterExperts`
    2. top-level `proposal.teamAssignments.subjectMatterExperts`
    3. `proposal.wizardData.step2.subjectMatterExperts`
  - Preserve existing values; no destructive overwrites.
- Removed duplicate/competing merge block; added targeted debug logs during
  verification.
- Ensured `TeamAssignmentStep` registers nested RHF fields and keeps options
  including pre-assigned SME ids.

### Standards (Prevention)

- Always support multiple historical shapes when hydrating wizard data.
- Step hydration must be a non-destructive merge; never zero-out nested objects.
- Prefer explicit source priority: metadata → top-level → wizardData.
- For nested RHF objects, set both the whole object and each nested path to
  guarantee registration.
- Ensure Select options include any preassigned ids so values render immediately
  while labels resolve after user list loads.

### Verification

- CLI: authenticated GET `/api/proposals/:id` confirmed SME ids.
- UI: Step 2 now pre-fills SMEs consistently; logs show merged
  `step2.subjectMatterExperts`.

### Checklist

- [x] Defensive merge in `ProposalWizard`
- [x] Remove duplicate code
- [x] RHF nested registration for SMEs
- [x] Options include pre-assigned ids
- [x] Lints clean and behavior validated

---

## Standardized Wizard Data Retrieval & Hydration Contract

**Date**: 2025-08-09 • **Category**: Data Hydration / UX / Wizards

### Why

Save/retrieve bugs often come from inconsistent shapes and key mismatches across
sources (metadata vs relations vs wizardData). This contract standardizes how
every wizard step retrieves and populates data, preventing empty UIs despite
saved data.

### Core Rules

- Non-destructive merge: never overwrite explicit step values; only fill missing
  fields
- Source priority (highest → lowest):
  1. `metadata.wizardData.stepN`
  2. `metadata` step-level synonyms (e.g., `metadata.teamAssignments`,
     `metadata.sectionAssignments`)
  3. Top-level relational data (e.g., `products`, `sections`, `assignedTo`)
  4. Derived defaults from upstream steps (only if missing)
  5. Safe defaults
- Stable keys: prefer IDs; when titles are used, also store `normalize(title)`
  keys
- Normalization utilities:
  - IDs: `String(id)`
  - SME roles: uppercase keys
  - Titles: lowercase → trim → remove non-alphanumerics
- Validation: ignore non-existent IDs (stale references)
- Persist merged result upward (so subsequent renders are stable)

### Per-Step Retrieval Matrix

- Step 1 (Basic Information)
  - From: `metadata.wizardData.step1.details/client` → top-level proposal fields
    → safe defaults
  - Contact fields: prefer metadata; fallback to customer primary contact; then
    customer

- Step 2 (Team Assignment)
  - From: `metadata.wizardData.step2` → `metadata.teamAssignments` → derive from
    `assignedTo` if roles are known
  - SME keys normalized to UPPERCASE; preserve any existing values

- Step 3 (Content Selection)
  - From: `metadata.wizardData.step3.selectedContent` →
    `metadata.contentSelections`
  - Validate each `contentId` exists; drop invalid; do not fabricate items

- Step 4 (Product Selection)
  - From: relation `products` (proposalProducts join) →
    `metadata.wizardData.step4.products`
  - Always use real `product.id` as `productId` (never SKU); hydrate
    `unitPrice/category` from DB when present
  - De-duplicate by `product.id`; preserve quantities and totals when provided

- Step 5 (Section Assignment)
  - Sections: relation `sections` (ordered) →
    `metadata.wizardData.step5.sections`
  - Assignments: `metadata.wizardData.step5.sectionAssignments` →
    `metadata.sectionAssignments`
  - Derive any missing assignments from Step 2 team roles and Step 3 content
    ownership; fill only missing keys

### Reference Pseudo-Implementation

```ts
function hydrateStepData(proposal) {
  const md = proposal.metadata || {};
  const wd = md.wizardData || {};

  // Step 1
  const step1 = {
    client: wd.step1?.client ?? buildClientFromCustomer(proposal.customer),
    details: {
      ...wd.step1?.details,
      title: wd.step1?.details?.title ?? proposal.title,
      dueDate: wd.step1?.details?.dueDate ?? iso(proposal.dueDate),
      estimatedValue: wd.step1?.details?.estimatedValue ?? proposal.value,
      priority: wd.step1?.details?.priority ?? proposal.priority,
      description: wd.step1?.details?.description ?? proposal.description,
      rfpReferenceNumber:
        wd.step1?.details?.rfpReferenceNumber ?? md.rfpReferenceNumber,
    },
  };

  // Step 2 (normalize SME keys)
  const normalizedTA = normalizeSmeKeys(
    wd.step2 ??
      md.teamAssignments ??
      deriveTeamFromAssignedTo(proposal.assignedTo)
  );
  const step2 = { ...normalizedTA };

  // Step 3 (validate IDs)
  const step3Raw = wd.step3?.selectedContent ?? md.contentSelections ?? [];
  const step3 = { selectedContent: validateContentIds(step3Raw) };

  // Step 4 (prefer relation; ensure productId is product.id)
  const step4FromRelation = (proposal.products || []).map(pp => ({
    id: pp.product?.id,
    name: pp.product?.name,
    quantity: pp.quantity,
    unitPrice: pp.unitPrice ?? pp.product?.price,
    totalPrice: (pp.unitPrice ?? pp.product?.price) * pp.quantity,
    category: undefined,
  }));
  const step4 = {
    products: mergeProducts(step4FromRelation, wd.step4?.products).map(p =>
      coerceProductWithDb(p)
    ),
  };

  // Step 5
  const baseSections = proposal.sections?.length
    ? proposal.sections
    : (wd.step5?.sections ?? []);
  const assignments = nonDestructiveMerge(
    wd.step5?.sectionAssignments ?? {},
    md.sectionAssignments ?? {}
  );
  const derived = deriveMissingAssignments(
    assignments,
    step2,
    step3,
    baseSections
  );
  const step5 = {
    sections: baseSections,
    sectionAssignments: { ...assignments, ...derived },
  };

  return { step1, step2, step3, step4, step5 };
}
```

### Verification Checklist

- [ ] Logs print only counts and key sets (not whole payloads)
- [ ] Missing IDs are dropped; no 404s from stale references
- [ ] Product `productId` equals DB `product.id` across create/edit
- [ ] SME keys are UPPERCASE; values preserved on edit
- [ ] Section assignments fill only missing keys (never overwrite user edits)

### Adoption Guidance

- Implement a single `hydrateStepData(proposal)` in the wizard container and
  pass shaped data to each step
- Keep all normalization helpers colocated (SME keys, title normalization, ID
  coercion)
- When adding new step fields, extend the matrix and pseudo-implementation;
  preserve the merge order

### Persistence & Retrieval Contract (Generalized)

This unified contract ensures edits persist across all wizard steps and reload
reliably.

1. PATCH Payload Rules

- Mirror snapshots under both roots:
  - `metadata.wizardData.stepN.*` (UI-friendly, future-proof) and
  - `wizardData.stepN.*` (historic fallback)
- Include top-level scalars where the backend expects them (e.g., `title`,
  `description`, `priority`, `rfpReferenceNumber`, `dueDate`, `value`).
  - Enums to backend: send in expected enum case (e.g., `priority` as UPPERCASE
    if required by API), while storing UI-facing values in normalized form
    (e.g., lowercase) inside `metadata.wizardData`.
- Relations (e.g., products in Step 4):
  - Send relation-friendly shape the API can process (ids, quantities, prices),
    and also mirror under `metadata.wizardData.step4.products` for hydration.
- Content selections and assignments:
  - Mirror `contentSelections` at metadata root with
    `{ contentId, section, customizations, assignedTo }`.
  - Persist `sectionAssignments` at `metadata.sectionAssignments` and within
    `metadata.wizardData.step5` as needed.
- Do not drop existing metadata: deep-merge by step; preserve previous keys.

2. GET/Hydration Rules

- Always unwrap Prisma-style wrappers: if metadata is `{ set: ... }`, use
  `.set`.
- Merge order for each step:
  1. `metadata.wizardData.stepN` (latest canonical snapshot)
  2. top-level convenience fields (e.g., `proposal.priority`,
     `proposal.sections`)
  3. legacy `wizardData.stepN`
  4. derived defaults (IDs from relations, normalized titles, inferred
     assignments)
- Normalize and coerce types consistently:
  - Priority: coerce to `ProposalPriority` ('high' | 'medium' | 'low') for UI;
    map to backend enum casing for PATCH.
  - IDs: ensure `productId === product.id`; drop unknown IDs.
- Non-destructive merges: only fill missing keys; never overwrite user-entered
  values.

3. Logging & Validation

- Log counts and key sets only; avoid dumping full payloads (PII/noise).
- Validate incoming IDs exist; silently drop stale entries.
- Unit-test hydration: each step with and without metadata/relations.

### Do‑Not List (Persistence Pitfalls)

- Do not rely on a single source (only metadata or only relations). Always merge
  across metadata, top-level, wizardData, and derived defaults.
- Do not overwrite nested `metadata.wizardData` objects; deep-merge per step.
- Do not persist only UI casing for enums to the backend; map to backend enum
  casing on PATCH.
- Do not store SKU or display names as IDs; always use real database ids.
- Do not assume metadata is raw; unwrap `{ set: ... }` before use.
- Do not log entire metadata or PATCH bodies in development; log shapes and
  sizes only.

### Deprecated (Removed) Approaches

- Storing only `wizardData.stepN` without mirroring under `metadata.wizardData`.
- Hydrating strictly from a single path (e.g., only `metadata` or only top-level
  relations).
- Sending PATCH bodies that overwrite entire `metadata` trees instead of merging
  per step.
- Relying on title-based keys without normalized fallback or stable ids.

### Do‑Not List (Common Failure Patterns and How to Avoid Them)

- Do not use SKU as `productId` in Step 4; always use the real `product.id`.
  Hydrate price/category from DB.
- Do not overwrite nested `metadata.wizardData` on PATCH; deep-merge per step,
  merging `step5.sectionAssignments` non-destructively.
- Do not rely on a single source for hydration. Always merge: `wizardData.stepN`
  → `metadata.*` synonyms → top-level relations → derived defaults.
- Do not include stale or dummy IDs (e.g., `patch-test-1`) in
  `contentSelections`. Validate IDs and drop non-existent entries.
- Do not write access logs when there is no content or when the session user is
  not persisted; guard and skip.
- Do not early‑return a separate dev path for PATCH. Dev bypass must run the
  same merge/update flow and only skip permission checks.
- Do not assume UUID validation for IDs when schema uses CUID; use flexible
  string validation and server-side existence checks.
- Do not include unstable instances (e.g., `apiClient`, error handlers) in
  mount-only effect dependencies; avoid re-render loops.
- Do not log entire payloads; only log counts and key sets for verification to
  reduce noise and PII risk.
- Do not attempt to persist to removed/mismatched DB columns (e.g.,
  `rfpReferenceNumber` when schema stores it in metadata). Align seed/scripts
  with current schema.
- Do not overwrite user-entered section assignments. Derive only when keys are
  missing; preserve explicit values.
- Do not depend on stale proposal IDs. Navigate from lists or re-resolve IDs
  before fetch/edit.
- Do not omit raw `metadata` in GET responses when the client hydrates from it;
  include it explicitly.
- Do not fetch with ad‑hoc clients. Use the standard `useApiClient` which
  handles base URL, credentials, and error handling.
- Do not create FK rows with placeholder IDs (e.g., `'LIST_OPERATION'`); only
  write logs with real IDs.
- Do not mismatch Step 5 keys (title vs id). Prefer IDs; when titles are needed,
  also store normalized title keys.

---

## Proposal Edit Authentication Error: Provider Context & Route Wrapping

**Date**: 2025-08-16 • **Category**: Authentication / Routing • **Impact**:
Critical

### Context

Users attempting to edit proposals via `/proposals/create?edit=<id>` encountered
"Authentication error. Please sign in again." messages, even when properly
authenticated. The error occurred specifically in the ProposalWizard component
during product selection and updates.

### Problem

- `useAuth` hook was called outside of `AuthProvider` context in the edit route
- Proposal edit pages (`/proposals/create` and `/dashboard/proposals/create`)
  were not wrapped with authentication providers
- Wizard components attempted API calls before authentication context was
  available
- Console showed warnings: "useAuth called outside of AuthProvider. Returning
  safe default context."

### Root Cause

The proposal edit routes were standalone pages that didn't inherit the
authentication context from the dashboard layout. When users navigated to edit
proposals, the `ProposalWizard` component tried to make authenticated API calls
but had no access to the user session.

### Solution

**1. Provider Wrapping for Edit Routes**

```typescript
// src/app/proposals/create/page.tsx
export default function ProposalCreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ClientLayoutWrapper>
        <QueryProvider>
          <AuthProvider>
            <ClientPage />
          </AuthProvider>
        </QueryProvider>
      </ClientLayoutWrapper>
    </Suspense>
  );
}
```

**2. Authentication Guard in ProposalWizard**

```typescript
// src/components/proposals/ProposalWizard.tsx
const { user, isAuthenticated } = useAuth();

// Guard against unauthenticated API calls
if (!isAuthenticated) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading authentication...</p>
      </div>
    </div>
  );
}
```

**3. Consistent Provider Stack**

Applied the same provider wrapping pattern to both edit routes:

- `/proposals/create` (standalone route)
- `/dashboard/proposals/create` (dashboard route)

### Key Insights

- **Route-level authentication**: Edit routes must be wrapped with
  authentication providers, not just dashboard routes
- **Provider hierarchy**: `ClientLayoutWrapper` → `QueryProvider` →
  `AuthProvider` ensures proper context inheritance
- **Authentication guards**: Components should check authentication status
  before making API calls
- **Graceful loading**: Show loading states instead of error messages when
  authentication is not yet available

### Prevention Standards

- **Always wrap edit routes** with the full provider stack:
  `ClientLayoutWrapper` → `QueryProvider` → `AuthProvider`
- **Implement authentication guards** in components that make API calls,
  especially wizards and forms
- **Check provider context** in development by monitoring console warnings about
  hooks called outside providers
- **Use consistent provider patterns** across all routes that require
  authentication

### Verification Checklist

- [ ] Edit routes wrapped with authentication providers
- [ ] No console warnings about `useAuth` outside `AuthProvider`
- [ ] Authentication guards implemented in API-calling components
- [ ] Loading states shown instead of authentication errors
- [ ] Both standalone and dashboard edit routes work consistently

### Anti-Patterns to Avoid

- ❌ Standalone edit routes without authentication providers
- ❌ API calls without checking authentication status
- ❌ Error messages instead of loading states for authentication delays
- ❌ Inconsistent provider patterns across similar routes

---

## Critical API Response Structure Mismatch - Product Selection Step

**Date**: 2025-08-24 • **Category**: API Integration / Data Fetching / Debugging
• **Impact**: Critical

### Context

The ProductSelectionStep component was failing with "Failed to load products"
error and "undefined is not an object (evaluating
'response.data.products.length')" runtime errors. This occurred during product
selection in proposal creation workflows.

### Problem

The component expected an API response structure with nested `products` array:

```json
{
  "success": true,
  "data": {
    "products": [...], // Expected nested structure
    "total": number,
    "page": number,
    "limit": number
  }
}
```

But the actual API response structure was:

```json
{
  "success": true,
  "data": [...], // Direct array - no nested "products" property
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  },
  "filters": {},
  "message": "Products retrieved successfully"
}
```

### Root Cause

- **TypeScript Interface Mismatch**: Component's TypeScript interface didn't
  match actual API response structure
- **Data Access Pattern**: Component tried to access `response.data.products`
  when data was directly `response.data`
- **API Evolution**: API response structure had evolved but component wasn't
  updated to match

### Solution

**1. Updated TypeScript Interface**

```typescript
// BEFORE (❌ Incorrect structure):
const response = await apiClient.get<{
  success: boolean;
  data: {
    products: Product[];
    total: number;
    page: number;
    limit: number;
  };
}>('/api/products?page=1&limit=100&isActive=true');

// AFTER (✅ Correct structure):
const response = await apiClient.get<{
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: Record<string, unknown>;
  message: string;
}>('/api/products?page=1&limit=100&isActive=true');
```

**2. Fixed Data Access Pattern**

```typescript
// BEFORE (❌ Accessing non-existent nested property):
setProducts(response.data.products);
setFilteredProducts(response.data.products);
console.log('Products loaded:', response.data.products.length, 'products');

// AFTER (✅ Accessing direct array):
setProducts(response.data);
setFilteredProducts(response.data);
console.log('Products loaded:', response.data.length, 'products');
```

**3. Added Defensive Programming**

Enhanced the component with defensive checks to prevent similar issues:

- Added `if (products && Array.isArray(products))` checks before iteration
- Used `(filteredProducts || []).map(...)` to ensure arrays are always defined
- Added `products && Array.isArray(products) ? products.find(...) : undefined`
  for safe property access

### Key Insights

1. **API Response Structure Validation**: Always verify actual API response
   structure before implementing TypeScript interfaces
2. **Defensive Programming**: Use defensive checks for array operations and
   property access
3. **API Evolution Tracking**: Keep TypeScript interfaces synchronized with
   actual API responses
4. **Debugging Strategy**: Use CLI tools to inspect actual API responses when
   debugging structure mismatches

### Prevention Standards

- **✅ Always verify API response structure** using CLI tools before
  implementing TypeScript interfaces
- **✅ Use defensive programming patterns** for array operations and property
  access
- **✅ Keep TypeScript interfaces synchronized** with actual API responses
- **✅ Test API integration** with real endpoints during development
- **✅ Add comprehensive error handling** for data structure mismatches

### Debugging Process

1. **API Response Inspection**: Used
   `npx tsx scripts/app-cli.ts --command "get /api/products"` to inspect actual
   response
2. **Structure Comparison**: Compared expected vs actual response structure
3. **TypeScript Interface Update**: Updated interface to match actual API
   response
4. **Data Access Pattern Fix**: Changed from `response.data.products` to
   `response.data`
5. **Defensive Programming**: Added safety checks for array operations

### Verification Checklist

- [ ] API response structure verified using CLI tools
- [ ] TypeScript interface matches actual API response
- [ ] Data access patterns use correct property paths
- [ ] Defensive checks implemented for array operations
- [ ] Component loads products successfully without errors
- [ ] Product selection functionality works correctly

### Anti-Patterns to Avoid

- ❌ Assuming API response structure without verification
- ❌ Using TypeScript interfaces that don't match actual API responses
- ❌ Accessing nested properties that don't exist
- ❌ Missing defensive checks for array operations
- ❌ Not testing API integration with real endpoints

### Related

- [API Integration Patterns][memory:api-integration]
- [TypeScript Interface Standards][memory:typescript-standards]
- [Defensive Programming Patterns][memory:defensive-programming]
- [Debugging API Issues][memory:api-debugging]

---

## UI Component Redundancy Elimination - Products Page Layout Cleanup

**Date**: 2025-08-24 • **Category**: UI/UX / Component Architecture •
**Impact**: High

### Context

The Products page had a messy layout with redundant search inputs, duplicate
filter controls, and scattered UI elements that created visual clutter and poor
user experience.

### Problem

- **Duplicate Search Inputs**: Two identical search bars (one in header, one in
  ProductListBridge)
- **Redundant Filter Controls**: Status and category dropdowns appeared in
  multiple locations
- **Scattered Controls**: Sort, view mode, and filter toggles were split across
  different sections
- **Poor Visual Hierarchy**: No clear separation between header, controls, and
  content areas

### Root Cause

- **Component Responsibility Overlap**: ProductListBridge component had its own
  search/filter state instead of using props from parent
- **Inconsistent Layout Structure**: Header and content areas had competing
  control sections
- **Missing Single Source of Truth**: Search and filter state was managed in
  multiple places

### Solution

**1. Eliminated Redundant Controls**

```typescript
// BEFORE: ProductListBridge had its own search/filter controls
<div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
  <div className="flex flex-col sm:flex-row gap-4">
    <input placeholder="Search products..." />
    <select>All Status</select>
    <select>All Categories</select>
  </div>
</div>

// AFTER: Removed redundant controls, use props from parent
// ProductListBridge now only renders the product grid
```

**2. Consolidated Header Layout**

```typescript
// BEFORE: Scattered controls across multiple sections
<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
  {/* Title and redundant controls mixed together */}
</div>

// AFTER: Clean, organized header structure
<div className="flex items-center justify-between mb-6">
  {/* Title and Create button only */}
</div>
<div className="flex flex-col lg:flex-row gap-4">
  {/* Single search and controls bar */}
</div>
```

**3. Single Source of Truth for State**

```typescript
// BEFORE: Multiple state management locations
const [searchTerm, setSearchTerm] = useState(props.search || '');
const [statusFilter, setStatusFilter] = useState<string>('');

// AFTER: Use props from parent component
const searchTerm = props.search || '';
const statusFilter =
  props.isActive !== undefined ? (props.isActive ? 'active' : 'inactive') : '';
```

### Key Insights

1. **Component Responsibility**: Child components should not duplicate parent
   functionality
2. **Single Source of Truth**: State should be managed at the appropriate level
   and passed down as props
3. **Visual Hierarchy**: Clear separation between header, controls, and content
   improves UX
4. **Layout Consistency**: Unified control placement creates better user
   experience

### Prevention Standards

- **✅ Single Control Section**: All search, sort, and filter controls in one
  location
- **✅ Props Over Local State**: Child components use props instead of
  duplicating parent state
- **✅ Clear Visual Hierarchy**: Header → Controls → Content structure
- **✅ Responsive Design**: Controls adapt properly to different screen sizes
- **✅ Consistent Spacing**: Proper padding and margins between sections

### Verification Checklist

- [ ] Only one search input visible on page
- [ ] All controls consolidated in single section
- [ ] No duplicate filter dropdowns
- [ ] Clean visual hierarchy maintained
- [ ] Responsive design working correctly
- [ ] State management simplified

### Anti-Patterns to Avoid

- ❌ Duplicate search inputs in different components
- ❌ Child components managing their own search/filter state
- ❌ Scattered controls across multiple sections
- ❌ Inconsistent visual hierarchy
- ❌ Redundant UI elements

### Related

- [Component Architecture Patterns][memory:component-architecture]
- [State Management Best Practices][memory:state-management]
- [UI/UX Design Standards][memory:ui-standards]

---

## Collapsible Sidebar Design Pattern - State Management & Responsive Behavior

**Date**: 2025-08-24 • **Category**: UI/UX / Navigation • **Impact**: High

### Context

When implementing collapsible navigation components, proper state management and
responsive behavior are critical for user experience and accessibility.

### Problem

- **State Management**: Collapse state needs to be managed at the layout level,
  not component level
- **Responsive Design**: Collapse functionality should be disabled on mobile to
  avoid conflicts with mobile navigation patterns
- **Accessibility**: Icon-only mode requires tooltips and keyboard shortcuts for
  usability
- **Content Adaptation**: Main content area must adjust margins when sidebar
  collapses

### Key Insights

1. **Layout-Level State Management**: Collapse state should be managed in the
   parent layout component (AppLayout) and passed down as props to child
   components
2. **Responsive Behavior**: Collapse functionality should only be available on
   desktop (lg+ screens) to avoid conflicts with mobile overlay navigation
3. **Icon Centering**: Use `mx-auto` class for centered icons in collapsed state
   instead of manual positioning
4. **Tooltip Integration**: Native HTML `title` attribute provides accessible
   tooltips without additional complexity
5. **Keyboard Accessibility**: Include keyboard shortcuts (Alt+C) for power
   users while maintaining mouse/touch functionality

### Prevention Standards

- **✅ Layout-Level State**: Manage collapse state in parent layout, not child
  components
- **✅ Responsive Guards**: Disable collapse functionality on mobile devices
- **✅ Icon Centering**: Use CSS classes for consistent icon positioning
- **✅ Tooltip Support**: Provide tooltips for icon-only navigation states
- **✅ Keyboard Shortcuts**: Include keyboard alternatives for accessibility
- **✅ Content Adaptation**: Adjust main content margins when sidebar state
  changes

### Anti-Patterns to Avoid

- ❌ Managing collapse state in child components instead of parent layout
- ❌ Enabling collapse functionality on mobile devices
- ❌ Manual icon positioning instead of CSS classes
- ❌ Missing tooltips in icon-only navigation modes
- ❌ No keyboard shortcuts for accessibility
- ❌ Fixed content margins that don't adapt to sidebar state

### Related

- [Responsive Design Patterns][memory:responsive-design]
- [Accessibility Standards][memory:accessibility]
- [State Management Best Practices][memory:state-management]

---

## Critical Fix: QueryClient Provider & React Query Mutations

**Date**: 2025-01-21 **Phase**: 2.7 - Infrastructure Stability **Context**:
Fixing "No QueryClient set" error causing 500 errors on products and customers
pages **Problem**: QueryProvider was only rendering QueryClientProvider after
client-side hydration, but components were trying to use useQueryClient
immediately, causing runtime errors **Solution**:

- Fixed QueryProvider to always render QueryClientProvider (removed client-side
  only condition)
- Replaced mock mutation objects with proper React Query useMutation hooks
- Added proper cache invalidation and updates for create/update/delete
  operations **Key Insights**:
- QueryClientProvider must be available during SSR/CSR hydration, not just after
  client-side initialization
- Mock mutation objects break React Query's caching and error handling
- Proper useMutation hooks provide better error handling and cache management
  **Prevention**:
- Always ensure QueryClientProvider is available from the start
- Use proper React Query hooks instead of mock objects
- Test React Query functionality during development **Analytics Impact**:
  Maintained existing tracking **Accessibility Considerations**: No
  accessibility implications **Security Implications**: No security changes,
  pure infrastructure fix **Related**: [Design System Migration - Phase
  3][memory:phase3], [React Query Integration][memory:react-query]

---

## ProductCreationForm Concurrency & Routing Fixes

**Date**: 2025-08-22 • **Category**: React Concurrency / Form Validation /
Routing

### Context

ProductCreationForm experienced "Step is still running" errors from concurrent
step validation and routing inconsistencies between modal (`/products`) and
standalone (`/products/create`) usage.

### Problems

- Concurrent `handleNextStep` calls causing race conditions during validation
- Rapid clicks bypassing validation states and triggering multiple async
  operations
- SKU uniqueness validation missing on field blur
- Routing inconsistency: form worked as modal but failed as standalone page

### Solutions

**1. Synchronous Guards & Throttling**

- Added `useRef` guards (`advancingRef`, `lastAdvanceAtRef`) to prevent
  re-entrant calls
- 300ms throttle on rapid clicks to prevent overlapping validations
- All navigation handlers respect `isAdvancingStep` state

**2. UI State Management**

- Disabled all navigation buttons during step advancement or validation
- Added loading spinner on "Next Step" button during validation
- Modal close button disabled during advancement

**3. SKU Uniqueness Validation**

- Implemented real-time validation on field blur via API call
- Visual feedback with border color changes (red=taken, green=available)
- Submit blocked when SKU is invalid or being checked

**4. Routing Consistency**

- Added `inline` prop to support both modal and standalone rendering
- Fixed `/products/create` route to render form independently
- Ensured identical behavior between both usage patterns

**5. Error Handling Compliance**

- Updated to use `ErrorHandlingService.getInstance().processError()` pattern
- Added proper error metadata with component context
- Wrapped `handleSubmit` in `useCallback` to fix React Hook dependencies

### Key Insights

- **Synchronous guards** prevent React state race conditions more effectively
  than async locks
- **UI disabling** during operations provides better UX than error messages
- **Real-time validation** improves form completion rates and data quality
- **Dual rendering modes** require careful prop design to maintain consistency
- **CORE_REQUIREMENTS.md compliance** ensures long-term maintainability

### Standards

- Use `useRef` for synchronous operation guards in multi-step forms
- Always disable UI during async operations to prevent concurrency
- Implement field-level validation with immediate feedback
- Design components to support multiple rendering contexts
- Follow established error handling patterns with proper metadata

### Verification

- Manual testing confirmed no "Step is still running" errors with rapid clicks
- Both `/products` (modal) and `/products/create` (standalone) work identically
- SKU validation triggers on blur with proper visual feedback
- TypeScript compliance maintained with zero errors

---

## Error Handling Migration - Final Comprehensive Lessons Learned

**Date**: 2025-01-21 **Phase**: 2.9 - Error Handling Standardization
**Context**: Comprehensive migration from console.error to standardized
ErrorHandlingService across the entire application **Problem**: Inconsistent
error handling patterns across 44+ files created debugging difficulties, poor
observability, and security vulnerabilities **Solution**: Systematic migration
to ErrorHandlingService.getInstance().processError() with proper metadata and
error codes **Key Insights**:

### **Critical Lessons Learned**

1. **Scope Management is Critical**: Variables used in error metadata must be
   declared outside try blocks to avoid scope issues. This was a recurring
   pattern across multiple files.

2. **Error Code Validation**: Many ErrorCodes properties don't exist (e.g.,
   `OPERATION_FAILED`). Always use existing codes like `INTERNAL_ERROR`,
   `INITIALIZATION_FAILED`, etc.

3. **Infrastructure Quality Discovery**: The migration revealed excellent
   existing code quality - many components already had proper error handling
   infrastructure in place.

4. **Incremental Migration Success**: Migration can be done incrementally
   without breaking existing functionality, allowing for systematic improvement.

5. **Metadata Enrichment**: Proper error metadata (component, operation,
   context) dramatically improves debugging capabilities and observability.

6. **Pattern Consistency**: Error handling patterns should be consistent across
   all layers (API routes, components, hooks, utilities).

7. **Performance Impact**: Standardized error handling has minimal performance
   impact while providing significant debugging benefits.

8. **Code Quality Assessment**: The migration process served as a comprehensive
   code quality audit, revealing well-structured error handling in many areas.

### **Technical Patterns Discovered**

- **Singleton Pattern**: ErrorHandlingService.getInstance() provides consistent
  access across the application
- **Metadata Structure**: Component + operation + context provides comprehensive
  error tracking
- **Error Code Categorization**: SYSTEM, AUTH, DATA, ANALYTICS categories enable
  proper error classification
- **Scope Management**: Variable declaration outside try blocks prevents
  metadata access issues
- **Incremental Migration**: Phased approach allows systematic improvement
  without breaking changes

### **Prevention Standards**

- Always use ErrorHandlingService.getInstance().processError() instead of
  console.error
- Declare variables used in error metadata outside try blocks
- Use appropriate ErrorCodes from existing categories
- Include component and operation metadata for better debugging
- Maintain consistent error handling patterns across the entire application
- Follow established patterns from CORE_REQUIREMENTS.md

### **Impact Assessment**

- **Debugging**: Enhanced error tracking and debugging capabilities
- **Security**: Improved security through standardized error logging and
  tracking
- **Observability**: Better error categorization and metadata for monitoring
- **Maintainability**: Consistent error handling patterns across the codebase
- **Code Quality**: Discovered excellent existing infrastructure quality

### **Migration Statistics**

- **Total Files Migrated**: 33+ files across multiple phases
- **Console.error Reduction**: From 49 to 16 calls (67% reduction)
- **Remaining Calls**: Primarily in test utilities and logger infrastructure
  (appropriate to keep)
- **Coverage**: Complete coverage of API routes, React components, hooks,
  utility services, and performance utilities

### **Phase-by-Phase Progress**

- **Phase 1**: 10 critical API routes & middleware (44 → 41 files)
- **Phase 2**: 6 React components & test files (41 → 35 files)
- **Phase 3**: 9 remaining API routes & hooks (49 → 37 calls)
- **Phase 4**: 6 library utilities & performance services (37 → 22 calls)
- **Phase 5**: 4 performance utilities & service utilities (22 → 16 calls)

### **Remaining Work**

- **Service Utilities**: 2 remaining calls in userService.ts
- **Offline Utilities**: 8 calls in ServiceWorkerManager.ts (appropriate for
  offline functionality)
- **Test Utilities**: 2 calls in test-utils.tsx (appropriate for testing)
- **Logger Utilities**: 3 calls in logger infrastructure (appropriate for
  logging)

### **Future Considerations**

- Continue migration for remaining service utilities and offline components
- Establish automated linting rules to prevent console.error usage
- Implement error handling compliance checks in CI/CD pipeline
- Consider error handling patterns for new feature development
- Evaluate offline error handling patterns for ServiceWorkerManager

### **Quality Assurance**

- **TypeScript Compliance**: All migrations maintain 100% TypeScript compliance
- **Functionality Preservation**: No breaking changes or functionality loss
- **Performance Impact**: Minimal performance overhead with significant
  debugging benefits
- **Code Quality**: Improved consistency and maintainability across the codebase

**Related**: [Error Handling Standards][memory:error-handling],
[CORE_REQUIREMENTS.md][memory:core-requirements], [Singleton
Pattern][memory:singleton]

---

## Critical Fix: QueryClient Provider & React Query Mutations
