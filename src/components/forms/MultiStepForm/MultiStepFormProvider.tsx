/**
 * Multi-Step Form Provider
 * Context provider for managing multi-step form state, navigation, and validation
 */

'use client';

import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { z } from 'zod';

export interface StepConfig {
  id: string;
  title: string;
  description?: string;
  schema?: z.ZodSchema;
  optional?: boolean;
  component: React.ComponentType<any>;
}

export interface StepData {
  [key: string]: any;
}

export interface MultiStepFormState {
  currentStep: number;
  steps: StepConfig[];
  stepData: StepData;
  errors: Record<string, string[]>;
  isValid: boolean;
  isSubmitting: boolean;
  progress: number;
  visitedSteps: Set<number>;
  canNavigateToStep: (stepIndex: number) => boolean;
}

type MultiStepFormAction =
  | { type: 'SET_STEPS'; payload: StepConfig[] }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'UPDATE_STEP_DATA'; payload: { stepId: string; data: any } }
  | { type: 'SET_STEP_ERRORS'; payload: { stepId: string; errors: string[] } }
  | { type: 'CLEAR_STEP_ERRORS'; payload: string }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'RESET_FORM' }
  | { type: 'LOAD_SAVED_DATA'; payload: StepData };

interface MultiStepFormContextType extends MultiStepFormState {
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepIndex: number) => void;
  updateStepData: (stepId: string, data: any) => void;
  setStepErrors: (stepId: string, errors: string[]) => void;
  clearStepErrors: (stepId: string) => void;
  validateCurrentStep: () => Promise<boolean>;
  setSubmitting: (submitting: boolean) => void;
  resetForm: () => void;
  saveProgress: () => void;
  loadSavedProgress: () => void;
  getCurrentStepData: () => any;
  getStepData: (stepId: string) => any;
  getAllStepData: () => StepData;
}

const MultiStepFormContext = createContext<MultiStepFormContextType | null>(null);

const multiStepFormReducer = (
  state: MultiStepFormState,
  action: MultiStepFormAction
): MultiStepFormState => {
  switch (action.type) {
    case 'SET_STEPS':
      return {
        ...state,
        steps: action.payload,
        progress:
          state.steps.length > 0 ? ((state.currentStep + 1) / action.payload.length) * 100 : 0,
      };

    case 'NEXT_STEP':
      if (state.currentStep < state.steps.length - 1) {
        const newStep = state.currentStep + 1;
        const newVisited = new Set(state.visitedSteps).add(newStep);
        return {
          ...state,
          currentStep: newStep,
          progress: ((newStep + 1) / state.steps.length) * 100,
          visitedSteps: newVisited,
        };
      }
      return state;

    case 'PREVIOUS_STEP':
      if (state.currentStep > 0) {
        const newStep = state.currentStep - 1;
        return {
          ...state,
          currentStep: newStep,
          progress: ((newStep + 1) / state.steps.length) * 100,
        };
      }
      return state;

    case 'GO_TO_STEP':
      if (action.payload >= 0 && action.payload < state.steps.length) {
        const newVisited = new Set(state.visitedSteps).add(action.payload);
        return {
          ...state,
          currentStep: action.payload,
          progress: ((action.payload + 1) / state.steps.length) * 100,
          visitedSteps: newVisited,
        };
      }
      return state;

    case 'UPDATE_STEP_DATA':
      return {
        ...state,
        stepData: {
          ...state.stepData,
          [action.payload.stepId]: {
            ...state.stepData[action.payload.stepId],
            ...action.payload.data,
          },
        },
      };

    case 'SET_STEP_ERRORS':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.stepId]: action.payload.errors,
        },
        isValid: Object.values({
          ...state.errors,
          [action.payload.stepId]: action.payload.errors,
        }).every(errors => errors.length === 0),
      };

    case 'CLEAR_STEP_ERRORS':
      const newErrors = { ...state.errors };
      delete newErrors[action.payload];
      return {
        ...state,
        errors: newErrors,
        isValid: Object.values(newErrors).every(errors => errors.length === 0),
      };

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload,
      };

    case 'RESET_FORM':
      return {
        ...state,
        currentStep: 0,
        stepData: {},
        errors: {},
        isValid: false,
        isSubmitting: false,
        progress: state.steps.length > 0 ? (1 / state.steps.length) * 100 : 0,
        visitedSteps: new Set([0]),
      };

    case 'LOAD_SAVED_DATA':
      return {
        ...state,
        stepData: action.payload,
      };

    default:
      return state;
  }
};

interface MultiStepFormProviderProps {
  children: React.ReactNode;
  steps: StepConfig[];
  initialData?: StepData;
  autoSave?: boolean;
  storageKey?: string;
  onStepChange?: (stepIndex: number, stepId: string) => void;
  onComplete?: (data: StepData) => void;
  onError?: (error: Error) => void;
}

