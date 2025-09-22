# 🎯 **Field Addition Snippets - Quick Reference**

## 📋 **Quick Checklist**

```markdown
✅ Identify entity & field type ✅ Check existing patterns ✅ Backup database ✅
Plan migration ✅ Update schemas, API, UI ✅ Include field in all pages ✅ Test
thoroughly
```

---

## 🗄️ **1. Database Schema**

### **Add Field to Prisma**

```prisma
model EntityName {
  // ...existing fields
  newFieldName FieldType?  // Add here
  // ...rest of model

  // Add index for searchable fields
  @@index([newFieldName])
}
```

### **Generate Migration**

```bash
npx prisma migrate dev --name add_new_field
npx prisma generate
```

### **Database Backup (Critical)**

```bash
# CRITICAL: Always backup before schema changes
npm run db:backup
npm run db:backup:verify
```

---

## 🔍 **2. Zod Schemas**

### **Base Schema**

```typescript
export const NewFieldSchema = z
  .string()
  .min(1, 'Required')
  .max(100, 'Too long')
  .optional();

// For enums:
export const NewFieldSchema = z.enum(['OPT1', 'OPT2']).optional();
```

### **Entity Schemas**

```typescript
export const EntitySchema = z.object({
  id: z.string(),
  // ...existing fields
  newField: NewFieldSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const EntityCreateSchema = EntitySchema.extend({
  newField: NewFieldSchema.refine(val => val !== null, {
    message: 'Required for new entities',
  }),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const EntityUpdateSchema = z.object({
  // ...existing updatable fields
  newField: NewFieldSchema.optional(),
});
```

---

## 🚀 **3. API Routes**

### **GET /api/[entity]/[id]**

```typescript
export async function GET(request, { params }) {
  const eh = ErrorHandlingService.getInstance();

  try {
    const entity = await entityService.getEntityById(params.id);
    const validationResult = EntitySchema.safeParse(entity);

    if (!validationResult.success) {
      logError('Schema validation failed', {
        errors: validationResult.error.issues,
      });
    }

    return eh.createSuccessResponse(entity);
  } catch (error) {
    return eh.createErrorResponse(error, 'Fetch failed');
  }
}
```

### **POST /api/[entity]**

```typescript
export async function POST(request) {
  const eh = ErrorHandlingService.getInstance();

  try {
    const body = await request.json();
    const validationResult = EntityCreateSchema.safeParse(body);

    if (!validationResult.success) {
      return eh.createErrorResponse(
        new Error('Validation failed'),
        'Invalid data',
        {
          errors: validationResult.error.issues,
        }
      );
    }

    const entity = await entityService.createEntity(validationResult.data);
    return eh.createSuccessResponse(entity, 201);
  } catch (error) {
    return eh.createErrorResponse(error, 'Creation failed');
  }
}
```

---

## 🔧 **4. Service Layer**

### **Database Service**

```typescript
export class EntityService {
  async getEntityById(id: string) {
    const entity = await this.prisma.entity.findUnique({
      where: { id },
      select: {
        id: true,
        // ...existing fields
        newField: true, // Include new field
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...entity,
      newField: entity.newField ? Number(entity.newField) : null, // Transform if needed
    };
  }

  async createEntity(data) {
    const entity = await this.prisma.entity.create({
      data: {
        ...data,
        newField: data.newField,
      },
      select: {
        id: true,
        // ...existing fields
        newField: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return entity;
  }

  async listEntities(options) {
    const { search, filters } = options;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { newField: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filters?.newField) {
      where.newField = filters.newField;
    }

    const entities = await this.prisma.entity.findMany({
      where,
      select: {
        id: true,
        name: true,
        newField: true, // Include in select
        createdAt: true,
        updatedAt: true,
      },
    });

    return { entities, total: entities.length };
  }
}
```

---

## 🎣 **5. Feature Module**

### **Query Keys**

```typescript
export const qk = {
  [entity]: {
    all: ['[entity]'] as const,
    lists: () => [...qk[entity].all, 'list'] as const,
    list: (search, limit, sortBy, sortOrder, cursor, filters) =>
      [
        ...qk[entity].lists(),
        { search, limit, sortBy, sortOrder, cursor, filters },
      ] as const,
    byId: (id: string) => [...qk[entity].all, 'byId', id] as const,
    byNewField: (value: string) =>
      [...qk[entity].all, 'byNewField', value] as const,
  },
} as const;
```

