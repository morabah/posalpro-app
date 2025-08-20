/**
 * PosalPro MVP2 - Customer List Component
 * Enhanced with React Query for caching and performance optimization
 * Component Traceability: US-4.1, US-4.2, H4, H6
 *
 * 🚀 PHASE 6 OPTIMIZATION: Virtual scrolling for memory reduction
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useApiClient } from '@/hooks/useApiClient';
import { Customer, useCustomer, useCustomers } from '@/hooks/useCustomers';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { VirtualList } from '@/hooks/useVirtualScrolling';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { debounce } from '@/lib/utils';
import {
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PencilIcon,
  TagIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

/**
 * Component Traceability Matrix:
 * - User Stories: US-4.1 (Customer Management), US-4.2 (Customer Relationships)
 * - Acceptance Criteria: AC-4.1.1, AC-4.1.2, AC-4.2.1, AC-4.2.2
 * - Hypotheses: H4 (Cross-Department Coordination), H6 (Requirement Extraction)
 * - Methods: fetchCustomers(), searchCustomers(), handleCustomerView()
 * - Test Cases: TC-H4-006, TC-H6-002
 */

// Skeleton component for loading state
const CustomerSkeleton = memo(() => (
  <div className="animate-pulse">
    <Card className="h-48">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="h-6 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
        <div className="flex justify-between items-center mt-6">
          <div className="h-8 bg-gray-200 rounded w-20"></div>
          <div className="flex space-x-2">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </Card>
  </div>
));

// ✅ CRITICAL: Virtual scrolling customer item component
const CustomerItem = memo(
  ({
    customer,
    onView,
    onEdit,
  }: {
    customer: Customer;
    onView: (customer: Customer) => void;
    onEdit: (customer: Customer) => void;
  }) => {
    const getTierBadgeColor = (tier: string) => {
      switch (tier.toLowerCase()) {
        case 'premium':
          return 'bg-purple-100 text-purple-800';
        case 'enterprise':
          return 'bg-blue-100 text-blue-800';
        case 'standard':
          return 'bg-gray-100 text-gray-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    const getStatusBadgeColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'active':
          return 'bg-green-100 text-green-800';
        case 'inactive':
          return 'bg-red-100 text-red-800';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    const formatRevenue = (revenue?: number) => {
      if (!revenue) return 'N/A';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(revenue);
    };

    return (
      <Card className="h-40 hover:shadow-md transition-shadow duration-200">
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <BuildingOfficeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                <p className="text-xs text-gray-500 truncate">{customer.email}</p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${getTierBadgeColor(customer.tier)}`}
            >
              {customer.tier}
            </span>
          </div>

          <div className="flex-1 space-y-1.5">
            {customer.industry && (
              <div className="flex items-center text-xs md:text-sm text-gray-600">
                <TagIcon className="h-4 w-4 mr-2" />
                <span>{customer.industry}</span>
              </div>
            )}
            {customer.revenue && (
              <div className="flex items-center text-xs md:text-sm text-gray-600">
                <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                <span>{formatRevenue(customer.revenue)}</span>
              </div>
            )}
            <div className="flex items-center text-xs md:text-sm text-gray-600">
              <UserGroupIcon className="h-4 w-4 mr-2" />
              <span
                className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${getStatusBadgeColor(customer.status)}`}
              >
                {customer.status}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center mt-3">
            <span className="text-[11px] text-gray-500">
              Updated {new Date(customer.updatedAt).toLocaleDateString()}
            </span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(customer)}
                className="h-9 w-9 p-0 md:h-11 md:w-11"
              >
                <EyeIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(customer)}
                className="h-9 w-9 p-0 md:h-11 md:w-11"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }
);

