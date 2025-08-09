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
