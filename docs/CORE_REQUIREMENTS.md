# CORE REQUIREMENTS (Non-Negotiable)

## ✅ Future Compliance (Important)

To keep the codebase aligned with these core requirements as it evolves, the
following items are mandatory moving forward:

- Auth/JWT secret consistency: All signing and verification must resolve the
  secret via a single source of truth. Use `getAuthSecret()` everywhere
  (NextAuth `secret`, JWT `secret`, and any `getToken` calls).
  - References: `src/lib/auth/secret.ts`, `src/lib/auth.ts`,
    `src/middleware.ts`, `src/app/api/auth/debug/route.ts`
- Auth observability: When `AUTH_DEBUG` or `NEXTAUTH_DEBUG` is true, NextAuth
  debug and structured logging must be enabled and routed through the project
  logger for traceability.
  - References: `src/lib/auth.ts`, `src/lib/logger.ts`
- Session integrity: With a valid token in `Authorization` or session cookie,
  `/api/auth/debug` must return a populated token and `/api/auth/session` must
  return a populated session.
  - References: `src/app/api/auth/debug/route.ts`,
    `src/app/api/auth/[...nextauth]/route.ts`
- Environment validation: Keep NEXTAuth-related vars validated and documented
  (e.g., `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, optional `JWT_SECRET` for parity)
  and avoid per-route divergences.
  - References: `src/env.mjs`, `src/env.ts`, `.env.local`
- Cookie security: Continue to use secure cookie settings in production
  (`useSecureCookies`, `__Secure-` prefix, optional domain scoping) to prevent
  cross-domain/session issues.
  - References: `src/lib/auth.ts`

These practices are now treated as non-negotiable and must be preserved in
future changes and reviews.

## 🚨 **CRITICAL: THINK FEATURE-FIRST, DATABASE-FIRST**

**🔍 MANDATORY: Complete Analysis Before Implementation**

- **Step 1**: Check existing implementations first (services, hooks, components)
- **Step 2**: Align with database schema and API contracts
- **Step 3**: Use feature-based organization (src/features/)
- **Step 4**: Implement comprehensive solution addressing ALL issues at once
- **Step 5**: Test with real data, not mocks

**📋 Pre-Implementation Checklist**

- [ ] `npm run audit:duplicates` - Check for existing patterns
- [ ] Database schema review - Align field names and relationships
- [ ] Existing API endpoints inventory - Reuse working endpoints
- [ ] Feature structure planning - src/features/[domain]/ organization
- [ ] Centralized query keys setup - Consistent caching patterns

**❌ FORBIDDEN PRACTICES**

- Creating new APIs when existing ones work
- Composite hooks that create new objects on every render
- Inconsistent field names across layers
- Manual response envelope handling
- Dynamic values in component IDs

## 🏗️ **MODERN ARCHITECTURE OVERVIEW**

**Feature-Based Architecture** - The foundation of all implementations

```
src/features/[domain]/
├── schemas.ts        # Zod schemas, types, validation
├── keys.ts          # Centralized React Query keys
├── hooks/           # React Query hooks
└── index.ts         # Feature exports

src/app/(dashboard)/[domain]/
├── [id]/
│   ├── page.tsx     # Server component with Suspense boundaries
│   ├── loading.tsx  # Route-level loading UI with user feedback
│   └── error.tsx    # Route-level error boundary with recovery
├── create/
│   ├── page.tsx     # Creation form with validation
│   ├── loading.tsx  # Loading states during form setup
│   └── error.tsx    # Error handling for creation failures
└── page.tsx         # List/index page with data fetching

src/services/        # Service layer (HTTP client services for frontend)
src/lib/services/   # Database services (Prisma-based for API routes)
src/lib/store/       # Zustand stores (UI state only) - CANONICAL LOCATION
src/hooks/          # Shared React Query hooks
```

### **🗂️ Store Location Rules**

**CANONICAL STORE LOCATION (MANDATORY)**

- **✅ ONLY use**: `src/lib/store/` for ALL Zustand stores
- **❌ NEVER use**: `src/stores/` or any other location
- **Import pattern**: `@/lib/store/[storeName]`

**Why this location?**

- Consistent with the overall `src/lib/` architecture pattern
- Clear separation of UI state (stores) from server state (React Query)
- Follows established project structure conventions
- Prevents confusion about where state management code belongs

---

### **🔧 Service Layer Architecture**

**TWO-DISTINCT SERVICE LAYERS (MANDATORY)**

The application uses **two separate service layers** serving different
architectural purposes:

#### **1. Frontend Services: `src/services/`**

**Purpose**: HTTP client services for React Query integration **Architecture**:
Stateless, HTTP-based API communication **Usage**: Frontend components via React
Query hooks **Pattern**: Follows CORE_REQUIREMENTS.md service patterns

```typescript
// ✅ CORRECT: Frontend service usage
import { useProducts } from '@/features/products/hooks/useProducts';
import { productService } from '@/services/productService';

// In React component:
const { data: products } = useProducts();
```

**Characteristics:**

- Uses HTTP client (`@/lib/http`)
- Returns unwrapped domain data
- Imports from `@/features/*/schemas`
- Integrates with React Query
- Error handling via `ErrorHandlingService`

#### **2. Database Services: `src/lib/services/`**

**Purpose**: Direct database access for API routes **Architecture**:
Prisma-based data access layer **Usage**: Server-side API routes and database
operations **Pattern**: Direct Prisma operations with caching

```typescript
// ✅ CORRECT: Database service usage
import { productService } from '@/lib/services/productService';

// In API route:
const products = await productService.getProducts(filters);
```

**Characteristics:**

- Uses Prisma ORM directly
- Complex database queries and relationships
- Server-side caching and optimization
- Specialized services (DatabaseOptimizationService, etc.)
- Centralized exports via `index.ts`

#### **Entity Overlap (Expected)**

Both directories contain services for core entities:

- `customerService.ts` (both directories)
- `productService.ts` (both directories)
- `proposalService.ts` (both directories)
- `userService.ts` (both directories)

**This is by design**: Frontend needs HTTP services, backend needs database
services.

#### **Import Patterns**

- **Feature-First**: Always import from feature modules (`@/features/[domain]`)
- **Service Layer**: Use appropriate service based on context (frontend vs
  database)
- **Cross-Domain**: Import shared utilities from centralized locations

---

**📊 Complete Data Flow Architecture:**

```
┌──────────────────────┐
│ Edge Middleware      │  middleware.ts + rbacIntegration.authenticateAndAuthorize
└──────────┬───────────┘
           │ allow/redirect
           ▼
┌───────────────────────────────┐
│ Route Boundaries (App Router) │  loading.tsx / error.tsx
└──────────────┬────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Layout Gating                                                                │
│                                                                              │
│  Dashboard routes:                                                           │
│   src/app/(dashboard)/layout.tsx                                             │
│     → getServerSession(authOptions)                                          │
│     → AuthProvider(session)                                                  │
│     → ProtectedLayout                                                        │
│     → AppLayout (header/sidebar/nav)                                         │
│                                                                              │
│  Top-level internal routes (e.g., /observability, /performance/*, /docs):    │
│     ClientLayoutWrapper → AuthProvider → ProtectedLayout                     │
└──────────────────────────────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────┐        ┌─────────────┐
│ UI Components│  <-->  │ Zustand UI  │  '@/lib/store/*'
└──────┬───────┘        │ State       │
       │                └─────────────┘
       ▼
┌──────────────┐
│ React Query  │  hooks ('@/features/*/hooks') + centralized keys
└──────┬───────┘
       ▼
┌──────────────┐        ┌────────────────┐        ┌──────────────────┐        ┌──────────┐
│ Frontend     │  -->   │ API Routes     │  -->   │ DB Services      │  -->   │ Prisma   │
│ Services     │  <--   │ (App Router)   │  <--   │ (src/lib/services│  <--   │ / DB     │
│ (src/services│        │                │        │ /*.ts)           │        └──────────┘
└──────────────┘        └────────────────┘        └──────────────────┘
       │                         │                           │
       ▼                         ▼                           ▼
 ErrorHandlingService      ProblemDetails RFC7807      Caching / Indexes
 (standard errors)         (standardized responses)    (prisma + SQL)

Observability & Analytics: WebVitalsProvider, logger, metrics store, optimized analytics
```

## **Service Layer Patterns** {#service-layer-patterns}

**Business Logic Separation (MANDATORY)**

- API routes act as thin boundaries. Routes MUST NOT contain Prisma calls, raw
  SQL, or non-trivial query building.
- Put all business logic (query composition, transactions, denormalization,
  normalization of Decimal/dates, cross-entity orchestration) in server DB
  services under `src/lib/services/*`.
- Routes handle only: schema validation (Zod), RBAC/permissions, idempotency
  keys, request-ID propagation, light response shaping, and optional cache
  lookups.
- Raw SQL (`$queryRaw`), `$transaction`, and transformations belong in services.
- Cursor pagination logic for domain lists lives in services; routes simply pass
  typed filters.

Correct vs Wrong

```ts
// ❌ Wrong (route with Prisma/business logic)
import prisma from '@/lib/db/prisma';
export const GET = createRoute({ query: MyQuery }, async ({ query }) => {
  const rows = await prisma.myEntity.findMany({
    where: {
      /*...*/
    },
  });
  return ok({ items: rows });
});

