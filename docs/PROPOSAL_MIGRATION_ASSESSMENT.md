# Proposal Migration Assessment & Plan

## 🚨 **CRITICAL LESSONS LEARNED FROM PRODUCT MIGRATION**

### **⚠️ CRITICAL ISSUES ENCOUNTERED & SOLUTIONS**

#### **1. Complex Workflow Management**

**❌ PROBLEM**: Proposal system has complex multi-step workflows that are
difficult to migrate **✅ SOLUTION**:

- Migrate workflow engine separately from core proposal functionality
- Keep existing workflow components during migration
- Use feature flags to switch between old and new implementations
- Preserve all workflow states and transitions
- **ENHANCED**: Use database-first field alignment for workflow state management

#### **2. Bridge Pattern Dependencies**

**❌ PROBLEM**: Proposal system heavily uses bridge pattern with complex state
management **✅ SOLUTION**:

- Migrate core proposal CRUD operations first
- Keep bridge pattern for workflow management initially
- Gradually replace bridge components with modern architecture
- Maintain backward compatibility during transition
- **ENHANCED**: Use stable state management patterns with individual selectors

#### **3. Multi-Step Form Complexity**

**❌ PROBLEM**: ProposalWizard has 6 complex steps with interdependent data **✅
SOLUTION**:

- Break down wizard into smaller, manageable components
- Use modern form validation patterns
- Implement proper state management for multi-step forms
- Preserve all existing validation logic
- **ENHANCED**: Use functional updates with stable dependencies to prevent
  infinite loops

#### **4. API Integration & Response Format Issues**

**❌ PROBLEM**: Inconsistent API endpoints and response formats **✅ SOLUTION**:

- Use existing working APIs with dual format support
- Support both `ok` and `success` response envelopes
- Maintain consistent return types in service layer
- **ENHANCED**: Always check existing implementations first before creating new
  ones

#### **5. Data Flow & Validation Issues**

**❌ PROBLEM**: Field name inconsistencies and validation failures **✅
SOLUTION**:

- Use database-first field alignment across all layers
- Implement defensive validation with `.or(z.null())` for optional fields
- Ensure consistent field names from database schema to UI components
- **ENHANCED**: Start with database schema as single source of truth

#### **6. State Management & Performance Issues**

**❌ PROBLEM**: Infinite loops, unstable selectors, performance degradation **✅
SOLUTION**:

- Use individual selectors instead of composite hooks
- Implement functional updates with stable dependencies
- Use empty dependency arrays for initialization effects
- **ENHANCED**: Avoid including unstable functions in useEffect dependencies

#### **7. Cache Management & Data Consistency**

**❌ PROBLEM**: Stale data, inconsistent UI updates, cache invalidation issues
**✅ SOLUTION**:

- Use aggressive cache management with immediate updates
- Implement comprehensive cache invalidation
- Use short stale times for frequently updated data
- **ENHANCED**: Use setQueryData for snappy UI updates

#### **8. Error Handling & Debugging**

**❌ PROBLEM**: Inconsistent error handling, poor debugging visibility **✅
SOLUTION**:

- Implement centralized error handling with StandardError
- Use structured logging at critical points
- Include request IDs in error messages for support
- **ENHANCED**: Use user-friendly error messages with actionable feedback

## 🎯 **Current Proposal Implementation Analysis**

### **Existing Proposal Architecture (Bridge Pattern)**

#### **✅ What We Have (Current State)**

**Infrastructure Files:**

- `src/lib/bridges/ProposalApiBridge.ts` - API Bridge (973 lines) ⚠️ MEDIUM
  COMPLEXITY
- `src/lib/bridges/ProposalDetailApiBridge.ts` - Detail Bridge
- `src/components/bridges/ProposalManagementBridge.tsx` - Context provider (818
  lines)
- `src/lib/services/proposalService.ts` - Service layer (1,587 lines) ✅
  WELL-STRUCTURED
- `src/hooks/useProposals.ts` - React Query hook (442 lines) ✅ MODERN PATTERN

**UI Components:**

- `src/components/proposals/ProposalWizard.tsx` - Main wizard (3,279 lines) ⚠️
  VERY LARGE
- `src/components/proposals/ApprovalQueue.tsx` - Queue management (929 lines) ✅
  REACT QUERY
- `src/components/proposals/ProposalCard.tsx` - Card component (3,949 bytes) ✅
  GOOD
- `src/components/proposals/WizardSummary.tsx` - Summary (22,283 bytes) ⚠️ LARGE
- `src/components/proposals/DecisionInterface.tsx` - Decision UI (31,616 bytes)
  ⚠️ VERY LARGE
- `src/components/proposals/WorkflowOrchestrator.tsx` - Workflow (18,946 bytes)
  ⚠️ LARGE

**Wizard Steps:**

- `src/components/proposals/steps/BasicInformationStep.tsx`
- `src/components/proposals/steps/TeamAssignmentStep.tsx`
- `src/components/proposals/steps/ContentSelectionStep.tsx`
- `src/components/proposals/steps/ProductSelectionStep.tsx`
- `src/components/proposals/steps/SectionAssignmentStep.tsx`
- `src/components/proposals/steps/ReviewStep.tsx`

**Pages:**

- `src/app/(dashboard)/proposals/page.tsx` - Main page (6,355 bytes) ✅ GOOD
- `src/app/(dashboard)/proposals/[id]/` - Detail pages
- `src/app/(dashboard)/proposals/approve/` - Approval pages
- `src/app/(dashboard)/proposals/manage/` - Management pages
- `src/app/proposals/create/page.tsx` - Create page ✅ OPTIMIZED

**API Routes:**

- `src/app/api/proposals/route.ts` - Main CRUD (1,845 lines) ✅ OPTIMIZED
- `src/app/api/proposals/[id]/` - Individual operations
- `src/app/api/proposals/analytics/` - Analytics endpoints (6 routes)
- `src/app/api/proposals/queue/` - Queue operations
- `src/app/api/proposals/stats/` - Statistics

**Hooks:**

- `src/hooks/useProposals.ts` - Main proposals hook (442 lines)
- `src/hooks/proposals/useProposalDetailBridge.ts` - Detail bridge hook (840
  lines)
- `src/hooks/proposals/useProposalCreationAnalytics.ts` - Analytics hook (381
  lines)

**Types & Validation:**

- `src/types/entities/proposal.ts` - Type definitions ✅ GOOD
- `src/types/proposals/` - Additional proposal types
- `src/lib/validation/schemas/proposal.ts` - Zod schemas ✅ GOOD
- `src/lib/entities/proposal.ts` - Entity definitions

**Specialized Services:**

- `src/lib/services/ProposalDenormalizationService.ts` - Data denormalization
- `src/lib/utils/proposal-metadata.ts` - Metadata utilities
- `src/lib/api/endpoints/proposals.ts` - API endpoint definitions
- `src/lib/api/endpoints/proposals.formatter.ts` - Response formatting

#### **❌ Current Issues Identified**

1. **Mixed Architecture Patterns:**
   - Some components use bridge pattern (ProposalManagementBridge.tsx)
   - Others use modern React Query (ApprovalQueue.tsx, useProposals.ts)
   - Inconsistent data fetching approaches
   - Direct database access in API routes (no createRoute wrapper)
   - **ENHANCED**: Inconsistent HTTP client usage patterns across services

2. **Component Size Issues:**
   - ProposalWizard.tsx (3,279 lines) - TOO LARGE
   - DecisionInterface.tsx (31,616 bytes) - TOO LARGE
   - WizardSummary.tsx (22,283 bytes) - TOO LARGE
   - WorkflowOrchestrator.tsx (18,946 bytes) - TOO LARGE

3. **Performance Concerns:**
   - Large components causing webpack chunk loading issues
   - Complex state management in ProposalWizard
   - Heavy analytics integration
   - Multiple layers of caching (bridge + React Query)
   - **ENHANCED**: Potential infinite loops from unstable useEffect dependencies

4. **Code Duplication:**
   - Multiple bridge implementations
   - Duplicate type definitions
   - Overlapping validation schemas
   - ProposalWizard vs individual step components (similar functionality)
   - **ENHANCED**: Inconsistent field naming across database, API, and UI layers

5. **Type Safety Issues:**
   - Extensive use of "any" types throughout the codebase
   - API response format mismatches between routes and components
   - Inconsistent type definitions between bridge and direct implementations
   - Missing TypeScript strict mode compliance
   - **ENHANCED**: Missing defensive validation for optional fields

6. **Data Flow Issues:**
   - **ENHANCED**: Field name inconsistencies between database schema and UI
     components
   - **ENHANCED**: Missing null handling for optional numeric fields
   - **ENHANCED**: Inconsistent API response envelope handling

7. **State Management Issues:**
   - **ENHANCED**: Potential composite hooks creating new objects on every
     render
   - **ENHANCED**: Unstable callback dependencies in useEffect hooks
   - **ENHANCED**: Missing individual selectors for optimized re-renders

