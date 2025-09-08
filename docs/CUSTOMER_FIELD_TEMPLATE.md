# Customer Field Addition Template

**Field Name**: `yourNewField` (replace with actual field name) **Field Type**:
`String` (String, Int, Float, Boolean, DateTime, etc.) **Required**: `false`
(true/false) **Description**: Brief description of what this field represents

## Quick Checklist ✅

- [ ] Database schema updated
- [ ] Migration created and tested
- [ ] TypeScript types updated
- [ ] Zod schemas updated
- [ ] API routes updated
- [ ] Service layer updated
- [ ] React components updated
- [ ] Tests added
- [ ] Documentation updated

## 1. Database Schema

**File**: `prisma/schema.prisma`

```prisma
model Customer {
  // ... existing fields

  yourNewField String?
  // OR for required field:
  // yourNewField String

  // ... existing relations
}
```

**Migration Command**:

```bash
npx prisma migrate dev --name add_your_new_field_to_customer
```

## 2. Type Definitions

**File**: `src/types/entities/customer.ts`

```typescript
export interface Customer {
  // ... existing fields
  yourNewField?: string;
}

export interface CustomerCreate {
  // ... existing fields
  yourNewField?: string;
}

export interface CustomerUpdate {
  // ... existing fields
  yourNewField?: string;
}
```

## 3. Validation Schemas

**File**: `src/features/customers/schemas.ts`

```typescript
// Add to CustomerSchema
export const CustomerSchema = z.object({
  // ... existing fields
  yourNewField: z.string().optional(),
});

// Add to CustomerCreateSchema
export const CustomerCreateSchema = CustomerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  yourNewField: z.string().min(1, 'Your new field is required'),
});

// Add to CustomerUpdateSchema
export const CustomerUpdateSchema = CustomerSchema.partial().extend({
  yourNewField: z.string().optional(),
});
```

## 4. API Routes

**File**: `src/app/api/customers/route.ts`

```typescript
// In GET handler - add to select
const customers = await customerService.getCustomers({
  select: {
    // ... existing fields
    yourNewField: true,
  },
});

// In POST handler - validation already handled by schema
```

**File**: `src/app/api/customers/[id]/route.ts`

```typescript
// In GET handler - add to select
const customer = await customerService.getCustomerById(id, {
  select: {
    // ... existing fields
    yourNewField: true,
  },
});

// In PUT handler - validation already handled by schema
```

## 5. Service Layer

**File**: `src/lib/services/customerService.ts`

```typescript
// In createCustomer method
async createCustomer(data: CustomerCreate): Promise<Customer> {
  return await prisma.customer.create({
    data: {
      // ... existing fields
      yourNewField: data.yourField,
    },
    select: {
      // ... existing fields
      yourNewField: true,
    },
  });
}

// In updateCustomer method
async updateCustomer(id: string, data: CustomerUpdate): Promise<Customer> {
  return await prisma.customer.update({
    where: { id },
    data: {
      // ... existing fields
      yourNewField: data.yourNewField,
    },
    select: {
      // ... existing fields
      yourNewField: true,
    },
  });
}
```

## 6. React Components

### Customer Creation Form

**File**: `src/app/(dashboard)/customers/create/page.tsx`

```typescript
// Add to form schema
const customerCreationSchema = z.object({
  // ... existing fields
  yourNewField: z.string().optional(),
});

// Add form field
<SearchableCountrySelect
  name="yourNewField"
  label="Your New Field"
  placeholder="Enter your new field value"
  size="md"
/>
```

### Customer Edit Form

**File**: `src/components/customers/CustomerEditForm.tsx`

```typescript
// Add form field
<SearchableCountrySelect
  name="yourNewField"
  label=""
  placeholder="Enter your new field value"
  size="md"
  register={register}
  setValue={setValue}
  watch={watch}
  formErrors={errors}
/>
```

### Customer Profile Display

**File**: `src/app/(dashboard)/customers/[id]/CustomerProfileClient.tsx`

```typescript
// Add display field
<div className="flex items-center">
  <YourIcon className="w-5 h-5 text-gray-400 mr-3" />
  {isEditing ? (
    <div className="flex-1">
      <SearchableCountrySelect
        name="yourNewField"
        label=""
        placeholder="Enter your new field value"
        size="sm"
        register={register}
        setValue={setValue}
        watch={watch}
        formErrors={errors}
      />
    </div>
  ) : (
    <span className="text-gray-700">{customer.yourNewField || 'N/A'}</span>
  )}
</div>
```

## 7. Tests

**File**: `src/__tests__/features/customers/schemas.test.ts`

```typescript
describe('CustomerCreateSchema', () => {
  it('should validate yourNewField', () => {
    const validData = {
      // ... existing required fields
      yourNewField: 'Valid Value',
    };

    const invalidData = {
      // ... existing required fields
      yourNewField: '', // Should fail if required
    };

    expect(() => CustomerCreateSchema.parse(validData)).not.toThrow();
    if (/* field is required */) {
      expect(() => CustomerCreateSchema.parse(invalidData)).toThrow();
    }
  });
});
```

## 8. Migration Verification

```bash
# Verify migration
npx prisma db push

# Check data
npx prisma studio
```

## Common Field Types Quick Reference

### Text Fields

```typescript
// Basic text
yourField: z.string().min(1).max(255);

// Email
yourField: z.string().email();

// URL
yourField: z.string().url();

// Phone
yourField: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/);
```

### Numeric Fields

```typescript
// Integer
yourField: z.number().int().min(0).max(999999);

// Decimal
yourField: z.number().min(0).max(999999.99);
```

### Selection Fields

```typescript
// Single select
yourField: z.enum(['option1', 'option2', 'option3']);

// Multi select
yourField: z.array(z.enum(['option1', 'option2', 'option3'])).min(1);
```

### Boolean Fields

```typescript
yourField: z.boolean();
```

### Date Fields

```typescript
yourField: z.string().refine(val => !isNaN(Date.parse(val)), {
  message: 'Invalid date format',
});
```

## Validation Examples

### Required Field

```typescript
yourField: z.string().min(1, 'This field is required');
```

### Optional Field with Length Limits

```typescript
yourField: z.string().max(255).optional();
```

### Field with Custom Validation

```typescript
yourField: z.string().refine(val => {
  return val.length >= 3 && val.length <= 50;
}, 'Field must be between 3 and 50 characters');
```

## Troubleshooting Checklist

- [ ] Database migration completed successfully
- [ ] TypeScript compilation passes
- [ ] API endpoints return correct data
- [ ] Form validation works as expected
- [ ] UI displays field correctly
- [ ] Tests pass
- [ ] No console errors in browser

## Next Steps After Implementation

1. Test the field in all forms (create, edit, display)
2. Verify API responses include the new field
3. Test validation rules
4. Update any related components (filters, search, etc.)
5. Add field to any relevant reports or exports
6. Update API documentation if applicable
