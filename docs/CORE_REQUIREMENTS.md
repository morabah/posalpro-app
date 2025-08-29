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

1. **[Feature Organization](#feature-organization)**
2. **[Database-First Design](#database-first-design)**
3. **[Service Layer Patterns](#service-layer-patterns)**
4. **[State Management](#state-management)**
5. **[Error Handling](#error-handling)**
6. **[Performance & Caching](#performance-caching)**

## 🔧 **ERROR HANDLING & TYPE SAFETY**

**🛡️ Centralized Error System**

```typescript
// ✅ CORRECT: Always use ErrorHandlingService
import { ErrorHandlingService, ErrorCodes } from '@/lib/errors';

try {
  const result = await operation();
  logInfo('Success', { result });
} catch (error) {
  const processedError = ErrorHandlingService.processError(error);
  logError('Failed', { error: processedError });
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
- Exception: highly route‑specific shapes (e.g., raw SQL payloads or Prisma native enums)
  may remain local but must include a comment explaining why.

**Acceptance Checks**

- [ ] No inline `z.object` in `src/app/api/{proposals,customers,products}` for shared shapes
- [ ] Centralized request/response schemas exported from feature `schemas.ts`
- [ ] Response objects validated where appropriate before returning

**Consistency Rules**

- Prefer Prisma `select` DTOs that match Zod output exactly.
- Name schemas descriptively: `XxxQuerySchema`, `XxxCreateSchema`,
  `XxxUpdateSchema`, `BulkDeleteSchema`, `VersionsQuerySchema`.
- Coerce/transform at the edges (string→number, dates→ISO strings) inside schemas.

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

- Use structured logging with correlation IDs
- Check React Query DevTools for cache issues
- Use browser network tab for API debugging
- Monitor memory usage in development

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
8. **Don't use console.log in production code**
9. **Don't implement custom caching systems**
10. **Don't ignore TypeScript strict mode errors**

**❌ Common Mistakes**

- Array access on individual selectors (`stepData[1]` instead of
  `useStepData(1)`)
- Inline useMemo in JSX causing hook order violations
- Missing dependency arrays in useEffect
- Unstable callback dependencies causing infinite loops
- Manual JSON serialization in HTTP client calls

## 🛡️ **WHAT TO TAKE CARE OF** {#what-to-take-care}

**Critical Success Factors**

1. **Database Schema Alignment**: Always check Prisma schema first
2. **Type Safety**: 100% TypeScript compliance, no `any` types
3. **Error Boundaries**: Every async operation must have error handling
4. **Performance Budget**: Monitor bundle size and runtime performance
5. **Accessibility**: WCAG 2.1 AA compliance for all UI components
6. **Security**: Input validation, RBAC enforcement, secure defaults
7. **Testing**: Real data testing, not mocks
8. **Documentation**: Update docs after every implementation
9. **Analytics**: Track user interactions and hypothesis validation
10. **Mobile Responsiveness**: Touch targets, responsive design

**Quality Gates**

- [ ] `npm run type-check` passes (0 errors)
- [ ] `npm run audit:duplicates` shows no conflicts
- [ ] `npm run build` succeeds
- [ ] Lighthouse score >85 for performance
- [ ] All API routes tested with `npm run app:cli`
- [ ] Component Traceability Matrix updated
- [ ] Documentation updated in IMPLEMENTATION_LOG.md

## 📚 **REFERENCE DOCUMENTS**

**Mandatory Reading (Pre-Implementation)**

- **MIGRATION_LESSONS.md**: Real-world patterns and anti-patterns
- **PROPOSAL_MIGRATION_ASSESSMENT.md**: Complete implementation blueprint
- **PROJECT_REFERENCE.md**: Architecture overview and API docs
- **DEVELOPMENT_STANDARDS.md**: Code quality and patterns

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
5. **Reference working modules** (proposal/customer/product)

**Key Sections to Reference:**

- **Feature Organization** - How to structure new domains
- **Database-First Design** - Field alignment patterns
- **Service Layer Patterns** - HTTP client usage
- **State Management** - Zustand vs React Query
- **What NOT to Do** - Common anti-patterns to avoid
- **Tips & Tricks** - Development workflow patterns

**🎯 Gold Standard**: Use proposal/customer/product modules as templates for all
new implementations.\*\*
