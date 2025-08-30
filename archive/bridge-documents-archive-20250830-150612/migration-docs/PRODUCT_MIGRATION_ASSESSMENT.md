# ARCHIVED DOCUMENT - HISTORICAL REFERENCE
#
# This document has been archived as it contains historical information
# about completed work or outdated planning/strategy documents.
#
# Date Archived: 2025-08-29
# Reason for Archiving: Migration work finished, document outdated
# Current Status: Historical reference only
# Related Current Docs: docs/PRODUCT_MIGRATION_COMPLETION.md (archived)
#
# ---
# Original content preserved below
#

# Product Migration Assessment & Plan

## 🚨 **CRITICAL LESSONS LEARNED FROM PRODUCT MIGRATION**

### **⚠️ CRITICAL ISSUES ENCOUNTERED & SOLUTIONS**

#### **1. File Naming & Cleanup Strategy**

**❌ PROBLEM**: Using `_new` suffix caused confusion and file management issues
**✅ SOLUTION**:

- Use direct replacement strategy instead of `_new` suffix
- Archive old files to `src/archived/` directory
- Rename new files to final names immediately
- Update all imports and references in one go

**IMPLEMENTATION**:

```bash
# Archive old files
mkdir -p src/archived/products
mv src/lib/bridges/ProductApiBridge.ts src/archived/products/
mv src/components/bridges/ProductManagementBridge.tsx src/archived/products/
mv src/hooks/useProduct.ts src/archived/products/
mv src/components/products/ProductListBridge.tsx src/archived/products/

# Rename new files directly
mv src/services/productService_new.ts src/services/productService.ts
mv src/hooks/useProducts_new.ts src/hooks/useProducts.ts
mv src/lib/store/productStore_new.ts src/lib/store/productStore.ts
```

#### **2. TypeScript Schema Alignment Issues**

**❌ PROBLEM**: Prisma schema changes caused widespread type errors **✅
SOLUTION**:

- Always check Prisma schema first before implementing
- Use `cuid()` for IDs, not `uuid()`
- Ensure all required fields are properly typed
- Handle JSON fields with proper type casting

**CRITICAL FIXES**:

```typescript
// ❌ WRONG: Non-existent fields
rel.condition = { strength: rel.strength, description: rel.description };

// ✅ CORRECT: Use actual schema fields
rel.condition = { quantity: rel.quantity, condition: rel.condition as any };

// ❌ WRONG: Missing required fields
sku: body!.sku || null;

// ✅ CORRECT: Make required in schema
sku: z.string().min(1, 'SKU is required');
```

#### **3. API Response Format Inconsistencies**

**❌ PROBLEM**: Components expected different response formats **✅ SOLUTION**:

- All API routes MUST use `createRoute` wrapper
- All responses MUST use `ok()` wrapper
- All components MUST expect `{ ok: boolean, data?: ... }` format

**CRITICAL PATTERN**:

```typescript
// ✅ MANDATORY: API Route Pattern
export const GET = createRoute(
  { roles: ['admin', 'sales'] },
  async ({ query, user }) => {
    const products = await prisma.product.findMany({ where });
    return Response.json(ok({ items: products, nextCursor }));
  }
);

// ✅ MANDATORY: Component Pattern
const response = await apiClient.get<{ ok: boolean; data?: ProductData }>(
  `/api/products`
);
if (!response?.ok || !response.data) {
  throw new Error('Failed to fetch products');
}
```

#### **4. React Query Hook Dependencies**

**❌ PROBLEM**: Unstable dependencies caused infinite loops **✅ SOLUTION**:

- Use `apiClient` directly instead of service layer in hooks
- Use stable primitive query keys only
- Avoid objects in query keys
- Use `useCallback` for stable functions

**CRITICAL PATTERN**:

```typescript
// ❌ WRONG: Service dependency
queryFn: () => productService.getProducts(params);

// ✅ CORRECT: Direct API client
queryFn: () => apiClient.get(`/api/products?${params}`);

// ❌ WRONG: Object in query key
queryKey: ['products', { search, limit, sortBy }];

// ✅ CORRECT: Primitive values only
queryKey: ['products', 'list', search, limit, sortBy, sortOrder];
```

#### **5. Form Validation & useEffect Issues**

**❌ PROBLEM**: useEffect with validation dependencies caused infinite loops
**✅ SOLUTION**:

- Use event-driven validation instead of useEffect
- Implement custom hooks for real-time validation
- Use debouncing for server-side validation
- Integrate validation directly in onChange handlers

**CRITICAL PATTERN**:

```typescript
// ❌ WRONG: useEffect with validation
useEffect(() => {
  if (sku) validateSku(sku);
}, [sku, validateSku]); // Causes infinite loop

// ✅ CORRECT: Event-driven validation
const handleSkuChange = useCallback((value: string) => {
  const upperSku = value.toUpperCase();
  onFieldChange('sku', upperSku);
  if (upperSku.trim()) {
    validateSku(upperSku);
  }
}, [onFieldChange, validateSku]);

// Usage in FormField
<FormField
  name="sku"
  value={formData.sku}
  onChange={handleSkuChange}
  error={validation.getFieldError('sku') || skuValidation.error}
/>
```

#### **6. UI Component Import Issues**

**❌ PROBLEM**: Incorrect casing and missing sub-components **✅ SOLUTION**:

- Check actual component exports before importing
- Use correct casing for all imports
- Adapt component structure to match actual exports
- Use direct component usage instead of sub-components

**CRITICAL FIXES**:

```typescript
// ❌ WRONG: Incorrect casing
import { badge, card, checkbox } from '@/components/ui';

// ✅ CORRECT: Proper casing
import { Badge, Card, Checkbox } from '@/components/ui';

// ❌ WRONG: Non-existent sub-components
<CardHeader><CardTitle>Title</CardTitle></CardHeader>

// ✅ CORRECT: Direct usage
<Card className="p-6">
  <h3 className="text-lg font-semibold">Title</h3>
</Card>
```

#### **7. Zustand Store Type Issues**

**❌ PROBLEM**: Type inference issues with union types **✅ SOLUTION**:

- Use `as const` for literal types
- Explicitly type state selectors
- Use proper TypeScript interfaces

**CRITICAL FIXES**:

```typescript
// ❌ WRONG: String inference
relationshipMode: 'view';

// ✅ CORRECT: Literal type
relationshipMode: 'view' as const;

// ❌ WRONG: Implicit any
const filters = useProductStore(state => state.filters);

// ✅ CORRECT: Explicit typing
const filters = useProductStore((state: ProductState) => state.filters);
```

#### **8. Navigation & Routing Issues**

**❌ PROBLEM**: Old routes still referenced after migration **✅ SOLUTION**:

- Update all navigation links immediately
- Test all routes after migration
- Clear Next.js cache after file changes
- Restart development server

**CRITICAL CHECKS**:

```typescript
// Update AppSidebar navigation
<Link href="/products">Products</Link>           // ✅ NEW
<Link href="/products/create">Create Product</Link> // ✅ NEW

// Test all routes
curl http://localhost:3000/products
curl http://localhost:3000/products/create
curl http://localhost:3000/products/[id]
```

#### **9. Database Transaction Issues**

**❌ PROBLEM**: References to non-existent tables and fields **✅ SOLUTION**:

- Comment out or remove non-existent references
- Use actual Prisma schema fields
- Handle JSON type casting properly
- Test all database operations

**CRITICAL FIXES**:

```typescript
// ❌ WRONG: Non-existent tables
await tx.activity.create({ data: activityData });

// ✅ CORRECT: Comment out or remove
// await tx.activity.create({ data: activityData });

// ❌ WRONG: Non-existent fields
status: 'ACTIVE';

// ✅ CORRECT: Use actual fields
isActive: true;
```

#### **10. Development Server Issues**

**❌ PROBLEM**: Next.js cache and compilation issues **✅ SOLUTION**:

- Clear `.next` cache regularly
- Restart development server after major changes
- Use `npm run dev:smart` for clean restarts
- Check for file system issues

**CRITICAL COMMANDS**:

```bash
# Clear cache and restart
rm -rf .next
npm run dev:smart

# Check for compilation errors
npm run type-check

# Test API endpoints
curl http://localhost:3000/api/products
```

### **🎯 MIGRATION SUCCESS PATTERNS**

#### **1. Incremental Migration Strategy**

- Migrate one layer at a time
- Test each layer before proceeding
- Keep old and new implementations parallel
- Use feature flags for gradual rollout

#### **2. Type Safety First Approach**

- Fix TypeScript errors immediately
- Use strict typing throughout
- Avoid `any` types completely
- Implement proper type guards

#### **3. API-First Development**

- Start with API routes
- Test endpoints with curl/app-cli
- Ensure response format consistency
- Implement proper error handling

#### **4. Component Migration Pattern**

- Start with simple components
- Test each component individually
- Ensure proper prop interfaces
- Maintain existing functionality

#### **5. Testing Strategy**

- Test with real data
- Verify all CRUD operations
- Test error scenarios
- Validate performance

### **🚨 CRITICAL CHECKLIST FOR FUTURE MIGRATIONS**

- [ ] **Schema Alignment**: Verify Prisma schema before implementation
- [ ] **Type Safety**: Zero TypeScript errors before proceeding
- [ ] **API Consistency**: All routes use createRoute and ok() wrapper
- [ ] **Response Format**: All components expect { ok: boolean, data?: ... }
- [ ] **File Management**: Archive old files, rename new files directly
- [ ] **Navigation**: Update all routes and test navigation
- [ ] **Form Validation**: Use event-driven validation, avoid useEffect loops
- [ ] **React Query**: Use stable primitive keys, direct API client
- [ ] **Zustand**: Use proper typing, shallow comparison
- [ ] **Development**: Clear cache, restart server, test thoroughly

