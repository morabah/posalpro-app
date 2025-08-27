# CORE REQUIREMENTS (Non-Negotiable)

## 🚨 **CRITICAL: COMPLETE ANALYSIS BEFORE IMPLEMENTATION** {#complete-analysis-before-implementation}

**🔍 MANDATORY: Analyze ALL Issues Before Any Implementation**

- **Step 1**: Identify ALL data mismatches, errors, and inconsistencies
- **Step 2**: Map the complete data flow from source to display
- **Step 3**: Identify ALL components, files, and layers affected
- **Step 4**: Plan comprehensive solution addressing ALL issues at once
- **Step 5**: Implement complete fix, not piece-by-piece solutions
- **NEVER**: Implement partial fixes or create test files to "verify" incomplete
  solutions

**📋 Analysis Checklist (MANDATORY)**

- [ ] Identify ALL data sources (API, database, cache, components)
- [ ] Map ALL data transformations and field mappings
- [ ] Identify ALL components reading/writing the data
- [ ] Check ALL related files (services, hooks, components, schemas)
- [ ] Verify ALL cache invalidation points
- [ ] Plan solution addressing ALL issues simultaneously

**❌ FORBIDDEN PRACTICES**

- Piece-by-piece fixes that create new problems
- Test files that don't actually fix real issues
- "Expected results" without actual implementation
- Partial solutions that require multiple iterations

## Priority Index (Phased Implementation Order)

