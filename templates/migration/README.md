# Migration Templates

This directory contains templates for migrating from the Bridge Pattern to the
new modern architecture as outlined in `docs/MANUAL_MIGRATION_GUIDE.md`.

## 📁 Template Files

### **Infrastructure Templates**

| Template                    | Purpose                       | Target Location              |
| --------------------------- | ----------------------------- | ---------------------------- |
| `errors.template.ts`        | Error handling infrastructure | `src/lib/errors.ts`          |
| `logger.template.ts`        | Structured logging            | `src/lib/logger.ts`          |
| `requestId.template.ts`     | Request correlation IDs       | `src/lib/requestId.ts`       |
| `http.template.ts`          | HTTP client helper            | `src/lib/http.ts`            |
| `response.template.ts`      | Typed response envelopes      | `src/lib/api/response.ts`    |
| `analytics.template.ts`     | Analytics integration         | `src/lib/analytics/index.ts` |
| `route-wrapper.template.ts` | API route wrapper             | `src/lib/api/route.ts`       |
| `layout.template.tsx`       | Provider stack layout         | `app/(dashboard)/layout.tsx` |

### **Domain-Specific Templates**

| Template                        | Purpose               | Target Location                                           |
| ------------------------------- | --------------------- | --------------------------------------------------------- |
| `service.template.ts`           | Service layer         | `src/services/__RESOURCE__Service.ts`                     |
| `hook.template.ts`              | React Query hooks     | `src/hooks/use__RESOURCE__s_new.ts`                       |
| `store.template.ts`             | Zustand store         | `src/lib/store/__RESOURCE__Store.ts`                      |
| `component.template.tsx`        | React component       | `src/components/__RESOURCE__s_new/__ENTITY__List_new.tsx` |
| `page.template.tsx`             | Next.js page          | `src/app/(dashboard)/__RESOURCE__s_new/page.tsx`          |
| `route.template.ts`             | API routes            | `src/app/api/__RESOURCE__/route.ts`                       |
| `bulk-delete-route.template.ts` | Bulk delete API       | `src/app/api/__RESOURCE__/bulk-delete/route.ts`           |
| `transaction.template.ts`       | Database transactions | `src/lib/transactions/__RESOURCE__Transactions.ts`        |

## 🔄 Migration Process

### **Step 1: Create Infrastructure Files**

First, create the core infrastructure files:

```bash
# Copy infrastructure templates
cp templates/migration/errors.template.ts src/lib/errors.ts
cp templates/migration/logger.template.ts src/lib/logger.ts
cp templates/migration/requestId.template.ts src/lib/requestId.ts
cp templates/migration/http.template.ts src/lib/http.ts
cp templates/migration/response.template.ts src/lib/api/response.ts
cp templates/migration/analytics.template.ts src/lib/analytics/index.ts
cp templates/migration/route-wrapper.template.ts src/lib/api/route.ts
```

### **Step 2: Update Layout**

Update your dashboard layout with the provider stack:

```bash
cp templates/migration/layout.template.tsx app/(dashboard)/layout.tsx
```

### **Step 3: Migrate Domain by Domain**

For each domain (e.g., customers, products, proposals):

1. **Create Service Layer**

   ```bash
   cp templates/migration/service.template.ts src/services/customerService.ts
   # Replace __ENTITY__ with Customer, __RESOURCE__ with customers
   ```

2. **Create React Query Hooks**

   ```bash
   cp templates/migration/hook.template.ts src/hooks/useCustomers_new.ts
   # Replace __ENTITY__ with Customer, __RESOURCE__ with customers
   ```

3. **Create Zustand Store**

   ```bash
   cp templates/migration/store.template.ts src/lib/store/customerStore.ts
   # Replace __ENTITY__ with Customer, __RESOURCE__ with customers
   ```

4. **Create React Component**

   ```bash
   cp templates/migration/component.template.tsx src/components/customers_new/CustomerList_new.tsx
   # Replace __ENTITY__ with Customer, __RESOURCE__ with customers
   ```

5. **Create Next.js Page**

   ```bash
   cp templates/migration/page.template.tsx src/app/(dashboard)/customers_new/page.tsx
   # Replace __ENTITY__ with Customer, __RESOURCE__ with customers
   ```

6. **Create API Routes**

   ```bash
   cp templates/migration/route.template.ts src/app/api/customers/route.ts
   cp templates/migration/bulk-delete-route.template.ts src/app/api/customers/bulk-delete/route.ts
   # Replace __ENTITY__ with Customer, __RESOURCE__ with customers
   ```

7. **Create Transaction Patterns** (if needed)
   ```bash
   cp templates/migration/transaction.template.ts src/lib/transactions/customerTransactions.ts
   # Replace __ENTITY__ with Customer, __RESOURCE__ with customers
   ```

## 🔧 Template Placeholders

All templates use these placeholders that need to be replaced:

- `__ENTITY__` → Entity name (e.g., Customer, Product, Proposal)
- `__RESOURCE__` → Resource name (e.g., customers, products, proposals)

### **Example Replacement**

For the customers domain:

- `__ENTITY__` → `Customer`
- `__RESOURCE__` → `customers`

For the products domain:

- `__ENTITY__` → `Product`
- `__RESOURCE__` → `products`

## ✅ Validation Checklist

After creating each domain, run through the validation checklist from
`docs/MANUAL_MIGRATION_GUIDE.md`:

### **Infrastructure & Core**

- [ ] TypeScript compilation: `npm run type-check`
- [ ] Build test: `npm run build`
- [ ] Route handler logs requests with correlation IDs
- [ ] Error responses have consistent JSON format
- [ ] RBAC works correctly for different roles
- [ ] Provider stack order is correct in layout
- [ ] SSR/CSR hydration works without warnings
- [ ] Server Components used for static shell
- [ ] Client Components used for interactive data

### **Data & API**

- [ ] Cursor pagination works end-to-end
- [ ] Query keys are stable (no unnecessary refetches)
- [ ] Bulk operations work without API spam
- [ ] Multi-ID fetching uses useQueries
- [ ] Infinite scroll with "Load More" works
- [ ] API routes use createRoute wrapper
- [ ] Typed response envelopes work correctly
- [ ] Database transactions work for multi-step writes
- [ ] Idempotency keys used for external integrations

### **State Management**

- [ ] Zustand subscriptions use shallow comparison
- [ ] No getState() calls in render paths
- [ ] Store selectors work correctly
- [ ] State persistence works as expected

### **Functionality**

- [ ] All CRUD operations work
- [ ] Search and filtering work
- [ ] Sorting works correctly
- [ ] Bulk delete operations work
- [ ] Error handling shows proper messages
- [ ] Loading states work correctly

### **Performance**

- [ ] Page loads quickly
- [ ] React Query caching works
- [ ] No unnecessary re-renders
- [ ] Memory usage is reasonable

### **UI & UX**

- [ ] UI consistency matches existing design
- [ ] Responsive design works
- [ ] Accessibility features work
- [ ] Toast notifications work

## 🚀 Next Steps

1. **Complete Infrastructure Setup** - Create all infrastructure files
2. **Migrate Domains One by One** - Start with customers, then products, etc.
3. **Test Thoroughly** - Use the validation checklist for each domain
4. **Update Navigation** - Point to new routes
5. **Remove Old Files** - After all domains are migrated
6. **Update Documentation** - Reflect new architecture

## 📚 References

- `docs/MANUAL_MIGRATION_GUIDE.md` - Complete migration guide
- `docs/CORE_REQUIREMENTS.md` - Development standards
- `docs/BRIDGE_MIGRATION_MODERNIZATION_PLAN.md` - Migration strategy