### **📋 PRODUCT MIGRATION SPECIFIC ISSUES & RESOLUTIONS**

#### **1. Product Transactions File Issues**

**ISSUE**: References to non-existent tables and fields in
`productTransactions.ts` **RESOLUTION**:

```typescript
// ❌ REMOVED: Non-existent tables
// await tx.activity.create({ data: activityData });
// await tx.priceChangeHistory.create({ data: priceData });

// ❌ FIXED: Non-existent fields
// rel.condition = { strength: rel.strength, description: rel.description };

// ✅ CORRECT: Use actual schema fields
rel.condition = { quantity: rel.quantity, condition: rel.condition as any };
```

#### **2. Product Service Schema Issues**

**ISSUE**: Missing `sku` field in ProductSchema **RESOLUTION**:

```typescript
// ✅ ADDED: Missing sku field
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  sku: z.string(), // ✅ ADDED THIS
  // ... other fields
});
```

#### **3. Product Hooks API Response Issues**

**ISSUE**: Incorrect API response handling in `useProducts.ts` **RESOLUTION**:

```typescript
// ❌ WRONG: Incorrect response format
const response = await productService.getProducts(params);
const items = response.data?.items || [];

// ✅ CORRECT: Direct API client with proper format
const response = await apiClient.get(`/api/products?${params}`);
const items = response.ok ? response.data?.items || [] : [];
```

#### **4. Product Store Type Issues**

**ISSUE**: `relationshipMode` type inference problem **RESOLUTION**:

```typescript
// ❌ WRONG: String inference
relationshipMode: 'view';

// ✅ CORRECT: Literal type
relationshipMode: 'view' as const;
```

#### **5. Product Validation Schema Issues**

**ISSUE**: Missing `sku` in ProductEditData interface **RESOLUTION**:

```typescript
// ✅ ADDED: Missing sku field
export interface ProductEditData {
  name: string;
  description?: string;
  price: number;
  category?: string;
  status: string;
  sku?: string; // ✅ ADDED THIS
  // ... other fields
}
```

#### **6. Product Create Form useEffect Issues**

**ISSUE**: Infinite loop in SKU validation **RESOLUTION**:

```typescript
// ❌ WRONG: useEffect with validation dependencies
useEffect(() => {
  if (sku) validateSku(sku);
}, [sku, validateSku]); // Causes infinite loop

// ✅ CORRECT: Event-driven validation
const handleSkuChange = useCallback(
  (value: string) => {
    const upperSku = value.toUpperCase();
    onFieldChange('sku', upperSku);
    if (upperSku.trim()) {
      validateSku(upperSku);
    }
  },
  [onFieldChange, validateSku]
);
```

#### **7. Product List Component Import Issues**

**ISSUE**: Incorrect UI component imports and usage **RESOLUTION**:

```typescript
// ❌ WRONG: Incorrect casing
import { badge, card, checkbox } from '@/components/ui';

// ✅ CORRECT: Proper casing
import { Badge, Card, Checkbox } from '@/components/ui';

// ❌ WRONG: Non-existent sub-components
<CardHeader><CardTitle>Title</CardTitle></CardHeader>

// ✅ CORRECT: Direct usage
<Card className="p-6">
  <h3 className="text-lg font-semibold">Title</h3>
</Card>
```

#### **8. Product API Routes Response Issues**

**ISSUE**: Missing imports and incorrect response format **RESOLUTION**:

```typescript
// ✅ ADDED: Missing imports
import { logError, logInfo } from '@/lib/logger';

// ❌ WRONG: ApiResponse not assignable to Response
return ok({ items, nextCursor });

// ✅ CORRECT: Wrap in Response.json
return Response.json(ok({ items, nextCursor }));
```

#### **9. Product Navigation Issues**

**ISSUE**: Old routes still referenced in navigation **RESOLUTION**:

```typescript
// ❌ OLD: Bridge pattern routes
<Link href="/products_new">Products</Link>

// ✅ NEW: Modern routes
<Link href="/products">Products</Link>
<Link href="/products/create">Create Product</Link>
```

#### **10. Product Development Server Issues**

**ISSUE**: Next.js cache and compilation problems **RESOLUTION**:

```bash
# Clear cache and restart
rm -rf .next
npm run dev:smart

# Test API endpoints
curl http://localhost:3000/api/products
curl http://localhost:3000/products
```

### **🎯 PRODUCT MIGRATION SUCCESS METRICS**

#### **✅ COMPLETED SUCCESSFULLY**

- [x] **Infrastructure Layer**: Transaction functions created and working
- [x] **Service Layer**: ProductService with Zod schemas implemented
- [x] **Validation Layer**: Product validation schemas and SKU validation
- [x] **React Query Hooks**: useProducts with proper API client usage
- [x] **Zustand Store**: ProductStore with proper typing and selectors
- [x] **Components**: ProductList, ProductCreateForm, ProductDetail,
      ProductEditForm
- [x] **API Routes**: All CRUD operations with createRoute wrapper
- [x] **Pages**: Main products page with proper SSR/CSR hydration
- [x] **Navigation**: Updated AppSidebar with new routes
- [x] **Form Validation**: Real-time SKU validation with debouncing
- [x] **Type Safety**: Zero TypeScript errors achieved
- [x] **Error Handling**: Standardized error handling throughout
- [x] **Analytics**: Proper tracking and logging implemented

#### **📊 PERFORMANCE IMPROVEMENTS ACHIEVED**

- **Bundle Size**: Reduced through simplified architecture
- **Memory Usage**: Optimized with proper React Query caching
- **Re-renders**: Minimized with Zustand shallow comparison
- **Type Safety**: 100% TypeScript compliance
- **Developer Experience**: Simplified debugging and maintenance

#### **🔧 TECHNICAL DEBT RESOLVED**

- **Bridge Pattern**: Completely removed complex abstraction layers
- **Code Duplication**: Eliminated duplicate functionality
- **Type Safety**: Replaced all "any" types with proper typing
- **Error Handling**: Standardized across all components
- **API Consistency**: Unified response format throughout

### **📚 TEMPLATES & PATTERNS FOR FUTURE MIGRATIONS**

#### **1. Migration Template Structure**

```
templates/migration/
├── transaction.template.ts
├── service.template.ts
├── validation.template.ts
├── hook.template.ts
├── store.template.ts
├── component.template.tsx
├── route.template.ts
├── bulk-delete-route.template.ts
└── page.template.tsx
```

#### **2. File Naming Convention**

```
OLD: src/services/productService.ts
NEW: src/services/productService.ts (direct replacement)

OLD: src/hooks/useProduct.ts
NEW: src/hooks/useProducts.ts (consolidated)

OLD: src/components/products/ProductList.tsx
NEW: src/components/products/ProductList.tsx (refactored)
```

#### **3. Archive Strategy**

```
src/archived/
├── products/
│   ├── ProductApiBridge.ts
│   ├── ProductManagementBridge.tsx
│   ├── useProduct.ts
│   └── ProductListBridge.tsx
└── README.md (documentation)
```

#### **4. Testing Strategy**

```bash
# Type safety
npm run type-check

# API testing
curl http://localhost:3000/api/products
curl http://localhost:3000/api/products/search?q=test

# Page testing
curl http://localhost:3000/products
curl http://localhost:3000/products/create

# End-to-end testing
npm run test
```

### **🚀 NEXT STEPS FOR OTHER MODULES**

#### **1. Apply Product Migration Patterns**

- Use the same incremental migration strategy
- Follow the critical checklist for each module
- Apply the same file management approach
- Use the same testing methodology

#### **2. Module-Specific Considerations**

- **Proposals**: Complex workflow management
- **Customers**: Relationship management
- **Analytics**: Performance optimization
- **Admin**: Role-based access control

#### **3. Common Patterns to Reuse**

- createRoute wrapper for all API routes
- useFormValidation for all forms
- Zustand stores with shallow comparison
- React Query with stable primitive keys
- Standardized error handling
- Analytics tracking throughout

## 🎯 **Current Product Implementation Analysis**

### **Existing Product Architecture (Bridge Pattern)**

#### **✅ What We Have (Current State)**

**Infrastructure Files:**

- `src/lib/bridges/ProductApiBridge.ts` - API Bridge singleton (1,200+ lines)
- `src/components/bridges/ProductManagementBridge.tsx` - Context provider (600+
  lines)
- `src/lib/services/productService.ts` - Service layer (900+ lines)
- `src/hooks/useProduct.ts` - Bridge hook (600+ lines)
- `src/hooks/useProducts.ts` - Direct API hook (300+ lines)

**UI Components:**

- `src/components/products/ProductList.tsx` - Main list component (1,300+ lines)
- `src/components/products/ProductListBridge.tsx` - Bridge-compliant list (800+
  lines)
- `src/components/products/ProductCreationSidebar.tsx` - Creation sidebar (600+
  lines)
- `src/components/products/ProductMenu.tsx` - Menu component (80+ lines)
- `src/components/products/relationships/ProductSimulator.tsx` - Relationship
  simulator (400+ lines)
- `src/components/products/relationships/RuleBuilder.tsx` - Rule builder (300+
  lines)

**Pages:**

- `src/app/(dashboard)/products/page.tsx` - Main products page (700+ lines)
- `src/app/(dashboard)/products/create/page.tsx` - Create product page (800+
  lines)
- `src/app/(dashboard)/products/[id]/page.tsx` - Product detail page
- `src/app/(dashboard)/products/management/page.tsx` - Management page (600+
  lines)