// ✅ Correct (route delegating to service)
import { myEntityService } from '@/lib/services/myEntityService';
export const GET = createRoute({ query: MyQuery }, async ({ query }) => {
  const { items, nextCursor } = await myEntityService.list(query);
  return ok({ items, nextCursor });
});
```

Route Responsibilities

- Validate inputs via feature schemas.
- Enforce authorization with `validateApiPermission`/`withRole`.
- Apply idempotency protection for mutating endpoints when needed.
- Optionally consult/set cache around stable service calls (cache key strategy
  lives near service filters).
- Return standardized envelopes (ProblemDetails/ok).

Service Responsibilities (src/lib/services)

- Build type-safe filters and ordering (including cursor pagination secondary
  sort).
- Execute Prisma queries/transactions and handle integrity checks.
- Normalize data (Decimal → number, null handling, assignedTo flattening) once,
  consistently.
- Emit domain errors via `StandardError` with `ErrorCodes` and metadata.
- Provide stable method signatures (e.g., `list`, `getById`, `create`, `update`,
  `remove`).

Acceptance

- [ ] No new API route imports `@/lib/db/prisma` directly
- [ ] All `$transaction`/`$queryRaw` calls moved to `src/lib/services/*`
- [ ] Cursor pagination implemented in services; routes pass typed filters
- [ ] Transformations centralized in services; routes return validated envelopes
- [ ] Idempotency and RBAC enforced at route layer

## 🔐 Authentication & Route Gating

- All pages under `src/app/(dashboard)/` are gated via `ProtectedLayout` in
  `src/app/(dashboard)/layout.tsx` and require authentication.
- Top-level internal pages are gated client-side using `ClientLayoutWrapper` →
  `AuthProvider` → `ProtectedLayout`:
  - Gated: `/observability`, `/docs`, `/performance` (all subpages),
    `/proposals/preview`, `/dashboard/proposals/create`, dev test pages
    (`/test-error`, `/test-error-boundary`, `/test-proposal`).
  - Public: `/` (marketing/landing), auth routes under `/auth/*`, Next.js
    internals, and API routes as permitted by middleware.
- Server-side protection remains enforced by `middleware.ts` +
  `rbacIntegration.authenticateAndAuthorize`.
- New pages created via migration templates include this gating by default;
  remove it only for truly public pages (e.g., `/`).

Implementation pattern (client wrapper inside a server page):

```tsx
import { ClientLayoutWrapper } from '@/components/layout/ClientLayoutWrapper';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ProtectedLayout } from '@/components/layout';

export default function Page() {
  return (
    <ClientLayoutWrapper>
      <AuthProvider>
        <ProtectedLayout>{/* page content */}</ProtectedLayout>
      </AuthProvider>
    </ClientLayoutWrapper>
  );
}
```

## 🎯 **IMPLEMENTATION PRIORITIES**

1. **[Platform Safeguards & Security](#platform-safeguards--security)**
2. **[Feature Organization](#feature-organization)**
3. **[Database-First Design](#database-first-design)**
4. **[Service Layer Patterns](#service-layer-patterns)**
5. **[State Management](#state-management)**
6. **[Error Handling](#error-handling)**
7. **[Performance & Caching](#performance-caching)**

## 🔒 **PLATFORM SAFEGUARDS & SECURITY**

### **Mandatory Environment Validation**

**Type-Safe Environment Configuration (MANDATORY)**

```typescript
// ✅ CORRECT: Use T3 env-nextjs for type-safe validation
// src/env.mjs - Server-side environment variables
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(['development', 'test', 'production']),
    NEXTAUTH_SECRET: z.string().min(32),
    NEXTAUTH_URL: z.string().url(),
  },
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
});

