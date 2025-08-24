# Customer Migration Strategy

## 🎯 **Customer Migration Overview**

This document outlines the strategy to migrate customer-related components from
the current bridge pattern to a modernized architecture using TanStack Query and
Zustand, following the temporary directory approach.

## 📊 **Current Customer Architecture Analysis**

### **What We Have (Current Customer Bridge Pattern)**

#### **Existing Files to Migrate:**

- ✅ `src/lib/bridges/CustomerApiBridge.ts` - API communication layer
- ✅ `src/components/bridges/CustomerManagementBridge.tsx` - Context provider
- ✅ `src/hooks/useCustomer.ts` - React Query hooks (partially modern)
- ✅ `src/app/(dashboard)/customers/page.tsx` - Customer list page
- ✅ `src/app/(dashboard)/customers/[id]/page.tsx` - Customer detail page
- ✅ `src/app/(dashboard)/customers/[id]/edit/page.tsx` - Customer edit page
- ✅ `src/components/customers/CustomerList.tsx` - Customer list component
- ✅ `src/components/customers/CustomerForm.tsx` - Customer form component

#### **Current Issues:**

- ❌ **Over-Engineered**: Complex Management Bridge with 40+ properties
- ❌ **Performance**: Large context causing unnecessary re-renders
- ❌ **Complexity**: Multiple layers of abstraction
- ❌ **Maintainability**: Hard to understand and modify

### **What We Want (Modern Customer Architecture)**

#### **New Architecture:**

- ✅ **Simple**: Direct TanStack Query usage
- ✅ **Simple**: Focused Zustand store for customer UI state
- ✅ **Simple**: Direct API client calls
- ✅ **Performance**: Minimal re-renders
- ✅ **Maintainability**: Easy to understand and modify

## 🚀 **Customer Migration Phases**

### **Phase 1: Customer Zustand Store (Week 1)**

#### **1.1 Create Customer Store**

```typescript
// temp-migration/src/lib/store/customerStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface CustomerFilters {
  search: string;
  status: 'all' | 'active' | 'inactive' | 'prospect';
  industry: string;
  region: string;
  sortBy: 'name' | 'createdAt' | 'lastContact' | 'revenue';
  sortOrder: 'asc' | 'desc';
}

interface CustomerState {
  // UI State
  filters: CustomerFilters;
  selectedCustomer?: Customer;
  viewMode: 'grid' | 'list' | 'table';
  showFilters: boolean;
  showCreateModal: boolean;

  // Actions
  setFilters: (filters: Partial<CustomerFilters>) => void;
  setSelectedCustomer: (customer?: Customer) => void;
  setViewMode: (mode: 'grid' | 'list' | 'table') => void;
  toggleFilters: () => void;
  toggleCreateModal: () => void;
  resetFilters: () => void;
}

export const useCustomerStore = create<CustomerState>()(
  subscribeWithSelector(
    immer(set => ({
      // Initial state
      filters: {
        search: '',
        status: 'all',
        industry: 'all',
        region: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
      viewMode: 'list',
      showFilters: false,
      showCreateModal: false,

      // Actions
      setFilters: newFilters =>
        set(state => {
          Object.assign(state.filters, newFilters);
        }),
      setSelectedCustomer: customer =>
        set(state => {
          state.selectedCustomer = customer;
        }),
      setViewMode: mode =>
        set(state => {
          state.viewMode = mode;
        }),
      toggleFilters: () =>
        set(state => {
          state.showFilters = !state.showFilters;
        }),
      toggleCreateModal: () =>
        set(state => {
          state.showCreateModal = !state.showCreateModal;
        }),
      resetFilters: () =>
        set(state => {
          state.filters = {
            search: '',
            status: 'all',
            industry: 'all',
            region: 'all',
            sortBy: 'createdAt',
            sortOrder: 'desc',
          };
        }),
    }))
  )
);
```

#### **1.2 Customer Store Features**

- **Filter Management**: Search, status, industry, region filtering
- **Sorting**: Multiple sort options with order control
- **View Modes**: Grid, list, table views
- **UI State**: Modal states, filter visibility
- **Selection**: Customer selection for actions

### **Phase 2: Customer API Layer (Week 2)**

#### **2.1 Create Customer API Client**