### **React Query Hooks**

```typescript
export function useEntity(id: string) {
  return useQuery({
    queryKey: qk[entity].byId(id),
    queryFn: () => entityService.getEntityById(id),
    enabled: !!id,
    staleTime: 30000,
    gcTime: 120000,
  });
}

export function useEntities(options = {}) {
  const {
    search = '',
    limit = 20,
    sortBy = 'createdAt',
    filters = {},
  } = options;

  return useQuery({
    queryKey: qk[entity].list(
      search,
      limit,
      sortBy,
      'desc',
      undefined,
      filters
    ),
    queryFn: () =>
      entityService.listEntities({ search, limit, sortBy, filters }),
    staleTime: 30000,
    gcTime: 120000,
  });
}

export function useCreateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: data => entityService.createEntity(data),
    onSuccess: newEntity => {
      queryClient.invalidateQueries({ queryKey: qk[entity].lists() });
      queryClient.setQueryData(qk[entity].byId(newEntity.id), newEntity);
    },
  });
}

export function useUpdateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => entityService.updateEntity(id, data),
    onSuccess: (updatedEntity, { id }) => {
      queryClient.setQueryData(qk[entity].byId(id), updatedEntity);
      queryClient.invalidateQueries({ queryKey: qk[entity].lists() });
    },
  });
}
```

---

## 🎨 **6. UI Components**

### **Form Component**

```typescript
export function EntityEditForm({ entityId, onSuccess }) {
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    resolver: zodResolver(EntityUpdateSchema),
    mode: 'onBlur',
  });

  const { data: entity } = useEntity(entityId);
  const updateEntity = useUpdateEntity();

  useEffect(() => {
    if (entity) {
      reset({
        name: entity.name || '',
        newField: entity.newField || '',  // Include new field
      });
    }
  }, [entity, reset]);

  const onSubmit = async (data) => {
    try {
      await updateEntity.mutateAsync({ id: entityId, data });
      onSuccess?.();
    } catch (error) {
      ErrorHandlingService.getInstance().processError(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Name Field */}
      <Input
        {...register('name')}
        label="Name"
        error={errors.name?.message}
      />

      {/* New Field */}
      <Input
        {...register('newField')}
        label="New Field"
        error={errors.newField?.message}
      />

      {/* Or for select fields: */}
      <select {...register('newField')}>
        <option value="">Select option</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </select>

      {/* Actions */}
      <Button type="submit" disabled={!isValid || updateEntity.isPending}>
        {updateEntity.isPending ? 'Updating...' : 'Update'}
      </Button>
    </form>
  );
}
```

### **List Component**

```typescript
export function EntityList({ onEdit }) {
  const [search, setSearch] = useState('');
  const [newFieldFilter, setNewFieldFilter] = useState('');

  const { data, isLoading } = useEntities({
    search,
    filters: { newField: newFieldFilter || undefined },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {/* Filters */}
      <Input
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Input
        placeholder="Filter by new field..."
        value={newFieldFilter}
        onChange={(e) => setNewFieldFilter(e.target.value)}
      />

      {/* List */}
      {data?.entities.map((entity) => (
        <div key={entity.id}>
          <h3>{entity.name}</h3>
          <p>New Field: {entity.newField || 'Not set'}</p>
          <Button onClick={() => onEdit?.(entity.id)}>Edit</Button>
        </div>
      ))}
    </div>
  );
}
```

### **Create Page**

```typescript
export default function CreateEntityPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isValid }, watch, setValue } = useForm({
    resolver: zodResolver(EntityCreateSchema),
  });

  const createEntity = useCreateEntity();

  const onSubmit = async (data) => {
    try {
      const entity = await createEntity.mutateAsync(data);
      router.push(`/[entity]/${entity.id}`);
    } catch (error) {
      ErrorHandlingService.getInstance().processError(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('name')}
        label="Name"
        error={errors.name?.message}
      />

      <Input
        {...register('newField')}
        label="New Field"
        error={errors.newField?.message}
      />

      <Button type="submit" disabled={!isValid || createEntity.isPending}>
        {createEntity.isPending ? 'Creating...' : 'Create'}
      </Button>
    </form>
  );
}
```

### **Form Components - Include Field**