8. **Cache Management Issues:**
   - **ENHANCED**: Long stale times preventing immediate UI updates
   - **ENHANCED**: Insufficient cache invalidation strategies
   - **ENHANCED**: Missing immediate cache updates with setQueryData

9. **Error Handling Issues:**
   - **ENHANCED**: Missing structured logging at critical points
   - **ENHANCED**: Inconsistent error formats across components
   - **ENHANCED**: Poor error traceability without request IDs

## 🚀 **Modern Implementation Patterns (Updated from Codebase Analysis)**

### **✅ PROVEN MODERN PATTERNS TO FOLLOW**

#### **1. Contracts First (Single Source of Truth)**

**Pattern**: `src/features/<domain>/schemas.ts` - Zod DTOs for both server and
client

```typescript
// ✅ MODERN PATTERN - Contracts first with Zod DTOs
// src/features/products/schemas.ts
import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive').optional().or(z.null()),
  currency: z.string().default('USD'),
  sku: z.string(),
  category: z.array(z.string()),
  tags: z.array(z.string()),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ProductListSchema = z.object({
  items: z.array(ProductSchema),
  nextCursor: z.string().nullable(),
});

export const ProductQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'name', 'price']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  cursor: z.string().nullable().optional(),
});

// Typed exports
export type Product = z.infer<typeof ProductSchema>;
export type ProductList = z.infer<typeof ProductListSchema>;
export type ProductQuery = z.infer<typeof ProductQuerySchema>;
```

**Key Principle**: Use the same Zod schemas on both server (input validation)
and client (response parsing) for type safety and consistency.

#### **2. Service Layer (Tiny, Reliable)**

**Pattern**: `src/features/<domain>/services.ts` - One http() helper with Zod
parsing

```typescript
// ✅ MODERN PATTERN - Service layer with http() helper
// src/lib/http.ts
export async function http<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const body = await (async () => {
    try {
      return await res.json();
    } catch {
      return undefined;
    }
  })();

  const reqId = res.headers.get('x-request-id') ?? undefined;

  if (!res.ok) {
    const e = new Error(body?.message ?? `HTTP ${res.status}`);
    (e as any).code = body?.code ?? 'HTTP_ERROR';
    (e as any).requestId = reqId;
    throw e;
  }

  return body as T;
}

// src/features/products/services.ts
import { ProductList } from './schemas';

export const productService = {
  list: async (q: {
    search?: string;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    cursor?: string | null;
  }) =>
    ProductList.parse(
      await http(
        `/api/products?${new URLSearchParams(
          Object.entries(q).filter(
            ([, v]) => v !== undefined && v !== null
          ) as any
        )}`
      )
    ),
};
```

**Key Features**:

- **Single http() helper**: Sets JSON headers, parses response, throws Error
  with .code and .requestId
- **Defensive programming**: Parse with Zod on client too (keeps bugs local)
- **Type safety**: Full TypeScript support with generic types
- **Error handling**: Consistent error format with request IDs

#### **3. Centralized Query Keys**

**Pattern**: `src/features/*/keys.ts` - Centralized query key management

```typescript
// ✅ MODERN PATTERN - Centralized query keys
// src/features/proposals/keys.ts
export const qk = {
  proposals: {
    all: ['proposals'] as const,
    list: (search: string, limit: number, sortBy: string, sortOrder: string) =>
      ['proposals', 'list', search, limit, sortBy, sortOrder] as const,
    byId: (id: string) => ['proposals', 'byId', id] as const,
    stats: () => ['proposals', 'stats'] as const,
  },
} as const;
```

#### **3. React Query Hooks with useHttpClient**

**Pattern**: `src/hooks/useProducts.ts` - Modern React Query implementation

```typescript
// ✅ MODERN PATTERN - React Query hooks with useHttpClient
import { qk } from '@/features/products/keys';
import { useHttpClient } from '@/hooks/useHttpClient';

export function useInfiniteProductsMigrated({
  search = '',
  limit = 20,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}: ProductQuery = {}) {
  const { get } = useHttpClient();

  return useInfiniteQuery({
    queryKey: qk.products.list(search, limit, sortBy, sortOrder),
    queryFn: async ({ pageParam }) => {
      logDebug('Fetching products with cursor pagination', {
        component: 'useInfiniteProductsMigrated',
        operation: 'queryFn',
        // ... metadata
      });

      const params = new URLSearchParams();
      // ... build params

      const response = await get<{
        items: Product[];
        nextCursor: string | null;
      }>(`/api/products?${params.toString()}`);

      return response;
    },
    initialPageParam: null as string | null,
    getNextPageParam: lastPage => lastPage.nextCursor || undefined,
    staleTime: 30000,
    gcTime: 120000,
  });
}
```

#### **4. Zustand Store with Immer**

**Pattern**: `src/stores/productStore.ts` - Modern state management

```typescript
// ✅ MODERN PATTERN - Zustand store with Immer
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface ProductState {
  products: Record<string, Product>;
  selectedProducts: string[];
  filters: ProductFilters;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor: string | null;
}

interface ProductActions {
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  selectProduct: (id: string) => void;
  clearSelection: () => void;
  setFilters: (filters: Partial<ProductFilters>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (hasMore: boolean, nextCursor: string | null) => void;
}

const useProductStore = create<ProductState & ProductActions>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        products: {},
        selectedProducts: [],
        filters: initialFilters,
        isLoading: false,
        error: null,
        hasMore: false,
        nextCursor: null,

        // Actions
        setProducts: products =>
          set(state => {
            state.products = products.reduce(
              (acc, product) => {
                acc[product.id] = product;
                return acc;
              },
              {} as Record<string, Product>
            );
            state.productIds = products.map(p => p.id);
          }),

        addProduct: product =>
          set(state => {
            state.products[product.id] = product;
            state.productIds.push(product.id);
          }),

        updateProduct: (id, updates) =>
          set(state => {
            if (state.products[id]) {
              Object.assign(state.products[id], updates);
            }
          }),

        // ... other actions
      }))
    )
  )
);
```

#### **5. API Routes with createRoute Wrapper**

**Pattern**: `src/app/api/products/route.ts` - Modern API route implementation

```typescript
// ✅ MODERN PATTERN - API routes with createRoute wrapper
import { ok, okPaginated } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import { logInfo } from '@/lib/logger';

const ProductQuerySchema = z.object({
  search: z.string().trim().default(''),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().nullable().optional(),
  sortBy: z
    .enum(['createdAt', 'name', 'price', 'isActive'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  category: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'viewer'],
    query: ProductQuerySchema,
  },
  async ({ query, user }) => {
    try {
      logInfo('Fetching products', {
        component: 'ProductAPI',
        operation: 'GET',
        userId: user.id,
        params: query,
      });

      // Build where clause
      const where: Record<string, unknown> = {};
      if (query!.search) {
        where.OR = [
          { name: { contains: query!.search, mode: 'insensitive' } },
          { description: { contains: query!.search, mode: 'insensitive' } },
        ];
      }

      // Execute query with cursor pagination
      const rows = await prisma.product.findMany({
        where,
        orderBy: [{ [query!.sortBy]: query!.sortOrder }],
        take: query!.limit + 1,
        ...(query!.cursor ? { cursor: { id: query!.cursor }, skip: 1 } : {}),
      });

      const nextCursor = rows.length > query!.limit ? rows.pop()!.id : null;

      return Response.json(okPaginated(rows, nextCursor));
    } catch (error) {
      // Error handling is automatic with createRoute
      throw error;
    }
  }
);
```

#### **6. HTTP Client with Error Handling**

**Pattern**: `src/lib/http.ts` and `src/hooks/useHttpClient.ts` - Centralized
HTTP client

```typescript
// ✅ MODERN PATTERN - HTTP client with error handling
export class HttpClient {
  async request<T = unknown>(
    input: RequestInfo,
    options: HttpClientOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(input);
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.config.defaultHeaders,
        ...options.headers,
        'x-request-id': requestId,
      },
    };

    try {
      const response = await fetch(url, requestOptions);
      return this.handleResponse<T>(response, requestId, startTime);
    } catch (error) {
      return this.handleError(error, url, requestId, startTime, options);
    }
  }

  private async handleResponse<T>(
    response: Response,
    requestId: string,
    startTime: number
  ): Promise<T> {
    const data = await response.json();

    // Handle API response envelope
    if (
      data &&
      typeof data === 'object' &&
      ('ok' in data || 'success' in data)
    ) {
      const apiResponse = data as any;
      const isSuccess =
        apiResponse.ok !== undefined ? apiResponse.ok : apiResponse.success;

      if (!isSuccess) {
        throw new HttpClientError(
          apiResponse.message || 'API request failed',
          response.status,
          apiResponse.code || 'API_ERROR',
          requestId
        );
      }
      return apiResponse.data;
    }

    return data;
  }
}

// Hook for React components
export function useHttpClient() {
  const get = useCallback(
    async <T = unknown>(
      url: string,
      options?: HttpClientOptions
    ): Promise<T> => {
      try {
        logDebug('HTTP GET request', {
          component: 'useHttpClient',
          operation: 'get',
          url,
        });

        return await http.get<T>(url, options);
      } catch (error) {
        logError('HTTP GET request failed', {
          component: 'useHttpClient',
          operation: 'get',
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    []
  );

  // ... other methods (post, put, patch, delete)

  return { get, post, put, patch, delete: del };
}
```

