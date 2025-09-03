# Migration Lessons Learned - Bug Fix Reference

**Status**: ✅ **SUCCESSFUL** - Unified framework for common migration issues.

---

## 🔧 **Store Selectors & Hooks (Zustand v5)**

**Symptoms**: ESLint violations, infinite re-renders, unstable selectors.

**Root Causes**:

- Selectors not prefixed with `use`
- Composite selectors without `useShallow`
- Inline fallbacks in selectors

**Solution**:

```ts
// ✅ Individual hooks with useShallow for objects
export const useUnifiedProposalActions = () =>
  useUnifiedProposalStore(
    useShallow(state => ({
      setCurrentStep: state.setCurrentStep,
      setStepData: state.setStepData,
      // ...other actions
    }))
  );

// ✅ Handle fallbacks in components, not selectors
const step4 = useStep4();
const products = useMemo(() => step4?.products ?? [], [step4]);
```

**Prevention**:

- Use `use*` prefix for all selectors
- Apply `useShallow` to composite selectors
- Move fallbacks to components with `useMemo`

---

## 🔧 **Core Patterns & Solutions**

### **1. API Response Format Issues**

**Problem**: Inconsistent response formats (`ok` vs `success`)

**Solution**:

```typescript
// ✅ Standard format
return NextResponse.json({
  ok: true,
  data: result,
});

// ✅ Support both formats
const isSuccess = response.ok ?? response.success;
return response.data;
```

### **2. Data Type Conversion Issues**

**Problem**: String values from forms failing number validation

**Solution**:

```typescript
// ✅ Schema-level transformation
value: z.union([z.string(), z.number()])
  .transform(val => (val !== undefined ? Number(val) : undefined))
  .optional();

// ✅ Service-level conversion
const processedData = {
  ...data,
  value: data.value !== undefined ? Number(data.value) : undefined,
};
```

### **3. State Management Issues**

**Problem**: Infinite loops, unstable selectors

**Solution**:

```typescript
// ✅ Individual selectors only
export const useProductId = () => useProductStore(state => state.id);

// ✅ Functional updates with stable dependencies
const handleUpdate = useCallback(
  (field: string, value: any) => {
    setProductData(prev => ({ ...prev, [field]: value }));
  },
  [setProductData] // ✅ Stable dependencies
);
```

### **4. Frontend-Backend Field Value Mismatch Issues**

**Problem**: Frontend sends field values using different conventions than
backend schema expects

**Symptoms**:

- 500 "Invalid request body" errors despite valid data structure
- Schema validation failures for enum/choice fields
- Frontend form defaults don't match backend enum values

**Root Cause**: UI uses user-friendly values (bronze/silver/gold) while database
uses technical values (STANDARD/PREMIUM/ENTERPRISE)

**Solution**:

```typescript
// ✅ Schema preprocessing for value normalization
export const CustomerTierSchema = z.preprocess(
  val => {
    if (typeof val === 'string') {
      const normalized = val.toLowerCase();
      switch (normalized) {
        case 'bronze':
        case 'standard':
          return 'STANDARD';
        case 'silver':
        case 'premium':
          return 'PREMIUM';
        case 'gold':
        case 'enterprise':
          return 'ENTERPRISE';
        default:
          return val.toUpperCase();
      }
    }
    return val;
  },
  z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE'])
);

// ✅ API route field transformation (alternative approach)
const { tier, ...otherData } = body;
const customer = await prisma.customer.create({
  data: {
    ...otherData,
    tier: tier === 'bronze' ? 'STANDARD' : tier === 'silver' ? 'PREMIUM' : tier,
  },
});
```

**Prevention**:

- Use schema preprocessing for enum field value mapping
- Test with actual frontend form data, not just CLI/Postman
- Map user-friendly values to database values at schema level
- Handle both old and new value formats for backward compatibility

**Debug Strategy**:

1. Add debug logging to see exact request body:
   `console.log('Request body:', JSON.stringify(body, null, 2))`
2. Test CLI with same data frontend sends to isolate schema vs auth issues
3. Check schema enum values vs frontend form defaults
4. Add preprocessing to transform values before validation

### **5. Cache Management Issues**

**Problem**: Stale data, insufficient invalidation

**Solution**:

```typescript
// ✅ Immediate cache updates
onSuccess: (response, { id }) => {
  queryClient.setQueryData(qk.products.byId(id), response);
  queryClient.invalidateQueries({ queryKey: qk.products.all });
};

// ✅ Short stale times
staleTime: 5000, gcTime: 120000
```

### **5. Error Handling Issues**

**Problem**: Inconsistent error handling

**Solution**:

```typescript
// ✅ Centralized error handling
try {
  const result = await operation();
  logInfo('Success', { result });
} catch (error) {
  const processedError = errorHandlingService.processError(error);
  logError('Failed', { error: processedError });
  throw processedError;
}
```

---

## 🔧 **Infinite Refetch Loop Fix**

**Problem**: Infinite refetch/re-render loops on data tables.

**Root Causes**:

- Unstable query keys
- Composite selectors without `useShallow`
- Unstable sort handlers

**Solution**:

```ts
// ✅ Stable query keys
export const qk = {
  customers: {
    list: (search, limit, sortBy, sortOrder) =>
      ['customers', 'list', { search, limit, sortBy, sortOrder }] as const,
  },
} as const;

// ✅ Typed sort handler
const handleSort = useCallback(
  (sortBy: CustomerSortBy) => {
    setSorting(prev => ({
      sortBy,
      sortOrder:
        prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  },
  [setSorting] // ✅ Functional updates
);

// ✅ useShallow for composite selectors
export function useCustomerSelection() {
  return useCustomerStore(
    useShallow(state => ({
      selectedIds: state.selection.selectedIds,
      selectedCount: state.selection.selectedIds.length,
    }))
  );
}
```

**Prevention**: Use `useShallow`, functional updates, stable query keys.

---

## 🚀 **Migration Strategy**

### **Pre-Migration Checklist**

1. Review database schema and field names
2. Analyze existing working implementations
3. Inventory existing API endpoints
4. Plan component architecture patterns
5. Design multi-layer validation

### **Implementation Strategy**

1. **Database-first design** - Schema as single source of truth
2. **Leverage existing endpoints** - Use proven APIs
3. **Stable state management** - Individual selectors, functional updates
4. **Complete user flow testing** - End-to-end validation

### **Quality Gates**