const CustomerList = memo(
  ({ viewMode = 'cards' as 'cards' | 'list' }: { viewMode?: 'cards' | 'list' }) => {
    const apiClient = useApiClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [tierFilter, setTierFilter] = useState<string>('');

    const { trackOptimized: analytics } = useOptimizedAnalytics();

    // Debounced search function
    const debouncedSearchFunction = useCallback((term: string) => {
      const debouncedFn = debounce((searchTerm: string) => {
        setDebouncedSearch(searchTerm);
        setCurrentPage(1); // Reset to first page when searching
      }, 500);
      debouncedFn(term);
    }, []);

    // Use React Query hook for data fetching with caching
    const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt' | 'tier'>('updatedAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');
    const [columnVisibility, setColumnVisibility] = useState({
      email: true,
      industry: true,
      tier: true,
      status: true,
      updated: true,
    });
    const [showColumnsMenu, setShowColumnsMenu] = useState(false);

    const { data, isLoading, error, refetch, isFetching, isError } = useCustomers({
      page: currentPage,
      limit: 50,
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      tier: tierFilter || undefined,
      sortBy,
      sortOrder,
    });

    // Track analytics when component loads
    const handleCustomerView = useCallback(
      (customer: Customer) => {
        analytics('customer_viewed', {
          customerId: customer.id,
          customerName: customer.name,
          customerTier: customer.tier,
          customerStatus: customer.status,
        });
      },
      [analytics]
    );

    // Handle search input change
    const handleSearchChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);
        debouncedSearchFunction(value);
      },
      [debouncedSearchFunction]
    );

    const handleStatusFilterChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      setStatusFilter(value);
      setCurrentPage(1);
    }, []);

    const handleTierFilterChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      setTierFilter(value);
      setCurrentPage(1);
    }, []);

    const handlePageChange = useCallback(
      (page: number) => {
        setCurrentPage(page);
        analytics('customer_list_page_changed', {
          page,
          searchTerm: debouncedSearch,
          statusFilter,
          tierFilter,
        });
      },
      [analytics, debouncedSearch, statusFilter, tierFilter]
    );

    const customers = useMemo(() => data?.customers || [], [data?.customers]);
    const totalPages = data?.pagination?.totalPages || 1;
    const totalCustomers = data?.pagination?.total || 0;
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [quickViewId, setQuickViewId] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const toggleSelect = useCallback((id: string) => {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }, []);
    const selectAll = useCallback(() => {
      const all = new Set<string>(customers.map(c => c.id));
      setSelectedIds(all);
    }, [customers]);
    const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

    // Persist view preferences (density and columns) in localStorage (UI-only)
    useEffect(() => {
      try {
        const raw = localStorage.getItem('customers.viewPrefs');
        if (raw) {
          const prefs = JSON.parse(raw) as {
            density?: 'compact' | 'comfortable';
            columns?: typeof columnVisibility;
          };
          if (prefs.density) setDensity(prefs.density);
          if (prefs.columns) setColumnVisibility(prefs.columns);
        }
      } catch {}
       
    }, []);

    useEffect(() => {
      try {
        const prefs = JSON.stringify({ density, columns: columnVisibility });
        localStorage.setItem('customers.viewPrefs', prefs);
      } catch {}
    }, [density, columnVisibility]);

    const rowPadding =
      density === 'compact' ? 'px-3 py-2 md:px-4 md:py-2' : 'px-4 py-3 md:px-6 md:py-3';
    const cellPadding =
      density === 'compact' ? 'px-3 py-2 md:px-4 md:py-2' : 'px-4 py-3 md:px-6 md:py-3';

    const statusAccentClass = (status: string) => {
      const s = status.toLowerCase();
      if (s === 'active') return 'border-l-2 border-green-500';
      if (s === 'inactive') return 'border-l-2 border-red-500';
      if (s === 'pending' || s === 'prospect') return 'border-l-2 border-yellow-500';
      return 'border-l-2 border-gray-300';
    };

    // Track cursor pagination capability
    useEffect(() => {
      if (data?.pagination) {
        setNextCursor(data.pagination.nextCursor || null);
        setHasMore(Boolean(data.pagination.hasMore));
      }
    }, [data?.pagination]);

    interface LoadMoreResponse {
      success: boolean;
      data: {
        customers: Customer[];
        pagination?: { hasMore?: boolean; nextCursor?: string | null };
      };
    }

    const loadMore = useCallback(async () => {
      if (!nextCursor) return;
      // Use the hook with cursor to fetch next page
      const params = {
        limit: 50,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        tier: tierFilter || undefined,
        sortBy: 'updatedAt' as const,
        sortOrder: 'desc' as const,
        cursor: nextCursor,
      };
      // Call the API directly for the additional page to append results
      try {
        const qp = new URLSearchParams();
        qp.set('limit', '50');
        if (params.search) qp.set('search', params.search);
        if (params.status) qp.set('status', params.status);
        if (params.tier) qp.set('tier', params.tier);
        qp.set('sortBy', params.sortBy);
        qp.set('sortOrder', params.sortOrder);
        qp.set('cursor', params.cursor);
        const res = await apiClient.get<LoadMoreResponse>(`customers?${qp.toString()}`);
        if (res?.success) {
          const newItems: Customer[] = res.data.customers ?? [];
          setNextCursor(res.data.pagination?.nextCursor ?? null);
          setHasMore(Boolean(res.data.pagination?.hasMore));
          // Append via local state mutation pattern supported by VirtualList input
          // We rebuild customers list locally for now by triggering a lightweight merge
          // Since customers come from React Query, we can set page temporarily to append visually
          setCurrentPage(p => p); // noop to trigger re-render
          (customers as Customer[]).push(...newItems);
        }
      } catch {
        // ignore load more failures
      }
    }, [nextCursor, debouncedSearch, statusFilter, tierFilter, customers, apiClient]);

    const getTierBadgeColor = (tier: string) => {
      switch (tier.toLowerCase()) {
        case 'premium':
          return 'bg-purple-100 text-purple-800';
        case 'enterprise':
          return 'bg-blue-100 text-blue-800';
        case 'standard':
          return 'bg-gray-100 text-gray-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    const getStatusBadgeColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'active':
          return 'bg-green-100 text-green-800';
        case 'inactive':
          return 'bg-red-100 text-red-800';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    const formatRevenue = (revenue?: number) => {
      if (!revenue) return 'N/A';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(revenue);
    };

    return (
      <div className="space-y-6">
        {/* Error State */}
        {isError && !data?.customers?.length && (
          <Card className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-2">Failed to load customers</p>
              <p className="text-gray-600 mb-4">{error?.message || 'Unknown error occurred'}</p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          </Card>
        )}
        {/* Search and Filter Section */}
        <div className="sticky top-20 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 rounded-lg border p-3">
          <div className="flex flex-col lg:flex-row gap-2 lg:items-center lg:justify-between">
            {/* Left controls */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Search customers"
              />
            </div>
            {/* Right controls */}
            <div className="flex gap-2 items-center">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                aria-label="Filter by status"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
              <select
                value={tierFilter}
                onChange={handleTierFilterChange}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                aria-label="Filter by tier"
              >
                <option value="">All Tiers</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
                <option value="standard">Standard</option>
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                aria-label="Sort by"
              >
                <option value="updatedAt">Recently updated</option>
                <option value="name">Name</option>
                <option value="createdAt">Created date</option>
                <option value="tier">Tier</option>
              </select>
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as typeof sortOrder)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                aria-label="Sort order"
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
              {/* Density */}
              <div
                className="inline-flex rounded-md border border-gray-300 overflow-hidden"
                role="group"
                aria-label="Row density"
              >
                <button
                  type="button"
                  className={`px-2 py-1 text-xs ${density === 'compact' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-700'}`}
                  aria-pressed={density === 'compact'}
                  onClick={() => setDensity('compact')}
                >
                  Compact
                </button>
                <button
                  type="button"
                  className={`px-2 py-1 text-xs border-l border-gray-300 ${density === 'comfortable' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-700'}`}
                  aria-pressed={density === 'comfortable'}
                  onClick={() => setDensity('comfortable')}
                >
                  Cozy
                </button>
              </div>
              {/* Columns menu */}
              <div className="relative">
                <button
                  type="button"
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                  aria-haspopup="menu"
                  aria-expanded={showColumnsMenu}
                  onClick={() => setShowColumnsMenu(v => !v)}
                >
                  Columns
                </button>
                {showColumnsMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border rounded-md shadow-md z-20 p-2 text-sm">
                    {(
                      ['email', 'industry', 'tier', 'status', 'updated'] as Array<
                        keyof typeof columnVisibility
                      >
                    ).map(key => (
                      <label key={key} className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={columnVisibility[key]}
                          onChange={() =>
                            setColumnVisibility(prev => ({ ...prev, [key]: !prev[key] }))
                          }
                        />
                        <span className="capitalize">{key}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <CustomerSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Customers Grid/List */}
        {!isLoading &&
          customers.length > 0 &&
          (viewMode === 'list' ? (
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 sticky top-20 z-10 border-b">
                    <tr>
                      {(() => {
                        const makeSortableTh = (
                          label: string,
                          key: 'name' | 'createdAt' | 'updatedAt' | 'tier'
                        ) => {
                          const isActive = sortBy === key;
                          const nextOrder: 'asc' | 'desc' =
                            isActive && sortOrder === 'asc' ? 'desc' : 'asc';
                          const indicator = isActive ? (sortOrder === 'asc' ? '▲' : '▼') : '';
                          return (
                            <th
                              key={key}
                              scope="col"
                              className="px-3 py-2 md:px-4 md:py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide select-none"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSortBy(key);
                                  setSortOrder(nextOrder);
                                }}
                                aria-sort={
                                  isActive
                                    ? sortOrder === 'asc'
                                      ? 'ascending'
                                      : 'descending'
                                    : 'none'
                                }
                                className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900"
                              >
                                <span>{label}</span>
                                <span className="text-[10px]">{indicator}</span>
                              </button>
                            </th>
                          );
                        };
                        return (
                          <>
                            <th className="px-3 py-2 md:px-4 md:py-2">
                              <input
                                type="checkbox"
                                aria-label="Select all"
                                checked={
                                  selectedIds.size > 0 && selectedIds.size === customers.length
                                }
                                onChange={e => (e.target.checked ? selectAll() : clearSelection())}
                                className="h-4 w-4"
                              />
                            </th>
                            {makeSortableTh('Name', 'name')}
                            {columnVisibility.email && (
                              <th
                                scope="col"
                                className="px-3 py-2 md:px-4 md:py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide"
                              >
                                Email
                              </th>
                            )}
                            {columnVisibility.industry && (
                              <th
                                scope="col"
                                className="px-3 py-2 md:px-4 md:py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide"
                              >
                                Industry
                              </th>
                            )}
                            {columnVisibility.tier && makeSortableTh('Tier', 'tier')}
                            {columnVisibility.status && (
                              <th
                                scope="col"
                                className="px-3 py-2 md:px-4 md:py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide"
                              >
                                Status
                              </th>
                            )}
                            {columnVisibility.updated && makeSortableTh('Updated', 'updatedAt')}
                            <th className="px-3 md:px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wide">
                              Actions
                            </th>
                          </>
                        );
                      })()}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customers.map((customer, idx) => (
                      <tr
                        key={customer.id}
                        className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${statusAccentClass(customer.status)} cursor-default focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleCustomerView(customer);
                            setQuickViewId(customer.id);
                          }
                        }}
                      >
                        <td className={cellPadding}>
                          <input
                            type="checkbox"
                            aria-label={`Select ${customer.name}`}
                            checked={selectedIds.has(customer.id)}
                            onChange={() => toggleSelect(customer.id)}
                            className="h-4 w-4"
                          />
                        </td>
                        <td
                          className={`${cellPadding} text-sm font-medium text-gray-900 whitespace-nowrap max-w-[220px] truncate`}
                        >
                          {customer.name}
                        </td>
                        {columnVisibility.email && (
                          <td
                            className={`${cellPadding} text-xs text-gray-600 whitespace-nowrap max-w-[260px] truncate`}
                          >
                            {customer.email || '—'}
                          </td>
                        )}
                        {columnVisibility.industry && (
                          <td
                            className={`${cellPadding} text-sm text-gray-700 whitespace-nowrap max-w-[160px] truncate`}
                          >
                            {customer.industry || '—'}
                          </td>
                        )}
                        {columnVisibility.tier && (
                          <td className={`${cellPadding} text-xs text-gray-700 whitespace-nowrap`}>
                            {customer.tier}
                          </td>
                        )}
                        {columnVisibility.status && (
                          <td className={`${cellPadding} whitespace-nowrap`}>
                            <span
                              className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${getStatusBadgeColor(customer.status)}`}
                            >
                              {customer.status}
                            </span>
                          </td>
                        )}
                        {columnVisibility.updated && (
                          <td className={`${cellPadding} text-xs text-gray-500 whitespace-nowrap`}>
                            {new Date(customer.updatedAt).toLocaleDateString()}
                          </td>
                        )}
                        <td
                          className={`${density === 'compact' ? 'px-3 py-1' : 'px-4 py-2'} md:px-4 text-right whitespace-nowrap`}
                        >
                          <div className="inline-flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                handleCustomerView(customer);
                                setQuickViewId(customer.id);
                              }}
                              className="p-1 min-h-[36px] min-w-[36px] md:min-h-[40px] md:min-w-[40px]"
                              aria-label={`View ${customer.name}`}
                              title={`View ${customer.name}`}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                analytics('customer_edit_clicked', {
                                  customerId: customer.id,
                                  customerName: customer.name,
                                });
                                setEditId(customer.id);
                              }}
                              className="p-1 min-h-[36px] min-w-[36px] md:min-h-[40px] md:min-w-[40px]"
                              aria-label={`Edit ${customer.name}`}
                              title={`Edit ${customer.name}`}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <VirtualList
              items={customers}
              itemHeight={160}
              containerHeight={600}
              renderItem={customer => (
                <CustomerItem
                  key={customer.id}
                  customer={customer}
                  onView={c => {
                    handleCustomerView(c);
                    setQuickViewId(c.id);
                  }}
                  onEdit={c => {
                    analytics('customer_edit_clicked', {
                      customerId: c.id,
                      customerName: c.name,
                    });
                    setEditId(c.id);
                  }}
                />
              )}
            />
          ))}

        {/* Empty State */}
        {!isLoading && customers.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <BuildingOfficeIcon className="h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {debouncedSearch || statusFilter || tierFilter
                  ? 'No customers found'
                  : 'No customers available'}
              </h3>
              <p className="text-gray-600 mb-4">
                {debouncedSearch || statusFilter || tierFilter
                  ? 'No customers match your current filters'
                  : 'There are no customers to display.'}
              </p>
              {(debouncedSearch || statusFilter || tierFilter) && (
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setDebouncedSearch('');
                    setStatusFilter('');
                    setTierFilter('');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center">
            <Button onClick={loadMore} variant="secondary">
              Load More
            </Button>
          </div>
        )}

        {/* Results Summary */}
        <div className="text-center text-sm text-gray-500">
          Showing {customers.length} of {totalCustomers} customers
          {isFetching && <span className="ml-2">(Refreshing...)</span>}
        </div>

        {/* Quick View Modal */}
        {quickViewId && <QuickViewModal id={quickViewId} onClose={() => setQuickViewId(null)} />}

        {editId && (
          <EditCustomerModal
            id={editId}
            onClose={() => setEditId(null)}
            onUpdated={async () => {
              setEditId(null);
              await queryClient.invalidateQueries({ queryKey: ['customers'] });
            }}
          />
        )}
      </div>
    );
  }
);

CustomerList.displayName = 'CustomerList';

export default CustomerList;

function QuickViewModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading, isError } = useCustomer(id);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Customer Details</h3>
          <button onClick={onClose} className="px-2 py-1 text-gray-600 hover:text-gray-900">
            Close
          </button>
        </div>
        <div className="p-4">
          {isLoading && <div className="text-sm text-gray-600">Loading...</div>}
          {isError && <div className="text-sm text-red-600">Failed to load customer</div>}
          {data && (
            <div className="space-y-2 text-sm">
              <div className="text-base font-medium text-gray-900">{data.name}</div>
              <div className="text-gray-700">{data.email || '—'}</div>
              <div className="text-gray-700">{data.industry || '—'}</div>
              <div className="text-gray-700">Tier: {data.tier}</div>
              <div className="text-gray-700">Status: {data.status}</div>
              {data.website && (
                <a
                  href={data.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {data.website}
                </a>
              )}
              {data.address && <div className="text-gray-600">{data.address}</div>}
            </div>
          )}
        </div>
        <div className="border-t p-3 text-right">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface CustomerUpdatePayload {
  name: string;
  email?: string;
  industry?: string;
  phone?: string;
  website?: string;
  address?: string;
  tier?: string;
  status?: string;
}

interface CustomerUpdateResponse {
  success: boolean;
  data: Customer;
  message: string;
}

function EditCustomerModal({
  id,
  onClose,
  onUpdated,
}: {
  id: string;
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
}) {
  const { data, isLoading, isError } = useCustomer(id);
  const apiClient = useApiClient();
  const errorHandlingService = ErrorHandlingService.getInstance();

  const EditSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    tier: z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE', 'VIP']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CHURNED']).optional(),
    industry: z.string().max(100).optional().or(z.literal('')),
    phone: z.string().max(20).optional().or(z.literal('')),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
    address: z.string().max(500).optional().or(z.literal('')),
  });

  type EditForm = z.infer<typeof EditSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditForm>({
    resolver: zodResolver(EditSchema),
    defaultValues: {
      name: data?.name ?? '',
      email: data?.email ?? '',
      tier: (data?.tier as EditForm['tier']) ?? 'STANDARD',
      status: (data?.status as EditForm['status']) ?? 'ACTIVE',
      industry: data?.industry ?? '',
      phone: data?.phone ?? '',
      website: data?.website ?? '',
      address: data?.address ?? '',
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        name: data.name ?? '',
        email: data.email ?? '',
        tier: (data.tier as EditForm['tier']) ?? 'STANDARD',
        status: (data.status as EditForm['status']) ?? 'ACTIVE',
        industry: data.industry ?? '',
        phone: data.phone ?? '',
        website: data.website ?? '',
        address: data.address ?? '',
      });
    }
  }, [data, reset]);

  const onSubmit = async (values: EditForm) => {
    try {
      const payload: CustomerUpdatePayload = {
        ...values,
        email: values.email || undefined,
        industry: values.industry || undefined,
        phone: values.phone || undefined,
        website: values.website || undefined,
        address: values.address || undefined,
      };

      const res = await apiClient.put<CustomerUpdateResponse>(`customers/${id}`, payload);

      if (!res.success) {
        throw new Error(res.message || 'Failed to update customer');
      }

      await onUpdated();
    } catch (error) {
      errorHandlingService.processError(
        error,
        'Failed to update customer',
        ErrorCodes.DATA.UPDATE_FAILED,
        { component: 'EditCustomerModal', operation: 'updateCustomer', customerId: id }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-xl mx-4">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Edit Customer</h3>
          <button onClick={onClose} className="px-2 py-1 text-gray-600 hover:text-gray-900">
            Close
          </button>
        </div>
        <div className="p-4">
          {isLoading && <div className="text-sm text-gray-600">Loading...</div>}
          {isError && <div className="text-sm text-red-600">Failed to load customer</div>}
          {!isLoading && !isError && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input {...register('name')} className="w-full px-3 py-2 border rounded-md" />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input {...register('email')} className="w-full px-3 py-2 border rounded-md" />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <input {...register('industry')} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                  <select {...register('tier')} className="w-full px-3 py-2 border rounded-md">
                    <option value="STANDARD">Standard</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="ENTERPRISE">Enterprise</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select {...register('status')} className="w-full px-3 py-2 border rounded-md">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="PROSPECT">Prospect</option>
                    <option value="CHURNED">Churned</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input {...register('phone')} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input {...register('website')} className="w-full px-3 py-2 border rounded-md" />
                  {errors.website && (
                    <p className="text-xs text-red-600 mt-1">{errors.website.message}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  rows={2}
                  {...register('address')}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-sm rounded-md border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
