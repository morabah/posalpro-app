'use client';

/**
 * PosalPro MVP2 - Proposal Creation Wizard
 * Implements 6-step proposal creation workflow per PROPOSAL_CREATION_SCREEN.md
 * Supports H7 (Deadline Management) and H4 (Cross-Department Coordination) validation
 */

import { Alert } from '@/components/ui/feedback/Alert';
import { Button } from '@/components/ui/forms/Button';
import { useProposalCreationAnalytics } from '@/hooks/proposals/useProposalCreationAnalytics';
import {
  ProposalWizardData,
  ProposalWizardStep1Data,
  ProposalWizardStep2Data,
} from '@/types/proposals';
import { ChevronLeftIcon, ChevronRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// Card component placeholder
const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => <div className={`card ${className}`}>{children}</div>;

// Step components (to be implemented)
import { BasicInformationStep } from './steps/BasicInformationStep';
import { ContentSelectionStep } from './steps/ContentSelectionStep';
import { ProductSelectionStep } from './steps/ProductSelectionStep';
import { ReviewStep } from './steps/ReviewStep';
import { SectionAssignmentStep } from './steps/SectionAssignmentStep';
import { TeamAssignmentStep } from './steps/TeamAssignmentStep';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-2.2'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.3', 'AC-2.2.1', 'AC-2.2.2'],
  methods: [
    'complexityEstimation()',
    'initializeTracking()',
    'createProposal()',
    'suggestContributors()',
    'criticalPath()',
  ],
  hypotheses: ['H7', 'H4'],
  testCases: ['TC-H7-001', 'TC-H4-001'],
};

const WIZARD_STEPS = [
  { number: 1, title: 'Basic Information', component: BasicInformationStep },
  { number: 2, title: 'Team Assignment', component: TeamAssignmentStep },
  { number: 3, title: 'Content Selection', component: ContentSelectionStep },
  { number: 4, title: 'Product Selection', component: ProductSelectionStep },
  { number: 5, title: 'Section Assignment', component: SectionAssignmentStep },
  { number: 6, title: 'Review & Finalize', component: ReviewStep },
];

interface ProposalWizardProps {
  onComplete?: (proposalData: ProposalWizardData) => void;
  onCancel?: () => void;
  initialData?: Partial<ProposalWizardData>;
}

