'use client';

/**
 * PosalPro MVP2 - Proposal Creation Step 1: Basic Information
 * Based on PROPOSAL_CREATION_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration
 */

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
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
  const apiClient = useApiClient();

  // Form state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
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
      try {
        // ✅ ENHANCED: Mobile performance optimization with centralized detection
        const endpoint = isMobile
          ? '/customers?limit=50&fields=id,name,email,industry,tier'
          : '/customers';

        const response = await apiClient.get(endpoint);

        console.log('🔍 [DEBUG] Customers API response:', response);

        if (response && Array.isArray(response)) {
          const customerList = response;
          setCustomers(customerList);

          // If we have a selected customer ID, find and set the customer
          if (data.client?.id) {
            const existingCustomer = customerList.find((c: Customer) => c.id === data.client?.id);
            if (existingCustomer) {
              setSelectedCustomer(existingCustomer);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setCustomersLoading(false);
      }
    };

    fetchCustomers();
  }, [data.client?.id, isMobile]); // ✅ FIXED: Added ieMobile dependency for proper optimization

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
    <div className={`space-y-8 ${isMobile ? 'react-hook-form-mobile mobile-form-enhanced' : ''}`}>
      {/* Client Information Section */}
      <Card>
        <div className={`p-6 ${isMobile ? 'form-container' : ''}`}>
          <h3 className="text-lg font-semibold text-neutral-900 mb-6">Client Information</h3>

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isMobile ? 'form-grid' : ''}`}>
            <div className="md:col-span-2">
              <Label htmlFor="clientSelect" required>
                Select Customer
              </Label>
              <Select
                id="clientSelect"
                options={customerOptions}
                value={selectedCustomer?.id || ''}
                error={errors.client?.id?.message}
                placeholder={customersLoading ? 'Loading customers...' : 'Select a customer...'}
                onChange={handleCustomerChange}
                onFocus={handleFieldChange('client.id')}
                disabled={customersLoading}
              />
              {selectedCustomer && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Selected:</strong> {selectedCustomer.name}
                    {selectedCustomer.industry && ` • ${selectedCustomer.industry}`}
                    {selectedCustomer.tier && ` • ${selectedCustomer.tier} tier`}
                    {selectedCustomer.email && ` • ${selectedCustomer.email}`}
                  </p>
                </div>
              )}
            </div>

            <div className={`${isMobile ? 'form-field-container' : ''}`}>
              <Label htmlFor="industry" required>
                Client Industry
              </Label>
              <Select
                id="industry"
                options={INDUSTRY_OPTIONS}
                error={errors.client?.industry?.message}
                onChange={(value: string) => {
                  setValue('client.industry', value);
                  handleFieldChange('client.industry')();
                }}
                onFocus={handleFieldChange('client.industry')}
              />
            </div>

            <div>
              <Label htmlFor="contactPerson" required>
                Contact Person
              </Label>
              <Input
                id="contactPerson"
                placeholder="Jane Smith"
                error={errors.client?.contactPerson?.message}
                {...register('client.contactPerson')}
                onFocus={handleFieldChange('client.contactPerson')}
              />
            </div>

            <div>
              <Label htmlFor="contactEmail" required>
                Contact Email
              </Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="j.smith@acme.com"
                error={errors.client?.contactEmail?.message}
                {...register('client.contactEmail')}
                onFocus={handleFieldChange('client.contactEmail')}
              />
            </div>

            <div>
              <Label htmlFor="contactPhone" required>
                Contact Phone
              </Label>
              <Input
                id="contactPhone"
                placeholder="(555) 123-4567"
                error={errors.client?.contactPhone?.message}
                {...register('client.contactPhone')}
                onFocus={handleFieldChange('client.contactPhone')}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Proposal Details Section */}
      <Card>
        <div className={`p-6 ${isMobile ? 'form-container' : ''}`}>
          <h3 className="text-lg font-semibold text-neutral-900 mb-6">Proposal Details</h3>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <Label htmlFor="proposalTitle" required>
                Proposal Title
              </Label>
              <Input
                id="proposalTitle"
                placeholder="Cloud Migration Services"
                error={errors.details?.title?.message}
                {...register('details.title')}
                onFocus={handleFieldChange('details.title')}
              />
              {errors.details?.title && (
                <p className="text-sm text-error-600 mt-1">Title is required</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="rfpReference">RFP Reference Number</Label>
                <Input
                  id="rfpReference"
                  placeholder="ACME-2025-103"
                  {...register('details.rfpReferenceNumber')}
                  onFocus={handleFieldChange('details.rfpReferenceNumber')}
                />
              </div>

              <div>
                <Label htmlFor="dueDate" required>
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  error={errors.details?.dueDate?.message}
                  {...register('details.dueDate')}
                  onFocus={handleFieldChange('details.dueDate')}
                  onChange={e => {
                    // Update form value
                    setValue('details.dueDate', e.target.value);

                    // Validate the selected date
                    validateDueDate(e.target.value);

                    // Track field interaction
                    handleFieldChange('details.dueDate')();
                  }}
                />
                {dateWarning && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800">{dateWarning}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="estimatedValue" required>
                  Estimated Value
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500">
                    $
                  </span>
                  <Input
                    id="estimatedValue"
                    type="number"
                    placeholder="250,000"
                    className="pl-8"
                    error={errors.details?.estimatedValue?.message}
                    {...register('details.estimatedValue', { valueAsNumber: true })}
                    onFocus={handleFieldChange('details.estimatedValue')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="priority" required>
                  Priority
                </Label>
                <div className="flex items-center space-x-4 mt-2">
                  {Object.values(ProposalPriority).map(priority => (
                    <label key={priority} className="flex items-center">
                      <input
                        type="radio"
                        value={priority}
                        className="mr-2 text-primary-600 focus:ring-primary-500"
                        {...register('details.priority')}
                        onChange={() => handleFieldChange('details.priority')()}
                      />
                      <span className="text-sm text-neutral-700 capitalize">{priority}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea
                id="description"
                rows={4}
                className="form-field"
                placeholder="Brief description of the proposal requirements..."
                {...register('details.description')}
                onFocus={handleFieldChange('details.description')}
              />
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
