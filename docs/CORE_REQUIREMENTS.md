# CORE REQUIREMENTS (Non-Negotiable)

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

src/services/        # Service layer (stateless, HTTP client)
src/lib/store/       # Zustand stores (UI state only)
src/hooks/          # Shared React Query hooks
```

**📊 Data Flow Architecture:**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   UI        │───▶│ React Query │───▶│  Service    │
│ Components  │    │   Hooks     │    │   Layer     │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Zustand     │    │ Centralized │    │   API       │
│ UI State    │    │ Query Keys  │    │  Routes     │
└─────────────┘    └─────────────┘    └─────────────┘
                                               │
                                               ▼
                                       ┌─────────────┐
                                       │  Database   │
                                       │   Schema    │
                                       └─────────────┘
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
import { logInfo, logError } from '@/lib/log';

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
import { logInfo, logError } from '@/lib/log'; // ✅ Automatic request ID inclusion

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

**❌ FORBIDDEN: Custom error handling or console.error**

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

**Acceptance Checks**

- [ ] No inline `z.object` in `src/app/api/{proposals,customers,products}` for
      shared shapes
- [ ] Centralized request/response schemas exported from feature `schemas.ts`
- [ ] Response objects validated where appropriate before returning

**Consistency Rules**

- Prefer Prisma `select` DTOs that match Zod output exactly.
- Name schemas descriptively: `XxxQuerySchema`, `XxxCreateSchema`,
  `XxxUpdateSchema`, `BulkDeleteSchema`, `VersionsQuerySchema`.
- Coerce/transform at the edges (string→number, dates→ISO strings) inside
  schemas.

> Rationale: Centralizing schemas eliminates drift, improves type safety, and
> keeps UI and API contracts in lockstep.

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

```typescript
// ✅ CORRECT: Cursor-based pagination
return useInfiniteQuery({
  queryKey: qk.[domain].list(params),
  queryFn: ({ pageParam }) => [domain]Service.get[Domain]({
    ...params,
    cursor: pageParam
  }),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

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

## 🎯 **TIPS & TRICKS** {#tips-tricks}

**Development Workflow**

- Use `npm run app:cli` for API testing with real auth
- Test with real database data, never mocks
- Use feature flags for gradual rollouts
- Keep development and production environments identical

**Debugging Patterns**

- Use structured logger (`@/lib/log`) with automatic request ID correlation
- Check React Query DevTools for cache issues
- Use browser network tab for API debugging
- Monitor memory usage in development
- Search logs by requestId for complete request tracing

**Performance Monitoring**

- Watch for infinite re-renders with React DevTools
- Monitor bundle size with `npm run build`
- Use Lighthouse for performance audits
- Track API response times

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

**❌ Common Mistakes**

- Array access on individual selectors (`stepData[1]` instead of
  `useStepData(1)`)
- Inline useMemo in JSX causing hook order violations
- Missing dependency arrays in useEffect
- Unstable callback dependencies causing infinite loops
- Manual JSON serialization in HTTP client calls
- Using console.log/console.error instead of structured logger (`@/lib/log`)
- **Multi-layer response format mismatch** (`data.field` vs `data.data.field`)

### **Multi-Layer Response Format Coordination (MANDATORY)**

**✅ SUCCESS**: Systematic standardization achieved across entire codebase.

**Success Metrics**:

- ✅ **0 TypeScript compilation errors**
- ✅ **All service methods return consistent unwrapped data**
- ✅ **All hooks handle unwrapped data correctly**
- ✅ **Data flows seamlessly from API → Service → Hook → Component**
- ✅ **Production-ready codebase** (102/102 static pages generated)

#### **Service Layer (MANDATORY)**

```typescript
// ✅ CORRECT: Always return unwrapped domain data
async getData(): Promise<DomainData> {
  const response = await http.get<DomainData>(endpoint);
  return response; // ✅ Return unwrapped data directly
}

// ✅ APPLIED: Admin, Proposal, Product services standardized
async getUsers(): Promise<UsersListResponse> {
  const response = await http.get<UsersListResponse>(endpoint);
  return response; // ✅ Unwrapped data pattern
}
```

#### **Hook Layer (MANDATORY)**

```typescript
// ✅ CORRECT: Direct data access without ApiResponse wrapper
export function useDomainData(params) {
  return useQuery({ ... }); // ✅ No explicit return type annotation
}

// ✅ APPLIED: All hooks updated for unwrapped data
const result = await adminService.getRoles({...});
return result.roles || []; // ✅ Direct property access
```

#### **Component Layer (MANDATORY)**

```typescript
// ✅ CORRECT: Direct data access from hooks
const { data, isLoading } = useDomainData(params);
useEffect(() => {
  if (data?.items) {
    // ✅ Handle unwrapped data structure
    setState(data.items);
  }
}, [data]);
```

#### **Schema Layer (MANDATORY)**

```typescript
// ✅ CORRECT: Match actual API response structure
export const DomainResponseSchema = z.object({
  // Include ALL fields actually returned by API
  items: z.array(DomainSchema),
  nextCursor: z.string().nullable(),
  meta: z.object({...}).optional(),
});
```

**Prevention**: Apply unwrapped data pattern during initial implementation, not
cleanup phase. Services throw errors instead of returning ApiResponse error
objects.

## 🛡️ **WHAT TO TAKE CARE OF** {#what-to-take-care}

**Critical Success Factors**

1. **Platform Safeguards**: Environment validation, security headers, rate
   limiting, and request-ID propagation
2. **Database Schema Alignment**: Always check Prisma schema first
3. **Type Safety**: 100% TypeScript compliance, no `any` types
4. **Structured Logging**: Use `@/lib/log` for all logging with automatic
   request ID correlation
5. **Error Boundaries**: Every async operation must have error handling
6. **Performance Budget**: Monitor bundle size and runtime performance
7. **Accessibility**: WCAG 2.1 AA compliance for all UI components
8. **Security**: Input validation, RBAC enforcement, secure defaults
9. **API Key Protection**: Use `assertApiKey()` for sensitive endpoints with
   scoped access
10. **Idempotency**: Protect POST operations with `assertIdempotent()` to
    prevent duplicates
11. **Error Boundaries**: Use `src/app/error.tsx` for route errors and
    `src/app/global-error.tsx` for root errors
12. **Testing**: Real data testing, not mocks
13. **Documentation**: Update docs after every implementation
14. **Analytics**: Track user interactions and hypothesis validation
15. **Mobile Responsiveness**: Touch targets, responsive design
16. **Background Processing**: Use outbox pattern with `jobs:drain` CLI command
    for async operations
17. **Seed Data Management**: Use `npm run db:seed` for consistent QA testing
    environments
18. **Database Safety**: Include null checks and defensive programming in
    migrations
19. **CLI Testing Infrastructure**: Use `npm run app:cli` commands for
    comprehensive testing

**Quality Gates**

- [ ] Platform safeguards implemented (environment validation, security headers,
      rate limiting, request-ID propagation)
- [ ] `npm run type-check` passes (0 errors)
- [ ] `npm run audit:duplicates` shows no conflicts
- [ ] `npm run build` succeeds
- [ ] Lighthouse score >85 for performance
- [ ] All API routes tested with `npm run app:cli`
- [ ] Seed data created successfully (`npm run db:seed`)
- [ ] CLI commands tested (`npm run app:cli jobs:drain`, `jobs:test`)
- [ ] Error boundaries verified (`/test-error`, `/test-error-simple`)
- [ ] Component Traceability Matrix updated
- [ ] Documentation updated in IMPLEMENTATION_LOG.md

## 📚 **REFERENCE DOCUMENTS**

**Mandatory Reading (Pre-Implementation)**

- **MIGRATION_LESSONS.md**: Real-world patterns and anti-patterns
- **PROPOSAL_MIGRATION_ASSESSMENT.md**: Complete implementation blueprint
- **PROJECT_REFERENCE.md**: Architecture overview and API docs
- **DEVELOPMENT_STANDARDS.md**: Code quality and patterns
- **seed-data-usage.md**: Complete seed data and QA testing guide
- **error-boundaries-usage.md**: Error boundary implementation and testing guide
- **Structured Logger**: Use `@/lib/log` for all logging (automatic request ID
  correlation)

**Implementation References**

- Use proposal/customer/product modules as gold standards
- Check existing hooks in `src/hooks/` before creating new ones
- Review service patterns in `src/services/`
- Follow store patterns in `src/lib/store/`

---

**🎯 Remember**: This document reflects the actual working patterns from your
modern implementation. Always reference the working code in
proposal/customer/product modules when in doubt.\*\*

---

## 📋 **HOW TO USE THIS DOCUMENT**

**This is your high-level reference for all implementations**. Attach this
document to every Cursor prompt when working on new features.

**Quick Reference Flow:**

1. **Check existing implementations first** (`npm run audit:duplicates`)
2. **Follow Feature-Based Architecture** (src/features/[domain]/)
3. **Database-First Design** (check Prisma schema)
4. **Use modern patterns** (React Query + Zustand + Service Layer)
5. **Use structured logging** (`@/lib/log`) with automatic request ID
   correlation
6. **Reference working modules** (proposal/customer/product)

**Key Sections to Reference:**

- **Feature Organization** - How to structure new domains
- **Database-First Design** - Field alignment patterns
- **Service Layer Patterns** - HTTP client usage
- **State Management** - Zustand vs React Query
- **What NOT to Do** - Common anti-patterns to avoid
- **Tips & Tricks** - Development workflow patterns

**🎯 Gold Standard**: Use proposal/customer/product modules as templates for all
new implementations.\*\*
