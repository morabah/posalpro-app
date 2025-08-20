'use client';

/**
 * PosalPro MVP2 - Plan Context Provider
 * Allows runtime selection of feature sets (basic, advanced, enterprise)
 */

import { useErrorHandler } from '@/hooks/useErrorHandler';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Plan = 'basic' | 'advanced' | 'enterprise';

interface PlanContextValue {
  plan: Plan;
  setPlan: (plan: Plan) => void;
}

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { handleAsyncError } = useErrorHandler();
  const [plan, setPlanState] = useState<Plan>('enterprise');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('app_plan');
      if (stored === 'basic' || stored === 'advanced' || stored === 'enterprise') {
        setPlanState(stored);
      }
    } catch (error) {
      handleAsyncError(error, 'Failed to load plan from storage', {
        component: 'PlanProvider',
        method: 'loadPlan',
      });
    }
  }, [handleAsyncError]);

  const setPlan = useCallback(
    (newPlan: Plan) => {
      setPlanState(newPlan);
      try {
        localStorage.setItem('app_plan', newPlan);
      } catch (error) {
        handleAsyncError(error, 'Failed to save plan to storage', {
          component: 'PlanProvider',
          method: 'savePlan',
          newPlan,
        });
      }
    },
    [handleAsyncError]
  );

  return <PlanContext.Provider value={{ plan, setPlan }}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanContextValue {
  const context = useContext(PlanContext);
  if (!context) {
    return { plan: 'enterprise', setPlan: () => undefined };
  }
  return context;
}
