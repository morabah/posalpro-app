/**
 * Unified Proposal Store - Enhanced Zustand Store with Data Persistence
 * Implements MIGRATION_LESSONS.md patterns for stable state management
 * Ensures data persistence along wizard steps like product selection
 */

'use client';

import { logDebug, logError } from '@/lib/logger';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { UnifiedProposalData } from '@/hooks/useUnifiedProposalData';

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

// Store state interface
interface UnifiedProposalStoreState {
  // Current proposal data - single source of truth
  currentProposal: UnifiedProposalData | null;
  
  // Wizard state with persistence
  wizardData: WizardStepData;
  currentStep: number;
  isWizardActive: boolean;
  
  // Data persistence flags
  isPersisting: boolean;
  lastPersistedAt: number | null;
  persistenceErrors: string[];
  
  // Navigation state
  canNavigateBack: boolean;
  canNavigateForward: boolean;
  
  // Validation state
  stepValidation: Record<number, {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}

// Store actions interface
interface UnifiedProposalStoreActions {
  // Proposal management
  setCurrentProposal: (proposal: UnifiedProposalData | null) => void;
  updateProposalValue: (value: number) => void;
  
  // Wizard navigation
  setCurrentStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  startWizard: (initialData?: Partial<WizardStepData>) => void;
  completeWizard: () => void;
  cancelWizard: () => void;
  
  // Step data management with persistence
  setStepData: <T extends keyof WizardStepData>(step: T, data: WizardStepData[T]) => void;
  getStepData: <T extends keyof WizardStepData>(step: T) => WizardStepData[T];
  persistStepData: (step: number, data: any) => Promise<void>;
  
  // Data synchronization
  syncWithUnifiedData: (unifiedData: UnifiedProposalData) => void;
  calculateTotalValue: () => number;
  
  // Validation
  validateStep: (step: number) => { isValid: boolean; errors: string[]; warnings: string[] };
  validateAllSteps: () => boolean;
  
  // Persistence management
  setPersisting: (isPersisting: boolean) => void;
  addPersistenceError: (error: string) => void;
  clearPersistenceErrors: () => void;
  
  // Reset and cleanup
  resetWizard: () => void;
  resetStore: () => void;
}

type UnifiedProposalStore = UnifiedProposalStoreState & UnifiedProposalStoreActions;

// Initial state
const initialState: UnifiedProposalStoreState = {
  currentProposal: null,
  wizardData: {},
  currentStep: 1,
  isWizardActive: false,
  isPersisting: false,
  lastPersistedAt: null,
  persistenceErrors: [],
  canNavigateBack: false,
  canNavigateForward: false,
  stepValidation: {},
};

// Create the unified store with middleware
export const useUnifiedProposalStore = create<UnifiedProposalStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // Proposal management
      setCurrentProposal: (proposal) => {
        set((state) => {
          state.currentProposal = proposal;
          
          // Sync wizard data with proposal if exists
          if (proposal?.wizardData) {
            state.wizardData = { ...proposal.wizardData };
          }
          
          logDebug('Current proposal set', {
            component: 'UnifiedProposalStore',
            operation: 'setCurrentProposal',
            proposalId: proposal?.id,
            hasWizardData: !!proposal?.wizardData,
          });
        });
      },

      updateProposalValue: (value) => {
        set((state) => {
          if (state.currentProposal) {
            state.currentProposal.value = value;
            state.currentProposal.totalValue = value;
          }
          
          logDebug('Proposal value updated', {
            component: 'UnifiedProposalStore',
            operation: 'updateProposalValue',
            value,
          });
        });
      },

