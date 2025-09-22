/**
 * PosalPro MVP2 - Customer Creation Page
 * Enhanced with Bridge Pattern for centralized state management
 * Based on CUSTOMER_PROFILE_SCREEN.md wireframe specifications
 * ✅ INTEGRATED: New Validation Library
 *
 * User Stories: US-2.1, US-2.2
 * Hypothesis Coverage: H4 (Cross-Department Coordination - 40% reduction)
 * Component Traceability: CustomerCreationForm, CustomerProfileManager
 */

'use client';

// Removed old bridge import - using new architecture
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { FormActions, FormErrorSummary, FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/forms/Button';
import { Select, type SelectOption } from '@/components/ui/forms/Select';
import { SearchableCountrySelect } from '@/components/ui/SearchableCountrySelect';
import { useApiClient } from '@/hooks/useApiClient';
import { useEmailValidation } from '@/hooks/useEmailValidation';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { StandardError } from '@/lib/errors/StandardError';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { toast } from 'sonner';
// RBAC handled by createRoute wrapper in API routes
import { CreateCustomerData } from '@/lib/validation/schemas/customer';
import { ArrowLeftIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

// Type alias for form data
type CustomerFormData = CreateCustomerData;

// Simplified customer creation schema for the form
const customerCreationSchema = z.object({
  name: z
    .string()
    .min(1, 'Company name is required')
    .max(200, 'Company name must be less than 200 characters'),
  // Email is required to align with API POST /api/customers
  email: z.string().email('Please enter a valid email address'),
  // Phone is optional in API; allow empty string in form
  phone: z
    .string()
    .refine(val => val === '' || val.length >= 1, {
      message: 'Phone number is required',
    })
    .optional(),
  website: z
    .string()
    .refine(val => val === '' || z.string().url().safeParse(val).success, {
      message: 'Please enter a valid website URL',
    })
    .optional(),
  address: z.string().max(200, 'Address must be less than 200 characters').optional(),
  country: z.string().max(100, 'Country must be less than 100 characters').optional(),
  industry: z
    .enum([
      'technology',
      'healthcare',
      'finance',
      'manufacturing',
      'retail',
      'education',
      'government',
      'nonprofit',
      'real_estate',
      'transportation',
      'energy',
      'telecommunications',
      'media',
      'consulting',
      'agriculture',
      'automotive',
      'aerospace',
      'construction',
      'other',
    ])
    .default('technology'),
  // Treat empty string as undefined so untouched field doesn't fail validation
  revenue: z.preprocess(
    val => (val === '' || val === null ? undefined : val),
    z.number().min(0, 'Revenue must be a positive number').optional()
  ),
  companySize: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).default('small'),
  tier: z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE', 'VIP']).default('STANDARD'),
  customerType: z
    .enum([
      'MIDDLEMAN',
      'ENDUSER',
      'DISTRIBUTOR',
      'VENDOR',
      'CONTRACTOR',
      'GOVERNMENTAL',
      'NGO',
      'SYSTEM_INTEGRATOR',
    ])
    .default('ENDUSER'),
  tags: z.array(z.string()).default([]),
});

const DEFAULT_INDUSTRY = 'technology';
const DEFAULT_COMPANY_SIZE = 'small';
const DEFAULT_CUSTOMER_TYPE = 'ENDUSER';

const INDUSTRY_OPTIONS: SelectOption[] = [
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

const COMPANY_SIZE_OPTIONS: SelectOption[] = [
  { value: 'startup', label: 'Startup (1-10 employees)' },
  { value: 'small', label: 'Small (11-50 employees)' },
  { value: 'medium', label: 'Medium (51-250 employees)' },
  { value: 'large', label: 'Large (251-1000 employees)' },
  { value: 'enterprise', label: 'Enterprise (1000+ employees)' },
];

const CUSTOMER_TYPE_OPTIONS: SelectOption[] = [
  { value: 'MIDDLEMAN', label: 'Middle Man' },
  { value: 'ENDUSER', label: 'End User' },
  { value: 'DISTRIBUTOR', label: 'Distributor' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'CONTRACTOR', label: 'Contractor' },
  { value: 'GOVERNMENTAL', label: 'Governmental' },
  { value: 'NGO', label: 'NGO' },
  { value: 'SYSTEM_INTEGRATOR', label: 'System Integrator' },
];

// ✅ SEO METADATA: Page metadata component
function CustomerCreationMetadata() {
  return (
    <Head>
      <title>Create Customer | PosalPro</title>
      <meta
        name="description"
        content="Create a new customer in PosalPro's comprehensive customer management system."
      />
      <meta name="keywords" content="customer creation, new customer, CRM, customer management" />
      <meta property="og:title" content="Create Customer | PosalPro" />
      <meta property="og:description" content="Create a new customer in PosalPro." />
      <meta property="og:type" content="website" />
    </Head>
  );
}

// ✅ SSR OPTIMIZATION: Dynamic import for performance optimization
// dynamic import
const CustomerCreationPage = dynamic(() => Promise.resolve(CustomerCreationPageComponent), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ),
});

