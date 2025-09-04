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
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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

  // ✅ REACT HOOK FORM SETUP
  const {
    register,
    control,
    handleSubmit,
    formState: { errors: formErrors, isValid },
    watch,
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(BasicInformationSchema),
    mode: 'onChange',
    defaultValues: {
      title: proposal?.title || '',
      description: proposal?.description || '',
      customerId: proposal?.customerId || '',
      dueDate: proposal?.dueDate ? new Date(proposal.dueDate).toISOString().split('T')[0] : '',
      value: proposal?.value?.toString() || '',
      currency: proposal?.currency || 'USD',
      tags: proposal?.tags || [],
    },
  });

  const [tagInput, setTagInput] = useState('');

  // ====================
  // Event Handlers
  // ====================

  const handleTagAdd = useCallback(() => {
    if (tagInput.trim()) {
      const currentTags = watch('tags') || [];
      if (!currentTags.includes(tagInput.trim())) {
        setValue('tags', [...currentTags, tagInput.trim()]);
        setTagInput('');
      }
    }
  }, [tagInput, setValue, watch]);

  const handleTagRemove = useCallback(
    (tagToRemove: string) => {
      const currentTags = watch('tags') || [];
      setValue(
        'tags',
        currentTags.filter(tag => tag !== tagToRemove)
      );
    },
    [setValue, watch]
  );

  // ✅ FORM SUBMISSION HANDLER
  const onSubmit = async (data: any) => {
    const submitData = {
      ...data,
      value: data.value ? parseFloat(data.value) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
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
          data: submitData,
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
  };

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
              {...register('title')}
              id="title"
              value={watch('title') || ''}
              placeholder="Enter proposal title"
              className={formErrors.title ? 'border-red-500' : ''}
            />
            {formErrors.title && (
              <p className="text-sm text-red-600 mt-1">{formErrors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </Label>
            <Textarea
              {...register('description')}
              id="description"
              value={watch('description') || ''}
              placeholder="Enter proposal description"
              rows={3}
              className={formErrors.description ? 'border-red-500' : ''}
            />
            {formErrors.description && (
              <p className="text-sm text-red-600 mt-1">{formErrors.description.message}</p>
            )}
          </div>

          {/* Customer ID */}
          <div>
            <Label htmlFor="customerId" className="text-sm font-medium text-gray-700">
              Customer ID *
            </Label>
            <Input
              {...register('customerId')}
              id="customerId"
              value={watch('customerId') || ''}
              placeholder="Enter customer ID"
              className={formErrors.customerId ? 'border-red-500' : ''}
            />
            {formErrors.customerId && (
              <p className="text-sm text-red-600 mt-1">{formErrors.customerId.message}</p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700">
              Due Date
            </Label>
            <Input
              {...register('dueDate')}
              id="dueDate"
              type="date"
              value={watch('dueDate') || ''}
              className={formErrors.dueDate ? 'border-red-500' : ''}
            />
            {formErrors.dueDate && (
              <p className="text-sm text-red-600 mt-1">{formErrors.dueDate.message}</p>
            )}
          </div>

          {/* Value and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="value" className="text-sm font-medium text-gray-700">
                Estimated Value
              </Label>
              <Input
                {...register('value', {
                  setValueAs: value => (value === '' ? undefined : value),
                })}
                id="value"
                type="number"
                step="0.01"
                value={watch('value') || ''}
                placeholder="0.00"
                className={formErrors.value ? 'border-red-500' : ''}
              />
              {formErrors.value && (
                <p className="text-sm text-red-600 mt-1">{formErrors.value.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="currency" className="text-sm font-medium text-gray-700">
                Currency
              </Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={[
                      { value: 'USD', label: 'USD' },
                      { value: 'EUR', label: 'EUR' },
                      { value: 'GBP', label: 'GBP' },
                      { value: 'CAD', label: 'CAD' },
                    ]}
                    placeholder="Select currency"
                  />
                )}
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
            {(watch('tags') || []).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {(watch('tags') || []).map((tag: string) => (
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
          onClick={handleSubmit(onSubmit)}
          type="button"
          disabled={isSubmitting || !isValid}
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
