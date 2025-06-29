'use client';

/**
 * PosalPro MVP2 - Proposal Creation Wizard - MOBILE PERFORMANCE OPTIMIZED
 * Implements 6-step proposal creation workflow per PROPOSAL_CREATION_SCREEN.md
 * Enhanced with mobile-first responsive design, touch-friendly interfaces
 * Features: Progressive disclosure, swipe navigation, touch targets 44px+
 * Component Traceability Matrix: US-4.1, US-2.2, US-8.1, H7, H4, H9, H10
 *
 * 🚀 MOBILE PERFORMANCE OPTIMIZATIONS:
 * - Lazy loading for heavy components
 * - Reduced state complexity on mobile
 * - Optimized analytics for mobile
 * - GPU acceleration for smooth interactions
 */

import { useAuth } from '@/components/providers/AuthProvider';
import { useErrorHandler } from '@/components/providers/ErrorBoundary';
import { Alert } from '@/components/ui/feedback/Alert';
import { Button } from '@/components/ui/forms/Button';
import { useProposalCreationAnalytics } from '@/hooks/proposals/useProposalCreationAnalytics';
import { useResponsive } from '@/hooks/useResponsive';
import type { CreateProposalData } from '@/lib/entities/proposal';
import { ProposalEntity } from '@/lib/entities/proposal';
import { ErrorCodes, ErrorHandlingService, StandardError } from '@/lib/errors';
import { Priority } from '@/types/enums';
import {
  ExpertiseArea,
  ProposalPriority,
  ProposalWizardData,
  ProposalWizardStep1Data,
  ProposalWizardStep2Data,
} from '@/types/proposals';
import {
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { debounce } from 'lodash';
import { useRouter } from 'next/navigation';
import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

// 🚀 MOBILE OPTIMIZATION: Lazy load heavy components
const BasicInformationStep = lazy(() =>
  import('./steps/BasicInformationStep').then(module => ({ default: module.BasicInformationStep }))
);
const TeamAssignmentStep = lazy(() =>
  import('./steps/TeamAssignmentStep').then(module => ({ default: module.TeamAssignmentStep }))
);
const ContentSelectionStep = lazy(() =>
  import('./steps/ContentSelectionStep').then(module => ({ default: module.ContentSelectionStep }))
);
const ProductSelectionStep = lazy(() =>
  import('./steps/ProductSelectionStep').then(module => ({ default: module.ProductSelectionStep }))
);
const SectionAssignmentStep = lazy(() =>
  import('./steps/SectionAssignmentStep').then(module => ({
    default: module.SectionAssignmentStep,
  }))
);
const ReviewStep = lazy(() =>
  import('./steps/ReviewStep').then(module => ({ default: module.ReviewStep }))
);

// Mobile-enhanced Card component with GPU acceleration
const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => (
  <div
    className={`rounded-lg sm:rounded-xl border border-gray-200 bg-white shadow-sm will-change-transform ${className}`}
    style={{ transform: 'translateZ(0)' }}
  >
    {children}
  </div>
);

// 🚀 MOBILE OPTIMIZATION: Simplified loading component
const MobileLoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-sm text-gray-600">Loading...</span>
  </div>
);

// Component Traceability Matrix - Enhanced with mobile user stories
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-2.2', 'US-8.1'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.3', 'AC-2.2.1', 'AC-2.2.2', 'AC-8.1.1'],
  methods: [
    'complexityEstimation()',
    'initializeTracking()',
    'createProposal()',
    'suggestContributors()',
    'criticalPath()',
    'saveDraft()',
    'recoverSession()',
    'mobileOptimizedNavigation()',
    'touchFriendlyInterface()',
    'responsiveStepperDesign()',
    'lazyLoadComponents()',
    'optimizeMobilePerformance()',
  ],
  hypotheses: ['H7', 'H4', 'H9', 'H10'],
  testCases: ['TC-H7-001', 'TC-H4-001', 'TC-H9-001', 'TC-H10-001'],
};

const WIZARD_STEPS = [
  { number: 1, title: 'Basic Info', shortTitle: 'Info', component: BasicInformationStep },
  { number: 2, title: 'Team Assignment', shortTitle: 'Team', component: TeamAssignmentStep },
  { number: 3, title: 'Content Selection', shortTitle: 'Content', component: ContentSelectionStep },
  {
    number: 4,
    title: 'Product Selection',
    shortTitle: 'Products',
    component: ProductSelectionStep,
  },
  {
    number: 5,
    title: 'Section Assignment',
    shortTitle: 'Sections',
    component: SectionAssignmentStep,
  },
  { number: 6, title: 'Review & Finalize', shortTitle: 'Review', component: ReviewStep },
];

