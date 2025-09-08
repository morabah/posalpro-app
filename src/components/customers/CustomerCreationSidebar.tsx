'use client';

import { SearchableCountrySelect } from '@/components/ui/SearchableCountrySelect';
import type { Customer } from '@/features/customers';
import { CustomerCreateSchema } from '@/features/customers/schemas';
import { apiClient } from '@/lib/api/client';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building, DollarSign, Globe, Loader2, Mail, MapPin, Save, Tag, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type CustomerFormData = z.infer<typeof CustomerCreateSchema>;

interface CustomerCreationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (customer: Customer) => void;
}

const INDUSTRY_OPTIONS = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'education', label: 'Education' },
  { value: 'government', label: 'Government' },
  { value: 'nonprofit', label: 'Non-profit' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'energy', label: 'Energy' },
  { value: 'telecommunications', label: 'Telecommunications' },
  { value: 'media', label: 'Media' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'aerospace', label: 'Aerospace' },
  { value: 'construction', label: 'Construction' },
  { value: 'other', label: 'Other' },
];

const COMPANY_SIZE_OPTIONS = [
  { value: 'startup', label: 'Startup (1-10 employees)' },
  { value: 'small', label: 'Small (11-50 employees)' },
  { value: 'medium', label: 'Medium (51-250 employees)' },
  { value: 'large', label: 'Large (251-1000 employees)' },
  { value: 'enterprise', label: 'Enterprise (1000+ employees)' },
];

const TIER_OPTIONS = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
  { value: 'VIP', label: 'VIP' },
];

export function CustomerCreationSidebar({
  isOpen,
  onClose,
  onSuccess,
}: CustomerCreationSidebarProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(CustomerCreateSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      country: '',
      industry: undefined,
      companySize: '',
      revenue: undefined,
      status: 'ACTIVE',
      tier: 'STANDARD',
      tags: [],
    },
  });

  const watchedTags = watch('tags') || [];

  const addTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      const newTags = [...watchedTags, tagInput.trim()];
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = watchedTags.filter(tag => tag !== tagToRemove);
    setValue('tags', newTags);
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const { logDebug } = await import('@/lib/logger');
      await logDebug('[CustomerCreationSidebar] Submitting customer data', { data });

      // Clean up empty strings and ensure proper data types
      const cleanData = {
        ...data,
        email: data.email || undefined,
        phone: data.phone || undefined,
        website: data.website || undefined,
        address: data.address || undefined,
        industry: data.industry || undefined,
        companySize: data.companySize || undefined,
        revenue: data.revenue || undefined,
        metadata: data.metadata || undefined,
        segmentation: data.segmentation || undefined,
        riskScore: data.riskScore || undefined,
        ltv: data.ltv || undefined,
        lastContact: data.lastContact || undefined,
        cloudId: data.cloudId || undefined,
        lastSyncedAt: data.lastSyncedAt || undefined,
        syncStatus: data.syncStatus || undefined,
      };

      const response = await apiClient.post('/customers', cleanData);

      if (response.success) {
        setMessage({
          type: 'success',
          text: 'Customer created successfully!',
        });

        // Reset form
        reset();
        setTagInput('');

        // Call success callback with customer data
        if (onSuccess) {
          const responseData = response as { data: { data?: Customer } | Customer };
          const customerData =
            'data' in responseData.data ? responseData.data.data : responseData.data;
          if (customerData) {
            onSuccess(customerData as Customer);
          }
        }

        // Close sidebar after a brief delay
        setTimeout(() => {
          onClose();
          setMessage(null);
        }, 1500);
      } else {
        throw new Error('Failed to create customer');
      }
    } catch (error) {
      // ✅ STANDARDIZED ERROR HANDLING: Use ErrorHandlingService
      const errorHandlingService = ErrorHandlingService.getInstance();
      const standardError = errorHandlingService.processError(
        error,
        'Failed to create customer. Please try again.',
        ErrorCodes.BUSINESS.PROCESS_FAILED,
        {
          component: 'CustomerCreationSidebar',
          operation: 'createCustomer',
          customerData: data,
        }
      );

      // Log the error for debugging
      errorHandlingService.processError(standardError);

      setMessage({
        type: 'error',
        text: errorHandlingService.getUserFriendlyMessage(standardError),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <Building className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Create New Customer</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6">
            {message && (
              <div
                className={`mb-4 p-3 rounded-md ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Company Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  id="name"
                  {...register('name')}
                  placeholder="Enter company name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Information
                </h3>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="company@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    id="phone"
                    {...register('phone')}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="website"
                      {...register('website')}
                      placeholder="https://www.company.com"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {errors.website && (
                    <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
                  )}
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Business Information
                </h3>

                <div>
                  <label
                    htmlFor="industry"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Industry
                  </label>
                  <select
                    {...register('industry')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select industry</option>
                    {INDUSTRY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.industry && (
                    <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="companySize"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Company Size
                  </label>
                  <select
                    {...register('companySize')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select company size</option>
                    {COMPANY_SIZE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.companySize && (
                    <p className="mt-1 text-sm text-red-600">{errors.companySize.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="tier" className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Tier
                  </label>
                  <select
                    {...register('tier')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {TIER_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.tier && (
                    <p className="mt-1 text-sm text-red-600">{errors.tier.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="revenue" className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Revenue
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="revenue"
                      type="number"
                      {...register('revenue', { valueAsNumber: true })}
                      placeholder="1000000"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {errors.revenue && (
                    <p className="mt-1 text-sm text-red-600">{errors.revenue.message}</p>
                  )}
                </div>
              </div>

              {/* Country */}
              <SearchableCountrySelect
                name="country"
                label="Country"
                placeholder="Search countries..."
                size="md"
                register={register}
                setValue={setValue}
                watch={watch}
                formErrors={errors}
              />

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-2" />
                  Address
                </label>
                <textarea
                  id="address"
                  {...register('address')}
                  placeholder="Enter company address"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="inline h-4 w-4 mr-2" />
                  Tags
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={!tagInput.trim()}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                {watchedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {watchedTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Customer...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Customer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
