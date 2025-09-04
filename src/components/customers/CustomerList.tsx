'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { Button } from '@/components/ui/forms/Button';
import { useDeleteCustomersBulk, useInfiniteCustomers } from '@/features/customers/hooks';
import { analytics } from '@/lib/analytics';
import { logError } from '@/lib/logger';
import { toast } from 'sonner';
import {
  customerSelectors,
  CustomerSortBy,
  CustomerStatus,
  CustomerTier,
  useCustomerQueryParams,
  useCustomerSelection,
  useCustomerStore,
} from '@/lib/store/customerStore';
import { Customer } from '@/services/customerService';
import { useRouter } from 'next/navigation';
import React, { useCallback, useMemo } from 'react';

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
            logError('Bulk delete failed', error instanceof Error ? error : new Error(String(error)), {
              component: 'CustomerList',
              operation: 'bulkDelete',
              selectedIdsCount: selectedIds.length,
            });
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

// Export the main component as default for easier imports
export default CustomerList_new;
