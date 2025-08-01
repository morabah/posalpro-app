/**
 * PosalPro MVP2 - Customer List Component
 * Enhanced with React Query for caching and performance optimization
 * Component Traceability: US-4.1, US-4.2, H4, H6
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { Customer, useCustomers } from '@/hooks/useCustomers';
import { debounce } from '@/lib/utils';
import {
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PencilIcon,
  TagIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { memo, useCallback, useState } from 'react';

/**
 * Component Traceability Matrix:
 * - User Stories: US-4.1 (Customer Management), US-4.2 (Customer Relationships)
 * - Acceptance Criteria: AC-4.1.1, AC-4.1.2, AC-4.2.1, AC-4.2.2
 * - Hypotheses: H4 (Cross-Department Coordination), H6 (Requirement Extraction)
 * - Methods: fetchCustomers(), searchCustomers(), handleCustomerView()
 * - Test Cases: TC-H4-006, TC-H6-002
 */

const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.2'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.2', 'AC-4.2.1', 'AC-4.2.2'],
  methods: ['fetchCustomers()', 'searchCustomers()', 'handleCustomerView()'],
  hypotheses: ['H4', 'H6'],
  testCases: ['TC-H4-006', 'TC-H6-002'],
};

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

const CustomerList = memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('');

  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Debounced search function
  const debouncedSearchFunction = useCallback(
    debounce((term: string) => {
      setDebouncedSearch(term);
      setCurrentPage(1); // Reset to first page when searching
    }, 500),
    []
  );

  // Use React Query hook for data fetching with caching
  const { data, isLoading, error, refetch, isFetching, isError } = useCustomers({
    page: currentPage,
    limit: 12,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    tier: tierFilter || undefined,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  // Track analytics when component loads
  const handleAnalyticsTrack = useCallback((eventName: string, metadata: any = {}) => {
    analytics(eventName, {
      component: 'CustomerList',
      userStories: COMPONENT_MAPPING.userStories,
      hypotheses: COMPONENT_MAPPING.hypotheses,
      ...metadata,
    });
  }, []); // ✅ PERFORMANCE FIX: Remove unstable analytics dependency

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value);
      debouncedSearchFunction(value);

      if (value.length > 0) {
        handleAnalyticsTrack('customer_search_initiated', { searchTerm: value });
      }
    },
    [debouncedSearchFunction, handleAnalyticsTrack]
  );

  const handleView = useCallback(
    (customerId: string) => {
      handleAnalyticsTrack('customer_view_clicked', { customerId });
      window.location.href = `/customers/${customerId}`;
    },
    [handleAnalyticsTrack]
  );

  const handleEdit = useCallback(
    (customerId: string) => {
      handleAnalyticsTrack('customer_edit_clicked', { customerId });
      window.location.href = `/customers/${customerId}/edit`;
    },
    [handleAnalyticsTrack]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      handleAnalyticsTrack('customer_pagination_clicked', { page });
    },
    [handleAnalyticsTrack]
  );

  const handleStatusFilterChange = useCallback(
    (status: string) => {
      setStatusFilter(status);
      setCurrentPage(1);
      handleAnalyticsTrack('customer_status_filter_changed', { status });
    },
    [handleAnalyticsTrack]
  );

  const handleTierFilterChange = useCallback(
    (tier: string) => {
      setTierFilter(tier);
      setCurrentPage(1);
      handleAnalyticsTrack('customer_tier_filter_changed', { tier });
    },
    [handleAnalyticsTrack]
  );

  // Handle error state
  if (isError && !data?.customers?.length) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load customers</p>
          <p className="text-gray-600 mb-4">{error?.message || 'Unknown error occurred'}</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const customers = data?.customers || [];
  const pagination = data?.pagination;

  const getTierBadgeColor = (tier: string) => {
    const colors = {
      VIP: 'bg-purple-100 text-purple-800',
      ENTERPRISE: 'bg-blue-100 text-blue-800',
      PREMIUM: 'bg-green-100 text-green-800',
      STANDARD: 'bg-gray-100 text-gray-800',
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      PROSPECT: 'bg-blue-100 text-blue-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      CHURNED: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
      {/* Search and Filter Section */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 max-w-md">
            <label htmlFor="search" className="sr-only">
              Search customers
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              {isFetching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="sr-only">
                Filter by status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={e => handleStatusFilterChange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PROSPECT">Prospect</option>
                <option value="INACTIVE">Inactive</option>
                <option value="CHURNED">Churned</option>
              </select>
            </div>

            {/* Tier Filter */}
            <div>
              <label htmlFor="tier-filter" className="sr-only">
                Filter by tier
              </label>
              <select
                id="tier-filter"
                value={tierFilter}
                onChange={e => handleTierFilterChange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="">All Tiers</option>
                <option value="VIP">VIP</option>
                <option value="ENTERPRISE">Enterprise</option>
                <option value="PREMIUM">Premium</option>
                <option value="STANDARD">Standard</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {pagination && (
              <span>
                {pagination.total} total customers
                {(debouncedSearch || statusFilter || tierFilter) && ` (filtered)`}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <CustomerSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Customers Grid */}
      {!isLoading && customers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {customers.map((customer: Customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <BuildingOfficeIcon className="h-10 w-10 text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {customer.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {customer.email || 'No email'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierBadgeColor(customer.tier)}`}
                    >
                      {customer.tier}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(customer.status)}`}
                    >
                      {customer.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {customer.industry && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Industry:</span>
                      <span className="text-gray-900">{customer.industry}</span>
                    </div>
                  )}

                  {customer.revenue && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center">
                        <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                        Revenue:
                      </span>
                      <span className="font-semibold text-gray-900">
                        {formatRevenue(customer.revenue)}
                      </span>
                    </div>
                  )}

                  {(customer.proposalsCount !== undefined ||
                    customer.contactsCount !== undefined) && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center">
                        <UserGroupIcon className="w-4 h-4 mr-1" />
                        Activity:
                      </span>
                      <span className="text-gray-700">Activity tracked</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {customer.tags && customer.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700"
                        >
                          <TagIcon className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {customer.tags.length > 2 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700">
                          +{customer.tags.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => handleView(customer.id)}
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    onClick={() => handleEdit(customer.id)}
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <PencilIcon className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

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

      {/* Pagination */}
      {pagination && pagination.totalPages && pagination.totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
              customers
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>

              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <Button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= (pagination.totalPages || 1)}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
});

CustomerList.displayName = 'CustomerList';

export default CustomerList;
