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
import { apiClient } from '@/lib/api/client';
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
  // Customer dropdown state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [fieldInteractions, setFieldInteractions] = useState(0);
  const lastSentDataRef = useRef<string>('');
  const onUpdateRef = useRef(onUpdate);

  // Keep the ref updated
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
    mode: 'onChange',
  });

  const watchedValues = watch();

  // Track field interactions for analytics
  const handleFieldInteraction = useCallback(() => {
    setFieldInteractions(prev => prev + 1);
    analytics.trackWizardStep(1, 'Basic Information', 'start', {
      fieldInteractions: fieldInteractions + 1,
    });
  }, [analytics, fieldInteractions]);

  // Handle customer selection
  const handleCustomerChange = useCallback(
    (customerId: string) => {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setSelectedCustomer(customer);

        // Update form values
        setValue('client.id', customer.id);
        setValue('client.name', customer.name);
        setValue('client.industry', customer.industry || '');
        setValue('client.contactEmail', customer.email || '');

        // Trigger analytics
        analytics.trackWizardStep(1, 'Basic Information', 'customer_selected', {
          customerId: customer.id,
          customerName: customer.name,
          customerTier: customer.tier,
        });

        handleFieldInteraction();
      }
    },
    [customers, setValue, analytics, handleFieldInteraction]
  );

  // Fetch customers on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      setCustomersLoading(true);
      try {
        const response = await apiClient.get<{ data: { customers: Customer[] } }>('/customers');

        console.log('🔍 [DEBUG] Customers API response:', response);

        if (response.success && response.data?.data?.customers) {
          const customerList = response.data.data.customers;
          setCustomers(customerList);

          // If we have a selected customer ID, find and set the customer
          if (data.client?.id) {
            const existingCustomer = customerList.find(c => c.id === data.client?.id);
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
  }, [data.client?.id]);

  // Stable update function to prevent infinite loops
  const handleUpdate = useCallback(
    (formattedData: ProposalWizardStep1Data) => {
      const dataHash = JSON.stringify(formattedData);

      // Only update if data has actually changed
      if (dataHash !== lastSentDataRef.current) {
        lastSentDataRef.current = dataHash;
        onUpdateRef.current(formattedData);
      }
    },
    [] // Now we can safely remove dependencies since we use the ref
  );

  // Create a memoized stable reference for the watched values
  const stableWatchedValues = useMemo(() => {
    return {
      clientId: watchedValues.client?.id || '',
      clientName: watchedValues.client?.name || '',
      clientIndustry: watchedValues.client?.industry || '',
      clientContactPerson: watchedValues.client?.contactPerson || '',
      clientContactEmail: watchedValues.client?.contactEmail || '',
      clientContactPhone: watchedValues.client?.contactPhone || '',
      detailsTitle: watchedValues.details?.title || '',
      detailsRfpReference: watchedValues.details?.rfpReferenceNumber || '',
      detailsDueDate: watchedValues.details?.dueDate || '',
      detailsEstimatedValue: watchedValues.details?.estimatedValue || 0,
      detailsPriority: watchedValues.details?.priority || ProposalPriority.MEDIUM,
      detailsDescription: watchedValues.details?.description || '',
    };
  }, [
    watchedValues.client?.id,
    watchedValues.client?.name,
    watchedValues.client?.industry,
    watchedValues.client?.contactPerson,
    watchedValues.client?.contactEmail,
    watchedValues.client?.contactPhone,
    watchedValues.details?.title,
    watchedValues.details?.rfpReferenceNumber,
    watchedValues.details?.dueDate,
    watchedValues.details?.estimatedValue,
    watchedValues.details?.priority,
    watchedValues.details?.description,
  ]);

  // Update parent component when form data changes
  useEffect(() => {
    const parsedDueDate = parseDate(stableWatchedValues.detailsDueDate);

    const formattedData: ProposalWizardStep1Data = {
      client: {
        id: stableWatchedValues.clientId,
        name: stableWatchedValues.clientName,
        industry: stableWatchedValues.clientIndustry,
        contactPerson: stableWatchedValues.clientContactPerson,
        contactEmail: stableWatchedValues.clientContactEmail,
        contactPhone: stableWatchedValues.clientContactPhone,
      },
      details: {
        title: stableWatchedValues.detailsTitle,
        rfpReferenceNumber: stableWatchedValues.detailsRfpReference,
        dueDate: parsedDueDate || new Date(),
        estimatedValue: stableWatchedValues.detailsEstimatedValue,
        priority: stableWatchedValues.detailsPriority,
        description: stableWatchedValues.detailsDescription,
      },
    };

    handleUpdate(formattedData);
  }, [handleUpdate, stableWatchedValues]);

  // AI-powered suggestions for client information (placeholder)
  const handleClientNameBlur = useCallback(
    (clientName: string) => {
      if (clientName.length > 2) {
        // Simulate AI suggestions for industry and previous engagements
        analytics.trackWizardStep(1, 'Basic Information', 'start', {
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
    <div className="space-y-8">
      {/* Client Information Section */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6">Client Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                onFocus={handleFieldInteraction}
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

            <div>
              <Label htmlFor="industry" required>
                Client Industry
              </Label>
              <Select
                id="industry"
                options={INDUSTRY_OPTIONS}
                error={errors.client?.industry?.message}
                {...register('client.industry')}
                onChange={(value: string) => {
                  setValue('client.industry', value);
                  handleFieldInteraction();
                }}
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
                onFocus={handleFieldInteraction}
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
                onFocus={handleFieldInteraction}
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
                onFocus={handleFieldInteraction}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Proposal Details Section */}
      <Card>
        <div className="p-6">
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
                onFocus={handleFieldInteraction}
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
                  onFocus={handleFieldInteraction}
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
                  onFocus={handleFieldInteraction}
                />
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
                    onFocus={handleFieldInteraction}
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
                        onChange={() => handleFieldInteraction()}
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
                onFocus={handleFieldInteraction}
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