```typescript
// temp-migration/src/lib/api/customerApi.ts
import { apiClient } from '@/lib/api-client';

export interface CustomerFetchParams {
  search?: string;
  status?: string;
  industry?: string;
  region?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CustomerCreatePayload {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  industry?: string;
  region?: string;
  status: 'active' | 'inactive' | 'prospect';
  notes?: string;
  tags?: string[];
}

export interface CustomerUpdatePayload extends Partial<CustomerCreatePayload> {
  id: string;
}

export const customerApi = {
  // List customers with filtering and pagination
  getCustomers: (params?: CustomerFetchParams) =>
    apiClient.get<Customer[]>('/api/customers', { params }),

  // Get single customer by ID
  getCustomer: (id: string) => apiClient.get<Customer>(`/api/customers/${id}`),

  // Create new customer
  createCustomer: (data: CustomerCreatePayload) =>
    apiClient.post<Customer>('/api/customers', data),

  // Update existing customer
  updateCustomer: (id: string, data: CustomerUpdatePayload) =>
    apiClient.patch<Customer>(`/api/customers/${id}`, data),

  // Delete customer
  deleteCustomer: (id: string) => apiClient.delete(`/api/customers/${id}`),

  // Validate customer email
  validateEmail: (email: string, excludeId?: string) =>
    apiClient.post<{ exists: boolean; conflictingCustomer?: Customer }>(
      '/api/customers/validate-email',
      { email, excludeId }
    ),

  // Get customer statistics
  getCustomerStats: () => apiClient.get<CustomerStats>('/api/customers/stats'),

  // Get customer industries
  getIndustries: () => apiClient.get<string[]>('/api/customers/industries'),

  // Get customer regions
  getRegions: () => apiClient.get<string[]>('/api/customers/regions'),
};
```

#### **2.2 Customer API Features**

- **CRUD Operations**: Full customer lifecycle management
- **Filtering & Pagination**: Advanced search and filtering
- **Validation**: Email validation to prevent duplicates
- **Statistics**: Customer analytics and insights
- **Metadata**: Industries and regions for filtering

### **Phase 3: Customer React Query Hooks (Week 3)**

#### **3.1 Create Customer Hooks**

```typescript
// temp-migration/src/hooks/useCustomer.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  customerApi,
  type CustomerFetchParams,
  type CustomerCreatePayload,
  type CustomerUpdatePayload,
} from '@/lib/api/customerApi';

export const CUSTOMER_QUERY_KEYS = {
  all: ['customers'] as const,
  lists: () => ['customers', 'list'] as const,
  list: (params: CustomerFetchParams) => ['customers', 'list', params] as const,
  details: () => ['customers', 'detail'] as const,
  detail: (id: string) => ['customers', 'detail', id] as const,
  stats: () => ['customers', 'stats'] as const,
  industries: () => ['customers', 'industries'] as const,
  regions: () => ['customers', 'regions'] as const,
  validation: (field: string, value: string) =>
    ['customers', 'validation', field, value] as const,
};

// Customer list with filtering
export function useCustomerList(params?: CustomerFetchParams) {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.list(params),
    queryFn: () => customerApi.getCustomers(params),
    staleTime: 30000,
    gcTime: 120000,
  });
}

// Single customer detail
export function useCustomerDetail(id: string) {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.detail(id),
    queryFn: () => customerApi.getCustomer(id),
    enabled: !!id,
    staleTime: 30000,
    gcTime: 120000,
  });
}

// Customer creation
export function useCustomerCreate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customerApi.createCustomer,
    onSuccess: newCustomer => {
      // Invalidate and refetch customer lists
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.lists() });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.stats() });
      // Add new customer to cache
      queryClient.setQueryData(
        CUSTOMER_QUERY_KEYS.detail(newCustomer.id),
        newCustomer
      );
    },
  });
}

// Customer update
export function useCustomerUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerUpdatePayload }) =>
      customerApi.updateCustomer(id, data),
    onSuccess: (updatedCustomer, { id }) => {
      // Invalidate and refetch customer lists
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.lists() });
      // Update customer detail in cache
      queryClient.setQueryData(CUSTOMER_QUERY_KEYS.detail(id), updatedCustomer);
    },
  });
}

// Customer deletion
export function useCustomerDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customerApi.deleteCustomer,
    onSuccess: (_, deletedId) => {
      // Invalidate and refetch customer lists
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.lists() });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.stats() });
      // Remove customer from cache
      queryClient.removeQueries({
        queryKey: CUSTOMER_QUERY_KEYS.detail(deletedId),
      });
    },
  });
}

// Customer statistics
export function useCustomerStats() {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.stats(),
    queryFn: () => customerApi.getCustomerStats(),
    staleTime: 60000, // Cache stats for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}

// Customer industries
export function useCustomerIndustries() {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.industries(),
    queryFn: () => customerApi.getIndustries(),
    staleTime: 300000, // Cache for 5 minutes
    gcTime: 600000, // Keep in cache for 10 minutes
  });
}

// Customer regions
export function useCustomerRegions() {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.regions(),
    queryFn: () => customerApi.getRegions(),
    staleTime: 300000, // Cache for 5 minutes
    gcTime: 600000, // Keep in cache for 10 minutes
  });
}

// Email validation
export function useCustomerEmailValidation(email: string, excludeId?: string) {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.validation('email', email),
    queryFn: () => customerApi.validateEmail(email, excludeId),
    enabled: !!email && email.length > 0,
    staleTime: 60000, // Cache validation for 1 minute
    retry: false, // Don't retry validation failures
  });
}
```

