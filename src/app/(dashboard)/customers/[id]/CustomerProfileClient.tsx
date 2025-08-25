'use client';

/**
 * PosalPro MVP2 - Customer Profile Client Component
 * ✅ GOLD STANDARD IMPLEMENTATION: React Query + CORE_REQUIREMENTS.md Compliance
 * ✅ INTEGRATED: New Validation Library
 *
 * Following patterns from:
 * - src/hooks/useProducts.ts (React Query implementation)
 * - CORE_REQUIREMENTS.md → Data Fetching & Performance; React Query Patterns
 * - Validation Library (useFormValidation + FormField components)
 */

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { FormErrorSummary, FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/forms/Button';
import { useApiClient } from '@/hooks/useApiClient';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useResponsive } from '@/hooks/useResponsive';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logError, logInfo } from '@/lib/logger';
import type { CustomerEditData } from '@/lib/validation/customerValidation';
import { customerValidationSchema } from '@/lib/validation/customerValidation';
import {
  BuildingOfficeIcon,
  CalendarIcon,
  CheckIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

// ✅ COMPONENT TRACEABILITY MATRIX
const COMPONENT_MAPPING = {
  userStories: ['US-2.3', 'US-6.4'],
  acceptanceCriteria: ['AC-2.3.1', 'AC-2.3.2', 'AC-2.3.3', 'AC-6.4.1'],
  methods: ['getCustomer()', 'updateCustomerProfile()'],
  hypotheses: ['H4', 'H12'],
  testCases: ['TC-H4-002', 'TC-H12-001'],
};

// ✅ TYPES
enum CustomerTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  ENTERPRISE = 'enterprise',
}

interface CustomerStatistics {
  healthScore?: number;
  engagementLevel?: 'low' | 'medium' | 'high';
  [key: string]: unknown;
}

interface CustomerApiResponse {
  id?: string | number;
  name?: string;
  industry?: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  revenue?: number;
  employeeCount?: number;
  statistics?: CustomerStatistics;
  lastContact?: string;
  nextActionDue?: string;
  tags?: string[];
  [key: string]: unknown;
}

interface Customer {
  id: string;
  name: string;
  industry: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  tier: CustomerTier;
  annualRevenue: number;
  employeeCount: number;
  healthScore: number;
  engagementLevel: 'low' | 'medium' | 'high';
  lastContact: Date;
  nextActionDue: Date;
  tags: string[];
}

