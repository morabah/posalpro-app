'use client';

/**
 * PosalPro MVP2 - Proposal Creation Step 1: Basic Information
 * Based on PROPOSAL_CREATION_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration
 */

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useResponsive } from '@/components/ui/ResponsiveBreakpointManager';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { EnhancedProposalAnalytics } from '@/types/analytics';
import { ProposalPriority, ProposalWizardStep1Data } from '@/types/proposals';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Customer interface for dropdown
interface Customer {
  id: string;
  name: string;
  email?: string;
  industry?: string;
  tier?: string;
  status?: string;
}

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1'],
  acceptanceCriteria: ['AC-4.1.1'],
  methods: ['complexityEstimation()', 'initializeTracking()'],
  hypotheses: ['H7'],
  testCases: ['TC-H7-001'],
};

// ✅ FIXED: Validation schema based on wireframe requirements
const basicInformationSchema = z.object({
  client: z.object({
    id: z.string().min(1, 'Valid customer selection is required'),
    name: z.string().min(1, 'Customer name is required'),
    industry: z.string().optional(), // ✅ FIXED: Make industry optional since it comes from customer data
    contactPerson: z.string().min(1, 'Contact person is required'),
    contactEmail: z.string().email('Valid email is required'),
    contactPhone: z.string().optional(), // ✅ FIXED: Make phone optional for better UX
    requirements: z.array(z.string()).optional(),
    previousEngagements: z.array(z.string()).optional(),
  }),
  details: z.object({
    title: z.string().min(1, 'Proposal title is required'),
    rfpReferenceNumber: z.string().optional(),
    dueDate: z.string().min(1, 'Due date is required'),
    estimatedValue: z.number().min(0, 'Estimated value must be positive').optional(),
    priority: z.nativeEnum(ProposalPriority),
    description: z
      .string()
      .refine(val => !val || val.length >= 10, {
        message: 'Description must be at least 10 characters long',
      })
      .optional(), // ✅ FIXED: Description optional but when provided must be 10+ chars
    requirements: z.array(z.string()).optional(),
    objectives: z.array(z.string()).optional(),
  }),
});

type BasicInformationFormData = z.infer<typeof basicInformationSchema>;

// Industry options based on common business sectors (lazy to reduce initial heap)
const getIndustryOptions = () => ([
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'education', label: 'Education' },
  { value: 'government', label: 'Government' },
  { value: 'nonprofit', label: 'Non-profit' },
  { value: 'other', label: 'Other' },
]);

interface BasicInformationStepProps {
  data: Partial<ProposalWizardStep1Data>;
  onUpdate: (data: Partial<ProposalWizardStep1Data>) => void;
  analytics: EnhancedProposalAnalytics;
}

