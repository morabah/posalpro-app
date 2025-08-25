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
import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { StandardError } from '@/lib/errors/StandardError';
import { logDebug, logError, logInfo } from '@/lib/logger';
// RBAC handled by createRoute wrapper in API routes
import type { CustomerEditData } from '@/lib/validation/customerValidation';
import { customerValidationSchema } from '@/lib/validation/customerValidation';
import { ApiResponse } from '@/types/api';
import { ArrowLeftIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

interface CustomerResponse {
  id: string;
  name: string;
  email: string;
}

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
  error,
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
      validateOnChange: true,
      validateOnBlur: true,
    }
  );

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

  // ✅ SECURITY: Input sanitization for form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Use the validation hook to check for errors
      if (validation.hasErrors) {
        handleAsyncError(
          new StandardError({
            message: 'Please fix the validation errors before creating the customer',
            code: ErrorCodes.VALIDATION.INVALID_INPUT,
            metadata: {
              component: 'CustomerCreationPage',
              operation: 'form_validation',
            },
          })
        );
        return;
      }

      // Validate all fields
      const errors = validation.validateAll();
      if (Object.keys(errors).length > 0) {
        handleAsyncError(
          new StandardError({
            message: `Validation failed: ${Object.values(errors).join(', ')}`,
            code: ErrorCodes.VALIDATION.INVALID_INPUT,
            metadata: {
              component: 'CustomerCreationPage',
              operation: 'form_validation',
            },
          })
        );
        return;
      }

      setLoading(true);

      try {
        // ✅ SECURITY: Permissions handled by createRoute wrapper in API
        // No manual RBAC validation needed in client code

        logDebug('Customer creation: Starting API call', {
          component: 'CustomerCreationPage',
          operation: 'customer_create',
          userStory: 'US-2.1',
          hypothesis: 'H4',
          formData: { name: validation.formData.name, email: validation.formData.email },
        });

        const response = await apiClient.post<ApiResponse<CustomerResponse>>(
          '/api/customers',
          validation.formData
        );

        if (response.success) {
          logInfo('Customer creation: Success', {
            component: 'CustomerCreationPage',
            operation: 'customer_create_success',
            userStory: 'US-2.1',
            hypothesis: 'H4',
            customerId: response.data!.id,
          });

          // ✅ ANALYTICS: Track successful creation
          analytics(
            'customer_created',
            {
              userStory: 'US-2.1',
              hypothesis: 'H4',
              component: 'CustomerCreationPage',
              customerId: response.data!.id,
              customerName: response.data!.name,
            },
            'high'
          );

          // Navigate to the newly created customer
          router.push(`/customers/${response.data!.id}`);
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
    },
    [validation, apiClient, router, handleAsyncError, analytics]
  );

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
                    onSubmit={handleSubmit}
                    className="p-6 space-y-6"
                    role="form"
                    aria-label="Customer creation form"
                  >
                    {/* Validation Error Summary */}
                    {validation.hasErrors && (
                      <FormErrorSummary errors={validation.validationErrors} />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <FormField
                          name="name"
                          label="Company Name"
                          value={validation.formData.name}
                          onChange={value => validation.handleFieldChange('name', value)}
                          onBlur={() => validation.handleFieldBlur('name')}
                          error={validation.getFieldError('name')}
                          touched={validation.isFieldTouched('name')}
                          required
                          placeholder="Enter company name"
                          className="min-h-[44px]"
                        />

                        <FormField
                          name="email"
                          label="Email Address"
                          type="email"
                          value={validation.formData.email}
                          onChange={value => validation.handleFieldChange('email', value)}
                          onBlur={() => validation.handleFieldBlur('email')}
                          error={validation.getFieldError('email')}
                          touched={validation.isFieldTouched('email')}
                          required
                          placeholder="customer@example.com"
                          className="min-h-[44px]"
                        />

                        <FormField
                          name="phone"
                          label="Phone Number"
                          type="tel"
                          value={validation.formData.phone}
                          onChange={value => validation.handleFieldChange('phone', value)}
                          onBlur={() => validation.handleFieldBlur('phone')}
                          error={validation.getFieldError('phone')}
                          touched={validation.isFieldTouched('phone')}
                          placeholder="+1 (555) 123-4567"
                          className="min-h-[44px]"
                        />
                      </div>

                      {/* Company Information */}
                      <div className="space-y-4">
                        <FormField
                          name="industry"
                          label="Industry"
                          value={validation.formData.industry}
                          onChange={value => validation.handleFieldChange('industry', value)}
                          onBlur={() => validation.handleFieldBlur('industry')}
                          error={validation.getFieldError('industry')}
                          touched={validation.isFieldTouched('industry')}
                          placeholder="Technology, Healthcare, Finance, etc."
                          className="min-h-[44px]"
                        />

                        <FormField
                          name="address"
                          label="Address"
                          value={validation.formData.address}
                          onChange={value => validation.handleFieldChange('address', value)}
                          onBlur={() => validation.handleFieldBlur('address')}
                          error={validation.getFieldError('address')}
                          touched={validation.isFieldTouched('address')}
                          placeholder="Enter full address"
                          className="min-h-[44px]"
                        />

                        <FormField
                          name="website"
                          label="Website"
                          type="url"
                          value={validation.formData.website}
                          onChange={value => validation.handleFieldChange('website', value)}
                          onBlur={() => validation.handleFieldBlur('website')}
                          error={validation.getFieldError('website')}
                          touched={validation.isFieldTouched('website')}
                          placeholder="https://example.com"
                          className="min-h-[44px]"
                        />
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        name="annualRevenue"
                        label="Annual Revenue"
                        type="number"
                        value={validation.formData.annualRevenue}
                        onChange={value => validation.handleFieldChange('annualRevenue', value)}
                        onBlur={() => validation.handleFieldBlur('annualRevenue')}
                        error={validation.getFieldError('annualRevenue')}
                        touched={validation.isFieldTouched('annualRevenue')}
                        placeholder="0"
                        className="min-h-[44px]"
                      />

                      <FormField
                        name="employeeCount"
                        label="Employee Count"
                        type="number"
                        value={validation.formData.employeeCount}
                        onChange={value => validation.handleFieldChange('employeeCount', value)}
                        onBlur={() => validation.handleFieldBlur('employeeCount')}
                        error={validation.getFieldError('employeeCount')}
                        touched={validation.isFieldTouched('employeeCount')}
                        placeholder="0"
                        className="min-h-[44px]"
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
                        disabled={loading || validation.hasErrors || !validation.isValid}
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