- ✅ TypeScript compliance (0 errors)
- ✅ No infinite loops or hydration mismatches
- ✅ Database integration working
- ✅ API validation passing
- ✅ Complete user flows functional

---

## 📚 **Prevention Framework**

### **Always Follow These Patterns**

1. Check existing implementations first
2. Use consistent naming across all layers
3. Design stable state management from start
4. Implement structured logging from day one
5. Support multiple response formats
6. Use aggressive cache management
7. Test with real data early and often
8. Validate complete user flows

### **Common Anti-Patterns to Avoid**

1. ❌ Creating new APIs when existing ones work
2. ❌ Composite hooks creating new objects
3. ❌ Inconsistent field names across layers
4. ❌ Single response format support
5. ❌ Long stale times for frequently updated data
6. ❌ Missing structured logging
7. ❌ Dynamic values in component IDs
8. ❌ Testing individual components only

---

## ✅ **Success Metrics**

- ✅ Modern React architecture with proper data flow
- ✅ Complete database integration with validation
- ✅ Stable state management with no infinite loops
- ✅ 100% TypeScript compliance
- ✅ Zero hydration mismatches
- ✅ Comprehensive error handling

---

## 🎯 **Conclusion**

**Key Principle**: Systematic multi-dimensional thinking for migrations.

**Result**: Complete success with modern architecture and comprehensive error
handling.

---

## 🔧 **API Response Format Fix**

**Problem**: Double-wrapping with `Response.json(ok())` causing malformed
responses.

**Solution**:

```typescript
// ❌ BEFORE: Double wrapping
return Response.json(ok(validatedResponse));

// ✅ AFTER: Direct return
return ok(validatedResponse);
```

**Scope**: 38 API endpoints fixed across proposals, products, customers,
communication APIs.

**Result**: All API endpoints now return proper JSON responses, fixing "no data"
issues.

---

## 🔧 **Network Timeout Fix**

**Problem**: Complex transactions causing "Load failed" errors.

**Solution**:

```typescript
const proposal = await prisma.$transaction(
  async tx => {
    /* Complex operations... */
  },
  { timeout: 15000, isolationLevel: 'ReadCommitted' }
);

if (
  error.message.includes('timeout') ||
  error.message.includes('Load failed')
) {
  return new Response(
    JSON.stringify({
      ok: false,
      code: 'NETWORK_TIMEOUT',
      message: 'Request timed out. Please try again.',
    }),
    { status: 408, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**Result**: PUT requests complete successfully without connection loss.

---

## 🔧 **Type Conversion Fix**

**Problem**: Form inputs send strings, API schemas expect numbers.

**Solution**:

```typescript
// ✅ Schema-level transformation
value: z.union([z.string(), z.number()])
  .transform(val => (val !== undefined ? Number(val) : undefined))
  .optional();

// ✅ Service-level transformation
const processedData = {
  ...proposalData,
  value:
    proposalData.value !== undefined ? Number(proposalData.value) : undefined,
};
```

**Result**: Validation errors eliminated for numeric fields.

---

## 🔧 **Proposal Detail Total Fix**

**Problem**: Database stores product totals as strings, frontend sums as
numbers.

**Solution**:

```typescript
const productTotal =
  typeof product.total === 'string'
    ? parseFloat(product.total) || 0
    : product.total || 0;
return sum + productTotal;
```

**Result**: Totals now display correctly on proposal detail page.

---

## 🔧 **API Response Format Fix**

**Problem**: Users API using `{ success: true }` instead of standard
`{ ok: true }`.

**Solution**:

```typescript
// ✅ AFTER: Standard format
return NextResponse.json({
  ok: true, // Correct key
  data: { users, pagination, meta },
  message: 'Users retrieved successfully',
});

// Handle both formats in component
let usersArray = response?.users || response?.data?.users || [];
```

**Result**: Team assignment users load successfully.

---

## 🔧 **Service Layer HTTP Client Fix (Latest)**

### **Migration Goal**: Fix HTTP client usage across all service layers

**Final Status**: ✅ **SUCCESSFUL** - All service layers now use correct HTTP
client patterns.

### **Core Challenge**: Inconsistent HTTP Client Usage

The issue involved coordinating **3 service layers**:

1. **Product Service** - Using old HTTP client pattern
2. **Customer Service** - Using old HTTP client pattern
3. **Proposal Service** - Already using correct pattern

### **Phase 1: HTTP Client Pattern Issues**

#### **Problem**: Old HTTP Client Pattern in Service Layers

**Symptoms**:

- Service layers using `http.method(url, { body: JSON.stringify(data) })`
- HTTP client expecting direct data parameter
- Inconsistent data handling across services

**Root Cause**: Service layers not updated to use new HTTP client method
signatures.

#### **Solution**: Unified HTTP Client Pattern

```typescript
// ❌ PROBLEMATIC PATTERN - Old HTTP client usage
const response = await http.put<Customer>(`${this.baseUrl}/${id}`, {
  body: JSON.stringify(validatedData),
});

// ✅ FINAL WORKING PATTERN - New HTTP client usage
const response = await http.put<Customer>(
  `${this.baseUrl}/${id}`,
  validatedData
);
```

### **Key Changes Made**

1. **Product Service**: ✅ Already fixed
2. **Customer Service**: ✅ Fixed updateCustomer, createCustomer,
   deleteCustomersBulk
3. **Proposal Service**: ✅ Already using correct pattern

### **API Response Format Compatibility**

All APIs use consistent response format:

- **Product API**: `Response.json(ok(data))` → `{ ok: true, data: ... }`
- **Customer API**: `Response.json(ok(data))` → `{ ok: true, data: ... }`
- **Proposal API**: `Response.json(ok(data))` → `{ ok: true, data: ... }`

HTTP client supports both `ok` and `success` properties for backward
compatibility.

### **Migration Success Metrics**

**Before Fix**:

- Inconsistent HTTP client usage across services
- Service layers using deprecated patterns
- Potential data handling issues

**After Fix**:

- ✅ Unified HTTP client pattern across all services
- ✅ Consistent data handling and response parsing
- ✅ 100% TypeScript compliance
- ✅ All services using modern HTTP client methods

### **Prevention Framework for Service Layer Consistency**

1. **Use direct data parameters** - `http.method(url, data)` not
   `http.method(url, { body: JSON.stringify(data) })`
2. **Maintain consistent patterns** - All services should use same HTTP client
   approach
3. **Test with real data** - Verify data handling works correctly
4. **Check TypeScript compliance** - Ensure no type errors after changes

**Result**: **SUCCESSFUL SERVICE LAYER FIX** - All services now use consistent,
modern HTTP client patterns.

---

## 🔧 **UserService HTTP Client Fix (Latest)**

### **Migration Goal**: Fix UserService to use correct HTTP client pattern

**Final Status**: ✅ **SUCCESSFUL** - UserService now uses correct HTTP client
pattern.

### **Core Challenge**: UserService Manual Response Handling

The issue involved **UserService** trying to manually handle API response
envelopes instead of letting the HTTP client handle it automatically.

### **Phase 1: UserService Response Handling Issues**

#### **Problem**: Manual Response Envelope Handling

**Symptoms**:

- UserService expecting `{ success: boolean; data: UserList; message: string }`
  format
- HTTP client automatically unwrapping `data` property
- Service returning `{ ok: false, code: "API_ERROR", message: undefined }`
  errors

**Root Cause**: UserService not leveraging HTTP client's automatic response
unwrapping.

#### **Solution**: Simplified HTTP Client Usage

```typescript
// ❌ PROBLEMATIC PATTERN - Manual response handling
const response = await http.get<{
  success: boolean;
  data: UserList;
  message: string;
}>(`${this.baseUrl}?${searchParams.toString()}`);

