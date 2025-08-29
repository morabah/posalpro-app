// Zustand Store Template for Migration from Bridge Pattern
// Replace __ENTITY__ with actual entity name (e.g., Customer, Product, Proposal)
// User Story: __USER_STORY__ (e.g., US-1.1)
// Hypothesis: __HYPOTHESIS__ (e.g., H1)
//
// ✅ FOLLOWS: MIGRATION_LESSONS.md - Zustand best practices with shallow comparison
// ✅ FOLLOWS: CORE_REQUIREMENTS.md - Type-safe state management
// ✅ ALIGNS: Analytics integration for state changes
// ✅ IMPLEMENTS: Performance-optimized selectors and actions

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

// ====================
// Import Analytics
// ====================

// TODO: Replace with actual imports when implementing
// import { logDebug } from '@/lib/logger';

// ====================
// Enhanced Types with Better TypeScript Support
// ====================

type SortBy = 'createdAt' | 'name' | 'updatedAt'; // Add more as needed
type SortOrder = 'asc' | 'desc';
type ViewMode = 'table' | 'list' | 'grid' | 'cards';
type ViewDensity = 'compact' | 'comfortable' | 'spacious';

interface Sorting {
  sortBy: SortBy;
  sortOrder: SortOrder;
}

interface View {
  mode: ViewMode;
  density: ViewDensity;
  showToolbar: boolean;
  showFilters: boolean;
}

interface Filters {
  search?: string;
  status?: string;
  category?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  // Add domain-specific filters here
}

interface Pagination {
  limit: number;
  page: number;
  total?: number;
}

interface Selection {
  selectedIds: string[];
  lastSelectedId?: string;
  selectionMode: 'single' | 'multiple';
}

interface UIState {
  isLoading: boolean;
  error?: string | null;
  lastUpdated?: Date;
}

// ====================
// Store State Interface
// ====================

interface __ENTITY__StoreState {
  // Data state
  filters: Filters;
  sorting: Sorting;
  view: View;
  pagination: Pagination;
  selection: Selection;
  ui: UIState;

  // Actions
  setFilters: (filters: Partial<Filters>) => void;
  setSorting: (sorting: Partial<Sorting>) => void;
  setView: (view: Partial<View>) => void;
  setPagination: (pagination: Partial<Pagination>) => void;
  setSelectedIds: (ids: string[], mode?: 'single' | 'multiple') => void;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Utility actions
  resetFilters: () => void;
  resetView: () => void;
  reset: () => void;
}

// ====================
// Default Values
// ====================

const defaultFilters: Filters = {
  search: '',
  status: '',
  category: '',
};