#### **7. Error Handling with StandardError**

**Pattern**: `src/lib/errors.ts` - Centralized error handling

```typescript
// ✅ MODERN PATTERN - Centralized error handling
export class StandardError extends Error {
  constructor({
    message,
    code,
    status = 500,
    metadata = {},
  }: {
    message: string;
    code: string;
    status?: number;
    metadata?: Record<string, unknown>;
  }) {
    super(message);
    this.name = 'StandardError';
    this.code = code;
    this.status = status;
    this.metadata = metadata;
  }
}

export const unauthorized = (message = 'Unauthorized') =>
  new StandardError({
    message,
    code: 'AUTH_2000',
    status: 401,
  });

export const forbidden = (message = 'Forbidden') =>
  new StandardError({
    message,
    code: 'AUTH_2007',
    status: 403,
  });

export function errorToJson(error: unknown): {
  code: string;
  message: string;
  details?: unknown;
} {
  if (error instanceof StandardError) {
    return {
      code: error.code,
      message: error.message,
      details: error.metadata?.userSafeDetails,
    };
  }

  return {
    code: 'SYS_1000',
    message: error instanceof Error ? error.message : 'Unknown error',
  };
}
```

#### **8. Structured Logging**

**Pattern**: `src/lib/logger.ts` - Structured logging with metadata

```typescript
// ✅ MODERN PATTERN - Structured logging
export interface LogMetadata {
  component?: string;
  operation?: string;
  userId?: string;
  requestId?: string;
  userStory?: string;
  hypothesis?: string;
  [key: string]: unknown;
}

export const logDebug = (message: string, metadata: LogMetadata = {}): void => {
  const entry = formatLogEntry('debug', message, metadata);
  logToConsole(entry);
};

export const logInfo = (message: string, metadata: LogMetadata = {}): void => {
  const entry = formatLogEntry('info', message, metadata);
  logToConsole(entry);
};

export const logError = (
  message: string,
  errorOrMetadata?: LogMetadata | unknown,
  metadata?: LogMetadata
): void => {
  // ... implementation
};
```

#### **9. Optimized Analytics**

**Pattern**: `src/hooks/useOptimizedAnalytics.ts` - Performance-optimized
analytics

```typescript
// ✅ MODERN PATTERN - Optimized analytics with batching and throttling
export function useOptimizedAnalytics(
  config: Partial<OptimizedAnalyticsConfig> = {}
) {
  const eventBuffer = useRef<AnalyticsEvent[]>([]);
  const throttleCounter = useRef<{ count: number; resetTime: number }>({
    count: 0,
    resetTime: Date.now() + 60000,
  });

  const trackOptimized = useCallback(
    (
      eventName: string,
      eventData: Record<string, unknown> = {},
      priority: 'high' | 'medium' | 'low' = 'medium'
    ) => {
      if (!isClient) return;

      const event: AnalyticsEvent = {
        eventName,
        eventData,
        timestamp: Date.now(),
        priority,
      };

      // Check throttling
      if (!checkThrottleLimit(priority)) {
        return;
      }

      // Add to buffer
      eventBuffer.current.push(event);

      // Flush if buffer is full
      if (eventBuffer.current.length >= finalConfig.batchSize) {
        flushBatch();
      }
    },
    [isClient, finalConfig.batchSize]
  );

  return { trackOptimized };
}
```

#### **10. Component Patterns**

**Pattern**: `src/components/products/ProductList.tsx` - Modern component
structure

```typescript
// ✅ MODERN PATTERN - Component with hooks and store
'use client';

import { useInfiniteProductsMigrated } from '@/hooks/useProducts';
import useProductStore from '@/stores/productStore';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logError, logInfo } from '@/lib/logger';

function ProductListHeader() {
  const selectedProducts = useProductStore(state => state.selectedProducts);
  const clearSelection = useProductStore(state => state.clearSelection);
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  const handleCreateProduct = useCallback(() => {
    analytics('product_create_initiated', { source: 'product_list' }, 'medium');
    router.push('/products/create');
  }, [analytics, router]);

  // ... implementation
}

function ProductFilters() {
  const filters = useProductStore(state => state.filters);
  const setFilters = useProductStore(state => state.setFilters);

  // ... implementation
}

export function ProductList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    error,
  } = useInfiniteProductsMigrated();

  // ... implementation
}
```

## 🚀 **Migration Strategy (Enhanced with Modern Patterns)**

### **Phase 1: Infrastructure Setup (Week 1)**

#### **1.1 Leverage Existing Infrastructure**

**✅ Already Available (No Need to Create):**

- `src/lib/errors.ts` - Error handling infrastructure ✅
- `src/lib/logger.ts` - Structured logging ✅
- `src/lib/requestId.ts` - Request correlation IDs ✅
- `src/lib/api/route.ts` - Route wrapper with RBAC ✅
- `src/lib/http.ts` - HTTP client helper ✅
- `src/lib/api/response.ts` - Typed response envelopes ✅
- `src/hooks/useHttpClient.ts` - HTTP client hook ✅
- `src/hooks/useOptimizedAnalytics.ts` - Optimized analytics ✅
- `src/app/(dashboard)/layout.tsx` - Provider stack order ✅

**Required Files to Create:**

- `src/features/proposals/schemas.ts` - Zod DTOs for contracts first approach
- `src/features/proposals/keys.ts` - Centralized query keys
- `src/features/proposals/services.ts` - Service layer with http() helper
- `src/features/proposals/hooks.ts` - React Query hooks with service layer
- `src/lib/transactions/proposalTransactions.ts` - Database transactions

**Templates to Use:**

- `templates/migration/schemas.template.ts`
- `templates/migration/keys.template.ts`
- `templates/migration/services.template.ts`
- `templates/migration/hooks.template.ts`
- `templates/migration/transaction.template.ts`

#### **1.2 Pre-Migration Checklist (Enhanced from MIGRATION_LESSONS.md)**

1. **Database Schema Review** - Map all field names and relationships
2. **Existing Implementation Analysis** - Study working patterns
3. **API Endpoint Inventory** - Identify existing working endpoints
4. **Component Architecture Planning** - Design stable, reusable patterns
5. **Validation Strategy** - Plan multi-layer validation approach
6. **HTTP Client Consistency** - Ensure all services use same patterns
7. **State Management Planning** - Design individual selectors, avoid composite
   hooks
8. **Cache Strategy** - Plan aggressive cache management approach
9. **Error Handling Strategy** - Plan structured logging and user-friendly
   messages

### **Phase 2: Service Layer Migration (Week 2)**

#### **2.1 Create New Service Layer**

**File to Create:**

- `src/features/proposals/services.ts` - New service layer with http() helper

**Template to Use:**

- `templates/migration/services.template.ts`

**Migration Strategy:**

- **REFACTOR** existing API routes (1,845 lines)
- Extract reusable business logic
- Keep existing Prisma operations
- Add cursor pagination support
- Add bulk operations support
- **ENHANCED**: Add workflow management operations
- **ENHANCED**: Use http() helper with Zod parsing for defensive programming

**What to Keep:**

- ✅ All existing Prisma operations
- ✅ Error handling patterns
- ✅ Type definitions
- ✅ Business logic
- ✅ Workflow management logic

**What to Change:**

- ❌ Remove bridge dependencies
- ❌ Simplify API structure
- ❌ Add cursor pagination
- ❌ Add bulk operations
- ❌ **ENHANCED**: Add transaction support for complex operations
- ❌ **ENHANCED**: Use consistent HTTP client patterns across all services
- ❌ **ENHANCED**: Implement defensive validation with Zod parsing

#### **2.2 Implementation Strategy (Enhanced from MIGRATION_LESSONS.md)**

1. **Database-First Design** - Start with schema, align all layers
2. **Existing Endpoint Leverage** - Use proven APIs over new ones
3. **Stable State Management** - Use individual selectors, avoid composite hooks
4. **Functional State Updates** - Prevent circular dependencies
5. **Structured Debug Logging** - Implement comprehensive tracking
6. **Stable Component Generation** - Avoid dynamic values in IDs
7. **Complete User Flow Testing** - Test end-to-end experience
8. **HTTP Client Consistency** - Use same patterns across all services
9. **Defensive Validation** - Parse responses with Zod on client side
10. **Request ID Tracking** - Include request IDs in all error messages