```typescript
// In form defaults
defaultValues: {
  name: '',
  newField: '', // Include in defaults
}

// In form reset
reset({
  name: entity.name || '',
  newField: entity.newField || '', // Include in reset
})

// In form submission
await updateEntity.mutateAsync({
  id: entityId,
  data, // Contains all fields including newField
})
```

---

## 🧪 **7. Testing Snippets**

### **Unit Test**

```typescript
describe('Entity Schemas', () => {
  it('validates new field', () => {
    const result = EntitySchema.safeParse({
      id: 'test',
      name: 'Test',
      newField: 'valid-value',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });
});
```

### **API Integration Test**

```typescript
describe('POST /[entity]', () => {
  it('creates with new field', async () => {
    const response = await request(app)
      .post('/api/[entity]')
      .send({ name: 'Test', newField: 'test-value' })
      .expect(200);

    expect(response.body.data.newField).toBe('test-value');
  });
});
```

### **E2E Test**

```typescript
test('creates entity with new field', async ({ page }) => {
  await page.goto('/[entity]/create');
  await page.fill('[name="name"]', 'Test Entity');
  await page.fill('[name="newField"]', 'test-value');
  await page.click('button[type="submit"]');

  await expect(page.locator('[data-testid="new-field-display"]')).toContainText(
    'test-value'
  );
});
```

---

## 🔧 **8. Common Patterns**

### **Field Types Quick Reference**

```typescript
// Text field
newField: z.string().min(1).max(100).optional();

// Number field
newField: z.number().min(0).max(1000).optional();

// Boolean field
newField: z.boolean().default(false);

// Enum field
newField: z.enum(['OPTION1', 'OPTION2', 'OPTION3']).optional();

// Date field
newField: z.string().datetime().optional();

// Email field
newField: z.string().email().optional();

// URL field
newField: z.string().url().optional();
```

### **UI Component Selection**

```typescript
// Text input
<Input {...register('newField')} type="text" />

// Number input
<Input {...register('newField')} type="number" />

// Email input
<Input {...register('newField')} type="email" />

// Select dropdown
<select {...register('newField')}>
  <option value="opt1">Option 1</option>
</select>

// Searchable select
<SearchableCountrySelect
  name="newField"
  register={register}
  setValue={setValue}
  watch={watch}
  formErrors={errors}
/>

// Checkbox
<input {...register('newField')} type="checkbox" />

// Radio buttons
<input {...register('newField')} type="radio" value="option1" />
```

---

## ⚡ **Quick Commands**

```bash
# Database
npm run db:backup  # CRITICAL: Backup first
npx prisma migrate dev --name add_field
npx prisma generate

# Type checking
npm run type-check

# Testing
npm run test:unit
npm run test:integration

# Build
npm run build
```

---

## 🎯 **Implementation Flow**

1. **Backup**: Database backup → Verify backup
2. **Database**: Add field to Prisma schema → Generate migration
3. **Schemas**: Create Zod schemas → Update types
4. **API**: Update routes → Add validation
5. **Service**: Update database operations → Add business logic
6. **Hooks**: Create React Query hooks → Add query keys
7. **UI**: Update forms & lists → Add components → Include in all pages
8. **Test**: Write unit & integration tests
9. **Deploy**: Run migration → Deploy app

---

## 🚨 **Key Reminders**

- ✅ Always backup database before schema changes
- ✅ Always start with database schema
- ✅ Use feature-based organization
- ✅ Include new fields in ALL layers (DB → API → UI)
- ✅ Include new fields in ALL pages (view, edit, create)
- ✅ Add proper validation and error handling
- ✅ Test thoroughly before deployment
- ✅ Update documentation

---

## 🔍 **Debug Checklist**

```bash
# 1. Check TypeScript errors
npm run type-check

# 2. Verify database schema
npx prisma db push --preview-feature

# 3. Test API endpoints
curl -X GET http://localhost:3000/api/[entity]

# 4. Check React Query cache
# Use React DevTools

# 5. Verify form validation
# Check form errors in browser console

# 6. Test database queries
npx prisma studio

# 7. Check field mapping (CustomerType Error - Resolved)
# API returns field but UI doesn't show? Add to mapApiToCustomer:
# customerType: (raw.customerType as CustomerType) ?? previous?.customerType ?? 'ENDUSER'
# Import: import type { CustomerType } from '@/features/[entity]/schemas';
```