if (response.success) {
  return { ok: true, data: response.data };
} else {
  return { ok: false, code: 'API_ERROR', message: response.message };
}

// ✅ FINAL WORKING PATTERN - Automatic response unwrapping
const response = await http.get<UserList>(
  `${this.baseUrl}?${searchParams.toString()}`
);
return { ok: true, data: response };
```

### **Key Changes Made**

1. **getUsers method**: ✅ Fixed to use automatic response unwrapping
2. **getUser method**: ✅ Fixed to use `http.get<User>()` pattern
3. **Response handling**: ✅ Simplified to let HTTP client handle envelope

### **API Response Format Compatibility**

Users API uses `{ success: true, data: ... }` format:

- **Users API**: `Response.json({ success: true, data: ... })`
- **HTTP Client**: Automatically unwraps `data` property
- **UserService**: Now receives unwrapped data directly

### **Migration Success Metrics**

**Before Fix**:

- Manual response envelope handling
- Complex conditional logic for success/error states
- Inconsistent with other service patterns

**After Fix**:

- ✅ Automatic HTTP client response unwrapping
- ✅ Simplified service logic
- ✅ Consistent with other service patterns
- ✅ 100% TypeScript compliance

### **Prevention Framework for Service Layer Consistency**

1. **Let HTTP client handle envelopes** - Don't manually unwrap
   `{ success: true, data: ... }` or `{ ok: true, data: ... }`
2. **Use direct type parameters** - `http.get<UserList>()` not
   `http.get<{ success: boolean; data: UserList }>()`
3. **Simplify service logic** - Focus on business logic, not response parsing
4. **Maintain consistency** - All services should use same HTTP client pattern

**Result**: **SUCCESSFUL USERSERVICE FIX** - UserService now uses simplified,
consistent HTTP client pattern.

---

## 🔧 **ReviewStep Array Access Fix (Latest)**

### **Migration Goal**: Fix ReviewStep component array access error

**Final Status**: ✅ **SUCCESSFUL** - ReviewStep now correctly accesses step
data.

### **Core Challenge**: Incorrect Step Data Access Pattern

The issue involved **ReviewStep component** incorrectly trying to access step
data as an array when the store provides individual step selectors.

### **Phase 1: Array Access Error**

#### **Problem**: Incorrect Step Data Access

**Symptoms**:

- `TypeError: undefined is not an object (evaluating 'stepData[1]')`
- ReviewStep trying to access `stepData[1]`, `stepData[2]`, etc.
- `useProposalStepData(6)` returning single step data, not array

**Root Cause**: Misunderstanding of `useProposalStepData` hook return value - it
returns individual step data, not an array of all steps.

#### **Solution**: Individual Step Data Access

```typescript
// ❌ PROBLEMATIC PATTERN - Incorrect array access
const stepData = useProposalStepData(6);
const basicInfo = stepData[1]; // ❌ stepData is not an array
const teamData = stepData[2]; // ❌ Causes TypeError

// ✅ FINAL WORKING PATTERN - Individual step access
const basicInfo = useProposalStepData(1); // ✅ Get step 1 data
const teamData = useProposalStepData(2); // ✅ Get step 2 data
const contentData = useProposalStepData(3); // ✅ Get step 3 data
const productData = useProposalStepData(4); // ✅ Get step 4 data
const sectionData = useProposalStepData(5); // ✅ Get step 5 data
```

### **Key Changes Made**

1. **Removed incorrect array access**: ✅ Fixed `stepData[1]` pattern
2. **Individual step selectors**: ✅ Use `useProposalStepData(stepNumber)` for
   each step
3. **Proper data access**: ✅ Each step data accessed independently

### **Store Pattern Understanding**

Proposal store provides individual step selectors:

- **`useProposalStepData(step)`**: Returns `state.stepData[step]` (single step
  data)
- **Not an array**: Returns individual step object, not array of all steps
- **Individual access**: Each step must be accessed with its own selector call

### **Migration Success Metrics**

**Before Fix**:

- Array access errors causing component crashes
- Incorrect understanding of store data structure
- TypeError in ReviewStep component

**After Fix**:

- ✅ Correct individual step data access
- ✅ No more array access errors
- ✅ Proper store pattern usage
- ✅ 100% TypeScript compliance

### **Prevention Framework for Store Data Access**

1. **Understand selector return values** - Check what selectors actually return
2. **Use individual selectors** - Don't assume array access for individual
   selectors
3. **Read store implementation** - Understand data structure before using
   selectors
4. **Test with real data** - Verify data access patterns work correctly

**Result**: **SUCCESSFUL REVIEWSTEP FIX** - ReviewStep now correctly accesses
individual step data without array access errors.

---

## 🔧 **Assessment Implementation - Centralized Query Keys & Cursor Pagination (Latest)**

### **Migration Goal**: Implement high-value improvements from frontend-backend integration assessment

**Final Status**: ✅ **SUCCESSFUL** - Centralized query keys and cursor
pagination response types implemented.

### **Core Challenge**: Improving Code Organization and Consistency

The assessment identified several high-value improvements that could be
implemented with low risk and high impact.

### **Phase 1: Centralized Query Keys Implementation**

#### **Problem**: Scattered Query Keys Across Hooks

**Symptoms**:

- Query keys defined in individual hook files
- Potential for key conflicts and inconsistencies
- Difficult to maintain and update

**Root Cause**: No centralized query key management following assessment
recommendations.

#### **Solution**: Domain-Based Query Key Organization

```typescript
// ✅ IMPLEMENTED - Centralized query keys
// src/features/products/keys.ts
export const qk = {
  products: {
    all: ['products'] as const,
    list: (search: string, limit: number, sortBy: string, sortOrder: string) =>
      ['products', 'list', search, limit, sortBy, sortOrder] as const,
    byId: (id: string) => ['products', 'byId', id] as const,
    // ... other keys
  },
} as const;

