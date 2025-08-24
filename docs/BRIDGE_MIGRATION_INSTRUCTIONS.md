# Bridge Migration Instructions - Complete Guide

## Overview

This document provides comprehensive instructions for migrating components to
use the bridge pattern architecture in PosalPro MVP2. The bridge pattern
provides centralized state management, error handling, and analytics tracking.

## 🚨 CRITICAL: BRIDGE PATTERN BEST PRACTICES

### Common Problems

React components using bridge patterns can experience issues when:

**Infinite Loop Issues:**

- useEffect dependencies include unstable functions
- Bridge calls are made directly during render cycles
- Event subscriptions trigger state updates that cause re-renders
- Auto-refresh mechanisms create circular dependencies

**Filter/Search Issues:**

- Parameter precedence is wrong in bridge fetch methods
- State filters override passed parameters
- Search parameters get converted to empty strings
- Debug logging is insufficient to trace parameter flow

**API Response Structure Issues:**

- Frontend TypeScript interfaces don't match actual API response structure
- Navigation logic expects flat response but API returns nested objects
- Form submission handlers use incorrect response data access patterns

**Provider Hierarchy Issues:**

- GlobalStateProvider missing from layout hierarchy
- Bridge components fail with "useGlobalState must be used within a
  GlobalStateProvider"
- Authentication context not available in standalone routes

**Authentication & Session Issues:**

- API calls made without authentication checks
- Session data structure mismatches between frontend and backend
- Role extraction logic doesn't handle multiple session formats

### The Solution: Seven Critical Patterns

#### 1. ✅ useEffect with Empty Dependency Arrays

**Pattern**: Use empty dependency arrays for mount-only effects

```typescript
// ✅ CORRECT: Empty dependency array
useEffect(() => {
  // Mount-only logic
  loadData();
}, []); // CRITICAL: Empty dependency array to prevent infinite loops

// ❌ WRONG: Unstable dependencies
useEffect(() => {
  loadData();
}, [loadData]); // Causes infinite loops!
```

**When to Use**:

- Data fetching on component mount
- Event subscriptions
- Auto-refresh setup
- One-time initialization

#### 2. ✅ setTimeout Pattern for Bridge Calls

**Pattern**: Defer bridge calls using setTimeout

```typescript
// ✅ CORRECT: Deferred bridge calls
const setFilters = useCallback(filters => {
  setTimeout(() => {
    stateBridge.setFilters(filters);
    analytics('filters_changed', data);
  }, 0);
}, []);

// ❌ WRONG: Direct bridge calls
const setFilters = useCallback(
  filters => {
    stateBridge.setFilters(filters); // Causes infinite loops!
  },
  [stateBridge]
);
```

**When to Use**:

- All bridge.set\* method calls
- Analytics tracking calls
- State updates that might trigger re-renders
- Event handler responses

#### 3. ✅ Event Subscription Safety

**Pattern**: Safe event subscription with cleanup

```typescript
// ✅ CORRECT: Safe event subscription
useEffect(() => {
  const listener = eventBridge.subscribe('DATA_REFRESHED', payload => {
    setTimeout(() => {
      refreshData();
    }, 0);
  });

  return () => {
    eventBridge.unsubscribe('DATA_REFRESHED', listener);
  };
}, []); // Empty dependency array

// ❌ WRONG: Unsafe event subscription
useEffect(() => {
  const listener = eventBridge.subscribe('DATA_REFRESHED', refreshData);
  return () => eventBridge.unsubscribe('DATA_REFRESHED', listener);
}, [refreshData]); // Causes infinite loops!
```

#### 4. ✅ Auto-refresh Safety

**Pattern**: Safe auto-refresh implementation

```typescript
// ✅ CORRECT: Safe auto-refresh
useEffect(() => {
  if (!autoRefresh) return;

  const interval = setInterval(() => {
    setTimeout(() => {
      refreshData();
    }, 0);
  }, refreshInterval);

  return () => clearInterval(interval);
}, []); // Empty dependency array

// ❌ WRONG: Unsafe auto-refresh
useEffect(() => {
  if (!autoRefresh) return;

  const interval = setInterval(refreshData, refreshInterval);
  return () => clearInterval(interval);
}, [autoRefresh, refreshInterval, refreshData]); // Causes infinite loops!
```

#### 5. ✅ State Update Safety

**Pattern**: Defer state updates that might cause loops

