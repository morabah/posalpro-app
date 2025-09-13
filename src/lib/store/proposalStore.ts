'use client';

/**
 * PosalPro MVP2 - Modern Proposal Store with Optimized State Management
 * Built from scratch using Zustand and modern patterns
 * Follows PROPOSAL_MIGRATION_ASSESSMENT.md guidelines
 * Handles multi-step wizard state management with performance optimizations
 *
 * ✅ ARCHITECTURAL PATTERN: UI State Only (Wizard state management)
 * ✅ PERFORMANCE: Ready for shallow comparison optimization
 * ✅ TYPE SAFETY: Explicit return types with proper TypeScript support
 * ✅ FOLLOWS: MIGRATION_LESSONS.md - Zustand patterns
 * ✅ FOLLOWS: CORE_REQUIREMENTS.md - State management best practices
 * ✅ ALIGNS: Modern architecture with proper separation of concerns
 */

import { logDebug, logError } from '@/lib/logger';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

// ✅ TYPES: Define proper interfaces for proposal store

interface ProposalMetadata {
  id?: string;
  title?: string;
  description?: string;
  customerId?: string;
  customer?: any;
  dueDate?: string;
  priority?: string;
  value?: number;
  currency?: string;
  metadata?: any;
  projectType?: string;
  tags?: string[];
  assignedTo?: any[];
  teamData?: {
    teamLead?: string;
    salesRepresentative?: string;
  };
  productData?: {
    products: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      total: number;
      discount?: number;
    }>;
  };
  contentData?: Record<string, unknown>;
  sectionData?: Record<string, unknown>;
  planType?: string;
  wizardVersion?: string;
  submittedAt?: string;
}

// Types for proposal wizard data
export interface ProposalBasicInfo {
  title: string;
  description?: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    email?: string;
    industry?: string;
  };
  dueDate?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  value?: number; // Changed from estimatedValue to match database
  currency: string;
  projectType?: string;
  tags?: string[];
  assignedTo?: string; // Added to match database
}

export interface ProposalTeamData {
  teamLead: string;
  salesRepresentative: string;
  subjectMatterExperts: Record<string, string>;
  executiveReviewers: string[];
  teamMembers?: Array<{
    id: string;
    name: string;
    role: string;
    email?: string;
  }>;
}

export interface ProposalContentData {
  selectedTemplates: string[];
  customContent: Array<{
    id: string;
    title: string;
    content: string;
    type: 'text' | 'image' | 'table';
  }>;
  contentLibrary: Array<{
    id: string;
    title: string;
    category: string;
    isSelected: boolean;
  }>;
}

export interface ProposalProductData {
  products: Array<{
    id: string;
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number; // Changed from totalPrice to match database
    discount: number; // Added to match database
    category: string;
    configuration?: Record<string, unknown>;
    sectionId?: string | null;
  }>;
  totalValue: number;
  searchQuery?: string;
  selectedCategory?: string;
}

export interface ProposalSectionData {
  sections: Array<{
    id: string;
    title: string;
    content: string;
    order: number;
    type: 'TEXT' | 'IMAGE' | 'TABLE' | 'CHART';
    isRequired: boolean;
    validationStatus?: 'NOT_VALIDATED' | 'VALIDATED' | 'FAILED'; // Added to match database
    analyticsData?: Record<string, unknown>; // Added to match database
    metadata?: Record<string, unknown>; // Added to match database
  }>;
  sectionTemplates: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
  }>;
}

export interface ProposalReviewData {
  isComplete: boolean;
  validationErrors: string[];
  warnings: string[];
  finalChecklist: Array<{
    id: string;
    title: string;
    isChecked: boolean;
    isRequired: boolean;
  }>;
}

// Step data union type
export type ProposalStepData =
  | ProposalBasicInfo
  | ProposalTeamData
  | ProposalContentData
  | ProposalProductData
  | ProposalSectionData
  | ProposalReviewData;

// Store state interface
interface ProposalWizardState {
  // Current step management
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  // Wizard plan (controls visible steps)
  planType: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';

  // Step data storage
  stepData: Record<number, any>;

  // Validation state
  validationErrors: Record<number, string[]>;

  // Navigation state
  canProceed: boolean;
  canGoBack: boolean;