export function MultiStepFormProvider({
  children,
  steps,
  initialData = {},
  autoSave = true,
  storageKey = 'multiStepFormData',
  onStepChange,
  onComplete,
  onError,
}: MultiStepFormProviderProps) {
  const [state, dispatch] = useReducer(multiStepFormReducer, {
    currentStep: 0,
    steps: [],
    stepData: initialData,
    errors: {},
    isValid: false,
    isSubmitting: false,
    progress: 0,
    visitedSteps: new Set([0]),
    canNavigateToStep: (stepIndex: number): boolean => {
      // Can navigate to current, previous, or next sequential step
      return stepIndex <= state.currentStep + 1 && stepIndex >= 0 && stepIndex < state.steps.length;
    },
  } as MultiStepFormState);

  // Initialize steps
  useEffect(() => {
    dispatch({ type: 'SET_STEPS', payload: steps });
  }, [steps]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && Object.keys(state.stepData).length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state.stepData));
      } catch (error) {
        console.warn('Failed to save form data to localStorage:', error);
      }
    }
  }, [state.stepData, autoSave, storageKey]);

  // Step change callback
  useEffect(() => {
    if (onStepChange && state.steps[state.currentStep]) {
      onStepChange(state.currentStep, state.steps[state.currentStep].id);
    }
  }, [state.currentStep, state.steps, onStepChange]);

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const previousStep = useCallback(() => {
    dispatch({ type: 'PREVIOUS_STEP' });
  }, []);

  const goToStep = useCallback(
    (stepIndex: number) => {
      if (state.canNavigateToStep(stepIndex)) {
        dispatch({ type: 'GO_TO_STEP', payload: stepIndex });
      }
    },
    [state.canNavigateToStep]
  );

  const updateStepData = useCallback((stepId: string, data: any) => {
    dispatch({ type: 'UPDATE_STEP_DATA', payload: { stepId, data } });
  }, []);

  const setStepErrors = useCallback((stepId: string, errors: string[]) => {
    dispatch({ type: 'SET_STEP_ERRORS', payload: { stepId, errors } });
  }, []);

  const clearStepErrors = useCallback((stepId: string) => {
    dispatch({ type: 'CLEAR_STEP_ERRORS', payload: stepId });
  }, []);

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const currentStepConfig = state.steps[state.currentStep];
    if (!currentStepConfig?.schema) {
      return true; // No validation schema, assume valid
    }

    try {
      const stepData = state.stepData[currentStepConfig.id] || {};
      await currentStepConfig.schema.parseAsync(stepData);
      clearStepErrors(currentStepConfig.id);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map(issue => issue.message);
        setStepErrors(currentStepConfig.id, errorMessages);
      } else {
        setStepErrors(currentStepConfig.id, ['Validation failed']);
        onError?.(error as Error);
      }
      return false;
    }
  }, [state.steps, state.currentStep, state.stepData, clearStepErrors, setStepErrors, onError]);

  const setSubmitting = useCallback((submitting: boolean) => {
    dispatch({ type: 'SET_SUBMITTING', payload: submitting });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
    if (autoSave) {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn('Failed to clear saved form data:', error);
      }
    }
  }, [autoSave, storageKey]);

  const saveProgress = useCallback(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state.stepData));
    } catch (error) {
      console.warn('Failed to save form progress:', error);
    }
  }, [state.stepData, storageKey]);

  const loadSavedProgress = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsedData = JSON.parse(saved);
        dispatch({ type: 'LOAD_SAVED_DATA', payload: parsedData });
      }
    } catch (error) {
      console.warn('Failed to load saved form data:', error);
    }
  }, [storageKey]);

  const getCurrentStepData = useCallback(() => {
    const currentStepConfig = state.steps[state.currentStep];
    if (!currentStepConfig) return {};
    return state.stepData[currentStepConfig.id] || {};
  }, [state.steps, state.currentStep, state.stepData]);

  const getStepData = useCallback(
    (stepId: string) => {
      return state.stepData[stepId] || {};
    },
    [state.stepData]
  );

  const getAllStepData = useCallback(() => {
    return state.stepData;
  }, [state.stepData]);

  const contextValue: MultiStepFormContextType = {
    ...state,
    nextStep,
    previousStep,
    goToStep,
    updateStepData,
    setStepErrors,
    clearStepErrors,
    validateCurrentStep,
    setSubmitting,
    resetForm,
    saveProgress,
    loadSavedProgress,
    getCurrentStepData,
    getStepData,
    getAllStepData,
  };

  return (
    <MultiStepFormContext.Provider value={contextValue}>{children}</MultiStepFormContext.Provider>
  );
}

export function useMultiStepForm() {
  const context = useContext(MultiStepFormContext);
  if (!context) {
    throw new Error('useMultiStepForm must be used within a MultiStepFormProvider');
  }
  return context;
}
