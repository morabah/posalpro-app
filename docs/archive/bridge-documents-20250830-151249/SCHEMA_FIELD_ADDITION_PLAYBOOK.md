# Schema Field Addition Playbook

This guide standardizes how to add a new field to a schema and update all related layers across this codebase.

## Purpose
- Ensure consistent, complete updates from database → API → services → UI → tests.
- Minimize regressions by following a single, verified flow.

## Prerequisites
- Decide name, type, nullability, default, and indexing needs for the new field.
- Identify affected entity (e.g., Product, Proposal, Customer, User).

## Step‑By‑Step

### 1) Plan the change
- Field spec: name, type (string/number/boolean/enum/date/json), nullability, default, and index.
- Usage: reads/writes, filters/sorts, search, analytics, or caching.
- Backfill plan: how to populate existing rows (seed, one‑off script, or default).

### 2) Database & Prisma
- Edit Prisma model: `prisma/schema.prisma`
- Create migration and generate client:
  - `npm run db:migrate -- add_<field>_to_<model>`
  - `npm run db:generate`
- Backfill existing data if needed:
  - Update `prisma/seed.ts` and/or add a one‑off script.
  - If making the field non‑nullable, keep it nullable during backfill; then follow up with a constraint‑tightening migration.
- Indexes: add `@@index([newField])` if used in queries; validate generated SQL in `prisma/migrations/*/migration.sql`.

### 3) Types & Validation
- Domain types: `src/types/entities/<entity>.ts` and any shared types under `src/types/**`.
- Entities/DTOs: `src/lib/entities/*.ts` (ensure mapping fields remain in sync).
- Zod schemas: `src/lib/validation/schemas/<entity>.ts` and exports in `src/lib/validation/schemas/index.ts`.
- Form helpers/transforms/defaults: `src/lib/validation/formHelpers.ts` and `src/lib/validation/index.ts`.
- Enums/constants: `src/types/enums.ts` or related constants if the field introduces new values.

### 4) API & Services
- Update request/response contracts in affected routes:
  - `src/app/api/<entity>/route.ts`
  - `src/app/api/<entity>/[id]/route.ts`
  - Related analytics/list/search routes if they include the field
- Services/repositories:
  - `src/lib/services/<Entity>Service.ts`, `src/services/<entity>Service.ts`
  - Ensure create/update methods accept the field and mappers include it.
- Bridges & formatters:
  - Bridges: `src/lib/bridges/*ApiBridge.ts`
  - Formatters: e.g., `src/lib/api/endpoints/*.formatter.ts`
- Caching & performance:
  - Update cache key composition and invalidation where responses change:
    - `src/lib/performance/ApiResponseCache.ts`
    - `src/lib/performance/CacheManager.ts`
    - `src/lib/performance/AdvancedCacheManager.ts`
- Search/sort:
  - If used in search, update: `src/app/api/search/**`, `src/features/search/hooks/useSuggestions.ts`, and UI `src/components/ui/forms/SuggestionCombobox.tsx`.

### 5) Frontend & State
- Forms (create/edit/wizard):
  - Add the field input/control, default value, and validation wiring.
  - Examples:
    - Product: `src/components/products/ProductCreationForm.tsx`, `ProductEditForm.tsx`, `ProductFormFields.tsx`
    - Proposal wizard steps: `src/components/proposals/steps/*`
- Lists/detail views:
  - Render on list cards and details (e.g., `ProposalCard.tsx`, `ProductDetail.tsx`).
- Hooks/stores:
  - `src/hooks/**` and stores under `src/lib/store/*` or `src/stores/*` (e.g., `unifiedProposalStore.ts`, `productStore.ts`).
- Analytics/telemetry:
  - Add tracking if relevant: `src/hooks/analytics/**`, `src/utils/logger.ts`, `src/lib/logging/LoggingService.ts`.

### 6) Tests & Fixtures
- Unit/integration tests: update constructions and assertions for the entity.
- Mocks/fixtures: `src/test/mocks/**`, `src/test/utils/**`, `src/test/mocks/prisma.mock.ts`.
- E2E/scripts: update flows if forms changed (e.g., `scripts/test-*.js`, `test-*.js`).
- Seed/demo data: ensure `prisma/seed.ts` includes the field for demo datasets.

### 7) Verification
- Type check: `npm run type-check`
- Lint: `npm run lint`
- Database validation: `npm run db:validate` and `npm run db:studio` to spot‑check.
- Tests:
  - Fast unit focus (recommended while iterating): `npm run test:ci:unit`
  - Integration/API: `npm run test:integration` and `npm run test:api-routes`
  - Critical gaps: `npm run test:critical-gaps`
  - Full CI sweep: `npm run test:ci`

## Repo‑Aware Search Helpers (ripgrep)
- Find entity types/DTOs: `rg -n "(type|interface)\s+<Entity>\b" src`
- Validators for entity: `rg -n "z\.object\(|Zod|schema" src/lib/validation/schemas`
- API routes touching entity: `rg -n "/api/.*/route\\.ts" src/app/api | rg -n "<entity>|<Entity>"`
- Services/bridges: `rg -n "<Entity>Service|<Entity>ApiBridge|formatter" src`
- UI forms & steps: `rg -n "Form|Step|Fields|Detail|Card|Wizard" src/components | rg -n "<Entity>|<entity>"`
- Stores/hooks: `rg -n "use<Entity>|<entity>Store" src`
- Suggestions/search: `rg -n "suggestion|search|useSuggestions|SuggestionCombobox" src`

## Common Pitfalls
- Making a field non‑nullable without backfill: backfill first, then tighten.
- Forgetting formatter/bridge updates: leads to missing fields in UI/API responses.
- Cache invalidation: broaden keys or bump versions where responses change.
- Test fixtures drift: update mocks/factories to include the new field.

## Rollback Plan
- If migration causes issues: `npm run db:migrate:reset` (dev only) and re‑apply.
- Revert schema, regenerate Prisma client, and re‑run tests.
- If prod: create a down migration or a compensating migration; disable new field writes via feature flag.

## Optional: Feature Flagging
- Gate writes/reads in API/services if the rollout requires a staged backfill.
- Toggle in UI to hide inputs until data is ready.

## Example Skeleton (Replace placeholders)
- Prisma: add `newField` to `<Model>` in `prisma/schema.prisma`.
- Migration: `npm run db:migrate -- add_newField_to_<model>` → `npm run db:generate`.
- Types: update `src/types/entities/<entity>.ts` and `src/lib/entities/<entity>.ts`.
- Validation: update `src/lib/validation/schemas/<entity>.ts` and `src/lib/validation/formHelpers.ts`.
- API: update `src/app/api/<entity>/route.ts` and `[id]/route.ts`.
- Services/bridges/formatters: ensure `newField` is mapped and returned.
- UI: add input to create/edit forms and render on detail/list components.
- Tests/mocks/seed: include `newField` everywhere relevant.

## Quick Commands
- Migrate & generate: `npm run db:migrate -- add_<field>_to_<model>` then `npm run db:generate`
- Type check & lint: `npm run type-check && npm run lint`
- Test sweep: `npm run test:ci`

---

Need a concrete example (e.g., add `priority` to `Proposal`)? Open an issue or ping the team; we’ll draft the exact diffs across Prisma, Zod, routes, services, forms, and tests.