// ✅ CORRECT: Alternative Zod-based validation
// src/env.ts - Simplified environment validation
export const env = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']),
    DATABASE_URL: z.string().url(),
  })
  .parse(process.env);
```

**Environment Validation Requirements**

- [ ] Use `@t3-oss/env-nextjs` or Zod for all environment variables
- [ ] Validate environment variables at build time, not runtime
- [ ] Separate server-side and client-side environment schemas
- [ ] Use `SKIP_ENV_VALIDATION` for Docker builds when needed
- [ ] Never expose database credentials to client-side code

**📍 Reference Implementation**: `src/env.mjs`, `src/env.ts`

### **Standard Security Headers**

**Production-Grade Security Headers (MANDATORY)**

```typescript
// ✅ CORRECT: Comprehensive security headers in next.config.js
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

async headers() {
  return [
    {
      source: '/(.*)',
      headers: securityHeaders,
    },
    {
      source: '/api/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=300' },
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
        { key: 'Access-Control-Max-Age', value: '86400' },
      ],
    },
  ];
}
```

**Security Headers Requirements**

- [ ] Apply security headers to all routes via `next.config.js`
- [ ] Use environment-specific headers (stricter in production)
- [ ] Include CORS headers for API routes
- [ ] Set appropriate cache headers for static assets
- [ ] Override cache headers for development `_next/static` chunks

**📍 Reference Implementation**: `next.config.js`

### **Edge Rate Limiting & Security Hardening**

**Comprehensive Security Framework (MANDATORY)**

```typescript
// ✅ CORRECT: Rate limiting with in-memory store (edge-safe)
export class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> =
    new Map();

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const request = this.requests.get(identifier);

    if (!request || now > request.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (request.count >= this.maxRequests) {
      return false;
    }

    request.count++;
    return true;
  }
}

// ✅ CORRECT: Input validation and sanitization
export class InputValidator {
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>"'%;()&+]/g, '') // Remove dangerous characters
      .trim()
      .substring(0, 1000); // Limit length
  }

  static validatePassword(password: string): {
    valid: boolean;
    errors: string[];
  } {
    // Comprehensive password validation with strength requirements
  }
}