### **Phase 3: React Query Hooks Migration (Week 3)**

#### **3.1 Create New Hooks**

**File to Create:**

- `src/features/proposals/hooks.ts` - New React Query hooks with service layer

**Template to Use:**

- `templates/migration/hooks.template.ts`

**Migration Strategy:**

- **REPLACE** existing `src/hooks/useProposals.ts` (442 lines)
- **REPLACE** existing `src/hooks/proposals/useProposalDetailBridge.ts` (840
  lines)
- Consolidate into single, modern hook file
- **ENHANCED**: Use service layer instead of direct HTTP calls

**What to Keep:**

- ✅ React Query patterns
- ✅ Query key structure
- ✅ Error handling
- ✅ Analytics tracking

**What to Change:**

- ❌ Remove bridge dependencies
- ❌ Simplify hook structure
- ❌ Add infinite queries
- ❌ Add bulk operations
- ❌ Use stable query keys
- ❌ **ENHANCED**: Use service layer for all data fetching
- ❌ **ENHANCED**: Implement narrow invalidation with specific query keys
- ❌ **ENHANCED**: Use setQueryData for immediate cache updates
- ❌ **ENHANCED**: Include request IDs in error messages for support

#### **3.2 Hook Patterns (Enhanced from MIGRATION_LESSONS.md)**

```typescript
// ✅ CORRECT PATTERN - Service layer integration
export function useInfiniteProposals({
  search = '',
  limit = 20,
  sortBy = 'createdAt',
  sortOrder = 'desc',
} = {}) {
  return useInfiniteQuery({
    queryKey: qk.proposals.list(search, limit, sortBy as any, sortOrder as any),
    queryFn: ({ pageParam }) =>
      proposalService.list({
        search,
        limit,
        sortBy,
        sortOrder,
        cursor: pageParam,
      }),
    getNextPageParam: last => last.nextCursor,
    keepPreviousData: true,
    staleTime: 60_000,
  });
}

// ✅ CORRECT PATTERN - Mutation with cache management
export function useCreateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => proposalService.create(data),
    onSuccess: (p: any) => {
      qc.invalidateQueries({ queryKey: qk.proposals.all });
      qc.setQueryData(qk.proposals.byId(p.data.id), p.data);
      toast.success('Proposal created');
    },
    onError: (e: any) =>
      toast.error(`${e.message}${e.requestId ? ` (id: ${e.requestId})` : ''}`),
  });
}
```

### **Phase 4: Zustand Store Migration (Week 4)**

#### **4.1 Create New Store**

**File to Create:**

- `src/stores/proposalStore_new.ts` - New Zustand store

**Template to Use:**

- `templates/migration/store.template.ts`

**Migration Strategy:**

- **CREATE NEW** - Extract UI state from ProposalManagementBridge
- Simplify state structure
- Add proper selectors
- **ENHANCED**: Add workflow management state
- **ENHANCED**: Use individual selectors to prevent composite hook issues

**What to Extract:**

- ✅ Filters and search state
- ✅ View mode and sorting
- ✅ Selection state
- ✅ Dialog states
- ✅ **ENHANCED**: Workflow management state

#### **4.2 Store Patterns (Enhanced from MIGRATION_LESSONS.md)**

```typescript
// ✅ CORRECT PATTERN - Individual selectors (not composite hooks)
export const useProposalFilters = () =>
  useProposalStore(state => state.filters);
export const useProposalSorting = () =>
  useProposalStore(state => state.sorting);
export const useProposalSelection = () =>
  useProposalStore(state => state.selection);

// ✅ CORRECT PATTERN - Functional updates with stable dependencies
const handleUpdate = useCallback(
  (field: string, value: any) => {
    setProposalData(prev => ({ ...prev, [field]: value }));
  },
  [setProposalData] // ✅ Stable dependencies only
);

// ✅ CORRECT PATTERN - Empty dependency arrays for initialization
useEffect(() => {
  fetchProposalData();
}, []); // ✅ Mount-only execution
```

### **Phase 5: Component Migration (Week 5)**

#### **5.1 Create New Components**

**Files to Create:**

- `src/components/proposals_new/ProposalList_new.tsx` - New list component
- `src/components/proposals_new/ProposalForm_new.tsx` - New form component
- `src/components/proposals_new/ProposalWizard_new.tsx` - New wizard component

**Template to Use:**

- `templates/migration/component.template.tsx`

**Migration Strategy:**

- **REFACTOR** existing `src/components/proposals/ProposalWizard.tsx` (3,279
  lines)
- **REFACTOR** existing `src/components/proposals/ApprovalQueue.tsx` (929 lines)
- **REFACTOR** existing `src/components/proposals/DecisionInterface.tsx` (832
  lines)
- Extract reusable parts
- Simplify component structure
- **ENHANCED**: Implement structured logging at critical points

**What to Keep:**

- ✅ UI/UX design and styling
- ✅ Workflow management logic
- ✅ Form validation logic
- ✅ Accessibility features
- ✅ Multi-step wizard functionality

**What to Change:**

- ❌ Remove bridge dependencies
- ❌ Simplify state management
- ❌ Use new hooks and store
- ❌ Improve performance
- ❌ **ENHANCED**: Add structured logging for debugging and monitoring
- ❌ **ENHANCED**: Implement user-friendly error messages with actionable
  feedback
- ❌ **ENHANCED**: Use individual selectors instead of composite hooks

#### **5.2 Component Patterns (Enhanced from MIGRATION_LESSONS.md)**

```typescript
// ✅ CORRECT PATTERN - Structured logging at critical points
const handleSubmit = async (data: ProposalData) => {
  logDebug('Proposal submission started', {
    component: 'ProposalWizard',
    operation: 'submit',
    dataKeys: Object.keys(data),
    userStory: 'US-2.1',
    hypothesis: 'H3',
  });

  try {
    const result = await createProposal(data);
    logInfo('Proposal created successfully', {
      proposalId: result.id,
      userStory: 'US-2.1',
      hypothesis: 'H3',
    });
  } catch (error) {
    const processedError = errorHandlingService.processError(error);
    logError('Proposal creation failed', {
      error: processedError,
      userStory: 'US-2.1',
      hypothesis: 'H3',
    });
    toast.error(processedError.userFriendlyMessage);
  }
};

// ✅ CORRECT PATTERN - Individual selectors for optimized re-renders
const filters = useProposalStore(s => s.filters, shallow);
const sorting = useProposalStore(s => s.sorting, shallow);
const selection = useProposalStore(s => s.selection, shallow);
```

### **Phase 6: API Routes Migration (Week 6)**

#### **6.1 Update API Routes**

**Files to Update:**

- `src/app/api/proposals/route.ts` - Main CRUD operations
- `src/app/api/proposals/bulk-delete/route.ts` - Bulk delete (new)
- `src/app/api/proposals/workflow/route.ts` - Workflow operations

**Templates to Use:**

- `templates/migration/route.template.ts`
- `templates/migration/bulk-delete-route.template.ts`

**Migration Strategy:**

- **REFACTOR** existing API routes
- Add createRoute wrapper
- Add cursor pagination
- Add bulk operations
- Improve error handling
- **ENHANCED**: Use transactions for multi-table writes
- **ENHANCED**: Map P2002 → 409 CONFLICT for unique constraints
- **ENHANCED**: Add structured logging with request IDs

#### **6.2 API Route Patterns (Enhanced from MIGRATION_LESSONS.md)**

```typescript
// ✅ CORRECT PATTERN - Multi-table writes with transactions
export const POST = createRoute(
  {
    roles: ['admin', 'sales'],
    body: ProposalCreateSchema,
  },
  async ({ body, user }) => {
    const result = await db.$transaction(async tx => {
      // Create proposal
      const proposal = await tx.proposal.create({
        data: body,
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'PROPOSAL',
          entityId: proposal.id,
          userId: user.id,
        },
      });

      return proposal;
    });

    return Response.json(ok(ProposalSchema.parse(result)));
  }
);

// ✅ CORRECT PATTERN - Structured logging with request IDs
logInfo('Proposal created', {
  component: 'ProposalAPI',
  operation: 'POST',
  proposalId: result.id,
  userId: user.id,
  requestId: req.headers.get('x-request-id'),
});
```

### **Phase 7: Page Migration (Week 7)**

#### **7.1 Create New Pages**

**Files to Create:**

- `src/app/(dashboard)/proposals_new/page.tsx` - New proposals page
- `src/app/(dashboard)/proposals_new/[id]/page.tsx` - New detail page
- `src/app/(dashboard)/proposals_new/wizard/page.tsx` - New wizard page

**Template to Use:**

- `templates/migration/page.template.tsx`

**Migration Strategy:**

- **REFACTOR** existing pages
- Implement SSR/CSR hydration
- Use new components and hooks
- Maintain existing functionality

## 📊 **File Migration Matrix**