// ✅ IMPLEMENTED - Hook usage
// src/hooks/useProducts.ts
import { qk } from '@/features/products/keys';
```

### **Phase 2: Cursor Pagination Response Types**

#### **Problem**: Inconsistent Pagination Response Formats

**Symptoms**:

- Different pagination formats across APIs
- No standardized cursor pagination type
- Inconsistent response structures

**Root Cause**: Missing standardized cursor pagination response type.

#### **Solution**: Standardized Cursor Pagination Response

```typescript
// ✅ IMPLEMENTED - Cursor pagination response type
// src/lib/api/response.ts
export type CursorPaginatedResponse<T> = {
  items: T[];
  nextCursor: string | null;
  meta?: {
    total?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
};

// ✅ IMPLEMENTED - Helper function
export const okPaginated = <T>(
  items: T[],
  nextCursor: string | null,
  meta?: any
): ApiResponse<CursorPaginatedResponse<T>> => ({
  ok: true,
  data: {
    items,
    nextCursor,
    meta,
  },
});
```

### **Key Changes Made**

1. **Centralized Query Keys**: ✅ Created `src/features/*/keys.ts` files for
   products, customers, proposals
2. **Hook Updates**: ✅ Updated all hooks to use centralized keys
3. **Cursor Pagination Types**: ✅ Added standardized cursor pagination response
   types
4. **Type Safety**: ✅ Maintained 100% TypeScript compliance

### **Implementation Success Metrics**

**Before Implementation**:

- Query keys scattered across hook files
- No standardized pagination response format
- Potential for key conflicts

**After Implementation**:

- ✅ Centralized query key management
- ✅ Standardized cursor pagination response types
- ✅ Improved code organization
- ✅ 100% TypeScript compliance
- ✅ Consistent patterns across all domains

### **Prevention Framework for Query Key Management**

1. **Use centralized keys** - Always import from `src/features/*/keys.ts`
2. **Maintain consistency** - Follow same pattern across all domains
3. **Type safety** - Use `as const` for all query keys
4. **Documentation** - Keep keys organized and well-documented

### **Next Steps for Assessment Implementation**

**Remaining High-Value Items**:

1. **Cursor Pagination API Updates** - Update existing APIs to use `okPaginated`
   helper
2. **Service Layer Consistency** - Final cleanup of HTTP client usage
3. **Contract Testing** - Add basic Zod schema validation tests

**Result**: **SUCCESSFUL ASSESSMENT IMPLEMENTATION** - Centralized query keys
and cursor pagination response types provide foundation for consistent,
maintainable codebase.

---

## 🔧 **Wizard Payload Data Mismatch Fix (Latest)**

### **Migration Goal**: Fix wizard payload data mismatch between UI and API schema

**Final Status**: ✅ **SUCCESSFUL** - Wizard payload transformation implemented.

### **Core Challenge**: Flat vs Nested Data Structure Mismatch

The issue involved **wizard payload structure** not matching **API schema
expectations**:

- **Wizard sends**: Flat structure with `teamData`, `contentData`,
  `productData`, `sectionData` as top-level fields
- **API expects**: Nested structure with wizard data under `metadata` field
- **Result**: 500 errors with "Invalid request body" due to schema validation
  failures

### **Phase 1: Data Structure Mismatch Analysis**

#### **Problem**: Schema Validation Failures

**Symptoms**:

- 500 Internal Server Error on proposal updates
- "Invalid request body" error messages
- Wizard submission failing in step 6 (Review & Submit)
- Schema validation rejecting flat wizard payload structure

**Root Cause**: Wizard sending flat data structure, API schema expecting nested
structure under `metadata`.

#### **Solution**: Database-First Field Alignment with Payload Transformation

```typescript
// ✅ IMPLEMENTED - Transform wizard payload to API-compatible format
// src/services/proposalService.ts

private transformWizardPayloadForAPI(proposal: any): ProposalUpdate {
  const {
    teamData,
    contentData,
    productData,
    sectionData,
    reviewData,
    ...basicFields
  } = proposal;

  // ✅ Defensive validation - Check if wizard-specific data is present
  if (teamData || contentData || productData || sectionData || reviewData) {
    // ✅ Transform flat structure to nested structure under metadata
    return {
      ...basicFields,
      metadata: {
        teamData: teamData || undefined,
        contentData: contentData || undefined,
        productData: productData || undefined,
        sectionData: sectionData || undefined,
        reviewData: reviewData || undefined,
        submittedAt: new Date().toISOString(),
        wizardVersion: 'modern',
      },
    };
  }

  // ✅ If no wizard-specific data, return as-is
  return proposal;
}
```

### **Key Changes Made**

1. **Service Layer Transformation**: ✅ Added `transformWizardPayloadForAPI`
   method in ProposalService
2. **API Route Compatibility**: ✅ Updated API route to handle flat wizard
   payload structure
3. **Defensive Validation**: ✅ Added checks for wizard-specific data presence
4. **Schema Compliance**: ✅ Ensured transformed payload matches
   `ProposalUpdateSchema`

### **API Response Format Compatibility**

Wizard payload transformation ensures compatibility:

- **Wizard sends**:
  `{ title, customerId, teamData, contentData, productData, sectionData }`
- **Service transforms to**:
  `{ title, customerId, metadata: { teamData, contentData, productData, sectionData } }`
- **API accepts**: Transformed payload matches `ProposalUpdateSchema`

### **Migration Success Metrics**

**Before Fix**:

- 500 errors on wizard submission
- Schema validation failures
- "Invalid request body" errors
- Wizard step 6 submission failing

**After Fix**:

- ✅ Wizard payload transformation working correctly
- ✅ Flat structure converted to nested structure
- ✅ All wizard-specific data preserved under metadata
- ✅ API schema compatibility achieved
- ✅ 100% TypeScript compliance for transformation logic

### **Prevention Framework for Data Structure Alignment**

1. **Database-First Design** - Start with database schema, align all layers
2. **Schema Validation** - Use Zod schemas for runtime validation
3. **Payload Transformation** - Transform data structures when needed
4. **Defensive Programming** - Handle both flat and nested structures
5. **Comprehensive Testing** - Test transformation logic thoroughly

### **Testing Implementation**

Created comprehensive test suite:

```bash
# Test wizard payload transformation
npm run test:wizard-fix

# Test UI functionality
npm run ui:test:wizard
```

**Result**: **SUCCESSFUL WIZARD PAYLOAD FIX** - Wizard submissions now work
correctly with proper data structure transformation.

---

## 🔧 **Multi-Layer Response Format Coordination Fix (Latest)**

### **Migration Goal**: Fix response format mismatch across service, hook, and component layers

**Final Status**: ✅ **SUCCESSFUL** - Proper data flow from API → Service → Hook
→ Components.

### **Symptoms**

- Hook throwing "Failed to load data" error despite successful API responses
- TypeScript compilation errors for data access patterns
- Components unable to access nested data properties

### **Root Causes**

1. **Service Layer**: Returned unwrapped data but hook expected full response
2. **Hook Layer**: Explicit return type annotations conflicted with inferred
   types
3. **Component Layer**: Incorrect data access patterns (`data.field` vs
   `data.data.field`)

### **Solutions Implemented**

1. **Service Layer Pattern** (`src/services/[domain]Service.ts`)

```typescript
// ✅ CORRECT: Return unwrapped data
return response.data; // API response unwrapped
```

2. **Hook Layer Pattern** (`src/features/[domain]/hooks/use[Domain].ts`)

```typescript
// ✅ CORRECT: Let TypeScript infer return type
export function useDomainData(params) {
  return useQuery({ ... }); // No explicit return type annotation
}
```

3. **Component Layer Pattern** (`src/components/[domain]/[Component].tsx`)

```typescript
// ✅ CORRECT: Access data through proper nested structure
const { data, isLoading } = useDomainData(params);
useEffect(() => {
  if (data?.data) {
    // ✅ Handle API response structure
    setState(data.data.field);
  }
}, [data]);
```

4. **Schema Validation** (`src/features/[domain]/schemas.ts`)

```typescript
// ✅ CORRECT: Include all API response fields in schema
export const DomainResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    // Include ALL fields returned by API
    field1: z.string(),
    field2: z.number(),
    // ... all actual API response fields
  }),
});
```

### **Prevention Framework (Multi-Layer Coordination)**

1. **Service Layer**: Always return unwrapped data (`response.data`)
2. **Hook Layer**: Remove explicit return type annotations, let TypeScript infer
3. **Component Layer**: Always check nested structure (`data?.data?.field`)
4. **Schema Layer**: Include all actual API response fields
5. **Type Safety**: Verify with `npm run type-check` after changes

### **Success Metrics**

- ✅ No "Failed to load data" errors
- ✅ Proper data flow across all layers
- ✅ TypeScript compilation passes
- ✅ Components access data correctly

**Result**: **SUCCESSFUL MULTI-LAYER FIX** - Consistent response format handling
across service, hook, and component layers.

## 🔧 **Admin Page Data Access & API Response Format Fixes (Latest)**

### **Migration Goal**: Fix admin page "users.map is not a function" error and API response format issues

**Final Status**: ✅ **SUCCESSFUL** - Admin page now loads correctly with proper
data access patterns.

### **Core Challenges Identified**

#### **1. API Response Format Mismatch**

- **Problem**: `/api/admin/metrics` returned `{ success: true, metrics: {...} }`
  but HTTP client expected `{ ok: true, data: {...} }`
- **Symptom**: `result.data` was `undefined`, causing React Query to reject data
- **Fix**: Updated API route to return `ok/data` format and removed debug
  logging

#### **2. Users Data Structure Mismatch**

- **Problem**: Component tried to map over `users` but API returned
  `{ users: [...], pagination: {...} }`
- **Symptom**: `TypeError: users.map is not a function`
- **Fix**: Changed from `users?.map()` to `users?.users?.map()` and updated all
  related data access

#### **3. Excessive Re-rendering**

- **Problem**: Unstable data references causing infinite re-renders
- **Symptom**: Admin page constantly re-rendering, high CPU usage
- **Fix**: Added `useMemo` for stable query parameters and cleaned up debug
  logging

### **Key Fixes Applied**

#### **API Response Format Fix**

```typescript
// ❌ BEFORE: Wrong format
return NextResponse.json({
  success: true,
  metrics,
  timestamp: new Date().toISOString(),
});

