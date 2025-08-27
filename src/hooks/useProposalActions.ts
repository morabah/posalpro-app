/**
 * useProposalActions Hook
 * Provides actions for managing proposal wizard state
 */

import { useCallback } from 'react';
import { type ProposalStepData } from '@/lib/store/proposalStore';

export function useProposalActions() {
  const setStepData = useCallback((stepData: ProposalStepData) => {
    // Store step data in localStorage for persistence during wizard flow
    const currentData = localStorage.getItem('proposal-wizard-data');
    const existingData = currentData ? JSON.parse(currentData) : {};
    
    const updatedData = {
      ...existingData,
      ...stepData,
    };
    
    localStorage.setItem('proposal-wizard-data', JSON.stringify(updatedData));
  }, []);

  const getStepData = useCallback(() => {
    const currentData = localStorage.getItem('proposal-wizard-data');
    return currentData ? JSON.parse(currentData) : {};
  }, []);

  const clearStepData = useCallback(() => {
    localStorage.removeItem('proposal-wizard-data');
  }, []);

  return {
    setStepData,
    getStepData,
    clearStepData,
  };
}