export function BasicInformationStep({ data, onUpdate, analytics }: BasicInformationStepProps) {
  // ✅ MOBILE OPTIMIZATION: Use centralized responsive detection
  const { state } = useResponsive();
  const { isMobile, isTablet } = state;

  // ✅ FIXED: Use proper API client instead of direct fetch
  const apiClient = useApiClient();

  // ✅ STANDARDIZED ERROR HANDLING: Use ErrorHandlingService
  const errorHandlingService = ErrorHandlingService.getInstance();
  const { handleAsyncError } = useErrorHandler();

  // State management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [fieldInteractions, setFieldInteractions] = useState(0);

  // ✅ PERFORMANCE OPTIMIZATION: Refs for preventing excessive re-renders
  const onUpdateRef = useRef(onUpdate);
  const debouncedUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentDataRef = useRef<string>('');
  const lastAnalyticsTime = useRef<number>(0); // ✅ NEW: Analytics throttling
  const lastFutureDateAnalytics = useRef<number>(0);

  // Update ref when onUpdate changes
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Utility functions
  const formatDateForInput = (dateValue: string | Date | null | undefined): string => {
    if (!dateValue) return '';
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    }
    if (typeof dateValue === 'string') {
      return new Date(dateValue).toISOString().split('T')[0];
    }
    return '';
  };

  const parseDate = (dateValue: string | Date | null | undefined): Date | null => {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') return new Date(dateValue);
    return null;
  };

  // ✅ PERFORMANCE FIX: Mobile-optimized form configuration
  const {
    register,
    setValue,
    getValues,
    trigger,
    reset,
    formState: { errors, isValid, isValidating, touchedFields },
  } = useForm<BasicInformationFormData>({
    resolver: zodResolver(basicInformationSchema),
    mode: 'onBlur', // ✅ CRITICAL FIX: Changed from 'onChange' to 'onBlur' to prevent excessive validation
    reValidateMode: 'onBlur', // Only re-validate when field loses focus
    defaultValues: {
      client: {
        id: data.client?.id || '',
        name: data.client?.name || '',
        industry: data.client?.industry || '',
        contactPerson: data.client?.contactPerson || '',
        contactEmail: data.client?.contactEmail || '',
        contactPhone: data.client?.contactPhone || '',
      },
      details: {
        title: data.details?.title || '',
        rfpReferenceNumber: data.details?.rfpReferenceNumber || '',
        dueDate: formatDateForInput(data.details?.dueDate),
        estimatedValue: data.details?.estimatedValue || 0,
        priority: data.details?.priority || ProposalPriority.MEDIUM,
        description: data.details?.description || '',
      },
    },
  });

  // ✅ CRITICAL FIX: Prevent duplicate API calls with request deduplication
  const isRequestInProgress = useRef(false);

  // Fetch customers lazily on first user intent (focus/open), not always on mount
  const hasAttemptedFetch = useRef(false);

  const fetchCustomers = useCallback(async () => {
      // ✅ CRITICAL: Prevent duplicate requests
      if (isRequestInProgress.current) {
        console.log('🔍 [BasicInformationStep] Request already in progress, skipping...');
        return;
      }

      // ✅ CRITICAL: Check if we already have customers loaded
      if (customers.length > 0) {
        console.log('🔍 [BasicInformationStep] Customers already loaded, skipping fetch...');
        return;
      }

      try {
        isRequestInProgress.current = true;
        setCustomersLoading(true);
        setCustomersError(null);

        console.log('🔍 [BasicInformationStep] Fetching customers (limit=10, sortBy=name)...');
        const response = await apiClient.get<{
          success: boolean;
          data?: { customers: Customer[] };
          message?: string;
        }>(`/customers?page=1&limit=10&sortBy=name&sortOrder=asc`);

        console.log('🔍 [BasicInformationStep] Raw API response:', response);

        // ✅ ENHANCED: Better response validation
        if (response && typeof response === 'object') {
          if (
            response.success &&
            response.data?.customers &&
            Array.isArray(response.data.customers)
          ) {
            const customerList = response.data.customers;
            console.log('✅ [BasicInformationStep] Loaded customers:', customerList.length);
            setCustomers(customerList);
          } else if (response.success === false) {
            // ✅ STANDARDIZED ERROR HANDLING: Use ErrorHandlingService
            const standardError = errorHandlingService.processError(
              new Error(`API returned error: ${response.message || 'Unknown error'}`),
              'Unable to load customers. Please try again.',
              ErrorCodes.API.RESPONSE_ERROR,
              {
                component: 'BasicInformationStep',
                operation: 'fetchCustomers',
                endpoint: '/customers',
                response: response,
              }
            );
            setCustomers([]);
            setCustomersError(errorHandlingService.getUserFriendlyMessage(standardError));
          } else {
            // ✅ STANDARDIZED ERROR HANDLING: Use ErrorHandlingService
            const standardError = errorHandlingService.processError(
              new Error('Invalid response structure'),
              'Unable to load customers. Please try again.',
              ErrorCodes.API.INVALID_RESPONSE,
              {
                component: 'BasicInformationStep',
                operation: 'fetchCustomers',
                endpoint: '/customers',
                response: response,
              }
            );
            setCustomers([]);
            setCustomersError(errorHandlingService.getUserFriendlyMessage(standardError));
          }
        } else {
          // ✅ STANDARDIZED ERROR HANDLING: Use ErrorHandlingService
          const standardError = errorHandlingService.processError(
            new Error('Empty or invalid response'),
            'Unable to load customers. Please try again.',
            ErrorCodes.API.INVALID_RESPONSE,
            {
              component: 'BasicInformationStep',
              operation: 'fetchCustomers',
              endpoint: '/customers',
              response: response,
            }
          );
          setCustomers([]);
          setCustomersError(errorHandlingService.getUserFriendlyMessage(standardError));
        }
      } catch (error) {
        // ✅ STANDARDIZED ERROR HANDLING: Use ErrorHandlingService
        const standardError = errorHandlingService.processError(
          error,
          'Unable to load customers. Please try again.',
          ErrorCodes.API.REQUEST_FAILED,
          {
            component: 'BasicInformationStep',
            operation: 'fetchCustomers',
            endpoint: '/customers',
          }
        );

        setCustomers([]);
        setCustomersError(errorHandlingService.getUserFriendlyMessage(standardError));
      } finally {
        setCustomersLoading(false);
        isRequestInProgress.current = false;
      }
    hasAttemptedFetch.current = true;
  }, [apiClient, customers.length, errorHandlingService]);

  // Trigger fetch when user focuses the customer field or opens the dropdown
  const handleCustomerFieldFocus = useCallback(() => {
    if (!hasAttemptedFetch.current && !customersLoading && customers.length === 0) {
      fetchCustomers();
    }
  }, [customers.length, customersLoading, fetchCustomers]);

  // ✅ PERFORMANCE OPTIMIZATION: Debounced update function - SIMPLIFIED
  const debouncedHandleUpdate = useCallback(
    (formattedData: ProposalWizardStep1Data) => {
      // ✅ CRITICAL FIX: Check for data changes BEFORE setting timeout
      const dataHash = JSON.stringify(formattedData);
      if (dataHash === lastSentDataRef.current) {
        return; // Skip if data is identical
      }

      // Clear existing timeout
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
      }

      // Set new timeout with longer delay to prevent excessive calls
      const delay = isMobile ? 750 : 500; // Increased delay for stability
      debouncedUpdateRef.current = setTimeout(() => {
        // Double-check that data has changed just before sending
        const currentHash = JSON.stringify(formattedData);
        if (currentHash !== lastSentDataRef.current) {
          lastSentDataRef.current = currentHash;
          onUpdateRef.current(formattedData);
        }
      }, delay);
    },
    [isMobile]
  );

  // ✅ OPTIMIZED: Manual form data collection instead of watch()
  const collectFormData = useCallback((): ProposalWizardStep1Data => {
    const currentValues = getValues();
    const parsedDueDate = parseDate(currentValues.details?.dueDate);

    // ✅ PERFORMANCE FIX: Remove error logging to prevent infinite loops
    // Only log when there are actual errors to troubleshoot (not on every call)
    // if (Object.keys(errors).length > 0) {
    //   console.log('[BasicInformationStep] Form errors detected:', errors);
    // }

    return {
      client: {
        id: currentValues.client?.id || '',
        name: currentValues.client?.name || '',
        industry: currentValues.client?.industry || '',
        contactPerson: currentValues.client?.contactPerson || '',
        contactEmail: currentValues.client?.contactEmail || '',
        contactPhone: currentValues.client?.contactPhone || '',
      },
      details: {
        title: currentValues.details?.title || '',
        rfpReferenceNumber: currentValues.details?.rfpReferenceNumber || '',
        dueDate: parsedDueDate || new Date(),
        estimatedValue: currentValues.details?.estimatedValue || 0,
        priority: currentValues.details?.priority || ProposalPriority.MEDIUM,
        description: currentValues.details?.description || '',
      },
    };
  }, [getValues]); // ✅ CRITICAL FIX: Remove errors from dependencies to prevent infinite loops

  // ✅ MOBILE-OPTIMIZED: Field change handler with debouncing - PERFORMANCE OPTIMIZED
  const handleFieldChange = useCallback(
    (fieldName: string) => {
      return () => {
        // ⚡ IMMEDIATE: Return early if mobile throttling prevents spam
        const currentTime = Date.now();

        // ⚡ ASYNC: Defer heavy operations to prevent UI blocking
        requestAnimationFrame(() => {
          // Track field interactions for analytics (heavily throttled)
          if (currentTime - lastAnalyticsTime.current > 10000) {
            lastAnalyticsTime.current = currentTime;
            try {
              analytics?.trackWizardStep?.(1, 'Basic Information', 'field_interaction', {
                fieldName,
                isMobile,
              });
            } catch (error) {
              // Silently ignore analytics errors
            }
          }

          // ⚡ LIGHTWEIGHT: Use shorter delay and collect data asynchronously
          setTimeout(() => {
            try {
              const formData = collectFormData();
              debouncedHandleUpdate(formData);
            } catch (error) {
              // Silently ignore collection errors to prevent crashes
            }
          }, 100); // Reduced delay from 200ms to 100ms for responsiveness
        });
      };
    },
    [collectFormData, debouncedHandleUpdate, isMobile] // Stable dependencies only
  );

  // ✅ SEPARATE EFFECT: Handle pre-selected customer when data changes
  useEffect(() => {
    if (data.client?.id && customers.length > 0) {
      const existingCustomer = customers.find((c: Customer) => c.id === data.client?.id);
      if (existingCustomer && !selectedCustomer) {
        setSelectedCustomer(existingCustomer);
        // ✅ CRITICAL FIX: Ensure form values are set when customer is pre-selected
        setValue('client.id', existingCustomer.id, { shouldValidate: false }); // Don't trigger validation on init
        setValue('client.name', existingCustomer.name, { shouldValidate: false });
        setValue('client.industry', existingCustomer.industry || '', { shouldValidate: false });
        setValue('client.contactEmail', existingCustomer.email || '', { shouldValidate: false });

        // ✅ CRITICAL FIX: Don't call debouncedHandleUpdate on initialization
        // This prevents immediate updates that conflict with user input
        console.log('[BasicInformationStep] Pre-selected customer:', existingCustomer.name);
      }
    }
  }, [data.client?.id, customers, selectedCustomer, setValue]); // ✅ Stable dependencies

  // ✅ FIXED: Handle customer selection with proper form validation
  const handleCustomerChange = useCallback(
    (customerId: string) => {
      const customer = customers.find((c: Customer) => c.id === customerId);
      if (customer) {
        setSelectedCustomer(customer);

        // ✅ CRITICAL FIX: Update form values and trigger validation
        setValue('client.id', customer.id, { shouldValidate: true });
        setValue('client.name', customer.name, { shouldValidate: true });
        setValue('client.industry', customer.industry || '', { shouldValidate: true });
        setValue('client.contactEmail', customer.email || '', { shouldValidate: true });

        // ✅ FIXED: Trigger form validation to clear errors (including email)
        trigger(['client.id', 'client.name', 'client.industry', 'client.contactEmail']);

        // Trigger analytics
        analytics?.trackWizardStep?.(1, 'Basic Information', 'customer_selected', {
          customerId: customer.id,
          customerName: customer.name,
          customerTier: customer.tier,
        });

        // ✅ CRITICAL FIX: Don't call handleFieldChange recursively - just collect and update directly
        // This prevents infinite loops from customer selection → field change → customer selection
        const formData = collectFormData();
        debouncedHandleUpdate(formData);
      }
    },
    [customers, setValue, trigger, analytics, collectFormData, debouncedHandleUpdate]
  ); // ✅ CRITICAL FIX: Remove handleFieldChange from dependencies to prevent recursion

  // Validate due date and show warnings for past dates
  const validateDueDate = useCallback(
    (dateString: string) => {
      if (!dateString) {
        setDateWarning(null);
        return;
      }

      const selectedDate = new Date(dateString);
      const today = new Date();

      // Set time to start of day for accurate comparison
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        setDateWarning(
          '⚠️ The selected date is in the past. Please choose a future date for your proposal deadline.'
        );

        // Track analytics for past date selection (heavily throttled)
        const currentTime = Date.now();
        if (currentTime - lastAnalyticsTime.current > 30000) {
          // ✅ INCREASED: 30 second throttle for error events
          try {
            analytics?.trackWizardStep?.(1, 'Basic Information', 'error', {
              selectedDate: dateString,
              errorType: 'past_date_warning',
              daysPast: Math.floor(
                (today.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24)
              ),
            });
            lastAnalyticsTime.current = currentTime;
          } catch (error) {
            // Silently ignore analytics errors
          }
        }
      } else if (selectedDate.getTime() === today.getTime()) {
        setDateWarning(
          "💡 You've selected today's date. Consider choosing a future date to allow adequate time for proposal completion."
        );

        // Track analytics for same day selection (heavily throttled)
        const currentTime = Date.now();
        if (currentTime - lastAnalyticsTime.current > 30000) {
          // ✅ INCREASED: 30 second throttle for warning events
          try {
            analytics?.trackWizardStep?.(1, 'Basic Information', 'error', {
              selectedDate: dateString,
              errorType: 'same_day_warning',
            });
            lastAnalyticsTime.current = currentTime;
          } catch (error) {
            // Silently ignore analytics errors
          }
        }
      } else {
        setDateWarning(null);

        // ✅ CRITICAL FIX: Use separate ref for future date analytics to prevent overlap
        const currentTime = Date.now();
        if (currentTime - lastFutureDateAnalytics.current > 60000) {
          // ✅ INCREASED: 60 second throttle for future date selection (much less important)
          try {
            analytics?.trackWizardStep?.(1, 'Basic Information', 'future_date_selected', {
              selectedDate: dateString,
              daysInFuture: Math.floor(
                (selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              ),
            });
            lastFutureDateAnalytics.current = currentTime;
          } catch (error) {
            // Silently ignore analytics errors
          }
        }
      }
    },
    [] // ✅ CRITICAL FIX: Remove analytics from dependencies to prevent infinite re-creation
  );

  // AI-powered suggestions for client information (placeholder)
  const handleClientNameBlur = useCallback(
    (clientName: string) => {
      if (clientName.length > 2) {
        // Simulate AI suggestions for industry and previous engagements
        analytics?.trackWizardStep?.(1, 'Basic Information', 'start', {
          aiSuggestionsShown: 1,
          suggestedIndustry: true,
        });
      }
    },
    [analytics]
  );

  // Create customer options for dropdown
  const customerOptions = useMemo(() => {
    return customers.map(customer => ({
      value: customer.id,
      label: `${customer.name}${customer.tier ? ` (${customer.tier})` : ''}${customer.industry ? ` - ${customer.industry}` : ''}`,
    }));
  }, [customers]);

  return (
    <div className="space-y-8 mobile-form-enhanced">
      {/* ✅ NEW: Validation Summary - Show all errors at once */}
      {Object.keys(errors).length > 0 && (
        <Card className="mobile-card-enhanced">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  Please fix the following errors to continue:
                </h4>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  {errors.client?.id && <li>Customer selection is required</li>}
                  {errors.client?.contactPerson && <li>Contact person is required</li>}
                  {errors.client?.contactEmail && <li>{errors.client.contactEmail.message}</li>}
                  {errors.details?.title && <li>Proposal title is required</li>}
                  {errors.details?.dueDate && <li>Due date is required</li>}
                  {errors.details?.description && <li>{errors.details.description.message}</li>}
                  {errors.details?.estimatedValue && (
                    <li>{errors.details.estimatedValue.message}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Client Information Section */}
      <Card className="mobile-card-enhanced">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 mobile-text-responsive">
            Client Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mobile-grid-responsive">
            {/* Customer Selection */}
            <div className="md:col-span-2">
              <label className="form-label mobile-focus-enhanced">Select Customer *</label>
              <Select
                value={selectedCustomer?.id || ''}
                onChange={handleCustomerChange}
                onFocus={handleCustomerFieldFocus}
                options={customers.map(customer => ({
                  value: customer.id,
                  label: customer.name,
                }))}
                placeholder={customersLoading ? 'Loading customers...' : 'Select a customer...'}
                disabled={customersLoading}
                className={`mobile-select-enhanced ios-select-optimized touch-target-enhanced ${
                  errors.client?.id ? 'border-red-300' : ''
                }`}
              />
              {/* ✅ CRITICAL FIX: Hidden input to properly register with react-hook-form */}
              <input
                type="hidden"
                {...register('client.id', { required: 'Valid customer selection is required' })}
                value={selectedCustomer?.id || ''}
              />
              {/* ✅ CRITICAL FIX: Show validation errors for customer selection */}
              {errors.client?.id && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.client.id.message}
                </p>
              )}
              {/* ✅ ENHANCED: Show error message when customers fail to load */}
              {customersError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800" role="alert">
                    {customersError}
                  </p>
                </div>
              )}
              {selectedCustomer && (
                <div className="mt-2 text-sm text-gray-600 mobile-caption">
                  {selectedCustomer.industry && ` • ${selectedCustomer.industry}`}
                  {selectedCustomer.tier && ` (${selectedCustomer.tier})`}
                </div>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label className="form-label mobile-focus-enhanced">Contact Person *</label>
              <Input
                {...register('client.contactPerson')}
                onBlur={async () => {
                  // ✅ CRITICAL FIX: Trigger validation for contact person field specifically
                  await trigger('client.contactPerson');
                  handleFieldChange('client.contactPerson')();
                }}
                className={`mobile-input-enhanced ios-input-optimized touch-target-enhanced ${
                  errors.client?.contactPerson ? 'border-red-300' : ''
                }`}
                placeholder="Primary contact name"
              />
              {errors.client?.contactPerson && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.client.contactPerson.message}
                </p>
              )}
            </div>

            {/* Contact Email */}
            <div>
              <label className="form-label mobile-focus-enhanced">Contact Email *</label>
              <Input
                {...register('client.contactEmail')}
                onBlur={async () => {
                  // ✅ CRITICAL FIX: Trigger validation for email field specifically
                  await trigger('client.contactEmail');
                  handleFieldChange('client.contactEmail')();
                }}
                type="email"
                className={`mobile-input-enhanced ios-input-optimized touch-target-enhanced ${
                  errors.client?.contactEmail ? 'border-red-300' : ''
                }`}
                placeholder="contact@company.com"
              />
              {errors.client?.contactEmail && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.client.contactEmail.message}
                </p>
              )}
            </div>

            {/* Contact Phone */}
            <div>
              <label className="form-label mobile-focus-enhanced">Contact Phone</label>
              <Input
                {...register('client.contactPhone')}
                onBlur={handleFieldChange('client.contactPhone')}
                type="tel"
                className={`mobile-input-enhanced ios-input-optimized touch-target-enhanced ${
                  errors.client?.contactPhone ? 'border-red-300' : ''
                }`}
                placeholder="+1 (555) 123-4567"
              />
              {errors.client?.contactPhone && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.client.contactPhone.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Proposal Details Section */}
      <Card className="mobile-card-enhanced">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 mobile-text-responsive">
            Proposal Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mobile-grid-responsive">
            {/* Proposal Title */}
            <div className="md:col-span-2">
              <label className="form-label mobile-focus-enhanced">Proposal Title *</label>
              <Input
                {...register('details.title')}
                onBlur={() => {
                  setTimeout(() => {
                    const formData = collectFormData();
                    debouncedHandleUpdate(formData);
                  }, 100);
                }}
                className={`mobile-input-enhanced ios-input-optimized touch-target-enhanced ${
                  errors.details?.title ? 'border-red-300' : ''
                }`}
                placeholder="Enter a descriptive title for your proposal"
              />
              {errors.details?.title && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.details.title.message}
                </p>
              )}
            </div>

            {/* RFP Reference Number */}
            <div>
              <label className="form-label mobile-focus-enhanced">RFP Reference Number</label>
              <Input
                {...register('details.rfpReferenceNumber')}
                onBlur={() => {
                  setTimeout(() => {
                    const formData = collectFormData();
                    debouncedHandleUpdate(formData);
                  }, 100);
                }}
                className={`mobile-input-enhanced ios-input-optimized touch-target-enhanced ${
                  errors.details?.rfpReferenceNumber ? 'border-red-300' : ''
                }`}
                placeholder="RFP-2024-001"
              />
              {errors.details?.rfpReferenceNumber && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.details.rfpReferenceNumber.message}
                </p>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                Due Date{' '}
                <span className="text-red-500" aria-label="Required field">
                  *
                </span>
              </label>
              <input
                id="dueDate"
                type="date"
                {...register('details.dueDate', { required: 'Due date is required' })}
                className={`
                  w-full px-3 py-2 border rounded-md text-sm transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${errors.details?.dueDate ? 'border-red-300' : 'border-gray-300'}
                `}
                aria-describedby="dueDate-error"
                aria-invalid={!!errors.details?.dueDate}
                onBlur={e => {
                  // ✅ CRITICAL FIX: Single handler to prevent infinite loops
                  const dateValue = e.target.value;

                  // Validate the date and show warnings
                  validateDueDate(dateValue);

                  // Update form data (this will trigger the parent update)
                  setTimeout(() => {
                    const formData = collectFormData();
                    debouncedHandleUpdate(formData);
                  }, 150); // Small delay to ensure form state is updated
                }}
              />
              {dateWarning && (
                <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800">{dateWarning}</p>
                </div>
              )}
              {errors.details?.dueDate && (
                <p
                  id="dueDate-error"
                  className="text-sm text-red-600"
                  role="alert"
                  aria-live="polite"
                >
                  {errors.details.dueDate.message}
                </p>
              )}
            </div>

            {/* Estimated Value */}
            <div>
              <label className="form-label mobile-focus-enhanced">Estimated Value ($)</label>
              <Input
                {...register('details.estimatedValue', { valueAsNumber: true })}
                onBlur={() => {
                  setTimeout(() => {
                    const formData = collectFormData();
                    debouncedHandleUpdate(formData);
                  }, 100);
                }}
                type="number"
                min="0"
                step="1000"
                className={`mobile-input-enhanced ios-input-optimized touch-target-enhanced ${
                  errors.details?.estimatedValue ? 'border-red-300' : ''
                }`}
                placeholder="100000"
              />
              {errors.details?.estimatedValue && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.details.estimatedValue.message}
                </p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="form-label mobile-focus-enhanced">Priority *</label>
              <Select
                {...register('details.priority')}
                onChange={value => {
                  setValue('details.priority', value as ProposalPriority);
                  setTimeout(() => {
                    const formData = collectFormData();
                    debouncedHandleUpdate(formData);
                  }, 100);
                }}
                options={[
                  { value: ProposalPriority.HIGH, label: 'High Priority' },
                  { value: ProposalPriority.MEDIUM, label: 'Medium Priority' },
                  { value: ProposalPriority.LOW, label: 'Low Priority' },
                ]}
                className={`mobile-select-enhanced ios-select-optimized touch-target-enhanced ${
                  errors.details?.priority ? 'border-red-300' : ''
                }`}
              />
              {errors.details?.priority && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.details.priority.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="form-label mobile-focus-enhanced">Description *</label>
              <Textarea
                {...register('details.description')}
                onBlur={() => {
                  setTimeout(() => {
                    const formData = collectFormData();
                    debouncedHandleUpdate(formData);
                  }, 100);
                }}
                rows={4}
                className={`mobile-textarea-enhanced ios-textarea-optimized resize-none touch-target-enhanced ${
                  errors.details?.description ? 'border-red-300' : ''
                }`}
                placeholder="Provide a brief description of the proposal objectives and scope..."
              />
              {errors.details?.description && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.details.description.message}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">Minimum 10 characters required</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${isValid ? 'bg-success-600' : 'bg-neutral-300'}`}
          />
          <span className="text-sm text-neutral-600">
            Step 1 of 6: {isValid ? 'Complete' : 'In Progress'}
          </span>
        </div>
        <div className="text-sm text-neutral-500">
          {isValid ? '✓ All fields completed' : `${Object.keys(errors).length} error(s) to fix`}
        </div>
      </div>

      {/* ✅ NEW: Form Completion Guide */}
      {!isValid && (
        <Card className="mobile-card-enhanced">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">!</span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-800 mb-1">
                  Complete Required Information
                </h4>
                <p className="text-sm text-blue-700">
                  Fill out all required fields marked with (*) to proceed to the next step.
                  {Object.keys(errors).length > 0 && ' Check the errors listed above for guidance.'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
