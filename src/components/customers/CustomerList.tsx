/**
 * PosalPro MVP2 - Customer List Component
 * Displays paginated list of customers with search and filtering
 * Based on CUSTOMER_PROFILE_SCREEN.md wireframe specifications
 * Component Traceability Matrix: US-2.3, US-6.4, H4, H12
 */

'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/Input';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useApiClient } from '@/hooks/useApiClient';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import {
  BuildingOfficeIcon,
  EnvelopeIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { debounce } from 'lodash';
import Link from 'next/link';
import { memo, useCallback, useEffect, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.3', 'US-6.4'],
  acceptanceCriteria: ['AC-2.3.1', 'AC-2.3.2', 'AC-6.4.1'],
  methods: ['fetchCustomers()', 'searchCustomers()', 'trackCustomerViewed()'],
  hypotheses: ['H4', 'H12'],
  testCases: ['TC-H4-002', 'TC-H12-001'],
};

interface Customer {
  id: string;
  name: string;
  email: string;
  industry?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'enterprise';
  status: 'active' | 'inactive' | 'prospect';
  revenue?: number;
  lastContact?: string;
  createdAt: string;
}

interface CustomerListResponse {
  customers: Customer[];
  total: number;
  page: number;
  totalPages: number;
}

interface CustomerCardProps {
  customer: Customer;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

const CustomerCard = memo(({ customer, onView, onEdit }: CustomerCardProps) => {
  const getTierColor = (tier: string) => {
    const colors = {
      bronze: 'bg-orange-100 text-orange-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-blue-100 text-blue-800',
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      prospect: 'bg-blue-100 text-blue-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <UserIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={getTierColor(customer.tier)}>
                {customer.tier.charAt(0).toUpperCase() + customer.tier.slice(1)}
              </Badge>
              <Badge className={getStatusColor(customer.status)}>
                {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button size="sm" variant="ghost" onClick={() => onView(customer.id)} className="p-2">
            <EyeIcon className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(customer.id)} className="p-2">
            <PencilIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        {customer.email && (
          <div className="flex items-center space-x-2">
            <EnvelopeIcon className="h-4 w-4" />
            <span>{customer.email}</span>
          </div>
        )}

        {customer.industry && (
          <div className="flex items-center space-x-2">
            <BuildingOfficeIcon className="h-4 w-4" />
            <span>{customer.industry}</span>
          </div>
        )}

        {customer.revenue && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
            <span className="text-gray-600">Annual Revenue:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(customer.revenue)}</span>
          </div>
        )}
      </div>
    </Card>
  );
});
CustomerCard.displayName = 'CustomerCard';

const CustomerListSkeleton = memo(() => (
  <div className="space-y-4">
    {[...Array(6)].map((_, i) => (
      <Card key={i} className="p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="flex space-x-2">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    ))}
  </div>
));
CustomerListSkeleton.displayName = 'CustomerListSkeleton';

const CustomerList = memo(() => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const apiClient = useApiClient();
  const analytics = useAnalytics();
  const errorHandlingService = ErrorHandlingService.getInstance();

  const fetchCustomers = useCallback(
    async (page = 1, search = '') => {
      try {
        setLoading(true);
        setError(null);

        // Track analytics event
        analytics.track('customer_list_fetch_started', {
          component: 'CustomerList',
          page: page.toString(),
          search: search.length > 0,
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          timestamp: Date.now(),
        });

        // Use mock data for demonstration (since API might not be available)
        const mockCustomers: Customer[] = [
          {
            id: '1',
            name: 'Acme Corporation',
            email: 'contact@acme.com',
            industry: 'Manufacturing',
            tier: 'platinum',
            status: 'active',
            revenue: 2500000,
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Tech Solutions Inc',
            email: 'info@techsolutions.com',
            industry: 'Technology',
            tier: 'gold',
            status: 'active',
            revenue: 1200000,
            createdAt: new Date().toISOString(),
          },
          {
            id: '3',
            name: 'Global Services Ltd',
            email: 'hello@globalservices.com',
            industry: 'Services',
            tier: 'silver',
            status: 'prospect',
            revenue: 800000,
            createdAt: new Date().toISOString(),
          },
          {
            id: '4',
            name: 'Innovation Labs',
            email: 'contact@innovationlabs.com',
            industry: 'Research',
            tier: 'enterprise',
            status: 'active',
            revenue: 5000000,
            createdAt: new Date().toISOString(),
          },
          {
            id: '5',
            name: 'StartupCo',
            email: 'team@startupco.com',
            industry: 'Technology',
            tier: 'bronze',
            status: 'prospect',
            revenue: 150000,
            createdAt: new Date().toISOString(),
          },
          {
            id: '6',
            name: 'Enterprise Corp',
            email: 'business@enterprise.com',
            industry: 'Finance',
            tier: 'platinum',
            status: 'active',
            revenue: 3200000,
            createdAt: new Date().toISOString(),
          },
        ];

        // Filter based on search if provided
        let filteredCustomers = mockCustomers;
        if (search) {
          filteredCustomers = mockCustomers.filter(
            customer =>
              customer.name.toLowerCase().includes(search.toLowerCase()) ||
              customer.email.toLowerCase().includes(search.toLowerCase()) ||
              customer.industry?.toLowerCase().includes(search.toLowerCase())
          );
        }

        // Simulate pagination
        const itemsPerPage = 12;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        setCustomers(paginatedCustomers);
        setTotal(filteredCustomers.length);
        setTotalPages(Math.ceil(filteredCustomers.length / itemsPerPage));
        setCurrentPage(page);

        // Track successful fetch
        analytics.track('customer_list_fetch_success', {
          component: 'CustomerList',
          customerCount: paginatedCustomers.length,
          total: filteredCustomers.length,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.warn('[CustomerList] Error fetching customers:', error);
        setError('Failed to load customers');

        // Track error
        analytics.track('customer_list_fetch_error', {
          component: 'CustomerList',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        });
      } finally {
        setLoading(false);
      }
    },
    [apiClient, analytics]
  );

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setCurrentPage(1);
      fetchCustomers(1, term);
    }, 500),
    [fetchCustomers]
  );

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)

  useEffect(() => {
    if (searchTerm !== '') {
      debouncedSearch(searchTerm);
    } else {
      fetchCustomers(1, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]); // ✅ CRITICAL FIX: Only include searchTerm to prevent infinite loops

  const handleView = useCallback(
    (customerId: string) => {
      analytics.track('customer_view_clicked', {
        component: 'CustomerList',
        customerId,
        timestamp: Date.now(),
      });
      // Navigate to customer detail page
      window.location.href = `/customers/${customerId}`;
    },
    [analytics]
  );

  const handleEdit = useCallback(
    (customerId: string) => {
      analytics.track('customer_edit_clicked', {
        component: 'CustomerList',
        customerId,
        timestamp: Date.now(),
      });
      // Navigate to customer edit page
      window.location.href = `/customers/${customerId}/edit`;
    },
    [analytics]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      fetchCustomers(page, searchTerm);
    },
    [fetchCustomers, searchTerm]
  );

  if (error && customers.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load customers</p>
          <Button onClick={() => fetchCustomers()} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Customers</h2>
          <p className="text-gray-600 text-sm">
            {total} customer{total !== 1 ? 's' : ''} total
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Customer List */}
      {loading ? (
        <CustomerListSkeleton />
      ) : customers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map(customer => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onView={handleView}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? `No customers match "${searchTerm}"`
                : 'Get started by adding your first customer'}
            </p>
            <Link href="/customers/create">
              <Button>Add Customer</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
});
CustomerList.displayName = 'CustomerList';

export default CustomerList;