export function CustomerProfileClient({ customerId }: { customerId: string }) {
  const router = useRouter();
  const { trackOptimized } = useOptimizedAnalytics();
  const errorHandlingService = ErrorHandlingService.getInstance();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { isMobile } = useResponsive();

  // ✅ EDIT STATE (local, not queried)
  const [isEditing, setIsEditing] = useState(false);

  // ✅ REUSABLE VALIDATION HOOK
  const validation = useFormValidation(
    {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      industry: '',
      annualRevenue: undefined,
      employeeCount: undefined,
      tier: 'bronze',
      tags: [],
    } as CustomerEditData,
    customerValidationSchema,
    {
      validateOnChange: false, // Don't validate on change initially
      validateOnBlur: true,
    }
  );

  // ✅ REACT QUERY: Query Keys
  const CUSTOMER_QUERY_KEYS = useMemo(
    () => ({
      all: ['customers'] as const,
      detail: (id: string) => ['customers', 'detail', id] as const,
    }),
    []
  );

  // ✅ TRANSFORMER: API → UI mapping with defensive fallbacks
  const mapApiToCustomer = useCallback(
    (raw: CustomerApiResponse, previous?: Customer | null): Customer => ({
      id: String(raw.id ?? previous?.id ?? ''),
      name: String(raw.name ?? previous?.name ?? ''),
      industry: String(raw.industry ?? previous?.industry ?? ''),
      address: String(raw.address ?? previous?.address ?? ''),
      phone: String(raw.phone ?? previous?.phone ?? ''),
      website: String(raw.website ?? previous?.website ?? ''),
      email: String(raw.email ?? previous?.email ?? ''),
      tier: (previous?.tier as CustomerTier) || CustomerTier.BRONZE,
      annualRevenue: typeof raw.revenue === 'number' ? raw.revenue : previous?.annualRevenue || 0,
      employeeCount:
        typeof raw.employeeCount === 'number' ? raw.employeeCount : previous?.employeeCount || 0,
      healthScore:
        typeof raw.statistics?.healthScore === 'number'
          ? raw.statistics.healthScore
          : previous?.healthScore || 0,
      engagementLevel:
        (raw.statistics?.engagementLevel as Customer['engagementLevel']) ||
        previous?.engagementLevel ||
        'low',
      lastContact: raw.lastContact
        ? new Date(raw.lastContact)
        : previous?.lastContact || new Date(),
      nextActionDue: raw.nextActionDue
        ? new Date(raw.nextActionDue)
        : previous?.nextActionDue || new Date(),
      tags: Array.isArray(raw.tags) ? raw.tags : previous?.tags || [],
    }),
    []
  );

  // ✅ REACT QUERY: Fetch customer detail
  const {
    data: customer,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.detail(customerId),
    queryFn: async (): Promise<Customer> => {
      const start = Date.now();
      void logDebug('[CustomerProfile] Fetch start', { customerId });
      try {
        const response = await apiClient.get<{
          ok: boolean;
          data?: CustomerApiResponse;
        }>(`customers/${customerId}`);

        if (!response?.ok || !response.data) {
          throw new Error('Failed to fetch customer');
        }

        const mapped = mapApiToCustomer(response.data);

        // ✅ Analytics
        trackOptimized('customer_profile_viewed', {
          customerId,
          loadTime: Date.now() - start,
          userStory: 'US-2.3',
          hypothesis: 'H4',
        });
        void logInfo('[CustomerProfile] Fetch success', {
          customerId,
          loadTime: Date.now() - start,
        });

        return mapped;
      } catch (err) {
        const standardError = errorHandlingService.processError(
          err,
          'Failed to fetch customer',
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: 'CustomerProfileClient',
            operation: 'fetch',
            customerId,
            userStory: 'US-2.3',
            hypothesis: 'H4',
          }
        );
        trackOptimized('customer_profile_error', {
          customerId,
          error: errorHandlingService.getUserFriendlyMessage(standardError),
          userStory: 'US-2.3',
          hypothesis: 'H4',
        });
        void logError('[CustomerProfile] Fetch failed', {
          customerId,
          error: standardError.message,
        });
        throw standardError;
      }
    },
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // ✅ Initialize edit data when entering edit mode
  const handleEditToggle = useCallback(() => {
    if (!isEditing && customer) {
      const initialData: CustomerEditData = {
        name: customer.name,
        industry: customer.industry,
        address: customer.address,
        phone: customer.phone,
        website: customer.website,
        email: customer.email,
        tier: customer.tier,
        annualRevenue: customer.annualRevenue,
        employeeCount: customer.employeeCount,
        tags: [...customer.tags],
      };
      validation.resetForm(initialData);
      setIsEditing(true);
    } else {
      setIsEditing(false);
      validation.resetForm();
    }
  }, [isEditing, customer, validation]);

  // ✅ REACT QUERY: Update customer mutation
  const { mutateAsync: saveCustomer, isPending: isSaving } = useMutation({
    mutationFn: async (data: CustomerEditData): Promise<Customer> => {
      // Basic validation for required fields
      if (!data.name?.trim()) {
        throw new Error('Company name is required');
      }
      if (!data.email?.trim()) {
        throw new Error('Email address is required');
      }

      // Note: Validation is now handled by disabled save button state

      const payload: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        industry: data.industry,
        tags: data.tags,
        metadata: {
          uiTier: data.tier,
        },
      };

      // Only add revenue if it's defined
      if (data.annualRevenue !== undefined) {
        payload.revenue = data.annualRevenue;
      }

      // Note: employeeCount field removed as it doesn't exist in Customer schema

      void logDebug('[CustomerProfile] Update start', {
        customerId,
        payloadKeys: Object.keys(payload),
        payload,
      });

      try {
        const response = await apiClient.put<{ ok: boolean; data?: CustomerApiResponse }>(
          `customers/${customerId}`,
          payload
        );

        if (!response?.ok || !response.data) {
          throw new Error('Failed to update customer');
        }

        const updated = mapApiToCustomer(response.data, customer ?? undefined);
        void logInfo('[CustomerProfile] Update success', { customerId });
        return updated;
      } catch (err) {
        const standardError = errorHandlingService.processError(
          err,
          'Failed to update customer',
          ErrorCodes.DATA.UPDATE_FAILED,
          {
            component: 'CustomerProfileClient',
            operation: 'update',
            customerId,
            userStory: 'US-2.3',
            hypothesis: 'H4',
          }
        );
        void logError('[CustomerProfile] Update failed', {
          customerId,
          error: standardError.message,
        });
        throw standardError;
      }
    },
    onSuccess: (updated: Customer) => {
      queryClient.setQueryData(CUSTOMER_QUERY_KEYS.detail(customerId), updated);
      toast.success('Customer profile updated successfully');
      trackOptimized('save_customer_success', {
        customerId,
        userStory: 'US-2.3',
        hypothesis: 'H4',
      });
      void logInfo('[CustomerProfile] onSuccess mutation', { customerId });
      setIsEditing(false);
      validation.resetForm();
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'An error occurred while updating the customer';

      // Enhanced error display
      if (message.includes('Validation failed')) {
        // Show validation errors in a more prominent way
        toast.error('Please fix the following issues:', {
          description: message.replace('Validation failed: ', ''),
          duration: 8000,
        });
      } else {
        toast.error(message);
      }

      trackOptimized('save_customer_error', { customerId, error: message, userStory: 'US-2.3' });
      void logError('[CustomerProfile] onError mutation', { customerId, error: message });
    },
  });

  // ✅ UI HELPERS
  const getTierDisplay = (tier: CustomerTier) => {
    const displays = {
      [CustomerTier.BRONZE]: { label: 'Bronze', color: 'text-orange-600', bg: 'bg-orange-100' },
      [CustomerTier.SILVER]: { label: 'Silver', color: 'text-gray-600', bg: 'bg-gray-100' },
      [CustomerTier.GOLD]: { label: 'Gold', color: 'text-yellow-600', bg: 'bg-yellow-100' },
      [CustomerTier.PLATINUM]: { label: 'Platinum', color: 'text-purple-600', bg: 'bg-purple-100' },
      [CustomerTier.ENTERPRISE]: { label: 'Enterprise', color: 'text-blue-600', bg: 'bg-blue-100' },
    } as const;
    return displays[tier] || displays[CustomerTier.BRONZE]; // Fallback to BRONZE if tier not found
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toLocaleString()}`;
  };

  // ✅ LOADING STATE
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer profile...</p>
        </div>
      </div>
    );
  }

  // ✅ ERROR STATE WITH RETRY
  if (error || !customer) {
    const message = error instanceof Error ? error.message : 'Failed to load customer profile';
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-2xl">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Customer Not Found</h1>
          <p className="text-gray-600 mb-4">{message}</p>
          <div className="space-x-4">
            <Button onClick={() => refetch()} className="inline-flex items-center">
              Retry
            </Button>
            <Button
              onClick={() => router.push('/customers')}
              variant="outline"
              className="inline-flex items-center"
            >
              Back to Customers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tierDisplay = getTierDisplay(customer.tier || CustomerTier.BRONZE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs className="mb-6" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            {isEditing ? (
              <div className="space-y-2">
                <div className="space-y-1">
                  <FormField
                    name="name"
                    label=""
                    value={validation.formData.name}
                    onChange={value => validation.handleFieldChange('name', value)}
                    onBlur={() => validation.handleFieldBlur('name')}
                    error={validation.getFieldError('name')}
                    touched={validation.isFieldTouched('name')}
                    required
                    className="text-2xl font-bold text-gray-900"
                    inputClassName="text-2xl font-bold text-gray-900 border-b-2 bg-transparent focus:outline-none"
                    placeholder="Company name"
                  />
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="space-y-1">
                    <FormField
                      name="industry"
                      label=""
                      value={validation.formData.industry}
                      onChange={value => validation.handleFieldChange('industry', value)}
                      onBlur={() => validation.handleFieldBlur('industry')}
                      error={validation.getFieldError('industry')}
                      touched={validation.isFieldTouched('industry')}
                      className="border-b bg-transparent focus:outline-none"
                      inputClassName="border-b bg-transparent focus:outline-none"
                      placeholder="Industry"
                    />
                  </div>
                  <span>•</span>
                  <div className="space-y-1">
                    <FormField
                      name="employeeCount"
                      label=""
                      type="number"
                      value={validation.formData.employeeCount}
                      onChange={value => validation.handleFieldChange('employeeCount', value)}
                      onBlur={() => validation.handleFieldBlur('employeeCount')}
                      error={validation.getFieldError('employeeCount')}
                      touched={validation.isFieldTouched('employeeCount')}
                      className="w-20"
                      inputClassName="w-20 border-b bg-transparent focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <span>employees</span>
                  <span>•</span>
                  <div className="space-y-1">
                    <FormField
                      name="annualRevenue"
                      label=""
                      type="number"
                      value={validation.formData.annualRevenue}
                      onChange={value => validation.handleFieldChange('annualRevenue', value)}
                      onBlur={() => validation.handleFieldBlur('annualRevenue')}
                      error={validation.getFieldError('annualRevenue')}
                      touched={validation.isFieldTouched('annualRevenue')}
                      className="w-32"
                      inputClassName="w-32 border-b bg-transparent focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <span>revenue</span>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <span>{customer.industry}</span>
                  <span>•</span>
                  <span>{customer.employeeCount?.toLocaleString() || 'N/A'} employees</span>
                  <span>•</span>
                  <span>
                    {customer.annualRevenue ? formatLargeNumber(customer.annualRevenue) : 'N/A'}{' '}
                    revenue
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <Button
                variant="secondary"
                onClick={() => router.push(`/proposals/create?customer=${customerId}`)}
                className="flex items-center min-h-[44px]"
                aria-label="Create new proposal"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                {isMobile ? 'Proposal' : 'New Proposal'}
              </Button>
            )}

            {isEditing ? (
              <>
                <Button
                  variant="secondary"
                  onClick={handleEditToggle}
                  className="flex items-center min-h-[44px]"
                  disabled={isSaving}
                  aria-label="Cancel editing"
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={() => saveCustomer(validation.formData)}
                  variant="primary"
                  className="flex items-center min-h-[44px]"
                  disabled={isSaving || !validation.isValid}
                  aria-label="Save changes"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                onClick={handleEditToggle}
                className="flex items-center min-h-[44px]"
                aria-label="Edit customer profile"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                {isMobile ? 'Edit' : 'Edit Profile'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Validation Error Summary */}
      {isEditing && validation.hasErrors && (
        <div className="mb-6">
          <FormErrorSummary errors={validation.validationErrors} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Customer Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Information */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-3" />
                  {isEditing ? (
                    <FormField
                      name="name"
                      label=""
                      value={validation.formData.name}
                      onChange={value => validation.handleFieldChange('name', value)}
                      onBlur={() => validation.handleFieldBlur('name')}
                      error={validation.getFieldError('name')}
                      touched={validation.isFieldTouched('name')}
                      required
                      className="flex-1"
                      inputClassName="flex-1 border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                      placeholder="Company name"
                    />
                  ) : (
                    <span className="text-gray-900">{customer.name}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <MapPinIcon className="w-5 h-5 text-gray-400 mr-3" />
                  {isEditing ? (
                    <FormField
                      name="address"
                      label=""
                      value={validation.formData.address}
                      onChange={value => validation.handleFieldChange('address', value)}
                      onBlur={() => validation.handleFieldBlur('address')}
                      error={validation.getFieldError('address')}
                      touched={validation.isFieldTouched('address')}
                      className="flex-1"
                      inputClassName="flex-1 border-b bg-transparent focus:outline-none"
                      placeholder="Address"
                    />
                  ) : (
                    <span className="text-gray-700">{customer.address}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                  {isEditing ? (
                    <FormField
                      name="phone"
                      label=""
                      type="tel"
                      value={validation.formData.phone}
                      onChange={value => validation.handleFieldChange('phone', value)}
                      onBlur={() => validation.handleFieldBlur('phone')}
                      error={validation.getFieldError('phone')}
                      touched={validation.isFieldTouched('phone')}
                      className="flex-1"
                      inputClassName="flex-1 border-b bg-transparent focus:outline-none"
                      placeholder="Phone number"
                    />
                  ) : (
                    <span className="text-gray-700">{customer.phone}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                  {isEditing ? (
                    <FormField
                      name="email"
                      label=""
                      type="email"
                      value={validation.formData.email}
                      onChange={value => validation.handleFieldChange('email', value)}
                      onBlur={() => validation.handleFieldBlur('email')}
                      error={validation.getFieldError('email')}
                      touched={validation.isFieldTouched('email')}
                      required
                      className="flex-1"
                      inputClassName="flex-1 border-b bg-transparent focus:outline-none"
                      placeholder="Email address"
                    />
                  ) : (
                    <span className="text-gray-700">{customer.email}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <GlobeAltIcon className="w-5 h-5 text-gray-400 mr-3" />
                  {isEditing ? (
                    <FormField
                      name="website"
                      label=""
                      type="url"
                      value={validation.formData.website}
                      onChange={value => validation.handleFieldChange('website', value)}
                      onBlur={() => validation.handleFieldBlur('website')}
                      error={validation.getFieldError('website')}
                      touched={validation.isFieldTouched('website')}
                      className="flex-1"
                      inputClassName="flex-1 border-b bg-transparent focus:outline-none"
                      placeholder="Website URL"
                    />
                  ) : (
                    <a
                      href={`https://${customer.website}`}
                      className="text-blue-600 hover:text-blue-800"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {customer.website}
                    </a>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span
                    className={`px-3 py-1 text-sm rounded-full ${tierDisplay?.bg || 'bg-gray-100'} ${tierDisplay?.color || 'text-gray-600'}`}
                  >
                    {tierDisplay?.label || 'Unknown Tier'}
                  </span>
                  <span className="text-sm text-gray-600">{customer.industry}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {customer.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Customer Health */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Health</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Health Score</span>
                    <span className={`text-lg font-bold ${getHealthColor(customer.healthScore)}`}>
                      {customer.healthScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        customer.healthScore >= 80
                          ? 'bg-green-500'
                          : customer.healthScore >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${customer.healthScore}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Engagement:</span>
                    <div className="font-medium capitalize">{customer.engagementLevel}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Contact:</span>
                    <div className="font-medium">{customer.lastContact.toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center text-sm text-blue-800">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Next action due: {customer.nextActionDue.toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Overview</h3>
              <p className="text-gray-600">
                Detailed customer information and analytics would be displayed here. This includes
                proposal history, activity timeline, segmentation data, and AI-powered insights
                based on the customer ID:{' '}
                <code className="bg-gray-100 px-2 py-1 rounded">{customerId}</code>
              </p>
              <div className="mt-4 flex space-x-4">
                <Button
                  variant="primary"
                  onClick={() => router.push(`/proposals/create?customer=${customerId}`)}
                >
                  Create Proposal
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => trackOptimized('view_full_profile', { customerId })}
                >
                  View Full Profile
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