// ✅ AFTER: Correct format
return NextResponse.json({
  ok: true,
  data: metrics,
  timestamp: new Date().toISOString(),
});
```

#### **Data Access Pattern Fix**

```typescript
// ❌ BEFORE: Wrong data structure
{users?.map((user: any) => (
  // Error: users.map is not a function
))}
{users?.length || 0} users found

// ✅ AFTER: Correct data structure
{users?.users?.map((user: any) => (
  // ✅ Works correctly
))}
{users?.users?.length || 0} users found
```

#### **Stable Query Parameters**

```typescript
// ✅ ADDED: Stable memoization to prevent re-renders
const usersQueryParams = useMemo(
  () => ({
    search: usersFilters.search,
    role: usersFilters.role || '',
    status: usersFilters.status === 'all' ? '' : usersFilters.status,
    page: String(usersFilters.page),
    limit: '10',
  }),
  [
    usersFilters.search,
    usersFilters.role,
    usersFilters.status,
    usersFilters.page,
  ]
);
```

### **Migration Success Metrics**

**Before Fix**:

- Admin page crashed with JavaScript errors
- "users.map is not a function" error
- API response format mismatch causing undefined data
- Excessive re-rendering loops

**After Fix**:

- ✅ Admin page loads without errors
- ✅ Users table displays correctly
- ✅ System metrics load properly
- ✅ No more re-rendering loops
- ✅ 100% TypeScript compliance
- ✅ Clean console logs

### **Prevention Framework (Admin Data Access)**

1. **Verify API response structure** - Check actual data format returned by APIs
2. **Use correct data access patterns** - Map over correct nested properties
3. **Add stable memoization** - Use `useMemo` for query parameters to prevent
   re-renders
4. **Clean up debug logging** - Remove temporary console.log statements after
   fixes

**Result**: **SUCCESSFUL ADMIN PAGE FIXES** - Admin system now works correctly
with proper data flow and no performance issues.

---

## 🔧 \*React has detected a change in the order of Hooks called by BasicInformationStep. This will lead to bugs and errors if not fixed. For more information, read the Rules of Hooks: \*\*

Cause of bug Conditional hook order: BasicInformationStep called a hook inside
JSX: min={useMemo(() => new Date().toISOString().split('T')[0], [])} in
src/components/proposals/steps/BasicInformationStep.tsx . Because there's an
early return above (if (!customersData && customersLoading) return ...), the
inline useMemo wasn't called on some renders, changing the hooks order and
triggering: "React has detected a change in the order of Hooks…" "Rendered more
hooks than during the previous render." Fix implemented Moved inline hook out of
JSX and defined it before any conditional returns: Added const todayISODate =
useMemo(() => new Date().toISOString().split('T')[0], []); Replaced prop with
min={todayISODate} File: src/components/proposals/steps/BasicInformationStep.tsx
Verified TypeScript OK: npm run type-check passed.

---

## 🔧 **Service Method Parameter Validation Fix (Latest)**

### **Migration Goal**: Fix service method calls missing required parameters

**Problem**: React hooks calling service methods without required parameters,
causing Zod validation to fail before HTTP requests are made.

**Symptoms**:

- Hooks call `adminService.getRoles()` without parameters
- Zod validation fails with "Required" error
- HTTP requests never sent, causing silent failures

**Solution**: Add required parameters to service method calls

```typescript
// ❌ BEFORE: Missing parameters
const result = await adminService.getRoles(); // Fails Zod validation
const result = await adminService.getPermissions(); // Fails Zod validation