  // Actions
  setCurrentStep: (step: number) => void;
  setPlanType: (plan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE') => void;
  setStepData: (step: number, data: ProposalStepData | ((prevData: ProposalStepData) => ProposalStepData)) => void;
  setValidationErrors: (step: number, errors: string[]) => void;
  nextStep: () => Promise<void>;
  previousStep: () => void;
  canProceedToStep: (step: number) => boolean;
  validateStep: (step: number) => string[];
  submitProposal: () => Promise<string>;
  updateProposal: (proposalId: string) => Promise<string>;
  initializeFromData: (proposalData: ProposalMetadata) => void;
  resetWizard: () => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
}

// Validation schemas for each step
const validateBasicInfo = (data: ProposalBasicInfo): string[] => {
  const errors: string[] = [];

  if (!data.title?.trim()) {
    errors.push('Proposal title is required');
  }

  if (!data.customerId) {
    errors.push('Customer selection is required');
  }

  if (!data.dueDate) {
    errors.push('Due date is required');
  }

  if (data.dueDate && new Date(data.dueDate) < new Date()) {
    errors.push('Due date must be in the future');
  }

  if (data.value !== undefined && data.value <= 0) {
    errors.push('Estimated value must be greater than zero');
  }

  return errors;
};

const validateTeamData = (data: ProposalTeamData): string[] => {
  const errors: string[] = [];

  if (!data.teamLead) {
    errors.push('Team lead is required');
  }

  if (!data.salesRepresentative) {
    errors.push('Sales representative is required');
  }

  const smeCount = Object.values(data.subjectMatterExperts).filter(v => v?.trim()).length;
  if (smeCount === 0) {
    errors.push('At least one subject matter expert is required');
  }

  return errors;
};

const validateContentData = (data: ProposalContentData): string[] => {
  const errors: string[] = [];

  if (data.selectedTemplates.length === 0 && data.customContent.length === 0) {
    errors.push('At least one template or custom content is required');
  }

  return errors;
};

const validateProductData = (data: ProposalProductData): string[] => {
  const errors: string[] = [];

  if (data.products.length === 0) {
    errors.push('At least one product must be selected');
  }

  // Check if any product has invalid data
  for (const product of data.products) {
    if (product.quantity <= 0) {
      errors.push('Product quantity must be greater than zero');
    }
    if (product.unitPrice <= 0) {
      errors.push('Product unit price must be greater than zero');
    }
    if (product.total <= 0) {
      errors.push('Product total must be greater than zero');
    }
  }

  return errors;
};

const validateSectionData = (data: ProposalSectionData): string[] => {
  const errors: string[] = [];

  if (data.sections.length === 0) {
    errors.push('At least one section is required');
  }

  const requiredSections = data.sections.filter(s => s.isRequired);
  const incompleteRequired = requiredSections.filter(s => !s.content?.trim());

  if (incompleteRequired.length > 0) {
    errors.push('All required sections must have content');
  }

  return errors;
};

const validateReviewData = (data: ProposalReviewData): string[] => {
  const errors: string[] = [];

  const requiredItems = data.finalChecklist.filter(item => item.isRequired);
  const uncheckedRequired = requiredItems.filter(item => !item.isChecked);

  if (uncheckedRequired.length > 0) {
    errors.push('All required checklist items must be completed');
  }

  return errors;
};

// Validation function mapping
const stepValidators = {
  1: validateBasicInfo,
  2: validateTeamData,
  3: validateContentData,
  4: validateProductData,
  5: validateSectionData,
  6: validateReviewData,
};

// Create the store
export const useProposalStore = create<ProposalWizardState>((set, get) => ({
  // Initial state
  currentStep: 1,
  totalSteps: 6,
  isSubmitting: false,
  planType: 'ENTERPRISE',
  stepData: {},
  validationErrors: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
  canProceed: false,
  canGoBack: false,

  // Actions
  setCurrentStep: (step: number) => {
    set({ currentStep: step });
  },

  setPlanType: (plan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE') => {
    // Determine visible steps for the selected plan
    const visibleSteps =
      plan === 'BASIC' ? [1, 4, 6] : plan === 'PROFESSIONAL' ? [1, 2, 4, 6] : [1, 2, 3, 4, 5, 6];

    set(state => {
      const current = state.currentStep;
      // If current step is not visible anymore, move to the closest next visible step
      let nextCurrent = current;
      if (!visibleSteps.includes(current)) {
        // Find the next greater visible or fallback to last visible
        const greater = visibleSteps.find(s => s > current);
        nextCurrent = greater ?? visibleSteps[visibleSteps.length - 1];
      }

      return {
        planType: plan,
        totalSteps: visibleSteps.length,
        currentStep: nextCurrent,
      };
    });
  },

  setStepData: (step: number, data: ProposalStepData | ((prevData: ProposalStepData) => ProposalStepData)) => {
    set(state => {
      const currentStepData = state.stepData[step] as any;
      const newData = typeof data === 'function' ? data(currentStepData as any) : data;

      // ✅ ADDED: Debug logging to track step data updates (only in development)
      if (process.env.NODE_ENV === 'development') {
        logDebug('Setting step data', {
          component: 'ProposalStore',
          operation: 'setStepData',
          step,
          currentDataKeys: currentStepData ? Object.keys(currentStepData) : null,
          newDataKeys: newData ? Object.keys(newData) : null,
          productCount: (newData && 'products' in newData) ? newData.products?.length || 0 : 0,
          totalValue: (newData && 'totalValue' in newData) ? newData.totalValue || 0 : 0,
        });
      }

      return {
        stepData: {
          ...state.stepData,
          [step]: newData,
        },
      };
    });
  },

  setValidationErrors: (step: number, errors: string[]) => {
    set(state => ({
      validationErrors: {
        ...state.validationErrors,
        [step]: errors,
      },
    }));
  },

  nextStep: async () => {
    const { currentStep, setCurrentStep, validateStep, setValidationErrors, planType } = get();

    // Validate current step
    const errors = validateStep(currentStep);
    setValidationErrors(currentStep, errors);
    if (errors.length > 0) {
      throw new Error(`Step ${currentStep} validation failed: ${errors.join(', ')}`);
    }

    // Compute visible steps according to plan and move to the next visible one
    const visibleSteps =
      planType === 'BASIC'
        ? [1, 4, 6]
        : planType === 'PROFESSIONAL'
          ? [1, 2, 4, 6]
          : [1, 2, 3, 4, 5, 6];

    const index = visibleSteps.indexOf(currentStep);
    if (index > -1 && index < visibleSteps.length - 1) {
      setCurrentStep(visibleSteps[index + 1]);
    }
  },

  previousStep: () => {
    const { currentStep, setCurrentStep, planType } = get();
    const visibleSteps =
      planType === 'BASIC'
        ? [1, 4, 6]
        : planType === 'PROFESSIONAL'
          ? [1, 2, 4, 6]
          : [1, 2, 3, 4, 5, 6];

    const index = visibleSteps.indexOf(currentStep);
    if (index > 0) {
      setCurrentStep(visibleSteps[index - 1]);
    }
  },

  canProceedToStep: (step: number) => {
    const { stepData, validateStep } = get();
    const currentStepData = stepData[step];
    if (!currentStepData) return false;

    const errors = validateStep(step);
    return errors.length === 0;
  },

  validateStep: (step: number) => {
    const { stepData } = get();
    const currentStepData = stepData[step];
    if (!currentStepData) return ['Step data not found'];

    const validator = stepValidators[step as keyof typeof stepValidators];
    if (!validator) return ['Invalid step number'];

    return validator(currentStepData);
  },

  submitProposal: async () => {
    const { stepData, setIsSubmitting, validateStep } = get();

    logDebug('Starting proposal submission', {
      component: 'ProposalStore',
      operation: 'submit_proposal',
      stepDataKeys: Object.keys(stepData),
      validationSteps: '1-5', // Step 6 is review step that doesn't store data
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    setIsSubmitting(true);

    try {
      // Validate all steps
      // Validate steps 1-5 (step 6 is review step that doesn't store data)
      for (let step = 1; step <= 5; step++) {
        const errors = validateStep(step);
        if (errors.length > 0) {
          logError('Step validation failed', {
            component: 'ProposalStore',
            operation: 'submit_proposal',
            step,
            errors,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          });
          throw new Error(`Step ${step} validation failed: ${errors.join(', ')}`);
        }
      }

      // Prepare proposal data in flattened format (matching working bridge implementation)
      const basicInfo = stepData[1] || {};
      const teamData = stepData[2] || {};
      const contentData = stepData[3] || {};
      const productData = stepData[4] || {};
      const sectionData = stepData[5] || {};

      const proposalData = {
        basicInfo: {
          title: basicInfo.title || '',
          description: basicInfo.description || '',
          customerId: basicInfo.customerId || '',
          customer: basicInfo.customer
            ? {
                id: basicInfo.customer.id,
                name: basicInfo.customer.name,
                email: basicInfo.customer.email || undefined,
                industry: basicInfo.customer.industry || undefined,
              }
            : undefined,
          dueDate: basicInfo.dueDate || '',
          priority: basicInfo.priority || 'MEDIUM',
          value: basicInfo.value || 0,
          currency: basicInfo.currency || 'USD',
          projectType: basicInfo.projectType || '',
          tags: basicInfo.tags || [],
        },
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
        planType: get().planType,
      };

      logDebug('Submitting proposal to API', {
        component: 'ProposalStore',
        operation: 'submit_proposal',
        proposalData: {
          title: proposalData.basicInfo.title,
          customerId: proposalData.basicInfo.customerId,
          teamLead: proposalData.teamData.teamLead,
          productCount: proposalData.productData.products?.length,
          sectionCount: proposalData.sectionData.sections?.length,
        },
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      // Submit to API using proposalService for consistency
      const { proposalService } = await import('@/services/proposalService');
      const result = await proposalService.createProposal(proposalData);

      logDebug('API response received', {
        component: 'ProposalStore',
        operation: 'submit_proposal',
        proposalId: result.id,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      logDebug('Proposal submitted successfully', {
        component: 'ProposalStore',
        operation: 'submit_proposal',
        result: result,
        proposalId: result.id,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      return result.id;
    } catch (error) {
      logError('Proposal submission error', {
        component: 'ProposalStore',
        operation: 'submit_proposal',
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  },

  resetWizard: () => {
    set({
      currentStep: 1,
      isSubmitting: false,
      stepData: {},
      validationErrors: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
      canProceed: false,
      canGoBack: false,
    });
  },

  updateProposal: async (proposalId: string) => {
    const { stepData, setIsSubmitting } = get();
    setIsSubmitting(true);

    try {
      logDebug('Updating proposal', {
        component: 'ProposalStore',
        operation: 'update_proposal',
        proposalId,
        stepData: Object.keys(stepData),
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      // ✅ FIXED: Use service layer instead of direct fetch
      // Import the service layer
      const { proposalService } = await import('@/services/proposalService');

      // Prepare proposal data from all steps
      const proposalData = {
        ...stepData[1], // Basic information
        teamData: stepData[2], // Team assignment
        contentData: stepData[3], // Content selection
        productData: stepData[4], // Product selection
        sectionData: stepData[5], // Section assignment
        reviewData: stepData[6], // Review data
        planType: get().planType,
      };

      // ✅ FIXED: Use service layer with proper error handling
      const result = await proposalService.updateProposal(proposalId, proposalData);

      logDebug('Proposal updated successfully', {
        component: 'ProposalStore',
        operation: 'update_proposal',
        proposalId,
        result: result,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      // ✅ FIXED: Cache invalidation will be handled by React Query mutation
      // The ProposalWizard will use useUpdateProposal hook which handles cache invalidation

      return result.id;
    } catch (error) {
      logError('Proposal update error', {
        component: 'ProposalStore',
        operation: 'update_proposal',
        proposalId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  },

  initializeFromData: (proposalData: ProposalMetadata) => {
    logDebug('Initializing wizard from existing data', {
      component: 'ProposalStore',
      operation: 'initializeFromData',
      proposalId: proposalData.id,
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    try {
      // ✅ FIXED: Extract complex data from metadata field
      const metadata = proposalData.metadata || {};
      const teamData = metadata.teamData || {};
      const contentData = metadata.contentData || {};
      const productData = metadata.productData || {};
      const sectionData = metadata.sectionData || {};
      const reviewData = metadata.reviewData || {};
      const planTypeFromMetadata = (metadata as any).planType as
        | 'BASIC'
        | 'PROFESSIONAL'
        | 'ENTERPRISE'
        | undefined;

      // ✅ ADDED: Debug logging to see what data is being extracted
      logDebug('Extracted metadata from proposal', {
        component: 'ProposalStore',
        operation: 'initializeFromData',
        proposalId: proposalData.id,
        hasMetadata: !!proposalData.metadata,
        metadataKeys: Object.keys(metadata),
        teamDataKeys: Object.keys(teamData),
        contentDataKeys: Object.keys(contentData),
        productDataKeys: Object.keys(productData),
        sectionDataKeys: Object.keys(sectionData),
        reviewDataKeys: Object.keys(reviewData),
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      // Map proposal data to step data
      const stepData = {
        1: {
          title: proposalData.title,
          description: proposalData.description,
          customerId: proposalData.customerId,
          customer: proposalData.customer,
          dueDate: proposalData.dueDate,
          priority: proposalData.priority,
          value: proposalData.value,
          currency: proposalData.currency,
          projectType: proposalData.projectType,
          tags: proposalData.tags,
        },
        2: {
          teamLead: teamData.teamLead,
          salesRepresentative: teamData.salesRepresentative,
          subjectMatterExperts: teamData.subjectMatterExperts || {},
          executiveReviewers: teamData.executiveReviewers || [],
          teamMembers: proposalData.assignedTo,
        },
        3: {
          selectedTemplates: contentData.selectedTemplates || [],
          customContent: contentData.customContent || [],
          contentLibrary: contentData.contentLibrary || [],
        },
        4: {
          products: productData.products || [],
          totalValue: productData.totalValue || 0,
        },
        5: {
          sections: sectionData.sections || [],
          sectionTemplates: sectionData.sectionTemplates || [],
        },
        6: {
          isComplete: true,
          validationErrors: [],
          reviewNotes: reviewData.reviewNotes || '',
        },
      };

      const updates: Record<string, unknown> = { stepData };
      if (planTypeFromMetadata) {
        updates.planType = planTypeFromMetadata;
      }
      set(updates);

      logDebug('Wizard initialized successfully', {
        component: 'ProposalStore',
        operation: 'initializeFromData',
        proposalId: proposalData.id,
        stepDataKeys: Object.keys(stepData),
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
      // Default edit flows to start at Product Selection (step 4)
      set({ currentStep: 4 });
    } catch (error) {
      logError('Failed to initialize wizard from data', {
        component: 'ProposalStore',
        operation: 'initializeFromData',
        proposalId: proposalData.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
      throw error;
    }
  },

  setIsSubmitting: (isSubmitting: boolean) => {
    set({ isSubmitting });
  },
}));

// Selectors for optimized re-renders
export const useProposalStepData = (step: number) =>
  useProposalStore(useShallow(state => state.stepData[step]));

export const useProposalValidationErrors = (step: number) =>
  useProposalStore(useShallow(state => state.validationErrors[step]));

// Individual selectors to prevent object creation and infinite re-renders
export const useProposalCurrentStep = () => useProposalStore(state => state.currentStep);
export const useProposalTotalSteps = () => useProposalStore(state => state.totalSteps);
export const useProposalCanProceed = () => useProposalStore(state => state.canProceed);
export const useProposalCanGoBack = () => useProposalStore(state => state.canGoBack);
export const useProposalIsSubmitting = () => useProposalStore(state => state.isSubmitting);

export const useProposalSetStepData = () => useProposalStore(state => state.setStepData);
export const useProposalNextStep = () => useProposalStore(state => state.nextStep);
export const useProposalPreviousStep = () => useProposalStore(state => state.previousStep);
export const useProposalSubmitProposal = () => useProposalStore(state => state.submitProposal);
export const useProposalUpdateProposal = () => useProposalStore(state => state.updateProposal);
export const useProposalInitializeFromData = () =>
  useProposalStore(state => state.initializeFromData);
export const useProposalResetWizard = () => useProposalStore(state => state.resetWizard);
export const useProposalPlanType = () => useProposalStore(state => state.planType);
export const useProposalSetPlanType = () => useProposalStore(state => state.setPlanType);

// Composite hooks for convenience (with shallow comparison optimization)
export const useProposalNavigation = (): {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  canGoBack: boolean;
  isSubmitting: boolean;
} =>
  useProposalStore(
    useShallow(state => ({
      currentStep: state.currentStep,
      totalSteps: state.totalSteps,
      canProceed: state.canProceed,
      canGoBack: state.canGoBack,
      isSubmitting: state.isSubmitting,
    }))
  );

// Individual action selectors
export const useProposalSetCurrentStep = () => useProposalStore(state => state.setCurrentStep);

export const useProposalActions = (): {
  setStepData: (step: number, data: ProposalStepData | ((prevData: ProposalStepData) => ProposalStepData)) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => Promise<void>;
  previousStep: () => void;
  submitProposal: () => Promise<string>;
  resetWizard: () => void;
} =>
  useProposalStore(
    useShallow(state => ({
      setStepData: state.setStepData,
      setCurrentStep: state.setCurrentStep,
      nextStep: state.nextStep,
      previousStep: state.previousStep,
      submitProposal: state.submitProposal,
      resetWizard: state.resetWizard,
    }))
  );
