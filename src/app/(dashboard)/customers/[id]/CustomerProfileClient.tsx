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
import { SearchableCountrySelect } from '@/components/ui/SearchableCountrySelect';
import { useCustomer } from '@/features/customers/hooks';
import type { Customer } from '@/features/customers/schemas';
import { CustomerUpdateSchema } from '@/features/customers/schemas';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useResponsive } from '@/hooks/useResponsive';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logError, logInfo } from '@/lib/logger';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React, { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

// ✅ TYPES
enum CustomerTier {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

interface CustomerStatistics {
  riskScore?: number;
  engagementLevel?: 'low' | 'medium' | 'high';
  [key: string]: unknown;
}

interface CustomerApiResponse {
  id?: string | number;
  name?: string;
  industry?:
    | 'TECHNOLOGY'
    | 'HEALTHCARE'
    | 'FINANCE'
    | 'RETAIL'
    | 'MANUFACTURING'
    | 'EDUCATION'
    | 'GOVERNMENT'
    | 'OTHER'
    | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  email?: string | null;
  revenue?: number | null;
  companySize?: string | null;
  status?: 'ACTIVE' | 'INACTIVE' | 'PROSPECT';
  tier?: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
  tags?: string[];
  metadata?: Record<string, unknown> | null;
  segmentation?: Record<string, unknown> | null;
  riskScore?: number | null;
  ltv?: number | null;
  lastContact?: string | null;
  cloudId?: string | null;
  lastSyncedAt?: string | null;
  syncStatus?: string | null;
  createdAt?: string;
  updatedAt?: string;
  country?: string | null;
  [key: string]: unknown;
}

export function CustomerProfileClient({ customerId }: { customerId: string }) {
  const router = useRouter();
  const { trackOptimized } = useOptimizedAnalytics();
  const errorHandlingService = ErrorHandlingService.getInstance();
  const queryClient = useQueryClient();
  const { isMobile } = useResponsive();

  // ✅ EDIT STATE (local, not queried)
  const [isEditing, setIsEditing] = useState(false);

  // ✅ REACT HOOK FORM SETUP
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
    watch,
    setValue,
    trigger,
    reset,
  } = useForm<z.infer<typeof CustomerUpdateSchema>>({
    resolver: zodResolver(CustomerUpdateSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      country: '',
      industry: undefined,
      revenue: undefined,
      companySize: '',
      tier: 'STANDARD',
      tags: [],
    },
  });

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
      email: String(raw.email ?? previous?.email ?? ''),
      phone: raw.phone ?? previous?.phone ?? undefined,
      website: raw.website ?? previous?.website ?? undefined,
      address: raw.address ?? previous?.address ?? undefined,
      country: raw.country ?? previous?.country ?? undefined,
      industry: raw.industry ?? previous?.industry ?? undefined,
      companySize: raw.companySize ?? previous?.companySize ?? null,
      revenue: typeof raw.revenue === 'number' ? raw.revenue : (previous?.revenue ?? null),
      status: raw.status ?? previous?.status ?? 'ACTIVE',
      tier: raw.tier ?? previous?.tier ?? undefined,
      tags: Array.isArray(raw.tags) ? raw.tags : (previous?.tags ?? []),
      metadata: raw.metadata ?? previous?.metadata ?? null,
      segmentation: raw.segmentation ?? previous?.segmentation ?? null,
      riskScore: raw.riskScore ?? previous?.riskScore ?? null,
      ltv: raw.ltv ?? previous?.ltv ?? null,
      lastContact: raw.lastContact ?? previous?.lastContact ?? null,
      cloudId: raw.cloudId ?? previous?.cloudId ?? null,
      lastSyncedAt: raw.lastSyncedAt ?? previous?.lastSyncedAt ?? null,
      syncStatus: raw.syncStatus ?? previous?.syncStatus ?? null,
      createdAt: raw.createdAt ?? previous?.createdAt ?? '',
      updatedAt: raw.updatedAt ?? previous?.updatedAt ?? '',
    }),
    []
  );

  // ✅ REACT QUERY: Fetch customer detail using useCustomer hook
  const { data: customerResponse, isLoading, error, refetch } = useCustomer(customerId);

  // Transform the response to match the expected Customer interface
  const customer = useMemo(() => {
    if (!customerResponse) {
      return null;
    }
    return mapApiToCustomer(customerResponse);
  }, [customerResponse, mapApiToCustomer]);

  // ✅ RESET FORM WHEN CUSTOMER DATA LOADS
  React.useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        email: customer.email,
        phone: customer.phone ?? '',
        website: customer.website ?? '',
        address: customer.address ?? '',
        country: customer.country ?? '',
        industry: customer.industry ?? undefined,
        revenue: customer.revenue ?? undefined,
        companySize: customer.companySize ?? '',
        tier: customer.tier ?? 'STANDARD',
        tags: customer.tags ?? [],
      });
    }
  }, [customer, reset]);

  // ✅ Initialize edit data when entering edit mode
  const handleEditToggle = useCallback(() => {
    if (!isEditing && customer) {
      const initialData: z.infer<typeof CustomerUpdateSchema> = {
        name: customer.name,
        industry: customer.industry ?? undefined,
        address: customer.address ?? undefined,
        country: customer.country ?? undefined,
        phone: customer.phone ?? undefined,
        website: customer.website ?? undefined,
        email: customer.email as string,
        tier: customer.tier as any,
        revenue: customer.revenue ?? undefined,
        companySize: customer.companySize ?? '',
        tags: customer.tags ? [...customer.tags] : [],
      };
      reset(initialData);
      setIsEditing(true);
    } else {
      setIsEditing(false);
      reset({
        name: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        country: '',
        industry: undefined,
        revenue: undefined,
        companySize: '',
        tier: 'STANDARD',
        tags: [],
      });
    }
  }, [isEditing, customer, reset]);

  // ✅ REACT QUERY: Update customer mutation
  const { mutateAsync: saveCustomer, isPending: isSaving } = useMutation({
    mutationFn: async (data: z.infer<typeof CustomerUpdateSchema>): Promise<Customer> => {
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
        country: data.country,
        industry: data.industry,
        tags: data.tags,
        metadata: {
          uiTier: data.tier,
        },
      };

      // Only add revenue if it's defined
      if (data.revenue !== undefined) {
        payload.revenue = data.revenue;
      }

      // Note: employeeCount field removed as it doesn't exist in Customer schema

      void logDebug('[CustomerProfile] Update start', {
        customerId,
        payloadKeys: Object.keys(payload),
        payload,
      });

      try {
        const response = await fetch(`/api/customers/${customerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to update customer');
        }

        const responseData: { ok: boolean; data: CustomerApiResponse } = await response.json();
        if (!responseData?.ok || !responseData.data) {
          throw new Error('Invalid response format');
        }

        const updated = mapApiToCustomer(responseData.data, customer ?? undefined);
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

  // ✅ FORM SUBMISSION HANDLER
  const onSubmit = async (data: z.infer<typeof CustomerUpdateSchema>) => {
    try {
      // Debug log to see what data is being submitted
      console.log('Form submission data:', data);
      console.log('Country field value:', data.country);

      await saveCustomer(data);
      setIsEditing(false);

      void logInfo('[CustomerProfile] Update success', {
        customerId,
        userStory: 'US-2.2',
        hypothesis: 'H4',
      });

      // ✅ ANALYTICS: Track successful update
      trackOptimized(
        'customer_updated',
        {
          userStory: 'US-2.2',
          hypothesis: 'H4',
          component: 'CustomerProfileClient',
          customerId,
        },
        'high'
      );
    } catch (error) {
      void logError('[CustomerProfile] Update failed', {
        customerId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-2.2',
        hypothesis: 'H4',
      });

      errorHandlingService.processError({
        message: 'Failed to update customer',
        code: ErrorCodes.DATA.QUERY_FAILED,
        metadata: {
          component: 'CustomerProfileClient',
          operation: 'UPDATE',
          customerId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  };

  // ✅ UI HELPERS
  const getTierDisplay = (tier: CustomerTier) => {
    const displays = {
      [CustomerTier.STANDARD]: { label: 'Standard', color: 'text-gray-600', bg: 'bg-gray-100' },
      [CustomerTier.PREMIUM]: { label: 'Premium', color: 'text-blue-600', bg: 'bg-blue-100' },
      [CustomerTier.ENTERPRISE]: {
        label: 'Enterprise',
        color: 'text-purple-600',
        bg: 'bg-purple-100',
      },
    } as const;
    return displays[tier] || displays[CustomerTier.STANDARD]; // Fallback to STANDARD if tier not found
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

  const tierDisplay = getTierDisplay((customer.tier as CustomerTier) || CustomerTier.STANDARD);

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
                    {...register('name')}
                    name="name"
                    label=""
                    error={errors.name?.message}
                    touched={!!touchedFields.name}
                    required
                    className="text-2xl font-bold text-gray-900"
                    inputClassName="text-2xl font-bold text-gray-900 border-b-2 bg-transparent focus:outline-none"
                    placeholder="Company name"
                  />
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="space-y-1">
                    <FormField
                      {...register('industry')}
                      name="industry"
                      label=""
                      error={errors.industry?.message}
                      touched={!!touchedFields.industry}
                      className="border-b bg-transparent focus:outline-none"
                      inputClassName="border-b bg-transparent focus:outline-none"
                      placeholder="Industry"
                    />
                  </div>
                  <span>•</span>
                  <div className="space-y-1">
                    <FormField
                      {...register('companySize')}
                      name="companySize"
                      label=""
                      type="text"
                      error={errors.companySize?.message}
                      touched={!!touchedFields.companySize}
                      className="w-20"
                      inputClassName="w-20 border-b bg-transparent focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <span>employees</span>
                  <span>•</span>
                  <div className="space-y-1">
                    <FormField
                      {...register('revenue', {
                        setValueAs: value => (value === '' ? undefined : Number(value)),
                      })}
                      name="revenue"
                      label=""
                      type="number"
                      error={errors.revenue?.message}
                      touched={!!touchedFields.revenue}
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
                  <span>{customer.companySize || 'N/A'} employees</span>
                  <span>•</span>
                  <span>
                    {customer.revenue ? formatLargeNumber(customer.revenue) : 'N/A'} revenue
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
                  onClick={handleSubmit(onSubmit)}
                  variant="primary"
                  className="flex items-center min-h-[44px]"
                  disabled={isSaving || !isValid}
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
      {isEditing && Object.keys(errors).length > 0 && (
        <div className="mb-6">
          <FormErrorSummary
            errors={Object.entries(errors).reduce(
              (acc, [key, error]) => {
                if (error?.message && typeof error.message === 'string') {
                  acc[key] = error.message;
                }
                return acc;
              },
              {} as Record<string, string>
            )}
          />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
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
                        {...register('name')}
                        name="name"
                        label=""
                        error={errors.name?.message}
                        touched={!!touchedFields.name}
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
                        {...register('address')}
                        name="address"
                        label=""
                        error={errors.address?.message}
                        touched={!!touchedFields.address}
                        className="flex-1"
                        inputClassName="flex-1 border-b bg-transparent focus:outline-none"
                        placeholder="Address"
                      />
                    ) : (
                      <span className="text-gray-700">{customer.address}</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <GlobeAltIcon className="w-5 h-5 text-gray-400 mr-3" />
                    {isEditing ? (
                      <div className="flex-1">
                        <SearchableCountrySelect
                          name="country"
                          label=""
                          placeholder="Search countries..."
                          size="sm"
                          register={register}
                          setValue={setValue}
                          watch={watch}
                          formErrors={errors}
                        />
                        {errors.country && (
                          <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-700">
                        {customer.country || 'N/A'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                    {isEditing ? (
                      <FormField
                        {...register('phone')}
                        name="phone"
                        label=""
                        type="tel"
                        error={errors.phone?.message}
                        touched={!!touchedFields.phone}
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
                        {...register('email')}
                        name="email"
                        label=""
                        type="email"
                        error={errors.email?.message}
                        touched={!!touchedFields.email}
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
                        {...register('website')}
                        name="website"
                        label=""
                        type="url"
                        error={errors.website?.message}
                        touched={!!touchedFields.website}
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
                    {customer.tags && customer.tags.length > 0 ? (
                      customer.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">No tags</span>
                    )}
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
                      <span
                        className={`text-lg font-bold ${getHealthColor(customer?.riskScore ? Number(customer.riskScore) : 50)}`}
                      >
                        {customer?.riskScore ? Number(customer.riskScore) : 50}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          (customer?.riskScore ? Number(customer.riskScore) : 50) >= 80
                            ? 'bg-green-500'
                            : (customer?.riskScore ? Number(customer.riskScore) : 50) >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{
                          width: `${customer?.riskScore ? Number(customer.riskScore) : 50}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Engagement:</span>
                      <div className="font-medium capitalize">medium</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Contact:</span>
                      <div className="font-medium">
                        {customer.lastContact
                          ? new Date(customer.lastContact).toLocaleDateString()
                          : 'Never'}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center text-sm text-blue-800">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Next action due: {new Date().toLocaleDateString()}
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
      </form>
    </div>
  );
}