// ✅ REMOVED: AuthGuard - AuthenticationGuard already handles auth
// RBAC is handled by createRoute wrapper in API routes

// ✅ SIMPLIFIED: Single authentication guard
function AuthenticationGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

// ✅ BRIDGE COMPLIANCE: Add error boundary wrapper
function CustomerCreationErrorFallback({
  error: _error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            We encountered an error while loading the customer creation page.
          </p>
          <Button onClick={resetErrorBoundary} variant="primary">
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}

// ✅ HYDRATION SAFE: Client-only component
function CustomerCreationPageComponent() {
  const apiClient = useApiClient();
  const { handleAsyncError } = useErrorHandler();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // ✅ REACT HOOK FORM SETUP
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
    watch,
    getValues,
    setValue,
    trigger,
  } = useForm<z.infer<typeof customerCreationSchema>>({
    resolver: zodResolver(customerCreationSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      country: '',
      industry: DEFAULT_INDUSTRY,
      revenue: undefined,
      companySize: DEFAULT_COMPANY_SIZE,
      tier: 'STANDARD',
      customerType: DEFAULT_CUSTOMER_TYPE,
      tags: [],
    },
  });

  // ✅ EMAIL UNIQUENESS VALIDATION HOOK
  const emailValidation = useEmailValidation({
    debounceMs: 500, // 500ms debounce for better UX
    apiEndpoint: '/api/customers/validate-email',
    userStory: 'US-1.1', // Customer Management
    hypothesis: 'H1', // Customer Experience
    entityType: 'Customer',
  });

  // ✅ ANALYTICS INTEGRATION: Page view tracking
  useEffect(() => {
    logDebug('Customer creation page: Analytics tracking initialized', {
      component: 'CustomerCreationPage',
      operation: 'analytics_init',
      userStory: 'US-2.1',
      hypothesis: 'H4',
    });

    analytics(
      'page_viewed',
      {
        page: 'customer_creation',
        userStory: 'US-2.1',
        hypothesis: 'H4',
        component: 'CustomerCreationPage',
      },
      'high'
    );

    // ✅ SECURITY: Security audit logging
    logInfo('Customer creation page accessed', {
      component: 'CustomerCreationPage',
      operation: 'page_access',
      userStory: 'US-2.1',
      hypothesis: 'H4',
      timestamp: new Date().toISOString(),
    });
  }, [analytics]);

  // ✅ Robust validity computation (guards against custom input integration quirks)
  const watchedValues = watch();
  const canSubmit = customerCreationSchema.safeParse(watchedValues).success;

  // ✅ DEBUG: Log form validation state
  useEffect(() => {
    const formValues = watch();
    logDebug('Form validation state:', {
      isValid,
      errors: Object.keys(errors).length > 0 ? errors : 'no errors',
      touchedFields: Object.keys(touchedFields),
      formValues,
      component: 'CustomerCreationPage',
      operation: 'form_validation_debug',
    });
  }, [isValid, errors, touchedFields, watch]);

  // ✅ Handle form submission with React Hook Form
  const onSubmit = async (data: z.infer<typeof customerCreationSchema>) => {
    setLoading(true);

    try {
      // ✅ SECURITY: Permissions handled by createRoute wrapper in API
      // No manual RBAC validation needed in client code

      logDebug('Customer creation: Starting API call', {
        component: 'CustomerCreationPage',
        operation: 'customer_create',
        userStory: 'US-2.1',
        hypothesis: 'H4',
        formData: { name: data.name, email: data.email },
      });

      // Accept both ApiResponse { success, data } and minimal { ok, data } shapes
      const response: any = await apiClient.post('/api/customers', data);
      const isSuccess = response?.success === true || response?.ok === true;
      const payload = response?.data ?? response;

      if (isSuccess && payload?.id) {
        logInfo('Customer creation: Success', {
          component: 'CustomerCreationPage',
          operation: 'customer_create_success',
          userStory: 'US-2.1',
          hypothesis: 'H4',
          customerId: payload.id,
        });

        // ✅ ANALYTICS: Track successful creation
        analytics(
          'customer_created',
          {
            userStory: 'US-2.1',
            hypothesis: 'H4',
            component: 'CustomerCreationPage',
            customerId: payload.id,
            customerName: payload.name,
          },
          'high'
        );

        // ✅ SUCCESS MESSAGE: Show success toast
        toast.success(`${payload.name} has been created successfully!`, {
          description: 'Customer created and ready for use',
          duration: 4000,
        });

        // Navigate to the newly created customer
        router.push(`/customers/${payload.id}`);
      } else {
        // Defensive: handle unexpected response shape
        throw new StandardError({
          message: 'Unexpected response from server while creating customer',
          code: ErrorCodes.API.INVALID_RESPONSE,
          metadata: { component: 'CustomerCreationPage', operation: 'customer_create' },
        });
      }
    } catch (error) {
      logError('Customer creation: Failed', {
        component: 'CustomerCreationPage',
        operation: 'customer_create_error',
        userStory: 'US-2.1',
        hypothesis: 'H4',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

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

  // ✅ PERFORMANCE METRICS: Performance monitoring
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const startTime = performance.now();
      return () => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        analytics(
          'page_performance',
          {
            component: 'CustomerCreationPage',
            loadTime: Math.round(loadTime),
            userStory: 'US-2.1',
            hypothesis: 'H4',
          },
          'medium'
        );
      };
    }
  }, [analytics]);

  return (
    <>
      {/* ✅ SEO METADATA: Page metadata */}
      <CustomerCreationMetadata />

      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <AuthenticationGuard>
          <ErrorBoundary FallbackComponent={CustomerCreationErrorFallback}>
            <div className="min-h-screen bg-gray-50" data-testid="customer-creation-page">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Link
                        href="/customers"
                        className="inline-flex items-center text-gray-600 hover:text-gray-900"
                        aria-label="Back to customers list"
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

                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="p-6 space-y-6"
                    role="form"
                    aria-label="Customer creation form"
                  >
                    {/* Validation Error Summary */}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <FormField
                          {...register('name')}
                          name="name"
                          label="Company Name"
                          error={errors.name?.message}
                          touched={!!touchedFields.name}
                          required
                          placeholder="Enter company name"
                          className="min-h-[44px]"
                        />

                        <FormField
                          {...register('email')}
                          name="email"
                          label="Email Address"
                          type="email"
                          error={errors.email?.message}
                          touched={!!touchedFields.email}
                          required
                          placeholder="customer@example.com"
                          className="min-h-[44px]"
                        />

                        <FormField
                          {...register('phone')}
                          name="phone"
                          label="Phone Number"
                          type="tel"
                          error={errors.phone?.message}
                          touched={!!touchedFields.phone}
                          placeholder="+1 (555) 123-4567"
                          className="min-h-[44px]"
                        />
                      </div>

                      {/* Company Information */}
                      <div className="space-y-4">
                        <Controller
                          name="industry"
                          control={control}
                          defaultValue={DEFAULT_INDUSTRY}
                          render={({ field, fieldState }) => {
                            const shouldShowError =
                              (fieldState.isTouched || fieldState.isDirty) && !!fieldState.error;
                            const currentValue =
                              (field.value as string | undefined) ?? DEFAULT_INDUSTRY;

                            return (
                              <Select
                                label="Industry *"
                                placeholder="Select industry"
                                options={INDUSTRY_OPTIONS}
                                value={currentValue}
                                onChange={value => {
                                  const normalizedValue = Array.isArray(value) ? value[0] : value;
                                  field.onChange(normalizedValue || undefined);
                                  field.onBlur();
                                }}
                                disabled={loading}
                                error={shouldShowError ? fieldState.error?.message : undefined}
                              />
                            );
                          }}
                        />

                        <FormField
                          {...register('address')}
                          name="address"
                          label="Address"
                          error={errors.address?.message}
                          touched={!!touchedFields.address}
                          placeholder="Enter full address"
                          className="min-h-[44px]"
                        />

                        <SearchableCountrySelect
                          name="country"
                          label="Country"
                          placeholder="Search countries..."
                          size="md"
                          register={register}
                          setValue={setValue as any}
                          watch={watch}
                          formErrors={errors}
                        />

                        <FormField
                          {...register('website')}
                          name="website"
                          label="Website"
                          type="url"
                          error={errors.website?.message}
                          touched={!!touchedFields.website}
                          placeholder="https://example.com"
                          className="min-h-[44px]"
                        />
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        {...register('revenue', {
                          setValueAs: value => (value === '' ? undefined : Number(value)),
                        })}
                        name="revenue"
                        label="Annual Revenue"
                        type="number"
                        error={errors.revenue?.message}
                        touched={!!touchedFields.revenue}
                        placeholder="0"
                        className="min-h-[44px]"
                      />

                      <Controller
                        name="companySize"
                        control={control}
                        defaultValue={DEFAULT_COMPANY_SIZE}
                        render={({ field, fieldState }) => {
                          const shouldShowError =
                            (fieldState.isTouched || fieldState.isDirty) && !!fieldState.error;
                          const currentValue =
                            (field.value as string | undefined) ?? DEFAULT_COMPANY_SIZE;

                          return (
                            <Select
                              label="Company Size *"
                              placeholder="Select company size"
                              options={COMPANY_SIZE_OPTIONS}
                              value={currentValue}
                              onChange={value => {
                                const normalizedValue = Array.isArray(value) ? value[0] : value;
                                field.onChange(normalizedValue || undefined);
                                field.onBlur();
                              }}
                              disabled={loading}
                              error={shouldShowError ? fieldState.error?.message : undefined}
                            />
                          );
                        }}
                      />

                      <Controller
                        name="customerType"
                        control={control}
                        defaultValue={DEFAULT_CUSTOMER_TYPE}
                        render={({ field, fieldState }) => {
                          const shouldShowError =
                            (fieldState.isTouched || fieldState.isDirty) && !!fieldState.error;
                          const currentValue =
                            (field.value as string | undefined) ?? DEFAULT_CUSTOMER_TYPE;

                          return (
                            <Select
                              label="Customer Type *"
                              placeholder="Select customer type"
                              options={CUSTOMER_TYPE_OPTIONS}
                              value={currentValue}
                              onChange={value => {
                                const normalizedValue = Array.isArray(value) ? value[0] : value;
                                field.onChange(normalizedValue || undefined);
                                field.onBlur();
                              }}
                              disabled={loading}
                              error={shouldShowError ? fieldState.error?.message : undefined}
                            />
                          );
                        }}
                      />
                    </div>

                    {/* Form Actions */}
                    <FormActions>
                      <Link
                        href="/customers"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </Link>
                      <Button
                        type="submit"
                        disabled={loading || !(canSubmit || isValid)}
                        className="inline-flex items-center min-h-[44px] px-4 py-2"
                        aria-label={loading ? 'Creating customer...' : 'Create customer'}
                        data-testid="create-customer-submit"
                      >
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
                    </FormActions>
                  </form>
                </div>
              </div>
            </div>
          </ErrorBoundary>
        </AuthenticationGuard>
      </Suspense>
    </>
  );
}

// ✅ EXPORT DEFAULT: Export the dynamic component
export default CustomerCreationPage;
