'use client';

/**
 * PosalPro MVP2 - Modern Proposal Wizard with Complete Data Flow Integration
 * Built from scratch using modern React patterns
 * Follows PROPOSAL_MIGRATION_ASSESSMENT.md guidelines
 * Uses React Query, Zustand, and modern component architecture
 * Supports both create and edit modes with seamless data flow
 *
 * ✅ FOLLOWS: MIGRATION_LESSONS.md - Complete data flow integration
 * ✅ FOLLOWS: CORE_REQUIREMENTS.md - Wizard data hydration patterns
 * ✅ ALIGNS: API route schemas for consistent data transformation
 */

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useProposal, useUpdateProposal } from '@/hooks/useProposals';
import { logDebug, logError } from '@/lib/logger';
import {
  useProposalCanGoBack,
  useProposalCanProceed,
  useProposalCurrentStep,
  useProposalInitializeFromData,
  useProposalIsSubmitting,
  useProposalNextStep,
  useProposalPreviousStep,
  useProposalResetWizard,
  useProposalSetCurrentStep,
  useProposalStepData,
  useProposalStore,
  useProposalSubmitProposal,
  useProposalTotalSteps,
  type ProposalBasicInfo,
  type ProposalProductData,
  type ProposalSectionData,
  type ProposalTeamData,
} from '@/lib/store/proposalStore';
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo } from 'react';

// Step components
import { BasicInformationStep } from './steps/BasicInformationStep';
import { ContentSelectionStep } from './steps/ContentSelectionStep';
import { ProductSelectionStep } from './steps/ProductSelectionStep';
import { ReviewStep } from './steps/ReviewStep';
import { SectionAssignmentStep } from './steps/SectionAssignmentStep';
import { TeamAssignmentStep } from './steps/TeamAssignmentStep';

// Step metadata
const STEP_META = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Proposal details and customer information',
    icon: '📋',
    component: BasicInformationStep,
  },
  {
    id: 2,
    title: 'Team Assignment',
    description: 'Assign team members and roles',
    icon: '👥',
    component: TeamAssignmentStep,
  },
  {
    id: 3,
    title: 'Content Selection',
    description: 'Select relevant content and templates',
    icon: '📄',
    component: ContentSelectionStep,
  },
  {
    id: 4,
    title: 'Product Selection',
    description: 'Choose products and services',
    icon: '🛍️',
    component: ProductSelectionStep,
  },
  {
    id: 5,
    title: 'Section Assignment',
    description: 'Organize proposal sections',
    icon: '📝',
    component: SectionAssignmentStep,
  },
  {
    id: 6,
    title: 'Review & Submit',
    description: 'Final review and submission',
    icon: '✅',
    component: ReviewStep,
  },
];

interface ProposalWizardProps {
  onComplete?: (proposalId: string) => void;
  onCancel?: () => void;
  editMode?: boolean;
  proposalId?: string;
}