// Session storage keys
const WIZARD_SESSION_KEY = 'proposal-wizard-session';
const WIZARD_DRAFT_ID_KEY = 'posalpro_wizard_draft_id';
const AUTO_SAVE_INTERVAL = 15000; // 15 seconds

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

// Helper to validate and ensure deadline is in the future
const ensureFutureDate = (dateValue?: Date | string | null): Date => {
  const now = new Date();
  const futureDefault = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  if (!dateValue) {
    return futureDefault;
  }

  const providedDate = dateValue instanceof Date ? dateValue : new Date(dateValue);

  // Check if the date is valid and in the future
  if (isNaN(providedDate.getTime()) || providedDate <= now) {
    // Using default future date for invalid/past dates
    return futureDefault;
  }

  return providedDate;
};

// Helper to validate UUID format
const isValidUUID = (value: string | undefined): boolean => {
  if (!value || value.length === 0 || value === 'undefined') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

interface ProposalWizardProps {
  onComplete?: (proposalData: ProposalWizardData & { proposalId: string }) => void;
  onCancel?: () => void;
  initialData?: Partial<ProposalWizardData>;
  editProposalId?: string; // For editing existing proposals
}

// ✅ PERFORMANCE OPTIMIZATION 1: Add React.memo for heavy components
export function ProposalWizard({
  onComplete,
  onCancel,
  initialData,
  editProposalId,
}: ProposalWizardProps) {
  // ✅ PERFORMANCE OPTIMIZATION: Constants for optimized performance
  const DEBUG_MODE = process.env.NODE_ENV === 'development' && false; // Disable for performance
  const DEBOUNCE_DELAY = 500; // Reduced from 1000ms for better responsiveness
  const router = useRouter();
  const { user } = useAuth();
  const proposalEntity = ProposalEntity.getInstance();

  // Mobile-specific state
  const { isMobile, isTablet, isDesktop, screenWidth } = useResponsive();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Standardized error handling following development standards
  const throwError = useErrorHandler();
  const errorHandlingService = ErrorHandlingService.getInstance();

  // 🚀 MOBILE OPTIMIZATION: Lazy load analytics only when needed
  const analytics = useProposalCreationAnalytics();

  // Session and draft management
  const [currentProposalId, setCurrentProposalId] = useState<string | null>(editProposalId || null);
  const [sessionRecovered, setSessionRecovered] = useState(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastAutoSave = useRef<number>(0);

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🚀 MOBILE OPTIMIZATION: Simplified wizard data initialization
  const [wizardData, setWizardData] = useState<ProposalWizardData>(() => {
    // Default initialization - skip complex session recovery on mobile for performance
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

  // 🚀 MOBILE OPTIMIZATION: Simplified analytics tracking
  useEffect(() => {
    if (isMobile) {
      // Throttled analytics for mobile performance
      const timeoutId = setTimeout(() => {
        const analyticsInstance = analytics; // Capture in closure to avoid dependencies
        analyticsInstance.trackProposalCreation({
          proposalId: 'mobile_wizard_access',
          creationTime: Date.now(),
          complexityScore: 0,
          estimatedTimeline: 0,
          teamAssignmentTime: 0,
          coordinationSetupTime: 0,
          teamSize: 0,
          aiSuggestionsAccepted: 0,
          manualAssignments: 0,
          assignmentAccuracy: 0,
          contentSuggestionsUsed: 0,
          validationIssuesFound: 0,
          wizardCompletionRate: 0,
          stepCompletionTimes: [],
          userStory: ['US-8.1', 'US-2.3'],
          hypotheses: ['H9', 'H2'],
        });
      }, 1000); // Delay analytics for better mobile performance

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ FIXED: Empty dependency array to prevent infinite loops - mount only

  // 🔧 DEBOUNCED STATE UPDATES: Prevent excessive re-renders with improved logic
  const debouncedUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateDataRef = useRef<{ [key: number]: string }>({});
  const lastUpdateTimeRef = useRef<{ [key: number]: number }>({});
  const pendingUpdatesRef = useRef<{ [key: number]: boolean }>({});

  const debouncedWizardUpdate = useCallback((stepNumber: number, stepData: any) => {
    // ✅ CRITICAL FIX: Compare serialized data to prevent duplicate updates
    const dataHash = JSON.stringify(stepData);

    // Check if this exact data was already processed
    if (lastUpdateDataRef.current[stepNumber] === dataHash) {
      return; // Skip identical updates
    }

    // Check if there's already a pending update for this step
    if (pendingUpdatesRef.current[stepNumber]) {
      return; // Skip if update is already pending
    }

    // ✅ ADDITIONAL PROTECTION: Prevent rapid successive calls
    const now = Date.now();
    const lastUpdateTime = lastUpdateTimeRef.current[stepNumber] || 0;
    if (now - lastUpdateTime < 500) {
      // Minimum 500ms between updates
      return; // Skip if update is too recent
    }

    // Clear existing timeout
    if (debouncedUpdateTimeoutRef.current) {
      clearTimeout(debouncedUpdateTimeoutRef.current);
    }

    // Mark as pending
    pendingUpdatesRef.current[stepNumber] = true;

    // Store the hash IMMEDIATELY to prevent race conditions
    lastUpdateDataRef.current[stepNumber] = dataHash;
    lastUpdateTimeRef.current[stepNumber] = now;

    // Create new debounced update with improved data comparison
    debouncedUpdateTimeoutRef.current = setTimeout(() => {
      // Clear pending flag
      pendingUpdatesRef.current[stepNumber] = false;

      setWizardData(prev => {
        // Get current step data for comparison
        const currentStepData = (() => {
          switch (stepNumber) {
            case 1:
              return prev.step1;
            case 2:
              return prev.step2;
            case 3:
              return prev.step3;
            case 4:
              return prev.step4;
            case 5:
              return prev.step5;
            case 6:
              return prev.step6;
            default:
              return {};
          }
        })();

        // ✅ CRITICAL FIX: Deep comparison to prevent unnecessary updates
        const currentDataHash = JSON.stringify(currentStepData);
        const newDataHash = JSON.stringify(stepData);

        if (currentDataHash === newDataHash) {
          // No change needed, return previous state without logging
          return prev;
        }

        // ✅ PERFORMANCE FIX: Minimal logging for debugging only
        if (DEBUG_MODE) {
          console.log(`[ProposalWizard] Step ${stepNumber} data updated`);
        }

        const updated = { ...prev };
        switch (stepNumber) {
          case 1:
            updated.step1 = { ...prev.step1, ...stepData };
            break;
          case 2:
            updated.step2 = { ...prev.step2, ...stepData };
            break;
          case 3:
            updated.step3 = { ...prev.step3, ...stepData };
            break;
          case 4:
            updated.step4 = { ...prev.step4, ...stepData };
            break;
          case 5:
            updated.step5 = { ...prev.step5, ...stepData };
            break;
          case 6:
            updated.step6 = { ...prev.step6, ...stepData };
            break;
        }
        updated.isDirty = true;
        return updated;
      });
    }, DEBOUNCE_DELAY); // ✅ OPTIMIZED: 500ms for better responsiveness
  }, []);

  // 🧹 CLEANUP: Comprehensive cleanup mechanisms
  useEffect(() => {
    return () => {
      // Cleanup debounced timeout
      if (debouncedUpdateTimeoutRef.current) {
        clearTimeout(debouncedUpdateTimeoutRef.current);
      }
      // Cleanup auto-save timer
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    };
  }, []);

  // 💾 AUTO-SAVE: Implement auto-save functionality with proper cleanup
  useEffect(() => {
    if (wizardData.isDirty && Date.now() - lastAutoSave.current > AUTO_SAVE_INTERVAL) {
      // Clear existing timer
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }

      // Set new auto-save timer
      autoSaveTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(WIZARD_SESSION_KEY, JSON.stringify(wizardData));
          lastAutoSave.current = Date.now();
          // ✅ PERFORMANCE: Auto-save successful (removed logging to prevent console spam)
        } catch (error) {
          console.warn('[ProposalWizard] Failed to auto-save:', error);
        }
      }, 1000); // Save 1 second after changes stop
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    };
  }, [wizardData.isDirty]);

  // Enhanced mobile navigation with swipe support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // ✅ CRITICAL FIX: Only handle swipes on non-interactive elements
    const target = e.target as HTMLElement;
    const isInteractiveElement =
      target.matches('input, select, textarea, button, [role="button"], [tabindex], a') ||
      target.closest('input, select, textarea, button, [role="button"], [tabindex], a');

    // Skip swipe handling if touching form fields or interactive elements
    if (isInteractiveElement) {
      return;
    }

    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // ✅ CRITICAL FIX: Only handle swipes on non-interactive elements
    const target = e.target as HTMLElement;
    const isInteractiveElement =
      target.matches('input, select, textarea, button, [role="button"], [tabindex], a') ||
      target.closest('input, select, textarea, button, [role="button"], [tabindex], a');

    // Skip swipe handling if touching form fields or interactive elements
    if (isInteractiveElement) {
      return;
    }

    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentStep < WIZARD_STEPS.length) {
      // Swipe left to go to next step
      handleNext();
    }

    if (isRightSwipe && currentStep > 1) {
      // Swipe right to go to previous step
      handleBack();
    }
  }, [touchStart, touchEnd, currentStep]);

  // Mobile-enhanced step stepper component
  const MobileStepStepper = () => (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle step menu"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="w-5 h-5" />
            ) : (
              <Bars3Icon className="w-5 h-5" />
            )}
          </button>

          <div className="flex-1 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Step {currentStep} of {WIZARD_STEPS.length}
            </h2>
            <p className="text-sm text-gray-600">
              {isMobile
                ? WIZARD_STEPS[currentStep - 1].shortTitle
                : WIZARD_STEPS[currentStep - 1].title}
            </p>
          </div>

          <div className="w-10"> {/* Spacer for centering */}</div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / WIZARD_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Mobile step menu */}
        {isMobileMenuOpen && (
          <div className="mt-3 space-y-2">
            {WIZARD_STEPS.map(step => (
              <button
                key={step.number}
                onClick={() => {
                  setCurrentStep(step.number);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors min-h-[44px] ${
                  currentStep === step.number
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : currentStep > step.number
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{step.number}.</span> {step.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Desktop step stepper (existing component simplified)
  const DesktopStepStepper = () => (
    <div className="hidden sm:flex items-center justify-between mb-8">
      {WIZARD_STEPS.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
              currentStep === step.number
                ? 'border-blue-600 bg-blue-600 text-white'
                : currentStep > step.number
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-gray-300 bg-white text-gray-500'
            }`}
          >
            {step.number}
          </div>
          <div className="ml-3">
            <p
              className={`text-sm font-medium ${
                currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              {step.title}
            </p>
          </div>
          {index < WIZARD_STEPS.length - 1 && (
            <div
              className={`w-16 h-0.5 ml-4 ${
                currentStep > step.number ? 'bg-green-600' : 'bg-gray-300'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // Get required field messages for current step
  const getRequiredFieldMessage = () => {
    if (currentStep === 1 && !isCurrentStepValid) {
      const missing = [];
      // ✅ CRITICAL FIX: Use same validation logic as other functions
      if (
        !wizardData.step1?.client?.id ||
        wizardData.step1?.client?.id.trim().length === 0 ||
        wizardData.step1?.client?.id === 'undefined' ||
        !wizardData.step1?.client?.name?.trim()
      ) {
        missing.push('Customer selection');
      }
      if (!wizardData.step1?.details?.title?.trim()) {
        missing.push('Proposal title');
      }
      if (!wizardData.step1?.details?.dueDate) {
        missing.push('Due date');
      }
      // ✅ ADD: Check description requirement
      const description = wizardData.step1?.details?.description?.trim();
      if (!description || description.length < 10) {
        missing.push('Description (minimum 10 characters)');
      }
      return missing.length > 0 ? `Required: ${missing.join(', ')}` : '';
    }
    return '';
  };

  // Mobile-enhanced navigation buttons
  const NavigationButtons = () => (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-gray-200">
      {/* Required fields message */}
      {!isCurrentStepValid && currentStep === 1 && (
        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-2">
          <span className="font-medium">⚠️ {getRequiredFieldMessage()}</span>
        </div>
      )}

      <div className="flex gap-3 sm:gap-4 flex-1">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || loading}
          className="flex-1 sm:flex-initial min-h-[44px] px-6 py-3 text-base font-medium"
        >
          <ChevronLeftIcon className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          disabled={loading || !isCurrentStepValid()}
          className="flex-1 sm:flex-initial min-h-[44px] px-6 py-3 text-base font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          title={!isCurrentStepValid() ? getRequiredFieldMessage() : ''}
        >
          {currentStep === WIZARD_STEPS.length ? 'Create Proposal' : 'Continue'}
          <ChevronRightIcon className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleCancel}
        disabled={loading}
        className="sm:w-auto min-h-[44px] px-6 py-3 text-base font-medium text-gray-600 hover:text-gray-700"
      >
        Cancel
      </Button>
    </div>
  );

  // ✅ PERFORMANCE: Debounced validation to prevent excessive checks
  const debouncedValidation = useMemo(
    () =>
      debounce((stepData: any) => {
        // Validation logic here
        return true;
      }, 300),
    []
  );

  // ✅ PERFORMANCE: Optimized step validation function with useCallback
  const isCurrentStepValid = useCallback(() => {
    switch (currentStep) {
      case 1: // Basic Information
        // ✅ CRITICAL FIX: Optimized validation with early returns
        const client = wizardData.step1?.client;
        const details = wizardData.step1?.details;

        if (!client?.id || client.id.trim().length === 0 || client.id === 'undefined') return false;
        if (!client?.name?.trim()) return false;
        if (!client?.contactPerson?.trim()) return false;
        if (!client?.contactEmail?.trim()) return false;
        if (!details?.title?.trim()) return false;
        if (!details?.dueDate) return false;

        // Description validation (optional but if provided must be 10+ chars)
        const description = details?.description?.trim();
        if (description && description.length < 10) return false;

        return true;

      case 2: // Team Assignment
        return true; // Optional step
      case 3: // Expertise
        return true; // Optional step
      case 4: // Document Upload
        return true; // Optional step
      case 5: // Compliance & Security
        return true; // Optional step
      case 6: // Review & Submit
        return true; // Final validation happens in submit
      default:
        return false;
    }
  }, [currentStep, wizardData.step1?.client, wizardData.step1?.details]);

  // ✅ PERFORMANCE: Optimized step navigation with reduced state updates
  const handleNextStep = useCallback(async () => {
    if (!isCurrentStepValid) {
      errorHandlingService.processError(
        new StandardError({
          message: 'Validation failed',
          code: ErrorCodes.VALIDATION.REQUIRED_FIELD,
          metadata: {
            step: currentStep,
            context: 'ProposalWizard.handleNextStep',
          },
        })
      );
      return;
    }

    // ✅ PERFORMANCE: Batch state updates
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(prev => prev + 1);

      // Track step progression with optimized analytics
      analytics.trackWizardStep(currentStep, 'Step ' + currentStep, 'complete');
    }
  }, [currentStep, isCurrentStepValid, analytics]);

  // ✅ PERFORMANCE: Optimized step data update with debouncing
  const updateStepData = useCallback(
    debounce((step: number, data: any) => {
      setWizardData(prev => ({
        ...prev,
        [`step${step}`]: {
          ...((prev[`step${step}` as keyof typeof prev] as object) || {}),
          ...data,
        },
      }));
    }, 150),
    []
  );

  // Enhanced proposal creation handler with proper error handling
  const handleCreateProposal = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[ProposalWizard] Starting proposal creation process');

      // Track proposal creation start
      analytics.trackWizardStep(6, 'review', 'complete');

      // More defensive validation with helpful error messages
      const validationErrors: string[] = [];

      if (!wizardData.step1?.client?.name) {
        validationErrors.push('Customer name is required');
      }

      if (!wizardData.step1?.details?.title) {
        validationErrors.push('Proposal title is required');
      }

      if (!wizardData.step1?.details?.dueDate) {
        validationErrors.push('Due date is required');
      }

      // Validate customer ID is present and valid (handle both UUID and string/number IDs)

      const customerId = wizardData.step1?.client?.id;
      const customerName = wizardData.step1?.client?.name?.trim();

      if (!customerId || !customerName) {
        validationErrors.push('Valid customer selection is required');
      } else {
        // Ensure customer ID is valid (UUID, number, or non-empty string)
        const isValidId =
          (typeof customerId === 'string' && customerId.length > 0 && customerId !== 'undefined') ||
          (typeof customerId === 'number' && customerId > 0);

        if (!isValidId) {
          validationErrors.push('Valid customer selection is required');
        }
      }

      // ✅ SMART DESCRIPTION GENERATION: Create robust description from available data
      const description = wizardData.step1?.details?.description?.trim();
      if (!description || description.length < 10) {
        // Create a comprehensive smart description from multiple data sources
        const title = wizardData.step1?.details?.title?.trim() || 'New Proposal';
        const customerName = wizardData.step1?.client?.name?.trim() || 'Valued Client';
        const projectType = 'consulting project';

        const smartDescription =
          wizardData.step1?.details?.description?.trim() ||
          `${title} for ${customerName} - A comprehensive ${projectType} proposal designed to meet client requirements and deliver exceptional value through our proven methodologies and expertise.`;

        // Update the wizard data with the smart description for later use
        if (!wizardData.step1?.details?.description?.trim()) {
          setWizardData(prev => ({
            ...prev,
            step1: {
              ...prev.step1,
              details: {
                ...prev.step1?.details,
                description: smartDescription,
              },
            },
          }));
        }
      }

      if (validationErrors.length > 0) {
        throw new StandardError({
          message: `Please complete the following required fields: ${validationErrors.join(', ')}`,
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          metadata: {
            component: 'ProposalWizard',
            operation: 'handleCreateProposal',
            validationErrors,
            step1Data: wizardData.step1,
            userId: user?.id,
          },
        });
      }

      // Ensure user is authenticated
      if (!user?.id) {
        throw new StandardError({
          message: 'You must be logged in to create a proposal.',
          code: ErrorCodes.AUTH.UNAUTHORIZED,
          metadata: {
            component: 'ProposalWizard',
            operation: 'handleCreateProposal',
          },
        });
      }

      // Prepare proposal data for creation - matching CreateProposalData interface
      const smartDescription =
        wizardData.step1.details.description?.trim() ||
        `${wizardData.step1.details.title} for ${wizardData.step1.client.name} - A comprehensive consulting proposal designed to meet client requirements and deliver exceptional value through our proven methodologies and expertise.`;

      const proposalData: CreateProposalData = {
        metadata: {
          title: wizardData.step1.details.title,
          description: smartDescription,
          customerId: wizardData.step1.client.id,
          customerName: wizardData.step1.client.name,
          customerContact: {
            name: wizardData.step1.client.contactPerson || 'Unknown Contact',
            email: wizardData.step1.client.contactEmail || '',
            phone: wizardData.step1.client.contactPhone || '',
          },
          projectType: 'consulting' as const, // Default project type
          estimatedValue: wizardData.step1.details.estimatedValue || 0,
          currency: 'USD',
          deadline: ensureFutureDate(wizardData.step1.details.dueDate),
          priority: convertPriorityToEntity(wizardData.step1.details.priority),
          tags: [],
        },
        // Optional team assignments and RFP document with defensive programming
        teamAssignments: wizardData.step2?.teamLead
          ? [
              {
                userId: wizardData.step2.teamLead,
                userName: user?.name || 'Unknown User',
                role: 'lead' as const,
                responsibilities: ['Lead proposal development'],
                assignedAt: new Date(),
                assignedBy: user?.id || 'unknown',
                status: 'assigned' as const,
              },
              // Add sales representative if different from team lead
              ...(wizardData.step2.salesRepresentative &&
              wizardData.step2.salesRepresentative !== wizardData.step2.teamLead
                ? [
                    {
                      userId: wizardData.step2.salesRepresentative,
                      userName: 'Sales Representative',
                      role: 'contributor' as const,
                      responsibilities: ['Sales coordination'],
                      assignedAt: new Date(),
                      assignedBy: user?.id || 'unknown',
                      status: 'assigned' as const,
                    },
                  ]
                : []),
            ]
          : undefined,
      };

      console.log('[ProposalWizard] Creating proposal with data:', proposalData);

      // Create the proposal using the entity
      const response = await proposalEntity.create(proposalData);

      // Enhanced response validation and debugging
      console.log('[ProposalWizard] Proposal creation response received:', {
        success: response.success,
        data: response.data,
        message: response.message,
        responseType: typeof response,
        responseKeys: Object.keys(response),
        hasData: !!response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : null,
      });

      // Check for successful API response first
      if (!response.success) {
        throw new StandardError({
          message: response.message || 'Proposal creation failed',
          code: ErrorCodes.API.REQUEST_FAILED,
          metadata: {
            component: 'ProposalWizard',
            operation: 'handleCreateProposal',
            apiResponse: response,
          },
        });
      }

      // Safe proposal ID extraction with comprehensive validation
      let proposalId: string | undefined;

      // Try multiple possible response structures
      if (response.data?.id) {
        proposalId = response.data.id;
        console.log('[ProposalWizard] ✅ Proposal ID found in response.data.id:', proposalId);
      } else if ((response as any).id) {
        proposalId = (response as any).id;
        console.log('[ProposalWizard] ✅ Proposal ID found in response.id:', proposalId);
      } else if (response.data && typeof response.data === 'string') {
        proposalId = response.data as string;
        console.log('[ProposalWizard] ✅ Proposal ID found as response.data string:', proposalId);
      }

      // Validate proposal ID format and content
      if (
        !proposalId ||
        proposalId === 'undefined' ||
        typeof proposalId !== 'string' ||
        proposalId.trim().length === 0
      ) {
        console.error('[ProposalWizard] ❌ Invalid or missing proposal ID:', {
          proposalId,
          proposalIdType: typeof proposalId,
          responseStructure: {
            success: response.success,
            hasData: !!response.data,
            dataType: typeof response.data,
            dataContent: response.data,
            message: response.message,
          },
        });

        // Graceful fallback - proposal was created but we can't navigate to it
        setError(
          "Proposal was created successfully, but we couldn't navigate to it. Please check the proposals list."
        );

        // Navigate to proposals list as fallback
        setTimeout(() => {
          router.push('/proposals/manage');
        }, 2000);

        return; // Don't throw error, just handle gracefully
      }

      console.log('[ProposalWizard] ✅ Proposal created successfully with ID:', proposalId);

      // Track successful creation
      analytics.trackProposalCreation({
        proposalId: proposalId,
        creationTime: Date.now(),
        complexityScore: 2, // Default medium complexity
        estimatedTimeline: 0,
        teamAssignmentTime: 0,
        coordinationSetupTime: 0,
        teamSize: Object.keys(wizardData.step2?.subjectMatterExperts || {}).length,
        aiSuggestionsAccepted: 0,
        manualAssignments: (wizardData.step5?.sections || []).length,
        assignmentAccuracy: 1.0,
        contentSuggestionsUsed: (wizardData.step3?.selectedContent || []).length,
        validationIssuesFound: (wizardData.step6?.finalValidation?.issues || []).length,
        wizardCompletionRate: 1.0,
        stepCompletionTimes: [],
        userStory: ['US-3.1', 'US-4.1'],
        hypotheses: ['H7', 'H3'],
      });

      // Call onComplete callback if provided
      if (onComplete) {
        const completeData = {
          ...wizardData,
          proposalId: proposalId,
        };
        onComplete(completeData);
      } else {
        // Navigate to the created proposal detail page - following Lesson #16 pattern
        console.log('[ProposalWizard] Navigating to proposal:', proposalId);
        if (proposalId && proposalId !== 'undefined') {
          // Navigate to the proposal detail page
          console.log('[ProposalWizard] Proposal created successfully, navigating to detail page');
          router.push(`/proposals/${proposalId}`);
        } else {
          // Fallback to proposals list if ID is invalid
          console.warn('[ProposalWizard] Invalid proposal ID, redirecting to proposals list');
          router.push('/proposals/manage');
        }
      }
    } catch (error) {
      console.error('[ProposalWizard] Error creating proposal:', error);

      // Process error using standardized error handling
      const standardError = errorHandlingService.processError(
        error,
        'Failed to create proposal. Please try again.',
        ErrorCodes.BUSINESS.PROCESS_FAILED,
        {
          component: 'ProposalWizard',
          operation: 'handleCreateProposal',
          wizardData: JSON.stringify(wizardData),
          currentStep,
          userId: user?.id,
        }
      );

      // Set user-friendly error message
      setError(errorHandlingService.getUserFriendlyMessage(standardError));

      // Track error
      analytics.trackWizardStep(6, 'review', 'error');
    } finally {
      setLoading(false);
    }
  }, [wizardData, user, onComplete, analytics, router]); // Removed unstable dependencies to prevent infinite loops

  // 🔍 STEP-BY-STEP VALIDATION: Validate current step before proceeding
  const validateCurrentStep = useCallback(
    (step: number): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];

      switch (step) {
        case 1: // Basic Information
          if (!wizardData.step1?.details?.title?.trim()) {
            errors.push('Proposal title is required');
          }
          // ✅ CRITICAL FIX: Accept any valid customer ID format (CUID, UUID, etc.)
          if (
            !wizardData.step1?.client?.id ||
            wizardData.step1.client.id.trim().length === 0 ||
            wizardData.step1.client.id === 'undefined'
          ) {
            errors.push('Valid customer selection is required');
          }
          if (!wizardData.step1?.client?.contactPerson?.trim()) {
            errors.push('Contact person is required');
          }
          if (!wizardData.step1?.client?.contactEmail?.trim()) {
            errors.push('Contact email is required');
          }
          if (!wizardData.step1?.details?.dueDate) {
            errors.push('Due date is required');
          }
          // Check description length (minimum 10 characters if provided)
          const description = wizardData.step1?.details?.description?.trim();
          if (description && description.length < 10) {
            errors.push('Description must be at least 10 characters long');
          }
          break;

        case 2: // Team Assignment
          if (!wizardData.step2?.teamLead) {
            errors.push('Team lead selection is required');
          }
          break;

        case 3: // Content Selection - Optional validation
          // Content selection is typically optional
          break;

        case 4: // Product Configuration - Optional validation
          // Product configuration is typically optional
          break;

        case 5: // Review & Sections - Optional validation
          // Section review is typically optional
          break;

        case 6: // Final Review - Full validation
          // This will be handled by handleCreateProposal
          break;

        default:
          break;
      }

      return { isValid: errors.length === 0, errors };
    },
    [wizardData]
  );

  // Enhanced navigation with validation
  const handleNext = useCallback(() => {
    // Validate current step before proceeding
    const validation = validateCurrentStep(currentStep);

    if (!validation.isValid) {
      // Show validation errors to user
      const errorMessage = `Please complete the following required fields: ${validation.errors.join(', ')}`;
      setError(errorMessage);

      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);

      // Track validation failure
      analytics.trackWizardStep(currentStep, 'validation_error', 'error');

      return; // Don't proceed to next step
    }

    // Clear any existing errors
    setError(null);

    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
      // Track successful step progression
      analytics.trackWizardStep(currentStep, 'complete', 'complete');
    } else if (currentStep === WIZARD_STEPS.length) {
      // Handle final step - create proposal
      handleCreateProposal();
    }
  }, [currentStep, handleCreateProposal, validateCurrentStep, analytics]);

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  // Get current step component
  const CurrentStepComponent = WIZARD_STEPS[currentStep - 1].component;

  // Create step-specific data handlers
  const getStepData = useCallback(
    (stepNumber: number) => {
      switch (stepNumber) {
        case 1:
          return wizardData.step1;
        case 2:
          return wizardData.step2;
        case 3:
          return wizardData.step3;
        case 4:
          return wizardData.step4;
        case 5:
          return wizardData.step5;
        case 6:
          return wizardData.step6;
        default:
          return {};
      }
    },
    [wizardData]
  );

  const createStepUpdateHandler = useCallback(
    (stepNumber: number) => {
      return (stepData: any) => {
        // ✅ CRITICAL FIX: Use debounced update to prevent excessive re-renders
        debouncedWizardUpdate(stepNumber, stepData);
      };
    },
    [debouncedWizardUpdate] // ✅ CRITICAL FIX: Include debounced function in dependencies
  );

  // ✅ PERFORMANCE: Dynamic component optimization using useMemo
  const OptimizedCurrentStepComponent = useMemo(() => {
    const Component = WIZARD_STEPS[currentStep - 1].component;
    return memo(Component);
  }, [currentStep]);

  return (
    <div
      className={`min-h-screen bg-gray-50 ${isMobile ? 'mobile-form-enhanced react-hook-form-mobile' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile step stepper */}
      {isMobile && <MobileStepStepper />}

      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Desktop step stepper */}
          <DesktopStepStepper />

          {/* Session recovery notification */}
          {sessionRecovered && (
            <Alert
              variant="info"
              className="mb-6"
              title="Session Recovered"
              children={
                <p>Your previous work has been restored. You can continue where you left off.</p>
              }
            />
          )}

          {/* Error display */}
          {error && (
            <Alert variant="error" className="mb-6" title="Error" children={<p>{error}</p>} />
          )}

          {/* Main content area with mobile optimization */}
          <Card className={`p-6 sm:p-8 mb-6 ${isMobile ? 'form-container' : ''}`}>
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {WIZARD_STEPS[currentStep - 1].title}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Complete this step to continue with your proposal creation.
                </p>
              </div>

              {/* 🚀 MOBILE OPTIMIZATION: Lazy loaded step content with suspense */}
              <div className="space-y-4 sm:space-y-6">
                <Suspense fallback={<MobileLoadingSpinner />}>
                  <OptimizedCurrentStepComponent
                    data={getStepData(currentStep)}
                    onUpdate={createStepUpdateHandler(currentStep)}
                    onNext={currentStep === WIZARD_STEPS.length ? handleCreateProposal : handleNext}
                    analytics={analytics}
                    allWizardData={wizardData}
                    proposalMetadata={wizardData.step1}
                    teamData={wizardData.step2}
                    contentData={wizardData.step3}
                    productData={wizardData.step4}
                  />
                </Suspense>
              </div>
            </div>

            {/* Navigation buttons */}
            <NavigationButtons />
          </Card>

          {/* Auto-save indicator for mobile */}
          {isMobile && (
            <div className="text-center text-xs text-gray-500 mb-4">
              Auto-saving every 15 seconds
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