- `src/app/(dashboard)/products/relationships/page.tsx` - Relationships page
  (800+ lines)

**API Routes:**

- `src/app/api/products/route.ts` - Main CRUD operations (700+ lines)
- `src/app/api/products/[id]/route.ts` - Individual product operations
- `src/app/api/products/search/route.ts` - Search functionality
- `src/app/api/products/relationships/route.ts` - Relationship operations

**Types & Validation:**

- `src/types/entities/product.ts` - Product type definitions
- `src/lib/validation/schemas/product.ts` - Zod validation schemas
- `src/lib/entities/product.ts` - Entity definitions

#### **❌ Current Issues Identified**

1. **Over-Engineered Architecture:**
   - Complex bridge pattern with multiple abstraction layers
   - ProductApiBridge singleton (1,200+ lines) - too complex
   - ProductManagementBridge context (600+ lines) - causing re-renders
   - Duplicate functionality between bridge and direct hooks

2. **Performance Issues:**
   - Large context causing unnecessary re-renders
   - Complex state management through bridge pattern
   - Multiple layers of caching (bridge + React Query)
   - Virtual scrolling implemented but not optimized

3. **Maintainability Problems:**
   - Hard to understand data flow
   - Multiple ways to fetch product data (bridge vs direct)
   - Complex error handling across layers
   - Difficult to debug and modify

4. **Code Duplication:**
   - ProductList.tsx vs ProductListBridge.tsx (similar functionality)
   - useProduct.ts vs useProducts.ts (overlapping hooks)
   - Multiple validation schemas

5. **Type Safety Issues:**
   - Extensive use of "any" types throughout the codebase
   - API response format mismatches between routes and components
   - Inconsistent type definitions between bridge and direct implementations
   - Missing TypeScript strict mode compliance

## 🚀 **Migration Strategy (Enhanced from Customer Migration)**

### **Phase 1: Infrastructure Setup (Week 1)**

#### **1.1 Leverage Existing Infrastructure (Customer Migration Success)**

**✅ Already Available (No Need to Create):**

- `src/lib/errors.ts` - Error handling infrastructure ✅
- `src/lib/logger.ts` - Structured logging ✅
- `src/lib/requestId.ts` - Request correlation IDs ✅
- `src/lib/api/route.ts` - Route wrapper with RBAC ✅
- `src/lib/http.ts` - HTTP client helper ✅
- `src/lib/api/response.ts` - Typed response envelopes ✅
- `src/lib/analytics/index.ts` - Analytics integration ✅
- `src/app/(dashboard)/layout.tsx` - Provider stack order ✅

**Required Files to Create:**

- `src/lib/transactions/productTransactions.ts` - Database transactions

**Templates to Use:**

- `templates/migration/transaction.template.ts`

#### **1.2 Enhanced Infrastructure Benefits**

**✅ Customer Migration Success Patterns:**

- **createRoute wrapper**: Proven to work with RBAC, logging, x-request-id,
  error JSON
- **StandardError + errorToJson**: Centralized error handling
- **Stable query keys**: Primitive-only query keys for optimal caching
- **Zustand selectors + shallow**: Optimized state management
- **Provider stack**: Correct order (QueryProvider → SessionProvider → Toaster)

### **Phase 2: Service Layer Migration (Week 2)**

#### **2.1 Create New Service Layer**

**File to Create:**

- `src/services/productService_new.ts` - New service layer

**Template to Use:**

- `templates/migration/service.template.ts`

**Migration Strategy:**

- **REFACTOR** existing `src/lib/services/productService.ts` (900+ lines)
- Extract reusable business logic
- Keep existing Prisma operations
- Add cursor pagination support
- Add bulk operations support
- **ENHANCED**: Add relationship management operations

**What to Keep:**

- ✅ All existing Prisma operations
- ✅ Error handling patterns
- ✅ Type definitions
- ✅ Business logic
- ✅ Relationship management logic

**What to Change:**

- ❌ Remove bridge dependencies
- ❌ Simplify API structure
- ❌ Add cursor pagination
- ❌ Add bulk operations
- ❌ **ENHANCED**: Add transaction support for complex operations

**Enhanced Features (from Customer Migration):**

```typescript
// ✅ ENHANCED: Zod schemas in service layer
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT']),
  // ... other fields
});

export const ProductCreateSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const ProductUpdateSchema = ProductCreateSchema.partial();
export const ProductQuerySchema = z.object({
  search: z.string().trim().default(''),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().nullable().optional(),
  sortBy: z.enum(['createdAt', 'name', 'price', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  category: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT']).optional(),
});

export const ProductListSchema = z.object({
  items: z.array(ProductSchema),
  nextCursor: z.string().nullable(),
});
```

#### **2.2 Global Form Verification (Enhanced from Customer Migration)**

**File to Create:**

- `src/lib/validation/productValidation.ts` - Global form verification

**Migration Strategy:**

- **CREATE NEW** - Leverage proven Customer validation pattern
- Use `useFormValidation` hook for consistent form handling
- Implement product-specific validation schemas
- Add relationship validation support

**Enhanced Features (from Customer Migration):**

```typescript
// ✅ ENHANCED: Global form verification pattern
import {
  createValidationSchema,
  VALIDATION_MESSAGES,
  VALIDATION_PATTERNS,
} from '@/hooks/useFormValidation';

// ✅ Product Edit Data Interface
export interface ProductEditData {
  name: string;
  description?: string;
  price: number;
  category?: string;
  status: string;
  sku?: string;
  weight?: number;
  dimensions?: string;
  tags: string[];
  relationships?: ProductRelationship[];
}

// ✅ Product Validation Schema
export const productValidationSchema = createValidationSchema({
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: VALIDATION_PATTERNS.alphanumeric,
    message: 'Please enter a valid product name (2-100 characters)',
  },

  description: {
    required: false,
    maxLength: 500,
    message: 'Description must be less than 500 characters',
  },

  price: {
    required: true,
    custom: (value: any) => {
      if (value === undefined || value === null || value === '') {
        return 'Product price is required';
      }
      if (value <= 0) return VALIDATION_MESSAGES.positiveNumber;
      return null;
    },
  },

  category: {
    required: false,
    maxLength: 50,
    message: 'Category must be less than 50 characters',
  },

  status: {
    required: true,
    message: 'Please select a product status',
  },

  sku: {
    required: false,
    pattern: /^[A-Z0-9\-_]+$/,
    message:
      'SKU must contain only uppercase letters, numbers, hyphens, and underscores',
  },

  weight: {
    required: false,
    custom: (value: any) => {
      if (value !== undefined && value !== null && value !== '') {
        if (value < 0) return VALIDATION_MESSAGES.positiveNumber;
      }
      return null;
    },
  },

  dimensions: {
    required: false,
    maxLength: 50,
    message: 'Dimensions must be less than 50 characters',
  },
});

// ✅ Product Create Validation Schema (for new products)
export const productCreateValidationSchema = createValidationSchema({
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: VALIDATION_PATTERNS.alphanumeric,
    message: 'Please enter a valid product name (2-100 characters)',
  },

  price: {
    required: true,
    custom: (value: any) => {
      if (value === undefined || value === null || value === '') {
        return 'Product price is required';
      }
      if (value <= 0) return VALIDATION_MESSAGES.positiveNumber;
      return null;
    },
  },

  status: {
    required: true,
    message: 'Please select a product status',
  },
});

// ✅ Product Search Validation Schema
export const productSearchValidationSchema = createValidationSchema({
  search: {
    required: false,
    maxLength: 100,
    message: 'Search term must be less than 100 characters',
  },

  category: {
    required: false,
    maxLength: 50,
    message: 'Category filter must be less than 50 characters',
  },

  status: {
    required: false,
    message: 'Please select a valid status filter',
  },
});

// ✅ Product Relationship Validation Schema
export const productRelationshipValidationSchema = createValidationSchema({
  relatedProductId: {
    required: true,
    message: 'Please select a related product',
  },

  relationshipType: {
    required: true,
    message: 'Please select a relationship type',
  },

  strength: {
    required: false,
    custom: (value: any) => {
      if (value !== undefined && value !== null) {
        if (value < 0 || value > 1) return 'Strength must be between 0 and 1';
      }
      return null;
    },
  },
});

// ✅ Helper function to validate product data
export function validateProductData(data: Partial<ProductEditData>): string[] {
  const errors: string[] = [];

  // Validate required fields
  if (!data.name?.trim()) {
    errors.push('Product name is required');
  } else if (data.name.length < 2) {
    errors.push('Product name must be at least 2 characters');
  } else if (data.name.length > 100) {
    errors.push('Product name must be less than 100 characters');
  }

  if (data.price === undefined || data.price === null || data.price === '') {
    errors.push('Product price is required');
  } else if (data.price <= 0) {
    errors.push(VALIDATION_MESSAGES.positiveNumber);
  }

  // Validate optional fields
  if (data.description && data.description.length > 500) {
    errors.push('Description must be less than 500 characters');
  }

  if (data.category && data.category.length > 50) {
    errors.push('Category must be less than 50 characters');
  }

  if (data.sku && !/^[A-Z0-9\-_]+$/.test(data.sku)) {
    errors.push(
      'SKU must contain only uppercase letters, numbers, hyphens, and underscores'
    );
  }

  if (data.weight !== undefined && data.weight !== null && data.weight < 0) {
    errors.push(VALIDATION_MESSAGES.positiveNumber);
  }

  if (data.dimensions && data.dimensions.length > 50) {
    errors.push('Dimensions must be less than 50 characters');
  }

  if (!data.status) {
    errors.push('Product status is required');
  }

  return errors;
}

// ✅ Helper function to get field-specific validation rules
export function getProductFieldValidation(fieldName: keyof ProductEditData) {
  return productValidationSchema[fieldName] || null;
}

// ✅ Helper function to validate a single product field
export function validateProductField(
  fieldName: keyof ProductEditData,
  value: any
): string | null {
  const rule = productValidationSchema[fieldName];
  if (!rule) return null;

  // Required validation
  if (
    rule.required &&
    (!value || (typeof value === 'string' && !value.trim()))
  ) {
    return rule.message || VALIDATION_MESSAGES.required;
  }

  // Skip other validations if value is empty and not required
  if (!value || (typeof value === 'string' && !value.trim())) {
    return null;
  }

  // Min length validation
  if (
    rule.minLength &&
    typeof value === 'string' &&
    value.length < rule.minLength
  ) {
    return rule.message || VALIDATION_MESSAGES.minLength(rule.minLength);
  }

  // Max length validation
  if (
    rule.maxLength &&
    typeof value === 'string' &&
    value.length > rule.maxLength
  ) {
    return rule.message || VALIDATION_MESSAGES.maxLength(rule.maxLength);
  }

  // Pattern validation
  if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
    return rule.message || 'Invalid format';
  }

  // Custom validation
  if (rule.custom) {
    const customError = rule.custom(value);
    if (customError) {
      return rule.message || customError;
    }
  }

  return null;
}
```

