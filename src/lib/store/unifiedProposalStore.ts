/**
 * Unified Proposal Store - Enhanced Zustand Store with Data Persistence
 * Implements MIGRATION_LESSONS.md patterns for stable state management
 * Ensures data persistence along wizard steps like product selection
 */

'use client';

import type { Proposal } from '@/features/proposals/schemas';
import { logDebug, logError } from '@/lib/logger';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';

// Define UnifiedProposalData as an extension of Proposal
export interface UnifiedProposalData extends Proposal {
  proposalId?: string;
  persistWizardData?: (stepData: any) => void;
  proposalValue?: number;
  isLoading?: boolean;
  error?: Error | null;
  wizardData?: any;
  totalValue?: number;
  productCount?: number;
}

// Enhanced wizard step data interfaces with persistence
export interface WizardStepData {
  step1?: {
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
    value?: number; // Estimated value
    currency: string;
    projectType?: string;
    tags?: string[];
  };
  step2?: {
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
  };
  step3?: {
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
  };
  step4?: {
    products: Array<{
      id: string;
      productId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      total: number;
      discount: number;
      category: string;
      configuration?: Record<string, unknown>;
      included?: boolean;
    }>;
    totalValue: number; // Calculated total from products
    searchQuery?: string;
    selectedCategory?: string;
  };
  step5?: {
    sections: Array<{
      id: string;
      title: string;
      content: string;
      order: number;
      type: 'TEXT' | 'IMAGE' | 'TABLE' | 'CHART';
      isRequired: boolean;
      validationStatus?: 'NOT_VALIDATED' | 'VALIDATED' | 'FAILED';
      analyticsData?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    }>;
    sectionTemplates: Array<{
      id: string;
      title: string;
      content: string;
      category: string;
    }>;
  };
}

// Store state interface - UI STATE ONLY
interface UnifiedProposalStoreState {
  // Wizard state - UI STATE ONLY
  wizardData: WizardStepData;
  currentStep: number;
  isWizardActive: boolean;

  // Navigation state - UI DERIVED STATE
  canNavigateBack: boolean;
  canNavigateForward: boolean;

  // Validation state - CLIENT-SIDE VALIDATION STATE
  stepValidation: Record<
    number,
    {
      isValid: boolean;
      errors: string[];
      warnings: string[];
    }
  >;
}

// Store actions interface - UI STATE ONLY
interface UnifiedProposalStoreActions {
  // Wizard navigation - UI ACTIONS
  setCurrentStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  startWizard: (initialData?: Partial<WizardStepData>) => void;
  completeWizard: () => void;
  cancelWizard: () => void;

  // Step data management - UI DATA MANAGEMENT
  setStepData: <T extends keyof WizardStepData>(step: T, data: WizardStepData[T]) => void;
  getStepData: <T extends keyof WizardStepData>(step: T) => WizardStepData[T];

  // Data synchronization - UI SYNCHRONIZATION
  syncWithWizardData: (wizardData: Partial<WizardStepData>) => void;
  calculateTotalValue: () => number;

  // Validation
  validateStep: (step: number) => { isValid: boolean; errors: string[]; warnings: string[] };
  validateAllSteps: () => boolean;

  // Persistence management
  // Server state actions moved to React Query mutations

  // Reset and cleanup
  resetWizard: () => void;
  resetStore: () => void;
}

type UnifiedProposalStore = UnifiedProposalStoreState & UnifiedProposalStoreActions;

// Initial state - UI STATE ONLY
const initialState: UnifiedProposalStoreState = {
  wizardData: {},
  currentStep: 1,
  isWizardActive: false,
  canNavigateBack: false,
  canNavigateForward: false,
  stepValidation: {},
};

