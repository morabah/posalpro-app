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

import { useToast } from '@/components/feedback/Toast/ToastProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useCreateProposal, useProposal, useUpdateProposal } from '@/features/proposals/hooks';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { http } from '@/lib/http';
import type { ProposalWithRelations } from '@/types/proposal';
import { logDebug, logError, logWarn } from '@/lib/logger';
import {
  useProposalCanGoBack,
  useProposalCanProceed,
  useProposalCurrentStep,
  useProposalInitializeFromData,
  useProposalIsSubmitting,
  useProposalNextStep,
  useProposalPlanType,
  useProposalPreviousStep,
  useProposalResetWizard,
  useProposalSetCurrentStep,
  useProposalSetPlanType,
  useProposalStepData,
  useProposalStore,
  useProposalSubmitProposal,
  useProposalTotalSteps,
  type ProposalBasicInfo,
  type ProposalProductData,
  type ProposalSectionData,
  type ProposalTeamData,
} from '@/lib/store/proposalStore';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  buildCreateBodyFromStore,
  buildWizardPayloadFromStore,
  saveDraftToLocalStorage,
} from './wizard/persistence';
import { WizardHeader } from './wizard/WizardHeader';
import { WizardSidebar } from './wizard/WizardSidebar';

// Type definitions for proposal wizard
interface ProposalStepData {
  title?: string;
  customerId?: string;
  customer?: {
    name?: string;
    industry?: string;
  };
  description?: string;
  dueDate?: string | Date;
  priority?: string;
  currency?: string;
  teamLead?: string;
  salesRepresentative?: string;
  products?: ProposalProductData[];
  totalValue?: number;
  [key: string]: unknown;
}

interface ProposalProduct {
  id: string;
  productId?: string;
  name: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
  category?: string;
}

interface ProposalPreview {
  company: {
    name: string;
    industry?: string;
  };
  proposal: {
    title: string;
    description: string;
    dueDate: string | Date | null;
    priority: string;
  };
  products: ProposalProduct[];
  totals: {
    currency: string;
    amount: number;
  };
  terms: unknown[];
}
// Icons now handled inside extracted components
import { flushPendingSectionCreatesAndUpdates } from '@/features/proposal-sections/publicApi';
import { useSectionAssignmentStore } from '@/features/proposal-sections/store';
import { useCallback, useEffect, useMemo, useRef } from 'react';

// Step components - Lazy loaded for code splitting
import { lazy, Suspense } from 'react';

const BasicInformationStep = lazy(() =>
  import('./steps/BasicInformationStep').then(m => ({ default: m.BasicInformationStep }))
);
const ContentSelectionStep = lazy(() =>
  import('./steps/ContentSelectionStep').then(m => ({ default: m.ContentSelectionStep }))
);
const ProductSelectionStep = lazy(() =>
  import('./steps/ProductSelectionStep').then(m => ({ default: m.ProductSelectionStep }))
);
const ReviewStep = lazy(() => import('./steps/ReviewStep').then(m => ({ default: m.ReviewStep })));
const SectionAssignmentStep = lazy(() =>
  import('./steps/SectionAssignmentStep').then(m => ({ default: m.SectionAssignmentStep }))
);
const TeamAssignmentStep = lazy(() =>
  import('./steps/TeamAssignmentStep').then(m => ({ default: m.TeamAssignmentStep }))
);