export function ProposalWizard({
  onComplete,
  onCancel,
  editMode = false,
  proposalId,
}: ProposalWizardProps) {
  const analytics = useOptimizedAnalytics();

  // Use individual selectors to prevent object creation and infinite re-renders
  const currentStep = useProposalCurrentStep();
  const totalSteps = useProposalTotalSteps();
  const canProceed = useProposalCanProceed();
  const canGoBack = useProposalCanGoBack();
  const isSubmitting = useProposalIsSubmitting();

  const nextStep = useProposalNextStep();
  const previousStep = useProposalPreviousStep();
  const setCurrentStep = useProposalSetCurrentStep();
  const submitProposal = useProposalSubmitProposal();
  const updateProposalMutation = useUpdateProposal();
  const resetWizard = useProposalResetWizard();
  const initializeFromData = useProposalInitializeFromData();

  // Use specific step data selectors to avoid infinite re-renders
  const step1Data = useProposalStepData(1) as ProposalBasicInfo | undefined;
  const step2Data = useProposalStepData(2) as ProposalTeamData | undefined;
  const step4Data = useProposalStepData(4) as ProposalProductData | undefined;
  const step5Data = useProposalStepData(5) as ProposalSectionData | undefined;
  const currentStepData = useProposalStepData(currentStep);

  // Fetch proposal data for edit mode - only when we have a valid proposalId
  const { data: proposalData, isLoading: isLoadingProposal } = useProposal(
    editMode && proposalId && typeof proposalId === 'string' ? proposalId : ''
  );

  // Initialize wizard with existing data when in edit mode
  useEffect(() => {
    if (editMode && proposalData && !isLoadingProposal) {
      logDebug('Initializing wizard with existing proposal data', {
        component: 'ProposalWizard',
        operation: 'initializeFromData',
        proposalId,
        editMode,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      try {
        // ✅ FIXED: Pass raw proposal data to store (store handles transformation internally)
        initializeFromData(proposalData);

        analytics.trackOptimized('wizard_edit_mode_initialized', {
          proposalId,
          editMode,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });
      } catch (error) {
        logError('Failed to initialize wizard with existing data', {
          component: 'ProposalWizard',
          operation: 'initializeFromData',
          proposalId,
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });
      }
    }
  }, [editMode, proposalData, isLoadingProposal, proposalId]); // ✅ FIXED: Removed unstable dependencies

  // Current step component
  const CurrentStepComponent = useMemo(() => {
    const step = STEP_META.find(s => s.id === currentStep);
    return step?.component || BasicInformationStep;
  }, [currentStep]);

  // Navigation handlers
  const handleNext = useCallback(async () => {
    try {
      analytics.trackOptimized('wizard_navigation', {
        action: 'next',
        fromStep: currentStep,
        toStep: currentStep + 1,
        editMode,
        proposalId,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      await nextStep();
    } catch (error) {
      analytics.trackOptimized('wizard_error', {
        action: 'next_step_failed',
        step: currentStep,
        editMode,
        proposalId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
    }
  }, [currentStep, nextStep, editMode, proposalId]); // ✅ Removed unstable analytics dependency

  const handleBack = useCallback(() => {
    analytics.trackOptimized('wizard_navigation', {
      action: 'back',
      fromStep: currentStep,
      toStep: currentStep - 1,
      editMode,
      proposalId,
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    previousStep();
  }, [currentStep, previousStep, editMode, proposalId]); // ✅ Removed unstable analytics dependency

  const handleStepClick = useCallback((targetStep: number) => {
    // Only allow navigation to completed steps or the next step
    if (targetStep <= currentStep || targetStep === currentStep + 1) {
      analytics.trackOptimized('wizard_step_navigation', {
        action: 'direct_step_click',
        fromStep: currentStep,
        toStep: targetStep,
        editMode,
        proposalId,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      logDebug('Direct step navigation', {
        component: 'ProposalWizard',
        operation: 'handleStepClick',
        fromStep: currentStep,
        toStep: targetStep,
        editMode,
        proposalId,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      setCurrentStep(targetStep);
    }
  }, [currentStep, setCurrentStep, editMode, proposalId, analytics]);

  const handleSubmit = useCallback(async () => {
    try {
      logDebug('Wizard submit started', {
        component: 'ProposalWizard',
        operation: 'handleSubmit',
        currentStep,
        editMode,
        proposalId,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      analytics.trackOptimized('wizard_submit', {
        action: editMode ? 'update_proposal' : 'submit_proposal',
        step: currentStep,
        editMode,
        proposalId,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      let resultProposalId: string;

      if (editMode && proposalId) {
        // Update existing proposal using React Query mutation
        const stepData = useProposalStore.getState().stepData;
        
        // ✅ ADDED: Debug logging to track raw step data from store
        console.log('[WIZARD DEBUG] Raw step data from store:', {
          component: 'ProposalWizard',
          operation: 'handleSubmit_raw_store_data',
          stepDataKeys: Object.keys(stepData),
          step4Data: stepData[4],
          step4ProductCount: stepData[4]?.products?.length || 0,
          step4TotalValue: stepData[4]?.totalValue || 0,
          step4Products: stepData[4]?.products?.map((p: any) => ({ 
            id: p.id, 
            name: p.name, 
            temp: p.id?.startsWith('temp-') 
          })) || [],
        });
        
        const proposalData = {
          ...stepData[1], // Basic information
          teamData: stepData[2], // Team assignment
          contentData: stepData[3], // Content selection
          productData: stepData[4], // Product selection
          sectionData: stepData[5], // Section assignment
          reviewData: stepData[6], // Review data
        };

        // ✅ ADDED: Debug logging to track proposal data being submitted
        logDebug('ProposalWizard: Submitting proposal data', {
          component: 'ProposalWizard',
          operation: 'handleSubmit',
          proposalId,
          stepDataKeys: Object.keys(stepData),
          productData: stepData[4],
          productCount: stepData[4]?.products?.length || 0,
          products: stepData[4]?.products?.map((p: any) => ({
            id: p.id,
            productId: p.productId,
            name: p.name,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            total: p.total,
          })) || [],
          proposalDataKeys: Object.keys(proposalData),
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });

        const result = await updateProposalMutation.mutateAsync({
          id: proposalId,
          proposal: proposalData,
        });
        resultProposalId = result.id;

        logDebug('Proposal updated successfully', {
          component: 'ProposalWizard',
          operation: 'handleSubmit',
          proposalId: resultProposalId,
          editMode,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });
      } else {
        // Create new proposal
        resultProposalId = await submitProposal();

        logDebug('Proposal submitted successfully', {
          component: 'ProposalWizard',
          operation: 'handleSubmit',
          proposalId: resultProposalId,
          editMode,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });
      }

      if (onComplete) {
        logDebug('Calling onComplete callback', {
          component: 'ProposalWizard',
          operation: 'handleSubmit',
          proposalId: resultProposalId,
          editMode,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });
        onComplete(resultProposalId);
      }
    } catch (error) {
      logError('Wizard submit failed', {
        component: 'ProposalWizard',
        operation: 'handleSubmit',
        currentStep,
        editMode,
        proposalId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      analytics.trackOptimized('wizard_error', {
        action: 'submit_failed',
        step: currentStep,
        editMode,
        proposalId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
    }
  }, [currentStep, submitProposal, updateProposalMutation, onComplete, editMode, proposalId]); // ✅ Removed unstable analytics dependency

  // Show loading state while fetching proposal data in edit mode
  if (editMode && isLoadingProposal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Proposal</h1>
              <p className="text-gray-600">Loading proposal data...</p>
            </div>

            <Card className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading proposal data...</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {editMode ? 'Edit Proposal' : 'Create New Proposal'}
              </h1>
              <p className="text-gray-600 mt-1">
                {editMode
                  ? 'Update your proposal details and settings'
                  : 'Follow the guided workflow to create a comprehensive proposal for your client.'}
              </p>
            </div>

            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex items-center gap-2">
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEP_META.map((step, index) => {
              const isClickable = step.id <= currentStep || step.id === currentStep + 1;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => handleStepClick(step.id)}
                    disabled={!isClickable}
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 ${
                      isCompleted
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : isCurrent
                          ? 'bg-blue-500 text-white'
                          : isClickable
                            ? 'bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    } ${isClickable ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2' : ''}`}
                    title={isClickable ? `Go to ${step.title}` : `Complete previous steps to unlock ${step.title}`}
                  >
                    {isCompleted ? <CheckCircleIcon className="w-5 h-5" /> : step.id}
                  </button>
                  <button
                    onClick={() => handleStepClick(step.id)}
                    disabled={!isClickable}
                    className={`ml-2 text-sm font-medium transition-colors duration-200 ${
                      isCurrent || isCompleted 
                        ? 'text-gray-900' 
                        : isClickable
                          ? 'text-gray-700 hover:text-gray-900 cursor-pointer'
                          : 'text-gray-400 cursor-not-allowed'
                    } ${isClickable ? 'focus:outline-none focus:underline' : ''}`}
                    title={isClickable ? `Go to ${step.title}` : `Complete previous steps to unlock ${step.title}`}
                  >
                    {step.title}
                  </button>
                  {index < STEP_META.length - 1 && (
                    <div
                      className={`ml-4 w-8 h-0.5 ${
                        currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Step Content */}
            <div className="lg:col-span-3">
              <Card className="p-6">
                <CurrentStepComponent
                  data={currentStepData}
                  onNext={handleNext}
                  onBack={handleBack}
                  onSubmit={handleSubmit}
                  onUpdate={() => {
                    // Step data updates are handled by the store
                  }}
                  // editMode prop removed - not needed by step components
                />
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Proposal Summary</h3>

                {/* Quick Stats */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium">
                      {step1Data?.customer?.name || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Team Members:</span>
                    <span className="font-medium">{step2Data?.teamMembers?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Products:</span>
                    <span className="font-medium">{step4Data?.products?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sections:</span>
                    <span className="font-medium">{step5Data?.sections?.length || 0}</span>
                  </div>
                </div>

                {/* Navigation */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Step:</span>
                    <span className="font-medium">
                      {currentStep} of {totalSteps}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBack}
                      disabled={!canGoBack}
                      className="flex-1"
                    >
                      <ChevronLeftIcon className="w-4 h-4 mr-1" />
                      Back
                    </Button>

                    {currentStep < totalSteps ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleNext}
                        disabled={!canProceed}
                        className="flex-1"
                      >
                        Next
                        <ChevronRightIcon className="w-4 h-4 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        {isSubmitting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        ) : (
                          <PaperAirplaneIcon className="w-4 h-4 mr-1" />
                        )}
                        {editMode ? 'Update' : 'Submit'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Preview Button */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      analytics.trackOptimized('wizard_preview', {
                        step: currentStep,
                        editMode,
                        proposalId,
                        userStory: 'US-3.1',
                        hypothesis: 'H4',
                      });
                    }}
                  >
                    <EyeIcon className="w-4 h-4 mr-2" />
                    Preview Proposal
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
