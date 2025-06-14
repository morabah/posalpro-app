'use client';

/**
 * PosalPro MVP2 - Proposal Creation Wizard
 * Implements 6-step proposal creation workflow per PROPOSAL_CREATION_SCREEN.md
 * Enhanced with proposal entity integration, draft saving, and session recovery
 * Supports H7 (Deadline Management) and H4 (Cross-Department Coordination) validation
 */

import { useAuth } from '@/components/providers/AuthProvider';
import { Alert } from '@/components/ui/feedback/Alert';
import { Button } from '@/components/ui/forms/Button';
import { useProposalCreationAnalytics } from '@/hooks/proposals/useProposalCreationAnalytics';
import { ProposalEntity } from '@/lib/entities/proposal';
import { Priority } from '@/types/enums';
import {
  ExpertiseArea,
  ProposalPriority,
  ProposalWizardData,
  ProposalWizardStep1Data,
  ProposalWizardStep2Data,
} from '@/types/proposals';
import { ChevronLeftIcon, ChevronRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

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
    'saveDraft()',
    'recoverSession()',
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

// Session storage keys
const WIZARD_SESSION_KEY = 'posalpro_wizard_session';
const WIZARD_DRAFT_ID_KEY = 'posalpro_wizard_draft_id';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

// Initialize empty expertise areas object
const initializeExpertiseAreas = (): Record<ExpertiseArea, string> => ({
  [ExpertiseArea.TECHNICAL]: '',
  [ExpertiseArea.SECURITY]: '',
  [ExpertiseArea.LEGAL]: '',
  [ExpertiseArea.PRICING]: '',
  [ExpertiseArea.COMPLIANCE]: '',
  [ExpertiseArea.BUSINESS_ANALYSIS]: '',
});

// Convert ProposalPriority to Priority for entity operations
const convertPriorityToEntity = (proposalPriority?: ProposalPriority): Priority => {
  switch (proposalPriority) {
    case ProposalPriority.HIGH:
      return Priority.HIGH;
    case ProposalPriority.LOW:
      return Priority.LOW;
    default:
      return Priority.MEDIUM;
  }
};

// Convert Priority to ProposalPriority for wizard operations
const convertPriorityFromEntity = (priority: Priority): ProposalPriority => {
  switch (priority) {
    case Priority.HIGH:
      return ProposalPriority.HIGH;
    case Priority.LOW:
      return ProposalPriority.LOW;
    default:
      return ProposalPriority.MEDIUM;
  }
};

interface ProposalWizardProps {
  onComplete?: (proposalData: ProposalWizardData & { proposalId: string }) => void;
  onCancel?: () => void;
  initialData?: Partial<ProposalWizardData>;
  editProposalId?: string; // For editing existing proposals
}

export function ProposalWizard({
  onComplete,
  onCancel,
  initialData,
  editProposalId,
}: ProposalWizardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const analytics = useProposalCreationAnalytics();
  const proposalEntity = ProposalEntity.getInstance();

  // Session and draft management
  const [currentProposalId, setCurrentProposalId] = useState<string | null>(editProposalId || null);
  const [sessionRecovered, setSessionRecovered] = useState(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastAutoSave = useRef<number>(0);

  // Initialize wizard data with session recovery
  const [wizardData, setWizardData] = useState<ProposalWizardData>(() => {
    // Try to recover from session storage first
    if (typeof window !== 'undefined' && !editProposalId) {
      try {
        const sessionData = localStorage.getItem(WIZARD_SESSION_KEY);
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          setSessionRecovered(true);
          return {
            ...parsed,
            lastSaved: parsed.lastSaved ? new Date(parsed.lastSaved) : undefined,
          };
        }
      } catch (error) {
        console.warn('Failed to recover wizard session:', error);
      }
    }

    // Default initialization
    return {
      step1: initialData?.step1 || ({} as ProposalWizardStep1Data),
      step2:
        initialData?.step2 ||
        ({
          teamLead: '',
          salesRepresentative: '',
          subjectMatterExperts: initializeExpertiseAreas(),
          executiveReviewers: [],
        } as ProposalWizardStep2Data),
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
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Load existing proposal for editing
  useEffect(() => {
    if (editProposalId) {
      loadExistingProposal(editProposalId);
    }
  }, [editProposalId]);

  // Auto-save functionality
  useEffect(() => {
    if (
      wizardData.isDirty &&
      currentProposalId &&
      Date.now() - lastAutoSave.current > AUTO_SAVE_INTERVAL
    ) {
      autoSaveTimer.current = setTimeout(() => {
        handleAutoSave();
      }, AUTO_SAVE_INTERVAL);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [wizardData.isDirty, currentProposalId]);

  // Save session data to localStorage
  useEffect(() => {
    if (wizardData.isDirty && !editProposalId) {
      try {
        localStorage.setItem(WIZARD_SESSION_KEY, JSON.stringify(wizardData));
        if (currentProposalId) {
          localStorage.setItem(WIZARD_DRAFT_ID_KEY, currentProposalId);
        }
      } catch (error) {
        console.warn('Failed to save wizard session:', error);
      }
    }
  }, [wizardData, currentProposalId, editProposalId]);

  // Initialize analytics tracking
  useEffect(() => {
    if (sessionRecovered) {
      analytics.trackWizardStep(
        wizardData.currentStep,
        WIZARD_STEPS[wizardData.currentStep - 1].title,
        'start',
        { sessionRecovered: true }
      );
    } else {
      analytics.trackWizardStep(1, 'Basic Information', 'start');
    }
  }, [analytics, sessionRecovered, wizardData.currentStep]);

  // Load existing proposal for editing
  const loadExistingProposal = useCallback(
    async (proposalId: string) => {
      setIsLoading(true);
      try {
        const response = await proposalEntity.findById(proposalId);
        if (response.success && response.data) {
          const proposal = response.data;

          // Convert proposal data to wizard format
          const convertedData: ProposalWizardData = {
            step1: {
              client: {
                name: proposal.clientName || '',
                industry: proposal.clientContact?.jobTitle || '',
                contactPerson: proposal.clientContact?.name || '',
                contactEmail: proposal.clientContact?.email || '',
                contactPhone: proposal.clientContact?.phone || '',
              },
              details: {
                title: proposal.title,
                dueDate: proposal.deadline,
                estimatedValue: proposal.estimatedValue || 0,
                priority: convertPriorityFromEntity(proposal.priority),
                description: proposal.description || '',
              },
            },
            step2: {
              teamLead: '',
              salesRepresentative: '',
              subjectMatterExperts: initializeExpertiseAreas(),
              executiveReviewers: [],
            },
            step3: { selectedContent: [], searchHistory: [] },
            step4: { products: [] },
            step5: { sections: [], sectionAssignments: {} },
            step6: {
              finalValidation: {
                isValid: false,
                completeness: 0,
                issues: [],
                complianceChecks: [],
              },
              approvals: [],
            },
            currentStep: 1,
            isValid: new Array(6).fill(false),
            isDirty: false,
            lastSaved: proposal.updatedAt,
          };

          setWizardData(convertedData);
          setCurrentProposalId(proposalId);
        }
      } catch (error) {
        setError('Failed to load proposal for editing');
        console.error('Failed to load proposal:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [proposalEntity]
  );

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

  // Auto-save draft
  const handleAutoSave = useCallback(async () => {
    if (!wizardData.isDirty || isAutoSaving) return;

    setIsAutoSaving(true);
    try {
      if (currentProposalId) {
        // Update existing draft
        await handleSaveDraft(true);
      } else {
        // Create new draft
        await handleSaveDraft(true);
      }
      lastAutoSave.current = Date.now();
    } catch (error) {
      console.warn('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [wizardData.isDirty, currentProposalId, isAutoSaving]);

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

  // Save draft with proposal entity
  const handleSaveDraft = useCallback(
    async (isAutoSave = false) => {
      if (!isAutoSave) setIsLoading(true);

      try {
        // Convert wizard data to proposal entity format
        const proposalData = {
          metadata: {
            title: wizardData.step1.details?.title || 'Untitled Proposal',
            description:
              wizardData.step1.details?.description &&
              wizardData.step1.details.description.length >= 10
                ? wizardData.step1.details.description
                : "This proposal provides a comprehensive solution tailored to meet the client's specific requirements and objectives.",
            clientName: wizardData.step1.client?.name || 'Unknown Client',
            clientContact: {
              name: wizardData.step1.client?.contactPerson || 'Unknown Contact',
              email: wizardData.step1.client?.contactEmail || 'contact@example.com',
              phone: wizardData.step1.client?.contactPhone || '',
              jobTitle: wizardData.step1.client?.industry || '',
            },
            projectType: 'development' as const,
            estimatedValue: wizardData.step1.details?.estimatedValue || 0,
            currency: 'USD' as const,
            deadline: wizardData.step1.details?.dueDate
              ? new Date(wizardData.step1.details.dueDate)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            priority: convertPriorityToEntity(wizardData.step1.details?.priority),
            tags: [],
          },
        };

        if (currentProposalId) {
          // Update existing draft
          const response = await proposalEntity.update(currentProposalId, proposalData.metadata);
          if (response.success) {
            setWizardData(prev => ({
              ...prev,
              lastSaved: new Date(),
              isDirty: false,
            }));

            if (!isAutoSave) {
              analytics.trackWizardStep(wizardData.currentStep, 'save_draft', 'complete');
            }
          } else {
            throw new Error('Failed to update draft');
          }
        } else {
          // Create new draft proposal
          const response = await proposalEntity.create(proposalData);
          if (response.success && response.data) {
            setCurrentProposalId(response.data.id);
            setWizardData(prev => ({
              ...prev,
              lastSaved: new Date(),
              isDirty: false,
            }));

            if (!isAutoSave) {
              analytics.trackWizardStep(wizardData.currentStep, 'save_draft', 'complete');
            }
          } else {
            throw new Error('Failed to create draft');
          }
        }
      } catch (err) {
        const errorMessage = 'Failed to save draft. Please try again.';
        if (!isAutoSave) {
          setError(errorMessage);
        }
        console.error('Save draft error:', err);
      } finally {
        if (!isAutoSave) setIsLoading(false);
      }
    },
    [wizardData, currentProposalId, proposalEntity, analytics]
  );

  // Create final proposal
  const handleCreateProposal = useCallback(async () => {
    setIsLoading(true);
    try {
      // Calculate creation metrics for analytics
      const summary = analytics.getWizardSummary();

      const creationMetrics = {
        proposalId: currentProposalId || 'new-' + Date.now(),
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
        teamSize: Object.keys(wizardData.step2.subjectMatterExperts || {}).length + 2,
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

      if (currentProposalId) {
        // Update status from draft to in_progress
        const response = await proposalEntity.updateStatus(
          currentProposalId,
          'in_progress' as any,
          'Proposal creation completed'
        );

        if (response.success) {
          // Clear session storage
          localStorage.removeItem(WIZARD_SESSION_KEY);
          localStorage.removeItem(WIZARD_DRAFT_ID_KEY);

          if (onComplete) {
            onComplete({ ...wizardData, proposalId: currentProposalId });
          } else {
            router.push('/proposals/manage');
          }
        } else {
          throw new Error('Failed to finalize proposal');
        }
      } else {
        // Create new proposal directly
        const proposalData = {
          metadata: {
            title: wizardData.step1.details?.title || 'Untitled Proposal',
            description:
              wizardData.step1.details?.description &&
              wizardData.step1.details.description.length >= 10
                ? wizardData.step1.details.description
                : "This proposal provides a comprehensive solution tailored to meet the client's specific requirements and objectives.",
            clientName: wizardData.step1.client?.name || 'Unknown Client',
            clientContact: {
              name: wizardData.step1.client?.contactPerson || 'Unknown Contact',
              email: wizardData.step1.client?.contactEmail || 'contact@example.com',
              phone: wizardData.step1.client?.contactPhone || '',
              jobTitle: wizardData.step1.client?.industry || '',
            },
            projectType: 'development' as const,
            estimatedValue: wizardData.step1.details?.estimatedValue || 0,
            currency: 'USD' as const,
            deadline: wizardData.step1.details?.dueDate
              ? new Date(wizardData.step1.details.dueDate)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            priority: convertPriorityToEntity(wizardData.step1.details?.priority),
            tags: [],
          },
        };

        const response = await proposalEntity.create(proposalData);
        if (response.success && response.data) {
          // Clear session storage
          localStorage.removeItem(WIZARD_SESSION_KEY);
          localStorage.removeItem(WIZARD_DRAFT_ID_KEY);

          if (onComplete) {
            onComplete({ ...wizardData, proposalId: response.data.id });
          } else {
            router.push('/proposals/manage');
          }
        } else {
          throw new Error('Failed to create proposal');
        }
      }
    } catch (err) {
      setError('Failed to create proposal. Please try again.');
      analytics.trackWizardStep(6, 'create_proposal', 'error', { reason: 'api_error' });
      console.error('Create proposal error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [wizardData, analytics, onComplete, router, currentProposalId, proposalEntity]);

  // Handle cancel with confirmation
  const handleCancel = useCallback(() => {
    if (wizardData.isDirty) {
      setShowExitConfirm(true);
    } else {
      // Clear session storage
      localStorage.removeItem(WIZARD_SESSION_KEY);
      localStorage.removeItem(WIZARD_DRAFT_ID_KEY);

      if (onCancel) {
        onCancel();
      } else {
        router.push('/proposals/list');
      }
    }
  }, [wizardData.isDirty, onCancel, router]);

  // Handle exit with save
  const handleExitWithSave = useCallback(async () => {
    try {
      await handleSaveDraft();
      setShowExitConfirm(false);

      if (onCancel) {
        onCancel();
      } else {
        router.push('/proposals/list');
      }
    } catch (error) {
      setError('Failed to save before exit');
    }
  }, [handleSaveDraft, onCancel, router]);

  // Handle exit without save
  const handleExitWithoutSave = useCallback(() => {
    // Clear session storage
    localStorage.removeItem(WIZARD_SESSION_KEY);
    localStorage.removeItem(WIZARD_DRAFT_ID_KEY);

    setShowExitConfirm(false);
    if (onCancel) {
      onCancel();
    } else {
      router.push('/proposals/list');
    }
  }, [onCancel, router]);

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
      {/* Session Recovery Banner */}
      {sessionRecovered && (
        <Alert variant="info" className="mb-6">
          <div className="flex items-center justify-between">
            <span>Previous session recovered. You can continue from where you left off.</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                localStorage.removeItem(WIZARD_SESSION_KEY);
                setSessionRecovered(false);
              }}
            >
              Start Fresh
            </Button>
          </div>
        </Alert>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <DocumentTextIcon className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-neutral-900">
            {editProposalId ? 'Edit Proposal' : 'Create New Proposal'}
          </h1>
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
            allWizardData={wizardData}
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
            onClick={() => handleSaveDraft()}
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

          {isAutoSaving && <span className="text-sm text-blue-600">Auto-saving...</span>}
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
              editProposalId ? (
                'Update Proposal'
              ) : (
                'Create Proposal'
              )
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
                You have unsaved changes. What would you like to do?
              </p>
              <div className="flex items-center justify-end space-x-4">
                <Button variant="secondary" onClick={() => setShowExitConfirm(false)}>
                  Continue Editing
                </Button>
                <Button variant="primary" onClick={handleExitWithSave} loading={isLoading}>
                  Save & Exit
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleExitWithoutSave}
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
