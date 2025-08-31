'use client';

import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { useCustomer, useUpdateCustomer } from '@/features/customers/hooks';
import { Customer } from '@/services/customerService';
import { CustomerUpdate } from '@/features/customers/schemas';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface CustomerEditFormProps {
  customerId: string;
}

export function CustomerEditForm({ customerId }: CustomerEditFormProps) {
  const router = useRouter();
  const { data: customerData, isLoading, isError } = useCustomer(customerId);
  const updateCustomer = useUpdateCustomer();

  const [formData, setFormData] = useState<CustomerUpdate & { id?: string }>({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    industry: undefined,
    companySize: undefined,
    revenue: undefined,
    status: 'ACTIVE',
    tier: 'STANDARD',
    tags: [],
  });

  // Update form data when customer data loads
  useEffect(() => {
    if (customerData?.ok && customerData.data) {
      setFormData({
        name: customerData.data.name || '',
        email: customerData.data.email || '',
        phone: customerData.data.phone || '',
        website: customerData.data.website || '',
        address: customerData.data.address || '',
        industry: customerData.data.industry || undefined,
        companySize: customerData.data.companySize || undefined,
        revenue: customerData.data.revenue,
        status: customerData.data.status || 'ACTIVE',
        tier: customerData.data.tier || 'STANDARD',
        tags: customerData.data.tags || [],
      });
    }
  }, [customerData]);

  const handleInputChange = useCallback(
    (field: keyof Customer, value: string | number | string[]) => {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!customerId) return;

      try {
        await updateCustomer.mutateAsync({
          id: customerId,
          data: formData,
        });

        // Navigate to customer detail page after successful update
        router.push(`/customers/${customerId}`);
      } catch (error) {
        console.error('Failed to update customer:', error);
      }
    },
    [customerId, formData, updateCustomer, router]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError || !customerData?.ok) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Customer not found</h2>
          <p className="text-gray-600 mb-4">The customer you're looking for doesn't exist.</p>
          <Link href="/customers" className="text-blue-600 hover:text-blue-800">
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/customers/${customerId}`}
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
                aria-label="Back to customer details"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Customer
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Customer</h1>
                <p className="mt-2 text-gray-600">Update customer information</p>
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
                    value={formData.name || ''}
                    onChange={e => handleInputChange('name', e.target.value)}
                    required
                    placeholder="Enter customer's full name"
                    className="min-h-[44px]"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={e => handleInputChange('email', e.target.value)}
                    required
                    placeholder="customer@example.com"
                    className="min-h-[44px]"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={e => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="min-h-[44px]"
                  />
                </div>
              </div>

              {/* Company Information */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website || ''}
                    onChange={e => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
                    className="min-h-[44px]"
                  />
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                    Industry
                  </label>
                  <Input
                    id="industry"
                    type="text"
                    value={formData.industry || ''}
                    onChange={e => handleInputChange('industry', e.target.value)}
                    placeholder="Technology, Healthcare, Finance, etc."
                    className="min-h-[44px]"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address || ''}
                    onChange={e => handleInputChange('address', e.target.value)}
                    placeholder="Enter full address"
                    className="min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Link
                href={`/customers/${customerId}`}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <Button
                type="submit"
                disabled={updateCustomer.isPending}
                className="inline-flex items-center min-h-[44px] px-4 py-2"
                aria-label={updateCustomer.isPending ? 'Updating customer...' : 'Update customer'}
              >
                {updateCustomer.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Customer'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
