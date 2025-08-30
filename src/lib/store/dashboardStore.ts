'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

// UI-only state for Dashboard feature (per CORE_REQUIREMENTS)
export type TimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface DashboardUIState {
  filters: {
    search: string;
    status?: 'all' | 'active' | 'overdue' | 'won';
    timeRange: TimeRange;
    showExecutive: boolean;
  };
  collapsed: {
    enhancedAnalytics: boolean;
    detailedAnalytics: boolean;
    quickActions: boolean;
    recentProposals: boolean;
  };
}

export interface DashboardUIActions {
  setFilters: (next: Partial<DashboardUIState['filters']>) => void;
  toggleSection: (key: keyof DashboardUIState['collapsed']) => void;
  setSection: (key: keyof DashboardUIState['collapsed'], open: boolean) => void;
  reset: () => void;
}

export type DashboardUIStore = DashboardUIState & DashboardUIActions;

const initialState: DashboardUIState = {
  filters: {
    search: '',
    status: 'all',
    timeRange: 'week',
    showExecutive: true,
  },
  collapsed: {
    enhancedAnalytics: false,
    detailedAnalytics: false,
    quickActions: false,
    recentProposals: false,
  },
};

export const useDashboardUIStore = create<DashboardUIStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      setFilters: next => {
        set(state => {
          state.filters = { ...state.filters, ...next };
        });
      },

      toggleSection: key => {
        set(state => {
          state.collapsed[key] = !state.collapsed[key];
        });
      },

      setSection: (key, open) => {
        set(state => {
          state.collapsed[key] = !open ? true : false; // collapsed map stores collapsed state
        });
      },

      reset: () => set(() => initialState),
    }))
  )
);

// Selectors
export const useDashboardFilters = () => useDashboardUIStore(state => state.filters);
export const useDashboardCollapsed = () => useDashboardUIStore(state => state.collapsed);
export const useDashboardFiltersShallow = () =>
  useDashboardUIStore(useShallow(state => state.filters));
export const useDashboardUIActions = () =>
  useDashboardUIStore(
    useShallow(state => ({
      setFilters: state.setFilters,
      toggleSection: state.toggleSection,
      setSection: state.setSection,
      reset: state.reset,
    }))
  );

export type CollapsibleKey = keyof DashboardUIState['collapsed'];
