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
import { ProposalPriority, ProposalWizardStep1Data } from '@/types/proposals';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
    name: z.string().min(1, 'Client name is required'),
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

interface BasicInformationStepProps {
  data: Partial<ProposalWizardStep1Data>;
  onUpdate: (data: Partial<ProposalWizardStep1Data>) => void;
  analytics: any;
}

// Industry options based on common business sectors
const INDUSTRY_OPTIONS = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'education', label: 'Education' },
  { value: 'government', label: 'Government' },
  { value: 'non-profit', label: 'Non-Profit' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'other', label: 'Other' },
];

export function BasicInformationStep({ data, onUpdate, analytics }: BasicInformationStepProps) {
  const [fieldInteractions, setFieldInteractions] = useState(0);
  const lastSentDataRef = useRef<string>('');
  const onUpdateRef = useRef(onUpdate);

  // Keep onUpdate ref current
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  // Helper function to safely format date for input
  const formatDateForInput = (dateValue: any): string => {
    if (!dateValue) return '';

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';

    return date.toISOString().split('T')[0];
  };

  // Helper function to safely parse date
  const parseDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;

    return date;
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

  // Update parent component when form data changes (with debouncing and data comparison)
  useEffect(() => {
    if (watchedValues.client && watchedValues.details) {
      // Only process if we have meaningful data
      const hasRequiredData =
        stableWatchedValues.clientName ||
        stableWatchedValues.detailsTitle ||
        stableWatchedValues.detailsDueDate;

      if (!hasRequiredData) return;

      // Debounce the update
      const timeoutId = setTimeout(() => {
        const parsedDueDate = parseDate(stableWatchedValues.detailsDueDate);

        const formattedData: ProposalWizardStep1Data = {
          client: {
            name: stableWatchedValues.clientName,
            industry: stableWatchedValues.clientIndustry,
            contactPerson: stableWatchedValues.clientContactPerson,
            contactEmail: stableWatchedValues.clientContactEmail,
            contactPhone: stableWatchedValues.clientContactPhone,
            requirements: [],
            previousEngagements: [],
          },
          details: {
            title: stableWatchedValues.detailsTitle,
            rfpReferenceNumber: stableWatchedValues.detailsRfpReference,
            dueDate: parsedDueDate || new Date(), // Fallback to current date if invalid
            estimatedValue: stableWatchedValues.detailsEstimatedValue,
            priority: stableWatchedValues.detailsPriority,
            description: stableWatchedValues.detailsDescription,
            requirements: [],
            objectives: [],
          },
        };

        // Use the stable update function
        handleUpdate(formattedData);
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [stableWatchedValues, handleUpdate]);

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

  return (
    <div className="space-y-8">
      {/* Client Information Section */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6">Client Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="clientName" required>
                Client Name
              </Label>
              <Input
                id="clientName"
                placeholder="Acme Corporation"
                error={errors.client?.name?.message}
                {...register('client.name')}
                onFocus={handleFieldInteraction}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) =>
                  handleClientNameBlur(e.target.value)
                }
              />
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
        <div className="text-sm text-neutral-600">Field interactions: {fieldInteractions}</div>
      </div>
    </div>
  );
}