// ✅ CORRECT: Security middleware application
export function createSecurityMiddleware() {
  return async (request: NextRequest) => {
    const response = NextResponse.next();

    // Apply security headers
    SecurityHeaders.applyToResponse(response);

    // Apply rate limiting
    if (!limiter.isAllowed(ip)) {
      return new NextResponse('Rate limit exceeded', {
        status: 429,
        headers: { 'Retry-After': retryAfter.toString() },
      });
    }

    return response;
  };
}
```

**Security Hardening Requirements**

- [ ] Implement rate limiting for all endpoints (stricter for auth/sensitive
      routes)
- [ ] Use in-memory rate limiters for edge compatibility (no Redis in
      middleware)
- [ ] Apply input sanitization and validation using `InputValidator`
- [ ] Enable CSRF protection for state-changing operations
- [ ] Implement audit logging for security events
- [ ] Use environment-specific security configurations

**📍 Reference Implementation**: `src/lib/security/hardening.ts`

### **Request-ID Propagation**

**Request Correlation & Tracing (MANDATORY)**

```typescript
// ✅ CORRECT: Request ID generation and management
export function getOrCreateRequestId(request: Request): string {
  // Try to get existing request ID from headers
  const existingId = request.headers.get('x-request-id');
  if (existingId) {
    return existingId;
  }

  // Generate new request ID
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function addRequestIdToHeaders(
  headers: Headers,
  requestId: string
): void {
  headers.set('x-request-id', requestId);
}

// ✅ CORRECT: Request ID integration with logging
import { logInfo, logError } from '@/lib/logger';

logInfo('Operation successful', {
  component: 'ServiceName',
  operation: 'methodName',
  requestId, // Automatic request ID correlation
  result: result?.id || 'success',
});
```

**Request-ID Requirements**

- [ ] Generate unique request IDs for all incoming requests
- [ ] Propagate request IDs through all async operations
- [ ] Include request IDs in all log entries for correlation
- [ ] Use UUID format when available, fallback to secure random
- [ ] Extract request IDs from headers or URL parameters
- [ ] Add request IDs to response headers for debugging

**📍 Reference Implementation**: `src/lib/requestId.ts`

### Authorization & RBAC

**Standard Authorization (MANDATORY)**

- Use `validateApiPermission(req, permission)` for API endpoints to enforce
  permissions; prefer capability strings like `"users:read"`,
  `"proposals:update"`.
- For simple role gates, `withRole([roles], handler)` is acceptable; admins
  (`System Administrator` or `Administrator`) bypass checks.
- Never read roles/permissions directly from headers; always derive from the
  NextAuth token.
- Central modules: `src/lib/auth/apiAuthorization.ts`,
  `src/lib/rbac/withRole.ts`.

Acceptance

- [ ] Protected routes call `validateApiPermission` or `withRole`
- [ ] Admin bypass honored; 401/403 semantics consistent
- [ ] No route-local ad hoc role checks

### Seat/Subscription Guardrails

- Server-side guardrails are built into `createRoute` and toggled via env:
  `SEAT_ENFORCEMENT=true`, `SUBSCRIPTION_ENFORCEMENT=true`.
- Admin roles bypass enforcement. Subscription status checked via
  `subscriptionService`; seat availability via `EntitlementService`.
- No route changes required; use only when product policy calls for enforcement.

### **Platform Safeguards Checklist**

**Pre-Implementation Verification**

- [ ] Environment variables validated via `@t3-oss/env-nextjs` or Zod
- [ ] Security headers applied in `next.config.js` for all routes
- [ ] Rate limiting implemented for API endpoints
- [ ] Input validation using `InputValidator` from security hardening
- [ ] Request-ID propagation configured for logging correlation
- [ ] CSRF protection enabled for sensitive operations
- [ ] Audit logging configured for security events
- [ ] Environment-specific security configurations applied

**Runtime Security Verification**

- [ ] Security middleware applied to all routes
- [ ] Rate limits respected (429 responses for violations)
- [ ] Security headers present in HTTP responses
- [ ] Request IDs included in all log entries
- [ ] Input sanitization preventing XSS/SQL injection
- [ ] HTTPS enforcement in production environments

## 🔧 **ERROR HANDLING & TYPE SAFETY**

**🛡️ Centralized Error System with Structured Logging**

```typescript
// ✅ CORRECT: Always use ErrorHandlingService + Structured Logger
import { ErrorHandlingService, ErrorCodes } from '@/lib/errors';
import { logInfo, logError } from '@/lib/logger'; // ✅ Automatic request ID inclusion

try {
  const result = await operation();
  logInfo('Operation successful', {
    component: 'ServiceName',
    operation: 'methodName',
    result: result?.id || 'success',
  });
} catch (error) {
  const processedError = ErrorHandlingService.processError(error);
  logError('Operation failed', {
    component: 'ServiceName',
    operation: 'methodName',
    error: processedError.message,
    errorCode: processedError.code,
  });
  throw processedError;
}
```

**🛡️ ProblemDetails Standard (RFC 7807)**

```typescript
// ✅ CORRECT: Standardized error response format
{
  "type": "https://api.posalpro.com/errors/validation",
  "code": "VAL_4000",
  "message": "Validation failed",
  "fields": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "invalid_string"
    }
  ],
  "timestamp": "2025-09-04T14:12:39.651Z"
}
```

**❌ FORBIDDEN: Custom error handling or console.error**

### API Error Handler

- Use `getErrorHandler({ component, operation })` in API routes for sanitized
  envelopes and structured logging.
- Wrap DB/IO with
  `withAsyncErrorHandler(fn, message, { component, operation })`.
- Prefer `createRoute` for auth/validation/idempotency; never expose stack
  traces.

Example

```ts
import { createRoute } from '@/lib/api/route';
import {
  getErrorHandler,
  withAsyncErrorHandler,
} from '@/server/api/errorHandler';

export const GET = createRoute({ requireAuth: true }, async () => {
  const eh = getErrorHandler({ component: 'EntityAPI', operation: 'GET' });
  try {
    const items = await withAsyncErrorHandler(
      () => prisma.entity.findMany(),
      'Fetch failed',
      {
        component: 'EntityAPI',
        operation: 'GET',
      }
    );
    return eh.createSuccessResponse({ items });
  } catch (err) {
    return eh.createErrorResponse(err, 'Fetch failed');
  }
});
```

Acceptance

- [ ] `getErrorHandler` used in new API routes (set `component`, `operation`)
- [ ] `withAsyncErrorHandler` wraps Prisma/remote calls
- [ ] No `console.*`; no stack traces in responses

**📝 100% TypeScript Compliance**

- `npm run type-check` → 0 errors before commit
- Use consolidated schemas from `src/features/*/schemas.ts`
- Database-first field alignment (check Prisma schema first)
- Centralized query keys from `src/features/*/keys.ts`

## ✅ **SCHEMA & VALIDATION STANDARDS**

**Single Source of Truth (MANDATORY)**

- All Zod schemas for proposals, customers, and products live in
  `src/features/[domain]/schemas.ts`.
- API routes must import schemas from feature modules; avoid route‑local inline
  `z.object` definitions in these domains.
- Exception: highly route‑specific shapes (e.g., raw SQL payloads or Prisma
  native enums) may remain local but must include a comment explaining why.

**Query Parameter Structure Alignment (MANDATORY)**

**Always ensure frontend query parameters match API schema structure. Use direct
parameters for validated fields, filters object only for non-schema
parameters.**

- ✅ **CORRECT**: Direct parameters for validated API fields

```typescript
// Frontend - send category as direct parameter
const params = { category: 'Electronics', limit: 50 };
// Results in: /api/products?category=Electronics&limit=50

