# CORE REQUIREMENTS (Non-Negotiable)

## 🔧 **ERROR HANDLING & TYPE SAFETY**

**🛡️ Error Handling: Use standardized ErrorHandlingService system only**

- Import: ErrorHandlingService, StandardError, ErrorCodes, useErrorHandler
- Pattern: errorHandlingService.processError() in all catch blocks
- Never: Custom error handling - always use established infrastructure

**📝 TypeScript: Maintain 100% type safety (0 errors)**

- Verify: npm run type-check → 0 errors before any commit
- Use: Explicit interfaces, strict typing, no any types
- Standard: Follow DEVELOPMENT_STANDARDS.md patterns

## 🔍 **DUPLICATE PREVENTION & EXISTING PATTERNS**

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

## ⚡ **DATA FETCHING & PERFORMANCE (CRITICAL)**

**🚀 MANDATORY: Always use useApiClient pattern for data fetching**

- Pattern: Follow BasicInformationStep.tsx customer selection as gold standard
- Code: `const apiClient = useApiClient();` + simple `useEffect` +
  `apiClient.get()`
- Never: Custom caching systems, direct fetch() calls, complex loading states
- Reference: [Lesson #12 in LESSONS_LEARNED.md][memory:3929430536446174589]]

**⚡ Proven Performance Pattern:**

```typescript
const apiClient = useApiClient();
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/endpoint');
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (error) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

**🚫 FORBIDDEN Data Fetching Patterns:**

- Custom caching with localStorage/memory maps
- Direct `fetch()` calls or `axios` usage
- Complex loading state management
- Multiple useEffect dependencies causing re-fetches
- Any pattern that takes >1 second to load data

### 🖼️ Image Optimization (Mandatory)

- Use Next.js Image for all UI images. Replace `<img>` with `<Image />` and
  provide `sizes`/`fill` or explicit `width`/`height` to improve LCP/CLS.
- Do not introduce custom image loaders unless required. Follow Next.js
  defaults.
- Audit UI for `<img>` occurrences during cleanup and migrate them.

## 🔐 **AUTH & SESSION MANAGEMENT (MANDATORY UPDATES)**

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

**🧰 Service Worker (Dev Smoothing Only)**

- Short-lived SW caching for `/api/auth/providers` and `/api/auth/session` (dev
  only) to reduce cold spikes during rapid navigation/tests. Must be disabled
  for production builds.

**🧰 Redis Usage Policy**

- Disable Redis in development to avoid startup/connect delays; use in-memory
  fallback with conservative timeouts (e.g., `connectTimeout=3000ms`).

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
- Do not use mock data in UI paths; always fetch from database via
  `useApiClient`.

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

**📄 Pagination Without COUNT(\*)**

- Use `limit + 1` pattern to infer `hasMore` instead of `COUNT(*)` for offset
  pagination on large tables.

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

- Data Fetching (Client): useApiClient pattern (MANDATORY - see above). Do not
  introduce custom client-side caches beyond apiClient’s built-ins.
- Data Access (Server/API routes/RSC): use direct data access (Prisma/fetch)
  with the same validation and error-handling standards.
- Database: DatabaseQueryOptimizer for all queries.
- Bundle: Lazy loading with BundleOptimizer.
- Caching:
  - Client: Only use built-in apiClient caching (no custom client caches or
    localStorage caches).
  - Server/API routes: Allowed to use targeted in-memory caches with short TTLs
    and explicit invalidation where appropriate (e.g., dashboard stats,
    proposals list, auth providers/session in dev). Never cache sensitive data
    improperly.

## ♿ **ACCESSIBILITY & UI STANDARDS**

**🎨 Wireframe Compliance: Reference wireframe documents for all UI**

- Path: front end structure/wireframes/[SCREEN_NAME].md
- Pattern: Follow WIREFRAME_INTEGRATION_GUIDE.md
- Consistency: Apply WIREFRAME_CONSISTENCY_REVIEW.md standards

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

**🚀 CRITICAL PERFORMANCE LESSONS:**

- **ALWAYS** use useApiClient pattern for data fetching
- **NEVER** implement custom caching systems
- **REFERENCE** BasicInformationStep.tsx customer selection as gold standard
- **VALIDATE** against <1 second loading time baseline
- **REMEMBER** [Lesson #12: Complex caching systems cause more problems than
  they solve][memory:3929430536446174589]]

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
```

**📋 Implementation Requirements:**

- All related database queries MUST use `prisma.$transaction`
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
