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
import { Customer, useCustomers } from '@/hooks/useCustomers';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { VirtualList } from '@/hooks/useVirtualScrolling';
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
      <Card className="h-48 hover:shadow-lg transition-shadow duration-200">
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <BuildingOfficeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                <p className="text-sm text-gray-500">{customer.email}</p>
              </div>
            </div>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getTierBadgeColor(customer.tier)}`}
            >
              {customer.tier}
            </span>
          </div>

          <div className="flex-1 space-y-2">
            {customer.industry && (
              <div className="flex items-center text-sm text-gray-600">
                <TagIcon className="h-4 w-4 mr-2" />
                <span>{customer.industry}</span>
              </div>
            )}
            {customer.revenue && (
              <div className="flex items-center text-sm text-gray-600">
                <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                <span>{formatRevenue(customer.revenue)}</span>
              </div>
            )}
            <div className="flex items-center text-sm text-gray-600">
              <UserGroupIcon className="h-4 w-4 mr-2" />
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(customer.status)}`}
              >
                {customer.status}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-gray-500">
              Updated {new Date(customer.updatedAt).toLocaleDateString()}
            </span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(customer)}
                className="h-8 w-8 p-0"
              >
                <EyeIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(customer)}
                className="h-8 w-8 p-0"
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

const CustomerList = memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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
  const totalPages = data?.pagination?.totalPages || 1;
  const totalCustomers = data?.pagination?.total || 0;

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
      {/* Search and Filter Section */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={tierFilter}
              onChange={handleTierFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Tiers</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
              <option value="standard">Standard</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <CustomerSkeleton key={index} />
          ))}
        </div>
      )}

      {/* Customers Grid */}
      {!isLoading && customers.length > 0 && (
        <VirtualList
          items={customers}
          itemHeight={192} // Adjust based on the height of CustomerItem
          containerHeight={600} // Fixed container height for virtual scrolling
          renderItem={(customer, index) => (
            <CustomerItem
              key={customer.id}
              customer={customer}
              onView={handleCustomerView}
              onEdit={() => {
                // Handle edit customer
                analytics('customer_edit_clicked', {
                  customerId: customer.id,
                  customerName: customer.name,
                });
              }}
            />
          )}
        />
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
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-center text-sm text-gray-500">
        Showing {customers.length} of {totalCustomers} customers
        {isFetching && <span className="ml-2">(Refreshing...)</span>}
      </div>
    </div>
  );
});

CustomerList.displayName = 'CustomerList';

export default CustomerList;
