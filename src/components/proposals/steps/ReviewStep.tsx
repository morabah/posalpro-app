'use client';

/**
 * PosalPro MVP2 - Modern Review Step
 * Built from scratch using React Query and modern patterns
 * Follows PROPOSAL_MIGRATION_ASSESSMENT.md guidelines
 */

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug } from '@/lib/logger';
import { useProposalPlanType, useProposalStepData } from '@/lib/store/proposalStore';
import { useCallback, useMemo } from 'react';

interface ReviewStepProps {
  onNext: () => void;
  onBack: () => void;
  onSubmit?: () => void;
}

export function ReviewStep({ onNext, onBack, onSubmit }: ReviewStepProps) {
  const analytics = useOptimizedAnalytics();
  const planType = useProposalPlanType();

  // Get data from all steps individually
  const basicInfo = useProposalStepData(1);
  const teamData = useProposalStepData(2);
  const contentData = useProposalStepData(3);
  const productData = useProposalStepData(4);
  const sectionData = useProposalStepData(5);

  // Validation checklist
  const validationChecklist = useMemo(() => {
    // Determine which items are required based on plan
    const requireTeam = planType !== 'BASIC';
    const requireContent = planType === 'ENTERPRISE';
    const requireSections = planType === 'ENTERPRISE';

    return [
      {
        id: 'basic-info',
        title: 'Basic Information',
        isChecked: !!basicInfo?.title && !!basicInfo?.customerId,
        isRequired: true,
      },
      {
        id: 'team-assignment',
        title: 'Team Assignment',
        isChecked:
          !!teamData?.teamLead &&
          !!teamData?.salesRepresentative &&
          Object.keys(teamData?.subjectMatterExperts || {}).length > 0,
        isRequired: requireTeam,
      },
      {
        id: 'content-selection',
        title: 'Content Selection',
        isChecked:
          (contentData?.selectedTemplates?.length || 0) > 0 ||
          (contentData?.customContent?.length || 0) > 0,
        isRequired: requireContent,
      },
      {
        id: 'product-selection',
        title: 'Product Selection',
        isChecked: (productData?.products?.length || 0) > 0,
        isRequired: true,
      },
      {
        id: 'section-assignment',
        title: 'Section Assignment',
        isChecked: (sectionData?.sections?.length || 0) > 0,
        isRequired: requireSections,
      },
    ];
  }, [basicInfo, teamData, contentData, productData, sectionData, planType]);

  // Calculate totals
  const totalProducts = useMemo(() => {
    return productData?.products?.length || 0;
  }, [productData]);

  const totalValue = useMemo(() => {
    // ✅ FIXED: Use the saved totalValue from productData or calculate from products
    if (productData?.totalValue) {
      return productData.totalValue;
    }
    return (
      productData?.products?.reduce((sum: number, product: any) => sum + (product.unitPrice * product.quantity), 0) || 0
    );
  }, [productData]);

  const totalSections = useMemo(() => {
    return sectionData?.sections?.length || 0;
  }, [sectionData]);

  const isComplete = useMemo(() => {
    return validationChecklist.every(item => item.isChecked);
  }, [validationChecklist]);

  const handleSubmit = useCallback(() => {
    if (!isComplete) {
      analytics.trackOptimized('proposal_submission_failed', {
        reason: 'validation_failed',
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
      return;
    }

    // Debug logging for final submission payload
    logDebug('Step 6 final submission payload', {
      component: 'ReviewStep',
      operation: 'submit_proposal',
      stepData: {
        basicInfo,
        teamData,
        contentData,
        productData,
        sectionData,
      },
      customerId: basicInfo?.customerId,
      customer: basicInfo?.customer,
      totalProducts,
      totalValue,
      totalSections,
      validationChecklist,
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    analytics.trackOptimized('proposal_submitted', {
      totalProducts,
      totalValue,
      totalSections,
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    onSubmit?.();
  }, [
    analytics,
    isComplete,
    totalProducts,
    totalValue,
    totalSections,
    onSubmit,
    basicInfo,
    teamData,
    contentData,
    productData,
    sectionData,
    validationChecklist,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Review & Submit</h2>
        <p className="mt-2 text-gray-600">Review your proposal before submission</p>
      </div>

      {/* Validation Checklist */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Validation Checklist</h3>
        <div className="space-y-3">
          {validationChecklist.map(item => (
            <div key={item.id} className="flex items-center space-x-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  item.isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                }`}
              >
                {item.isChecked && '✓'}
              </div>
              <span className={`text-sm ${item.isChecked ? 'text-gray-900' : 'text-gray-500'}`}>
                {item.title}
              </span>
              {item.isRequired && <span className="text-xs text-red-500">*Required</span>}
            </div>
          ))}
        </div>

        {!isComplete && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Please complete all required sections before submitting.
            </p>
          </div>
        )}
      </Card>

      {/* Proposal Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Proposal Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Basic Information</h4>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Title:</span> {basicInfo?.title || 'Not set'}
              </p>
              <p>
                <span className="font-medium">Customer:</span>{' '}
                {basicInfo?.customer?.name || 'Not selected'}
              </p>
              <p>
                <span className="font-medium">Due Date:</span> {basicInfo?.dueDate || 'Not set'}
              </p>
              <p>
                <span className="font-medium">Priority:</span> {basicInfo?.priority || 'Not set'}
              </p>
            </div>
          </div>

          {/* Team Info */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Team Assignment</h4>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Team Lead:</span>{' '}
                {teamData?.teamLead || 'Not assigned'}
              </p>
              <p>
                <span className="font-medium">Sales Rep:</span>{' '}
                {teamData?.salesRepresentative || 'Not assigned'}
              </p>
              <p>
                <span className="font-medium">SMEs:</span>{' '}
                {Object.keys(teamData?.subjectMatterExperts || {}).length} assigned
              </p>
              <p>
                <span className="font-medium">Executives:</span>{' '}
                {teamData?.executiveReviewers?.length || 0} assigned
              </p>
            </div>
          </div>

          {/* Content Info */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Content & Sections</h4>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Templates:</span>{' '}
                {contentData?.selectedTemplates?.length || 0} selected
              </p>
              <p>
                <span className="font-medium">Custom Content:</span>{' '}
                {contentData?.customContent?.length || 0} sections
              </p>
              <p>
                <span className="font-medium">Total Sections:</span> {totalSections}
              </p>
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Products & Value</h4>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Products:</span> {totalProducts} selected
              </p>
              <p>
                <span className="font-medium">Total Value:</span> ${totalValue.toFixed(2)}
              </p>
              <p>
                <span className="font-medium">Currency:</span> {basicInfo?.currency || 'USD'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-between pt-6 border-t border-gray-200">
        <Button variant="outline" onClick={onBack}>
          Previous
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isComplete}
          className="bg-green-600 hover:bg-green-700"
        >
          Submit Proposal
        </Button>
      </div>
    </div>
  );
}
