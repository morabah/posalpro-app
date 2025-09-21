'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { Button } from '@/components/ui/forms/Button';
import type { Customer } from '@/features/customers';
import { useDeleteCustomer, useDeleteCustomersBulk, useInfiniteCustomers } from '@/features/customers/hooks';
import { useUnifiedCustomerData } from '@/features/customers/hooks/useCustomers';
import { analytics } from '@/lib/analytics';
import { logError } from '@/lib/logger';
import {
  customerSelectors,
  CustomerSortBy,
  CustomerStatus,
  CustomerTier,
  useCustomerQueryParams,
  useCustomerSelection,
  useCustomerStore,
} from '@/lib/store/customerStore';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Customer List Header Component
function CustomerListHeader() {
  const { hasSelection, selectedCount } = useCustomerSelection();
  const deleteBulk = useDeleteCustomersBulk();

  const handleBulkDelete = useCallback(async () => {
    const selectedIds = useCustomerStore.getState().selection.selectedIds;
    if (selectedIds.length === 0) return;

    // Show warning about bulk delete
    toast.warning(`Deleting ${selectedIds.length} customers...`, {
      description: 'This action cannot be undone.',
      action: {
        label: 'Proceed',
        onClick: async () => {
          try {
            await deleteBulk.mutateAsync(selectedIds);
            analytics.trackOptimized(
              'customers_bulk_deleted',
              {
                count: selectedIds.length,
              },
              'US-3.4',
              'H4'
            );
          } catch (error) {
            logError(
              'Bulk delete failed',
              error instanceof Error ? error : new Error(String(error)),
              {
                component: 'CustomerList',
                operation: 'bulkDelete',
                selectedIdsCount: selectedIds.length,
              }
            );
          }
        },
      },
    });
  }, [deleteBulk]);

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        <p className="text-gray-600">Manage your customer relationships</p>
      </div>

      <div className="flex items-center gap-3">
        {hasSelection && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{selectedCount} selected</span>
            <Button
              variant="danger"
              size="sm"
              onClick={handleBulkDelete}
              disabled={deleteBulk.isPending}
            >
              {deleteBulk.isPending ? <LoadingSpinner size="sm" /> : 'Delete Selected'}
            </Button>
          </div>
        )}

        <Button variant="primary">Add Customer</Button>
      </div>
    </div>
  );
}

