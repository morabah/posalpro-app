# Customer Field Addition Manual

## Overview

This manual provides a comprehensive guide for adding new fields to the Customer
entity, covering the complete process from database schema to UI components.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Schema Changes](#database-schema-changes)
3. [API Routes Updates](#api-routes-updates)
4. [Type Definitions](#type-definitions)
5. [Validation Schemas](#validation-schemas)
6. [Service Layer Updates](#service-layer-updates)
7. [React Components](#react-components)
8. [Testing](#testing)
9. [Migration Process](#migration-process)

## Prerequisites

Before adding a new customer field, ensure you have:

- ✅ Database backup
- ✅ Understanding of the field requirements
- ✅ Field validation rules defined
- ✅ UI/UX design for the new field
- ✅ All tests passing

## Step 1: Database Schema Changes

### 1.1 Update Prisma Schema

**File**: `prisma/schema.prisma`

```prisma
model Customer {
  // ... existing fields

  // NEW FIELD: Add your new field here
  yourNewField String?  // Optional field
  // OR
  yourNewField String   // Required field

  // ... existing relations and indexes
}
```

### 1.2 Create Migration

```bash
# Generate migration file
npx prisma migrate dev --name add_your_new_field_to_customer

# Apply migration to database
npx prisma db push
```

### 1.3 Update Database Indexes (if needed)

```sql
-- Add to prisma/migrations/[migration]/migration.sql
CREATE INDEX "idx_customers_your_new_field" ON "customers"("yourNewField");
```

## Step 2: API Routes Updates

### 2.1 Update Customer API Route

**File**: `src/app/api/customers/route.ts`

```typescript
// Add field to GET response
const customers = await customerService.getCustomers({
  select: {
    // ... existing fields
    yourNewField: true,
  },
});

// Add field to POST validation
const customerData = CustomerCreateSchema.parse(await request.json());
```

### 2.2 Update Customer Detail API Route

**File**: `src/app/api/customers/[id]/route.ts`

```typescript
// Add field to GET response
const customer = await customerService.getCustomerById(id, {
  select: {
    // ... existing fields
    yourNewField: true,
  },
});

// Add field to PUT validation
const updateData = CustomerUpdateSchema.parse(await request.json());
```

## Step 3: Type Definitions

### 3.1 Update Customer Types

**File**: `src/types/entities/customer.ts`

```typescript
export interface Customer {
  // ... existing fields

  // NEW FIELD: Add type definition
  yourNewField?: string; // Optional field
  // OR
  yourNewField: string; // Required field
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

## Step 4: Validation Schemas

### 4.1 Update Feature Schemas

**File**: `src/features/customers/schemas.ts`

```typescript
// Add to base schema
export const CustomerSchema = z.object({
  // ... existing fields

  // NEW FIELD: Add validation
  yourNewField: z.string().optional(), // Optional field
  // OR
  yourNewField: z.string().min(1, 'Required field'), // Required field
});

// Add to create schema
export const CustomerCreateSchema = CustomerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // ... specific create validations
  yourNewField: z.string().min(1, 'Your new field is required'),
});

// Add to update schema
export const CustomerUpdateSchema = CustomerSchema.partial().extend({
  // ... specific update validations
  yourNewField: z.string().optional(),
});
```

### 4.2 Update Validation Service

**File**: `src/lib/validation/customerValidation.ts`

```typescript
export const customerValidationRules = {
  // ... existing rules

  // NEW FIELD: Add validation rules
  yourNewField: {
    required: false, // or true for required fields
    minLength: 1,
    maxLength: 255,
    pattern: /^[a-zA-Z0-9\s\-_.]+$/,
    customValidators: [
      // Add custom validation functions
    ],
  },
};
```

## Step 5: Service Layer Updates

### 5.1 Update Customer Service

**File**: `src/lib/services/customerService.ts`

```typescript
export class CustomerService {
  // Update create method
  async createCustomer(data: CustomerCreate): Promise<Customer> {
    return await prisma.customer.create({
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

  // Update update method
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
}
```

### 5.2 Update HTTP Service

**File**: `src/services/customerService.ts`

```typescript
export class CustomerService {
  async createCustomer(data: CustomerCreate): Promise<Customer> {
    return await http.post<Customer>('/api/customers', data);
  }

  async updateCustomer(id: string, data: CustomerUpdate): Promise<Customer> {
    return await http.put<Customer>(`/api/customers/${id}`, data);
  }
}
```

## Step 6: React Components

### 6.1 Update Form Components

#### Customer Creation Form

**File**: `src/app/(dashboard)/customers/create/page.tsx`

```typescript
// Add to form schema
const customerCreationSchema = z.object({
  // ... existing fields
  yourNewField: z.string().optional(),
});

// Add to form fields
<FormField
  {...register('yourNewField')}
  name="yourNewField"
  label="Your New Field"
  error={errors.yourNewField?.message}
  touched={!!touchedFields.yourNewField}
  placeholder="Enter your new field value"
/>
```

#### Customer Edit Form

**File**: `src/components/customers/CustomerEditForm.tsx`

```typescript
// Add to form fields
<FormField
  {...register('yourNewField')}
  name="yourNewField"
  label="Your New Field"
  error={errors.yourNewField?.message}
  touched={!!touchedFields.yourNewField}
  placeholder="Enter your new field value"
/>
```

#### Customer Creation Sidebar

**File**: `src/components/customers/CustomerCreationSidebar.tsx`

```typescript
// Add to form fields
<div>
  <label htmlFor="yourNewField" className="block text-sm font-medium text-gray-700 mb-1">
    Your New Field
  </label>
  <input
    id="yourNewField"
    {...register('yourNewField')}
    placeholder="Enter your new field value"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
  {errors.yourNewField && (
    <p className="mt-1 text-sm text-red-600">{errors.yourNewField.message}</p>
  )}
</div>
```

### 6.2 Update Display Components

#### Customer Profile Display

**File**: `src/app/(dashboard)/customers/[id]/CustomerProfileClient.tsx`

```typescript
// Add to display fields
<div className="flex items-center">
  <YourIcon className="w-5 h-5 text-gray-400 mr-3" />
  <div className="flex-1">
    <p className="text-sm font-medium text-gray-900">Your New Field</p>
    <p className="text-sm text-gray-700">{customer.yourNewField || 'N/A'}</p>
  </div>
</div>
```

### 6.3 Update Search/Filter Components

**File**: `src/components/customers/CustomerList.tsx`

```typescript
// Add to search filters
const [filters, setFilters] = useState({
  // ... existing filters
  yourNewField: '',
});

// Add to filter UI
<div className="flex items-center space-x-4">
  <input
    type="text"
    placeholder="Filter by your new field"
    value={filters.yourNewField}
    onChange={(e) => setFilters({...filters, yourNewField: e.target.value})}
    className="px-3 py-2 border border-gray-300 rounded-md"
  />
</div>
```

## Step 7: Testing

### 7.1 Unit Tests

**File**: `src/__tests__/features/customers/schemas.test.ts`

```typescript
describe('CustomerCreateSchema', () => {
  it('should validate yourNewField', () => {
    const validData = {
      // ... existing data
      yourNewField: 'Valid Value',
    };

    const invalidData = {
      // ... existing data
      yourNewField: '', // Should fail if required
    };

    expect(() => CustomerCreateSchema.parse(validData)).not.toThrow();
    expect(() => CustomerCreateSchema.parse(invalidData)).toThrow();
  });
});
```

### 7.2 Integration Tests

**File**: `src/__tests__/api/customers.test.ts`

```typescript
describe('POST /api/customers', () => {
  it('should create customer with yourNewField', async () => {
    const customerData = {
      // ... existing data
      yourNewField: 'Test Value',
    };

    const response = await request(app)
      .post('/api/customers')
      .send(customerData)
      .expect(201);

    expect(response.body.yourNewField).toBe('Test Value');
  });
});
```

### 7.3 Component Tests

**File**: `src/__tests__/components/customers/CustomerEditForm.test.tsx`

```typescript
describe('CustomerEditForm', () => {
  it('should display yourNewField', () => {
    const mockCustomer = {
      // ... existing data
      yourNewField: 'Test Value',
    };

    render(<CustomerEditForm customer={mockCustomer} />);

    expect(screen.getByDisplayValue('Test Value')).toBeInTheDocument();
  });
});
```

## Step 8: Migration Process

### 8.1 Database Migration

```bash
# Create and apply migration
npx prisma migrate dev --name add_your_new_field

# Push to production
npx prisma db push --accept-data-loss
```

### 8.2 Data Migration (if needed)

**File**: `prisma/migrations/[timestamp]_migrate_your_field/migration.sql`

```sql
-- Backfill existing data if needed
UPDATE customers
SET yourNewField = 'Default Value'
WHERE yourNewField IS NULL;
```

### 8.3 Deployment Checklist

- [ ] Database migration applied
- [ ] API routes updated
- [ ] Frontend components updated
- [ ] Tests passing
- [ ] Documentation updated
- [ ] User acceptance testing completed

## Field Types Reference

### Text Fields

```typescript
// Single line text
yourField: z.string().min(1).max(255);

// Multi-line text
yourField: z.string().max(1000);

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

// Percentage
yourField: z.number().min(0).max(100);
```

### Date Fields

```typescript
// Date only
yourField: z.date();

// Date string
yourField: z.string().refine(val => !isNaN(Date.parse(val)), {
  message: 'Invalid date format',
});
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

## Common Patterns

### Conditional Fields

```typescript
yourSchema
  .extend({
    yourField: z.string().optional(),
    relatedField: z.string(),
  })
  .refine(
    data => {
      // Conditional validation logic
      if (data.yourField) {
        return !!data.relatedField;
      }
      return true;
    },
    {
      message: 'Related field required when your field is set',
      path: ['relatedField'],
    }
  );
```

### Custom Validation

```typescript
yourField: z.string().refine(
  val => {
    // Custom validation logic
    return yourCustomValidator(val);
  },
  {
    message: 'Custom validation failed',
  }
);
```

## Troubleshooting

### Common Issues

1. **Schema Mismatch**: Ensure database schema matches TypeScript types
2. **Validation Errors**: Check Zod schemas match API expectations
3. **Component Updates**: Update all form components consistently
4. **Migration Issues**: Test migrations on staging environment first

### Debug Commands

```bash
# Check database schema
npx prisma db pull

# Validate TypeScript types
npm run type-check

# Run tests
npm test

# Check API responses
curl http://localhost:3000/api/customers
```

## Best Practices

1. **Always test migrations** on a copy of production data
2. **Use meaningful field names** that follow existing conventions
3. **Add proper validation** at all layers (database, API, frontend)
4. **Update documentation** immediately after changes
5. **Consider backward compatibility** for existing data
6. **Test edge cases** thoroughly
7. **Follow existing patterns** for consistency

## Related Documentation

- [Database Schema Guide](../database/DATABASE_SCHEMA.md)
- [API Routes Guide](../api/API_ROUTES.md)
- [Component Patterns](../components/COMPONENT_PATTERNS.md)
- [Testing Guide](../testing/TESTING_GUIDE.md)