// API schema expects: category as direct validated parameter
export const ProductQuerySchema = z.object({
  category: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});
```

- ❌ **FORBIDDEN**: Wrap validated fields in filters object

```typescript
// ❌ WRONG: Category in filters object causes validation mismatch
const params = {
  filters: { category: 'Electronics' },
  limit: 50,
};
// Results in: /api/products?filters[category]=Electronics&limit=50
// API schema doesn't recognize filters[category] as valid
```

**Parameter Alignment Rules:**

- [ ] Check API route schema for expected parameter structure
- [ ] Send validated fields as direct query parameters
- [ ] Use `filters` object only for non-schema parameters (sorting, pagination
      cursors)
- [ ] Test parameter structure with real API calls during development
- [ ] Document parameter structure in feature module `schemas.ts`

**Acceptance Checks**

- [ ] No inline `z.object` in `src/app/api/{proposals,customers,products}` for
      shared shapes
- [ ] Centralized request/response schemas exported from feature `schemas.ts`
- [ ] Response objects validated where appropriate before returning
- [ ] Frontend query parameters match API schema structure exactly

**Consistency Rules**

- Prefer Prisma `select` DTOs that match Zod output exactly.
- Name schemas descriptively: `XxxQuerySchema`, `XxxCreateSchema`,
  `XxxUpdateSchema`, `BulkDeleteSchema`, `VersionsQuerySchema`.
- Coerce/transform at the edges (string→number, dates→ISO strings) inside
  schemas.

> Rationale: Centralizing schemas eliminates drift, improves type safety, and
> keeps UI and API contracts in lockstep. Proper query parameter alignment
> prevents 400 Bad Request validation errors.

## 🎯 **FEATURE ORGANIZATION** {#feature-organization}

**Feature-Based Structure (MANDATORY)**

```typescript
// ✅ CORRECT: Feature-based organization
src/features/proposals/
├── schemas.ts        // All Zod schemas, types, validation
├── keys.ts          // Centralized React Query keys
├── hooks/
│   └── useProposals.ts
└── index.ts         // Consolidated exports

src/features/customers/
├── schemas.ts
├── keys.ts
├── hooks/
└── index.ts

src/features/products/
├── schemas.ts
├── keys.ts
├── hooks/
└── index.ts
```

**📋 Feature Implementation Template**

```typescript
// 1. Schemas (src/features/[domain]/schemas.ts)
export const [Domain]Schema = z.object({...});
export const [Domain]CreateSchema = z.object({...});
export const [Domain]UpdateSchema = z.object({...});

// 2. Query Keys (src/features/[domain]/keys.ts)
export const qk = {
  [domain]: {
    all: ['[domain]'] as const,
    list: (params) => ['[domain]', 'list', ...params] as const,
    byId: (id: string) => ['[domain]', 'byId', id] as const,
  },
} as const;

// 3. Hooks (src/features/[domain]/hooks/use[Domain].ts)
export function use[Domain](params) {
  return useQuery({
    queryKey: qk.[domain].list(params),
    queryFn: () => [domain]Service.get[Domain](params),
  });
}
```

## 🗄️ **DATABASE-FIRST DESIGN** {#database-first-design}

**Database Schema is Source of Truth**

```typescript
// ✅ CORRECT: Align with Prisma schema
model Proposal {
  value             Float?  // Match this exactly
  total             Float   // Match this exactly
  status            ProposalStatus // Use enum values
}

// TypeScript interfaces must match
export interface ProposalData {
  value?: number;           // ✅ Match database
  total: number;            // ✅ Match database
  status: 'DRAFT' | 'SUBMITTED' | ...; // ✅ Match enum
}
```

**❌ FORBIDDEN: Field name mismatches**

```typescript
// ❌ WRONG: Different field names
export interface ProposalData {
  estimatedValue?: number; // ❌ Doesn't match 'value'
  finalTotal: number; // ❌ Doesn't match 'total'
}
```

**Field Alignment Checklist**

- [ ] Check Prisma schema for exact field names
- [ ] Use database enum values exactly
- [ ] Align Zod schemas with database constraints
- [ ] Test with real database data, not mocks

## 🔧 **SERVICE LAYER PATTERNS** {#service-layer-patterns}

**Stateless Service Classes with HTTP Client**

```typescript
// ✅ CORRECT: Service layer pattern
export class [Domain]Service {
  private baseUrl = '/api/[domain]';

  async get[Domain](params: [Domain]QueryParams): Promise<ApiResponse<[Domain]List>> {
    const response = await http.get<[Domain]List>(`${this.baseUrl}?${searchParams}`);
    return { ok: true, data: response };
  }

