/**
 * PosalPro MVP2 - Customers Main Page
 * Central hub for customer management and profiles
 */

'use client';

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { useApiClient } from '@/hooks/useApiClient';
import { UsersIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'CHURNED';
  tier: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE' | 'VIP';
  createdAt: string;
  updatedAt: string;
  _count?: {
    proposals: number;
  };
}

export default function CustomersPage() {
  const apiClient = useApiClient();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>('/customers');

      console.log('🔍 [DEBUG] Full API response:', response);

      if (response.success && response.data?.customers) {
        const customerList = response.data.customers;
        setCustomers(customerList);
        console.log('🔍 [DEBUG] Setting customers:', customerList);
        console.log('🔍 [DEBUG] Customers length:', customerList.length);
      } else {
        console.error('🔍 [DEBUG] Invalid response structure:', response);
        setCustomers([]);
        setError('Unable to load customers. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setCustomers([]);

      if (err instanceof Error) {
        if (err.message.includes('401')) {
          setError('Please log in to access customer data.');
          console.error('Authentication required - user may need to log in again');
        } else if (err.message.includes('404')) {
          setError('Customer service is temporarily unavailable.');
          console.error('Customers API endpoint not found');
        } else if (err.message.includes('500')) {
          setError('Server error. Please try again in a few moments.');
          console.error('Server error while fetching customers');
        } else {
          setError('Unable to load customers. Please check your connection and try again.');
          console.error('Network or unknown error:', err.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
        console.error('Unknown error type:', typeof err, err);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('🔍 [DEBUG] Customers state:', customers);
  console.log('🔍 [DEBUG] Customers state length:', customers.length);
  console.log('🔍 [DEBUG] Search term:', searchTerm);
  console.log('🔍 [DEBUG] Filtered customers:', filteredCustomers);
  console.log('🔍 [DEBUG] Filtered customers length:', filteredCustomers.length);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'PROSPECT':
        return 'bg-yellow-100 text-yellow-800';
      case 'CHURNED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'VIP':
        return 'bg-purple-100 text-purple-800';
      case 'ENTERPRISE':
        return 'bg-blue-100 text-blue-800';
      case 'PREMIUM':
        return 'bg-orange-100 text-orange-800';
      case 'STANDARD':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Breadcrumbs className="mb-4" />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 mt-1">
              Manage customer profiles and relationship information
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search customers by name, email, or industry..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Error State */}
      {error && (
        <Card className="mb-6">
          <div className="p-6 text-center">
            <div className="text-red-600 mb-2">⚠️ Error</div>
            <p className="text-gray-600">{error}</p>
          </div>
        </Card>
      )}

      {/* Customer List */}
      {!error && (
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Customer List ({filteredCustomers.length})
              </h2>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No customers match your search criteria.' : 'No customers found.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Industry
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Proposals
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCustomers.map(customer => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            <div className="text-sm text-gray-500">
                              ID: {customer.id.slice(0, 8)}...
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {customer.email || 'No email'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.phone || 'No phone'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {customer.industry || 'Not specified'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.companySize || 'Size not specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(customer.status)}`}
                          >
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(customer.tier)}`}
                          >
                            {customer.tier}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer._count?.proposals || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