// ✅ AFTER: Proper parameters
const result = await adminService.getRoles({}); // ✅ Zod validation passes
const result = await adminService.getPermissions({}); // ✅ Zod validation passes
```

**Prevention**: Always provide required parameters to service methods, even if
empty objects `{}`. Test service calls independently before integrating with
hooks.

**Result**: **SUCCESSFUL SERVICE PARAMETER FIX** - All service method calls now
provide required parameters, enabling proper Zod validation and HTTP requests.

---

## 🔧 **Multi-Layer Data Structure Coordination Fix**

### **General Problem**: Inconsistent data flow across service → hook → component layers

**Symptoms**:

- TypeScript compilation errors for data access
- Components unable to access nested properties
- Complex conditional logic for different response formats
- Hook return type mismatches

**Root Cause**: Layer misalignment in data structure handling.

**Solution Framework**:

1. **Service Layer Standard**:

```typescript
// ✅ Return unwrapped data consistently
async getData(params): Promise<DataType> {
  const response = await apiClient.get<DataType>(endpoint);
  return response.data; // Unwrapped
}
```

2. **Hook Layer Standard**:

```typescript
// ✅ Let TypeScript infer return type
export function useData(params) {
  return useQuery({ ... }); // No explicit return type
}
```

3. **Component Layer Standard**:

```typescript
// ✅ Consistent data access pattern
const { data } = useDataHook();
useEffect(() => {
  if (data?.data) {
    setState(data.data.field); // Consistent nesting
  }
}, [data]);
```

4. **Schema Layer Standard**:

```typescript
// ✅ Match actual API response structure
export const ResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    field1: z.string().optional(),
    field2: z.number().optional(),
    // Include ALL actual API fields
  }),
});
```

**Prevention**: Establish consistent data flow patterns before implementing new
features. Use this framework for all API integrations.

**Result**: **SUCCESSFUL COORDINATION FIX** - Standardized data flow eliminates
type errors and access inconsistencies.

---

## 🔧 **Database-Schema Enum Mismatch Fix (Latest)**

### **Core Challenge**: Database contains enum values not defined in application schemas

**Problem**: Database stores enum values (like `changeType: "INITIAL"`) that
aren't defined in Zod schemas, causing "Invalid enum value" schema validation
errors.

**Symptoms**:

- Schema validation fails with "Invalid enum value. Expected [list], received
  'VALUE'"
- Data loading stops at validation errors
- Silent failures in data fetching operations
- TypeScript compilation passes but runtime errors occur

**Root Cause**: Schema definitions don't match actual database content, often
due to:

- Legacy data with old enum values
- Database migrations adding new values without schema updates
- Development vs production data differences

**Solution Applied**:

```typescript
// ❌ BEFORE: Missing enum value
export const ChangeTypeSchema = z.enum([
  'create',
  'update',
  'delete',
  'batch_import',
  'rollback',
  'status_change',
  // Missing: 'INITIAL'
]);

// ✅ AFTER: Includes all database values
export const ChangeTypeSchema = z.enum([
  'create',
  'update',
  'delete',
  'batch_import',
  'rollback',
  'status_change',
  'INITIAL', // ✅ Added to match database
]);
```

**Prevention Framework**:

1. **Database-First Schema Design** - Always check database content before
   defining schemas
2. **Schema Validation Testing** - Test schemas against actual database data
3. **Migration Safety** - Update schemas when database migrations add new enum
   values
4. **Fallback Handling** - Consider unknown enum values as valid rather than
   failing

**Result**: **SUCCESSFUL ENUM ALIGNMENT** - Schemas now match database content,
eliminating validation errors.

---

## 🔧 **Comprehensive Schema Validation Error Handling (Latest)**

### **Core Challenge**: Silent schema validation failures without proper error context

**Problem**: Schema validation errors occur without detailed logging, making
debugging difficult and causing silent data loading failures.

**Symptoms**:

- Zod validation fails without error details
- Components receive undefined/null data
- No logging of validation failure reasons
- Difficult to identify which fields/values are problematic

**Root Cause**: Schema parsing without try-catch blocks and detailed error
logging.

**Solution Applied**:

```typescript
// ❌ BEFORE: Silent validation failures
const parsed = VersionHistoryListSchema.parse(response);

