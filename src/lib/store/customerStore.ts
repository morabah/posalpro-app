'use client';

// Customer UI State Store - New Architecture
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

// UI State Types
export type CustomerViewMode = 'table' | 'list' | 'grid';
export type CustomerSortBy = 'createdAt' | 'name' | 'status' | 'revenue';
export type CustomerSortOrder = 'asc' | 'desc';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'PROSPECT';
export type CustomerTier = 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';

// Filters interface
export interface CustomerFilters {
  search: string;
  status?: CustomerStatus;
  tier?: CustomerTier;
  industry?: string;
}

// Sorting interface
export interface CustomerSorting {
  sortBy: CustomerSortBy;
  sortOrder: CustomerSortOrder;
}

// View interface
export interface CustomerView {
  mode: CustomerViewMode;
  compact: boolean;
}

// Pagination interface
export interface CustomerPagination {
  limit: number;
}

// Selection interface
export interface CustomerSelection {
  selectedIds: string[];
}

// Main state interface
export interface CustomerState {
  // State
  filters: CustomerFilters;
  sorting: CustomerSorting;
  view: CustomerView;
  pagination: CustomerPagination;
  selection: CustomerSelection;

  // Actions
  setFilters: (filters: Partial<CustomerFilters>) => void;
  setSorting: (sorting: Partial<CustomerSorting>) => void;
  setView: (view: Partial<CustomerView>) => void;
  setLimit: (limit: number) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearFilters: () => void;
  resetState: () => void;
}

// Initial state
const initialState = {
  filters: {
    search: '',
    status: undefined,
    tier: undefined,
    industry: undefined,
  },
  sorting: {
    sortBy: 'createdAt' as CustomerSortBy,
    sortOrder: 'desc' as CustomerSortOrder,
  },
  view: {
    mode: 'table' as CustomerViewMode,
    compact: false,
  },
  pagination: {
    limit: 20,
  },
  selection: {
    selectedIds: [],
  },
};

// Store creation
export const useCustomerStore = create<CustomerState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,

        // Filter actions
        setFilters: filters =>
          set(state => ({
            filters: { ...state.filters, ...filters },
            // Reset selection when filters change
            selection: { selectedIds: [] },
          })),

        clearFilters: () =>
          set(state => ({
            filters: initialState.filters,
            selection: { selectedIds: [] },
          })),

        // Sorting actions
        setSorting: sorting =>
          set(state => ({
            sorting: { ...state.sorting, ...sorting },
          })),

        // View actions
        setView: view =>
          set(state => ({
            view: { ...state.view, ...view },
          })),

        // Pagination actions
        setLimit: limit =>
          set(state => ({
            pagination: { ...state.pagination, limit },
          })),

        // Selection actions
        setSelectedIds: ids =>
          set(() => ({
            selection: { selectedIds: Array.from(new Set(ids)) },
          })),

        clearSelection: () =>
          set(() => ({
            selection: { selectedIds: [] },
          })),

        toggleSelection: id =>
          set(state => {
            const selectedIds = state.selection.selectedIds;
            const newSelectedIds = selectedIds.includes(id)
              ? selectedIds.filter(selectedId => selectedId !== id)
              : [...selectedIds, id];

            return {
              selection: { selectedIds: newSelectedIds },
            };
          }),

        selectAll: ids =>
          set(() => ({
            selection: { selectedIds: ids },
          })),

        // Reset state
        resetState: () => set(initialState),
      }),
      {
        name: 'customers-ui',
        // Only persist UI state, not selection
        partialize: state => ({
          filters: state.filters,
          sorting: state.sorting,
          view: state.view,
          pagination: state.pagination,
        }),
      }
    )
  )
);

// Selectors for optimized subscriptions
export const customerSelectors = {
  filters: (state: CustomerState) => state.filters,
  sorting: (state: CustomerState) => state.sorting,
  view: (state: CustomerState) => state.view,
  limit: (state: CustomerState) => state.pagination.limit,
  selection: (state: CustomerState) => state.selection,
  selectedIds: (state: CustomerState) => state.selection.selectedIds,
  selectedCount: (state: CustomerState) => state.selection.selectedIds.length,
  hasSelection: (state: CustomerState) => state.selection.selectedIds.length > 0,
  isAllSelected: (state: CustomerState) => (ids: string[]) =>
    ids.length > 0 && ids.every(id => state.selection.selectedIds.includes(id)),
  isPartiallySelected: (state: CustomerState) => (ids: string[]) =>
    ids.some(id => state.selection.selectedIds.includes(id)) &&
    !ids.every(id => state.selection.selectedIds.includes(id)),
};

// Hook for getting query parameters from store state
export function useCustomerQueryParams() {
  const filters = useCustomerStore(customerSelectors.filters);
  const sorting = useCustomerStore(customerSelectors.sorting);
  const limit = useCustomerStore(customerSelectors.limit);

  return {
    search: filters.search,
    limit,
    sortBy: sorting.sortBy,
    sortOrder: sorting.sortOrder,
    status: filters.status,
    tier: filters.tier,
    industry: filters.industry,
  };
}

// Hook for selection state
export function useCustomerSelection() {
  const selectedIds = useCustomerStore(customerSelectors.selectedIds);
  const selectedCount = useCustomerStore(customerSelectors.selectedCount);
  const hasSelection = useCustomerStore(customerSelectors.hasSelection);

  return {
    selectedIds,
    selectedCount,
    hasSelection,
  };
}

// Hook for checking if specific customer is selected
export function useCustomerSelectionState(customerId: string) {
  const selectedIds = useCustomerStore(customerSelectors.selectedIds);
  return selectedIds.includes(customerId);
}

// Hook for checking if all customers in a list are selected
export function useCustomerBulkSelectionState(customerIds: string[]) {
  const isAllSelected = useCustomerStore(customerSelectors.isAllSelected);
  const isPartiallySelected = useCustomerStore(customerSelectors.isPartiallySelected);

  return {
    isAllSelected: isAllSelected(customerIds),
    isPartiallySelected: isPartiallySelected(customerIds),
  };
}