### **Files to Create (New Architecture)**

| File                                                  | Template                        | Status    | Priority |
| ----------------------------------------------------- | ------------------------------- | --------- | -------- |
| `src/features/proposals/schemas.ts`                   | `schemas.template.ts`           | 🔴 Create | High     |
| `src/features/proposals/keys.ts`                      | `keys.template.ts`              | 🔴 Create | High     |
| `src/features/proposals/services.ts`                  | `services.template.ts`          | 🔴 Create | High     |
| `src/features/proposals/hooks.ts`                     | `hooks.template.ts`             | 🔴 Create | High     |
| `src/lib/transactions/proposalTransactions.ts`        | `transaction.template.ts`       | 🔴 Create | Medium   |
| `src/services/proposalService_new.ts`                 | `service.template.ts`           | 🔴 Create | High     |
| `src/lib/validation/proposalValidation.ts`            | `validation.template.ts`        | 🔴 Create | High     |
| `src/hooks/useProposals_new.ts`                       | `hook.template.ts`              | 🔴 Create | High     |
| `src/stores/proposalStore_new.ts`                     | `store.template.ts`             | 🔴 Create | High     |
| `src/components/proposals_new/ProposalList_new.tsx`   | `component.template.tsx`        | 🔴 Create | High     |
| `src/components/proposals_new/ProposalForm_new.tsx`   | `component.template.tsx`        | 🔴 Create | High     |
| `src/components/proposals_new/ProposalWizard_new.tsx` | `component.template.tsx`        | 🔴 Create | High     |
| `src/app/api/proposals/bulk-delete/route.ts`          | `bulk-delete-route.template.ts` | 🔴 Create | Medium   |
| `src/app/(dashboard)/proposals_new/page.tsx`          | `page.template.tsx`             | 🔴 Create | High     |
| `src/app/(dashboard)/proposals_new/[id]/page.tsx`     | `page.template.tsx`             | 🔴 Create | High     |
| `src/app/(dashboard)/proposals_new/wizard/page.tsx`   | `page.template.tsx`             | 🔴 Create | High     |

### **Files to Refactor (Existing Architecture)**

| File                                                | Action      | Status             | Priority |
| --------------------------------------------------- | ----------- | ------------------ | -------- |
| `src/app/api/proposals/route.ts`                    | 🔄 Refactor | 🟡 Keep Operations | High     |
| `src/components/proposals/ProposalWizard.tsx`       | 🔄 Refactor | 🟡 Keep UI         | High     |
| `src/components/proposals/ApprovalQueue.tsx`        | 🔄 Refactor | 🟡 Keep UI         | Medium   |
| `src/components/proposals/DecisionInterface.tsx`    | 🔄 Refactor | 🟡 Keep UI         | Medium   |
| `src/components/proposals/WorkflowOrchestrator.tsx` | 🔄 Refactor | 🟡 Keep UI         | Medium   |
| `src/app/(dashboard)/proposals/page.tsx`            | 🔄 Refactor | 🟡 Keep Structure  | High     |
| `src/app/(dashboard)/proposals/[id]/page.tsx`       | 🔄 Refactor | 🟡 Keep Structure  | High     |

### **Files to Remove (Bridge Pattern)**

| File                                                        | Action    | Status    | Priority |
| ----------------------------------------------------------- | --------- | --------- | -------- |
| `src/lib/bridges/ProposalApiBridge.ts`                      | ❌ Remove | 🔴 Delete | Low      |
| `src/lib/bridges/ProposalDetailApiBridge.ts`                | ❌ Remove | 🔴 Delete | Low      |
| `src/components/bridges/ProposalManagementBridge.tsx`       | ❌ Remove | 🔴 Delete | Low      |
| `src/components/bridges/ProposalDetailManagementBridge.tsx` | ❌ Remove | 🔴 Delete | Low      |
| `src/hooks/proposals/useProposalDetailBridge.ts`            | ❌ Remove | 🔴 Delete | Low      |

## 🏷️ **Naming Convention Plan**

### **Naming Strategy: `_new` Suffix for Parallel Development**

**Rule**: All new migration files use `_new` suffix to avoid conflicts with
existing files during parallel development.

### **Directory Structure**

```
src/
├── features/
│   └── proposals/
│       ├── schemas.ts                 # NEW - Zod DTOs (server+client)
│       ├── keys.ts                    # NEW - React Query keys
│       ├── services.ts                # NEW - http() calls + Zod parse
│       └── hooks.ts                   # NEW - useInfinite..., useCreate...
├── services/
│   ├── proposalService.ts             # OLD (keep during migration)
│   └── proposalService_new.ts         # NEW (migration target)
├── hooks/
│   ├── useProposals.ts                # OLD (keep during migration)
│   └── useProposals_new.ts            # NEW (migration target)
├── stores/
│   └── proposalStore_new.ts           # NEW (no existing store)
├── components/
│   ├── proposals/                     # OLD directory
│   │   ├── ProposalWizard.tsx
│   │   ├── ApprovalQueue.tsx
│   │   ├── DecisionInterface.tsx
│   │   └── steps/
│   │       ├── BasicInformationStep.tsx
│   │       ├── TeamAssignmentStep.tsx
│   │       ├── ContentSelectionStep.tsx
│   │       ├── ProductSelectionStep.tsx
│   │       ├── SectionAssignmentStep.tsx
│   │       └── ReviewStep.tsx
│   └── proposals_new/                 # NEW directory
│       ├── ProposalList_new.tsx
│       ├── ProposalForm_new.tsx
│       └── ProposalWizard_new.tsx
├── app/(dashboard)/
│   ├── proposals/                     # OLD directory
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   ├── manage/page.tsx
│   │   ├── approve/page.tsx
│   │   └── version-history/page.tsx
│   └── proposals_new/                 # NEW directory
│       ├── page.tsx
│       ├── [id]/page.tsx
│       └── wizard/page.tsx
└── lib/
    ├── store/
    │   └── proposalStore_new.ts       # NEW (no existing store)
    └── transactions/
        └── proposalTransactions.ts    # NEW (no existing file)
```

## 🎯 **Domain-Specific Notes for Proposals**

### **Complex Workflow Management**

**When to use `$transaction`:**

1. **Proposal creation** - Create proposal and assign team members
2. **Status changes** - Update status and create audit log
3. **Approval workflows** - Update approval status and notify stakeholders
4. **Bulk operations** - Multiple proposal updates with consistency

**Example Transaction Pattern:**

```typescript
await db.$transaction(async tx => {
  // Create proposal
  const proposal = await tx.proposal.create({
    data: proposalData,
  });

  // Assign team members
  await tx.proposalAssignment.createMany({
    data: teamMembers.map(member => ({
      proposalId: proposal.id,
      userId: member.id,
      role: member.role,
    })),
  });

  // Create workflow steps
  await tx.workflowStep.createMany({
    data: workflowSteps.map(step => ({
      proposalId: proposal.id,
      stepType: step.type,
      order: step.order,
      assignedTo: step.assignedTo,
    })),
  });
});
```

### **Multi-Step Form Validation**

**For proposal wizard validation:**

```typescript
// Step-by-step validation
const stepValidationSchemas = {
  step1: BasicInformationSchema,
  step2: TeamAssignmentSchema,
  step3: ContentSelectionSchema,
  step4: ProductSelectionSchema,
  step5: SectionAssignmentSchema,
  step6: ReviewSchema,
};

// Cross-step validation
const validateProposalWizard = (data: ProposalWizardData) => {
  const errors: string[] = [];

  // Validate each step
  Object.entries(stepValidationSchemas).forEach(([step, schema]) => {
    const stepData = data[step as keyof ProposalWizardData];
    const stepErrors = schema.safeParse(stepData);
    if (!stepErrors.success) {
      errors.push(...stepErrors.error.errors.map(e => `${step}: ${e.message}`));
    }
  });

  // Cross-step validation
  if (data.step4?.products?.length === 0 && data.step5?.sections?.length > 0) {
    errors.push('Cannot assign sections without selected products');
  }

  return errors;
};
```

### **Workflow State Management**

**Zustand store for workflow state:**

```typescript
interface ProposalWorkflowState {
  currentStep: number;
  steps: ProposalStep[];
  stepData: Record<number, unknown>;
  validationErrors: Record<number, string[]>;
  isSubmitting: boolean;
  canProceed: (step: number) => boolean;
  canGoBack: (step: number) => boolean;
  setStepData: (step: number, data: unknown) => void;
  setValidationErrors: (step: number, errors: string[]) => void;
  nextStep: () => void;
  previousStep: () => void;
  submitProposal: () => Promise<void>;
}
```

## 🚨 **Risk Mitigation**

### **High Risk Areas**

1. **Workflow Complexity**: Ensure all workflow states and transitions are
   preserved
