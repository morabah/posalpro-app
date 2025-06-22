'use client';

/**
 * PosalPro MVP2 - Proposal Creation Step 1: Basic Information
 * Based on PROPOSAL_CREATION_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration
 */

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useApiClient } from '@/hooks/useApiClient';
import { useResponsive } from '@/hooks/useResponsive';
import { ProposalPriority, ProposalWizardStep1Data } from '@/types/proposals';
import { zodResolver } from '@hookform/resolvers/zod';
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

// Validation schema based on wireframe requirements
const basicInformationSchema = z.object({
  client: z.object({
    id: z.string().min(1, 'Please select a customer'),
    name: z.string().min(1, 'Customer name is required'),
    industry: z.string().min(1, 'Industry is required'),
    contactPerson: z.string().min(1, 'Contact person is required'),
    contactEmail: z.string().email('Valid email is required'),
    contactPhone: z.string().min(1, 'Contact phone is required'),
    requirements: z.array(z.string()).optional(),
    previousEngagements: z.array(z.string()).optional(),
  }),
  details: z.object({
    title: z.string().min(1, 'Proposal title is required'),
    rfpReferenceNumber: z.string().optional(),
    dueDate: z.string().min(1, 'Due date is required'),
    estimatedValue: z.number().min(0, 'Estimated value must be positive'),
    priority: z.nativeEnum(ProposalPriority),
    description: z.string().optional(),
    requirements: z.array(z.string()).optional(),
    objectives: z.array(z.string()).optional(),
  }),
});

type BasicInformationFormData = z.infer<typeof basicInformationSchema>;

// Industry options based on common business sectors
const INDUSTRY_OPTIONS = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'education', label: 'Education' },
  { value: 'government', label: 'Government' },
  { value: 'nonprofit', label: 'Non-profit' },
  { value: 'other', label: 'Other' },
];

interface BasicInformationStepProps {
  data: Partial<ProposalWizardStep1Data>;
  onUpdate: (data: Partial<ProposalWizardStep1Data>) => void;
  analytics: any;
}