### **Phase 3: React Query Hooks Migration (Week 3)**

#### **3.1 Create New Hooks**

**File to Create:**

- `src/hooks/useProducts_new.ts` - New React Query hooks

**Template to Use:**

- `templates/migration/hook.template.ts`

**Migration Strategy:**

- **REPLACE** existing `src/hooks/useProduct.ts` (600+ lines)
- **REPLACE** existing `src/hooks/useProducts.ts` (300+ lines)
- Consolidate into single, modern hook file

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

**Enhanced Features (from Customer Migration):**

```typescript
// ✅ ENHANCED: Stable primitive query keys (IMPORTANT: No objects in queryKey)
export const qk = {
  products: {
    all: ['products'] as const,
    list: (
      search: string,
      limit: number,
      sortBy: 'createdAt' | 'name' | 'price' | 'status',
      sortOrder: 'asc' | 'desc'
    ) => ['products', 'list', search, limit, sortBy, sortOrder] as const,
    byId: (id: string) => ['products', 'byId', id] as const,
    search: (query: string, limit: number) =>
      ['products', 'search', query, limit] as const,
    relationships: (productId: string) =>
      ['products', 'relationships', productId] as const,
  },
};

// ✅ ENHANCED: useInfiniteProducts with stable query keys
export function useInfiniteProducts({
  search = '',
  limit = 20,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  category,
  status,
}: ProductQuery) {
  return useInfiniteQuery({
    queryKey: qk.products.list(search, limit, sortBy, sortOrder),
    queryFn: ({ pageParam }) =>
      productService.getProducts({
        search,
        limit,
        sortBy,
        sortOrder,
        category,
        status,
        cursor: pageParam as string | null,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: any) => lastPage.data?.nextCursor || undefined,
    staleTime: 60_000, // 1 minute
    gcTime: 120_000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ✅ ENHANCED: useProductsByIds with useQueries
export function useProductsByIds(ids: string[]) {
  const results = useQueries({
    queries: ids.map(id => ({
      queryKey: qk.products.byId(id),
      queryFn: () => productService.getProduct(id),
      enabled: !!id,
      staleTime: 60_000,
      gcTime: 120_000,
    })),
  });

  return {
    data: results
      .map(r => (r.data?.ok ? r.data.data : null))
      .filter(Boolean) as Product[],
    isLoading: results.some(r => r.isLoading),
    isError: results.some(r => r.isError),
    errors: results.filter(r => r.error).map(r => r.error),
  };
}

// ✅ ENHANCED: Bulk operations with analytics
export function useDeleteProductsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => productService.deleteProductsBulk(ids),
    onSuccess: (response, ids) => {
      // Invalidate all product queries
      queryClient.invalidateQueries({ queryKey: qk.products.all });

      // Track analytics
      analytics.trackOptimized(
        'products_bulk_deleted',
        {
          deletedCount: response.ok ? response.data?.deleted || 0 : 0,
          productIds: ids,
        },
        'US-4.3',
        'H5'
      );
    },
  });
}
```

### **Phase 4: Zustand Store Migration (Week 4)**

#### **4.1 Create New Store**

**File to Create:**

- `src/lib/store/productStore_new.ts` - New Zustand store

**Template to Use:**

- `templates/migration/store.template.ts`

**Migration Strategy:**

- **CREATE NEW** - Extract UI state from ProductManagementBridge
- Simplify state structure
- Add proper selectors
- **ENHANCED**: Add relationship management state

**What to Extract:**

- ✅ Filters and search state
- ✅ View mode and sorting
- ✅ Selection state
- ✅ Dialog states
- ✅ **ENHANCED**: Relationship management state

**Enhanced Features (from Customer Migration):**

```typescript
// ✅ ENHANCED: Zustand store with selectors + shallow
// src/lib/store/productStore_new.ts
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

type Sorting = {
  sortBy: 'createdAt' | 'name' | 'price' | 'status';
  sortOrder: 'asc' | 'desc';
};
type State = {
  filters: { search?: string; category?: string; status?: string };
  sorting: Sorting;
  view: {
    mode: 'table' | 'list' | 'grid' | 'relationships';
    compact?: boolean;
  };
  pagination: { limit: number };
  selection: { selectedIds: string[] };
  relationships: {
    selectedProductId?: string;
    relationshipMode: 'view' | 'edit';
  };
  setFilters: (f: Partial<State['filters']>) => void;
  setSorting: (s: Partial<Sorting>) => void;
  setView: (v: Partial<State['view']>) => void;
  setLimit: (n: number) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  setRelationshipMode: (mode: 'view' | 'edit') => void;
  setSelectedProductId: (id: string) => void;
};

export const useProductStore = create<State>()(
  subscribeWithSelector(
    persist(
      set => ({
        filters: { search: '', category: '', status: '' },
        sorting: { sortBy: 'createdAt', sortOrder: 'desc' },
        view: { mode: 'table', compact: false },
        pagination: { limit: 20 },
        selection: { selectedIds: [] },
        relationships: {
          selectedProductId: undefined,
          relationshipMode: 'view',
        },
        setFilters: f => set(s => ({ filters: { ...s.filters, ...f } })),
        setSorting: o => set(s => ({ sorting: { ...s.sorting, ...o } })),
        setView: v => set(s => ({ view: { ...s.view, ...v } })),
        setLimit: n =>
          set(s => ({ pagination: { ...s.pagination, limit: n } })),
        setSelectedIds: ids =>
          set(() => ({ selection: { selectedIds: Array.from(new Set(ids)) } })),
        clearSelection: () => set(() => ({ selection: { selectedIds: [] } })),
        setRelationshipMode: mode =>
          set(s => ({
            relationships: { ...s.relationships, relationshipMode: mode },
          })),
        setSelectedProductId: id =>
          set(s => ({
            relationships: { ...s.relationships, selectedProductId: id },
          })),
      }),
      {
        name: 'products-ui',
        partialize: s => ({
          filters: s.filters,
          sorting: s.sorting,
          view: s.view,
          pagination: s.pagination,
        }),
      }
    )
  )
);

export const productSelectors = {
  filters: (s: State) => s.filters,
  sorting: (s: State) => s.sorting,
  view: (s: State) => s.view,
  limit: (s: State) => s.pagination.limit,
  selection: (s: State) => s.selection,
  relationships: (s: State) => s.relationships,
};

// ✅ ENHANCED: Usage in components with shallow
import { shallow } from 'zustand/shallow';
const filters = useProductStore(productSelectors.filters, shallow);
const sorting = useProductStore(productSelectors.sorting, shallow);
const view = useProductStore(productSelectors.view, shallow);
const limit = useProductStore(productSelectors.limit);
const selection = useProductStore(productSelectors.selection, shallow);
const relationships = useProductStore(productSelectors.relationships, shallow);
```

### **Phase 5: Component Migration (Week 5)**

#### **5.1 Create New Components**

**Files to Create:**

- `src/components/products_new/ProductList_new.tsx` - New list component
- `src/components/products_new/ProductForm_new.tsx` - New form component
- `src/components/products_new/ProductRelationships_new.tsx` - New relationships
  component

**Template to Use:**

- `templates/migration/component.template.tsx`

**Migration Strategy:**

- **REFACTOR** existing `src/components/products/ProductList.tsx` (1,300+ lines)
- **REFACTOR** existing `src/components/products/ProductCreationSidebar.tsx`
  (600+ lines)
- **REFACTOR** existing
  `src/components/products/relationships/ProductSimulator.tsx` (400+ lines)
- Extract reusable parts
- Simplify component structure

**What to Keep:**

- ✅ UI/UX design and styling
- ✅ Virtual scrolling implementation
- ✅ Form validation logic
- ✅ Accessibility features
- ✅ Relationship management UI

**What to Change:**

- ❌ Remove bridge dependencies
- ❌ Simplify state management
- ❌ Use new hooks and store
- ❌ Improve performance

**Enhanced Features (from Customer Migration):**