// Customer Filters Component
function CustomerFilters() {
  const filters = useCustomerStore(customerSelectors.filters);
  const setFilters = useCustomerStore(state => state.setFilters);
  const clearFilters = useCustomerStore(state => state.clearFilters);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters({ search: e.target.value });
    },
    [setFilters]
  );

  const handleStatusChange = useCallback(
    (value: unknown) => {
      setFilters({ status: (value as CustomerStatus) || undefined });
    },
    [setFilters]
  );

  const handleTierChange = useCallback(
    (value: unknown) => {
      setFilters({ tier: (value as CustomerTier) || undefined });
    },
    [setFilters]
  );

  const hasActiveFilters = filters.status || filters.tier || filters.industry || filters.search;

  // Define options for Select components
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'PROSPECT', label: 'Prospect' },
  ];

  const tierOptions = [
    { value: '', label: 'All Tiers' },
    { value: 'STANDARD', label: 'Standard' },
    { value: 'PREMIUM', label: 'Premium' },
    { value: 'ENTERPRISE', label: 'Enterprise' },
  ];

  return (
    <Card className="p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <Input
            placeholder="Search customers..."
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <Select
            value={filters.status || ''}
            onChange={handleStatusChange}
            options={statusOptions}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
          <Select value={filters.tier || ''} onChange={handleTierChange} options={tierOptions} />
        </div>

        <div className="flex items-end">
          {hasActiveFilters && (
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Customer Table Component
function CustomerTable() {
  const queryParams = useCustomerQueryParams();
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteCustomers(queryParams);
  const selectedIds = useCustomerStore(customerSelectors.selectedIds);
  const toggleSelection = useCustomerStore(state => state.toggleSelection);
  const selectAll = useCustomerStore(state => state.selectAll);
  const sorting = useCustomerStore(customerSelectors.sorting);
  const setSorting = useCustomerStore(state => state.setSorting);
  const router = useRouter();

  // Flatten all pages data
  const customers = useMemo(() => {
    return data?.pages.flatMap(page => page?.items || []) || [];
  }, [data]);

  // Get all customer IDs for select all functionality
  const allCustomerIds = useMemo(() => {
    return customers.map(customer => customer.id);
  }, [customers]);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === allCustomerIds.length) {
      // If all are selected, deselect all
      selectAll([]);
    } else {
      // Otherwise, select all
      selectAll(allCustomerIds);
    }
  }, [selectedIds.length, allCustomerIds.length, selectAll, allCustomerIds]);

  const handleSort = useCallback(
    (sortBy: CustomerSortBy) => {
      setSorting({
        sortBy,
        sortOrder: sorting.sortBy === sortBy && sorting.sortOrder === 'asc' ? 'desc' : 'asc',
      });
    },
    [sorting, setSorting]
  );

  const handleViewCustomer = useCallback(
    (customerId: string) => {
      router.push(`/customers/${customerId}`);
    },
    [router]
  );

  const handleEditCustomer = useCallback(
    (customerId: string) => {
      router.push(`/customers/${customerId}/edit`);
    },
    [router]
  );

  const deleteCustomer = useDeleteCustomer();
  const handleDeleteCustomer = useCallback(
    async (customerId: string, customerName: string) => {
      const confirmDelete = window.confirm(
        `Delete customer "${customerName}"? This action cannot be undone.`
      );
      if (!confirmDelete) return;
      try {
        await deleteCustomer.mutateAsync(customerId);
        toast.success('Customer deleted');
      } catch (err) {
        toast.error('Failed to delete customer');
      }
    },
    [deleteCustomer]
  );

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
          <span className="ml-2">Loading customers...</span>
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <p className="text-red-600">Failed to load customers</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (customers.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <p className="text-gray-600">No customers found</p>
          <Button variant="primary" className="mt-2">
            Add your first customer
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left">
                <Checkbox
                  checked={
                    selectedIds.length === allCustomerIds.length && allCustomerIds.length > 0
                  }
                  indeterminate={
                    selectedIds.length > 0 && selectedIds.length < allCustomerIds.length
                  }
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  className="flex items-center font-medium text-gray-700 hover:text-gray-900"
                  onClick={() => handleSort('name')}
                >
                  Name
                  {sorting.sortBy === 'name' && (
                    <span className="ml-1">{sorting.sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  className="flex items-center font-medium text-gray-700 hover:text-gray-900"
                  onClick={() => handleSort('status')}
                >
                  Status
                  {sorting.sortBy === 'status' && (
                    <span className="ml-1">{sorting.sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Industry</th>
              <th className="px-4 py-3 text-left">
                <button
                  className="flex items-center font-medium text-gray-700 hover:text-gray-900"
                  onClick={() => handleSort('createdAt')}
                >
                  Created
                  {sorting.sortBy === 'createdAt' && (
                    <span className="ml-1">{sorting.sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer: Customer) => (
              <tr key={customer.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selectedIds.includes(customer.id)}
                    onChange={() => toggleSelection(customer.id)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">{customer.name}</div>
                    {customer.tier && (
                      <Badge variant="secondary" className="text-xs">
                        {customer.tier}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      customer.status === 'ACTIVE'
                        ? 'success'
                        : customer.status === 'PROSPECT'
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {customer.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-600">{customer.email}</td>
                <td className="px-4 py-3 text-gray-600">{customer.industry || '-'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCustomer(customer.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewCustomer(customer.id)}
                    >
                      View
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={deleteCustomer.isPending}
                      onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                    >
                      {deleteCustomer.isPending ? 'Deleting…' : 'Delete'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasNextPage && (
        <div className="p-4 border-t">
          <Button
            variant="secondary"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full"
          >
            {isFetchingNextPage ? (
              <>
                <LoadingSpinner size="sm" />
                Loading more...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}

// ====================
// Optimized Customer List Header Component
// ====================
function CustomerListHeaderOptimized({ stats, deleteBulk }: { stats: any; deleteBulk: any }) {
  const router = useRouter();
  const selectedIds: string[] = []; // We'll manage this locally for now

  const selectedCount = selectedIds.length;
  const hasSelection = selectedCount > 0;

  const handleCreateCustomer = useCallback(() => {
    analytics.trackOptimized(
      'customer_create_initiated',
      { source: 'customer_list' },
      'US-2.1',
      'H3'
    );
    router.push('/customers/create');
  }, [router]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} customer(s)? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      await deleteBulk.mutateAsync(selectedIds);
      analytics.trackOptimized(
        'customers_bulk_deleted',
        {
          count: selectedIds.length,
        },
        'US-2.1',
        'H3'
      );
    } catch (error) {
      logError('Bulk delete failed', error instanceof Error ? error : new Error(String(error)), {
        component: 'CustomerListHeaderOptimized',
        operation: 'bulkDelete',
        selectedIdsCount: selectedIds.length,
      });
    }
  }, []);

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        <p className="text-gray-600">Manage your customer relationships</p>
        {stats?.data && (
          <div className="mt-2 text-sm text-gray-500">
            {stats.data.total} customers • {stats.data.byStatus.ACTIVE || 0} active
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {hasSelection && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{selectedCount} selected</span>
            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
              Delete Selected
            </Button>
          </div>
        )}

        <Button variant="primary" onClick={handleCreateCustomer}>
          Add Customer
        </Button>
      </div>
    </div>
  );
}

// ====================
// Optimized Customer Filters Component
// ====================
function CustomerFiltersOptimized({
  onFilterChange,
  onClearFilters,
  customerCount,
}: {
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  customerCount: number;
}) {
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: '',
    tier: '',
  });

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(localFilters.search), 250);
    return () => clearTimeout(t);
  }, [localFilters.search]);

  const handleSearchChange = useCallback(
    (searchVal: string) => {
      setLocalFilters(prev => ({ ...prev, search: searchVal }));
      onFilterChange('search', searchVal);
    },
    [onFilterChange]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      setLocalFilters(prev => ({ ...prev, status: value }));
      onFilterChange('status', value);
    },
    [onFilterChange]
  );

  const handleTierChange = useCallback(
    (value: string) => {
      setLocalFilters(prev => ({ ...prev, tier: value }));
      onFilterChange('tier', value);
    },
    [onFilterChange]
  );

  const hasActiveFilters = localFilters.status || localFilters.tier || localFilters.search;

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">{customerCount} customers found</div>
        {hasActiveFilters && (
          <Button variant="secondary" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <Input
            placeholder="Search customers..."
            value={localFilters.search}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <Select
            value={localFilters.status}
            onChange={value => handleStatusChange(value || '')}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'PROSPECT', label: 'Prospect' },
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
          <Select
            value={localFilters.tier}
            onChange={value => handleTierChange(value || '')}
            options={[
              { value: '', label: 'All Tiers' },
              { value: 'STANDARD', label: 'Standard' },
              { value: 'PREMIUM', label: 'Premium' },
              { value: 'ENTERPRISE', label: 'Enterprise' },
            ]}
          />
        </div>
      </div>
    </Card>
  );
}

// ====================
// Optimized Customer Table Component
// ====================
function CustomerTableOptimized({
  customersResult,
}: {
  customersResult: ReturnType<typeof useInfiniteCustomers>;
}) {
  const router = useRouter();
  const deleteCustomer = useDeleteCustomer();
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage } = customersResult;

  const customers = useMemo(() => {
    return data?.pages.flatMap((page: any) => page.items || []).filter(Boolean) ?? [];
  }, [data]);

  const handleCustomerClick = useCallback(
    (id: string) => {
      router.push(`/customers/${id}`);
    },
    [router]
  );

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      const ok = window.confirm(`Delete customer "${name}"? This action cannot be undone.`);
      if (!ok) return;
      try {
        await deleteCustomer.mutateAsync(id);
        toast.success('Customer deleted');
      } catch (e) {
        toast.error('Failed to delete customer');
      }
    },
    [deleteCustomer]
  );

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load customers</h2>
        <p className="text-gray-600 mb-4">Please try again later</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Card>
    );
  }

  if (customers.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">👥</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No customers found</h2>
        <p className="text-gray-600 mb-4">Get started by adding your first customer</p>
        <Button variant="primary">Add Customer</Button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Industry</th>
              <th className="px-4 py-3 text-left">Tier</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer: any) => (
              <tr key={customer.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{customer.name}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      customer.status === 'ACTIVE'
                        ? 'success'
                        : customer.status === 'PROSPECT'
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {customer.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-600">{customer.email}</td>
                <td className="px-4 py-3 text-gray-600">{customer.industry || '-'}</td>
                <td className="px-4 py-3">
                  {customer.tier && <Badge variant="secondary">{customer.tier}</Badge>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCustomerClick(customer.id)}
                    >
                      View
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={deleteCustomer.isPending}
                      onClick={() => handleDelete(customer.id, customer.name)}
                    >
                      {deleteCustomer.isPending ? 'Deleting…' : 'Delete'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasNextPage && (
        <div className="p-4 border-t">
          <Button
            variant="secondary"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full"
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load More'}
          </Button>
        </div>
      )}
    </Card>
  );
}

// Main Customer List Component
export function CustomerList_new() {
  return (
    <div className="space-y-6">
      <CustomerListHeader />
      <CustomerFilters />
      <CustomerTable />
    </div>
  );
}

// ====================
// Optimized Customer List Component (Unified Architecture)
// ====================
export function CustomerListOptimized() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    tier: '',
  });

  const { customers, stats } = useUnifiedCustomerData();
  const deleteBulk = useDeleteCustomersBulk();

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: '',
      tier: '',
    });
  }, []);

  const customerCount = customers.data?.pages.flatMap((page: any) => page.items || []).length || 0;

  // Loading state
  if (customers.isLoading || stats.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="p-8">
            <div className="flex items-center justify-center">
              <LoadingSpinner size="lg" />
              <span className="ml-2">Loading customers...</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (customers.error || stats.error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
            <p className="text-gray-600">Manage your customer relationships</p>
          </div>
        </div>

        <Card className="p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load customers</h2>
          <p className="text-gray-600 mb-4">Please try again later</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CustomerListHeaderOptimized stats={stats} deleteBulk={deleteBulk} />
      <CustomerFiltersOptimized
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        customerCount={customerCount}
      />
      <CustomerTableOptimized customersResult={customers} />
    </div>
  );
}

// Export the main component as default for easier imports
export default CustomerList_new;