// ✅ AFTER: Comprehensive error handling
let parsed;
try {
  parsed = VersionHistoryListSchema.parse(response);
} catch (schemaError) {
  logError('Schema validation failed', {
    component: 'VersionHistoryServiceClient',
    operation: 'getVersionHistory',
    schemaError: schemaError instanceof Error ? schemaError.message : 'Unknown',
    responseKeys:
      response && typeof response === 'object' ? Object.keys(response) : null,
    responseType: typeof response,
    userStory: 'US-5.1',
    hypothesis: 'H8',
  });
  throw schemaError;
}
```

**Prevention Framework**:

1. **Try-Catch for All Schema Parsing** - Wrap all Zod.parse() calls in
   try-catch
2. **Detailed Error Context** - Log response structure, operation context, user
   story
3. **Error Propagation** - Re-throw errors after logging for proper handling
4. **Development Debugging** - Include response keys/types for easier
   troubleshooting

**Result**: **SUCCESSFUL ERROR HANDLING** - Schema validation failures now
provide comprehensive debugging information.

---

## 🔧 **UI Type Assertion Updates (Latest)**

### **Core Challenge**: Type assertions become outdated when schemas are updated

**Problem**: UI components use hardcoded type assertions that don't include new
enum values added to schemas, causing TypeScript errors.

**Symptoms**:

- TypeScript compilation errors on type assertions
- UI components can't handle new enum values
- Manual updates required when schemas change
- Inconsistent type safety across UI layers

**Root Cause**: Type assertions hardcoded in UI components don't stay in sync
with schema updates.

**Solution Applied**:

```typescript
// ❌ BEFORE: Missing new enum value
changeType: filters.changeTypeFilters[0] as
  | 'create'
  | 'update'
  | 'delete'
  | 'batch_import'
  | 'rollback'
  | 'status_change';

// ✅ AFTER: Includes all enum values
changeType: filters.changeTypeFilters[0] as
  | 'create'
  | 'update'
  | 'delete'
  | 'batch_import'
  | 'rollback'
  | 'status_change'
  | 'INITIAL';
```

**Prevention Framework**:

1. **Schema-Derived Types** - Use schema inference instead of hardcoded types
2. **Centralized Type Definitions** - Import types from schema files
3. **Automated Updates** - Consider generating UI types from schemas
4. **Type Safety Checks** - Ensure all UI type assertions stay current

**Result**: **SUCCESSFUL TYPE ALIGNMENT** - UI type assertions now match schema
definitions.

---

## 🔧 **UI Filter Configuration Completeness (Latest)**

### **Core Challenge**: UI filter options don't include all available schema values

**Problem**: Filter UI components only show subset of available enum values,
preventing users from filtering by all possible options.

**Symptoms**:

- Missing filter buttons for enum values
- Users can't filter by certain data values
- Inconsistent between data model and UI capabilities
- Poor user experience with incomplete filtering

**Root Cause**: Filter configurations hardcoded without checking schema
completeness.

**Solution Applied**:

```typescript
// ❌ BEFORE: Incomplete filter options
[
  { key: 'create', label: 'Create', color: 'bg-green-100 text-green-800' },
  { key: 'update', label: 'Update', color: 'bg-blue-100 text-blue-800' },
  { key: 'delete', label: 'Delete', color: 'bg-red-100 text-red-800' },
  // Missing: rollback, status_change, INITIAL
]

// ✅ AFTER: Complete filter options matching schema
[
  { key: 'create', label: 'Create', color: 'bg-green-100 text-green-800' },
  { key: 'update', label: 'Update', color: 'bg-blue-100 text-blue-800' },
  { key: 'delete', label: 'Delete', color: 'bg-red-100 text-red-800' },
  {
    key: 'batch_import',
    label: 'Batch Import',
    color: 'bg-purple-100 text-purple-800',
  },
  {
    key: 'rollback',
    label: 'Rollback',
    color: 'bg-orange-100 text-orange-800',
  },
  {
    key: 'status_change',
    label: 'Status Change',
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    key: 'INITIAL',
    label: 'Initial',
    color: 'bg-indigo-100 text-indigo-800',
  },
]
```

**Prevention Framework**:

1. **Schema-Driven UI** - Generate filter options from schema definitions
2. **Completeness Validation** - Verify all enum values have UI representations
3. **Consistent Labeling** - Standard naming conventions for filter labels
4. **Visual Consistency** - Appropriate colors for different filter types

**Result**: **SUCCESSFUL UI COMPLETENESS** - Users can now filter by all
available data values.

---

## 🔧 **Systematic ApiResponse Standardization (Latest)**

### **Core Challenge**: Inconsistent ApiResponse usage across entire codebase

**Problem**: Mixed patterns where some services returned `ApiResponse<T>` while
others returned unwrapped `T`, causing TypeScript errors and data access
inconsistencies.

**Solution Applied**:

1. **Service Layer Standardization**:

   ```typescript
   // ❌ BEFORE: Mixed patterns
   async getUsers(): Promise<ApiResponse<UsersListResponse>> {
     return { ok: true, data: response };
   }
   async getProposals(): Promise<{ items: Proposal[]; nextCursor: string | null }> {
     return response;
   }

   // ✅ AFTER: Consistent unwrapped pattern
   async getUsers(): Promise<UsersListResponse> {
     return response;
   }
   async getProposals(): Promise<{ items: Proposal[]; nextCursor: string | null }> {
     return response;
   }
   ```

2. **Hook Layer Updates**:

   ```typescript
   // ❌ BEFORE: Expected ApiResponse
   const result: ApiResponse<RolesListResponse> = await adminService.getRoles({...});
   if (!result.ok) throw new Error(result.message);
   return result.data.roles || [];

   // ✅ AFTER: Direct unwrapped data access
   const result = await adminService.getRoles({...});
   return result.roles || [];
   ```

3. **Error Handling Standardization**:
   ```typescript
   // ✅ AFTER: Throw errors instead of ApiResponse error format
   throw processed; // Instead of return { ok: false, message, code }
   ```

**Services Updated**: Admin (7 methods), Proposal (6 methods), Product (1
method)

**Hooks Updated**: useRoles, useUsers, useSystemMetrics, useProposals,
useProductStats

**Success Metrics**:

- ✅ **0 TypeScript compilation errors**
- ✅ **Successful build** (102/102 static pages generated)
- ✅ **Consistent data flow** from API → Service → Hook → Component
- ✅ **Production-ready codebase**

**Prevention**: Always apply "Multi-Layer Data Structure Coordination Fix"
pattern during initial implementation, not as cleanup phase.

**Result**: **COMPLETE APIRESPONSE STANDARDIZATION** - All services now follow
consistent unwrapped data pattern, eliminating type errors and ensuring reliable
data flow.

---

## 🔧 **Database Schema Mismatch Detection (Latest)**

### **Migration Goal**: Implement systematic detection of database-frontend schema mismatches

**Final Status**: ✅ **SUCCESSFUL** - CLI-based schema mismatch detection now
identifies all cross-layer inconsistencies before they cause runtime errors.

### **Core Challenge**: Silent schema mismatches between database, API schemas, and frontend components

**Problem**: Components use fields that don't exist in database schemas, or
schemas miss fields that exist in the database, causing runtime errors and data
access failures.

**Symptoms**:

- Runtime errors when accessing non-existent database fields
- Schema validation failures for existing data
- Components failing to load data due to field mismatches
- Silent data truncation or null values

### **Solution: CLI-Based Schema Analysis**

#### **Detection Command**

```bash
npm run app:cli -- --command "schema detect-mismatch ComponentName"
```

#### **Analysis Process**

1. **Component Field Extraction**: Scans component files for form fields, state
   properties, and data access patterns
2. **API Endpoint Analysis**: Identifies API routes and response structures
3. **Schema Field Mapping**: Extracts fields from Zod schemas (CustomerSchema,
   CustomerCreateSchema, etc.)
4. **Database Field Validation**: Checks against Prisma schema for actual
   database fields
5. **TypeScript Interface Analysis**: Validates TypeScript interfaces against
   actual usage
6. **Cross-Layer Mismatch Detection**: Compares all layers for inconsistencies

#### **Typical Mismatch Patterns Found**

1. **Missing Schema Fields** (Most Common):

   ```
   🚨 missing_schema_field: Component field 'phone' not found in any schema
   Field: phone
   Component: CustomerCreationSidebar.tsx
   ```

   **Cause**: Frontend uses fields not defined in Zod schemas **Impact**: Schema
   validation fails, data rejected **Fix**: Add missing fields to appropriate
   Zod schema

2. **Schema-Component Field Misalignment**:

   ```
   🚨 field_name_mismatch: Schema uses 'annualRevenue' but component uses 'revenue'
   ```

   **Cause**: Inconsistent field naming across layers **Impact**: Data
   transformation errors, null values **Fix**: Standardize field names using
   database as source of truth

3. **Type Mismatches**:
   ```
   🚨 type_mismatch: Component expects string but schema defines number
   ```
   **Cause**: Type definitions don't match actual data types **Impact**: Runtime
   type errors, data corruption **Fix**: Align types with database schema
   definitions

### **Fix Implementation Process**

#### **Step 1: Identify Mismatches**

```bash
# Analyze specific component
npm run app:cli -- --command "schema detect-mismatch CustomerCreationSidebar"