#### **3.2 Customer Hook Features**

- **List Management**: Filtering, pagination, sorting
- **Detail Management**: Single customer operations
- **CRUD Operations**: Create, update, delete with cache management
- **Statistics**: Customer analytics
- **Metadata**: Industries and regions
- **Validation**: Email validation for forms

### **Phase 4: Customer Components (Week 4)**

#### **4.1 Create Customer List Component**

```typescript
// temp-migration/src/components/customers/CustomerList.tsx
'use client';

import { useCustomerStore } from '@/lib/store/customerStore';
import { useCustomerList, useCustomerDelete } from '@/hooks/useCustomer';
import { CustomerFilters } from './CustomerFilters';
import { CustomerGrid } from './CustomerGrid';
import { CustomerActions } from './CustomerActions';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export function CustomerList() {
  // Zustand for UI state
  const { filters, viewMode, setFilters, showCreateModal, toggleCreateModal } = useCustomerStore();

  // React Query for data
  const { data: customers, isLoading, error } = useCustomerList(filters);
  const deleteMutation = useCustomerDelete();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="space-y-6">
      <CustomerFilters filters={filters} onChange={setFilters} />

      <CustomerActions
        onCreate={toggleCreateModal}
        onDelete={(id) => deleteMutation.mutate(id)}
        showCreateModal={showCreateModal}
      />

      <CustomerGrid
        customers={customers}
        viewMode={viewMode}
        onCustomerSelect={(customer) => setSelectedCustomer(customer)}
      />
    </div>
  );
}
```

#### **4.2 Create Customer Filters Component**

```typescript
// temp-migration/src/components/customers/CustomerFilters.tsx
'use client';

import { useCustomerStore } from '@/lib/store/customerStore';
import { useCustomerIndustries, useCustomerRegions } from '@/hooks/useCustomer';
import { CustomerFilters as CustomerFiltersType } from '@/lib/store/customerStore';

interface CustomerFiltersProps {
  filters: CustomerFiltersType;
  onChange: (filters: Partial<CustomerFiltersType>) => void;
}

export function CustomerFilters({ filters, onChange }: CustomerFiltersProps) {
  const { data: industries } = useCustomerIndustries();
  const { data: regions } = useCustomerRegions();

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search customers..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onChange({ status: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="prospect">Prospect</option>
          </select>
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Industry
          </label>
          <select
            value={filters.industry}
            onChange={(e) => onChange({ industry: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Industries</option>
            {industries?.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        {/* Region */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Region
          </label>
          <select
            value={filters.region}
            onChange={(e) => onChange({ region: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Regions</option>
            {regions?.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
```

#### **4.3 Create Customer Grid Component**