const defaultSorting: Sorting = {
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const defaultView: View = {
  mode: 'table',
  density: 'comfortable',
  showToolbar: true,
  showFilters: true,
};

const defaultPagination: Pagination = {
  limit: 20,
  page: 1,
};

const defaultSelection: Selection = {
  selectedIds: [],
  selectionMode: 'multiple',
};

const defaultUI: UIState = {
  isLoading: false,
  error: null,
};

// ====================
// Store Implementation with Modern Patterns
// ====================

export const use__ENTITY__Store = create<__ENTITY__StoreState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        filters: { ...defaultFilters },
        sorting: { ...defaultSorting },
        view: { ...defaultView },
        pagination: { ...defaultPagination },
        selection: { ...defaultSelection },
        ui: { ...defaultUI },

        // Actions with logging and analytics
        setFilters: newFilters => {
          logDebug('Store: Setting __RESOURCE__ filters', {
            component: '__ENTITY__Store',
            operation: 'setFilters',
            filters: newFilters,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          });

          set(state => ({
            filters: { ...state.filters, ...newFilters },
            pagination: { ...state.pagination, page: 1 }, // Reset pagination on filter change
            ui: { ...state.ui, lastUpdated: new Date() },
          }));
        },

        setSorting: newSorting => {
          logDebug('Store: Setting __RESOURCE__ sorting', {
            component: '__ENTITY__Store',
            operation: 'setSorting',
            sorting: newSorting,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          });

          set(state => ({
            sorting: { ...state.sorting, ...newSorting },
            ui: { ...state.ui, lastUpdated: new Date() },
          }));
        },

        setView: newView => {
          logDebug('Store: Setting __RESOURCE__ view', {
            component: '__ENTITY__Store',
            operation: 'setView',
            view: newView,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          });

          set(state => ({
            view: { ...state.view, ...newView },
            ui: { ...state.ui, lastUpdated: new Date() },
          }));
        },

        setPagination: newPagination => {
          set(state => ({
            pagination: { ...state.pagination, ...newPagination },
            ui: { ...state.ui, lastUpdated: new Date() },
          }));
        },

        setSelectedIds: (ids, mode = 'multiple') => {
          const uniqueIds = Array.from(new Set(ids));

          logDebug('Store: Setting __RESOURCE__ selection', {
            component: '__ENTITY__Store',
            operation: 'setSelectedIds',
            selectedCount: uniqueIds.length,
            mode,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          });

          set(() => ({
            selection: {
              selectedIds: uniqueIds,
              lastSelectedId: uniqueIds[uniqueIds.length - 1],
              selectionMode: mode,
            },
            ui: { isLoading: false, error: null, lastUpdated: new Date() },
          }));
        },

        toggleSelection: id => {
          const state = get();
          const { selectedIds } = state.selection;
          const isSelected = selectedIds.includes(id);

          const newIds = isSelected
            ? selectedIds.filter(selectedId => selectedId !== id)
            : [...selectedIds, id];

          logDebug('Store: Toggling __RESOURCE__ selection', {
            component: '__ENTITY__Store',
            operation: 'toggleSelection',
            __RESOURCE__Id: id,
            wasSelected: isSelected,
            newCount: newIds.length,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          });

          set(() => ({
            selection: {
              selectedIds: newIds,
              lastSelectedId: id,
              selectionMode: 'multiple',
            },
            ui: { ...state.ui, lastUpdated: new Date() },
          }));
        },

        selectAll: ids => {
          logDebug('Store: Selecting all __RESOURCE__', {
            component: '__ENTITY__Store',
            operation: 'selectAll',
            totalCount: ids.length,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          });

          set(() => ({
            selection: {
              selectedIds: ids,
              lastSelectedId: ids[ids.length - 1],
              selectionMode: 'multiple',
            },
            ui: { isLoading: false, error: null, lastUpdated: new Date() },
          }));
        },

        clearSelection: () => {
          logDebug('Store: Clearing __RESOURCE__ selection', {
            component: '__ENTITY__Store',
            operation: 'clearSelection',
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          });

          set(() => ({
            selection: { ...defaultSelection },
            ui: { isLoading: false, error: null, lastUpdated: new Date() },
          }));
        },

        setLoading: loading => {
          set(state => ({
            ui: { ...state.ui, isLoading: loading, lastUpdated: new Date() },
          }));
        },

        setError: error => {
          set(state => ({
            ui: { ...state.ui, error, lastUpdated: new Date() },
          }));
        },

        // Utility actions
        resetFilters: () => {
          logDebug('Store: Resetting __RESOURCE__ filters', {
            component: '__ENTITY__Store',
            operation: 'resetFilters',
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          });

          set(() => ({
            filters: { ...defaultFilters },
            pagination: { ...defaultPagination },
            ui: { isLoading: false, error: null, lastUpdated: new Date() },
          }));
        },

        resetView: () => {
          set(() => ({
            view: { ...defaultView },
            ui: { isLoading: false, error: null, lastUpdated: new Date() },
          }));
        },

        reset: () => {
          logDebug('Store: Resetting entire __RESOURCE__ store', {
            component: '__ENTITY__Store',
            operation: 'reset',
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          });

          set(() => ({
            filters: { ...defaultFilters },
            sorting: { ...defaultSorting },
            view: { ...defaultView },
            pagination: { ...defaultPagination },
            selection: { ...defaultSelection },
            ui: { ...defaultUI, lastUpdated: new Date() },
          }));
        },
      }),
      {
        name: '__RESOURCE__-ui-state',
        version: 1,
        partialize: state => ({
          filters: state.filters,
          sorting: state.sorting,
          view: state.view,
          pagination: { limit: state.pagination.limit }, // Only persist limit, not page
        }),
        // Add migration logic if needed for future versions
        migrate: (persistedState: any, version: number) => {
          if (version === 0) {
            // Migration from v0 to v1
            return {
              ...persistedState,
              view: { ...defaultView, ...persistedState.view },
            };
          }
          return persistedState;
        },
      }
    )
  )
);

// ====================
// Optimized Selectors (Shallow Comparison)
// ====================

export const __RESOURCE__Selectors = {
  // Basic selectors
  filters: (state: __ENTITY__StoreState) => state.filters,
  sorting: (state: __ENTITY__StoreState) => state.sorting,
  view: (state: __ENTITY__StoreState) => state.view,
  pagination: (state: __ENTITY__StoreState) => state.pagination,
  selection: (state: __ENTITY__StoreState) => state.selection,
  ui: (state: __ENTITY__StoreState) => state.ui,

  // Computed selectors
  selectedCount: (state: __ENTITY__StoreState) => state.selection.selectedIds.length,
  hasSelection: (state: __ENTITY__StoreState) => state.selection.selectedIds.length > 0,
  isAllSelected: (state: __ENTITY__StoreState) => (totalItems: number) =>
    state.selection.selectedIds.length === totalItems && totalItems > 0,
  hasActiveFilters: (state: __ENTITY__StoreState) => {
    const { filters } = state;
    return !!(filters.search || filters.status || filters.category);
  },
  isLoading: (state: __ENTITY__StoreState) => state.ui.isLoading,
  hasError: (state: __ENTITY__StoreState) => !!state.ui.error,

  // Complex selectors
  queryParams: (state: __ENTITY__StoreState) => ({
    search: state.filters.search || '',
    limit: state.pagination.limit,
    sortBy: state.sorting.sortBy,
    sortOrder: state.sorting.sortOrder,
    // Add other query params as needed
  }),
} as const;

// ====================
// Export Default
// ====================

export default use__ENTITY__Store;