// Create the unified store with middleware
export const useUnifiedProposalStore = create<UnifiedProposalStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // UI State Management - Server state moved to React Query

      // Wizard navigation
      setCurrentStep: step => {
        set(state => {
          const previousStep = state.currentStep;
          state.currentStep = step;
          state.canNavigateBack = step > 1;
          state.canNavigateForward = step < 5;

          logDebug('Wizard step changed', {
            component: 'UnifiedProposalStore',
            operation: 'setCurrentStep',
            previousStep,
            currentStep: step,
          });
        });
      },

      goToNextStep: () => {
        const { currentStep, validateStep } = get();
        const validation = validateStep(currentStep);

        if (validation.isValid && currentStep < 5) {
          get().setCurrentStep(currentStep + 1);
        } else {
          logError('Cannot navigate to next step', new Error('Validation failed'), {
            component: 'UnifiedProposalStore',
            operation: 'goToNextStep',
            currentStep,
            validation,
          });
        }
      },

      goToPreviousStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          get().setCurrentStep(currentStep - 1);
        }
      },

      startWizard: initialData => {
        set(state => {
          state.isWizardActive = true;
          state.currentStep = 1;
          state.wizardData = initialData || {};
          state.stepValidation = {};

          logDebug('Wizard started', {
            component: 'UnifiedProposalStore',
            operation: 'startWizard',
            hasInitialData: !!initialData,
          });
        });
      },

      completeWizard: () => {
        set(state => {
          state.isWizardActive = false;
          state.currentStep = 1;

          logDebug('Wizard completed', {
            component: 'UnifiedProposalStore',
            operation: 'completeWizard',
            finalData: Object.keys(state.wizardData),
          });
        });
      },

      cancelWizard: () => {
        set(state => {
          state.isWizardActive = false;
          state.currentStep = 1;
          state.wizardData = {};
          // Server state cleanup moved to React Query

          logDebug('Wizard cancelled', {
            component: 'UnifiedProposalStore',
            operation: 'cancelWizard',
          });
        });
      },

      // Step data management with persistence
      setStepData: (step, data) => {
        set(state => {
          state.wizardData[step] = data;

          // Update validation for this step
          const validation = get().validateStep(parseInt(step.replace('step', '')));
          state.stepValidation[parseInt(step.replace('step', ''))] = validation;

          // Server state updates moved to React Query mutations
          // Proposal value updates handled by useUpdateProposal hook

          logDebug('Step data set with persistence', {
            component: 'UnifiedProposalStore',
            operation: 'setStepData',
            step,
            dataKeys: data ? Object.keys(data) : [],
            totalValue:
              step === 'step4' && data && 'totalValue' in data ? data.totalValue : undefined,
          });
        });
      },

      getStepData: step => {
        const data = get().wizardData[step];

        logDebug('Step data retrieved', {
          component: 'UnifiedProposalStore',
          operation: 'getStepData',
          step,
          hasData: !!data,
          dataKeys: data ? Object.keys(data) : [],
        });

        return data;
      },

      // Server persistence moved to React Query mutations

      // UI Data synchronization - Server state moved to React Query
      syncWithWizardData: wizardData => {
        set(state => {
          // Sync only wizard data - server state handled by React Query
          if (wizardData) {
            state.wizardData = { ...wizardData };
          }

          logDebug('Store synced with wizard data', {
            component: 'UnifiedProposalStore',
            operation: 'syncWithWizardData',
            dataKeys: wizardData ? Object.keys(wizardData) : [],
          });
        });
      },

      calculateTotalValue: () => {
        const { wizardData } = get();
        const step4Data = wizardData.step4;

        if (step4Data?.products?.length) {
          const total = step4Data.products.reduce((sum, product) => {
            return sum + (product.total || product.unitPrice * product.quantity);
          }, 0);

          logDebug('Total value calculated', {
            component: 'UnifiedProposalStore',
            operation: 'calculateTotalValue',
            total,
            productCount: step4Data.products.length,
          });

          return total;
        }

        // Fallback to step1 estimated value
        return wizardData.step1?.value || 0;
      },

      // Validation
      validateStep: (step: number) => {
        const validation: { isValid: boolean; errors: string[]; warnings: string[] } = {
          isValid: true,
          errors: [],
          warnings: [],
        };

        const stepData = get().wizardData[`step${step}` as keyof WizardStepData];

        switch (step) {
          case 1:
            if (!stepData || !('title' in stepData) || !stepData.title) {
              validation.isValid = false;
              validation.errors.push('Title is required');
            }
            if (!stepData || !('customerId' in stepData) || !stepData.customerId) {
              validation.isValid = false;
              validation.errors.push('Customer is required');
            }
            break;

          case 2:
            if (!stepData || !('teamLead' in stepData) || !stepData.teamLead) {
              validation.isValid = false;
              validation.errors.push('Team lead is required');
            }
            if (
              !stepData ||
              !('salesRepresentative' in stepData) ||
              !stepData.salesRepresentative
            ) {
              validation.isValid = false;
              validation.errors.push('Sales representative is required');
            }
            break;

          case 4:
            if (!stepData || !('products' in stepData) || !stepData.products?.length) {
              validation.warnings.push('No products selected');
            }
            break;
        }

        logDebug('Step validation completed', {
          component: 'UnifiedProposalStore',
          operation: 'validateStep',
          step,
          isValid: validation.isValid,
          errorCount: validation.errors.length,
          warningCount: validation.warnings.length,
        });

        return validation;
      },

      validateAllSteps: () => {
        const allValid = [1, 2, 3, 4, 5].every(step => {
          const validation = get().validateStep(step);
          return validation.isValid;
        });

        logDebug('All steps validation completed', {
          component: 'UnifiedProposalStore',
          operation: 'validateAllSteps',
          allValid,
        });

        return allValid;
      },

      // Persistence management
      // Server state actions moved to React Query mutations

      // Reset and cleanup
      resetWizard: () => {
        set(state => {
          state.wizardData = {};
          state.currentStep = 1;
          state.isWizardActive = false;
          state.stepValidation = {};

          logDebug('Wizard reset', {
            component: 'UnifiedProposalStore',
            operation: 'resetWizard',
          });
        });
      },

      resetStore: () => {
        set(() => ({
          ...initialState,
        }));

        logDebug('Store reset to initial state', {
          component: 'UnifiedProposalStore',
          operation: 'resetStore',
        });
      },
    }))
  )
);