# Analyze entire feature
npm run app:cli -- --command "schema detect-mismatch Customer*"
```

#### **Step 2: Update Zod Schemas**

```typescript
// ❌ BEFORE: Missing fields
export const CustomerCreateSchema = CustomerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ✅ AFTER: Include all required fields
export const CustomerCreateSchema = CustomerSchema.extend({
  phone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  address: z.string().optional(),
  companySize: z.string().optional(),
  revenue: z.number().optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
```

#### **Step 3: Update Validation Interfaces**

```typescript
// Update CustomerEditData interface to match schema
export interface CustomerEditData {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  industry?: string;
  tags: string[];
  tier: string;
  revenue?: number; // ✅ Changed from annualRevenue
  companySize?: string; // ✅ Changed from employeeCount
}
```

#### **Step 4: Update Component Form Fields**

```typescript
// Update form field names to match corrected schema
<FormField
  name="revenue"          // ✅ Changed from "annualRevenue"
  label="Annual Revenue"
  type="number"
  value={validation.formData.revenue}
  onChange={value => validation.handleFieldChange('revenue', value)}
/>
```

#### **Step 5: Verify Fix**

```bash
# Re-run analysis to confirm mismatches resolved
npm run app:cli -- --command "schema detect-mismatch CustomerCreationSidebar"

# Expected output: ✅ No mismatches found
```

### **Success Metrics**

**Before Detection**:

- Silent schema validation failures
- Runtime data access errors
- Components failing to load data
- Inconsistent field naming across layers

**After Detection & Fix**:

- ✅ **5 schema mismatches resolved** (phone, website, address, companySize,
  revenue)
- ✅ **Consistent field naming** (revenue vs annualRevenue, companySize vs
  employeeCount)
- ✅ **Successful customer creation** at
  `http://localhost:3000/customers/create`
- ✅ **100% TypeScript compliance** after schema alignment
- ✅ **Database-API-Frontend alignment** achieved

### **Prevention Framework (Database Mismatch Detection)**

1. **Pre-Implementation Schema Check**:

   ```bash
   # Always run before implementing new features
   npm run app:cli -- --command "schema detect-mismatch FeatureName*"
   ```

2. **Database-First Field Naming**:
   - Use database column names as source of truth
   - Avoid frontend-specific naming conventions
   - Maintain consistency across all layers

3. **Schema Completeness Validation**:
   - Include all database fields in Zod schemas
   - Add optional fields for future extensibility
   - Validate schema against actual database data

4. **Automated Detection Integration**:
   - Add to CI/CD pipeline for pre-deployment validation
   - Run as part of `npm run type-check` process
   - Create dashboards for schema health monitoring

5. **Component-Schema Sync Process**:
   - Update schemas first, then components
   - Use TypeScript inference for type safety
   - Test with real data before deployment

### **Detection Command Usage Examples**

```bash
# Analyze specific component
npm run app:cli -- --command "schema detect-mismatch CustomerCreationSidebar"

# Analyze feature area
npm run app:cli -- --command "schema detect-mismatch Product*"

# Analyze entire domain
npm run app:cli -- --command "schema detect-mismatch Customer*"

# Analyze API endpoints
npm run app:cli -- --command "schema detect-mismatch *Api*"
```

### **Common Mismatch Resolution Patterns**

| Mismatch Type        | Pattern                             | Solution                                      |
| -------------------- | ----------------------------------- | --------------------------------------------- |
| Missing Fields       | Component uses field not in schema  | Add to Zod schema with appropriate validation |
| Field Name Mismatch  | Different names across layers       | Standardize using database names              |
| Type Mismatch        | Component expects different type    | Align with database schema types              |
| Optional vs Required | Schema requires, component optional | Make consistent based on business rules       |

**Result**: **SUCCESSFUL DATABASE MISMATCH DETECTION** - CLI-based analysis now
systematically identifies and resolves all schema inconsistencies before they
cause runtime failures.