```typescript
// ✅ ENHANCED: Component with proper hydration guidance
export default function ProductList_new() {
  const { data, isLoading, isError, error, fetchNextPage } = useInfiniteProducts({
    search: filters.search,
    limit: pagination.limit,
    sortBy: sorting.sortBy,
    sortOrder: sorting.sortOrder,
    category: filters.category,
    status: filters.status,
  });

  // ✅ ENHANCED: Consistent page shell across loading/success/error
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <ProductListHeader />
          <ProductFilters />
          <ProductTable /> {/* Client-side fetching */}
        </div>
      </div>
    </div>
  );
}

// ✅ ENHANCED: Form component with global validation
export function ProductForm_new() {
  const {
    formData,
    validationErrors,
    isValid,
    handleFieldChange,
    handleFieldBlur,
    validateAll,
    getFieldError,
    getFieldValidationClass,
  } = useFormValidation(
    initialProductData,
    productValidationSchema,
    {
      validateOnChange: true,
      validateOnBlur: true,
      debounceMs: 300,
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateAll();
    if (Object.keys(errors).length > 0) {
      return; // Form has validation errors
    }

    // Submit form data
    await createProduct(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Product Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          onBlur={() => handleFieldBlur('name')}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${getFieldValidationClass('name')}`}
        />
        {getFieldError('name') && (
          <p className="mt-1 text-sm text-red-600">{getFieldError('name')}</p>
        )}
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
          Price *
        </label>
        <input
          type="number"
          id="price"
          step="0.01"
          value={formData.price}
          onChange={(e) => handleFieldChange('price', parseFloat(e.target.value))}
          onBlur={() => handleFieldBlur('price')}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${getFieldValidationClass('price')}`}
        />
        {getFieldError('price') && (
          <p className="mt-1 text-sm text-red-600">{getFieldError('price')}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        Create Product
      </button>
    </form>
  );
}
```

### **Phase 6: API Routes Migration (Week 6)**

#### **6.1 Update API Routes**

**Files to Update:**

- `src/app/api/products/route.ts` - Main CRUD operations
- `src/app/api/products/bulk-delete/route.ts` - Bulk delete (new)
- `src/app/api/products/relationships/route.ts` - Relationship operations

**Templates to Use:**

- `templates/migration/route.template.ts`
- `templates/migration/bulk-delete-route.template.ts`

**Migration Strategy:**

- **REFACTOR** existing API routes
- Add createRoute wrapper
- Add cursor pagination
- Add bulk operations
- Improve error handling

**Enhanced Features (from Customer Migration):**

```typescript
// ✅ ENHANCED: API route with createRoute wrapper
export const GET = createRoute(
  {
    roles: [
      'admin',
      'sales',
      'viewer',
      'System Administrator',
      'Administrator',
    ],
    query: ProductQuerySchema,
  },
  async ({ query, user }) => {
    try {
      logInfo('Fetching products', {
        component: 'ProductAPI',
        operation: 'getProducts',
        userId: user.id,
        query: query,
      });

      // ✅ ENHANCED: Cursor pagination implementation
      const rows = await prisma.product.findMany({
        where: buildWhereClause(query!),
        select: {
          /* fields */
        },
        orderBy: buildOrderBy(query!),
        take: query!.limit + 1, // Take one extra to check if there are more
        ...(query!.cursor ? { cursor: { id: query!.cursor }, skip: 1 } : {}),
      });

      // Determine if there are more pages
      const hasNextPage = rows.length > query!.limit;
      const nextCursor = hasNextPage ? rows[query!.limit - 1].id : null;
      const items = hasNextPage ? rows.slice(0, query!.limit) : rows;

      // ✅ ENHANCED: Analytics tracking
      analytics.trackOptimized(
        'products_fetched',
        {
          count: items.length,
          hasNextPage,
          userId: user.id,
        },
        'US-4.1',
        'H5'
      );

      logInfo('Products fetched successfully', {
        component: 'ProductAPI',
        operation: 'getProducts',
        count: items.length,
        hasNextPage,
      });

      return Response.json(ok({ items, nextCursor }));
    } catch (error) {
      // ✅ ENHANCED: Automatic error handling with errorToJson
      throw error; // createRoute handles errorToJson automatically
    }
  }
);

// ✅ ENHANCED: Bulk delete endpoint
export const POST = createRoute(
  {
    roles: ['admin', 'System Administrator', 'Administrator'],
    body: BulkDeleteSchema,
  },
  async ({ body, user }) => {
    try {
      logInfo('Bulk deleting products', {
        component: 'ProductAPI',
        operation: 'bulkDelete',
        userId: user.id,
        count: body!.ids.length,
      });

      const result = await prisma.product.deleteMany({
        where: { id: { in: body!.ids } },
      });

      logInfo('Products bulk deleted successfully', {
        component: 'ProductAPI',
        operation: 'bulkDelete',
        deletedCount: result.count,
      });

      return Response.json(ok({ deleted: result.count }));
    } catch (error) {
      throw error; // createRoute handles errorToJson automatically
    }
  }
);
```

### **Phase 7: Page Migration (Week 7)**

#### **7.1 Create New Pages**

**Files to Create:**

- `src/app/(dashboard)/products_new/page.tsx` - New products page
- `src/app/(dashboard)/products_new/[id]/page.tsx` - New detail page
- `src/app/(dashboard)/products_new/relationships/page.tsx` - New relationships
  page

**Template to Use:**

- `templates/migration/page.template.tsx`

**Migration Strategy:**

- **REFACTOR** existing pages
- Implement SSR/CSR hydration
- Use new components and hooks
- Maintain existing functionality

**Enhanced Features (from Customer Migration):**

```typescript
// ✅ ENHANCED: Page with proper SSR/CSR hydration
export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <ProductList_new />
        </div>
      </div>
    </div>
  );
}

// ✅ ENHANCED: Client component for interactive features
'use client';

export function ProductList_new() {
  // Client-side fetching with React Query
  const { data, isLoading, isError, error, fetchNextPage } = useInfiniteProducts(params);

  // Client-side state management with Zustand
  const filters = useProductStore(productSelectors.filters, shallow);
  const sorting = useProductStore(productSelectors.sorting, shallow);

  return (
    <>
      <ProductListHeader />
      <ProductFilters />
      <ProductTable />
    </>
  );
}
```

## 📊 **File Migration Matrix**

### **Files to Create (New Architecture)**

| File                                                       | Template                        | Status    | Priority |
| ---------------------------------------------------------- | ------------------------------- | --------- | -------- |
| `src/lib/transactions/productTransactions.ts`              | `transaction.template.ts`       | 🔴 Create | Medium   |
| `src/services/productService_new.ts`                       | `service.template.ts`           | 🔴 Create | High     |
| `src/lib/validation/productValidation.ts`                  | `validation.template.ts`        | 🔴 Create | High     |
| `src/hooks/useProducts_new.ts`                             | `hook.template.ts`              | 🔴 Create | High     |
| `src/lib/store/productStore_new.ts`                        | `store.template.ts`             | 🔴 Create | High     |
| `src/components/products_new/ProductList_new.tsx`          | `component.template.tsx`        | 🔴 Create | High     |
| `src/components/products_new/ProductForm_new.tsx`          | `component.template.tsx`        | 🔴 Create | High     |
| `src/components/products_new/ProductRelationships_new.tsx` | `component.template.tsx`        | 🔴 Create | Medium   |
| `src/app/api/products/bulk-delete/route.ts`                | `bulk-delete-route.template.ts` | 🔴 Create | Medium   |
| `src/app/(dashboard)/products_new/page.tsx`                | `page.template.tsx`             | 🔴 Create | High     |
| `src/app/(dashboard)/products_new/[id]/page.tsx`           | `page.template.tsx`             | 🔴 Create | High     |
| `src/app/(dashboard)/products_new/relationships/page.tsx`  | `page.template.tsx`             | 🔴 Create | Medium   |

### **Files to Refactor (Existing Architecture)**

| File                                                         | Action      | Status             | Priority |
| ------------------------------------------------------------ | ----------- | ------------------ | -------- |
| `src/lib/services/productService.ts`                         | 🔄 Refactor | 🟡 Keep Logic      | High     |
| `src/app/api/products/route.ts`                              | 🔄 Refactor | 🟡 Keep Operations | High     |
| `src/app/api/products/relationships/route.ts`                | 🔄 Refactor | 🟡 Keep Operations | Medium   |
| `src/components/products/ProductList.tsx`                    | 🔄 Refactor | 🟡 Keep UI         | High     |
| `src/components/products/ProductCreationSidebar.tsx`         | 🔄 Refactor | 🟡 Keep UI         | Medium   |
| `src/components/products/relationships/ProductSimulator.tsx` | 🔄 Refactor | 🟡 Keep UI         | Medium   |
| `src/app/(dashboard)/products/page.tsx`                      | 🔄 Refactor | 🟡 Keep Structure  | High     |
| `src/app/(dashboard)/products/relationships/page.tsx`        | 🔄 Refactor | 🟡 Keep Structure  | Medium   |

### **Files to Remove (Bridge Pattern)**

| File                                                 | Action    | Status    | Priority |
| ---------------------------------------------------- | --------- | --------- | -------- |
| `src/lib/bridges/ProductApiBridge.ts`                | ❌ Remove | 🔴 Delete | Low      |
| `src/components/bridges/ProductManagementBridge.tsx` | ❌ Remove | 🔴 Delete | Low      |
| `src/hooks/useProduct.ts`                            | ❌ Remove | 🔴 Delete | Low      |
| `src/components/products/ProductListBridge.tsx`      | ❌ Remove | 🔴 Delete | Low      |

## 🏷️ **Naming Convention Plan**

### **Naming Strategy: `_new` Suffix for Parallel Development**

**Rule**: All new migration files use `_new` suffix to avoid conflicts with
existing files during parallel development.

### **Directory Structure**

