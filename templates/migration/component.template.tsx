// Component Template for Migration from Bridge Pattern
// Replace __ENTITY__ with actual entity name (e.g., Customer, Product, Proposal)

'use client';

import { useDelete__ENTITY__sBulk, useInfinite__ENTITY__s } from '@/hooks/use__RESOURCE__s_new';
import { __RESOURCE__Selectors, use__ENTITY__Store } from '@/lib/store/__RESOURCE__Store';
import { __ENTITY__ } from '@/services/__RESOURCE__Service';
import React from 'react';
import { shallow } from 'zustand/shallow';

// ====================
// Types
// ====================

interface __ENTITY__List_newProps {
  className?: string;
  showHeader?: boolean;
  showFilters?: boolean;
  showActions?: boolean;
  maxHeight?: string;
}

// ====================
// Sub-Components
// ====================

function __ENTITY__ListHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">__ENTITY__s</h2>
        <p className="text-sm text-gray-600">Manage your __RESOURCE__</p>
      </div>
      <button
        onClick={onCreate}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Add __ENTITY__
      </button>
    </div>
  );
}

function __ENTITY__Filters({
  filters,
  onFiltersChange,
  onClearFilters,
}: {
  filters: any;
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="flex items-center space-x-4 mb-4">
      <input
        type="text"
        placeholder="Search __RESOURCE__..."
        value={filters.search || ''}
        onChange={e => onFiltersChange({ search: e.target.value })}
        className="px-3 py-1 border rounded"
      />
      <select
        value={filters.status || ''}
        onChange={e => onFiltersChange({ status: e.target.value })}
        className="px-3 py-1 border rounded"
      >
        <option value="">All Status</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
        <option value="PENDING">Pending</option>
      </select>
      <button onClick={onClearFilters} className="px-3 py-1 text-gray-600 hover:text-gray-800">
        Clear Filters
      </button>
    </div>
  );
}

function __ENTITY__Table({
  __RESOURCE__s,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
}: {
  __RESOURCE__s: __ENTITY__[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                type="checkbox"
                checked={selectedIds.length === __RESOURCE__s.length && __RESOURCE__s.length > 0}
                onChange={e => {
                  if (e.target.checked) {
                    onSelectionChange(__RESOURCE__s.map(c => c.id));
                  } else {
                    onSelectionChange([]);
                  }
                }}
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {__RESOURCE__s.map(__RESOURCE__ => (
            <tr key={__RESOURCE__.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(__RESOURCE__.id)}
                  onChange={e => {
                    if (e.target.checked) {
                      onSelectionChange([...selectedIds, __RESOURCE__.id]);
                    } else {
                      onSelectionChange(selectedIds.filter(id => id !== __RESOURCE__.id));
                    }
                  }}
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {__RESOURCE__.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    __RESOURCE__.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : __RESOURCE__.status === 'INACTIVE'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {__RESOURCE__.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => onEdit(__RESOURCE__.id)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(__RESOURCE__.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoadMoreButton({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}) {
  if (!hasNextPage) return null;

  return (
    <div className="flex justify-center mt-4">
      <button
        onClick={fetchNextPage}
        disabled={isFetchingNextPage}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
      >
        {isFetchingNextPage ? 'Loading...' : 'Load More'}
      </button>
    </div>
  );
}

// ====================
// Main Component
// ====================

export function __ENTITY__List_new({
  className = '',
  showHeader = true,
  showFilters = true,
  showActions = true,
  maxHeight = 'auto',
}: __ENTITY__List_newProps) {
  // Store state with proper subscriptions (shallow comparison)
  const filters = use__ENTITY__Store(__RESOURCE__Selectors.filters, shallow);
  const sorting = use__ENTITY__Store(__RESOURCE__Selectors.sorting, shallow);
  const view = use__ENTITY__Store(__RESOURCE__Selectors.view, shallow);
  const limit = use__ENTITY__Store(__RESOURCE__Selectors.limit);
  const selection = use__ENTITY__Store(__RESOURCE__Selectors.selection, shallow);

  const selectedIds = selection.selectedIds;
  const selectedCount = selectedIds.length;

  // Store actions
  const setFilters = use__ENTITY__Store(s => s.setFilters);
  const setSorting = use__ENTITY__Store(s => s.setSorting);
  const setSelectedIds = use__ENTITY__Store(s => s.setSelectedIds);

  // Query hooks
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useInfinite__ENTITY__s({
      search: filters.search,
      limit,
      sortBy: sorting.sortBy,
      sortOrder: sorting.sortOrder,
    });

  // Mutation hooks
  const deleteBulkMutation = useDelete__ENTITY__sBulk();

  // Flatten all pages data (infinite scroll)
  const __RESOURCE__s = data?.pages.flatMap(page => page.items) || [];

  // Event handlers
  const handleCreate = () => {
    // TODO: Implement create dialog
    console.log('Create __ENTITY__');
  };

  const handleEdit = (id: string) => {
    setSelectedIds([id]);
    // TODO: Implement edit dialog
    console.log('Edit __ENTITY__', id);
  };

  const handleDelete = (id: string) => {
    setSelectedIds([id]);
    // TODO: Implement delete dialog
    console.log('Delete __ENTITY__', id);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      await deleteBulkMutation.mutateAsync(selectedIds);
      setSelectedIds([]);
    } catch (error) {
      console.error('Failed to delete __RESOURCE__:', error);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({ search: '', status: '' });
  };

  const handleSelectionChange = (ids: string[]) => {
    setSelectedIds(ids);
  };

  // Loading and error states
  if (isLoading && !__RESOURCE__s.length) {
    return <div className="p-4">Loading __RESOURCE__...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">Error loading __RESOURCE__: {error.message}</p>
        <button onClick={handleRefresh} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">
          Retry
        </button>
      </div>
    );
  }

  if (!isLoading && !__RESOURCE__s.length) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">No __RESOURCE__ found</p>
        <button onClick={handleCreate} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">
          Create First __ENTITY__
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} style={{ maxHeight }}>
      {/* Header */}
      {showHeader && <__ENTITY__ListHeader onCreate={handleCreate} />}

      {/* Filters */}
      {showFilters && (
        <__ENTITY__Filters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button onClick={handleRefresh} className="px-3 py-1 text-gray-600 hover:text-gray-800">
              Refresh
            </button>

            {selectedCount > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-red-600 hover:text-red-800"
              >
                Delete Selected ({selectedCount})
              </button>
            )}
          </div>

          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add __ENTITY__
          </button>
        </div>
      )}

      {/* Table */}
      <__ENTITY__Table
        __RESOURCE__s={__RESOURCE__s}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Load More */}
      <LoadMoreButton
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />

      {/* Dialogs would go here - Create, Edit, Delete */}
      {/* For now, we'll just show basic functionality */}
    </div>
  );
}

export default __ENTITY__List_new;