```typescript
// temp-migration/src/components/customers/CustomerGrid.tsx
'use client';

import { Customer } from '@/types/customer';
import { useCustomerStore } from '@/lib/store/customerStore';

interface CustomerGridProps {
  customers: Customer[];
  viewMode: 'grid' | 'list' | 'table';
  onCustomerSelect: (customer: Customer) => void;
}

export function CustomerGrid({ customers, viewMode, onCustomerSelect }: CustomerGridProps) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onClick={() => onCustomerSelect(customer)}
          />
        ))}
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {customers.map((customer) => (
          <CustomerListItem
            key={customer.id}
            customer={customer}
            onClick={() => onCustomerSelect(customer)}
          />
        ))}
      </div>
    );
  }

  return (
    <CustomerTable
      customers={customers}
      onCustomerSelect={onCustomerSelect}
    />
  );
}

// Customer Card Component
function CustomerCard({ customer, onClick }: { customer: Customer; onClick: () => void }) {
  return (
    <div
      className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          customer.status === 'active' ? 'bg-green-100 text-green-800' :
          customer.status === 'inactive' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {customer.status}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <p>{customer.email}</p>
        {customer.company && <p>{customer.company}</p>}
        {customer.industry && <p>Industry: {customer.industry}</p>}
        {customer.region && <p>Region: {customer.region}</p>}
      </div>
    </div>
  );
}

// Customer List Item Component
function CustomerListItem({ customer, onClick }: { customer: Customer; onClick: () => void }) {
  return (
    <div
      className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
          <p className="text-sm text-gray-600">{customer.email}</p>
          {customer.company && <p className="text-sm text-gray-500">{customer.company}</p>}
        </div>

        <div className="text-right">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            customer.status === 'active' ? 'bg-green-100 text-green-800' :
            customer.status === 'inactive' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {customer.status}
          </span>
          {customer.industry && <p className="text-sm text-gray-500 mt-1">{customer.industry}</p>}
        </div>
      </div>
    </div>
  );
}

// Customer Table Component
function CustomerTable({ customers, onCustomerSelect }: { customers: Customer[]; onCustomerSelect: (customer: Customer) => void }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Company
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Industry
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Region
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onCustomerSelect(customer)}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {customer.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {customer.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {customer.company || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  customer.status === 'active' ? 'bg-green-100 text-green-800' :
                  customer.status === 'inactive' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {customer.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {customer.industry || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {customer.region || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## 📋 **Customer Migration Checklist**

### **Week 1: Customer Zustand Store**

- [ ] Create `temp-migration/src/lib/store/customerStore.ts`
- [ ] Test store independently
- [ ] Document store patterns
- [ ] Verify filter management works

### **Week 2: Customer API Layer**

- [ ] Create `temp-migration/src/lib/api/customerApi.ts`
- [ ] Test API calls independently
- [ ] Document API patterns
- [ ] Verify CRUD operations work

### **Week 3: Customer React Query Hooks**

- [ ] Create `temp-migration/src/hooks/useCustomer.ts`
- [ ] Test hooks independently
- [ ] Verify cache management
- [ ] Test validation hooks

### **Week 4: Customer Components**

- [ ] Create `temp-migration/src/components/customers/CustomerList.tsx`
- [ ] Create `temp-migration/src/components/customers/CustomerFilters.tsx`
- [ ] Create `temp-migration/src/components/customers/CustomerGrid.tsx`
- [ ] Test components independently
- [ ] Test integration

## 🎯 **Customer Migration Success Criteria**

### **Before Replacement**

- [ ] Customer store works independently
- [ ] Customer API calls work correctly
- [ ] Customer hooks manage cache properly
- [ ] Customer components render correctly
- [ ] All customer functionality preserved

### **After Replacement**

- [ ] No regressions in customer functionality
- [ ] Better performance for customer operations
- [ ] Cleaner customer code structure
- [ ] Easier to maintain customer features
- [ ] Team can work with new customer patterns

## 🚨 **Customer Migration Risk Mitigation**

### **Customer-Specific Considerations**

- **Data Integrity**: Ensure customer data is preserved during migration
- **User Experience**: Maintain familiar customer interface
- **Performance**: Customer list should load faster
- **Filtering**: Advanced customer filtering should work better

### **Rollback Plan for Customers**

If customer migration fails:

```bash
# Restore customer-specific files
cp -r src/components/bridges/CustomerManagementBridge.tsx.backup src/components/bridges/
cp -r src/lib/bridges/CustomerApiBridge.ts.backup src/lib/bridges/
cp src/hooks/useCustomer.ts.backup src/hooks/useCustomer.ts
```

## 📞 **Next Steps for Customer Migration**

1. **Start with Week 1**: Create customer Zustand store
2. **Test independently**: Each customer component before integration
3. **Document progress**: Update customer migration progress
4. **Performance testing**: Compare customer performance
5. **Gradual replacement**: Replace customer components one at a time

This customer migration strategy ensures a safe, clean, and well-tested
migration of customer-related functionality to the modernized architecture.
