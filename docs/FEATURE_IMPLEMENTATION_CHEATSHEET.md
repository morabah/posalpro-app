# Feature Implementation Cheat Sheet (Agent Blueprint)

Purpose: enable an agent/dev to ship a feature end‑to‑end (UI → API → DB) using stable contracts, consistent validation, and safe patterns.

Gold standard module (emulate): Products
- Schemas: `src/features/products/schemas.ts`
- Hooks: `src/features/products/hooks/useProducts.ts`
- Keys: `src/features/products/keys.ts`
- API (service‑driven): `src/app/api/products/route.ts`
- DB service: `src/lib/services/productService.ts`

Non‑negotiables (from CORE_REQUIREMENTS)
- Two service layers: frontend HTTP (`src/services/*`) vs DB services (`src/lib/services/*`).
- API routes are thin; no Prisma/transactions in routes.
- HTTP client unwraps `{ ok: true, data }` and throws on `{ ok: false }`.
- Auth/JWT secrets via one source (`getAuthSecret()`); dashboard gated via `ProtectedLayout`.
- Zustand only under `src/lib/store/`.

React Query defaults
- `staleTime`: 30–60s, `gcTime`: 2–5m, `refetchOnWindowFocus: false`, `retry: 1`.

## Recommended Workflow

- Backend‑first, feature‑driven, database‑aware.
- Order: Prisma schema → DB service (`src/lib/services`) → API route → Frontend service (`src/services`) → Feature hooks (`src/features`) → UI → Tests.
- Reason: Stabilize contracts early; UI builds on typed, idempotent APIs.

## Agent QuickStart (8 Steps)

1) Schema: add Zod schemas/types in `src/features/<domain>/schemas.ts` (list/query/create/update).
   - app-cli check: `npm run app:cli -- --command "schema validate"`
   - app-cli check: `npm run app:cli -- --command "schema integrity"`
2) DB Service: implement `src/lib/services/<domain>Service.ts` (normalize numbers/dates/Decimal; implement list/getById/create/update/remove; cursor pagination).
   - app-cli check (DB health): `npm run app:cli -- --command "health:db"`
   - app-cli check (Prisma quick query): `npm run app:cli -- --command "db <model> findMany '{\"take\":1}'"`
3) API Route: expose `src/app/api/<domain>/route.ts` using `createRoute`; delegate to DB service; return `{ ok: true, data }`; enforce RBAC + entitlements; idempotent creates.
   - app-cli check (API health): `npm run app:cli -- --command "health:api"`
   - app-cli smoke (GET): `npm run app:cli -- --command "get /api/<domain>"`
   - app-cli smoke (POST): `npm run app:cli -- --command "post /api/<domain> '{\"name\":\"Test\"}'"`
4) Frontend Service: add `src/services/<domain>Service.ts`; call `http.*<T>`; no `ApiResponse<T>` checks.
   - app-cli e2e (list): `npm run app:cli -- --command "<domain> list --limit=5"` (if entity op exists)
   - app-cli e2e (create): `npm run app:cli -- --command "<domain> create '{...}'"`
5) Keys: add `src/features/<domain>/keys.ts` with `.all`, `.lists()`, `.list(params)`, `.byId(id)`.
6) Hooks: implement `src/features/<domain>/hooks/use<Domain>.ts`; queries use service; mutations invalidate `.all` and update `.byId(id)`.
   - app-cli mismatch (8-layer): `npm run app:cli -- --command "schema detect-mismatch <ComponentName>"`
7) UI: server pages under `src/app/(dashboard)/<domain>`; client components use hooks; forms with RHF + Zod; safe event handling.
   - app-cli RBAC test: `npm run app:cli -- --command "rbac try GET /app/(dashboard)/<domain>"`
   - app-cli session test: `npm run app:cli -- --command "whoami"`
8) Verify: create → list → getById → update; duplicate create is idempotent.
   - app-cli version/assert (proposals): `npm run app:cli -- --command "versions assert <proposalId>"`
   - app-cli export sample: `npm run app:cli -- --command "export <domain> --limit=10 --format=json"`

## Folder Scaffold (example: `quotes`)