2. **Multi-Step Forms**: Maintain all validation logic and user experience
3. **Performance Regression**: Test thoroughly with real data
4. **User Experience**: Maintain existing UI/UX patterns
5. **Integration Issues**: Test with other components
6. **ENHANCED**: Infinite loops from unstable useEffect dependencies
7. **ENHANCED**: Field name inconsistencies between database and UI layers
8. **ENHANCED**: Cache invalidation issues causing stale data
9. **ENHANCED**: HTTP client pattern inconsistencies across services

### **Mitigation Strategies**

1. **Parallel Development**: Keep old and new implementations running
2. **Feature Flags**: Use feature flags to switch between implementations
3. **Comprehensive Testing**: Test all proposal workflows
4. **Gradual Rollout**: Migrate one component at a time
5. **Rollback Plan**: Keep old code until new implementation is stable
6. **Enhanced Testing**: Focus on workflow management functionality
7. **ENHANCED**: Use empty dependency arrays for initialization effects
8. **ENHANCED**: Implement database-first field alignment strategy
9. **ENHANCED**: Use aggressive cache management with immediate updates
10. **ENHANCED**: Standardize HTTP client patterns across all services

## 📅 **Timeline**

### **Week 1: Infrastructure**

- Leverage existing infrastructure (already available from Product migration)
- Create proposal-specific transaction patterns
- Test basic setup

### **Week 2: Service Layer**

- Create new service layer
- Refactor existing service
- Test service operations
- **ENHANCED**: Add workflow management operations

### **Week 3: React Query Hooks**

- Create new hooks
- Test data fetching
- Validate caching
- **ENHANCED**: Add workflow management hooks

### **Week 4: Zustand Store**

- Create new store
- Test state management
- Validate persistence
- **ENHANCED**: Add workflow management state

### **Week 5: Components**

- Create new components
- Test UI functionality
- Validate performance
- **ENHANCED**: Test workflow management components

### **Week 6: API Routes**

- Update API routes
- Test endpoints
- Validate pagination
- **ENHANCED**: Test workflow management endpoints

### **Week 7: Pages**

- Create new pages
- Test full workflow
- Validate SSR/CSR
- **ENHANCED**: Test workflow management pages

### **Week 8: Testing & Cleanup**

- Comprehensive testing
- Performance validation
- Remove old code
- **ENHANCED**: Focus on workflow management testing

## 🎯 **Success Criteria**

### **Performance Targets**

- Reduce ProposalWizard bundle size by 60%
- Achieve <200ms component load times
- Eliminate webpack chunk loading errors
- Improve First Contentful Paint by 30%

### **Code Quality Targets**

- 100% TypeScript compliance
- All components <500 lines
- 100% React Query adoption
- Zero bridge pattern dependencies

### **Maintainability Targets**

- Single responsibility principle
- Clear component boundaries
- Consistent error handling
- Unified analytics approach

### **Functionality Targets**

1. **Functionality**: All existing proposal features work including workflows
2. **Performance**: Improved load times and reduced memory usage
3. **Maintainability**: Code is easier to understand and modify
4. **Developer Experience**: Faster development and debugging
5. **User Experience**: No regression in UI/UX
6. **Testing**: All tests pass with new implementation
7. **Enhanced**: Workflow management works correctly
8. **Enhanced**: Multi-step wizard functionality preserved
9. **Enhanced**: Form validation works consistently across all forms
10. **Enhanced**: Form validation provides excellent user experience with
    real-time feedback

### **Enhanced Success Criteria (From MIGRATION_LESSONS.md)**

11. **State Management**: No infinite loops or getServerSnapshot errors
12. **Data Consistency**: All data properly stored and retrieved
13. **API Validation**: All requests pass validation with proper error handling
14. **UI Consistency**: No hydration mismatches
15. **User Experience**: Complete flow from start to finish without errors
16. **HTTP Client**: Consistent patterns across all services
17. **Cache Management**: Immediate UI updates with proper invalidation
18. **Error Handling**: User-friendly messages with request IDs for support
19. **Logging**: Comprehensive structured logging for debugging
20. **Field Alignment**: Consistent naming across database, API, and UI layers

## 🚨 **Critical Migration Checklist**

- [ ] **Archive Bridge Files**: Move bridge pattern files to src/archived/
- [ ] **Component Size Reduction**: Split large components (>1000 lines)
- [ ] **React Query Migration**: All data fetching uses React Query
- [ ] **Analytics Compliance**: All components use useOptimizedAnalytics
- [ ] **Type Safety**: Zero TypeScript errors
- [ ] **Performance Testing**: Verify component load times
- [ ] **E2E Testing**: Full proposal creation workflow
- [ ] **Navigation Updates**: All links point to correct routes

### **Enhanced Checklist (From MIGRATION_LESSONS.md)**

- [ ] **Database Schema Review**: Map all field names and relationships
- [ ] **Existing Implementation Analysis**: Study working patterns first
- [ ] **API Endpoint Inventory**: Identify existing working endpoints
- [ ] **HTTP Client Consistency**: Ensure all services use same patterns
- [ ] **State Management Stability**: Use individual selectors, avoid composite
      hooks
- [ ] **Cache Strategy**: Implement aggressive cache management
- [ ] **Error Handling Strategy**: Plan structured logging and user-friendly
      messages
- [ ] **Field Alignment**: Ensure consistent naming across all layers
- [ ] **Defensive Validation**: Implement Zod parsing on client side
- [ ] **Request ID Tracking**: Include request IDs in all error messages
- [ ] **Stable Dependencies**: Use empty dependency arrays for initialization
- [ ] **Complete User Flow Testing**: Test end-to-end experience

## 📈 **Expected Benefits**

### **Performance Improvements**

- **Bundle Size**: 60% reduction through component splitting
- **Load Times**: 30% improvement in page load performance
- **Memory Usage**: 40% reduction through better component lifecycle
- **Developer Experience**: 50% faster rebuild times

### **Code Quality Improvements**

- **Maintainability**: Smaller, focused components
- **Testability**: Unit tests for individual components
- **Debugging**: Clearer component boundaries
- **Extensibility**: Easier to add new features

### **Technical Debt Reduction**

- **Bridge Pattern Removal**: Eliminate over-engineered abstractions
- **Consistent Architecture**: Unified React Query approach
- **Type Safety**: 100% TypeScript compliance
- **Error Handling**: Standardized across all components

### **Enhanced Benefits (From MIGRATION_LESSONS.md)**

### **System Integration Improvements**

- **Data Consistency**: Eliminate field name mismatches across layers
- **API Reliability**: Consistent HTTP client patterns prevent integration
  issues
- **State Stability**: Individual selectors prevent infinite loops and
  performance issues
- **Cache Efficiency**: Aggressive cache management provides snappy UI updates
- **Error Traceability**: Request IDs enable faster debugging and support
- **Validation Robustness**: Defensive validation prevents runtime errors

### **Developer Experience Improvements**

- **Faster Debugging**: Structured logging with request IDs
- **Consistent Patterns**: Unified approach across all services and components
- **Type Safety**: End-to-end TypeScript compliance with proper validation
- **Predictable Behavior**: Stable state management prevents unexpected issues
- **Better Testing**: Clear component boundaries enable comprehensive testing

## 🏆 **Migration Timeline Summary**

- **Week 1**: Infrastructure cleanup and service enhancement
- **Week 2**: Hook creation and migration
- **Week 3**: Component refactoring and splitting
- **Week 4**: Testing, integration, and validation

**Total Effort**: 4 weeks with significant performance and maintainability
improvements expected.

## 🏆 **Product Migration Success Patterns to Apply**

### **✅ Proven Success Patterns**

1. **createRoute wrapper**: ✅ Works perfectly with RBAC, logging, x-request-id,
   error JSON
2. **StandardError + errorToJson**: ✅ Centralized error handling works
   flawlessly
3. **Stable primitive query keys**: ✅ Optimal caching performance achieved
4. **Zustand selectors + shallow**: ✅ Optimized state management proven
5. **Cursor pagination**: ✅ Efficient data loading implemented
6. **Bulk operations**: ✅ Improved user experience delivered
7. **Analytics integration**: ✅ Comprehensive tracking working
8. **Transaction support**: ✅ Data consistency maintained
9. **SSR/CSR hydration**: ✅ Proper server/client rendering achieved
10. **HTTP Client patterns**: ✅ Consistent API communication
11. **Centralized query keys**: ✅ Improved maintainability and consistency
12. **Optimized analytics**: ✅ Performance-optimized event tracking
13. **Structured logging**: ✅ Comprehensive debugging and monitoring

### **✅ Lessons Learned from Product Migration**

1. **Parallel Development**: `_new` suffix strategy works perfectly
2. **Feature Flags**: Easy switching between implementations
3. **Gradual Migration**: One component at a time approach
4. **Comprehensive Testing**: All functionality preserved
5. **Performance Improvement**: Significant gains achieved
6. **Developer Experience**: Much improved with simplified architecture
7. **HTTP Client Consistency**: Critical for reliable API communication
8. **Query Key Management**: Centralized keys prevent conflicts and improve
   maintainability