export function BasicInformationStep({ data, onUpdate, analytics }: BasicInformationStepProps) {
  // ✅ MOBILE OPTIMIZATION: Use centralized responsive detection
  const { isMobile, isTablet } = useResponsive();

  // ✅ FIXED: Use proper API client instead of direct fetch
  const apiClient = useApiClient();

  // Form state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [fieldInteractions, setFieldInteractions] = useState(0);
  const [dateWarning, setDateWarning] = useState<string | null>(null);

  // Performance optimization refs
  const lastSentDataRef = useRef<string>('');
  const onUpdateRef = useRef(onUpdate);
  const debouncedUpdateRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Update ref when onUpdate changes
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Utility functions
  const formatDateForInput = (dateValue: any): string => {
    if (!dateValue) return '';
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    }
    if (typeof dateValue === 'string') {
      return new Date(dateValue).toISOString().split('T')[0];
    }
    return '';
  };

  const parseDate = (dateValue: any): Date | null => {
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
    formState: { errors, isValid },
  } = useForm<BasicInformationFormData>({
    resolver: zodResolver(basicInformationSchema),
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
    // ✅ CRITICAL FIX: Mobile-optimized validation mode
    mode: isMobile ? 'onBlur' : 'onChange',
    reValidateMode: 'onBlur',
    criteriaMode: 'firstError',
  });

  // ✅ PERFORMANCE OPTIMIZATION: Debounced update function
  const debouncedHandleUpdate = useCallback(
    (formattedData: ProposalWizardStep1Data) => {
      // Clear existing timeout
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
      }

      // Set new timeout with mobile-optimized delay
      const delay = isMobile ? 500 : 300; // Longer delay on mobile for better performance
      debouncedUpdateRef.current = setTimeout(() => {
        const dataHash = JSON.stringify(formattedData);

        // Only update if data has actually changed
        if (dataHash !== lastSentDataRef.current) {
          lastSentDataRef.current = dataHash;
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
  }, [getValues]);

  // ✅ MOBILE-OPTIMIZED: Field change handler with debouncing
  const handleFieldChange = useCallback(
    (fieldName: string) => {
      return () => {
        // Track field interactions for analytics (throttled)
        setFieldInteractions(prev => prev + 1);

        // Mobile-optimized analytics throttling
        if (fieldInteractions % (isMobile ? 5 : 3) === 0) {
          analytics?.trackWizardStep?.(1, 'Basic Information', 'field_interaction', {
            fieldName,
            fieldInteractions: fieldInteractions + 1,
            isMobile,
          });
        }

        // Collect and update form data with debouncing
        const formData = collectFormData();
        debouncedHandleUpdate(formData);
      };
    },
    [collectFormData, debouncedHandleUpdate, analytics, fieldInteractions, isMobile]
  );

  // Fetch customers on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      setCustomersLoading(true);
      setCustomersError(null);
      try {
        // ✅ FIXED: Use apiClient instead of direct fetch to prevent /api/api/ URLs
        const response = (await apiClient.get('customers')) as {
          success: boolean;
          data?: { customers: Customer[] };
        };

        console.log('🔍 [DEBUG] Customers API response:', response);

        // ✅ FIXED: Proper response structure handling
        if (response.success && response.data?.customers) {
          const customerList = response.data.customers;
          setCustomers(customerList);

          // If we have a selected customer ID, find and set the customer
          if (data.client?.id) {
            const existingCustomer = customerList.find((c: Customer) => c.id === data.client?.id);
            if (existingCustomer) {
              setSelectedCustomer(existingCustomer);
            }
          }
        } else {
          console.error('🔍 [DEBUG] Invalid response structure:', response);
          setCustomers([]);
          setCustomersError('Unable to load customers. Please try again.');
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        setCustomers([]);

        // ✅ ENHANCED: Better error handling with user-friendly messages
        if (error instanceof Error) {
          if (error.message.includes('401')) {
            setCustomersError('Please log in to access customer data.');
            console.error('Authentication required - user may need to log in again');
          } else if (error.message.includes('404')) {
            setCustomersError('Customer service is temporarily unavailable.');
            console.error('Customers API endpoint not found');
          } else if (error.message.includes('500')) {
            setCustomersError('Server error. Please try again in a few moments.');
            console.error('Server error while fetching customers');
          } else {
            setCustomersError(
              'Unable to load customers. Please check your connection and try again.'
            );
            console.error('Network or unknown error:', error.message);
          }
        } else {
          setCustomersError('An unexpected error occurred. Please try again.');
          console.error('Unknown error type:', typeof error, error);
        }
      } finally {
        setCustomersLoading(false);
      }
    };

    fetchCustomers();
  }, [data.client?.id, apiClient]);

  // Handle customer selection
  const handleCustomerChange = useCallback(
    (customerId: string) => {
      const customer = customers.find((c: Customer) => c.id === customerId);
      if (customer) {
        setSelectedCustomer(customer);

        // Update form values
        setValue('client.id', customer.id);
        setValue('client.name', customer.name);
        setValue('client.industry', customer.industry || '');
        setValue('client.contactEmail', customer.email || '');

        // Trigger analytics
        analytics?.trackWizardStep?.(1, 'Basic Information', 'customer_selected', {
          customerId: customer.id,
          customerName: customer.name,
          customerTier: customer.tier,
        });

        // Trigger field change handler
        handleFieldChange('client.id')();
      }
    },
    [customers, setValue, analytics, handleFieldChange]
  );

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

        // Track analytics for past date selection
        if (analytics?.trackWizardStep) {
          analytics?.trackWizardStep?.(1, 'Basic Information', 'error', {
            selectedDate: dateString,
            errorType: 'past_date_warning',
            daysPast: Math.floor(
              (today.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24)
            ),
          });
        }
      } else if (selectedDate.getTime() === today.getTime()) {
        setDateWarning(
          "💡 You've selected today's date. Consider choosing a future date to allow adequate time for proposal completion."
        );

        // Track analytics for same day selection
        if (analytics?.trackWizardStep) {
          analytics?.trackWizardStep?.(1, 'Basic Information', 'error', {
            selectedDate: dateString,
            errorType: 'same_day_warning',
          });
        }
      } else {
        setDateWarning(null);

        // Track successful future date selection
        analytics?.trackWizardStep?.(1, 'Basic Information', 'future_date_selected', {
          selectedDate: dateString,
          daysInFuture: Math.floor(
            (selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          ),
        });
      }
    },
    [analytics]
  );

  // Validate initial date if present when component loads
  useEffect(() => {
    if (data.details?.dueDate) {
      const dateString = formatDateForInput(data.details.dueDate);
      if (dateString) {
        validateDueDate(dateString);
      }
    }
  }, [data.details?.dueDate, formatDateForInput, validateDueDate]);

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
                options={customers.map(customer => ({
                  value: customer.id,
                  label: customer.name,
                }))}
                placeholder={customersLoading ? 'Loading customers...' : 'Select a customer...'}
                disabled={customersLoading}
                className="mobile-select-enhanced ios-select-optimized touch-target-enhanced"
              />
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
                  {selectedCustomer.tier && ` • ${selectedCustomer.tier} tier`}
                  {selectedCustomer.email && ` • ${selectedCustomer.email}`}
                </div>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label className="form-label mobile-focus-enhanced">Contact Person *</label>
              <Input
                {...register('client.contactPerson')}
                onChange={handleFieldChange('client.contactPerson')}
                className="mobile-input-enhanced ios-input-optimized touch-target-enhanced"
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
                onChange={handleFieldChange('client.contactEmail')}
                type="email"
                className="mobile-input-enhanced ios-input-optimized touch-target-enhanced"
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
                onChange={handleFieldChange('client.contactPhone')}
                type="tel"
                className="mobile-input-enhanced ios-input-optimized touch-target-enhanced"
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
                onChange={handleFieldChange('details.title')}
                className="mobile-input-enhanced ios-input-optimized touch-target-enhanced"
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
                onChange={handleFieldChange('details.rfpReferenceNumber')}
                className="mobile-input-enhanced ios-input-optimized touch-target-enhanced"
                placeholder="RFP-2024-001"
              />
              {errors.details?.rfpReferenceNumber && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.details.rfpReferenceNumber.message}
                </p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="form-label mobile-focus-enhanced">Due Date *</label>
              <Input
                {...register('details.dueDate')}
                onChange={e => {
                  validateDueDate(e.target.value);
                  handleFieldChange('details.dueDate')();
                }}
                type="date"
                className="mobile-input-enhanced ios-input-optimized touch-target-enhanced"
              />
              {dateWarning && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">{dateWarning}</p>
                </div>
              )}
              {errors.details?.dueDate && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.details.dueDate.message}
                </p>
              )}
            </div>

            {/* Estimated Value */}
            <div>
              <label className="form-label mobile-focus-enhanced">Estimated Value ($)</label>
              <Input
                {...register('details.estimatedValue', { valueAsNumber: true })}
                onChange={handleFieldChange('details.estimatedValue')}
                type="number"
                min="0"
                step="1000"
                className="mobile-input-enhanced ios-input-optimized touch-target-enhanced"
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
                  handleFieldChange('details.priority')();
                }}
                options={[
                  { value: ProposalPriority.HIGH, label: 'High Priority' },
                  { value: ProposalPriority.MEDIUM, label: 'Medium Priority' },
                  { value: ProposalPriority.LOW, label: 'Low Priority' },
                ]}
                className="mobile-select-enhanced ios-select-optimized touch-target-enhanced"
              />
              {errors.details?.priority && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.details.priority.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="form-label mobile-focus-enhanced">Description</label>
              <textarea
                {...register('details.description')}
                onChange={handleFieldChange('details.description')}
                className="form-field mobile-input-enhanced ios-input-optimized touch-target-enhanced"
                rows={4}
                placeholder="Provide a brief description of the proposal scope and objectives..."
              />
              {errors.details?.description && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.details.description.message}
                </p>
              )}
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
        <div className="text-sm text-neutral-500">Complete all required fields to continue</div>
      </div>
    </div>
  );
}