```typescript
// ✅ CORRECT: Deferred state updates
const updateState = useCallback(newData => {
  setTimeout(() => {
    setState(prev => ({ ...prev, ...newData }));
    analytics('state_updated', { data: newData });
  }, 0);
}, []);

// ❌ WRONG: Direct state updates
const updateState = useCallback(
  newData => {
    setState(prev => ({ ...prev, ...newData }));
    analytics('state_updated', { data: newData });
  },
  [analytics]
); // Causes infinite loops!
```

#### 6. ✅ Parameter Precedence in Bridge Fetch Methods

**Pattern**: Ensure passed parameters override default state filters

```typescript
// ✅ CORRECT: Passed params override state filters
const fetchCustomers = useCallback(
  async (params?: CustomerFetchParams) => {
    const fetchParams = {
      ...state.filters, // Default filters from state
      ...params, // Override with passed parameters
      fields: 'id,name,status,updatedAt',
    };

    const result = await apiBridge.fetchCustomers(fetchParams);
  },
  [apiBridge, state.filters]
);

// ❌ WRONG: State filters override passed params
const fetchCustomers = useCallback(
  async (params?: CustomerFetchParams) => {
    const fetchParams = {
      ...params, // Passed parameters
      ...state.filters, // Override with state filters (breaks search!)
      fields: 'id,name,status,updatedAt',
    };

    const result = await apiBridge.fetchCustomers(fetchParams);
  },
  [apiBridge, state.filters]
);
```

**Why This Matters**:

- Components passing search/filter parameters expect them to be used
- State filters should be defaults, not overrides
- Search functionality breaks when parameters are overridden
- Direct API calls from components should take precedence

#### 7. ✅ API Response Structure Validation

**Pattern**: Ensure TypeScript interfaces match actual API response structure

```typescript
// ❌ WRONG: Assuming flat response structure
interface CustomerResponse {
  id: string;
  name: string;
  email: string;
}

// Navigation code expecting flat structure
router.push(`/customers/${response.data!.id}`); // ❌ Fails: data.id is undefined

// ✅ CORRECT: Match actual API response structure
interface CustomerResponse {
  customer: {
    // API returns nested object
    id: string;
    name: string;
    email: string;
  };
}

// Navigation code using correct structure
router.push(`/customers/${response.data!.customer.id}`); // ✅ Works correctly
```

**When to Use**:

- Before implementing form submission handlers
- When setting up navigation after API calls
- During TypeScript interface definition
- When debugging "undefined" navigation issues

**Common API Response Patterns**:

```typescript
// Create operations typically return:
{
  success: boolean,
  message: string,
  data: {
    [entityName]: Entity  // Nested under entity name
  }
}

// List operations typically return:
{
  success: boolean,
  data: {
    [entityName + 's']: Entity[],  // Nested under plural entity name
    pagination: { ... }
  }
}
```

## 🚨 CRITICAL: PROVIDER HIERARCHY REQUIREMENTS

### Provider Setup (MANDATORY FIRST STEP)

**Before migrating any components to bridge architecture, ensure proper provider
hierarchy:**

```typescript
// ✅ CORRECT: Complete provider hierarchy
<AuthProvider session={session}>
  <GlobalStateProvider>
    <ProtectedLayout>{children}</ProtectedLayout>
  </GlobalStateProvider>
</AuthProvider>
```

**For standalone routes (not in dashboard layout):**

```typescript
// ✅ CORRECT: Standalone route providers
<Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
  <ClientLayoutWrapper>
    <QueryProvider>
      <AuthProvider>
        <GlobalStateProvider>
          <ClientPage />
        </GlobalStateProvider>
      </AuthProvider>
    </QueryProvider>
  </ClientLayoutWrapper>
</Suspense>
```

**Critical Provider Order:**

1. `ClientLayoutWrapper` (if standalone)
2. `QueryProvider` (for React Query)
3. `AuthProvider` (for authentication)
4. `GlobalStateProvider` (for bridge state management)
5. `ProtectedLayout` (for dashboard routes)

### Provider Verification Checklist

- [ ] `GlobalStateProvider` is included in layout hierarchy
- [ ] Provider placement is correct (inside AuthProvider, outside
      ProtectedLayout)
- [ ] Standalone routes have complete provider stack
- [ ] No console warnings about "useGlobalState must be used within a
      GlobalStateProvider"
- [ ] Authentication context is available in all bridge-enabled components

## 🚨 CRITICAL: AUTHENTICATION INTEGRATION

### Authentication Guards

**Always implement authentication checks in bridge-enabled components:**