export function ProposalWizard({ onComplete, onCancel, initialData }: ProposalWizardProps) {
  const router = useRouter();
  const analytics = useProposalCreationAnalytics();

  // Initialize wizard data
  const [wizardData, setWizardData] = useState<ProposalWizardData>(() => ({
    step1: initialData?.step1 || ({} as ProposalWizardStep1Data),
    step2: initialData?.step2 || ({} as ProposalWizardStep2Data),
    step3: initialData?.step3 || { selectedContent: [], searchHistory: [] },
    step4: initialData?.step4 || { products: [] },
    step5: initialData?.step5 || { sections: [], sectionAssignments: {} },
    step6: initialData?.step6 || {
      finalValidation: { isValid: false, completeness: 0, issues: [], complianceChecks: [] },
      approvals: [],
    },
    currentStep: initialData?.currentStep || 1,
    isValid: new Array(6).fill(false),
    isDirty: false,
    lastSaved: initialData?.lastSaved,
  }));

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Initialize analytics tracking
  useEffect(() => {
    analytics.trackWizardStep(1, 'Basic Information', 'start');
  }, [analytics]);

  // Handle step validation
  const validateStep = useCallback((step: number, data: any): boolean => {
    switch (step) {
      case 1:
        return !!(data.client?.name && data.details?.title && data.details?.dueDate);
      case 2:
        return !!(data.teamLead && data.salesRepresentative);
      case 3:
        return data.selectedContent?.length > 0;
      case 4:
        return true; // Products are optional
      case 5:
        return data.sections?.length > 0;
      case 6:
        return data.finalValidation?.isValid;
      default:
        return false;
    }
  }, []);

  // Update step data
  const updateStepData = useCallback(
    (step: number, data: any) => {
      setWizardData(prev => {
        const stepKey = `step${step}` as keyof ProposalWizardData;
        const currentStepData = prev[stepKey];

        // Ensure we have a valid object to spread
        const baseStepData =
          typeof currentStepData === 'object' && currentStepData !== null ? currentStepData : {};

        const newData = {
          ...prev,
          [stepKey]: { ...baseStepData, ...data },
          isDirty: true,
        };

        // Validate current step
        const isStepValid = validateStep(step, newData[stepKey]);
        newData.isValid[step - 1] = isStepValid;

        return newData;
      });
    },
    [validateStep]
  );

  // Create a stable onUpdate function for the current step
  const stableOnUpdate = useCallback(
    (data: any) => updateStepData(wizardData.currentStep, data),
    [updateStepData, wizardData.currentStep]
  );

  // Navigate to next step
  const handleNext = useCallback(async () => {
    const currentStepData = wizardData[`step${wizardData.currentStep}` as keyof ProposalWizardData];
    const isCurrentStepValid = validateStep(wizardData.currentStep, currentStepData);

    if (!isCurrentStepValid) {
      setError(`Please complete all required fields in Step ${wizardData.currentStep}`);
      analytics.trackWizardStep(
        wizardData.currentStep,
        WIZARD_STEPS[wizardData.currentStep - 1].title,
        'error',
        {
          reason: 'validation_failed',
        }
      );
      return;
    }

    setError(null);
    analytics.trackWizardStep(
      wizardData.currentStep,
      WIZARD_STEPS[wizardData.currentStep - 1].title,
      'complete'
    );

    if (wizardData.currentStep < 6) {
      const nextStep = wizardData.currentStep + 1;
      setWizardData(prev => ({ ...prev, currentStep: nextStep }));
      analytics.trackWizardStep(nextStep, WIZARD_STEPS[nextStep - 1].title, 'start');
    } else {
      // Final step - create proposal
      await handleCreateProposal();
    }
  }, [wizardData, validateStep, analytics]);

  // Navigate to previous step
  const handlePrevious = useCallback(() => {
    if (wizardData.currentStep > 1) {
      const prevStep = wizardData.currentStep - 1;
      setWizardData(prev => ({ ...prev, currentStep: prevStep }));
      analytics.trackWizardStep(prevStep, WIZARD_STEPS[prevStep - 1].title, 'start');
    }
  }, [wizardData.currentStep, analytics]);

  // Save draft
  const handleSaveDraft = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call to save draft
      await new Promise(resolve => setTimeout(resolve, 1000));

      setWizardData(prev => ({
        ...prev,
        lastSaved: new Date(),
        isDirty: false,
      }));

      analytics.trackWizardStep(wizardData.currentStep, 'save_draft', 'complete');
    } catch (err) {
      setError('Failed to save draft. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [wizardData.currentStep, analytics]);

  // Create final proposal
  const handleCreateProposal = useCallback(async () => {
    setIsLoading(true);
    try {
      // Calculate creation metrics for analytics
      const summary = analytics.getWizardSummary();

      const creationMetrics = {
        proposalId: 'temp-' + Date.now(),
        creationTime: summary.totalTime,
        complexityScore: calculateComplexityScore(wizardData),
        estimatedTimeline: wizardData.step1.details?.dueDate
          ? Math.ceil(
              (new Date(wizardData.step1.details.dueDate).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
          : 0,
        teamAssignmentTime: summary.stepMetrics.find(s => s.step === 2)?.duration || 0,
        coordinationSetupTime: summary.stepMetrics.reduce((sum, s) => sum + (s.duration || 0), 0),
        teamSize: Object.keys(wizardData.step2.subjectMatterExperts || {}).length + 2, // team lead + sales rep + SMEs
        aiSuggestionsAccepted: summary.stepMetrics.reduce(
          (sum, s) => sum + s.aiSuggestionsAccepted,
          0
        ),
        manualAssignments: summary.stepMetrics.reduce(
          (sum, s) => sum + (s.aiSuggestionsShown - s.aiSuggestionsAccepted),
          0
        ),
        assignmentAccuracy: summary.aiAcceptanceRate,
        contentSuggestionsUsed: wizardData.step3.selectedContent?.length || 0,
        validationIssuesFound: wizardData.step6.finalValidation?.issues?.length || 0,
        wizardCompletionRate: 100,
        stepCompletionTimes: summary.stepMetrics.map(s => s.duration || 0),
        userStory: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
      };

      analytics.trackProposalCreation(creationMetrics);

      // Simulate API call to create proposal
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (onComplete) {
        onComplete(wizardData);
      } else {
        router.push('/proposals/manage');
      }
    } catch (err) {
      setError('Failed to create proposal. Please try again.');
      analytics.trackWizardStep(6, 'create_proposal', 'error', { reason: 'api_error' });
    } finally {
      setIsLoading(false);
    }
  }, [wizardData, analytics, onComplete, router]);

  // Handle cancel with confirmation
  const handleCancel = useCallback(() => {
    if (wizardData.isDirty) {
      setShowExitConfirm(true);
    } else {
      if (onCancel) {
        onCancel();
      } else {
        router.push('/proposals/manage');
      }
    }
  }, [wizardData.isDirty, onCancel, router]);

  // Calculate complexity score for analytics
  const calculateComplexityScore = useCallback((data: ProposalWizardData): number => {
    let complexity = 1; // base complexity

    // Team size factor
    const teamSize = Object.keys(data.step2.subjectMatterExperts || {}).length + 2;
    complexity += teamSize * 0.5;

    // Content complexity
    complexity += (data.step3.selectedContent?.length || 0) * 0.3;

    // Product complexity
    complexity += (data.step4.products?.length || 0) * 0.4;

    // Section complexity
    complexity += (data.step5.sections?.length || 0) * 0.2;

    return Math.min(Math.max(complexity, 1), 10); // clamp between 1-10
  }, []);

  const CurrentStepComponent = WIZARD_STEPS[wizardData.currentStep - 1].component;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <DocumentTextIcon className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-neutral-900">Create New Proposal</h1>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center space-x-4 mb-6">
          {WIZARD_STEPS.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${
                  wizardData.currentStep === step.number
                    ? 'bg-primary-600 text-white'
                    : wizardData.currentStep > step.number
                    ? 'bg-success-600 text-white'
                    : 'bg-neutral-200 text-neutral-600'
                }
              `}
              >
                {wizardData.currentStep > step.number ? '✓' : step.number}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  wizardData.currentStep === step.number ? 'text-primary-600' : 'text-neutral-600'
                }`}
              >
                {step.title}
              </span>
              {index < WIZARD_STEPS.length - 1 && (
                <ChevronRightIcon className="w-4 h-4 text-neutral-400 mx-3" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Step Content */}
      <Card className="mb-8">
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Step {wizardData.currentStep} of 6: {WIZARD_STEPS[wizardData.currentStep - 1].title}
            </h2>
          </div>

          <CurrentStepComponent
            data={
              (wizardData[`step${wizardData.currentStep}` as keyof ProposalWizardData] as any) || {}
            }
            onUpdate={stableOnUpdate}
            analytics={analytics}
          />
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="secondary" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>

          <Button
            variant="secondary"
            onClick={handleSaveDraft}
            disabled={isLoading}
            loading={isLoading}
          >
            Save Draft
          </Button>

          {wizardData.lastSaved && (
            <span className="text-sm text-neutral-600">
              Last saved: {wizardData.lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {wizardData.currentStep > 1 && (
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={isLoading}
              className="flex items-center"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}

          <Button
            variant="primary"
            onClick={handleNext}
            disabled={isLoading}
            loading={isLoading}
            className="flex items-center"
          >
            {wizardData.currentStep === 6 ? (
              'Create Proposal'
            ) : (
              <>
                Next Step
                <ChevronRightIcon className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Unsaved Changes</h3>
              <p className="text-neutral-600 mb-6">
                You have unsaved changes. Are you sure you want to exit without saving?
              </p>
              <div className="flex items-center justify-end space-x-4">
                <Button variant="secondary" onClick={() => setShowExitConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveDraft} loading={isLoading}>
                  Save & Exit
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowExitConfirm(false);
                    if (onCancel) {
                      onCancel();
                    } else {
                      router.push('/proposals/manage');
                    }
                  }}
                  className="text-error-600 hover:text-error-700"
                >
                  Exit Without Saving
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