- `prisma/schema.prisma`: Models/enums; migrate and generate client.
- `src/lib/services/quoteService.ts`: DB logic (transactions, transforms, denorm).
- `src/app/api/quotes/route.ts` (+ nested routes): Thin boundary using `createRoute`.
- `src/services/quoteService.ts`: Frontend HTTP service (unwraps data).
- `src/features/quotes/{schemas.ts, keys.ts, hooks.ts}`: Zod schemas, React Query keys/hooks.
- `src/components/quotes/*`: UI, forms, lists.

## Data & Schema (Prisma)

- Align names/enums with DB exactly; map UI labels via Zod preprocessors.
- Normalize Decimal/dates in services (Number()/ISO string).
- Commands: `npm run db:migrate`, `npm run db:generate`.
 - Multi‑tenancy: include `tenantId` on multi‑tenant models; scope uniques/indexes by tenantId (e.g., `@@unique([tenantId, sku])`, `@@index([tenantId, createdAt])`).
 - Payload persistence: add a JSON/JSONB field (e.g., `metadata`, `userStoryTracking`, or `<domain>Payload`) to persist full wizard/page payloads on Save/Update/Finish.

## Server DB Service (`src/lib/services/*`)

- Contains all business logic. Routes must not include Prisma/transactions.
- Return domain objects (already normalized) — no envelopes here.
- Handle idempotency, unique constraints, cross‑entity orchestration.
- Centralize transforms: numbers, dates, arrays, enums.
 - Tenant scoping: resolve tenant via `getCurrentTenant()` and guard queries with `{ tenantId: tenant.tenantId }` (and `{ id, tenantId }` for single row).
 - Payload persistence: service update methods accept a `payload` object and persist it to the JSON field; reads return both normalized fields and `payload` for hydration.

Two service layers
- Frontend HTTP services: `src/services/*` (stateless HTTP, integrates with React Query)
- Database services: `src/lib/services/*` (Prisma, transactions, caching)

## API Route (App Router)

- Use `createRoute({ roles, body/query: ZodSchema }, handler)`.
- On success return `{ ok: true, data }` (use helpers in `src/lib/api/response.ts`).
- On error, let `errorHandlingService` produce standardized errors.
- Enforce idempotency for mutating endpoints (e.g., case‑insensitive duplicate handling returning 200 with existing row).
- Enforce RBAC + entitlements when required.
 - Tenancy: derive tenant from session/middleware; never trust client‑provided tenant.
 - Save/Update/Finish: PUT/PATCH accept full wizard/page payload (e.g., team/content/product/section/review data) and persist to a JSON field; GET by id returns it for re‑hydration.
 - Cache busting (server): after POST/PUT/PATCH/DELETE, clear Redis cache for the domain prefix (e.g., `clearCache('proposals:*')`).

Minimal route pattern:

```ts
export const POST = createRoute({ roles: ['admin'], body: CreateSchema }, async ({ body, user }) => {
  const item = await quoteService.create(body!, user.id);
  return ok(item, 201);
});
```

## Frontend Service (`src/services/*`)

- Use `@/lib/http`; it returns unwrapped `T` and throws on `{ ok: false }`.
- Do not annotate with `ApiResponse<T>`; rewrap only if the service’s public API returns `ApiResponse<T>`.

```ts
// CORRECT: unwrap
const list = await http.get<QuoteList>(`/api/quotes`);
// If needed to expose ApiResponse:
return { ok: true, data: list };
```

## Feature Layer (`src/features/<domain>`)

- `schemas.ts`: Zod (with transforms for UI↔DB mapping).
- `keys.ts`: Stable React Query keys (`quoteKeys.all`, `.byId(id)`).
- `hooks.ts`: `useQuery`/`useMutation` using frontend service or `http` directly.
  - Optimistic updates → rollback on error.
  - Invalidate/refetch on success; keep lists sorted deterministically.
  - For proposal wizard steps: invalidate `proposalKeys.proposals.byId(id)`, `sectionKeys.byProposal(id)`, and any list keys after mutations (e.g., bulk product assignment, section create/update).
 - Wizard payload: include optional `payload` (or domain‑specific keys) in types; GET by id hooks should expose `payload` to hydrate form defaults.

Create mutation pattern:

```ts
export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateQuote) => {
      const data = CreateQuoteSchema.parse(input);
      return http.post<Quote>(`/api/quotes`, data); // unwrapped
    },
    onSuccess: created => {
      qc.setQueryData(quoteKeys.all, (old: Quote[] = []) =>
        [...old, created].sort((a,b) => a.createdAt.localeCompare(b.createdAt))
      );
      qc.invalidateQueries({ queryKey: quoteKeys.all });
    },
  });
}
```

## UI Components

- Use RHF + Zod; avoid controlled inputs without handlers.
- Safe events: validate `e` and `e.target` before access.
- Keep localStorage keys unique per entity (include ID) to avoid cross‑pollution.
- Use skeletons/loading states; avoid re‑creating objects in render.
- Zustand stores only under `src/lib/store/` (canonical). Import as `@/lib/store/...`.
- Save/Update/Finish: submit the full form payload to API; on edit pages, hydrate defaults from the persisted `payload` returned by GET; only use localStorage as a temporary offline fallback.
 - After a successful mutation, await the promise, then trigger React Query invalidation for the affected domain keys to bust client cache and show fresh data immediately.

## Observability & Security

- Use centralized logger; attach `x-request-id` (auto in http client).
- Respect roles in routes; honor entitlements where applicable.
- Use `no-store` caching on sensitive endpoints (already default in http client).
- Auth/JWT: single source of truth for secrets; reuse `getAuthSecret()`.
- Gating: gate dashboard under `ProtectedLayout` (`src/app/(dashboard)/layout.tsx`), auth in `middleware.ts`.
- Security headers + CORS via `next.config.js`; stricter in production.
- Rate limiting + input sanitization patterns in `src/lib/security/hardening.ts`.

## Testing & Verification

- Type check: `npm run type-check:fast`.
- Quick flow: create → list shows item → fetch by id → update → delete (if supported).
- For idempotent creates, verify duplicate POST returns existing row as success.
- Tenant isolation: verify cross‑tenant reads/updates fail; ensure `{ id, tenantId }` guards exist in services.
- Payload hydration: after Save/Update/Finish, reload the edit page and verify form rehydrates from persisted JSON payload.
 - app-cli end-to-end checks:
   - API health: `npm run app:cli -- --command "health:api"`
   - DB health: `npm run app:cli -- --command "health:db"`
   - Schema validation: `npm run app:cli -- --command "schema validate"`
   - 8-layer mismatch: `npm run app:cli -- --command "schema detect-mismatch <ComponentName>"`
   - Entity smoke: `npm run app:cli -- --command "<domain> create '{...}'"` then `"<domain> list --limit=5"`
   - RBAC: `npm run app:cli -- --command "rbac try POST /api/<domain>"`

## React Query Defaults (Hooks)

- Defaults: `staleTime` 30–60s, `gcTime` 2–5m, `refetchOnWindowFocus: false`, `retry: 1`.
- Keys: centralize in `src/features/<domain>/keys.ts`; compose with params object.
- Mutations: `invalidateQueries({ queryKey: keys.all })`; `setQueryData(byId(id), data)`.
- Avoid inline function/object keys inside components.

## Pagination & Sorting Standard

- Query params: `search`, `limit`, `cursor`, `sortBy`, `sortOrder`, and domain filters.
- API validates via Zod; services implement cursor pagination; routes pass typed filters.
- Example: products list `GET /api/products?search=&limit=&cursor=&sortBy=&sortOrder=`.

## Transactions & Idempotency

- Use `$transaction` for multi‑step writes; keep route thin and service heavy.
- Idempotency for creates (route layer), e.g., via `assertIdempotent(req, key)`.
- Prefer upsert/unique guards and “return existing row as success” patterns.

## Error Handling & Envelopes

- Routes: use `getErrorHandler().createSuccessResponse(data)` and `.createErrorResponse(err)`.
- Services: throw `StandardError` with `ErrorCodes` and metadata; no envelopes.
- HTTP client: unwraps `{ ok: true, data }`, throws on `{ ok: false }`.

## Performance & SSR

- Use `Promise.all` for parallel DB reads (see proposals by id route).
- Return lightweight payloads in hot paths; fetch heavy relations separately.
- For known SSR/CSR className diffs, use `suppressHydrationWarning` sparingly.
- Avoid importing server‑only modules in Client Components.

## Scaffolding Aids

