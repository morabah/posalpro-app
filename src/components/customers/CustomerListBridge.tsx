/**
 * PosalPro MVP2 - Customer List Component (Bridge Pattern)
 * Enhanced with Bridge Pattern for centralized state management and API operations
 * Component Traceability: US-2.3, US-4.1, H4
 *
 * 🚀 PHASE 1 MIGRATION: Bridge Pattern Implementation
 */

'use client';

import { useCustomerManagementBridge } from '@/components/bridges/CustomerManagementBridge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { Customer } from '@/lib/bridges/CustomerApiBridge';
// Removed lodash debounce import - implementing custom debounce
import {
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PencilIcon,
  TagIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { memo, useCallback, useEffect, useState } from 'react';

interface CustomerListProps {
  viewMode?: 'cards' | 'list';
}

interface SearchFilters {
  searchTerm: string;
  statusFilter: string;
  tierFilter: string;
  sortBy: 'name' | 'createdAt' | 'updatedAt' | 'tier';
  sortOrder: 'asc' | 'desc';
}

interface CustomerItemProps {
  customer: Customer & {
    email?: string;
    tier?: string;
    value?: number;
    contactCount?: number;
  };
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
}

/**
 * Component Traceability Matrix:
 * - User Stories: US-2.3 (Customer Profile Management), US-4.1 (Customer Management)
 * - Acceptance Criteria: AC-2.3.1, AC-4.1.1, AC-4.1.2
 * - Hypotheses: H4 (Bridge pattern improves data consistency and performance)
 * - Methods: bridge.fetchCustomers(), bridge.createCustomer(), bridge.updateCustomer()
 * - Test Cases: TC-H4-001, TC-H4-002
 */

// Skeleton component for loading state
const CustomerSkeleton = memo(() => (
  <div className="animate-pulse" role="status" aria-label="Loading customer data">
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

// Virtual scrolling customer item component
const CustomerItem = memo(({ customer, onView, onEdit }: CustomerItemProps) => {
  const getTierBadgeColor = (tier?: string) => {
    switch (tier?.toLowerCase()) {
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

  const getStatusBadgeColor = (status?: string) => {
    switch (status?.toLowerCase()) {
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

  return (
    <Card
      className="h-48 hover:shadow-md transition-shadow"
      role="article"
      aria-labelledby={`customer-${customer.id}-name`}
      data-testid={`customer-card-${customer.id}`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center"
              aria-hidden="true"
            >
              <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3
                id={`customer-${customer.id}-name`}
                className="font-semibold text-gray-900 truncate max-w-32"
              >
                {customer.name || 'Unknown Customer'}
              </h3>
              <p className="text-sm text-gray-500">{customer.email || 'No email'}</p>
            </div>
          </div>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(customer.status)}`}
            aria-label={`Status: ${customer.status}`}
          >
            {customer.status || 'Unknown'}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <TagIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getTierBadgeColor(customer.tier)}`}
              aria-label={`Tier: ${customer.tier}`}
            >
              {customer.tier || 'Standard'}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <CurrencyDollarIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            <span>Value: ${customer.value?.toLocaleString() || '0'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <UserGroupIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            <span>{customer.contactCount || 0} contacts</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Updated:{' '}
            {customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString() : 'Unknown'}
          </span>
          <div className="flex space-x-2" role="group" aria-label="Customer actions">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(customer)}
              className="h-8 w-8 p-0"
              aria-label={`View details for ${customer.name}`}
              data-testid={`view-customer-${customer.id}`}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(customer)}
              className="h-8 w-8 p-0"
              aria-label={`Edit ${customer.name}`}
              data-testid={`edit-customer-${customer.id}`}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
});

// ✅ BRIDGE COMPLIANCE: Add form handling component
const CustomerSearchForm = memo(
  ({
    filters,
    onFiltersChange,
  }: {
    filters: SearchFilters;
    onFiltersChange: (filters: Partial<SearchFilters>) => void;
  }) => {
    const handleSearchChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        onFiltersChange({ searchTerm: event.target.value });
      },
      [onFiltersChange]
    );

    const handleStatusFilterChange = useCallback(
      (event: React.ChangeEvent<HTMLSelectElement>) => {
        onFiltersChange({ statusFilter: event.target.value });
      },
      [onFiltersChange]
    );

    const handleTierFilterChange = useCallback(
      (event: React.ChangeEvent<HTMLSelectElement>) => {
        onFiltersChange({ tierFilter: event.target.value });
      },
      [onFiltersChange]
    );

    const handleSortChange = useCallback(
      (event: React.ChangeEvent<HTMLSelectElement>) => {
        onFiltersChange({ sortBy: event.target.value as SearchFilters['sortBy'] });
      },
      [onFiltersChange]
    );

    const handleSortOrderChange = useCallback(
      (event: React.ChangeEvent<HTMLSelectElement>) => {
        onFiltersChange({ sortOrder: event.target.value as 'asc' | 'desc' });
      },
      [onFiltersChange]
    );

    const clearFilters = useCallback(() => {
      onFiltersChange({
        searchTerm: '',
        statusFilter: '',
        tierFilter: '',
      });
    }, [onFiltersChange]);

    return (
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        role="search"
        aria-label="Customer search and filters"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <label htmlFor="customer-search" className="sr-only">
              Search customers
            </label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              id="customer-search"
              type="text"
              placeholder="Search customers by name, email, or company..."
              value={filters.searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              aria-describedby="search-help"
            />
            {filters.searchTerm && (
              <button
                onClick={() => onFiltersChange({ searchTerm: '' })}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative">
            <label htmlFor="status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="status-filter"
              value={filters.statusFilter}
              onChange={handleStatusFilterChange}
              className="appearance-none w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Tier Filter */}
          <div className="relative">
            <label htmlFor="tier-filter" className="sr-only">
              Filter by tier
            </label>
            <select
              id="tier-filter"
              value={filters.tierFilter}
              onChange={handleTierFilterChange}
              className="appearance-none w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
            >
              <option value="">All Tiers</option>
              <option value="STANDARD">Standard</option>
              <option value="PREMIUM">Premium</option>
              <option value="ENTERPRISE">Enterprise</option>
              <option value="VIP">VIP</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex gap-2">
            <div className="relative">
              <label htmlFor="sort-by" className="sr-only">
                Sort by
              </label>
              <select
                id="sort-by"
                value={filters.sortBy}
                onChange={handleSortChange}
                className="appearance-none px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
              >
                <option value="updatedAt">Updated</option>
                <option value="name">Name</option>
                <option value="createdAt">Created</option>
                <option value="tier">Tier</option>
              </select>
            </div>
            <div className="relative">
              <label htmlFor="sort-order" className="sr-only">
                Sort order
              </label>
              <select
                id="sort-order"
                value={filters.sortOrder}
                onChange={handleSortOrderChange}
                className="appearance-none px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(filters.searchTerm || filters.statusFilter || filters.tierFilter) && (
            <button
              onClick={clearFilters}
              className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2"
              aria-label="Clear all filters"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear Filters
            </button>
          )}
        </div>

        {/* Active Filters Display */}
        {(filters.searchTerm || filters.statusFilter || filters.tierFilter) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.searchTerm && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                Search: "{filters.searchTerm}"
                <button
                  onClick={() => onFiltersChange({ searchTerm: '' })}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  aria-label="Remove search filter"
                >
                  ×
                </button>
              </span>
            )}
            {filters.statusFilter && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                Status: {filters.statusFilter}
                <button
                  onClick={() => onFiltersChange({ statusFilter: '' })}
                  className="ml-2 text-green-600 hover:text-green-800"
                  aria-label="Remove status filter"
                >
                  ×
                </button>
              </span>
            )}
            {filters.tierFilter && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                Tier: {filters.tierFilter}
                <button
                  onClick={() => onFiltersChange({ tierFilter: '' })}
                  className="ml-2 text-purple-600 hover:text-purple-800"
                  aria-label="Remove tier filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

const CustomerListBridge = memo(({ viewMode = 'cards' as 'cards' | 'list' }: CustomerListProps) => {
  // ✅ BRIDGE PATTERN: Use CustomerManagementBridge instead of direct API calls
  const bridge = useCustomerManagementBridge();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // ✅ BRIDGE COMPLIANCE: Use proper form state management
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    statusFilter: '',
    tierFilter: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Custom debounce implementation for search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(filters.searchTerm);
    }, 300); // 300ms debounce per CORE_REQUIREMENTS

    return () => clearTimeout(timeoutId);
  }, [filters.searchTerm]);

  // ✅ BRIDGE PATTERN: Use bridge state instead of local state
  const { state } = bridge;
  const { entities: customers = [], loading = false, error = null } = state || {};

  // Load customers on mount and when filters change
  useEffect(() => {
    // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
    const timeoutId = setTimeout(async () => {
      try {
        const searchParams = {
          page: 1,
          limit: 50,
          search: debouncedSearch || undefined,
          status: filters.statusFilter ? [filters.statusFilter] : undefined,
          tier: filters.tierFilter || undefined,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          fields: 'id,name,email,status,tier,value,contactCount,updatedAt', // Minimal fields per CORE_REQUIREMENTS
        };

        // Fetch customers with current search parameters
        await bridge.fetchCustomers(searchParams);

        // Track analytics
        bridge.trackAction('customers_list_viewed', {
          component: 'CustomerListBridge',
          searchTerm: debouncedSearch,
          statusFilter: filters.statusFilter,
          tierFilter: filters.tierFilter,
          userStory: 'US-2.3',
          hypothesis: 'H4',
        });
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      }
    }, 0);

    // Cleanup timeout on unmount or dependency change
    return () => clearTimeout(timeoutId);
  }, [
    debouncedSearch,
    filters.statusFilter,
    filters.tierFilter,
    filters.sortBy,
    filters.sortOrder,
  ]); // ✅ CRITICAL: Removed bridge from dependencies to prevent infinite loops

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Handle customer actions
  const handleCustomerView = useCallback(
    (customer: Customer & { tier?: string }) => {
      analytics('customer_viewed', {
        customerId: customer.id,
        customerName: customer.name,
        customerTier: customer.tier,
        customerStatus: customer.status,
        userStory: 'US-2.3',
        hypothesis: 'H4',
      });

      // Navigate to customer detail page
      window.location.href = `/customers/${customer.id}`;
    },
    [analytics]
  );

  const handleCustomerEdit = useCallback(
    (customer: Customer) => {
      analytics('customer_edit_clicked', {
        customerId: customer.id,
        customerName: customer.name,
        userStory: 'US-2.3',
        hypothesis: 'H4',
      });

      // Navigate to customer edit page
      window.location.href = `/customers/${customer.id}/edit`;
    },
    [analytics]
  );

  // Render loading state
  if (loading) {
    return (
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        role="status"
        aria-label="Loading customers"
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <CustomerSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="p-6" role="alert" aria-live="polite">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Customers</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => bridge.refreshCustomers()} aria-label="Retry loading customers">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  // Render empty state
  if (!Array.isArray(customers) || customers.length === 0) {
    return (
      <Card className="p-6" role="status" aria-live="polite">
        <div className="text-center">
          <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Customers Found</h3>
          <p className="text-gray-600 mb-4">
            {debouncedSearch || filters.statusFilter || filters.tierFilter
              ? 'Try adjusting your search or filters.'
              : 'Get started by creating your first customer.'}
          </p>
          <Button
            onClick={() => (window.location.href = '/customers/create')}
            aria-label="Create new customer"
          >
            Create Customer
          </Button>
        </div>
      </Card>
    );
  }

  // Render customer list
  return (
    <div className="space-y-6" role="main" aria-label="Customer management">
      {/* ✅ BRIDGE COMPLIANCE: Enhanced Search and Filters with form handling */}
      <CustomerSearchForm filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Customer Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        role="grid"
        aria-label="Customer list"
      >
        {Array.isArray(customers) &&
          customers.map((customer: Customer) => (
            <CustomerItem
              key={customer.id}
              customer={customer}
              onView={handleCustomerView}
              onEdit={handleCustomerEdit}
            />
          ))}
      </div>

      {/* Enhanced Results Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-600 mb-2 sm:mb-0">
            <span className="font-medium text-gray-900">
              {Array.isArray(customers) ? customers.length : 0}
            </span>{' '}
            customer{Array.isArray(customers) && customers.length !== 1 ? 's' : ''} found
            {debouncedSearch && (
              <span className="text-blue-600"> matching "{debouncedSearch}"</span>
            )}
            {(filters.statusFilter || filters.tierFilter) && (
              <span className="text-green-600">
                {filters.statusFilter && ` • Status: ${filters.statusFilter}`}
                {filters.tierFilter && ` • Tier: ${filters.tierFilter}`}
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2" role="group" aria-label="Quick actions">
            <button
              onClick={() => (window.location.href = '/customers/create')}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              aria-label="Add new customer"
              data-testid="add-customer-button"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Customer
            </button>

            {Array.isArray(customers) && customers.length > 0 && (
              <button
                onClick={() => {
                  // Export functionality could be added here
                  console.log('Export customers:', customers);
                }}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                aria-label="Export customer data"
                data-testid="export-customers-button"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

CustomerListBridge.displayName = 'CustomerListBridge';

export { CustomerListBridge };