9. **Error Handling**: Standardized approach reduces bugs and improves debugging
10. **Analytics Optimization**: Performance-optimized tracking prevents timeouts

### **✅ Enhanced Patterns (From MIGRATION_LESSONS.md)**

11. **Database-First Field Alignment**: ✅ Eliminates field name inconsistencies
12. **Individual Selectors**: ✅ Prevents composite hook performance issues
13. **Functional State Updates**: ✅ Prevents circular dependencies
14. **Empty Dependency Arrays**: ✅ Prevents infinite loops in useEffect
15. **Defensive Validation**: ✅ Zod parsing on client prevents runtime errors
16. **Request ID Tracking**: ✅ Enables faster debugging and support
17. **Aggressive Cache Management**: ✅ Provides snappy UI updates
18. **Structured Logging**: ✅ Comprehensive debugging and monitoring
19. **User-Friendly Error Messages**: ✅ Improves user experience with
    actionable feedback
20. **Service Layer Integration**: ✅ Consistent patterns across all data
    fetching

This enhanced Proposal Migration Assessment leverages all the successful
patterns and lessons learned from the Product migration and
MIGRATION_LESSONS.md, ensuring a smooth and successful transition to the modern
architecture while preserving all existing functionality including the complex
workflow management features.

**Key Enhancements from MIGRATION_LESSONS.md**:

- **Unified Problem-Solution Framework**: Addresses multi-dimensional system
  integration challenges
- **Database-First Field Alignment**: Ensures consistent naming across all
  layers
- **Stable State Management**: Prevents infinite loops and performance issues
- **Defensive Validation**: Zod parsing on client side prevents runtime errors
- **Structured Logging**: Comprehensive debugging and monitoring capabilities
- **Request ID Tracking**: Enables faster debugging and support
- **Aggressive Cache Management**: Provides snappy UI updates
- **HTTP Client Consistency**: Standardized patterns across all services
- **User-Friendly Error Messages**: Improves user experience with actionable
  feedback
- **Complete User Flow Testing**: Ensures end-to-end functionality preservation

---

## 🔧 **Modern Implementation Patterns (Updated from Codebase Analysis)**

### **✅ PROVEN MODERN PATTERNS TO FOLLOW**

#### **1. Service Layer Architecture**

**Pattern**: `src/services/productService.ts` - Modern service layer with Zod
validation

```typescript
// ✅ MODERN PATTERN - Service layer with Zod schemas
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive').optional().or(z.null()),
  // ... other fields
});

export const ProductListSchema = z.object({
  items: z.array(ProductSchema),
  nextCursor: z.string().nullable(),
});

export class ProductService {
  private baseUrl = '/api/products';

  async getProducts(params: ProductQuery): Promise<ApiResponse<ProductList>> {
    const validatedParams = ProductQuerySchema.parse(params);
    // ... implementation
  }
}
```

#### **2. Centralized Query Keys**

**Pattern**: `src/features/*/keys.ts` - Centralized query key management

```typescript
// ✅ MODERN PATTERN - Centralized query keys
// src/features/proposals/keys.ts
export const qk = {
  proposals: {
    all: ['proposals'] as const,
    list: (search: string, limit: number, sortBy: string, sortOrder: string) =>
      ['proposals', 'list', search, limit, sortBy, sortOrder] as const,
    byId: (id: string) => ['proposals', 'byId', id] as const,
    stats: () => ['proposals', 'stats'] as const,
  },
} as const;
```

#### **3. React Query Hooks with useHttpClient**

**Pattern**: `src/hooks/useProducts.ts` - Modern React Query implementation

```typescript
// ✅ MODERN PATTERN - React Query hooks with useHttpClient
import { qk } from '@/features/products/keys';
import { useHttpClient } from '@/hooks/useHttpClient';

export function useInfiniteProductsMigrated({
  search = '',
  limit = 20,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}: ProductQuery = {}) {
  const { get } = useHttpClient();

  return useInfiniteQuery({
    queryKey: qk.products.list(search, limit, sortBy, sortOrder),
    queryFn: async ({ pageParam }) => {
      logDebug('Fetching products with cursor pagination', {
        component: 'useInfiniteProductsMigrated',
        operation: 'queryFn',
        // ... metadata
      });

      const params = new URLSearchParams();
      // ... build params

      const response = await get<{
        items: Product[];
        nextCursor: string | null;
      }>(`/api/products?${params.toString()}`);

      return response;
    },
    initialPageParam: null as string | null,
    getNextPageParam: lastPage => lastPage.nextCursor || undefined,
    staleTime: 30000,
    gcTime: 120000,
  });
}
```

#### **4. Zustand Store with Immer**

**Pattern**: `src/stores/productStore.ts` - Modern state management

```typescript
// ✅ MODERN PATTERN - Zustand store with Immer
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface ProductState {
  products: Record<string, Product>;
  selectedProducts: string[];
  filters: ProductFilters;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor: string | null;
}

interface ProductActions {
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  selectProduct: (id: string) => void;
  clearSelection: () => void;
  setFilters: (filters: Partial<ProductFilters>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (hasMore: boolean, nextCursor: string | null) => void;
}

const useProductStore = create<ProductState & ProductActions>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        products: {},
        selectedProducts: [],
        filters: initialFilters,
        isLoading: false,
        error: null,
        hasMore: false,
        nextCursor: null,

        // Actions
        setProducts: products =>
          set(state => {
            state.products = products.reduce(
              (acc, product) => {
                acc[product.id] = product;
                return acc;
              },
              {} as Record<string, Product>
            );
            state.productIds = products.map(p => p.id);
          }),

        addProduct: product =>
          set(state => {
            state.products[product.id] = product;
            state.productIds.push(product.id);
          }),

        updateProduct: (id, updates) =>
          set(state => {
            if (state.products[id]) {
              Object.assign(state.products[id], updates);
            }
          }),

        // ... other actions
      }))
    )
  )
);
```

#### **5. API Routes with createRoute Wrapper**

**Pattern**: `src/app/api/products/route.ts` - Modern API route implementation

```typescript
// ✅ MODERN PATTERN - API routes with createRoute wrapper
import { ok, okPaginated } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import { logInfo } from '@/lib/logger';

const ProductQuerySchema = z.object({
  search: z.string().trim().default(''),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().nullable().optional(),
  sortBy: z
    .enum(['createdAt', 'name', 'price', 'isActive'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  category: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'viewer'],
    query: ProductQuerySchema,
  },
  async ({ query, user }) => {
    try {
      logInfo('Fetching products', {
        component: 'ProductAPI',
        operation: 'GET',
        userId: user.id,
        params: query,
      });

      // Build where clause
      const where: Record<string, unknown> = {};
      if (query!.search) {
        where.OR = [
          { name: { contains: query!.search, mode: 'insensitive' } },
          { description: { contains: query!.search, mode: 'insensitive' } },
        ];
      }

      // Execute query with cursor pagination
      const rows = await prisma.product.findMany({
        where,
        orderBy: [{ [query!.sortBy]: query!.sortOrder }],
        take: query!.limit + 1,
        ...(query!.cursor ? { cursor: { id: query!.cursor }, skip: 1 } : {}),
      });

      const nextCursor = rows.length > query!.limit ? rows.pop()!.id : null;

      return Response.json(okPaginated(rows, nextCursor));
    } catch (error) {
      // Error handling is automatic with createRoute
      throw error;
    }
  }
);
```

#### **6. HTTP Client with Error Handling**

**Pattern**: `src/lib/http.ts` and `src/hooks/useHttpClient.ts` - Centralized
HTTP client

```typescript
// ✅ MODERN PATTERN - HTTP client with error handling
export class HttpClient {
  async request<T = unknown>(
    input: RequestInfo,
    options: HttpClientOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(input);
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.config.defaultHeaders,
        ...options.headers,
        'x-request-id': requestId,
      },
    };

    try {
      const response = await fetch(url, requestOptions);
      return this.handleResponse<T>(response, requestId, startTime);
    } catch (error) {
      return this.handleError(error, url, requestId, startTime, options);
    }
  }

  private async handleResponse<T>(
    response: Response,
    requestId: string,
    startTime: number
  ): Promise<T> {
    const data = await response.json();

    // Handle API response envelope
    if (
      data &&
      typeof data === 'object' &&
      ('ok' in data || 'success' in data)
    ) {
      const apiResponse = data as any;
      const isSuccess =
        apiResponse.ok !== undefined ? apiResponse.ok : apiResponse.success;

      if (!isSuccess) {
        throw new HttpClientError(
          apiResponse.message || 'API request failed',
          response.status,
          apiResponse.code || 'API_ERROR',
          requestId
        );
      }
      return apiResponse.data;
    }

    return data;
  }
}

// Hook for React components
export function useHttpClient() {
  const get = useCallback(
    async <T = unknown>(
      url: string,
      options?: HttpClientOptions
    ): Promise<T> => {
      try {
        logDebug('HTTP GET request', {
          component: 'useHttpClient',
          operation: 'get',
          url,
        });

        return await http.get<T>(url, options);
      } catch (error) {
        logError('HTTP GET request failed', {
          component: 'useHttpClient',
          operation: 'get',
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    []
  );

  // ... other methods (post, put, patch, delete)

  return { get, post, put, patch, delete: del };
}
```