- Use templates in `templates/design-patterns/*` for component/hook/route/service scaffolding.
- Migration templates: `templates/migration/*` (route wrappers, store, service, errors, transactions).

## Pitfalls To Avoid (From Lessons)

- Do not treat `http` results as envelopes. Never check `res.ok`/`'ok' in res`.
- Do not `JSON.stringify` manually in `http.*` calls; pass the object.
- Do not put Prisma/business logic in API routes.
- Do not diverge field names between UI/DTO/DB.
- Do not skip idempotency on mutating endpoints.
- Do not use unstable React Query keys or inline objects as keys.
- Do not perform client‑side duplicate checks that fight API idempotency.
- Do not pass custom validation objects to `zodResolver`; use Zod schemas directly.
- Do not access `e.target.value` without guarding `e`/`e.target`.
- Do not place Zustand stores outside `src/lib/store/`.
 - Do not import Prisma or `@/lib/db/prisma` in API routes; use DB services only.
 - Do not diverge auth secret sources; always use the centralized helper.

## Quick Checklists

- Schema: enums match DB; numbers/dates normalized in services.
- API: `createRoute`; Zod validated; returns `{ ok, data }`; idempotent.
- HTTP: unwrapped generics; no `ApiResponse<T>` in `http.*` calls.
- Feature: keys stable; hooks invalidate/refetch; optimistic updates safe.
- UI: RHF + Zod; safe event handling; unique local storage keys.
 - Auth/Gating: `ProtectedLayout` on dashboard; middleware routes enforced.
 - Security: headers, CORS, rate limiting applied.

## Examples To Emulate

- Product list API (service‑driven): `src/app/api/products/route.ts`
- Product hooks + keys: `src/features/products/hooks/useProducts.ts`, `src/features/products/keys.ts`
- Proposal service‑driven route: `src/app/api/proposals/route.ts`
- Customer service‑driven route: `src/app/api/customers/route.ts`

## Backend ⇄ Frontend Wiring Steps

1) Define feature schemas and types
- File: `src/features/<domain>/schemas.ts`
- Export Zod schemas for list/query/create/update + TypeScript types inferred from Zod.

2) Implement DB service (Prisma, normalization)
- File: `src/lib/services/<domain>Service.ts`
- Methods: `list`, `getById`, `create`, `update`, `remove` (+ cursor pagination).
- Normalize Number/Date/Decimal/arrays here. No API envelopes.
 - Tenancy: use `getCurrentTenant()` and include `{ tenantId }` in all filters.
 - Payload: accept `payload` and persist to the JSON field (e.g., `metadata`, `userStoryTracking`, or `<domain>Payload`).

3) Expose API routes (thin boundary)
- File: `src/app/api/<domain>/route.ts` (and nested as needed)
- Use `createRoute({ roles, body/query: FeatureSchema })`.
- Delegate to DB service; return `{ ok: true, data }`.
- Add idempotency on mutating endpoints; enforce RBAC/entitlements.
 - Accept wizard/page `payload` on PUT/PATCH; GET returns it for hydration.
 - Cache busting (server): on mutations, clear Redis caches for the domain prefix (e.g., `clearCache('proposals:*')`).

4) Add frontend HTTP service
- File: `src/services/<domain>Service.ts`
- Use `http.get/post/put/delete<T>`; do not use `ApiResponse<T>` or `res.ok`.
- Map search params via `URLSearchParams` for list endpoints.
 - Expose `.update(id, { ...fields, payload })` and `.byId(id)` that returns `{ ...fields, payload }`.

5) Create React Query keys
- File: `src/features/<domain>/keys.ts`
- Patterns: `.all`, `.lists`, `.list(params)`, `.byId(id)`, feature‑specific keys.

6) Add React Query hooks
- File: `src/features/<domain>/hooks/use<Domain>.ts`
- Queries call frontend service; mutations invalidate `.all` and update `.byId(id)`.
- Use stable keys; avoid inline objects without centralization.
 - Edit hydration: use `.byId(id)` to set RHF `defaultValues` from `payload`; on save, resubmit updated `payload`.

7) Wire UI
- Pages: `src/app/(dashboard)/<domain>[/create|/[id]]/page.tsx` (Server Components + Suspense).
- Client components call hooks; forms use RHF + Zod; safe event handling.
- Keep Zustand only for UI state under `src/lib/store/`.

