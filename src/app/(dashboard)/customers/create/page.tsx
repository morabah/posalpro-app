/**
 * PosalPro MVP2 - Customer Creation Page
 * Based on CUSTOMER_PROFILE_SCREEN.md wireframe specifications
 *
 * User Stories: US-2.1, US-2.2
 * Hypothesis Coverage: H4 (Cross-Department Coordination - 40% reduction)
 * Component Traceability: CustomerCreationForm, CustomerProfileManager
 */

'use client';

import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { StandardError } from '@/lib/errors/StandardError';
import { ApiResponse } from '@/types/api';
import { ArrowLeftIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  industry: string;
  address: string;
  notes: string;
}

interface CustomerResponse {
  id: string;
  name: string;
  email: string;
}

export default function CustomerCreationPage() {
  const apiClient = useApiClient();
  const { handleAsyncError } = useErrorHandler();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    address: '',
    notes: '',
  });

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post<ApiResponse<CustomerResponse>>(
        '/api/customers',
        formData
      );

      if (response.success && response.data) {
        // Navigate to the newly created customer
        router.push(`/customers/${response.data.id}`);
      }
    } catch (error) {
      handleAsyncError(
        new StandardError({
          message: 'Failed to create customer',
          code: ErrorCodes.DATA.QUERY_FAILED,
          metadata: {
            component: 'CustomerCreationPage',
            operation: 'POST',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/customers"
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Customers
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Customer</h1>
                <p className="mt-2 text-gray-600">Add a new customer to your database</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Customer Information</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('name', e.target.value)
                    }
                    required
                    placeholder="Enter customer's full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('email', e.target.value)
                    }
                    required
                    placeholder="customer@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('phone', e.target.value)
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {/* Company Information */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Company Name *
                  </label>
                  <Input
                    id="company"
                    type="text"
                    value={formData.company}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('company', e.target.value)
                    }
                    required
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                    Industry
                  </label>
                  <Input
                    id="industry"
                    type="text"
                    value={formData.industry}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('industry', e.target.value)
                    }
                    placeholder="e.g., Technology, Healthcare, Finance"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    id="address"
                    value={formData.address}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      handleInputChange('address', e.target.value)
                    }
                    placeholder="Enter full address"
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleInputChange('notes', e.target.value)
                }
                placeholder="Add any additional notes about this customer..."
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/customers"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <Button type="submit" disabled={loading} className="inline-flex items-center">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="w-4 h-4 mr-2" />
                    Create Customer
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