  async create[Domain](data: [Domain]Create): Promise<ApiResponse<[Domain]>> {
    const validatedData = [Domain]CreateSchema.parse(data);
    const response = await http.post<[Domain]>(this.baseUrl, validatedData);
    return { ok: true, data: response };
  }
}

// Singleton pattern for service instances
export const [domain]Service = new [Domain]Service();
```

**HTTP Client Usage (MANDATORY)**

```typescript
// ✅ CORRECT: Direct data parameter
const response = await http.put<Customer>(
  `/api/customers/${id}`,
  validatedData
);

// ❌ FORBIDDEN: Manual JSON.stringify
const response = await http.put<Customer>(`/api/customers/${id}`, {
  body: JSON.stringify(validatedData),
});
```

**Response Handling (MANDATORY)**

```typescript
// ✅ CORRECT: Let HTTP client handle envelopes
const response = await http.get<CustomerList>(endpoint);
return { ok: true, data: response };

// ❌ FORBIDDEN: Manual envelope handling
const response = await http.get<{ success: boolean; data: CustomerList }>(
  endpoint
);
if (response.success) {
  return { ok: true, data: response.data };
}
```

## 🧠 **STATE MANAGEMENT** {#state-management}

**Zustand for UI State, React Query for Server State**

```typescript
// ✅ CORRECT: UI state in Zustand (ephemeral, client-only)
export const use[Domain]UI = create<[Domain]UIState>()((set, get) => ({
  filters: { search: '', status: 'all' },
  selection: { selectedIds: [] },

  setFilters: (filters) => set({ filters }),
  toggleSelection: (id) => set((state) => ({
    selection: {
      selectedIds: state.selection.selectedIds.includes(id)
        ? state.selection.selectedIds.filter(x => x !== id)
        : [...state.selection.selectedIds, id]
    }
  })),
}));

// ✅ CORRECT: Server state in React Query
export function use[Domain](params) {
  return useQuery({
    queryKey: qk.[domain].list(params),
    queryFn: () => [domain]Service.get[Domain](params),
    staleTime: 30000,
    gcTime: 120000,
  });
}
```

**❌ FORBIDDEN: Server state in Zustand**

```typescript
// ❌ WRONG: Don't store server data in Zustand
export const use[Domain]Store = create((set) => ({
  data: [],           // ❌ Server state belongs in React Query
  isLoading: false,   // ❌ Loading state belongs in React Query
}));
```

**Selector Patterns (MANDATORY)**

```typescript
// ✅ CORRECT: Individual selectors with useShallow
export const useSelectedIds = () =>
  use[Domain]UI(state => state.selection.selectedIds);

export const useSelectionActions = () =>
  use[Domain]UI(useShallow(state => ({
    toggleSelection: state.toggleSelection,
    clearSelection: state.clearSelection,
  })));
```

## ⚡ **PERFORMANCE & CACHING** {#performance-caching}

**React Query Configuration (MANDATORY)**

```typescript
// ✅ CORRECT: Optimized React Query settings
return useQuery({
  queryKey: qk.[domain].list(params),
  queryFn: () => [domain]Service.get[Domain](params),
  staleTime: 30000,        // 30s - data considered fresh
  gcTime: 120000,          // 2min - cache garbage collection
  refetchOnWindowFocus: false,
  retry: 1,
});

// ✅ CORRECT: Immediate cache updates
onSuccess: (response, { id }) => {
  queryClient.setQueryData(qk.[domain].byId(id), response);
  queryClient.invalidateQueries({ queryKey: qk.[domain].all });
}
```

**❌ FORBIDDEN: Long stale times for dynamic data**

```typescript
// ❌ WRONG: Static data settings for dynamic content
return useQuery({
  staleTime: 300000, // ❌ 5min stale time for user data
  gcTime: 600000, // ❌ 10min cache for dynamic content
  refetchOnWindowFocus: true, // ❌ Unnecessary refetches
});
```

**Pagination Patterns (MANDATORY)**

````typescript
// ✅ CORRECT: Cursor-based pagination
return useInfiniteQuery({
  queryKey: qk.[domain].list(params),
  queryFn: ({ pageParam }) => [domain]Service.get[Domain]({
    ...params,
    cursor: pageParam
  }),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

### Server Caching & Redis

- Use `src/lib/redis.ts` helpers (`getCache`, `setCache`, `deleteCache`); no ad‑hoc Maps.
- Enable via `USE_REDIS=true` and `REDIS_URL`. Fallback: in‑memory cache (dev/test).
- Record metrics via `metricsStore` (hits/misses/latency). Short TTLs for auth/session.
- Key prefixes: `session:`, `providers:`, `user:`, `auth:`, `idemp:`.

Example

```ts
import { getCache, setCache } from '@/lib/redis';
import { getErrorHandler } from '@/server/api/errorHandler';

export const GET = createRoute({ requireAuth: true }, async () => {
  const eh = getErrorHandler({ component: 'EntityAPI', operation: 'GET' });
  const key = 'entity:list:v1';
  const cached = await getCache<{ items: any[] }>(key);
  if (cached) return eh.createSuccessResponse(cached);

  const items = await prisma.entity.findMany();
  await setCache(key, { items }, 60);
  return eh.createSuccessResponse({ items });
});
````

Acceptance

- [ ] Server routes/services use `getCache/setCache` where appropriate
- [ ] No route‑local Maps for shared caching concerns
- [ ] TTLs match data sensitivity (auth/session short; lists moderate)
- [ ] No PII cached unless strictly necessary and time‑boxed