// Loading component for step chunks
const StepLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="text-sm text-gray-600">Loading step...</p>
    </div>
  </div>
);

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
  onComplete?: (data: string | object) => void | Promise<void>;
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
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Use individual selectors to prevent object creation and infinite re-renders
  const currentStep = useProposalCurrentStep();
  const totalSteps = useProposalTotalSteps();
  const planType = useProposalPlanType();
  const canProceed = useProposalCanProceed();
  const canGoBack = useProposalCanGoBack();
  const isSubmitting = useProposalIsSubmitting();

  const nextStep = useProposalNextStep();
  const previousStep = useProposalPreviousStep();
  const setCurrentStep = useProposalSetCurrentStep();
  const setPlanType = useProposalSetPlanType();
  const submitProposal = useProposalSubmitProposal();
  const updateProposalMutation = useUpdateProposal();
  const resetWizard = useProposalResetWizard();
  const initializeFromData = useProposalInitializeFromData();

  // Hook must be called at component level, not inside callbacks
  const createProposal = useCreateProposal();

  // Keep hook order stable: derive finish disabled state at top-level
  const finishDisabled = useSectionAssignmentStore(s => s.sectionsDirty);

  // Prevent duplicate initialization
  const hasInitializedRef = useRef(false);

  // Use specific step data selectors to avoid infinite re-renders
  const step1Data = useProposalStepData(1) as ProposalBasicInfo | undefined;
  const step2Data = useProposalStepData(2) as ProposalTeamData | undefined;
  const step4Data = useProposalStepData(4) as ProposalProductData | undefined;
  const step5Data = useProposalStepData(5) as ProposalSectionData | undefined;
  const currentStepData = useProposalStepData(currentStep);

  // Debug logging for step data
  logDebug('ProposalWizard: Step data loaded', {
    component: 'ProposalWizard',
    operation: 'step_data_loaded',
    currentStep,
    editMode,
    proposalId,
    step1DataKeys: step1Data ? Object.keys(step1Data) : [],
    step2DataKeys: step2Data ? Object.keys(step2Data) : [],
    step2TeamLead: step2Data?.teamLead,
    step2SalesRep: step2Data?.salesRepresentative,
    step2SMEs: step2Data?.subjectMatterExperts,
    step2Executives: step2Data?.executiveReviewers,
    step4DataKeys: step4Data ? Object.keys(step4Data) : [],
    step5DataKeys: step5Data ? Object.keys(step5Data) : [],
    currentStepDataKeys: currentStepData ? Object.keys(currentStepData) : [],
    userStory: 'US-3.1',
    hypothesis: 'H4',
  });

  // Fetch proposal data for edit mode - only when we have a valid proposalId
  const { data: proposalDataRaw, isLoading: isLoadingProposal } = useProposal(
    editMode && proposalId && typeof proposalId === 'string' ? proposalId : ''
  );

  // Cast to the correct type that includes relations
  const proposalData = proposalDataRaw as ProposalWithRelations | undefined;

  // Initialize wizard with existing data when in edit mode (prevent duplicate initialization)
  useEffect(() => {
    if (editMode && proposalData && !isLoadingProposal && !hasInitializedRef.current) {
      hasInitializedRef.current = true; // Mark as initialized

      // Reduced logging - only in development
      if (process.env.NODE_ENV === 'development') {
        logDebug('ProposalWizard: Initializing with existing data', {
          component: 'ProposalWizard',
          operation: 'initializeFromData',
          proposalId,
          hasData: !!proposalData,
        });
      }

      try {
        // ✅ FIXED: Pass raw proposal data to store (store handles transformation internally)
        initializeFromData({
          ...proposalData,
          description: proposalData.description || undefined,
          dueDate: proposalData.dueDate
            ? typeof proposalData.dueDate === 'string'
              ? proposalData.dueDate
              : (proposalData.dueDate as Date).toISOString()
            : undefined,
          assignedTo: (proposalData as any).assignedTo
            ? [(proposalData as any).assignedTo]
            : undefined,
          submittedAt: proposalData.submittedAt
            ? typeof proposalData.submittedAt === 'string'
              ? proposalData.submittedAt
              : (proposalData.submittedAt as Date).toISOString()
            : undefined,
        });
        // Ensure edit opens on step 4 directly
        setCurrentStep(4);

        analytics.trackOptimized('wizard_edit_mode_initialized', {
          proposalId,
          editMode,
        });
      } catch (error) {
        logError('Failed to initialize wizard with existing data', {
          component: 'ProposalWizard',
          operation: 'initializeFromData',
          proposalId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }, [
    editMode,
    proposalData,
    isLoadingProposal,
    proposalId,
    initializeFromData,
    setCurrentStep,
    analytics,
  ]);

  // Visible steps based on plan type
  const visibleStepIds = useMemo(() => {
    if (planType === 'BASIC') return [1, 4, 6];
    if (planType === 'PROFESSIONAL') return [1, 2, 4, 6];
    return [1, 2, 3, 4, 5, 6];
  }, [planType]);

  const visibleSteps = useMemo(
    () => STEP_META.filter(s => visibleStepIds.includes(s.id)),
    [visibleStepIds]
  );

  // Current step component
  const CurrentStepComponent = useMemo(() => {
    const step = STEP_META.find(s => s.id === currentStep);
    return step?.component || BasicInformationStep;
  }, [currentStep]);

  // Preload next step for better UX
  const preloadNextStep = useCallback(() => {
    const nextStep = STEP_META.find(s => s.id === currentStep + 1);
    if (nextStep) {
      // Map component names to their file names for preloading
      const stepFileMap: Record<string, string> = {
        BasicInformationStep: 'BasicInformationStep',
        TeamAssignmentStep: 'TeamAssignmentStep',
        ContentSelectionStep: 'ContentSelectionStep',
        ProductSelectionStep: 'ProductSelectionStep',
        SectionAssignmentStep: 'SectionAssignmentStep',
        ReviewStep: 'ReviewStep',
      };

      const fileName = stepFileMap[nextStep.component.name];
      if (fileName) {
        import(`./steps/${fileName}`);
      }
    }
  }, [currentStep]);

  // Preload the first step on mount for better UX
  useEffect(() => {
    preloadNextStep();
  }, [preloadNextStep]);

  // Build payload to save (used for per-step update)
  const buildWizardPayload = useCallback(() => buildWizardPayloadFromStore(planType), [planType]);

  const handleUpdateCurrent = useCallback(async () => {
    if (!editMode || !proposalId) return;
    try {
      // Wait for any in-flight section creations/edits to settle
      try {
        await flushPendingSectionCreatesAndUpdates();
      } catch (error) {
        console.warn('Error flushing pending section updates:', error);
      }
      const payload = buildWizardPayload();

      // Debug logging for update payload
      logDebug('ProposalWizard: Update payload', {
        component: 'ProposalWizard',
        operation: 'update_proposal',
        proposalId,
        payloadKeys: Object.keys(payload),
        stepDataKeys: Object.keys(useProposalStore.getState().stepData),
        teamData: payload.teamData,
        productData: payload.productData,
        sectionData: payload.sectionData,
        reviewData: payload.reviewData,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      await http.put(`/api/proposals/${proposalId}`, payload);
      // After products persisted (ids stable), flush any pending assignments
      try {
        const { assignmentsDirty, flushPendingAssignments } = useSectionAssignmentStore.getState();
        if (assignmentsDirty) await flushPendingAssignments(proposalId);
      } catch (error) {
        console.warn('Error flushing pending assignments:', error);
      }
      // ✅ IMPROVED: Add small delay to ensure cache invalidation completes
      await new Promise(resolve => setTimeout(resolve, 100));

      const { planOk, countOk, totalOk } = await (
        await import('./wizard/persistence')
      ).verifyPersistedProposal(proposalId, payload);

      // ✅ IMPROVED: Invalidate caches using aggressive strategy
      try {
        const { proposalKeys } = await import('@/features/proposals');
        // Use the same aggressive invalidation as useUpdateProposal
        queryClient.setQueryData(proposalKeys.proposals.byId(proposalId), undefined);
        queryClient.invalidateQueries({ queryKey: proposalKeys.proposals.all, exact: true });
        queryClient.invalidateQueries({
          queryKey: proposalKeys.proposals.byId(proposalId),
          exact: true,
        });
        queryClient.refetchQueries({
          queryKey: proposalKeys.proposals.byId(proposalId),
          exact: true,
        });
      } catch (cacheError) {
        // Fallback to old method if new keys fail
        try {
          const { qk } = await import('@/features/proposals/keys');
          queryClient.removeQueries({ queryKey: qk.proposals.byId(proposalId) });
          queryClient.invalidateQueries({ queryKey: qk.proposals.all });
        } catch (fallbackError) {
          // ✅ MIGRATED: Use structured logger instead of console.warn
          logError('Cache invalidation failed', {
            component: 'ProposalWizard',
            operation: 'cacheInvalidation',
            cacheError: (cacheError as Error)?.message || String(cacheError),
            fallbackError: (fallbackError as Error)?.message || String(fallbackError),
          });
        }
      }

      if (planOk && countOk && totalOk) {
        toast.success('Update saved successfully');
      } else {
        const parts = [
          planOk ? null : 'plan',
          countOk ? null : 'products',
          totalOk ? null : 'total',
        ].filter(Boolean);
        toast.warning(`Saved, but verification mismatch (${parts.join(', ')})`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast.error(`Failed to update: ${msg}`);
    }
  }, [editMode, proposalId, buildWizardPayload, toast]);

  const handleFinish = useCallback(async () => {
    // Finish = save then navigate (edit mode)
    if (editMode && proposalId) {
      try {
        // Wait for any in-flight section creations/edits to settle
        try {
          await flushPendingSectionCreatesAndUpdates();
        } catch (error) {
          console.warn('Error flushing pending section updates:', error);
        }
        const payload = buildWizardPayload();
        await http.put(`/api/proposals/${proposalId}`, payload);
        // After products persisted (ids stable), flush any pending assignments
        try {
          const { assignmentsDirty, flushPendingAssignments } =
            useSectionAssignmentStore.getState();
          if (assignmentsDirty) await flushPendingAssignments(proposalId);
        } catch (error) {
          console.warn('Error flushing pending assignments:', error);
        }

        // ✅ IMPROVED: Invalidate caches BEFORE verification to ensure fresh data
        try {
          const { proposalKeys } = await import('@/features/proposals');
          // Use the same aggressive invalidation as useUpdateProposal
          queryClient.setQueryData(proposalKeys.proposals.byId(proposalId), undefined);
          queryClient.invalidateQueries({ queryKey: proposalKeys.proposals.all, exact: true });
          queryClient.invalidateQueries({
            queryKey: proposalKeys.proposals.byId(proposalId),
            exact: true,
          });
          queryClient.refetchQueries({
            queryKey: proposalKeys.proposals.byId(proposalId),
            exact: true,
          });
        } catch (cacheError) {
          // Fallback to direct import if feature export fails
          try {
            const { qk } = await import('@/features/proposals/keys');
            queryClient.removeQueries({ queryKey: qk.proposals.byId(proposalId) });
            queryClient.invalidateQueries({ queryKey: qk.proposals.all });
          } catch (fallbackError) {
            // ✅ MIGRATED: Use structured logger instead of console.warn
            logError('Cache invalidation failed', {
              component: 'ProposalWizard',
              operation: 'cacheInvalidation',
              cacheError: (cacheError as Error)?.message || String(cacheError),
              fallbackError: (fallbackError as Error)?.message || String(fallbackError),
            });
          }
        }

        // ✅ IMPROVED: Add small delay to ensure cache invalidation completes
        await new Promise(resolve => setTimeout(resolve, 100));

        const { planOk, countOk, totalOk } = await (
          await import('./wizard/persistence')
        ).verifyPersistedProposal(proposalId, payload);

        if (planOk && countOk && totalOk) {
          toast.success('All changes saved');
        } else {
          const parts = [
            planOk ? null : 'plan',
            countOk ? null : 'products',
            totalOk ? null : 'total',
          ].filter(Boolean);
          toast.warning(`Saved, but verification mismatch (${parts.join(', ')})`);
        }
        router.push(`/proposals/${proposalId}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        toast.error(`Failed to save before finishing: ${msg}`);
      }
      return;
    }
    // Create mode: attempt to save a server draft if minimally complete, else save locally
    try {
      const { stepData } = useProposalStore.getState();
      const s1: ProposalStepData = stepData[1] || {};
      const s2: ProposalStepData = stepData[2] || {};

      const hasBasic = Boolean(s1?.title && s1?.customerId);
      const hasTeam = Boolean(s2?.teamLead && s2?.salesRepresentative);

      if (hasBasic && hasTeam) {
        const proposalBody = buildCreateBodyFromStore();

        try {
          await createProposal.mutateAsync(proposalBody);
          toast.success('Draft saved');
          router.push('/proposals');
          return;
        } catch (error) {
          toast.warning('Server save failed, saving draft locally.');
          saveDraftToLocalStorage();
          router.push('/proposals');
          return;
        }
      }

      const ok = saveDraftToLocalStorage();
      toast[ok ? 'success' : 'warning'](
        ok ? 'Draft saved locally' : 'Could not save draft locally'
      );
      router.push('/proposals');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast.error(`Failed to finish: ${msg}`);
    }
  }, [editMode, proposalId, router, toast, buildWizardPayload]);

  const handlePreview = useCallback(() => {
    try {
      // If we have a proposal ID (edit mode), use the API preview
      if (editMode && proposalId) {
        window.open(`/proposals/preview?id=${proposalId}`, '_blank', 'noopener,noreferrer');
        toast.success('Opening proposal preview...');
        return;
      }

      // Build preview from persisted wizard store for create mode
      const { stepData } = useProposalStore.getState();
      const s1: ProposalStepData = stepData[1] || {};
      const s4: ProposalStepData = stepData[4] || {};
      const preview = {
        company: {
          name: s1?.customer?.name || 'Company',
          industry: s1?.customer?.industry || undefined,
        },
        proposal: {
          title: s1?.title || 'Untitled Proposal',
          description: s1?.description || '',
          dueDate: s1?.dueDate || null,
          priority: s1?.priority || 'MEDIUM',
        },
        products: (s4?.products || []).map((p: any) => ({
          id: p.productId || p.id,
          name: p.name || 'Unknown Product',
          quantity: p.quantity || 1,
          unitPrice: p.unitPrice || 0,
          totalPrice: p.total || 0,
          category: p.category || 'General',
        })),
        totals: { currency: s1?.currency || 'USD', amount: s4?.totalValue || 0 },
        terms: [],
      };
      localStorage.setItem('proposal-preview-data', JSON.stringify(preview));
      window.open('/proposals/preview', '_blank', 'noopener,noreferrer');
      toast.success('Opening proposal preview...');
    } catch (e) {
      toast.error('Failed to open preview');
    }
  }, [toast, editMode, proposalId]);

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

      // Preload the next step for better UX
      preloadNextStep();
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
  }, [currentStep, nextStep, editMode, proposalId, preloadNextStep]); // ✅ Removed unstable analytics dependency

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

  const handleStepClick = useCallback(
    (targetStep: number) => {
      // Allow jumping to any visible step
      const allowedSteps =
        planType === 'BASIC'
          ? [1, 4, 6]
          : planType === 'PROFESSIONAL'
            ? [1, 2, 4, 6]
            : [1, 2, 3, 4, 5, 6];
      if (!allowedSteps.includes(targetStep)) return;

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
    },
    [currentStep, setCurrentStep, editMode, proposalId, analytics, planType]
  );

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
        logDebug('Raw step data from store', {
          component: 'ProposalWizard',
          operation: 'handleSubmit_raw_store_data',
          stepDataKeys: Object.keys(stepData),
          step4Data: stepData[4],
          step4ProductCount: stepData[4]?.products?.length || 0,
          step4TotalValue: stepData[4]?.totalValue || 0,
          step4Products:
            stepData[4]?.products?.map((p: any) => ({
              id: p.id,
              name: p.name,
              temp: p.id?.startsWith('temp-'),
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
          products:
            stepData[4]?.products?.map((p: any) => ({
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

        const result = (await updateProposalMutation.mutateAsync({
          id: proposalId,
          proposal: proposalData,
        })) as ProposalWithRelations;
        resultProposalId = result.id;

        // ✅ ADDED: Verify the update was successful by checking product count
        const expectedProductCount = stepData[4]?.products?.length || 0;
        const savedProductCount = result?.products?.length || 0;

        if (expectedProductCount > 0 && savedProductCount !== expectedProductCount) {
          logError('Product count mismatch after update', {
            component: 'ProposalWizard',
            operation: 'handleSubmit',
            proposalId: resultProposalId,
            expected: expectedProductCount,
            saved: savedProductCount,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          });

          // Show user-friendly message instead of throwing error
          // ✅ MIGRATED: Use structured logger instead of console.warn
          logWarn(
            'Saved, but verification mismatch (products, total). Please refresh to see latest data.',
            {
              component: 'ProposalWizard',
              operation: 'saveProposal',
              issue: 'verificationMismatch',
              expectedProductCount,
              savedProductCount,
            }
          );
        }

        logDebug('Proposal updated successfully', {
          component: 'ProposalWizard',
          operation: 'handleSubmit',
          proposalId: resultProposalId,
          editMode,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });

        // ✅ FIXED: Cache invalidation is already handled by useUpdateProposal hook
        // The hook's onSuccess callback properly invalidates and updates the cache
        logDebug('Cache invalidation handled by useUpdateProposal hook', {
          component: 'ProposalWizard',
          operation: 'cacheHandled',
          proposalId: resultProposalId,
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

        // ✅ FIXED: In edit mode, collect all wizard data and pass to onComplete
        if (editMode) {
          logDebug('EDIT MODE DETECTED: Starting payload collection', {
            component: 'ProposalWizard',
            operation: 'handleSubmit',
            editMode: true,
            proposalId: resultProposalId,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          });

          try {
            // Collect all step data from the store
            const { stepData } = useProposalStore.getState();
            const basicInfo = stepData[1] || {};
            const teamData = stepData[2] || {};
            const contentData = stepData[3] || {};
            const productData = stepData[4] || {};
            const sectionData = stepData[5] || {};

            logDebug('DEBUG: Raw step data before payload creation', {
              component: 'ProposalWizard',
              operation: 'handleSubmit',
              stepDataKeys: Object.keys(stepData),
              step4ProductCount: productData.products?.length || 0,
              step4TotalValue: productData.totalValue || 0,
              userStory: 'US-3.1',
              hypothesis: 'H4',
            });

            const wizardPayload = {
              title: basicInfo.title || '',
              description: basicInfo.description || '',
              customerId: basicInfo.customerId || '',
              customer: basicInfo.customer
                ? {
                    id: basicInfo.customer.id,
                    name: basicInfo.customer.name,
                    email: basicInfo.customer.email || undefined,
                  }
                : undefined,
              dueDate: basicInfo.dueDate || '',
              priority: basicInfo.priority || 'MEDIUM',
              value: basicInfo.value || 0,
              currency: basicInfo.currency || 'USD',
              projectType: basicInfo.projectType || '',
              tags: basicInfo.tags || [],
              teamData: {
                teamLead: teamData.teamLead || '',
                salesRepresentative: teamData.salesRepresentative || '',
                subjectMatterExperts: teamData.subjectMatterExperts || {},
                executiveReviewers: teamData.executiveReviewers || [],
              },
              contentData: {
                selectedTemplates: contentData.selectedTemplates || [],
                customContent: contentData.customContent || [],
                contentLibrary: contentData.contentLibrary || [],
              },
              productData: {
                products: productData.products || [],
                totalValue: productData.totalValue || 0,
              },
              sectionData: {
                sections: sectionData.sections || [],
                sectionTemplates: sectionData.sectionTemplates || [],
              },
              reviewData: {
                validationChecklist: [],
                totalProducts: productData.products?.length || 0,
                totalValue: productData.totalValue || 0,
                totalSections: sectionData.sections?.length || 0,
              },
              planType,
            };

            logDebug('DEBUG: Wizard payload created', {
              component: 'ProposalWizard',
              operation: 'handleSubmit',
              payloadKeys: Object.keys(wizardPayload),
              productCount: wizardPayload.productData?.products?.length || 0,
              totalValue: wizardPayload.productData?.totalValue || 0,
              hasTeamData: !!wizardPayload.teamData?.teamLead,
              hasContentData: !!wizardPayload.contentData?.selectedTemplates?.length,
              hasProductData: !!wizardPayload.productData?.products?.length,
              hasSectionData: !!wizardPayload.sectionData?.sections?.length,
              userStory: 'US-3.1',
              hypothesis: 'H4',
            });

            logDebug('Passing wizard payload to onComplete', {
              component: 'ProposalWizard',
              operation: 'handleSubmit',
              editMode: true,
              payloadType: typeof wizardPayload,
              payloadSize: JSON.stringify(wizardPayload).length,
              userStory: 'US-3.1',
              hypothesis: 'H4',
            });

            // Pass the complete wizard payload instead of just proposalId
            onComplete(wizardPayload);
          } catch (payloadError) {
            logError('ERROR: Failed to create wizard payload in edit mode', {
              component: 'ProposalWizard',
              operation: 'handleSubmit',
              editMode: true,
              error: payloadError instanceof Error ? payloadError.message : 'Unknown error',
              stack: payloadError instanceof Error ? payloadError.stack : undefined,
              userStory: 'US-3.1',
              hypothesis: 'H4',
            });

            // Fallback to create mode behavior
            logDebug('FALLBACK: Passing proposalId to onComplete due to payload error', {
              component: 'ProposalWizard',
              operation: 'handleSubmit',
              editMode: true,
              proposalId: resultProposalId,
              userStory: 'US-3.1',
              hypothesis: 'H4',
            });
            onComplete(resultProposalId);
          }
        } else {
          logDebug('CREATE MODE: Passing proposalId to onComplete', {
            component: 'ProposalWizard',
            operation: 'handleSubmit',
            editMode: false,
            proposalId: resultProposalId,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          });
          // For create mode, just pass the proposalId as before
          onComplete(resultProposalId);
        }
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

  // ✅ FIXED: Memoized onUpdate callback to prevent React.memo from breaking
  const handleStepUpdate = useCallback(() => {
    // Step data updates are handled by the store - no additional logic needed
  }, []);

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
      <WizardHeader
        title={editMode ? 'Edit Proposal' : 'Create New Proposal'}
        subtitle={
          editMode
            ? 'Update your proposal details and settings'
            : 'Follow the guided workflow to create a comprehensive proposal for your client.'
        }
        planType={planType}
        onPlanChange={setPlanType}
        steps={STEP_META.map(s => ({ id: s.id, title: s.title }))}
        visibleStepIds={visibleStepIds}
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Step Content */}
            <div className="lg:col-span-3">
              <Card className="p-6">
                <Suspense fallback={<StepLoadingFallback />}>
                  <CurrentStepComponent
                    // For step 4 (ProductSelectionStep), use proposal products data in edit mode
                    data={
                      currentStep === 4 && editMode && proposalData?.products
                        ? { products: proposalData.products }
                        : currentStep === 2 && editMode && step2Data
                          ? step2Data
                          : currentStepData
                    }
                    onNext={handleNext}
                    onBack={handleBack}
                    onSubmit={handleSubmit}
                    onUpdate={handleStepUpdate}
                    // Pass proposalId to ProductSelectionStep (step 4) to fix caching issues
                    {...(currentStep === 4 && proposalId ? { proposalId } : {})}
                    // editMode prop removed - not needed by step components
                  />
                </Suspense>
                <div className="mt-4 flex justify-between items-center">
                  {/* Left area: step-specific action (Preview on step 4) */}
                  <div>
                    {currentStep === 4 && (
                      <Button variant="outline" onClick={handlePreview}>
                        Preview Proposal
                      </Button>
                    )}
                  </div>
                  {/* Right area: Update + Finish in edit mode */}
                  <div className="flex gap-2">
                    {onCancel && (
                      <Button variant="outline" onClick={onCancel}>
                        Cancel
                      </Button>
                    )}
                    {editMode && proposalId && (
                      <Button variant="primary" onClick={handleUpdateCurrent}>
                        Update
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleFinish} disabled={finishDisabled}>
                      Finish
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <WizardSidebar
                  customerName={step1Data?.customer?.name}
                  teamCount={step2Data?.teamMembers?.length || 0}
                  productCount={step4Data?.products?.length || 0}
                  sectionCount={step5Data?.sections?.length || 0}
                  currentStep={currentStep}
                  visibleStepIds={visibleStepIds}
                  canGoBack={canGoBack}
                  canProceed={canProceed}
                  isSubmitting={isSubmitting}
                  editMode={editMode}
                  onBack={handleBack}
                  onNext={handleNext}
                  onSubmit={handleSubmit}
                  onPreview={() => {
                    analytics.trackOptimized('wizard_preview', {
                      step: currentStep,
                      editMode,
                      proposalId,
                      userStory: 'US-3.1',
                      hypothesis: 'H4',
                    });
                    handlePreview();
                  }}
                />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