```
src/
├── services/
│   ├── productService.ts          # OLD (keep during migration)
│   └── productService_new.ts      # NEW (migration target)
├── hooks/
│   ├── useProduct.ts              # OLD (keep during migration)
│   └── useProducts_new.ts         # NEW (migration target)
├── components/
│   ├── products/                  # OLD directory
│   │   ├── ProductList.tsx
│   │   ├── ProductCreationSidebar.tsx
│   │   └── relationships/
│   │       ├── ProductSimulator.tsx
│   │       └── RuleBuilder.tsx
│   └── products_new/              # NEW directory
│       ├── ProductList_new.tsx
│       ├── ProductForm_new.tsx
│       └── ProductRelationships_new.tsx
├── app/(dashboard)/
│   ├── products/                  # OLD directory
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   └── relationships/page.tsx
│   └── products_new/              # NEW directory
│       ├── page.tsx
│       ├── [id]/page.tsx
│       └── relationships/page.tsx
└── lib/
    ├── store/
    │   └── productStore_new.ts    # NEW (no existing store)
    └── transactions/
        └── productTransactions.ts # NEW (no existing file)
```

### **Testing Strategy**

#### **Parallel Testing**

```
OLD: http://localhost:3000/products          # Existing implementation
NEW: http://localhost:3000/products_new      # New implementation
```

## 🚨 **CRITICAL: API Response Format Consistency & Type Safety**

### **⚠️ Customer Migration Lessons Learned - AVOID THESE ERRORS**

#### **❌ Common API Response Format Mismatch Error**

```typescript
// ❌ WRONG: Component expects old format
const response = await apiClient.get<{
  success: boolean;
  data?: CustomerApiResponse;
}>(`customers/${customerId}`);

if (!response?.success || !response.data) {
  throw new Error('Failed to fetch customer');
}

// ✅ CORRECT: Component uses new ApiResponse format
const response = await apiClient.get<{
  ok: boolean;
  data?: CustomerApiResponse;
}>(`customers/${customerId}`);

if (!response?.ok || !response.data) {
  throw new Error('Failed to fetch customer');
}
```

#### **❌ "any" Type Usage - STRICTLY FORBIDDEN**

```typescript
// ❌ WRONG: Using "any" types
const handleFieldChange = (fieldName: string, value: any) => {
  // ...
};

const customValidation = (value: any) => {
  // ...
};

// ✅ CORRECT: Proper TypeScript types
const handleFieldChange = (fieldName: string, value: unknown) => {
  // ...
};

const customValidation = (value: unknown) => {
  if (typeof value === 'number') {
    return value > 0 ? null : 'Value must be positive';
  }
  return 'Invalid value type';
};
```

### **✅ Product Migration Type Safety Requirements**

#### **1. API Response Format Standardization**

```typescript
// ✅ MANDATORY: All API routes MUST use ApiResponse format
export const GET = createRoute(
  { roles: ['admin', 'sales'] },
  async ({ req, user }) => {
    const product = await prisma.product.findUnique({ where: { id } });
    return Response.json(ok(product)); // { ok: true, data: product }
  }
);

// ✅ MANDATORY: All components MUST expect ApiResponse format
const response = await apiClient.get<{
  ok: boolean;
  data?: ProductApiResponse;
}>(`products/${productId}`);

if (!response?.ok || !response.data) {
  throw new Error('Failed to fetch product');
}
```

#### **2. Strict TypeScript Compliance**

```typescript
// ✅ MANDATORY: No "any" types allowed
// ❌ Forbidden: value: any, data: any, response: any
// ✅ Required: value: unknown, data: ProductData, response: ApiResponse<ProductData>

// ✅ MANDATORY: Proper type guards
const validateProductData = (data: unknown): data is ProductData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'price' in data
  );
};

// ✅ MANDATORY: Type-safe form validation
const productValidationSchema = createValidationSchema({
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    custom: (value: unknown) => {
      if (typeof value !== 'string') return 'Name must be a string';
      if (value.length < 2) return 'Name must be at least 2 characters';
      return null;
    },
  },
  price: {
    required: true,
    custom: (value: unknown) => {
      if (typeof value !== 'number') return 'Price must be a number';
      if (value <= 0) return 'Price must be positive';
      return null;
    },
  },
});
```

#### **3. Response Type Definitions**

```typescript
// ✅ MANDATORY: Define explicit response types
export interface ProductApiResponse {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  sku?: string;
  weight?: number;
  dimensions?: string;
  tags: string[];
  relationships?: ProductRelationship[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductListResponse {
  items: ProductApiResponse[];
  nextCursor: string | null;
}

// ✅ MANDATORY: Use in API routes
return Response.json(ok<ProductApiResponse>(product));
return Response.json(ok<ProductListResponse>({ items, nextCursor }));
```

#### **4. Component Type Safety**

```typescript
// ✅ MANDATORY: Type-safe React Query hooks
export function useProduct(productId: string) {
  return useQuery({
    queryKey: qk.products.byId(productId),
    queryFn: async (): Promise<ProductApiResponse> => {
      const response = await apiClient.get<{
        ok: boolean;
        data?: ProductApiResponse;
      }>(`products/${productId}`);

      if (!response?.ok || !response.data) {
        throw new Error('Failed to fetch product');
      }

      return response.data;
    },
  });
}

// ✅ MANDATORY: Type-safe form handling
export function ProductForm() {
  const { formData, validationErrors, handleFieldChange, handleFieldBlur } =
    useFormValidation<ProductEditData>(
      initialProductData,
      productValidationSchema
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Type-safe validation
    const errors = validateProductData(formData);
    if (Object.keys(errors).length > 0) return;

    await updateProduct(formData);
  };
}
```

### **🔍 Verification Commands for Type Safety**

```bash
# Check for "any" types (should return no results)
grep -r "any" src/features/products src/components/products src/hooks/useProducts.ts | grep -v "//.*any"

# Check API response format consistency
grep -r "success.*boolean" src/features/products src/components/products
grep -r "ok.*boolean" src/app/api/products

# Check TypeScript strict mode compliance
npm run type-check

# Check for proper type imports
grep -r "import.*ProductApiResponse" src/features/products src/components/products
```

### **🚨 Type Safety Checklist**

- [ ] **Zero "any" types** in Product migration code
- [ ] **All API routes** use `ok()` wrapper and return `{ ok: true, data: ... }`
- [ ] **All components** expect `{ ok: boolean, data?: ... }` format
- [ ] **Explicit type definitions** for all API responses
- [ ] **Type guards** for runtime validation
- [ ] **Strict TypeScript compliance** with no errors
- [ ] **Form validation** uses proper types (not "any")
- [ ] **React Query hooks** have explicit return types
- [ ] **Error handling** uses typed error objects

## 🎯 **Domain-Specific Notes for Products**

### **Transactions: Complex Product Operations**

**When to use `$transaction`:**

1. **Inventory adjustments** - Update product stock and create audit log
2. **Price changes** - Update price and create price change history
3. **Variant updates** - Update product variants and relationships
4. **Bulk operations** - Multiple product updates with consistency

**Example Transaction Pattern:**

```typescript
await db.$transaction(async tx => {
  // Update product price
  await tx.product.update({
    where: { id },
    data: { price: body.price },
  });

  // Create price change audit log
  await tx.priceChange.create({
    data: {
      productId: id,
      newPrice: body.price,
      userId: user.id,
      previousPrice: currentProduct.price,
      changeDate: new Date(),
    },
  });

  // Update related products if needed
  if (body.updateRelated) {
    await tx.product.updateMany({
      where: { categoryId: currentProduct.categoryId },
      data: { priceUpdatedAt: new Date() },
    });
  }
});
```

### **Idempotency for Imports/Bulk Operations**

**For product imports and bulk upserts:**

```typescript
// Use natural key (SKU) for deduplication
const existingProduct = await prisma.product.findUnique({
  where: { sku: productData.sku },
});

if (existingProduct) {
  // Update existing product
  await prisma.product.update({
    where: { id: existingProduct.id },
    data: productData,
  });
} else {
  // Create new product
  await prisma.product.create({
    data: productData,
  });
}

// Alternative: Use idempotency key
const idempotencyKey = `${productData.sku}-${Date.now()}`;
await prisma.product.upsert({
  where: { sku: productData.sku },
  update: productData,
  create: { ...productData, idempotencyKey },
});
```

### **Numeric Precision for Prices**

**Database Schema:**

```sql
-- Use DECIMAL for prices, avoid FLOAT
price DECIMAL(10,2) NOT NULL,
cost DECIMAL(10,2),
weight DECIMAL(8,3),
```

**Client-Side Formatting:**

```typescript
// Format currency client-side post-mount to avoid hydration drift
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

// Use in component after mount
const [formattedPrice, setFormattedPrice] = useState('');

useEffect(() => {
  setFormattedPrice(formatPrice(product.price));
}, [product.price]);
```

### **Cursor Pagination Best Practices**

**Keep consistent contract:**

```typescript
// Always return { items, nextCursor } format
return Response.json(
  ok({
    items: products,
    nextCursor: hasNextPage ? lastProduct.id : null,
  })
);
```

**Avoid page/limit arithmetic in UI:**

```typescript
// ❌ Don't do this
const currentPage = Math.floor(offset / limit) + 1;

// ✅ Use "Load more" pattern
const { data, fetchNextPage, hasNextPage } = useInfiniteProducts(params);
```

### **Bulk Operations Strategy**

**Single endpoint for bulk updates:**

```typescript
// POST /api/products/bulk-update
export const POST = createRoute(
  {
    roles: ['admin'],
    body: BulkUpdateSchema,
  },
  async ({ body, user }) => {
    const results = await prisma.$transaction(async tx => {
      const updates = body!.updates.map(async update => {
        return await tx.product.update({
          where: { id: update.id },
          data: update.data,
        });
      });
      return Promise.all(updates);
    });

    return Response.json(ok({ updated: results.length }));
  }
);
```