````

## 🧩 **CODE USABILITY (NEW COMPONENTS)**

**Design for Reuse and Clarity (MANDATORY)**

- Props API:
  - Keep prop names explicit and consistent across the design system
  - Use narrow, well‑typed props; avoid broad `any` or ambiguous objects
  - Provide sensible defaults; mark truly required props
- Composition:
  - Prefer composition over inheritance
  - Expose building blocks (subcomponents or render props) when useful
- Interop & Styling:
  - Support `className` pass‑through and merge safely
  - Forward refs with `React.forwardRef` for focus/measure/accessibility
  - Avoid leaking internal DOM structure through fragile selectors
- Accessibility:
  - Keyboard navigation and ARIA roles/labels where applicable
  - Meet WCAG 2.1 AA for focus states and contrast
- Performance:
  - Avoid creating new object/array literals in render paths
  - Memoize expensive computations; stabilize callbacks
  - Defer heavy logic until needed (lazy mount where applicable)
- Documentation & Tests:
  - Add concise JSDoc on components and props
  - Include usage examples (or Storybook stories if available)
  - Add basic unit/integration tests for critical behavior

**New Component Checklist**

- [ ] Clear, minimal props API with defaults
- [ ] `className` passthrough and `forwardRef` implemented
- [ ] A11y coverage: roles, labels, keyboard, focus states
- [ ] Stable renders (no unnecessary re‑renders)
- [ ] Examples/tests added alongside the component

> Rationale: Usability standards ensure new components are easy to adopt,
> accessible, and performant, reducing future rework and onboarding cost.

## 🔌 **API ROUTES STANDARD**

**Route Wrapper (MANDATORY)**

- Use `createRoute(config, handler)` from `src/lib/api/route.ts` for new API endpoints.
- Configure `requireAuth`, `roles`, `entitlements`, `query` (Zod), `body` (Zod), and `idempotency`.
- The wrapper adds request-id headers, deprecation/version headers, consistent
  error handling, and idempotent replay.

Example