      // Wizard navigation
      setCurrentStep: (step) => {
        set((state) => {
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

      startWizard: (initialData) => {
        set((state) => {
          state.isWizardActive = true;
          state.currentStep = 1;
          state.wizardData = initialData || {};
          state.persistenceErrors = [];
          state.stepValidation = {};
          
          logDebug('Wizard started', {
            component: 'UnifiedProposalStore',
            operation: 'startWizard',
            hasInitialData: !!initialData,
          });
        });
      },

      completeWizard: () => {
        set((state) => {
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
        set((state) => {
          state.isWizardActive = false;
          state.currentStep = 1;
          state.wizardData = {};
          state.persistenceErrors = [];
          
          logDebug('Wizard cancelled', {
            component: 'UnifiedProposalStore',
            operation: 'cancelWizard',
          });
        });
      },

      // Step data management with persistence
      setStepData: (step, data) => {
        set((state) => {
          state.wizardData[step] = data;
          
          // Update validation for this step
          const validation = get().validateStep(parseInt(step.replace('step', '')));
          state.stepValidation[parseInt(step.replace('step', ''))] = validation;
          
          // Update proposal value if step 4 (products)
          if (step === 'step4' && data && 'totalValue' in data) {
            if (state.currentProposal) {
              state.currentProposal.value = data.totalValue;
              state.currentProposal.totalValue = data.totalValue;
              state.currentProposal.products = data.products || [];
              state.currentProposal.productCount = data.products?.length || 0;
            }
          }
          
          // Update persistence timestamp
          state.lastPersistedAt = Date.now();
          
          logDebug('Step data set with persistence', {
            component: 'UnifiedProposalStore',
            operation: 'setStepData',
            step,
            dataKeys: data ? Object.keys(data) : [],
            totalValue: step === 'step4' && data && 'totalValue' in data ? data.totalValue : undefined,
          });
        });
      },

      getStepData: (step) => {
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

      persistStepData: async (step, data) => {
        const { setPersisting, addPersistenceError, clearPersistenceErrors } = get();
        
        try {
          setPersisting(true);
          clearPersistenceErrors();
          
          logDebug('Persisting step data', {
            component: 'UnifiedProposalStore',
            operation: 'persistStepData',
            step,
            dataKeys: data ? Object.keys(data) : [],
          });
          
          // Set the step data in store
          get().setStepData(`step${step}` as keyof WizardStepData, data);
          
          // Here you would typically call an API to persist the data
          // For now, we'll simulate persistence with localStorage backup
          if (typeof window !== 'undefined') {
            const backupKey = `wizard-backup-step-${step}`;
            localStorage.setItem(backupKey, JSON.stringify({
              step,
              data,
              timestamp: Date.now(),
            }));
          }
          
          logDebug('Step data persisted successfully', {
            component: 'UnifiedProposalStore',
            operation: 'persistStepData',
            step,
          });
          
        } catch (error) {
          const errorMessage = `Failed to persist step ${step} data: ${error instanceof Error ? error.message : 'Unknown error'}`;
          addPersistenceError(errorMessage);
          
          logError('Step data persistence failed', error, {
            component: 'UnifiedProposalStore',
            operation: 'persistStepData',
            step,
          });
          
          throw error;
        } finally {
          setPersisting(false);
        }
      },

      // Data synchronization
      syncWithUnifiedData: (unifiedData) => {
        set((state) => {
          state.currentProposal = unifiedData;
          
          // Sync wizard data if it exists
          if (unifiedData.wizardData) {
            state.wizardData = { ...unifiedData.wizardData };
          }
          
          logDebug('Store synced with unified data', {
            component: 'UnifiedProposalStore',
            operation: 'syncWithUnifiedData',
            proposalId: unifiedData.id,
            totalValue: unifiedData.totalValue,
            productCount: unifiedData.productCount,
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
      validateStep: (step) => {
        const { wizardData } = get();
        const stepData = wizardData[`step${step}` as keyof WizardStepData];
        
        const validation = { isValid: true, errors: [], warnings: [] };
        
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
            if (!stepData || !('salesRepresentative' in stepData) || !stepData.salesRepresentative) {
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
      setPersisting: (isPersisting) => {
        set((state) => {
          state.isPersisting = isPersisting;
        });
      },

      addPersistenceError: (error) => {
        set((state) => {
          state.persistenceErrors.push(error);
        });
      },

      clearPersistenceErrors: () => {
        set((state) => {
          state.persistenceErrors = [];
        });
      },

      // Reset and cleanup
      resetWizard: () => {
        set((state) => {
          state.wizardData = {};
          state.currentStep = 1;
          state.isWizardActive = false;
          state.persistenceErrors = [];
          state.stepValidation = {};
          state.lastPersistedAt = null;
          
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

// Selectors for optimized component subscriptions
export const useUnifiedProposalStoreSelectors = {
  // Current proposal selectors
  currentProposal: () => useUnifiedProposalStore((state) => state.currentProposal),
  proposalValue: () => useUnifiedProposalStore((state) => state.currentProposal?.totalValue || 0),
  
  // Wizard selectors
  currentStep: () => useUnifiedProposalStore((state) => state.currentStep),
  isWizardActive: () => useUnifiedProposalStore((state) => state.isWizardActive),
  wizardData: () => useUnifiedProposalStore((state) => state.wizardData),
  
  // Step data selectors
  step1Data: () => useUnifiedProposalStore((state) => state.wizardData.step1),
  step2Data: () => useUnifiedProposalStore((state) => state.wizardData.step2),
  step3Data: () => useUnifiedProposalStore((state) => state.wizardData.step3),
  step4Data: () => useUnifiedProposalStore((state) => state.wizardData.step4),
  step5Data: () => useUnifiedProposalStore((state) => state.wizardData.step5),
  
  // Navigation selectors
  canNavigateBack: () => useUnifiedProposalStore((state) => state.canNavigateBack),
  canNavigateForward: () => useUnifiedProposalStore((state) => state.canNavigateForward),
  
  // Persistence selectors
  isPersisting: () => useUnifiedProposalStore((state) => state.isPersisting),
  persistenceErrors: () => useUnifiedProposalStore((state) => state.persistenceErrors),
  lastPersistedAt: () => useUnifiedProposalStore((state) => state.lastPersistedAt),
  
  // Validation selectors
  stepValidation: (step: number) => useUnifiedProposalStore((state) => state.stepValidation[step]),
  
  // Actions selectors
  actions: () => useUnifiedProposalStore((state) => ({
    setCurrentProposal: state.setCurrentProposal,
    updateProposalValue: state.updateProposalValue,
    setCurrentStep: state.setCurrentStep,
    goToNextStep: state.goToNextStep,
    goToPreviousStep: state.goToPreviousStep,
    startWizard: state.startWizard,
    completeWizard: state.completeWizard,
    cancelWizard: state.cancelWizard,
    setStepData: state.setStepData,
    getStepData: state.getStepData,
    persistStepData: state.persistStepData,
    syncWithUnifiedData: state.syncWithUnifiedData,
    calculateTotalValue: state.calculateTotalValue,
    validateStep: state.validateStep,
    validateAllSteps: state.validateAllSteps,
    resetWizard: state.resetWizard,
    resetStore: state.resetStore,
  })),
};