#### **7. Error Handling with StandardError**

**Pattern**: `src/lib/errors.ts` - Centralized error handling

```typescript
// ✅ MODERN PATTERN - Centralized error handling
export class StandardError extends Error {
  constructor({
    message,
    code,
    status = 500,
    metadata = {},
  }: {
    message: string;
    code: string;
    status?: number;
    metadata?: Record<string, unknown>;
  }) {
    super(message);
    this.name = 'StandardError';
    this.code = code;
    this.status = status;
    this.metadata = metadata;
  }
}

export const unauthorized = (message = 'Unauthorized') =>
  new StandardError({
    message,
    code: 'AUTH_2000',
    status: 401,
  });

export const forbidden = (message = 'Forbidden') =>
  new StandardError({
    message,
    code: 'AUTH_2007',
    status: 403,
  });

export function errorToJson(error: unknown): {
  code: string;
  message: string;
  details?: unknown;
} {
  if (error instanceof StandardError) {
    return {
      code: error.code,
      message: error.message,
      details: error.metadata?.userSafeDetails,
    };
  }

  return {
    code: 'SYS_1000',
    message: error instanceof Error ? error.message : 'Unknown error',
  };
}
```

#### **8. Structured Logging**

**Pattern**: `src/lib/logger.ts` - Structured logging with metadata

```typescript
// ✅ MODERN PATTERN - Structured logging
export interface LogMetadata {
  component?: string;
  operation?: string;
  userId?: string;
  requestId?: string;
  userStory?: string;
  hypothesis?: string;
  [key: string]: unknown;
}

export const logDebug = (message: string, metadata: LogMetadata = {}): void => {
  const entry = formatLogEntry('debug', message, metadata);
  logToConsole(entry);
};

export const logInfo = (message: string, metadata: LogMetadata = {}): void => {
  const entry = formatLogEntry('info', message, metadata);
  logToConsole(entry);
};

export const logError = (
  message: string,
  errorOrMetadata?: LogMetadata | unknown,
  metadata?: LogMetadata
): void => {
  // ... implementation
};
```

#### **9. Optimized Analytics**

**Pattern**: `src/hooks/useOptimizedAnalytics.ts` - Performance-optimized
analytics

```typescript
// ✅ MODERN PATTERN - Optimized analytics with batching and throttling
export function useOptimizedAnalytics(
  config: Partial<OptimizedAnalyticsConfig> = {}
) {
  const eventBuffer = useRef<AnalyticsEvent[]>([]);
  const throttleCounter = useRef<{ count: number; resetTime: number }>({
    count: 0,
    resetTime: Date.now() + 60000,
  });

  const trackOptimized = useCallback(
    (
      eventName: string,
      eventData: Record<string, unknown> = {},
      priority: 'high' | 'medium' | 'low' = 'medium'
    ) => {
      if (!isClient) return;

      const event: AnalyticsEvent = {
        eventName,
        eventData,
        timestamp: Date.now(),
        priority,
      };

      // Check throttling
      if (!checkThrottleLimit(priority)) {
        return;
      }

      // Add to buffer
      eventBuffer.current.push(event);

      // Flush if buffer is full
      if (eventBuffer.current.length >= finalConfig.batchSize) {
        flushBatch();
      }
    },
    [isClient, finalConfig.batchSize]
  );

  return { trackOptimized };
}
```

#### **10. Component Patterns**

**Pattern**: `src/components/products/ProductList.tsx` - Modern component
structure

```typescript
// ✅ MODERN PATTERN - Component with hooks and store
'use client';

import { useInfiniteProductsMigrated } from '@/hooks/useProducts';
import useProductStore from '@/stores/productStore';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logError, logInfo } from '@/lib/logger';

function ProductListHeader() {
  const selectedProducts = useProductStore(state => state.selectedProducts);
  const clearSelection = useProductStore(state => state.clearSelection);
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  const handleCreateProduct = useCallback(() => {
    analytics('product_create_initiated', { source: 'product_list' }, 'medium');
    router.push('/products/create');
  }, [analytics, router]);

  // ... implementation
}

function ProductFilters() {
  const filters = useProductStore(state => state.filters);
  const setFilters = useProductStore(state => state.setFilters);

  // ... implementation
}

export function ProductList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    error,
  } = useInfiniteProductsMigrated();

  // ... implementation
}
```

### **📋 Implementation Checklist for Modern Patterns**

- [ ] **Contracts First**: Use Zod DTOs in `src/features/<domain>/schemas.ts`
      for both server and client
- [ ] **Service Layer**: Use http() helper with Zod parsing, defensive
      programming
- [ ] **Query Keys**: Centralize in `src/features/*/keys.ts` files, primitives
      only
- [ ] **React Query**: Use service layer, narrow invalidation, setQueryData for
      cache updates
- [ ] **Zustand Store**: Use Immer for immutable updates, proper selectors with
      shallow
- [ ] **API Routes**: Use `createRoute` wrapper with RBAC, validation, and
      transactions
- [ ] **HTTP Client**: Use centralized http() helper with error handling and
      request IDs
- [ ] **Error Handling**: Use `StandardError` and `errorToJson` consistently
- [ ] **Logging**: Use structured logging with metadata and request IDs
- [ ] **Analytics**: Use `useOptimizedAnalytics` for performance-optimized
      tracking
- [ ] **Components**: Follow single responsibility, use hooks and stores
      properly

### **🔧 Cross-Cutting Rules**

#### **Auth & RBAC**

- Authorization is server-side in createRoute
- Do not accept role/tenant from client payload
- Use NextAuth session validation

#### **Error Handling**

- Server returns `{ ok: false, code, message }` + x-request-id
- Client error toasts include requestId for support
- Use retry: 0..2 on queries; no retries on mutations by default

#### **Analytics**

- Fire events on mutation success only
- No PII in payloads
- Include ids/counts and requestId

#### **Rate Limiting**

- Add simple dev limiter or document upstream gateway limits
- Show clear "try later" message on 429

#### **Performance**

- Lists use cursor pagination and "Load more"
- Virtualize heavy tables when needed
- Avoid mirroring props to state; derive with useMemo

#### **Testing & Verification**

- **Contract tests**: Parse known-good/bad payloads with Zod
- **API tests**: Happy + 400/401/403/404/409 paths, role matrix
- **Hook tests**: List happy path, cursor advance, mutation success/error
- **E2E tests**: List → create → edit → delete → bulk delete

#### **Repository Verification Commands**

```bash
# Check for routes not using createRoute
rg -n "export const (GET|POST|PATCH|DELETE)" src/app/api | rg -v "createRoute\\("

# Check for Zod schemas in features
rg -n "z\\.object\\(" src/features/*/schemas.ts

# Check for query keys not using factory
rg -n "queryKey:\\s*\\[" src/features | rg -v "{"

# Check for Zustand shallow usage
rg -n "from 'zustand/shallow'|from \"zustand/shallow\"" src

# Check for cursor pagination usage
rg -n "nextCursor" src/app/api src/features

# Check for transaction usage
rg -n "\\$transaction\\(" src/app/api
```

### **📁 Folder Layout (Keeps Edges Clear)**

```
src/
  features/
    products/
      schemas.ts        # Zod DTOs (server+client)
      keys.ts           # React Query keys
      services.ts       # http() calls + Zod parse
      hooks.ts          # useInfinite..., useCreate...
      components/       # UI only
    proposals/
      ...
  store/
    product.store.ts    # UI state only (filters, sorting, selection)
  lib/
    api/
      route.ts          # createRoute()
      response.ts       # ok() / ApiResponse
    errors.ts           # AppError/errorToJson
    http.ts             # http<T>() helper
    logger.ts           # logInfo/logError
```

### **✅ Do / ❌ Don't Quick List**

**Do:**

- ✅ Validate on both sides (server input, client response)
- ✅ Keep React Query as the only data boundary for the client
- ✅ Keep Zustand for UI state only
- ✅ Use cursor pagination and stable query keys
- ✅ Wrap routes with createRoute
- ✅ Use transactions for multi-table writes
- ✅ Include request IDs in error messages

**Don't:**

- ❌ Fetch in useEffect
- ❌ Pass objects/functions into query keys
- ❌ Subscribe to the whole Zustand store in components
- ❌ Trust client-sent roles/tenant
- ❌ Return inconsistent shapes across endpoints
- ❌ Skip Zod validation on client responses