```ts
import { z } from 'zod';
import { createRoute } from '@/lib/api/route';
import { single } from '@/lib/api/response';

const Query = z.object({ id: z.string().uuid() });

export const GET = createRoute(
  { requireAuth: true, query: Query },
  async ({ query }) => {
    const item = await repo.getById(query.id);
    return single(item);
  }
);
````

Idempotency

- For POST/PUT/PATCH/DELETE, the wrapper auto-caches by `Idempotency-Key` when
  present.
- For custom flows use `src/server/api/idempotency.ts` helpers directly.

Acceptance

- [ ] New API routes use `createRoute`
- [ ] Zod schemas validated in wrapper, not route body
- [ ] Idempotency honored for mutating endpoints
- [ ] Entitlements declared for premium/tenant features when applicable

### API Response Envelope

- API endpoints return `{ ok: true|false, data|code|message }` using helpers in
  `src/lib/api/response.ts`.
- Frontend services must unwrap and return domain data only; components never
  see envelopes.
- The centralized HTTP client `@/lib/http` detects envelopes and throws
  `HttpClientError` on `{ ok: false }`.

Acceptance

- [ ] API returns `ok/data` or ProblemDetails on error
- [ ] Frontend services unwrap and return plain domain objects

### CORS & Middleware

- CORS is enforced in `middleware.ts` using `CORS_ORIGINS` (comma list);
  responses include `Vary` and limited headers.
- Security headers and rate limiting are applied at the edge; `x-request-id` is
  attached to every response.
- PWA assets (`/sw.js`, `/icons/*`, `/manifest.json`) bypass heavy checks.

## 🎯 **TIPS & TRICKS** {#tips-tricks}

**Development Workflow**

- Test with real database data, never mocks
- Use feature flags for gradual rollouts
- Keep development and production environments consistent
- Follow established CLI patterns for testing

**Debugging Patterns**

- Use structured logger with automatic request ID correlation
- Leverage development tools for cache and performance issues
- Monitor API responses and memory usage in development
- Use request IDs for tracing across all layers

**Performance Monitoring**

- Monitor for unnecessary re-renders
- Track bundle size and API response times
- Use performance tools for optimization
- Establish performance budgets and monitoring

## ⚠️ **WHAT NOT TO DO** {#what-not-to-do}

**❌ Anti-Patterns to Avoid**

1. **Don't create new APIs when existing ones work**
2. **Don't use composite hooks that create objects on every render**
3. **Don't manually handle API response envelopes**
4. **Don't store server state in Zustand stores**
5. **Don't use long stale times for frequently updated data**
6. **Don't create dynamic component IDs with random values**
7. **Don't bypass React Query for complex data fetching**
8. **Don't use console.log/console.error in production code - use structured
   logger**
9. **Don't implement custom caching systems**
10. **Don't ignore TypeScript strict mode errors**

**❌ Common Implementation Mistakes**

- Array access on individual selectors instead of proper selector usage
- Inline useMemo in JSX causing hook order violations
- Missing or incorrect dependency arrays in useEffect/useCallback
- Unstable callback dependencies causing infinite re-renders
- Manual JSON serialization in HTTP client calls
- Using console.log/console.error instead of structured logging
- Response format mismatches between layers

### **Data Flow Consistency**

**Consistent Data Patterns**: Maintain uniform data structures across all
layers.

- **Service Layer**: Return domain data directly (unwrapped)
- **Hook Layer**: Handle data access patterns consistently
- **Component Layer**: Use hooks for data access, not direct service calls
- **Schema Layer**: Match API response structure exactly

**Prevention**: Establish data patterns during initial implementation to avoid
cleanup phases.

## 🛡️ **WHAT TO TAKE CARE OF** {#what-to-take-care}

**Critical Success Factors**

1. **Platform Safeguards**: Environment validation, security headers, rate
   limiting, and request-ID propagation
2. **Authorization**: Use `validateApiPermission`/`withRole` in API routes
3. **Database Schema Alignment**: Always check database schema first
4. **Type Safety**: 100% TypeScript compliance, no `any` types
5. **Structured Logging**: Use centralized logging with request correlation
6. **Route Boundaries**: Every route must have loading.tsx and error.tsx
7. **Error Handling**: Comprehensive error boundaries and processing
8. **Performance**: Monitor bundle size and runtime performance
9. **Accessibility**: WCAG 2.1 AA compliance for all UI components
10. **Security**: Input validation, authorization, secure defaults
11. **API Security**: Protect sensitive endpoints with proper authentication
12. **Data Integrity**: Prevent duplicates and ensure consistency
13. **User Experience**: Loading states and error recovery mechanisms
14. **Testing**: Real data testing with comprehensive coverage
15. **Documentation**: Update docs after every implementation
16. **Analytics**: Track user interactions and feature validation
17. **Mobile Responsiveness**: Touch targets, responsive design
18. **Background Processing**: Async operations with proper patterns
19. **Data Management**: Consistent seed data and testing environments
20. **Database Safety**: Defensive programming and null checks
21. **Testing Infrastructure**: Comprehensive CLI and automated testing

**Quality Gates**

- [ ] Platform safeguards implemented (environment validation, security headers,
      rate limiting, request-ID propagation)
- [ ] API routes use `createRoute` and permission checks
- [ ] Route boundaries implemented (loading.tsx and error.tsx for all routes)
- [ ] Type checking passes with no errors
- [ ] No duplicate implementations or conflicts
- [ ] Build process completes successfully
- [ ] Performance standards met
- [ ] All API endpoints tested
- [ ] Seed data created and functional
- [ ] CLI commands tested and working
- [ ] Error handling verified
- [ ] Component traceability maintained
- [ ] Documentation updated after implementation

## 📚 **REFERENCE DOCUMENTS**

**Mandatory Reading (Pre-Implementation)**

- **PROJECT_REFERENCE.md**: Architecture overview and API documentation
- **DEVELOPMENT_STANDARDS.md**: Code quality and implementation patterns
- **Structured Logger**: Use `@/lib/logger` for all logging with automatic
  request ID correlation

**Implementation References**

- Review existing feature modules for patterns and structure
- Check shared hooks in `src/hooks/` before creating new ones
- Follow established service patterns in `src/services/`
- Use store patterns from `src/lib/store/` for state management

## 🗄️ Environment & Database

**Prisma Engine/URL Alignment (MANDATORY)**

- Local dev uses PostgreSQL URLs (`postgresql://…`) and standard client engine.
- Data Proxy/Accelerate requires `prisma://…` and
  `PRISMA_CLIENT_ENGINE_TYPE=dataproxy` or `PRISMA_ACCELERATE_URL`.
- The client validates mismatch early; see `src/lib/db/prisma.ts` diagnostics
  and errors.

Acceptance

- [ ] `DATABASE_URL` protocol matches engine mode
- [ ] No Data Proxy vars set for local PostgreSQL

## 🏁 Feature Flags

- Provide feature toggles via `FlagsProvider`
  (`src/components/providers/FlagsProvider.tsx`).
- Read flags with `useFeatureFlag(key)`; default values come from env-configured
  `getFeatureFlags()`.
- Gate new features and experiments behind flags; default safe-off in
  production.

---

## 📋 **HOW TO USE THIS DOCUMENT**

**This is your high-level reference for all implementations**. Attach this
document to every Cursor prompt when working on new features.

**Quick Reference Flow:**

1. **Check existing implementations first** (`npm run audit:duplicates`)
2. **Follow Feature-Based Architecture** (`src/features/[domain]/`)
3. **Database-First Design** (check Prisma schema)
4. **Implement Route Boundaries** (loading.tsx and error.tsx for all routes)
5. **Use modern patterns** (React Query + Zustand + Service Layer)
6. **Use structured logging** (`@/lib/logger`) with automatic request ID
   correlation
7. **Reference existing feature modules for patterns**

**Key Sections to Reference:**

- **Feature Organization** - How to structure new domains
- **Database-First Design** - Field alignment patterns
- **Service Layer Patterns** - HTTP client usage
- **State Management** - Zustand vs React Query
- **What NOT to Do** - Common anti-patterns to avoid
- **Tips & Tricks** - Development workflow patterns

**🎯 Implementation Principle**: Follow established patterns while adapting to
specific domain requirements.

---

## 🔐 Entitlements & Feature Gating

- Enforce premium features on the server using `createRoute` with `entitlements`
  in the route config. This is mandatory for security.
- Optional client-side UX gating uses `FeatureGate`/`FeatureLockedBanner` to
  hide panels when a tenant lacks a feature. Client gating does not replace
  server checks.
- Entitlements are stored per-tenant in the `Entitlement` table and cached
  server-side for performance.
- Developer tooling:
  - Seed default dev entitlements in `prisma/seed.ts` (tenant `tenant_default`).
  - Toggle at runtime:
    `node scripts/toggle-entitlement.js <tenantId> <key> <enable|disable> [value]`.
- See `docs/FEATURE_GATE_USAGE.md` for examples and patterns.