// Top-level hooks for optimized component subscriptions (Zustand v5 compliant)
// Wizard selectors - UI STATE ONLY
export const useUnifiedProposalCurrentStep = () =>
  useUnifiedProposalStore(state => state.currentStep);
export const useUnifiedProposalIsWizardActive = () =>
  useUnifiedProposalStore(state => state.isWizardActive);
export const useUnifiedProposalWizardData = () =>
  useUnifiedProposalStore(state => state.wizardData);

// Step data selectors - UI STATE ONLY
export const useUnifiedProposalStep1Data = () =>
  useUnifiedProposalStore(state => state.wizardData.step1);
export const useUnifiedProposalStep2Data = () =>
  useUnifiedProposalStore(state => state.wizardData.step2);
export const useUnifiedProposalStep3Data = () =>
  useUnifiedProposalStore(state => state.wizardData.step3);
export const useUnifiedProposalStep4Data = () =>
  useUnifiedProposalStore(state => state.wizardData.step4);
export const useUnifiedProposalStep5Data = () =>
  useUnifiedProposalStore(state => state.wizardData.step5);

// Navigation selectors - UI DERIVED STATE
export const useUnifiedProposalCanNavigateBack = () =>
  useUnifiedProposalStore(state => state.canNavigateBack);
export const useUnifiedProposalCanNavigateForward = () =>
  useUnifiedProposalStore(state => state.canNavigateForward);

// Validation selectors - CLIENT-SIDE VALIDATION STATE
export const useUnifiedProposalStepValidation = (step: number) =>
  useUnifiedProposalStore(state => state.stepValidation[step]);

// Actions - composite hook with shallow equality to avoid re-renders
export const useUnifiedProposalActions = (): {
  setCurrentStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  startWizard: (initialData?: Partial<WizardStepData>) => void;
  completeWizard: () => void;
  cancelWizard: () => void;
  setStepData: <T extends keyof WizardStepData>(step: T, data: WizardStepData[T]) => void;
  getStepData: <T extends keyof WizardStepData>(step: T) => WizardStepData[T];
  syncWithWizardData: (wizardData: Partial<WizardStepData>) => void;
  calculateTotalValue: () => number;
  validateStep: (step: number) => { isValid: boolean; errors: string[]; warnings: string[] };
  validateAllSteps: () => boolean;
  resetWizard: () => void;
  resetStore: () => void;
} =>
  useUnifiedProposalStore(
    useShallow(state => ({
      setCurrentStep: state.setCurrentStep,
      goToNextStep: state.goToNextStep,
      goToPreviousStep: state.goToPreviousStep,
      startWizard: state.startWizard,
      completeWizard: state.completeWizard,
      cancelWizard: state.cancelWizard,
      setStepData: state.setStepData,
      getStepData: state.getStepData,
      syncWithWizardData: state.syncWithWizardData,
      calculateTotalValue: state.calculateTotalValue,
      validateStep: state.validateStep,
      validateAllSteps: state.validateAllSteps,
      resetWizard: state.resetWizard,
      resetStore: state.resetStore,
    }))
  );

/**
 * @deprecated Use the named hooks directly instead of this namespace.
 * Examples:
 * - `useUnifiedProposalStep4Data`
 * - `useUnifiedProposalActions`
 * - `useUnifiedProposalCurrentStep`
 * - `useUnifiedProposalCanNavigateForward`
 * This alias is retained temporarily for migration ergonomics and will be removed
 * in a future release after the deprecation window.
 */
// Convenience namespace (optional) retaining prior import name with proper hook naming
export const useUnifiedProposalStoreSelectors = {
  useCurrentStep: useUnifiedProposalCurrentStep,
  useIsWizardActive: useUnifiedProposalIsWizardActive,
  useWizardData: useUnifiedProposalWizardData,
  useStep1Data: useUnifiedProposalStep1Data,
  useStep2Data: useUnifiedProposalStep2Data,
  useStep3Data: useUnifiedProposalStep3Data,
  useStep4Data: useUnifiedProposalStep4Data,
  useStep5Data: useUnifiedProposalStep5Data,
  useCanNavigateBack: useUnifiedProposalCanNavigateBack,
  useCanNavigateForward: useUnifiedProposalCanNavigateForward,
  useStepValidation: useUnifiedProposalStepValidation,
  useActions: useUnifiedProposalActions,
} as const;