```typescript
// ✅ CORRECT: Authentication guard
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

### Session Data Structure Handling

**Handle multiple session data formats:**

```typescript
// ✅ CORRECT: Robust role extraction
const getUserRoles = (session: Session | null): string[] => {
  if (!session?.user?.roles || !Array.isArray(session.user.roles)) {
    return [];
  }

  const mappedRoles = session.user.roles
    .map((role: any) => {
      // Try different possible role name properties
      let roleName = role.name || role.role || role.roleName || role.title;

      // If still undefined, try to extract from the role object itself
      if (!roleName && typeof role === 'string') {
        roleName = role;
      }

      // If still undefined, skip this role
      if (!roleName) {
        return null;
      }

      return mapBackendRoleToRBACRole(roleName);
    })
    .filter(Boolean); // Remove null values

  return mappedRoles;
};
```

## 🚨 CRITICAL: API URL CONSTRUCTION

### API Client Base URL Rules

**Always check API client base URL before constructing endpoint URLs:**

```typescript
// ✅ CORRECT: Single /api prefix
const response = await apiClient.get<ProposalSummary[]>(
  `/dashboard/proposals/active?${queryParams.toString()}`
);

// ❌ WRONG: Double /api prefix
const response = await apiClient.get<ProposalSummary[]>(
  `/api/dashboard/proposals/active?${queryParams.toString()}`
);
```

**API URL Construction Rules:**

1. **If API client base URL is `/api`**: Use `/endpoint` (not `/api/endpoint`)
2. **If API client base URL is empty**: Use `/api/endpoint`
3. **If API client base URL is absolute**: Use `/endpoint` (relative to base)

### API Endpoint Verification

**Always verify API endpoints exist before implementing frontend calls:**

```bash
# Check available endpoints
ls src/app/api/dashboard/

# Test endpoints with CLI
npx tsx scripts/app-cli.ts --command "get /api/dashboard/enhanced-stats"
```

## 🚨 CRITICAL: ERROR HANDLING STANDARDS

### Standardized Error Handling

**Always use ErrorHandlingService instead of console.error:**

```typescript
// ✅ CORRECT: Standardized error handling
try {
  const result = await apiBridge.fetchData();
  return result;
} catch (error) {
  const ehs = ErrorHandlingService.getInstance();
  const processed = ehs.processError(
    error,
    'Failed to fetch data',
    ErrorCodes.DATA.QUERY_FAILED,
    {
      component: 'MyComponent',
      operation: 'fetchData',
    }
  );
  throw processed;
}

// ❌ WRONG: Direct console.error
try {
  const result = await apiBridge.fetchData();
  return result;
} catch (error) {
  console.error('Failed to fetch data:', error);
  throw error;
}
```

### Error Handling Checklist

- [ ] Use `ErrorHandlingService.getInstance().processError()`
- [ ] Include proper error codes from existing categories
- [ ] Add component and operation metadata
- [ ] Declare variables used in error metadata outside try blocks
- [ ] Use `getUserFriendlyMessage()` for user-facing errors

## 🚨 CRITICAL: TYPE SAFETY & VALIDATION

### TypeScript Compliance

**Maintain 100% TypeScript compliance:**

```bash
# Run type checking before any commit
npm run type-check
```

### Zod Validation at Boundaries

**Use Zod schemas for runtime validation:**

```typescript
// ✅ CORRECT: Zod validation with preprocessing
const ProposalQuerySchema = z.object({
  status: z.preprocess(
    val => {
      if (!val || typeof val !== 'string') return undefined;
      const upperVal = val.toUpperCase();
      const validStatuses = ['DRAFT', 'IN_REVIEW', 'PENDING_APPROVAL'];
      return validStatuses.includes(upperVal) ? upperVal : undefined;
    },
    z.enum(['DRAFT', 'IN_REVIEW', 'PENDING_APPROVAL']).optional()
  ),
});
```

## 🚨 CRITICAL: PERFORMANCE OPTIMIZATION

### React Query Integration

**Use React Query for complex data fetching:**

```typescript
// ✅ CORRECT: React Query pattern
export function useProductList(options: UseProductOptions = {}) {
  const { staleTime = 30000, gcTime = 120000, ...bridgeOptions } = options;
  const apiBridge = useProductManagementApiBridge(bridgeOptions);

  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.list(bridgeOptions),
    queryFn: async () => {
      const result = await apiBridge.fetchProducts(bridgeOptions);
      return result.data || [];
    },
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
```

### Minimal Field Selection

**Request only needed fields to reduce payload size:**

```typescript
// ✅ CORRECT: Minimal field selection
const endpoint = `/products?limit=30&fields=id,name,price,category,isActive`;

// ❌ WRONG: Over-fetching
const endpoint = `/products?limit=50&includeCustomer=true&includeTeam=true`;
```

## 🚨 CRITICAL: COMPONENT ARCHITECTURE

### Server/Client Component Separation

**Proper separation of Server and Client Components:**

```typescript
// ✅ CORRECT: Server Component with async params
export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  return (
    <ProductEditPageContent params={resolvedParams} />
  );
}

