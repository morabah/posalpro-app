/**
 * Proposal Form Component - Standalone form for creating/editing proposals
 * User Story: US-3.1 (Proposal Creation), US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination)
 */

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useCreateProposal, useUpdateProposal } from '@/hooks/useProposal';
import { logInfo } from '@/lib/logger';
import { BasicInformationSchema } from '@/lib/validation/proposalValidation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

interface ProposalFormProps {
  proposal?: z.infer<typeof BasicInformationSchema> & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProposalForm_p({ proposal, onSuccess, onCancel }: ProposalFormProps) {
  const analytics = useOptimizedAnalytics();
  const createProposalMutation = useCreateProposal();
  const updateProposalMutation = useUpdateProposal();

  const [formData, setFormData] = useState({
    title: proposal?.title || '',
    description: proposal?.description || '',
    customerId: proposal?.customerId || '',
    dueDate: proposal?.dueDate ? new Date(proposal.dueDate).toISOString().split('T')[0] : '',
    value: proposal?.value?.toString() || '',
    currency: proposal?.currency || 'USD',
    tags: proposal?.tags || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');

  // ====================
  // Event Handlers
  // ====================

  const handleFieldChange = useCallback(
    (field: keyof typeof formData, value: string | string[]) => {
      setFormData(prev => ({ ...prev, [field]: value }));

      // Clear error for this field
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }

      logInfo('Proposal form field updated', {
        component: 'ProposalForm_p',
        operation: 'handleFieldChange',
        field,
        userStory: proposal?.id ? 'US-3.2' : 'US-3.1',
        hypothesis: 'H4',
      });
    },
    [errors, proposal?.id]
  );

  const handleTagAdd = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      const newTags = [...formData.tags, tagInput.trim()];
      handleFieldChange('tags', newTags);
      setTagInput('');
    }
  }, [tagInput, formData.tags, handleFieldChange]);

  const handleTagRemove = useCallback(
    (tagToRemove: string) => {
      const newTags = formData.tags.filter((tag: string) => tag !== tagToRemove);
      handleFieldChange('tags', newTags);
    },
    [formData.tags, handleFieldChange]
  );

  const validateForm = useCallback(() => {
    try {
      const dataToValidate = {
        ...formData,
        value: formData.value ? parseFloat(formData.value) : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      };

      BasicInformationSchema.parse(dataToValidate);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    const submitData = {
      ...formData,
      value: formData.value ? parseFloat(formData.value) : undefined,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
    };

    try {
      analytics.trackOptimized(
        proposal?.id ? 'proposal_update_submitted' : 'proposal_create_submitted',
        {
          proposalId: proposal?.id,
          hasValue: !!submitData.value,
          hasDueDate: !!submitData.dueDate,
          tagCount: submitData.tags.length,
          userStory: proposal?.id ? 'US-3.2' : 'US-3.1',
          hypothesis: 'H4',
        },
        'high'
      );

      if (proposal?.id) {
        await updateProposalMutation.mutateAsync({
          id: proposal.id,
          data: submitData
        });
        toast.success('Proposal updated successfully');
      } else {
        await createProposalMutation.mutateAsync(submitData);
        toast.success('Proposal created successfully');
      }

      onSuccess?.();
    } catch (error) {
      logInfo('Proposal form submission failed', {
        component: 'ProposalForm_p',
        operation: 'handleSubmit',
        proposalId: proposal?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: proposal?.id ? 'US-3.2' : 'US-3.1',
        hypothesis: 'H4',
      });
      toast.error(proposal?.id ? 'Failed to update proposal' : 'Failed to create proposal');
    }
  }, [
    validateForm,
    formData,
    proposal?.id,
    analytics,
    updateProposalMutation,
    createProposalMutation,
    onSuccess,
  ]);

  // ====================
  // Render
  // ====================

  const isSubmitting = createProposalMutation.isPending || updateProposalMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {proposal?.id ? 'Edit Proposal' : 'Create New Proposal'}
        </h2>
        <p className="text-gray-600 mt-1">
          {proposal?.id
            ? 'Update the proposal details below'
            : 'Fill in the proposal details below'}
        </p>
      </div>

      <Card>
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => handleFieldChange('title', e.target.value)}
              placeholder="Enter proposal title"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
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
              placeholder="Enter proposal description"
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Customer ID */}
          <div>
            <Label htmlFor="customerId" className="text-sm font-medium text-gray-700">
              Customer ID *
            </Label>
            <Input
              id="customerId"
              value={formData.customerId}
              onChange={e => handleFieldChange('customerId', e.target.value)}
              placeholder="Enter customer ID"
              className={errors.customerId ? 'border-red-500' : ''}
            />
            {errors.customerId && <p className="text-sm text-red-600 mt-1">{errors.customerId}</p>}
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700">
              Due Date
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={e => handleFieldChange('dueDate', e.target.value)}
              className={errors.dueDate ? 'border-red-500' : ''}
            />
            {errors.dueDate && <p className="text-sm text-red-600 mt-1">{errors.dueDate}</p>}
          </div>

          {/* Value and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="value" className="text-sm font-medium text-gray-700">
                Estimated Value
              </Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={e => handleFieldChange('value', e.target.value)}
                placeholder="0.00"
                className={errors.value ? 'border-red-500' : ''}
              />
              {errors.value && <p className="text-sm text-red-600 mt-1">{errors.value}</p>}
            </div>
            <div>
              <Label htmlFor="currency" className="text-sm font-medium text-gray-700">
                Currency
              </Label>
              <Select
                value={formData.currency}
                onChange={value => handleFieldChange('currency', value)}
                options={[
                  { value: 'USD', label: 'USD' },
                  { value: 'EUR', label: 'EUR' },
                  { value: 'GBP', label: 'GBP' },
                  { value: 'CAD', label: 'CAD' },
                ]}
                placeholder="Select currency"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
              />
              <Button
                onClick={handleTagAdd}
                type="button"
                variant="outline"
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3">
        <Button onClick={onCancel} type="button" variant="outline" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          type="button"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting
            ? proposal?.id
              ? 'Updating...'
              : 'Creating...'
            : proposal?.id
              ? 'Update Proposal'
              : 'Create Proposal'}
        </Button>
      </div>
    </div>
  );
}