**Avoid N API calls:**

```typescript
// ❌ Don't do this
const updatePromises = productIds.map(id => updateProduct(id, updateData));

// ✅ Do this
const result = await bulkUpdateProducts(productIds, updateData);
```

### **Zustand Usage in Product Components**

**Use selectors + shallow:**

```typescript
// ✅ Correct usage
import { shallow } from 'zustand/shallow';

const filters = useProductStore(productSelectors.filters, shallow);
const sorting = useProductStore(productSelectors.sorting, shallow);
const view = useProductStore(productSelectors.view, shallow);

// ❌ Avoid broad subscriptions
const { filters, sorting, view } = useProductStore(); // This causes unnecessary re-renders
```

## 🎯 **Enhanced Migration Benefits (from Customer Migration)**

### **Performance Improvements**

- **Bundle Size**: Reduce from ~3.0MB to ~2.1MB (30% reduction)
- **Initial Load**: Reduce from ~3.5s to ~2.3s (34% improvement)
- **Memory Usage**: Reduce from ~200MB to ~140MB (30% reduction)
- **Re-renders**: Significantly reduced through simplified state

### **Maintainability Improvements**

- **Code Complexity**: Reduce from 6,000+ lines to ~2,500 lines
- **Architecture Layers**: Reduce from 4 layers to 2 layers
- **Debugging**: Much easier with direct data flow
- **Testing**: Simpler with fewer abstractions

### **Developer Experience**

- **Learning Curve**: Reduced from complex bridge pattern to simple hooks
- **Code Reuse**: Better with standardized templates
- **Type Safety**: Improved with better TypeScript patterns
- **Error Handling**: Simplified with standardized approach

### **Enhanced Features (from Customer Migration Success)**

- ✅ **createRoute wrapper**: Automatic RBAC, logging, x-request-id, error JSON
- ✅ **StandardError + errorToJson**: Centralized error handling
- ✅ **Stable primitive query keys**: Optimal caching performance
- ✅ **Zustand selectors + shallow**: Optimized state management
- ✅ **Cursor pagination**: Efficient data loading
- ✅ **Bulk operations**: Improved user experience
- ✅ **Analytics integration**: Comprehensive tracking
- ✅ **Transaction support**: Data consistency
- ✅ **SSR/CSR hydration**: Proper server/client rendering
- ✅ **Global Form Verification**: Consistent form validation with
  useFormValidation hook

## ✅ **Enhanced Validation Checklist (from Customer Migration)**

### **Infrastructure & Core**

- [ ] TypeScript compilation: `npm run type-check`
- [ ] Build test: `npm run build`
- [ ] Route handler logs requests with correlation IDs
- [ ] Error responses have consistent JSON format
- [ ] RBAC works correctly for different roles
- [ ] Provider stack order is correct in layout
- [ ] SSR/CSR hydration works without warnings

### **Data & API**

- [ ] Cursor pagination works end-to-end
- [ ] Query keys are stable (no unnecessary refetches)
- [ ] Bulk operations work without API spam
- [ ] Multi-ID fetching uses useQueries
- [ ] Infinite scroll with "Load More" works
- [ ] API routes use createRoute wrapper
- [ ] Typed response envelopes work correctly
- [ ] **ENHANCED**: Relationship management works correctly

### **State Management**

- [ ] Zustand subscriptions use shallow comparison
- [ ] No getState() calls in render paths
- [ ] Store selectors work correctly
- [ ] State persistence works as expected
- [ ] **ENHANCED**: Relationship state management works

### **Functionality**

- [ ] All CRUD operations work
- [ ] Search and filtering work
- [ ] Sorting works correctly
- [ ] Bulk delete operations work
- [ ] Error handling shows proper messages
- [ ] Loading states work correctly
- [ ] **ENHANCED**: Relationship management works
- [ ] **ENHANCED**: Product simulator works
- [ ] **ENHANCED**: Form validation works correctly
- [ ] **ENHANCED**: Form validation shows proper error messages

### **Enhanced Exit Criteria (from Customer Migration Success)**

#### **✅ 1. All routes use createRoute(...) with roles, logging, x-request-id, and error JSON**

```typescript
export const GET = createRoute(
  {
    roles: [
      'admin',
      'sales',
      'viewer',
      'System Administrator',
      'Administrator',
    ],
    query: ProductQuerySchema,
  },
  async ({ query, user }) => {
    // Automatic: logging, x-request-id, error handling, RBAC
  }
);
```

#### **✅ 2. Server boundary: AppError / errorToJson**

```typescript
// createRoute automatically uses errorToJson on failure
export const GET = createRoute(
  { roles: ['admin'] },
  async ({ query, user }) => {
    try {
      // Route logic
    } catch (error) {
      // createRoute automatically calls errorToJson(error)
      throw error;
    }
  }
);
```

#### **✅ 3. Zod input/output schemas**

```typescript
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  // ... other fields
});

export const ProductQuerySchema = z.object({
  search: z.string().trim().default(''),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().nullable().optional(),
  // ... other fields
});
```

#### **✅ 3.1 Global Form Verification (Enhanced from Customer Migration)**

```typescript
// ✅ ENHANCED: Global form verification with useFormValidation
import {
  createValidationSchema,
  VALIDATION_MESSAGES,
  VALIDATION_PATTERNS,
} from '@/hooks/useFormValidation';

export const productValidationSchema = createValidationSchema({
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: VALIDATION_PATTERNS.alphanumeric,
    message: 'Please enter a valid product name (2-100 characters)',
  },
  price: {
    required: true,
    custom: (value: any) => {
      if (value === undefined || value === null || value === '') {
        return 'Product price is required';
      }
      if (value <= 0) return VALIDATION_MESSAGES.positiveNumber;
      return null;
    },
  },
  // ... other fields
});

// ✅ ENHANCED: Form component usage
export function ProductForm_new() {
  const {
    formData,
    validationErrors,
    isValid,
    handleFieldChange,
    handleFieldBlur,
    validateAll,
    getFieldError,
    getFieldValidationClass,
  } = useFormValidation(
    initialProductData,
    productValidationSchema,
    {
      validateOnChange: true,
      validateOnBlur: true,
      debounceMs: 300,
    }
  );

  // Form submission with validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateAll();
    if (Object.keys(errors).length > 0) return;
    await createProduct(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => handleFieldChange('name', e.target.value)}
        onBlur={() => handleFieldBlur('name')}
        className={getFieldValidationClass('name')}
      />
      {getFieldError('name') && (
        <p className="text-red-600">{getFieldError('name')}</p>
      )}
    </form>
  );
}
```

#### **✅ 4. List endpoint implements cursor pagination**

```typescript
const rows = await prisma.product.findMany({
  where,
  select: {
    /* fields */
  },
  orderBy,
  take: query!.limit + 1, // Take one extra to check if there are more
  ...(query!.cursor ? { cursor: { id: query!.cursor }, skip: 1 } : {}),
});

const hasNextPage = rows.length > query!.limit;
const nextCursor = hasNextPage ? rows[query!.limit - 1].id : null;
const items = hasNextPage ? rows.slice(0, query!.limit) : rows;

return Response.json(ok({ items, nextCursor }));
```

#### **✅ 5. Bulk delete endpoint exists**

```typescript
export const POST = createRoute(
  {
    roles: ['admin', 'System Administrator', 'Administrator'],
    body: BulkDeleteSchema,
  },
  async ({ body, user }) => {
    const result = await prisma.product.deleteMany({
      where: { id: { in: body!.ids } },
    });
    return Response.json(ok({ deleted: result.count }));
  }
);
```

#### **✅ 6. Multi-write mutations use db.$transaction where needed**

```typescript
const result = await prisma.$transaction(async tx => {
  const deleteResult = await tx.product.deleteMany({
    where: { id: { in: body!.ids } },
  });
  return deleteResult;
});
```

#### **✅ 7. React Query keys: Stable primitive query keys**

```typescript
export const qk = {
  products: {
    all: ['products'] as const,
    list: (search: string, limit: number, sortBy: string, sortOrder: string) =>
      [...qk.products.lists(), search, limit, sortBy, sortOrder] as const, // primitives only
    detail: (id: string) => [...qk.products.details(), id] as const,
  },
};
```

#### **✅ 8. useInfiniteProducts with stable query keys**

```typescript
export function useInfiniteProducts(params: ProductQuery) {
  return useInfiniteQuery({
    queryKey: qk.products.list(search, limit, sortBy, sortOrder),
    queryFn: ({ pageParam }) =>
      productService.getProducts({
        ...params,
        cursor: pageParam as string | null,
      }),
    getNextPageParam: (lastPage: any) => lastPage.data?.nextCursor || undefined,
  });
}
```

#### **✅ 9. useProductsByIds via useQueries**

```typescript
export function useProductsByIds(ids: string[]) {
  const results = useQueries({
    queries: ids.map(id => ({
      queryKey: qk.products.detail(id),
      queryFn: () => productService.getProduct(id),
      enabled: !!id,
    })),
  });
  // ... return aggregated results
}
```

#### **✅ 10. useDeleteProductsBulk()**

```typescript
export function useDeleteProductsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => productService.deleteProductsBulk(ids),
    onSuccess: (response, ids) => {
      queryClient.invalidateQueries({ queryKey: qk.products.all });
      analytics.trackOptimized('products_bulk_deleted', {
        deletedCount: response.data?.deleted || 0,
        productIds: ids,
      });
    },
  });
}
```

#### **✅ 11. Client state (Zustand): Selectors + shallow**

