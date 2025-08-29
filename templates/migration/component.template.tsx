// Component Template for Migration from Bridge Pattern
// Replace __ENTITY__ with actual entity name (e.g., Customer, Product, Proposal)
// User Story: __USER_STORY__ (e.g., US-1.1)
// Hypothesis: __HYPOTHESIS__ (e.g., H1)
//
// ✅ FOLLOWS: MIGRATION_LESSONS.md - Component patterns with proper error handling
// ✅ FOLLOWS: CORE_REQUIREMENTS.md - Accessibility and performance standards
// ✅ ALIGNS: Design system usage and analytics integration
// ✅ IMPLEMENTS: Modern React patterns with proper TypeScript typing

'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDelete__ENTITY__sBulk, useInfinite__ENTITY__s } from '@/hooks/use__RESOURCE__s';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logInfo } from '@/lib/logger';
import { __RESOURCE__Selectors, use__ENTITY__Store } from '@/lib/store/__RESOURCE__Store';
import { AlertCircle, Plus, RefreshCw, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo } from 'react';
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
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  const handleCreateClick = () => {
    logInfo('Create __ENTITY__ button clicked', {
      component: '__ENTITY__ListHeader',
      operation: 'handleCreateClick',
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    analytics('__RESOURCE___create_button_clicked', {
      component: '__ENTITY__ListHeader',
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    onCreate();
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">__ENTITY__s</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your __RESOURCE__ efficiently</p>
      </div>
      <Button
        onClick={handleCreateClick}
        className="w-full sm:w-auto"
        aria-label={`Create new __RESOURCE__`}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add __ENTITY__
      </Button>
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
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  const handleSearchChange = (value: string) => {
    onFiltersChange({ search: value });
    if (value.length >= 2) {
      analytics('__RESOURCE___search_performed', {
        component: '__ENTITY__Filters',
        searchTerm: value,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });
    }
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ status: value });
    analytics('__RESOURCE___filter_applied', {
      component: '__ENTITY__Filters',
      filterType: 'status',
      filterValue: value,
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });
  };

  const handleClearFilters = () => {
    onClearFilters();
    analytics('__RESOURCE___filters_cleared', {
      component: '__ENTITY__Filters',
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <label htmlFor="search-input" className="sr-only">
          Search __RESOURCE__
        </label>
        <Input
          id="search-input"
          type="text"
          placeholder="Search __RESOURCE__..."
          value={filters.search || ''}
          onChange={e => handleSearchChange(e.target.value)}
          className="w-full"
          aria-describedby="search-help"
        />
        <p id="search-help" className="sr-only">
          Search by name or other __RESOURCE__ attributes
        </p>
      </div>

      <div className="sm:w-48">
        <label htmlFor="status-select" className="sr-only">
          Filter by status
        </label>
        <Select value={filters.status || ''} onValueChange={handleStatusChange}>
          <SelectTrigger id="status-select" className="w-full">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        onClick={handleClearFilters}
        className="whitespace-nowrap"
        aria-label="Clear all filters"
      >
        Clear Filters
      </Button>
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
  __RESOURCE__s: any[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = __RESOURCE__s.map(c => c.id);
      onSelectionChange(allIds);
      analytics('__RESOURCE___select_all', {
        component: '__ENTITY__Table',
        selectedCount: allIds.length,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });
    } else {
      onSelectionChange([]);
      analytics('__RESOURCE___deselect_all', {
        component: '__ENTITY__Table',
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const handleEdit = (id: string) => {
    analytics('__RESOURCE___edit_clicked', {
      component: '__ENTITY__Table',
      __RESOURCE__Id: id,
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });
    onEdit(id);
  };

  const handleDelete = (id: string) => {
    analytics('__RESOURCE___delete_clicked', {
      component: '__ENTITY__Table',
      __RESOURCE__Id: id,
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });
    onDelete(id);
  };

  const allSelected = __RESOURCE__s.length > 0 && selectedIds.length === __RESOURCE__s.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < __RESOURCE__s.length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all __RESOURCE__"
                />
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {__RESOURCE__s.map(__RESOURCE__ => (
              <tr key={__RESOURCE__.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Checkbox
                    checked={selectedIds.includes(__RESOURCE__.id)}
                    onCheckedChange={checked =>
                      handleSelectItem(__RESOURCE__.id, checked as boolean)
                    }
                    aria-label={`Select __RESOURCE__ ${__RESOURCE__.name || __RESOURCE__.id}`}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {__RESOURCE__.name || `Unnamed ${__RESOURCE__.id}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      __RESOURCE__.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : __RESOURCE__.status === 'INACTIVE'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {__RESOURCE__.status || 'UNKNOWN'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(__RESOURCE__.id)}
                    className="text-blue-600 hover:text-blue-900 mr-2"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(__RESOURCE__.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  const handleLoadMore = () => {
    analytics('__RESOURCE___load_more_clicked', {
      component: 'LoadMoreButton',
      hasNextPage,
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });
    fetchNextPage();
  };

  if (!hasNextPage) return null;

  return (
    <div className="flex justify-center mt-6">
      <Button
        onClick={handleLoadMore}
        disabled={isFetchingNextPage}
        variant="outline"
        className="min-w-32"
        aria-label="Load more __RESOURCE__"
      >
        {isFetchingNextPage ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          'Load More'
        )}
      </Button>
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
  const { trackOptimized: analytics } = useOptimizedAnalytics();

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
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfinite__ENTITY__s({
    search: filters.search,
    limit,
    sortBy: sorting.sortBy,
    sortOrder: sorting.sortOrder,
  });

  // Mutation hooks
  const deleteBulkMutation = useDelete__ENTITY__sBulk();

  // Flatten all pages data (infinite scroll)
  const __RESOURCE__s = useMemo(() => data?.pages.flatMap(page => page.items) || [], [data]);

  // Track component mount
  useEffect(() => {
    logInfo('__ENTITY__List component mounted', {
      component: '__ENTITY__List_new',
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    analytics('__RESOURCE___list_viewed', {
      component: '__ENTITY__List_new',
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });
  }, [analytics]);

  // Event handlers
  const handleCreate = () => {
    logInfo('Create __ENTITY__ initiated', {
      component: '__ENTITY__List_new',
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });
    // TODO: Implement create dialog
  };

  const handleEdit = (id: string) => {
    setSelectedIds([id]);
    logInfo('Edit __ENTITY__ initiated', {
      component: '__ENTITY__List_new',
      __RESOURCE__Id: id,
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });
    // TODO: Implement edit dialog
  };

  const handleDelete = (id: string) => {
    setSelectedIds([id]);
    logInfo('Delete __ENTITY__ initiated', {
      component: '__ENTITY__List_new',
      __RESOURCE__Id: id,
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });
    // TODO: Implement delete dialog
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    logInfo('Bulk delete __ENTITY__ initiated', {
      component: '__ENTITY__List_new',
      selectedCount,
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    try {
      await deleteBulkMutation.mutateAsync(selectedIds);
      setSelectedIds([]);
      analytics('__RESOURCE___bulk_deleted', {
        component: '__ENTITY__List_new',
        deletedCount: selectedIds.length,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });
    } catch (error) {
      logError('Bulk delete __ENTITY__ failed', {
        component: '__ENTITY__List_new',
        error: error instanceof Error ? error.message : 'Unknown error',
        selectedCount,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });
    }
  };

  const handleRefresh = () => {
    logInfo('Refresh __RESOURCE__ list', {
      component: '__ENTITY__List_new',
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });
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

  // Loading state
  if (isLoading && !__RESOURCE__s.length) {
    return (
      <div
        className="flex items-center justify-center p-8"
        role="status"
        aria-label="Loading __RESOURCE__"
      >
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span className="text-gray-600">Loading __RESOURCE__...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center" role="alert">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading __RESOURCE__</h3>
        <p className="text-red-600 mb-4">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <Button onClick={handleRefresh} variant="outline" disabled={isRefetching}>
          {isRefetching ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Retrying...
            </>
          ) : (
            'Retry'
          )}
        </Button>
      </div>
    );
  }

  // Empty state
  if (!isLoading && !__RESOURCE__s.length) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No __RESOURCE__ found</h3>
        <p className="text-gray-600 mb-4">Get started by creating your first __RESOURCE__.</p>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create First __ENTITY__
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`space-y-6 ${className}`}
      style={{ maxHeight }}
      role="main"
      aria-label="__ENTITY__ management"
    >
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefetching}
              aria-label="Refresh __RESOURCE__ list"
            >
              {isRefetching ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>

            {selectedCount > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={deleteBulkMutation.isPending}
                aria-label={`Delete ${selectedCount} selected __RESOURCE__`}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedCount})
              </Button>
            )}
          </div>

          <Button onClick={handleCreate} aria-label="Create new __RESOURCE__">
            <Plus className="w-4 h-4 mr-2" />
            Add __ENTITY__
          </Button>
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