1. **[Core Fundamentals](#core-fundamentals)**
   - [Error Handling & Type Safety](#-error-handling--type-safety)
   - [Duplicate Prevention & Established Patterns](#-duplicate-prevention--existing-patterns)
   - [Singleton Pattern (General Design Pattern)](#️-singleton-pattern-general-design-pattern)
2. **[Architecture & Providers](#architecture--providers)**
   - [Route-group Layout Provider Stack](#-route-group-layout-provider-stack)
   - [SSR/CSR Hydration Consistency](#️-ssrcsr-hydration-consistency-mandatory)
   - [Development Build Stability](#️-development-build-stability-chrome-fast-refresh--webpack)
3. **[Data & API](#data--api)**
   - [Data Fetching & Client Performance](#-data-fetching--performance-critical)
   - [API & Database Performance](#-api--database-performance)
   - [Database Transaction Patterns](#-database-transaction-patterns)
4. **[Security & Auth](#security--auth)**
   - [Authentication & Session Management](#-authentication--session-management)
   - [RBAC Authorization](#-rbac-authorization)
   - [Security State Storage Patterns](#-security-state-storage-patterns)
5. **[UI & Accessibility](#ui--accessibility)**
   - [Design System Usage](#️-design-system-usage-mandatory)
   - [Accessibility Standards](#️-wcag-21-aa-mandatory-accessibility-compliance)
6. **[Performance & Analytics](#performance--analytics)**
   - [Bundle Optimization](#-bundle-optimization)
   - [Analytics & Hypothesis Validation](#-analytics--hypothesis-validation)
7. **[Wizard & Memory Optimization](#wizard--memory-optimization)**
   - [Wizard Data Hydration](#️-wizard-data-hydration-multi-source-merge--mandatory)
   - [Memory Optimization](#-memory-optimization)
8. **[Documentation & Quality Gates](#documentation--quality-gates)**
   - [Documentation Updates](#-required-updates-update-documentation-after-implementation)
   - [Quality Gates](#-quality-gates-all-implementations-must-pass)
9. **[Deployment & Versioning](#deployment--versioning)**
   - [Deployment & Version Management](#-deployment--version-management)

## 🔧 **ERROR HANDLING & TYPE SAFETY** {#error-handling--type-safety}

**🛡️ Error Handling: Use standardized ErrorHandlingService system only**

- Import: ErrorHandlingService, StandardError, ErrorCodes, useErrorHandler
- Pattern: errorHandlingService.processError() in all catch blocks
- Never: Custom error handling - always use established infrastructure

**📝 TypeScript: Maintain 100% type safety (0 errors)**

- Verify: npm run type-check → 0 errors before any commit
- Use: Explicit interfaces, strict typing, no any types
- Standard: Follow DEVELOPMENT_STANDARDS.md patterns

## 🔍 **DUPLICATE PREVENTION & EXISTING PATTERNS** {#duplicate-prevention--existing-patterns}

**♻️ Check for Established Implementations First**

- Search: src/lib/services/, src/hooks/, src/components/
- Audit: `npm run audit:duplicates` before creating new files
- Matrix: Consult File Responsibility Matrix in DEVELOPMENT_STANDARDS.md
- Reuse: Don't recreate existing functionality
- Extend: Build upon current infrastructure

**📋 Critical Reference Documents (MANDATORY)**

- **TIER 1**: PROJECT_REFERENCE.md, WIREFRAME_INTEGRATION_GUIDE.md,
  DEVELOPMENT_STANDARDS.md
- **TIER 2**: USER_STORY_TRACEABILITY_MATRIX.md, COMPONENT_STRUCTURE.md,
  DATA_MODEL.md
- **TIER 3**: IMPLEMENTATION_LOG.md, VERSION_HISTORY.md, LESSONS_LEARNED.md
- **Full List**: docs/CRITICAL_REFERENCE_DOCUMENTS.md

## 🏗️ **ARCHITECTURE & PROVIDERS** {#architecture--providers}

### Modern Architecture Pattern (MANDATORY)

**🎯 New Architecture (Service Layer + React Query + Zustand)**

- **Purpose**: Decouple React UI components from backend APIs using a modern,
  type-safe service layer with React Query for data management and Zustand for
  UI state.
- **Location**: Implement service classes under `src/services/` and expose React
  Query hooks under `src/hooks/` (e.g., `useCustomers`, `useProducts`).
- **Shape**: Services MUST be implemented as stateless functions with:
  - Zod validation for all inputs/outputs
  - Standardized error handling with `ErrorHandlingService`
  - Structured logging with correlation IDs
  - RBAC enforcement at API boundaries
- **API Contract**:
  - Use Zod schemas for request/response validation
  - Return typed responses with proper error handling
  - Never return raw `any` — enforce strict interfaces
- **Error Handling & Logging**:
  - All service catch blocks MUST call `ErrorHandlingService.processError()` and
    then log using `logError`/`logInfo`/`logDebug` with metadata: `component`,
    `operation`, IDs (e.g., `proposalId`), and traceability (`userStory`,
    `hypothesis`).
  - Never use `console.*` in services or new production code.
- **Caching**:
  - Use React Query for all data caching and invalidation
  - Implement short-TTL caching (60-120s) for derived/aggregate endpoints only
  - Cache keys MUST include parameters and user/session context where
    appropriate
- **Analytics**:
  - Call `analytics.trackOptimized()` where meaningful, including `userStory`
    and `hypothesis` context
  - Track key interactions via mutation `onSuccess` callbacks

**🔄 Migration Compatibility (Bridge Pattern Legacy Support)**

For teams transitioning from Bridge Pattern, provide compatibility shims:

```typescript
// src/compat/{{domains}}/{{Domain}}Bridge.ts
// Wraps {{domain}}Service + hooks and re-exports with "Bridge" naming
export * from "@/services/{{domain}}Service";
export * from "@/hooks/use{{Domain}}s";
export * from "@/lib/store/{{domain}}Store";

// Legacy Bridge compatibility
export const {{Domain}}Bridge = {
  getInstance: () => {{domain}}Service,
  use{{Domain}}Bridge: () => ({
    ...use{{Domain}}s(),
    ...use{{Domain}}Store(),
  }),
};
```

This maintains backward compatibility while enabling modern architecture
adoption.

**📋 Bridge Pattern Templates (MANDATORY)**

**Use the comprehensive bridge templates for all new bridge implementations:**

- **Template Location**: `templates/design-patterns/bridge/`
- **Documentation**: `templates/design-patterns/bridge/README.md` - Complete
  architecture overview
- **Usage Guide**: `templates/design-patterns/bridge/USAGE_GUIDE.md` -
  Step-by-step implementation
- **Quick Reference**: `templates/design-patterns/bridge/BRIDGE_SUMMARY.md` -
  Implementation guide and benefits

**🔧 Template Implementation Workflow:**

```bash
# 1. Create API Bridge
cp templates/design-patterns/bridge/api-bridge.template.ts src/lib/bridges/CustomerApiBridge.ts

# 2. Create Management Bridge
cp templates/design-patterns/bridge/management-bridge.template.tsx src/components/bridges/CustomerManagementBridge.tsx

# 3. Create Bridge Hook (Optional)
cp templates/design-patterns/bridge/bridge-hook.template.ts src/hooks/useCustomer.ts

# 4. Create Bridge Component
cp templates/design-patterns/bridge/bridge-component.template.tsx src/components/CustomerList.tsx

# 5. Create Bridge Page
cp templates/design-patterns/bridge/bridge-page.template.tsx src/app/(dashboard)/customers/page.tsx

# Replace placeholders:
# __BRIDGE_NAME__ → CustomerManagement
# __ENTITY_TYPE__ → Customer
# __RESOURCE_NAME__ → customers
# __USER_STORY__ → US-3.1
# __HYPOTHESIS__ → H4
```

**🏗️ Bridge Architecture Flow:**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Components    │───▶│ Management       │───▶│   API Bridge    │
│                 │    │ Bridge           │    │                 │
│ - CustomerList  │    │ (React Context)  │    │ - CRUD Ops      │
│ - CustomerForm  │    │                  │    │ - Caching       │
│ - CustomerPage  │    │ - State Mgmt     │    │ - Error Handle  │
└─────────────────┘    │ - Event System   │    │ - Analytics     │
                       │ - Analytics      │    └─────────────────┘
                       └──────────────────┘             │
                                                        ▼
                                                ┌─────────────────┐
                                                │   API Routes    │
                                                │                 │
                                                │ - /customers    │
                                                │ - /products     │
                                                │ - /proposals    │
                                                └─────────────────┘
```

**🎯 Template Features:**

- **✅ Production-Ready**: 2,000+ lines of production-ready code with full
  CORE_REQUIREMENTS.md compliance
- **✅ Type Safety**: 50+ TypeScript interfaces for complete type safety
- **✅ Performance**: Request deduplication, intelligent caching, and
  optimization
- **✅ Error Handling**: Full ErrorHandlingService integration throughout
- **✅ Analytics**: Component Traceability Matrix with hypothesis tracking
- **✅ Accessibility**: WCAG 2.1 AA compliance with 44px touch targets
- **✅ Mobile Optimization**: Touch-optimized components with proper gesture
  handling

**📚 Template Documentation:**

- **README.md**: Complete bridge architecture overview and benefits
- **USAGE_GUIDE.md**: Step-by-step implementation with real examples
- **BRIDGE_SUMMARY.md**: Implementation guide and benefits summary
- **api-bridge.template.ts**: Singleton API service with caching and error
  handling
- **management-bridge.template.tsx**: React context provider with state
  management
- **bridge-hook.template.ts**: React Query integration hooks
- **bridge-component.template.tsx**: Complete CRUD component implementation
- **bridge-page.template.tsx**: Full page with SSR optimization
- **bridge-types.template.ts**: Comprehensive TypeScript interfaces

**When to create a Bridge vs. using existing hooks**

- **Create a Bridge when**: a logical service is used by multiple
  pages/components, when advanced caching/invalidation or complex translation is
  needed, or when you need a stable service API for both UI and non-UI consumers
  (e.g., background jobs, CLI).
- **Prefer existing `useX` hooks** under `src/hooks` for simple, single-consumer
  logic.

**Provider Hierarchy & Modern Architecture (CRITICAL)**

- Modern architecture hooks rely on a specific provider stack order. **Ensure
  the route-group layout includes required providers in the correct order**.
- Required order in `(dashboard)/layout.tsx`:
  - `TTFBOptimizationProvider` → `WebVitalsProvider` → `SharedAnalyticsProvider`
    → `ClientLayoutWrapper` → `QueryProvider` → `ToastProvider` → `AuthProvider`
    → `ProtectedLayout`.
- **Zustand for UI State**: No provider required for Zustand stores, but if
  legacy hooks assume a context, add a tiny wrapper or refactor those hooks.
- **Analytics**: Export a small analytics client and add its provider if needed.
- Missing providers are migration blockers (see LESSONS_LEARNED.md: Provider
  Stack Issues).

**Modern Architecture Implementation Checklist (Pre-Implementation, MANDATORY)**

- [ ] **Use Service Layer Pattern**: Create services under `src/services/` with
      Zod validation
- [ ] **Create React Query Hooks**: Implement hooks under `src/hooks/` with
      proper caching and invalidation
- [ ] **Implement Zustand Store**: Create UI state stores under `src/lib/store/`
      with shallow subscriptions
- [ ] `npm run type-check` → 0 errors
- [ ] `npm run audit:duplicates` → no duplicate functionality with existing
      services/hooks
- [ ] Confirm existing patterns in `src/services`, `src/hooks`, `src/components`
      and reuse before creating new implementations
- [ ] Design the service API with explicit TypeScript interfaces and Zod schemas
      for requests/responses
- [ ] Implement stateless service functions with proper error handling
- [ ] Ensure `ErrorHandlingService` + `ErrorCodes` usage in all catch blocks
- [ ] Add structured logs using `logDebug` / `logInfo` / `logError` including
      traceability metadata
- [ ] Add unit tests and a small integration test using `npm run app:cli` for
      critical RBAC flows
- [ ] Update `docs/IMPLEMENTATION_LOG.md` and add a short entry to
      `docs/LESSONS_LEARNED.md` if the migration required layout/provider
      changes
- [ ] **Verify Architecture Compliance**: Ensure all modern patterns are
      properly implemented

**API Route & RBAC Requirements for Modern Architecture**

- All server-side endpoints that are sensitive MUST call
  `validateApiPermission({ resource, action, scope?, context? })` at the top of
  handlers.
- Services must map to existing, RESTful endpoints. If an endpoint does not
  exist, update the service to call the correct endpoint or add the server
  route; do not invent new client-side-only endpoints.
- Use the standardized route wrapper (`createRoute`) for all API routes to
  ensure consistent logging, error handling, and RBAC enforcement.

**Quality & Compliance**

- Every service addition or refactor must pass the standard quality gates
  (build, type-check, audit duplicates, lints, and basic smoke tests). Document
  the change in `PROJECT_REFERENCE.md` if a new public API or route is added.
- **Architecture Compliance**: All services must follow the modern architecture
  patterns for consistency and maintainability.

---

### ⚡ **DATA FETCHING & PERFORMANCE (CRITICAL)** {#data-fetching--performance-critical}

**🚀 MANDATORY: React Query for complex data fetching, useApiClient for simple
cases**

- **Complex Data (lists, caching, mutations)**: Use React Query hooks
  (`useQuery`, `useMutation`) under `QueryProvider`
- **Simple Data (one-time fetches)**: Use `useApiClient` pattern with
  `useEffect`
- **Pattern**: Follow `useProposals.ts` and `useProducts.ts` as gold standards
  for React Query implementation
- **Never**: Custom caching systems, direct fetch() calls, complex manual
  loading states
- Reference: [Lesson #12 in LESSONS_LEARNED.md][memory:3929430536446174589]

**📊 Analytics Integration (MANDATORY)**

- **Analytics Client**: Provide a thin analytics adapter for tracking:
  ```typescript
  // src/lib/analytics/index.ts
  export const analytics = {
    trackOptimized: (event: string, props?: Record<string, unknown>) => {
      // route to your analytics (PostHog, Amplitude, etc.)
    },
  };
  ```
- **Usage**: Call `analytics.trackOptimized()` inside UI handlers
  (create/update/delete success) or in mutation `onSuccess` callbacks
- **Context**: Include `userStory`, `hypothesis`, and other traceability
  metadata

**⚡ List View Performance Optimization (CRITICAL)**

- **Minimal Field Selection**: Always use `fields` parameter to request only
  needed columns
- **Disable Relation Hydration**: Set `includeCustomer=false&includeTeam=false`
  for initial loads
- **Use Denormalized Fields**: Prefer `customerName`, `creatorName` over
  hydrated relations
- **Optimized Page Size**: Use 30-50 items per page (not 100+) for faster TTFB
- **Cursor Pagination**: Use `limit+1` pattern with `nextCursor` for large
  datasets
- **Client-Side Mapping**: Transform API data to UI format with fallbacks, not
  server-side

**📋 List View Optimization Checklist:**

```typescript
// ✅ CORRECT: Optimized list fetching pattern
const endpoint = `/entities?limit=30&sortBy=updatedAt&sortOrder=desc&includeCustomer=false&includeTeam=false&fields=id,title,status,priority,createdAt,updatedAt,dueDate,value,tags,customerName,creatorName`;

// ✅ CORRECT: Client-side transformation with fallbacks
const transformedData = apiData.map(item => ({
  id: String(item.id || ''),
  title: String(item.title || ''),
  client: item.customerName || 'Unknown Client',
  status: mapApiStatusToUIStatus(String(item.status || 'draft')),
  // ... other fields with fallbacks
}));

// ❌ FORBIDDEN: Heavy initial loads
const endpoint = `/entities?limit=100&includeCustomer=true&includeTeam=true&fields=id,title,status,priority,createdAt,updatedAt,dueDate,value,tags,customer,customer(id,name,industry),assignedTo(id,name,role),creator(id,name,email)`;
```

**⚡ Proven Performance Patterns:**

**React Query Pattern (for lists, caching, mutations):**

```typescript
// Hook implementation
export function useProposals(params: ProposalsQueryParams = {}) {
  const apiClient = useApiClient();
  return useQuery({
    queryKey: PROPOSALS_QUERY_KEYS.list(params),
    queryFn: async () => {
      const response = await apiClient.get(`/proposals?${searchParams}`);
      return extractProposalsResponse(response);
    },
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// Component usage
const { data, isLoading, error, refetch } = useProposals({
  page,
  limit: 20,
  ...filters,
});
```

**Simple useApiClient Pattern (for one-time fetches):**

```typescript
const apiClient = useApiClient();
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/customers');
      if (response.success) {
        setCustomers(response.data);
      }
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

**🚫 FORBIDDEN Data Fetching Patterns:**

- Custom caching with localStorage/memory maps (use React Query caching)
- Direct `fetch()` calls or `axios` usage (use `useApiClient` or React Query)
- Manual loading state management when React Query can handle it
- Multiple useEffect dependencies causing re-fetches (use React Query
  dependencies)
- Client-side filtering of large datasets (use server-side filtering with query
  params)
- Nested API calls in render loops
- Using `useApiClient` for complex data that needs caching/invalidation (use
  React Query)
- Manual pagination state when React Query can manage it
- Requesting 100+ items with full relation hydration
- Server-side UI transformation: Complex data mapping on server instead of
  client
- Over-fetching relations: Including `includeCustomer=true&includeTeam=true` for
  list views
- Large page sizes: Using `limit=100+` instead of 30-50 for initial loads

### 🖼️ Image Optimization (Mandatory)

- Use Next.js Image for all UI images. Replace `<img>` with `<Image />` and
  provide `sizes`/`fill` or explicit `width`/`height` to improve LCP/CLS.
- Do not introduce custom image loaders unless required. Follow Next.js
  defaults.
- Audit UI for `<img>` occurrences during cleanup and migrate them.

## 🔐 **SECURITY & AUTH** {#security--auth}

### 🔐 **AUTH & SESSION MANAGEMENT (MANDATORY UPDATES)** {#authentication--session-management}

**✅ Unified Auth Context Usage**

- Always import `useAuth` from `@/components/providers/AuthProvider`.
- Never import from `@/hooks/auth/useAuth` (deprecated). This prevents duplicate
  `/api/auth/session` fetches and stabilizes dashboard components like
  `RecentProposals`.

**⚙️ Session Provider Configuration**

- Configure `SessionProvider` with `refetchOnWindowFocus=false` and
  `refetchInterval=600` (10 minutes) to avoid chatty session polling.
- Remove any `<link rel="preload" href="/api/auth/session">` or other eager
  session preloads.

**🧪 Dev-Only Session Burst Smoothing**

- Implement an ultra-short TTL (≈2s) throttle around session building inside
  `callbacks.session` in development only.
- Must not change production behavior. Use in-memory cache; key includes user
  identifier. This mechanism is strictly forbidden in production builds and must
  be gated by `NODE_ENV === 'development'` (or an explicit feature flag).

**🧰 React Query Caching (Production Ready)**

- Use React Query's built-in caching with `staleTime: 30000` (30s) and
  `gcTime: 120000` (2min)
- Configure `refetchOnWindowFocus: false` and `retry: 1` for optimal UX
- Implement proper query keys with parameters for cache invalidation
- Never use Service Worker caching for API data - React Query handles this
  efficiently

**🧰 Redis Usage Policy**

- Disable Redis in development to avoid startup/connect delays; use in-memory
  fallback with conservative timeouts (e.g., `connectTimeout=3000ms`).

## 🔄 **REACT QUERY PATTERNS (MANDATORY)**

**🚀 React Query Implementation Standards**

Follow these patterns for all complex data fetching (lists, forms, mutations):

**📋 Query Hook Structure:**

```typescript
// Query Keys - Hierarchical and parameterized
export const PROPOSALS_QUERY_KEYS = {
  all: ['proposals'] as const,
  lists: () => [...PROPOSALS_QUERY_KEYS.all, 'list'] as const,
  list: (params: ProposalsQueryParams) =>
    [...PROPOSALS_QUERY_KEYS.lists(), params] as const,
  details: () => [...PROPOSALS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PROPOSALS_QUERY_KEYS.details(), id] as const,
  stats: () => [...PROPOSALS_QUERY_KEYS.all, 'stats'] as const,
};

// Hook Implementation
export function useProposals(params: ProposalsQueryParams = {}) {
  const apiClient = useApiClient();
  return useQuery({
    queryKey: PROPOSALS_QUERY_KEYS.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      // Add params to searchParams...
      const response = await apiClient.get(`/proposals?${searchParams}`);
      return extractProposalsResponse(response);
    },
    staleTime: 30000, // 30s - data considered fresh
    gcTime: 120000, // 2min - cache garbage collection
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
```

**⚙️ Configuration Standards:**

- **staleTime**: 30 seconds for list data, 5 minutes for static data
- **gcTime**: 2 minutes for lists, 5 minutes for details
- **refetchOnWindowFocus**: false (avoid unnecessary refetches)
- **retry**: 1 (single retry on failure)

**🔑 Query Key Patterns:**

- Hierarchical: `['resource', 'type', params]`
- Parameterized: Include all query parameters that affect results
- Consistent: Use factory pattern for maintainability
- **Stable Keys**: Avoid putting raw params objects in keys (identity changes
  cause extra refetches). Normalize to primitives:
  ```typescript
  export const customerKeys = {
    all: ['customers'] as const,
    list: (search: string, limit: number, sortBy: string, sortOrder: string) =>
      ['customers', 'list', search, limit, sortBy, sortOrder] as const,
    byId: (id: string) => ['customers', 'byId', id] as const,
  };
  ```

**🎯 When to Use React Query vs useApiClient:**

- **React Query**: Lists, forms, mutations, any data needing
  caching/invalidation
- **useApiClient**: Simple one-time fetches, fire-and-forget operations

**📊 Pagination & Search Patterns:**

```typescript
// Debounced search with server-side filtering
const [debouncedSearch] = useDebounce(search, 300);
const { data, isLoading } = useProposals({
  page,
  limit: 20,
  search: debouncedSearch,
  status: filters.status,
  sortBy: sort.key,
  sortOrder: sort.direction,
});

// Cursor-based pagination for large datasets
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: PROPOSALS_QUERY_KEYS.list(params),
  queryFn: ({ pageParam = null }) =>
    fetchProposals({ cursor: pageParam, ...params }),
  getNextPageParam: lastPage => lastPage.nextCursor,
});

// Bulk operations (avoid API spam)
export function useDeleteCustomersBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => customerService.deleteBulk(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}
```

**🚫 React Query Anti-Patterns:**

- Don't use React Query for simple one-time fetches
- Don't bypass query keys - always use the factory pattern
- Don't set staleTime to 0 unless data must be real-time
- Don't use enabled: false without clear UX reasoning
- Don't mix React Query with manual loading states
- Don't loop `mutate(id)` for N items - use bulk endpoints and hooks
- Don't use `getState()` in render paths - use selectors with shallow comparison

## 🧠 **WIZARD & MEMORY OPTIMIZATION (MANDATORY)**

**🎯 ProposalWizard Memory Target**

- Create page should target <200MB used JS heap in development after first
  paint.
- Production guideline: typical pages <120MB; heavy workflows (e.g., wizard)
  <180MB after first interaction. Validate with automated scripts.

**🏗️ State Management Rules**

- Use step-local state for non-shared values; avoid top-level generic buckets
  for `stepData`, `validationErrors`, `stepProgress`.
- Lazy initialize wizard steps (only step 1 fully initialized on mount; steps
  2–6 created on demand).
- Disable periodic memory monitoring for the wizard unless debugging (set
  cleanup interval to 0 by default).
- Gate memory logs behind `NEXT_PUBLIC_ENABLE_MEMORY_LOGS === 'true'`.
- Fix intervals with `clearInterval` when using `setInterval`.

**📥 Deferred Data Fetching (Forms)**

- Defer heavy list fetches until user intent (e.g., `onFocus` of customer
  select) and request small pages by default (e.g., `limit=10`, `sort=name`).
- Do not use mock data in UI paths; always fetch from database via React Query
  hooks or `useApiClient`.
- Implement debounced search with 300ms delay to reduce API calls.
- Use server-side filtering and sorting via query parameters instead of
  client-side processing.

### 🪝 Hook Dependency Policy (Wizard & High-Frequency Components)

- Mount-only effects: For initialization/cleanup that must run once (e.g.,
  memory timers, initial hydration), use an empty dependency array `[]` with a
  targeted ESLint disable comment on the line to document intent.
- Timers/listeners: Keep callback references stable with `useCallback` and
  prefer empty dependency arrays when behavior must not change across renders;
  document with an ESLint disable on that line.
- Do not include unstable objects/functions (e.g., apiClient instances,
  analytics handlers) in dependency arrays when it causes infinite loops or
  re-initialization. Instead, hoist guards or document mount-only semantics.
- Always clear `setTimeout`/`setInterval` using refs in cleanup paths.

### 🔧 Rendering Hygiene (Hot Paths)

- Remove redundant optional chaining and always-true/always-false conditionals
  in frequently rendered sections (e.g., ProposalWizard mapping/validation
  blocks).
- Avoid unsafe spreads that create new arrays in render paths. Prefer
  `Array.from({ length: n })` over `[...Array(n)]` for skeletons.

### 🔑 Stable React Keys (Mandatory)

- Prefer stable database IDs for list `key` props (e.g., `entity.id`).
- When no single stable ID exists, use a deterministic composite key (e.g.,
  `${aId}-${bId}`).
- As a last-resort fallback only, use index-based keys (e.g., `item-${index}`),
  and never for sortable/reorderable lists.
- Never use time/locale/random values to build keys in SSR or CSR.

### ♻️ SSR/CSR Hydration Consistency (Mandatory)

- Client Components must render the same structural HTML on the server and
  client.
- Do not return a different wrapper on the client (e.g., `<nav>` client vs
  `<div>` server) for shared UI like headers/breadcrumbs.
- Always render a stable wrapper for navigation scaffolding (e.g., breadcrumbs)
  and only change inner content after mount.
- Ensure all render branches (loading, unauthenticated, success, error) include
  the same header/breadcrumb block to prevent wrapper swaps during hydration.
- Never use time/locale/random values during SSR that would differ on the client
  for elements that affect structure.
- Prefer explicit breadcrumb items during SSR for dynamic routes; avoid
  path-dependent branching that yields different trees.
- **Keep shared wrappers (headers/breadcrumbs) identical across
  loading/error/success**. Our list component templates do this; ensure your
  pages keep the same scaffolding.

### 🧩 Development Build Stability (Chrome Fast Refresh / Webpack)

- In development, prevent stale chunks and Chrome-only Fast Refresh errors
  (e.g., `TypeError: Cannot read properties of undefined (reading 'call')`) by
  applying these settings in `next.config.js`:
  - Do not optimize React packages with `experimental.optimizePackageImports`.
    Keep only non-React packages (e.g.,
    `'@prisma/client','next-auth','lucide-react'`).
  - Disable persistent webpack cache in dev: `config.cache = false;` and clear
    `snapshot.managedPaths`/`immutablePaths`.
  - Reduce hashing volatility in dev:
    `config.optimization.realContentHash = false;`.
  - Add dev-only no-store cache headers for static chunks:
    `source: '/_next/static/(.*)' -> Cache-Control: 'no-store, must-revalidate'`.
- Run with the project command (`npm run dev:smart`). If needed, temporarily
  disable Fast Refresh: `FAST_REFRESH=false npm run dev:smart`.
- After config changes, hard refresh the browser (or empty caches) to purge
  stale modules.

Required patterns (example):

```tsx
// ✅ Stable Breadcrumbs wrapper across SSR/CSR
export function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; href: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb navigation">
      <ol>
        {items.map(it => (
          <li key={it.href}>
            <a href={it.href}>{it.label}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ✅ Settings page renders the same header in all branches
function SettingsPage() {
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
      {/* main content */}
    </div>
  );
}
```

Forbidden:

- ❌ Server returns `null` or `<div>` while client renders `<nav>` for the same
  component
- ❌ Conditional wrapper based on `typeof window !== 'undefined'` that changes
  structure
- ❌ Using `Date.now()`/`Math.random()`/locale formatting to build keys or
  structure during SSR

Route-group layout session (auth) requirements:

- App Router route-group layouts that depend on session must pass the server
  session into the client provider to avoid client-side loading stalls.
- Use `getServerSession(authOptions)` in `(dashboard)/layout.tsx` and pass to
  `AuthProvider`.
- When the layout response depends on per-request session, set
  `export const dynamic = 'force-dynamic'` to prevent stale SSR caches that can
  cause hydration drift.

### 🔁 Wizard Data Hydration (Multi-Source Merge – Mandatory)

- Hydrate step data using a defensive, non-destructive merge across known
  sources in this priority order:
  1. `proposal.metadata.*` (latest canonical shape)
  2. top-level fields (e.g., `proposal.teamAssignments`)
  3. `proposal.wizardData.stepN` (historic fallback)
- Never overwrite a populated nested object with an empty object during
  hydration.
- For nested RHF objects (e.g., `subjectMatterExperts`), set both the full
  object and each nested path to ensure field registration.
- Ensure Select option sets include any pre-selected ids so values render
  immediately while labels resolve after lists load.

### 💾 Wizard Persistence & Retrieval Contract (Generalized – Mandatory)

To guarantee edits persist and reload correctly across create/edit:

1. PATCH Payload Requirements

- Mirror snapshots under both roots per step:
  - `metadata.wizardData.stepN.*` (canonical snapshot for hydration) and
  - `wizardData.stepN.*` (legacy fallback).
- Include top-level scalars where API expects them (e.g., `priority`,
  `customerId`, `title`, `description`, `dueDate`, `estimatedValue`).
  - Map enums to backend enum casing (often UPPERCASE) at top-level; keep UI
    values normalized (e.g., lowercase) inside `metadata.wizardData`.
- Relations:
  - Products: use real `product.id` as `productId`; include `quantity`,
    `unitPrice` and mirror list under `metadata.wizardData.step4.products`.
  - Content selections: persist at metadata root as structured entries; mirror
    within step if step-local UIs require it.
- Deep-merge by step when patching metadata; never replace the whole tree.

2. GET/Hydration Requirements

- Unwrap Prisma-style update wrappers: if metadata is `{ set: ... }`, use
  `.set`.
- Merge order per step (non-destructive):
  1. `metadata.wizardData.stepN`
  2. top-level convenience fields (e.g., `proposal.priority`, relations)
  3. `wizardData.stepN` (legacy)
  4. derived defaults (normalized title/ids, inferred assignments)
- Normalize consistently:
  - Priority: coerce to `ProposalPriority` ('high' | 'medium' | 'low') for UI;
    convert to backend enum casing on PATCH.
  - IDs: validate existence; drop unknowns; ensure `productId === product.id`.
- Only fill missing keys; never overwrite explicit user values.

3. Logging & Validation

- Log counts and key sets (not full payloads) to reduce noise/PII.
- Validate referenced IDs on the server; drop stale client entries.
- Add unit tests for hydration and persistence round-trips per step.

### 🚫 Do-Not (Persistence Pitfalls)

- Do not rely on a single source (only metadata or only relations). Always merge
  across metadata, top-level, legacy `wizardData`, and derived defaults.
- Do not overwrite nested `metadata.wizardData` objects; deep-merge per step.
- Do not send UI-cased enums to backend; map to backend enum casing for scalars.
- Do not use SKU/display names as IDs; use database ids.
- Do not assume raw metadata; unwrap `{ set: ... }` before hydration.
- Do not log entire PATCH bodies or metadata; log shapes/sizes only.

### ⛔ Deprecated (Removed) Strategies

- Persisting only `wizardData.stepN` without mirroring under
  `metadata.wizardData`.
- Hydrating from a single path (e.g., only metadata or only top-level); replaced
  by multi-source merge.
- Replacing entire `metadata` on PATCH; replaced by per-step deep merges.

## 🗃️ **API & DATABASE PERFORMANCE (MANDATORY)**

**🔎 Selective Hydration**

- Default selects must use minimal, lightweight columns when no `fields` param
  is provided (see `getPrismaSelect`).
- Avoid fetching full relations by default. Opt-in via explicit query params.
- Maintain a documented per-entity minimal field whitelist for default selects.
  Any relation expansion must be explicitly requested via query parameters.

**🧮 Single‑Query Resolution (General Rule – N+1 Elimination)**

- Prefer a single round‑trip that returns all user‑visible labels and related
  fields needed by the UI.
- Techniques:
  - Set‑based queries that join once (e.g., LEFT JOIN `users` to include
    `createdByName`).
  - Resolve many related names via one
    `findMany({ where: { id: { in: [...] } } })` rather than per‑id queries.
  - For complex aggregations or array containment, use parameterized `$queryRaw`
    guarded by Zod validation.
  - Use a single `$transaction` only when multiple statements must be
    consistent; otherwise prefer one query.
- Response contract:
  - Include compact lookup maps in responses (e.g., `usersMap`, `productsMap`,
    `customersMap`) so clients do not refetch names.
  - UIs must render from these maps and only fall back to ad‑hoc lookups on rare
    cache‑miss cases.
- Indexing: add/verify indexes on join keys and array fields (e.g., GIN on
  `productIds`).
- Examples:
  - Version history list: one query with LEFT JOIN `users` to return
    `createdByName`.
  - Version detail: one query that returns diff plus `productsMap` and
    `customerName`.
- Never: issue a second network call only to resolve display names after
  fetching IDs.
- Always combine selective hydration with single‑query resolution to keep
  payloads minimal.

**📄 Pagination Without COUNT(\*)**

- Use `limit + 1` pattern to infer `hasMore` instead of `COUNT(*)` for offset
  pagination on large tables.

**📋 List View Performance Standards:**

- **Initial Load**: 30-50 items maximum with minimal fields
- **Pagination**: Cursor-based with `nextCursor` for large datasets
- **Field Selection**: Always use `fields` parameter with minimal columns
- **Relation Hydration**: Disabled for list views
  (`includeCustomer=false&includeTeam=false`)
- **Client Transformation**: Map API data to UI format with defensive fallbacks
- **Loading States**: Single loading state per interaction (no parallel
  requests)
- **Error Handling**: Graceful fallbacks for missing data (e.g.,
  `'Unknown Client'`)

**▶ Cursor-Based Pagination & Load‑More Policy (Client Lists)**

- Default for user-facing long lists (history, activity feeds, proposal lists):
  - Limit: 50 items per page
  - Response must include:
    - `pagination.limit`
    - `pagination.hasNextPage`
    - `pagination.nextCursor: { cursorCreatedAt: ISOString; cursorId: string } | null`
  - Sort order: stable two-key ordering (e.g., `createdAt DESC, id DESC`) to
    avoid cursor drift
- Server behavior:
  - Prefer cursor filters over offset for large/append-only datasets
  - Continue to use the `limit+1` technique internally to set `hasNextPage`
- Client behavior:
  - First paint: fetch one page (50) only
  - Subsequent fetches: use `nextCursor` with a single “Load More” interaction
    (no parallel page fetches)
  - Do not fetch auxiliary stats in parallel if they can be derived locally or
    are non-critical

**⏱ Short‑TTL Caching for Derived/History Endpoints**

- Scope: History/versions, dashboard snapshots, and non-sensitive aggregates
- TTL guidance:
  - Response headers: `Cache-Control: public, max-age=60, s-maxage=180`
  - Server cache (in‑memory/Redis): 60–120s
- Requirements:
  - Cache key must include user/session identifier where appropriate and full
    query parameters
  - Caching must be transparent (never serve stale sensitive data)
  - Silent cache failures (no user impact)
- **Implementation**: Add Cache-Control headers and optional in-memory/Redis
  60–120s cache for dashboards/history endpoints. Keep auth-scoped keys. Not
  required for CRUD list/detail routes; do it only where the doc asks.

**✅ Single‑Request Per Interaction (List Views)**

- Each user interaction (initial load or clicking “Load More”) must trigger at
  most one request
- Avoid N+1 follow‑ups for titles/names: include denormalized labels or compact
  lookup maps in the response
- Align with Selective Hydration and Single‑Query Resolution rules above

**🧭 When to Apply (Decision Matrix)**

- Use cursor pagination + short‑TTL caching when ALL apply:
  - The list can exceed 100 items over time OR contains heavy computed
    fields/joins
  - UX tolerates eventual consistency (≤3 minutes) for history/analytics
    snapshots
  - Items are primarily appended (e.g., versions, logs, recent proposals)
- Use offset pagination without COUNT(\*) when:
  - Dataset is small/moderate and strict ordering is simple
  - Backward compatibility requires page/limit semantics
- Do NOT cache when:
  - Data is sensitive to second‑level staleness (e.g., security state, critical
    auth/session)
  - User‑specific privacy constraints prevent shared caching

Implementation checklist (server):

- [ ] Validate and coerce `limit` (max 200; default 50)
- [ ] Implement stable ordering and cursor filter (timestamp + tie-break id)
- [ ] Return `pagination.hasNextPage` and `pagination.nextCursor`
- [ ] Add short‑TTL caching for derived/history endpoints

Implementation checklist (client):

- [ ] Fetch 50 on mount; render immediately
- [ ] Show “Load More” using `nextCursor`; one network call per click
- [ ] Do not issue auxiliary list/stat requests if not essential to the view

**🔐 Authentication Query Optimization**

- Lower bcrypt salt rounds in development to 6 (production remains strong, e.g.,
  12).
- Avoid `prisma.$transaction` for single reads in auth flows.
- Make `updateLastLogin` non-blocking (fire-and-forget) in the authorize flow.
- Add lightweight in-memory caching for session/provider discovery endpoints.
- Production security policy: enforce secure cookies (`__Secure-` names,
  `secure: true`, `sameSite: 'lax'|'strict'`) and bcrypt cost >= 12. Add CI
  assertions to ensure production envs use hardened settings.

## 🧪 **PERFORMANCE TESTING & DEV-MODE SKEW**

**🔥 Warm-Up Requirement**

- Performance scripts must warm key routes (`/`, `/auth/login`, `/dashboard`,
  `/proposals/manage`, `/proposals/create`) before measurements to avoid dev
  compile-time skew.
- Official benchmarking must also be validated on a production build profile
  (`next build && next start`) to confirm prod-representative metrics.

**🧭 Robust Element Detection**

- Test selectors should prefer `data-testid`, with fallbacks to semantic
  headings when necessary. Ensure components like `RecentProposals` expose
  `data-testid` consistently.
- All critical cards/widgets and wizard steps must expose `data-testid`
  attributes.

## 📱 **MOBILE TOUCH INTERACTIONS (CRITICAL)**

**🎯 Touch Event Conflict Prevention: Mandatory for touch + form components**

- Pattern: Smart event target filtering with interactive element detection
- Code: Skip gesture handling if touching input/select/textarea/button elements
- Forms: Use stopPropagation() + visual feedback in all form components
- Testing: Single-tap field access verified on mobile devices

## ⚡ **PERFORMANCE & ANALYTICS**

**📊 Component Traceability Matrix: Map all implementations**

- Required: User stories, acceptance criteria, hypotheses, test cases
- Analytics: useAnalytics() with hypothesis validation tracking
- Performance: Web Vitals monitoring with usePerformanceOptimization()

**🚀 Optimization: Use existing performance infrastructure**

- Data Fetching (Client): React Query for complex data (lists, forms, mutations)
  with built-in caching. Use useApiClient only for simple one-time fetches. Do
  not introduce custom client-side caches.
- Data Access (Server/API routes/RSC): use direct data access (Prisma/fetch)
  with the same validation and error-handling standards.
- Database: DatabaseQueryOptimizer for all queries.
- Bundle: Lazy loading with BundleOptimizer.
- Caching:
  - Client: Use React Query's built-in caching for complex data. Use apiClient
    for simple fetches only (no custom client caches or localStorage caches).
  - Server/API routes: Allowed to use targeted in-memory caches with short TTLs
    and explicit invalidation where appropriate (e.g., dashboard stats,
    proposals list, auth providers/session in dev). Never cache sensitive data
    improperly.

### 🧾 **Logging & Observability (Mandatory)**

Structured logging is REQUIRED for all new files and refactors. Do not use
`console.*` in product code.

- Import convenience functions from `@/lib/logger`:
  - `logDebug(message, meta?)`
  - `logInfo(message, meta?)`
  - `logWarn(message, meta?)`
  - `logError(message, meta?)`
- Minimum logging coverage:
  - Fetch/Query: `logDebug('Fetch start', { component, operation, keys })`,
    `logInfo('Fetch success', { loadTime })`,
    `logError('Fetch failed', { error })`
  - Mutation/Update: `logDebug('Update start', { payloadKeys })`,
    `logInfo('Update success')`, `logError('Update failed', { error })`
  - Critical UI actions/navigation: `logInfo('Action', { target, context })`
- Metadata: include component name, operation, identifiers (e.g., `proposalId`,
  `customerId`), and traceability fields (`userStory`, `hypothesis`) when
  available
- Pair logs with standardized error handling: log after
  `ErrorHandlingService.processError()` in catch paths
- Environments: verbose `debug` in development; keep `info/warn/error`
  meaningful in production

Compliance gate: Missing structured logs in new/modified files is non‑compliant.

## ♿ **ACCESSIBILITY & UI STANDARDS**

**🎨 Wireframe Compliance: Reference wireframe documents for all UI**

- Path: front end structure/wireframes/[SCREEN_NAME].md
- Pattern: Follow WIREFRAME_INTEGRATION_GUIDE.md
- Consistency: Apply WIREFRAME_CONSISTENCY_REVIEW.md standards

## 🎨 **UI & ACCESSIBILITY** {#ui--accessibility}

### 🧩 Design System Usage (Mandatory) {#️-design-system-usage-mandatory}

- **Design System Location**: `src/design-system/` - Centralized design tokens
  and components
- **Components**: Always use existing design system components from
  `src/components/ui` and tokens from `src/design-system`.
- **Tokens**: Import from `src/design-system/tokens.ts` for colors, spacing,
  typography, shadows
- **Singleton Pattern**: Use singleton pattern for design system services and
  shared utilities
- **Do not handcraft UI** with raw `div` + Tailwind for components that already
  exist in the library.

## 🏗️ **CORE FUNDAMENTALS** {#core-fundamentals}

### 🏗️ Singleton Pattern (General Design Pattern) {#️-singleton-pattern-general-design-pattern}

- **Purpose**: Ensure a class has only one instance throughout the application
  lifecycle
- **Global Access**: Provide a global access point to that single instance
- **Lazy Initialization**: Create the instance only when first needed
- **Thread Safety**: Ensure safe access in multi-threaded environments

#### **Pattern Implementation**:

```typescript
// ✅ Correct: General Singleton pattern
class ServiceName {
  private static instance: ServiceName;
  private constructor() {}

  static getInstance(): ServiceName {
    if (!ServiceName.instance) {
      ServiceName.instance = new ServiceName();
    }
    return ServiceName.instance;
  }

  // Service methods
  method1() {
    /* ... */
  }
  method2() {
    /* ... */
  }
}

// Usage - always returns the same instance
const service1 = ServiceName.getInstance();
const service2 = ServiceName.getInstance();
console.log(service1 === service2); // true - same instance!
```

#### **Key Components**:

1. **Private Static Instance**: Holds the single instance
2. **Private Constructor**: Prevents direct instantiation
3. **Public Static getInstance()**: Provides global access point
4. **Lazy Initialization**: Creates instance only when first accessed

#### **Benefits**:

- **Memory Efficiency**: Only one instance exists
- **Consistency**: Same state/behavior across the application
- **Global Access**: Easy to access from anywhere
- **Lazy Loading**: Created only when needed
- **Thread Safety**: Safe in concurrent environments

#### **Use Cases**:

- **Service Classes**: Design system services, analytics services, error
  handling services
- **Configuration Managers**: App configuration, environment settings
- **Cache Managers**: Global caching, session management
- **Database Connections**: Connection pooling, ORM instances
- **Logging Services**: Centralized logging, audit trails
- **State Managers**: Global state, application state
- **Utility Services**: Validation services, formatting services

#### **When to Use**:

- ✅ **Shared Resources**: Services that need to be shared globally
- ✅ **Stateful Services**: Services that maintain state across the app
- ✅ **Expensive Operations**: Services that are expensive to create
- ✅ **Configuration**: Global configuration that shouldn't be duplicated

#### **When NOT to Use**:

- ❌ **Stateless Utilities**: Use regular functions instead
- ❌ **Simple Data**: Use React state or context instead
- ❌ **Temporary Objects**: Use regular classes instead

#### **Real Examples**:

```typescript
// Design System Service
class DesignSystemService {
  private static instance: DesignSystemService;
  private constructor() {}

  static getInstance(): DesignSystemService {
    if (!DesignSystemService.instance) {
      DesignSystemService.instance = new DesignSystemService();
    }
    return DesignSystemService.instance;
  }

  getTokens() {
    /* ... */
  }
  validateTheme() {
    /* ... */
  }
}

// Error Handling Service
class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private constructor() {}

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  processError(error: Error) {
    /* ... */
  }
  getUserFriendlyMessage(error: Error) {
    /* ... */
  }
}

// Analytics Service
class AnalyticsService {
  private static instance: AnalyticsService;
  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  track(event: string, data?: any) {
    /* ... */
  }
  identify(userId: string) {
    /* ... */
  }
}
```

Migration quick‑steps:

1. **Reference Design System**: Check `src/design-system/tokens.ts` for
   available tokens
2. Identify manual UI patterns (e.g., repeated `bg-white border rounded`
   blocks).
3. Replace with design system components and variants:
   - Cards: `Card` (`variant="outlined" | "elevated"`)
   - Buttons: `Button` (`variant="primary" | "secondary" | "danger"`, `size`)
   - Badges: `Badge` for status/selection indicators
   - Forms: `Input`, `Select`, `Textarea`, `Checkbox`, `Radio`, `Switch`,
     `FormField`, `FormError`
   - Navigation/Overlays: `Tabs`, `Breadcrumbs`, `Modal`, `Dropdown`, `Tooltip`
     (when available)
4. Map props to component API and remove redundant `className`; keep utilities
   only for layout spacing (e.g., `mt-4`, `grid gap-4`).
5. Accessibility: preserve labels/`aria-*`; ensure visible focus rings via the
   component, not custom overrides.
6. Testing: prefer built‑in `data-testid` from components; avoid brittle
   selectors.
7. Theming: use tokens (`@/design-system`) and documented variants; avoid inline
   styles and ad‑hoc colors.
8. States: use component props for `variant`, `size`, `disabled`, `loading`
   instead of custom class combinations.
9. Imports: always from `@/components/ui/...` and `@/design-system/...`; avoid
   deep relative paths.

Exceptions:

- If a required component does not exist, create it under `src/components/ui`
  following `front end structure /implementation/COMPONENT_STRUCTURE.md`, and
  document it in `PROJECT_REFERENCE.md`.
- Temporary raw styling is allowed only with a tracked follow‑up to migrate to
  the design system.

Review checklist:

- No repeated manual card/button patterns (`bg-white border rounded ...`).
- No duplicate components that overlap with the design system.
- All interactive elements expose proper focus states and keyboard navigation.

**♿ WCAG 2.1 AA: Mandatory accessibility compliance**

- Touch: 44px+ minimum targets for mobile (enforced)
- Contrast: 4.5:1 ratio minimum
- Navigation: Full keyboard and screen reader support

## 📚 **DOCUMENTATION & VALIDATION**

**📝 Required Updates: Update documentation after implementation**

- Always: IMPLEMENTATION_LOG.md with phase, status, traceability
- Complex: LESSONS_LEARNED.md for significant implementations
- Major: PROJECT_REFERENCE.md for new components/APIs
- Scripts: Update File Responsibility Matrix for new scripts
- Mobile: Touch interaction patterns and conflict resolution documented

**🔍 Quality Gates: All implementations must pass**

- Build: npm run build → successful compilation
- Types: npm run type-check → 0 errors
- Duplicates: npm run audit:duplicates → review findings
- Mobile: Touch interaction testing on real devices
- Performance: Data loading <1 second (verify against customer selection
  baseline)

## 🔍 **PRE-IMPLEMENTATION CHECKLIST**

**📋 Before Starting ANY Implementation:**

- [ ] npm run type-check → 0 errors
- [ ] npm run audit:duplicates → no conflicts with new functionality
- [ ] Existing pattern search completed (services, hooks, components)
- [ ] File Responsibility Matrix consulted (DEVELOPMENT_STANDARDS.md)
- [ ] Critical reference documents reviewed (Tier 1 minimum)
- [ ] ErrorHandlingService imports ready
- [ ] useApiClient pattern planned (for any data fetching)
- [ ] Wireframe reference identified and reviewed
- [ ] Component Traceability Matrix planned
- [ ] Performance optimization strategy defined (must use proven patterns)
- [ ] Documentation update plan established
- [ ] Mobile touch interactions analyzed (if applicable)
- [ ] Touch event conflict prevention implemented (if touch + forms)
- [ ] Touch target sizing verified (44px+ minimum)
- [ ] Security state storage interfaces planned (if security-related)
- [ ] Redis infrastructure verified (if using distributed storage)
- [ ] Mock implementations created for testing (if abstract interfaces)

## 🚀 **DEPLOYMENT & VERSION MANAGEMENT**

**📦 Automated Systems (No Manual Intervention)**

- Version History: Automatically updated via scripts/update-version-history.js
- Deployment: Use scripts/deploy.sh with proper version type
  (alpha/beta/rc/patch/minor/major)
- Information: Check deployment status with `npm run deployment:info`
- Never: Manual version history entries or duplicate deployment scripts

**🎯 Script Usage Guidelines**

- **Deployment**: `npm run deploy:alpha` (primary deployment command)
- **Development**: `npm run dev:smart` (health checks + smart startup)
- **Information**: `npm run deployment:info` (deployment history and status)
- **Auditing**: `npm run audit:duplicates` (check for duplicate functionality)
- **App CLI**: `npm run app:cli` (interactive, authenticated API + DB testing)

---

**💡 Quick Reference Commands:**

```bash
# Pre-implementation checks
npm run type-check && npm run audit:duplicates

# Check critical documents
ls docs/CRITICAL_REFERENCE_DOCUMENTS.md

# Deployment (choose appropriate type)
npm run deploy:alpha  # For feature development
npm run deploy:beta   # For feature complete testing
npm run deploy:patch  # For production bug fixes

# Get deployment information
npm run deployment:info
```

### App CLI (scripts/app-cli.ts) — When to Use

- Use for authenticated, end-to-end API testing with real NextAuth sessions
  (cookie-based), not mocks
- Validate RBAC and roles across users quickly (`login`, `login-as`, `rbac try`,
  `rbac run-set`, `rbac test-roles`)
- Prefer for database-backed lookups before UI work (e.g., fetch real IDs,
  versions)
- Create and verify proposals/products via API without opening the UI (faster
  debug loop)
- Reproduce and capture backend validation errors (Zod/Prisma) with minimal
  setup

Guidelines

- Local base URL: use `--base http://127.0.0.1:3000` during development
- Always use real IDs from the database via `db` commands (no mock data)
- Non-interactive mode for scripts/CI: `npm run app:cli -- --command "..."`

Examples

```bash
# Login (creates a session cookie jar for subsequent commands)
npm run app:cli -- --base http://127.0.0.1:3000 --command "login admin@posalpro.com 'ProposalPro2024!' 'System Administrator'"

# Get active product/customer IDs from the DB
npm run app:cli -- --command "db product findFirst '{\"where\":{\"isActive\":true},\"select\":{\"id\":true,\"price\":true}}'"
npm run app:cli -- --command "db customer findFirst '{\"where\":{\"status\":\"ACTIVE\"},\"select\":{\"id\":true,\"name\":true}}'"

# Create a proposal (schema-compliant payload)
npm run app:cli -- --command "post /api/proposals '{\"title\":\"CLI Test\",\"customerId\":\"<id>\",\"priority\":\"MEDIUM\",\"contactPerson\":\"Admin\",\"contactEmail\":\"admin@posalpro.com\",\"products\":[{\"productId\":\"<prodId>\",\"quantity\":1,\"unitPrice\":15000,\"discount\":0}],\"sections\":[{\"title\":\"Intro\",\"content\":\"Hello\",\"type\":\"TEXT\",\"order\":1}]}'"

# Version history utilities
npm run app:cli -- --command "versions list 50"
npm run app:cli -- --command "versions for <proposalId> 20"
```

## 🛠️ Full‑Stack Page Implementation Strategy (from scratch)

Use this strategic checklist to create a new, production‑ready page that is
fully connected to the backend. Every step stems from existing patterns in this
codebase and the rules in this document.

1. Plan and scaffold

- Identify the route under `src/app/` (prefer existing route groups like
  `(dashboard)` to inherit providers).
- Review: WIREFRAME_INTEGRATION_GUIDE.md, COMPONENT_STRUCTURE.md, DATA_MODEL.md,
  SITEMAP.md, ACCESSIBILITY_SPECIFICATION.md.
- Run: `npm run dev:smart` to boot with health checks.

2. Ensure provider stack (if creating a new route group)

- Mirror `(dashboard)/layout.tsx` provider order: `TTFBOptimizationProvider` →
  `WebVitalsProvider` → `SharedAnalyticsProvider` → `ClientLayoutWrapper` →
  `QueryProvider` → `ToastProvider` → `AuthProvider` → `ProtectedLayout`.
- Pass server session via `getServerSession(authOptions)` into `AuthProvider` to
  prevent auth loading stalls.

3. Create the page shell (SSR/CSR consistency)

- Use App Router page with stable wrappers (breadcrumbs/header) identical across
  loading/empty/error/success states.
- Use client components only when interactivity is needed; otherwise prefer
  server components for static parts.

4. Design system first (no raw UI)

- Use `src/components/ui/*` and tokens from `src/design-system/*` for all common
  UI: `Card`, `Button`, `Badge`, `Input`, `Select`, `Tabs`, `Table`, etc.
- Map styles to component variants (`variant`, `size`); keep `className` for
  layout spacing only.

5. Data access strategy

- Client: Use React Query (`useQuery`, `useMutation`) for complex data fetching
  with caching, pagination, and mutations. Use `useApiClient` pattern only for
  simple one-time fetches under the `QueryProvider`.
- Server/API: Add API routes under `src/app/api/<resource>` with Zod validation,
  strict typing, and selective hydration.
- Always request minimal fields with `fields` param and avoid heavy relation
  hydration by default.

6. RBAC and security

- Guard sensitive API routes with
  `validateApiPermission({ resource, action, scope? })` and follow scope rules
  (OWN/TEAM/ALL).
- Use NextAuth session in route group layouts; rely on `ProtectedLayout` for
  page‑level protection.

7. Pagination and large data handling

- Lists: default page size 30–50. Prefer cursor pagination (`limit+1` technique)
  and return `hasNextPage` + `nextCursor`.
- Virtualization: when visible rows can exceed ~200, add row virtualization for
  the table region and keep pagination; never fetch huge pages.

8. Performance and caching

- Server: short‑TTL caching for derived/analytics/history endpoints (public,
  max‑age≈60–120, s‑maxage≈120–240) with correct cache keys.
- Client: no custom caches; rely on React Query for complex data, apiClient for
  simple fetches. Lazy‑load heavy widgets with dynamic imports; split bundles.
- Follow list optimization rules: minimal fields, denormalized labels, single
  request per interaction.

9. Error handling and logging

- Use `ErrorHandlingService` + `ErrorCodes` + `useErrorHandling` for all
  try/catch paths.
- Surface user‑friendly messages; record analytics and logs through the standard
  system (no `console.*` in product code).
- Use standardized error displays/components where appropriate.

10. Accessibility and UX standards

- Maintain WCAG 2.1 AA: proper labels, focus states, keyboard navigation, 44px
  touch targets, color contrast.
- Keep SSR/CSR structures identical; avoid time/locale/random differences at
  render time.

11. Analytics and traceability

- Add Component Traceability Matrix metadata (user stories, acceptance criteria,
  hypotheses, test cases).
- Track key interactions via the analytics hooks (hypothesis validation,
  performance metrics as applicable).

12. Testing and validation

- Type safety: `npm run type-check` must be clean.
- Build locally if needed; verify no linter/TS violations, and UI states
  (loading/error/empty/data) render correctly.
- Use `npm run app:cli` to exercise API endpoints with real auth sessions;
  verify RBAC.

13. Documentation updates (mandatory)

- Update `docs/IMPLEMENTATION_LOG.md` with phase/status/traceability.
- Add notable insights to `docs/LESSONS_LEARNED.md` when patterns or pitfalls
  emerge.
- Update `PROJECT_REFERENCE.md` if new components/routes/endpoints are added.

Decision helpers (from existing implementation)

- Client fetch: prefer React Query (`useQuery`, `useMutation`) for lists, forms,
  and any data that needs caching/invalidation. Use `useApiClient` only for
  simple one-time fetches under `QueryProvider`.
- Pagination vs virtualization: paginate by default; add virtualization for long
  on‑screen lists without increasing page size.
- Caching: only on the server for derived data; no custom client caches. Use
  proper headers and cache keys.
- Design system: never handcraft buttons/cards/forms when components exist. Use
  variants; keep overrides minimal.

## 🗄️ **DATABASE ID FORMAT VALIDATION (CRITICAL)**

**🔍 MANDATORY: Always check Prisma schema before implementing ID validation**

- Pattern: Verify actual ID formats in `prisma/schema.prisma` BEFORE validation
- Reality: PosalPro MVP2 uses `@default(cuid())` NOT `@default(uuid())`
- Format: CUIDs look like `cl4xxx...` NOT `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Never: Assume UUID format without checking database schema

**🔧 Database-Agnostic ID Validation Helpers:**

```typescript
// ✅ CORRECT: For user IDs (supports CUIDs and other formats)
const userIdSchema = z.string()
  .min(1, 'User ID is required')
  .refine(id => id !== 'undefined' && id !== 'unknown' && id.trim().length > 0);

// ✅ CORRECT: For entity IDs (flexible format support)
const databaseIdSchema = z.string()
  .min(1, 'ID is required')
  .refine(id => id !== 'undefined' && id.trim().length > 0);

// ❌ FORBIDDEN: Format-specific validation without database verification
userId: z.string().uuid(), // Breaks with CUID format
```

**🚫 CRITICAL LESSON: UUID ≠ CUID**

- Issue: ZodError `"Invalid uuid"` when database uses `@default(cuid())`
- Cause: Format-centric validation vs business-logic validation
- Fix: Use userIdSchema/databaseIdSchema helpers
- Reference: [Lesson #19: CUID vs UUID Validation][memory:lesson19]]

## 🗄️ **DATABASE TRANSACTION PATTERNS (CRITICAL)**

**🔄 Database Transaction Guidance**

- Use `prisma.$transaction` for logically related multi-statement sequences
  (e.g., findMany + count, multiple aggregations) that must be consistent.
- Avoid transactions for single reads where they add latency without consistency
  benefits.
- Never use `Promise.all` for related writes; use a single transaction instead.
- Reference: [Lesson #30: Database Performance Optimization][memory:lesson30]]

## 🔐 **SECURITY STATE STORAGE PATTERNS (CRITICAL)**

**🛡️ MANDATORY: Always use abstract interfaces for security state storage**

- Pattern: Implement SecurityStorage, CSRFStorage, RateLimitStorage interfaces
- Never: Use in-memory Maps for security state in production
- Reference: [Lesson #32: Redis-Based Security State Storage][memory:lesson32]]

**🔧 Security Storage Best Practices:**

```typescript
// ✅ CORRECT: Abstract interfaces for testability
export interface SecurityStorage {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

// ✅ CORRECT: Factory pattern for dependency injection
export class SecurityStorageFactory {
  static createCSRFStorage(): CSRFStorage {
    return new RedisCSRFStorage();
  }
}

// ❌ FORBIDDEN: In-memory storage for security state
class CSRFProtection {
  private static tokens = new Map<string, { token: string; expires: number }>();
}
```

**📋 Implementation Requirements:**

- All security state MUST use abstract interfaces
- Implement Redis-based storage for production scalability
- Use factory pattern for dependency injection and testability
- Add comprehensive tests with mock implementations
- Plan graceful fallback for infrastructure failures
- Follow Security-First Architecture philosophy from Lesson #32
- **Provider Stack Order**: Wire providers once in layout with correct order:
  `QueryProvider` → `AuthProvider` → `Analytics` → `Toast` → `Global UI state`
- **Template Layout**: Copy `(app)/(dashboard)/layout.tsx` to match the doc's
  order

**🔧 Database Transaction Best Practices:**

```typescript
// ✅ CORRECT: Single atomic transaction for related queries
const [items, count] = await prisma.$transaction([
  prisma.item.findMany({ where: { status: 'ACTIVE' } }),
  prisma.item.count({ where: { status: 'ACTIVE' } }),
]);

// ❌ FORBIDDEN: Separate queries creating inconsistency risks
const [items, count] = await Promise.all([
  prisma.item.findMany({ where: { status: 'ACTIVE' } }),
  prisma.item.count({ where: { status: 'ACTIVE' } }),
]);

// ✅ CORRECT: Multi-step writes with idempotency
const result = await prisma.$transaction(async tx => {
  const step1 = await tx.step1.create({ data: step1Data });
  const step2 = await tx.step2.create({
    data: { ...step2Data, step1Id: step1.id },
    // Add idempotency key if calling external services
  });
  return { step1, step2 };
});
```

**📋 Implementation Requirements:**

- All related database queries MUST use `prisma.$transaction`
- For multi-step writes add `$transaction()` and (if calling external services)
  an idempotency key
- Add indexes on frequently searched text fields
- Eliminate redundant aggregation calls
- Monitor database round-trips and connection pool usage
- Follow Database-First Optimization philosophy from Lesson #20

## 🧹 **CODEBASE MAINTENANCE & CLEANUP (CRITICAL)**

**🗑️ MANDATORY: Regular codebase cleanup to remove obsolete files and
artifacts**

- Pattern: Monthly review and removal of unnecessary files
- Never: Accumulate backup files, logs, old reports, or obsolete scripts
- Reference: [Lesson #31: Codebase Cleanup and Streamlining][memory:lesson31]]

**🔧 Cleanup Best Practices:**

```bash
# ✅ CORRECT: Regular cleanup schedule
# Monthly: Remove obsolete files, update documentation, archive old reports
# Weekly: Clear temporary files and logs

# ❌ FORBIDDEN: Neglecting codebase maintenance
# Never: Allow accumulation of unnecessary files
# Never: Keep outdated documentation in main branch
```

**📋 Implementation Requirements:**

- Preserve essential documentation (`CORE_REQUIREMENTS.md`,
  `LESSONS_LEARNED.md`, etc.)
- Maintain configuration files and package management files
- Remove redundant artifacts (generated reports, temporary files, backup files)
- Archive old but potentially useful documents to separate repositories
- Use git tags and releases for milestone documentation instead of keeping files
  in main branch
- Follow Documentation Lifecycle Management from Lesson #31

### 🧷 Linting & Type Rules (Additions)

- Use `Array<T>` syntax for non-simple array types instead of `T[]` to satisfy
  repository lint rules.
- Ensure no `any` in public interfaces and eliminate unsafe assignments in hot
  code paths.

## 🔐 **AUTHENTICATION INFRASTRUCTURE VALIDATION (CRITICAL)**

**🚨 MANDATORY: Database Migration & Schema Validation for Authentication**

- Pattern: Always validate migration status and schema sync before
  authentication changes
- Command: `npx prisma migrate status` must show "Database schema is up to
  date!"
- Never: Deploy with failed migrations or orphaned migration directories
- Reference: [Lesson #21: Authentication Failure - Database Migration
  Issues][memory:lesson21]]

**⚡ Critical Authentication Health Checks:**

```bash
# ✅ MANDATORY: Pre-deployment authentication validation
npx prisma migrate status                # Must show: "Database schema is up to date!"
npx prisma generate                      # Regenerate client after schema changes
npm run auth:health-check                # Test authentication flow with known credentials
```

**🔧 Authentication Database Patterns:**

```typescript
// ✅ CORRECT: Defensive authentication queries (separate user and roles)
async function getUserByEmail(email: string) {
  try {
    // Step 1: Get user without complex relations
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        // ... other basic fields
      },
    });

    if (!user) return null;

    // Step 2: Get roles separately to avoid relation issues
    const userRoles = await prisma.userRole.findMany({
      where: { userId: user.id, isActive: true },
      select: { role: { select: { name: true } } },
    });

    return { ...user, roles: userRoles };
  } catch (error) {
    // Proper error handling with specific error context
  }
}

// ❌ FORBIDDEN: Complex nested relation queries in authentication
const user = await prisma.user.findUnique({
  where: { email },
  select: {
    roles: { select: { role: { select: { name: true } } } }, // Vulnerable to schema drift
  },
});
```

**🚨 Critical Warning Signs (IMMEDIATE INVESTIGATION REQUIRED):**

- "Failed to retrieve user by email" errors during authentication
- Authentication working in API endpoints but failing in auth flow
- Migration status showing failed or missing migrations
- Schema validation errors during Prisma operations
- 500 errors during authentication attempts

**📋 Authentication Deployment Checklist:**

- [ ] `npx prisma migrate status` shows "Database schema is up to date!"
- [ ] No failed migrations in migration history
- [ ] Test authentication with valid credentials (admin@posalpro.com)
- [ ] Health endpoint includes database migration status
- [ ] Prisma client generation completed successfully
- [ ] No orphaned migration directories in `prisma/migrations/`

**🔧 Migration Repair Commands:**

```bash
# Fix failed migrations
npx prisma migrate resolve --applied <MIGRATION_NAME>

# Remove orphaned migration directories
rm -rf prisma/migrations/<EMPTY_MIGRATION_DIRECTORY>

# Synchronize schema with database
npx prisma db pull
npx prisma generate

# Validate final state
npx prisma migrate status
```

**⚠️ Authentication Function Requirements:**

- Use separate queries instead of complex nested relations
- Implement comprehensive error handling with specific error messages
- Add retry logic for transient database connection issues
- Monitor authentication success rates in production
- Never use complex Prisma relations in authentication-critical paths

### ✅ RBAC Authorization (Mandatory)

• Centralized middleware:

- Use `rbacIntegration.authenticateAndAuthorize(request)` in `middleware.ts` for
  route-level protection.
- Allowlist Next internals and `api/auth/*`; everything else requires a valid
  token and permissions.

• API route guard (required):

- Every sensitive API route MUST call
  `validateApiPermission({ resource, action, scope?, context? })` at the top of
  each handler (GET for reads; POST/PUT/DELETE for writes).
- Use granular actions: `read`, `create`, `update`, `delete` (e.g.,
  `products:create`).
- Reserve wildcards (`resource:*` or `*:*`) for admin policies only.

• Scope-based access (OWN/TEAM/ALL):

- Prefer narrow scopes when possible.
- OWN: pass `{ scope: 'OWN', context: { resourceOwner: userId } }` when resource
  ownership is known.
- TEAM: pass `{ scope: 'TEAM', context: { userTeam, resourceTeam } }` where
  applicable.

• Token/session requirements:

- JWT must include `roles`, `permissions`, and a `sessionId` issued by
  `secureSessionManager` (added in `callbacks.jwt`).
- Session callback propagates `roles` and `permissions` to `session.user` (used
  by UI guards).

• Frontend access control:

- Use `ProtectedRoute` and `AuthProvider` utilities for component/page-level
  guards.
- Treat `System Administrator` and `Administrator` as super-admin overrides
  consistently.

• Admin endpoints:

- Admin/users/roles endpoints must enforce `roles:read`/`roles:update` (or
  `users:*` where documented).

• Security audit integration:

- Permission denials and high-risk accesses must be logged via the security
  audit system (`securityAuditManager`).

• Performance and caching for list endpoints:

- List/search endpoints MUST set `Cache-Control` headers:
  - Production: `public, max-age=60–120, s-maxage=120–240` depending on endpoint
    sensitivity.
  - Development: `no-store`.
- Continue to use selective fields and transaction batching patterns to prevent
  N+1 and reduce payload size.
