# 🎯 **Field Addition Steps**

## 📋 **Checklist**

- [ ] Identify entity & field type
- [ ] Plan database indexing
- [ ] Define validation rules
- [ ] Check accessibility requirements

---

## 🗄️ **1. Database (5 min)**

- [ ] Add field to Prisma schema
- [ ] Add index for searchable fields
- [ ] Run migration: `npx prisma migrate dev --name add_field`
- [ ] Generate types: `npx prisma generate`

---

## 🔍 **2. Zod Schemas (10 min)**

- [ ] Create base field schema with validation
- [ ] Update entity schema to include field
- [ ] Create create schema (omit auto fields)
- [ ] Create update schema (optional fields)
- [ ] Export from feature module

---

## 🚀 **3. API Routes (15 min)**

- [ ] Update GET: include field in response
- [ ] Update POST: add field validation
- [ ] Update PUT: support field updates
- [ ] Add uniqueness checks if needed
- [ ] Test CRUD operations

---

## 🔧 **4. Service Layer (15 min)**

- [ ] Update getEntityById: include field in select
- [ ] Update createEntity: handle field data
- [ ] Update updateEntity: support field changes
- [ ] Update listEntities: add field filtering
- [ ] Add field to search functionality

---

## 🎣 **5. Feature Hooks (10 min)**

- [ ] Update query keys for new field
- [ ] Update useEntity hook
- [ ] Update useEntities with filtering
- [ ] Update create/update mutations
- [ ] Add cache invalidation

---

## 🎨 **6. UI Components (20 min)**

- [ ] Update edit form with field input
- [ ] Update create form with validation
- [ ] Update list to display field
- [ ] Add field to search/filters
- [ ] Ensure accessibility compliance

---

## 🧪 **7. Testing (15 min)**

- [ ] Unit tests for schemas
- [ ] Integration tests for API
- [ ] E2E tests for UI
- [ ] Test validation & error handling
- [ ] Test search & filtering

---

## 🚀 **8. Deploy (5 min)**

- [ ] Run: `npm run type-check`
- [ ] Run: `npm run lint`
- [ ] Run: `npm run test:unit`
- [ ] Run: `npm run build`
- [ ] Deploy & verify

---

## ⚡ **Commands**

```bash
npx prisma migrate dev --name add_field
npx prisma generate
npm run type-check
npm run build
```

---

## 🚨 **Must Do**

- ✅ Start with database schema
- ✅ Include field in ALL layers
- ✅ Add validation everywhere
- ✅ Test before deployment

---

## ❌ **Common Mistakes**

- ❌ Skip database migration
- ❌ Forget service selects
- ❌ Miss React Query hooks
- ❌ Skip form validation
- ❌ Forget CRUD operations

---

## 🎯 **Complete When**

- [ ] Migration applied
- [ ] TypeScript passes
- [ ] API returns correct data
- [ ] UI renders properly
- [ ] All tests pass