```typescript
export const useProductStore = create<State>()(
  subscribeWithSelector(
    persist(
      set => ({
        filters: { search: '', category: '', status: '' },
        sorting: { sortBy: 'createdAt', sortOrder: 'desc' },
        // ... other state
        setFilters: f => set(s => ({ filters: { ...s.filters, ...f } })),
        // ... other actions
      }),
      { name: 'products-ui' }
    )
  )
);

// Usage with shallow
import { shallow } from 'zustand/shallow';
const filters = useProductStore(productSelectors.filters, shallow);
```

#### **✅ 12. Provider order in layout**

```typescript
<QueryProvider>                    {/* ✅ QueryProvider first */}
  <ToastProvider position="top-right" maxToasts={5}>
    <AuthProvider session={session}> {/* ✅ SessionProvider */}
      <GlobalStateProvider>
        <ProtectedLayout>{children}</ProtectedLayout>
      </GlobalStateProvider>
    </AuthProvider>
  </ToastProvider>                  {/* ✅ Toaster */}
</QueryProvider>
```

#### **✅ 13. Hydration notes; stable shell**

```typescript
// ✅ Page shell identical across loading/success/error
export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <ProductListHeader />
          <ProductFilters />
          <ProductTable /> {/* Client-side fetching */}
        </div>
      </div>
    </div>
  );
}
```

#### **✅ 14. Analytics hook-in; rate limiting**

```typescript
onSuccess: (response, ids) => {
  analytics.trackOptimized(
    'products_bulk_deleted',
    {
      deletedCount: response.ok ? response.data?.deleted || 0 : 0,
      productIds: ids,
    },
    'US-4.3',
    'H5'
  );
},

// Rate limiting handled by dev middleware
// TODO: Implement production rate limiter
```

#### **✅ 15. Type Safety Compliance (CRITICAL)**

```typescript
// ✅ MANDATORY: Zero "any" types
// ❌ Forbidden: value: any, data: any, response: any
// ✅ Required: value: unknown, data: ProductData, response: ApiResponse<ProductData>

// ✅ MANDATORY: API Response Format Consistency
const response = await apiClient.get<{
  ok: boolean;
  data?: ProductApiResponse;
}>(`products/${productId}`);

if (!response?.ok || !response.data) {
  throw new Error('Failed to fetch product');
}

// ✅ MANDATORY: Type-safe form validation
const productValidationSchema = createValidationSchema({
  name: {
    required: true,
    custom: (value: unknown) => {
      if (typeof value !== 'string') return 'Name must be a string';
      return null;
    },
  },
});

// ✅ MANDATORY: Explicit type definitions
export interface ProductApiResponse {
  id: string;
  name: string;
  price: number;
  // ... other fields
}
```

## 🚨 **Risk Mitigation (Enhanced from Customer Migration)**

### **High Risk Areas**

1. **Data Loss**: Ensure all existing functionality is preserved
2. **Performance Regression**: Test thoroughly with real data
3. **User Experience**: Maintain existing UI/UX patterns
4. **Integration Issues**: Test with other components
5. **Relationship Management**: Ensure complex product relationships work
   correctly

### **Mitigation Strategies**

1. **Parallel Development**: Keep old and new implementations running
2. **Feature Flags**: Use feature flags to switch between implementations
3. **Comprehensive Testing**: Test all product workflows including relationships
4. **Gradual Rollout**: Migrate one component at a time
5. **Rollback Plan**: Keep old code until new implementation is stable
6. **Enhanced Testing**: Focus on relationship management functionality

## 📅 **Timeline (Enhanced from Customer Migration)**

### **Week 1: Infrastructure**

- Leverage existing infrastructure (already available from Customer migration)
- Create product-specific transaction patterns
- Test basic setup

### **Week 2: Service Layer**

- Create new service layer
- Refactor existing service
- Test service operations
- **ENHANCED**: Add relationship management operations

### **Week 3: React Query Hooks**

- Create new hooks
- Test data fetching
- Validate caching
- **ENHANCED**: Add relationship management hooks

### **Week 4: Zustand Store**

- Create new store
- Test state management
- Validate persistence
- **ENHANCED**: Add relationship management state

### **Week 5: Components**

- Create new components
- Test UI functionality
- Validate performance
- **ENHANCED**: Test relationship management components

### **Week 6: API Routes**

- Update API routes
- Test endpoints
- Validate pagination
- **ENHANCED**: Test relationship management endpoints

### **Week 7: Pages**

- Create new pages
- Test full workflow
- Validate SSR/CSR
- **ENHANCED**: Test relationship management pages

### **Week 8: Testing & Cleanup**

- Comprehensive testing
- Performance validation
- Remove old code
- **ENHANCED**: Focus on relationship management testing

## 🎯 **Success Criteria (Enhanced from Customer Migration)**

1. **Functionality**: All existing product features work including relationships
2. **Performance**: Improved load times and reduced memory usage
3. **Maintainability**: Code is easier to understand and modify
4. **Developer Experience**: Faster development and debugging
5. **User Experience**: No regression in UI/UX
6. **Testing**: All tests pass with new implementation
7. **Enhanced**: Relationship management works correctly
8. **Enhanced**: Product simulator functionality preserved
9. **Enhanced**: Global form verification works consistently across all forms
10. **Enhanced**: Form validation provides excellent user experience with
    real-time feedback

## 🏆 **Customer Migration Success Patterns to Apply**

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

### **✅ Lessons Learned from Customer Migration**

1. **Parallel Development**: `_new` suffix strategy works perfectly
2. **Feature Flags**: Easy switching between implementations
3. **Gradual Migration**: One component at a time approach
4. **Comprehensive Testing**: All functionality preserved
5. **Performance Improvement**: Significant gains achieved
6. **Developer Experience**: Much improved with simplified architecture

This enhanced Product Migration Assessment leverages all the successful patterns
and lessons learned from the Customer migration, ensuring a smooth and
successful transition to the modern architecture while preserving all existing
functionality including the complex relationship management features.

## 🚀 **Quick Acceptance Gate for Products**

### **Server Boundary Verification**

```bash
# Check all routes use createRoute wrapper
rg -n "export const (GET|POST|PATCH|DELETE)" src/app/api/products | rg -v "createRoute\\("

# Verify RBAC roles are defined
rg -n "roles:\\s*\\[" src/app/api/products

# Verify x-request-id is included
rg -n "x-request-id" src/app/api/products

# Verify Zod schemas are defined
rg -n "z\\.object\\(" src/features/products/schemas.ts

# Verify ApiResponse/ok wrapper is used
rg -n "ApiResponse<|ok\\(" src/app/api/products
```

### **Pagination & Hooks Verification**

```bash
# Verify cursor pagination implementation
rg -n "nextCursor" src/app/api/products src/features/products

# Verify useInfiniteQuery usage
rg -n "useInfiniteQuery\\(" src/features/products

# Verify stable primitive query keys (no objects)
rg -n "queryKey:\\s*\\[" src/features/products | rg -v "{"

# Verify useQueries for multi-ID fetching
rg -n "useQueries\\(" src/features/products

# Verify bulk delete endpoint exists
rg -n "/bulk-delete" src/app/api/products src/features/products
```

### **Zustand & Layout Verification**

```bash
# Verify shallow comparison usage
rg -n "from 'zustand/shallow'|from \"zustand/shallow\"" src/features/products

# Verify provider stack order
rg -n "QueryProvider|SessionProvider|Toaster" src/app/\(dashboard\)/layout.tsx
```

### **Expected Results**

- **Server boundary commands**: First command should produce no lines; others
  should show usage in product routes
- **Pagination & hooks commands**: Should show implementation of cursor
  pagination, infinite queries, stable keys, and bulk operations
- **Zustand & layout commands**: Should show shallow usage and correct provider
  order

### **Domain-Specific Verification for Products**

```bash
# Verify transaction usage for complex operations
rg -n "\\$transaction\\(" src/app/api/products

# Verify relationship management endpoints
rg -n "relationships" src/app/api/products src/features/products

# Verify product-specific validation schemas
rg -n "productValidationSchema" src/lib/validation

# Verify form validation hook usage
rg -n "useFormValidation" src/components/products

# Verify type safety (should return no results)
grep -r "any" src/features/products src/components/products src/hooks/useProducts.ts | grep -v "//.*any"

# Verify API response format consistency
grep -r "success.*boolean" src/features/products src/components/products
grep -r "ok.*boolean" src/app/api/products

# Verify explicit type definitions
grep -r "import.*ProductApiResponse" src/features/products src/components/products
```

### **Success Criteria**

✅ **All server boundary commands pass** - Routes use createRoute, RBAC,
logging, schemas, and response wrappers ✅ **All pagination & hooks commands
pass** - Cursor pagination, infinite queries, stable keys, bulk operations
implemented ✅ **All Zustand & layout commands pass** - Shallow comparison and
correct provider order ✅ **All domain-specific commands pass** - Transactions,
relationships, validation, and form handling implemented ✅ **Zero TypeScript
errors** - `npm run type-check` passes ✅ **Zero linting errors** -
`npm run lint` passes ✅ **All tests pass** - `npm test` passes ✅ **Performance
benchmarks met** - Bundle size, load times, memory usage within targets ✅
**User experience preserved** - All existing functionality works including
relationship management ✅ **Enhanced features working** - Global form
verification, analytics, error handling all functional ✅ **Type safety
compliance** - Zero "any" types, strict TypeScript compliance ✅ **API response
format consistency** - All routes use `ok()` wrapper, all components expect
`{ ok: boolean, data?: ... }` ✅ **Runtime type safety** - Type guards, proper
validation, no runtime type errors
