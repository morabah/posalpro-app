'use client';

/**
 * PosalPro MVP2 - Modern Basic Information Step
 * Built from scratch using React Query and modern patterns
 * Follows PROPOSAL_MIGRATION_ASSESSMENT.md guidelines
 * Maps to database fields: title, description, customerId, dueDate, priority, value, currency, projectType
 */

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Select } from '@/components/ui/forms/Select';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { useApiClient } from '@/hooks/useApiClient';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug } from '@/lib/logger';
import { ProposalBasicInfo, useProposalActions } from '@/lib/store/proposalStore';
import { CalendarIcon, CurrencyDollarIcon, UserIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

// Customer interface
interface Customer {
  id: string;
  name: string;
  email?: string;
  industry?: string;
  tier?: string;
  status?: string;
}

// Priority options
const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low Priority' },
  { value: 'MEDIUM', label: 'Medium Priority' },
  { value: 'HIGH', label: 'High Priority' },
];

// Currency options
const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
];

// Project type options
const PROJECT_TYPE_OPTIONS = [
  { value: 'RFP', label: 'Request for Proposal (RFP)' },
  { value: 'RFQ', label: 'Request for Quote (RFQ)' },
  { value: 'RFT', label: 'Request for Tender (RFT)' },
  { value: 'DIRECT', label: 'Direct Engagement' },
  { value: 'RENEWAL', label: 'Contract Renewal' },
  { value: 'UPSELL', label: 'Upsell Opportunity' },
];

interface BasicInformationStepProps {
  data?: ProposalBasicInfo;
  onNext: () => void;
  onBack: () => void;
  onUpdate?: (data: ProposalBasicInfo) => void;
}