// ✅ CORRECT: Client Component with hooks
'use client';
export function ProductEditPageContent({ params }: { params: { id: string } }) {
  const { data: product, isLoading } = useProductDetail(params.id);
  // ... rest of component logic
}
```

### Component Responsibility

**Single source of truth for state management:**

```typescript
// ✅ CORRECT: Parent manages state, child uses props
function ParentComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});

  return (
    <ChildComponent
      search={searchTerm}
      filters={filters}
      onSearchChange={setSearchTerm}
      onFiltersChange={setFilters}
    />
  );
}

// ❌ WRONG: Child duplicates parent state
function ChildComponent() {
  const [searchTerm, setSearchTerm] = useState(''); // Duplicate state!
  // ...
}
```

## 🚨 CRITICAL: DEBUGGING & TROUBLESHOOTING

### Debug Logging Standards

**Use structured logging for debugging:**

```typescript
// ✅ CORRECT: Structured debug logging
logDebug('Component render', {
  component: 'MyComponent',
  operation: 'render',
  dataCount: data?.length || 0,
  userStory: 'US-3.1',
  hypothesis: 'H5',
});

// ❌ WRONG: Unstructured logging
console.log('Component rendered with data:', data);
```

### API Response Validation

**Always validate API response structure:**

```bash
# Use CLI to inspect actual API responses
npx tsx scripts/app-cli.ts --command "get /api/products"

# Check response structure before implementing TypeScript interfaces
```

### Common Debugging Patterns

**For infinite loops:**

1. Check useEffect dependency arrays
2. Look for direct bridge calls in render cycles
3. Verify event subscriptions are properly cleaned up

**For search/filter issues:**

1. Check parameter precedence in bridge fetch methods
2. Add debug logging to trace parameter flow
3. Verify API calls include expected parameters

**For API response issues:**

1. Inspect actual API response in Network tab
2. Validate TypeScript interfaces against actual responses
3. Check for nested vs flat response structures

## Implementation Checklist

When implementing bridge patterns, ensure:

- [ ] All useEffect hooks use empty dependency arrays for mount-only effects
- [ ] All bridge.set\* calls are wrapped in setTimeout
- [ ] All analytics calls are deferred when in callbacks
- [ ] Event subscriptions are properly cleaned up
- [ ] Auto-refresh mechanisms use empty dependency arrays
- [ ] State updates that might trigger re-renders are deferred
- [ ] Parameter precedence is correct in bridge fetch methods
- [ ] TypeScript interfaces match actual API response structures
- [ ] Provider hierarchy is correctly established
- [ ] Authentication guards are implemented
- [ ] Error handling uses ErrorHandlingService
- [ ] TypeScript compliance is maintained (0 errors)
- [ ] Performance optimizations are applied
- [ ] Component responsibilities are clearly defined

## Common Pitfalls to Avoid

1. **Including unstable functions in useEffect dependencies**
2. **Making direct bridge calls during render cycles**
3. **Forgetting to clean up event subscriptions**
4. **Including refresh functions in auto-refresh dependencies**
5. **Making analytics calls directly in state update callbacks**
6. **Wrong parameter precedence in bridge fetch methods** - Always use
   `...state.filters, ...params` order
7. **Mismatched API response interfaces** - Always validate TypeScript
   interfaces against actual API responses
8. **Missing GlobalStateProvider** - Always include in layout hierarchy
9. **Missing authentication guards** - Always check authentication before API
   calls
10. **Using console.error instead of ErrorHandlingService** - Always use
    standardized error handling
11. **Over-fetching data** - Always use minimal field selection
12. **Duplicating state between parent and child components** - Use props
    instead

## Migration Process

### Step 1: Provider Setup (CRITICAL FIRST STEP)

1. **Update layout hierarchy** to include GlobalStateProvider
2. **Verify provider order** is correct
3. **Test provider availability** in development
4. **Add authentication providers** for standalone routes

### Step 2: Identify Components for Migration

Look for components that:

- Have complex state management
- Make multiple API calls
- Need error handling
- Require analytics tracking
- Have performance issues

### Step 3: Choose the Right Template

- **Management Bridge**: For components that manage UI state and user
  interactions
- **API Bridge**: For components that primarily handle data fetching and API
  operations

### Step 4: Apply Infinite Loop Prevention Patterns

1. Replace useEffect dependencies with empty arrays where appropriate
2. Wrap all bridge calls in setTimeout
3. Defer analytics calls in callbacks
4. Ensure proper cleanup of subscriptions

### Step 5: Implement Authentication & Error Handling

1. Add authentication guards to components
2. Implement standardized error handling
3. Add proper session data structure handling
4. Verify role extraction logic

### Step 6: Test Thoroughly

- Test component mounting/unmounting
- Test data fetching and updates
- Test error scenarios
- Test performance under load
- Verify no infinite loops in console
- Test authentication flows
- Verify provider hierarchy

## Template Usage

### Management Bridge Template

```bash
# Copy template
cp templates/design-patterns/bridge/management-bridge.template.tsx src/components/bridges/MyEntityManagementBridge.tsx