8) Verify end‑to‑end
- Flow: create → list shows item → fetch by id → update; confirm idempotent create.
- Ensure HTTP returns unwrapped data and hooks do not check `res.ok`.

## Layer Templates (Minimal)

// DB Service: src/lib/services/quoteService.ts
```ts
export class QuoteService {
  async list(filters: QuoteFilters) { /* Prisma findMany with cursor; normalize */ }
  async getById(id: string) { /* Prisma findUnique; normalize */ }
  async create(data: CreateQuoteData, userId: string) { /* $transaction; normalize */ }
  async update(id: string, data: UpdateQuoteData) { /* $transaction; normalize */ }
}
export const quoteService = new QuoteService();
```

// API Route: src/app/api/quotes/route.ts
```ts
import { createRoute } from '@/lib/api/route';
import { quoteService } from '@/lib/services/quoteService';
import { QuoteCreateSchema, QuoteQuerySchema } from '@/features/quotes/schemas';
import { clearCache } from '@/lib/redis';

export const GET = createRoute({ roles: ['admin'], query: QuoteQuerySchema }, async ({ query }) => {
  const res = await quoteService.list(query!);
  return Response.json({ ok: true, data: res });
});

export const POST = createRoute({ roles: ['admin'], body: QuoteCreateSchema }, async ({ body, user }) => {
  const created = await quoteService.create(body!, user.id);
  await clearCache('quotes:*'); // server cache bust for list endpoints
  return Response.json({ ok: true, data: created }, { status: 201 });
});
```

// Frontend Service: src/services/quoteService.ts
```ts
import { http } from '@/lib/http';
export const quoteClient = {
  list: (params: QuoteQuery) => http.get<QuoteList>(`/api/quotes?${new URLSearchParams(params as any)}`),
  create: (data: CreateQuote) => http.post<Quote>(`/api/quotes`, data),
  byId: (id: string) => http.get<Quote>(`/api/quotes/${id}`),
  update: (id: string, data: UpdateQuote) => http.put<Quote>(`/api/quotes/${id}`, data),
};
```

// Keys: src/features/quotes/keys.ts
```ts
export const quoteKeys = {
  all: ['quotes'] as const,
  lists: () => [...quoteKeys.all, 'list'] as const,
  list: (params: object) => [...quoteKeys.lists(), params] as const,
  byId: (id: string) => [...quoteKeys.all, 'byId', id] as const,
};
```

// Hooks: src/features/quotes/hooks/useQuotes.ts
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quoteKeys } from '../keys';
import { quoteClient } from '@/services/quoteService';

export function useInfiniteQuotes(params: QuoteQuery) {
  return useQuery({ queryKey: quoteKeys.list(params), queryFn: () => quoteClient.list(params), staleTime: 60000, gcTime: 120000, refetchOnWindowFocus: false, retry: 1 });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuote) => quoteClient.create(input),
    onSuccess: created => {
      qc.invalidateQueries({ queryKey: quoteKeys.all });
      qc.setQueryData(quoteKeys.byId(created.id), created);
    },
  });
}
```

// UI Form (client): src/components/quotes/QuoteCreateForm.tsx
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuoteCreateSchema } from '@/features/quotes/schemas';
import { useCreateQuote } from '@/features/quotes/hooks/useQuotes';

export function QuoteCreateForm() {
  const { mutate, isLoading } = useCreateQuote();
  const form = useForm({ resolver: zodResolver(QuoteCreateSchema) });
  const onSubmit = form.handleSubmit(values => mutate(values));
  return (
    <form onSubmit={onSubmit}>
      {/* fields */}
      <button disabled={isLoading}>Create</button>
    </form>
  );
}
```

## Acceptance Criteria (Minimal)

- Route has no Prisma import; uses `createRoute`; returns `{ ok, data }`.
- DB service owns transactions, normalization, and error mapping.
- HTTP client usage unwraps data; no `ApiResponse<T>` generics; no `res.ok` checks.
- React Query keys centralized; mutations invalidate `.all` and set `.byId`.
- UI uses RHF + Zod; safe event handling; no uncontrolled value warnings.
- Auth/gating applied for dashboard; entitlements enforced where required.