export function BasicInformationStep({
  data,
  onNext,
  onBack,
  onUpdate,
}: BasicInformationStepProps) {
  const analytics = useOptimizedAnalytics();
  const apiClient = useApiClient();
  const { setStepData } = useProposalActions();

  // Fetch customers using React Query
  const {
    data: customersData,
    isLoading: customersLoading,
    error: customersError,
  } = useQuery({
    queryKey: ['customers', 'proposal-wizard'],
    queryFn: async () => {
      const response = await apiClient.get<{
        ok: boolean;
        data?: {
          items: Customer[];
          nextCursor: string | null;
        };
        code?: string;
        message?: string;
      }>('/api/customers?limit=100&status=ACTIVE&sortBy=name&sortOrder=asc');

      if (response.ok && response.data?.items) {
        return response.data.items;
      }
      throw new Error(response.message || 'Failed to load customers');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Customer options for dropdown
  const customerOptions = useMemo(() => {
    if (!customersData) return [{ value: '', label: 'Loading customers...' }];

    return [
      { value: '', label: 'Select a customer...' },
      ...customersData.map(customer => ({
        value: customer.id,
        label: customer.name,
      })),
    ];
  }, [customersData]);

  // Selected customer data
  const selectedCustomer = useMemo(() => {
    if (!data?.customerId || !customersData) return null;
    const customer = customersData.find(c => c.id === data.customerId);
    return customer || null;
  }, [data?.customerId, customersData]);

  // Form data with defaults
  const formData = useMemo(
    () => ({
      title: data?.title || '',
      description: data?.description || '',
      customerId: data?.customerId || '',
      dueDate: data?.dueDate || '',
      priority: data?.priority || 'MEDIUM',
      value: data?.value || 0, // Changed from estimatedValue to match database, default to 0
      currency: data?.currency || 'USD',
      projectType: data?.projectType || '',
      tags: data?.tags || [], // Added to match database
      customer: data?.customer || undefined, // Include customer object
    }),
    [data]
  );

  // Handle field changes
  const handleFieldChange = useCallback(
    (field: string, value: string | number) => {
      setStepData(1, (prevData: ProposalBasicInfo | undefined) => {
        const currentData: ProposalBasicInfo = prevData || {
          title: '',
          description: '',
          customerId: '',
          dueDate: '',
          priority: 'MEDIUM',
          value: 0,
          currency: 'USD',
          projectType: '',
          tags: [],
          customer: undefined,
        };

        return {
          ...currentData,
          [field]: value,
          // Update customer data when customer changes
          ...(field === 'customerId' && {
            customer: customersData?.find(c => c.id === value) ? {
              id: value as string,
              name: customersData.find(c => c.id === value)?.name || '',
              email: customersData.find(c => c.id === value)?.email,
              industry: customersData.find(c => c.id === value)?.industry,
            } : undefined,
          }),
        };
      });

      analytics.trackOptimized('proposal_field_change', {
        field,
        step: 1,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
    },
    [setStepData, analytics, customersData]
  );

  // Handle customer selection
  const handleCustomerChange = useCallback(
    (customerId: string) => {
      setStepData(1, (prevData: ProposalBasicInfo | undefined) => {
        const currentData: ProposalBasicInfo = prevData || {
          title: '',
          description: '',
          customerId: '',
          dueDate: '',
          priority: 'MEDIUM',
          value: 0,
          currency: 'USD',
          projectType: '',
          tags: [],
          customer: undefined,
        };

        const customer = customersData?.find(c => c.id === customerId);

        return {
          ...currentData,
          customerId,
          customer: customer
            ? {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                industry: customer.industry,
              }
            : undefined,
        };
      });

      analytics.trackOptimized('proposal_customer_selected', {
        customerId,
        customerName: customersData?.find(c => c.id === customerId)?.name,
        step: 1,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
    },
    [customersData, setStepData, analytics]
  );

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (!formData.title?.trim()) {
      errors.push('Proposal title is required');
    }

    if (!formData.customerId) {
      errors.push('Customer selection is required');
    }

    if (!formData.dueDate) {
      errors.push('Due date is required');
    }

    if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
      errors.push('Due date must be in the future');
    }

    if (formData.value !== undefined && formData.value < 0) {
      errors.push('Estimated value must be greater than or equal to zero');
    }

    return errors;
  }, [formData]);

  // Handle next step
  const handleNext = useCallback(() => {
    // Validate form data
    if (validationErrors.length > 0) {
      return; // Don't proceed if there are validation errors
    }

    // Debug logging for step payload
    logDebug('Step 1 payload', {
      component: 'BasicInformationStep',
      operation: 'next_step',
      stepData: formData,
      customerId: formData.customerId,
      customer: formData.customer,
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    analytics.trackOptimized('proposal_step_completed', {
      step: 1,
      stepName: 'Basic Information',
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    onNext();
  }, [analytics, onNext, validationErrors, formData]);

  const canProceed = validationErrors.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
        <p className="mt-2 text-gray-600">Provide the essential details for your proposal</p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-sm text-red-800">
            <h4 className="font-medium mb-2">Please fix the following errors:</h4>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* API Errors */}
      {customersError && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-sm text-red-800">
            <h4 className="font-medium mb-2">Error loading customers:</h4>
            <p>{customersError.message}</p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Proposal Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Proposal Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => handleFieldChange('title', e.target.value)}
              placeholder="Enter proposal title..."
              className="mt-1"
            />
          </div>

          {/* Customer Selection */}
          <div>
            <Label htmlFor="customer" className="text-sm font-medium text-gray-700">
              Customer *
            </Label>
            <Select
              id="customer"
              options={customerOptions}
              value={formData.customerId}
              onChange={(value: string | string[]) => {
                const customerId = Array.isArray(value) ? value[0] : value;
                handleCustomerChange(customerId);
              }}
              placeholder="Select a customer..."
              disabled={customersLoading}
            />
            {selectedCustomer && (
              <div className="mt-2 p-3 bg-blue-50 rounded-md">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <UserIcon className="w-4 h-4" />
                  <span className="font-medium">{selectedCustomer.name}</span>
                  {selectedCustomer.industry && (
                    <span className="text-blue-600">({selectedCustomer.industry})</span>
                  )}
                </div>
                {selectedCustomer.email && (
                  <div className="mt-1 text-xs text-blue-600">{selectedCustomer.email}</div>
                )}
              </div>
            )}
          </div>

          {/* Project Type */}
          <div>
            <Label htmlFor="projectType" className="text-sm font-medium text-gray-700">
              Project Type
            </Label>
            <Select
              id="projectType"
              options={PROJECT_TYPE_OPTIONS}
              value={formData.projectType}
              onChange={(value: string | string[]) => {
                const projectType = Array.isArray(value) ? value[0] : value;
                handleFieldChange('projectType', projectType);
              }}
              placeholder="Select project type..."
            />
          </div>

          {/* Priority */}
          <div>
            <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
              Priority
            </Label>
            <Select
              id="priority"
              options={PRIORITY_OPTIONS}
              value={formData.priority}
              onChange={(value: string | string[]) => {
                const priority = Array.isArray(value) ? value[0] : value;
                handleFieldChange('priority', priority);
              }}
              placeholder="Select priority..."
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Due Date */}
          <div>
            <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700">
              Due Date *
            </Label>
            <div className="mt-1 relative">
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={e => handleFieldChange('dueDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="pl-10"
              />
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Estimated Value */}
          <div>
            <Label htmlFor="value" className="text-sm font-medium text-gray-700">
              Estimated Value
            </Label>
            <div className="mt-1 relative">
              <Input
                id="value"
                type="number"
                value={formData.value ?? ''}
                onChange={e => handleFieldChange('value', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="pl-10"
              />
              <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Currency */}
          <div>
            <Label htmlFor="currency" className="text-sm font-medium text-gray-700">
              Currency
            </Label>
            <Select
              id="currency"
              options={CURRENCY_OPTIONS}
              value={formData.currency}
              onChange={(value: string | string[]) => {
                const currency = Array.isArray(value) ? value[0] : value;
                handleFieldChange('currency', currency);
              }}
              placeholder="Select currency..."
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" className="text-sm font-medium text-gray-700">
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={e => handleFieldChange('description', e.target.value)}
          placeholder="Provide a brief description of the proposal..."
          rows={4}
          className="mt-1"
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <Button onClick={handleNext} disabled={!canProceed} className="flex items-center gap-2">
          Next Step
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