# Replace placeholders
sed -i 's/__BRIDGE_NAME__/MyEntity/g' src/components/bridges/MyEntityManagementBridge.tsx
sed -i 's/__ENTITY_TYPE__/MyEntity/g' src/components/bridges/MyEntityManagementBridge.tsx
sed -i 's/__RESOURCE_NAME__/my-entities/g' src/components/bridges/MyEntityManagementBridge.tsx
sed -i 's/__USER_STORY__/US-X.X/g' src/components/bridges/MyEntityManagementBridge.tsx
sed -i 's/__HYPOTHESIS__/HX/g' src/components/bridges/MyEntityManagementBridge.tsx
```

### API Bridge Template

```bash
# Copy template
cp templates/design-patterns/bridge/api-bridge.template.ts src/lib/bridges/MyEntityApiBridge.ts

# Replace placeholders
sed -i 's/__BRIDGE_NAME__/MyEntity/g' src/lib/bridges/MyEntityApiBridge.ts
sed -i 's/__ENTITY_TYPE__/MyEntity/g' src/lib/bridges/MyEntityApiBridge.ts
sed -i 's/__RESOURCE_NAME__/my-entities/g' src/lib/bridges/MyEntityApiBridge.ts
sed -i 's/__USER_STORY__/US-X.X/g' src/lib/bridges/MyEntityApiBridge.ts
sed -i 's/__HYPOTHESIS__/HX/g' src/lib/bridges/MyEntityApiBridge.ts
```

## Verification

After migration, run:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Bridge compliance verification
node scripts/verify-all-bridge-compliance.js

# Performance testing
npm run test:performance

# Authentication testing
npm run test:authenticated
```

## Best Practices

1. **Always use templates** - Don't create bridges from scratch
2. **Follow infinite loop prevention patterns** - This is critical
3. **Set up provider hierarchy first** - Before migrating any components
4. **Implement authentication guards** - For all API-calling components
5. **Use standardized error handling** - Always use ErrorHandlingService
6. **Test thoroughly** - Especially error scenarios and authentication flows
7. **Document user stories and hypotheses** - For traceability
8. **Include analytics** - Track user interactions and performance
9. **Optimize for performance** - Use caching and deduplication
10. **Maintain TypeScript compliance** - 0 errors at all times

## Troubleshooting

### Common Issues

1. **TypeScript errors**: Check import paths and type definitions
2. **Runtime errors**: Verify bridge initialization and cleanup
3. **Performance issues**: Check caching and deduplication
4. **Infinite loops**: Apply the infinite loop prevention patterns above
5. **Provider errors**: Check GlobalStateProvider is in layout hierarchy
6. **Authentication errors**: Verify authentication guards and session handling
7. **API errors**: Validate API response structures and URL construction

### Getting Help

1. Check the template documentation
2. Review existing bridge implementations
3. Run compliance verification
4. Check the console for error messages
5. Verify all patterns are applied correctly
6. Test authentication flows
7. Validate API endpoints exist

## Conclusion

The bridge pattern provides powerful state management and error handling
capabilities. By following these instructions and applying the critical patterns
for infinite loop prevention, provider hierarchy, authentication integration,
and proper parameter handling, you can create robust, performant components that
integrate seamlessly with the PosalPro MVP2 architecture.

Remember: **Always apply these critical patterns**:

1. **Provider hierarchy setup** - Critical for bridge functionality
2. **Authentication integration** - Critical for API access
3. **Infinite loop prevention** - Critical for preventing runtime errors
4. **Proper parameter precedence** - Critical for search/filter functionality
5. **API response structure validation** - Critical for navigation and form
   handling
6. **Standardized error handling** - Critical for debugging and observability
7. **TypeScript compliance** - Critical for maintainability

These patterns ensure smooth user experience, maintainable code, and robust
error handling while preventing the common issues encountered during bridge
migrations.
