// Product UI State Store - New Architecture
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

// ====================
// Types
// ====================

export type ProductViewMode = 'table' | 'list' | 'grid' | 'relationships';
export type ProductSortBy = 'createdAt' | 'name' | 'price' | 'isActive';
export type ProductSortOrder = 'asc' | 'desc';
export type ProductStatus = boolean; // isActive field

// Filters interface
export interface ProductFilters {
  search: string;
  category?: string;
  isActive?: boolean;
}

// Sorting interface
export interface ProductSorting {
  sortBy: ProductSortBy;
  sortOrder: ProductSortOrder;
}

// View interface
export interface ProductView {
  mode: ProductViewMode;
  compact: boolean;
}

// Pagination interface
export interface ProductPagination {
  limit: number;
}

// Selection interface
export interface ProductSelection {
  selectedIds: string[];
}

// Relationship management interface
export interface ProductRelationships {
  selectedProductId?: string;
  relationshipMode: 'view' | 'edit';
  selectedRelationshipId?: string;
}

// Main state interface
export interface ProductState {
  // State
  filters: ProductFilters;
  sorting: ProductSorting;
  view: ProductView;
  pagination: ProductPagination;
  selection: ProductSelection;
  relationships: ProductRelationships;

  // Actions
  setFilters: (filters: Partial<ProductFilters>) => void;
  setSorting: (sorting: Partial<ProductSorting>) => void;
  setView: (view: Partial<ProductView>) => void;
  setLimit: (limit: number) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearFilters: () => void;
  resetState: () => void;
  setRelationshipMode: (mode: 'view' | 'edit') => void;
  setSelectedProductId: (id: string) => void;
  setSelectedRelationshipId: (id: string) => void;
  clearRelationshipSelection: () => void;
}

// ====================
// Initial State
// ====================

const initialState = {
  filters: {
    search: '',
    category: undefined,
    isActive: undefined,
  },
  sorting: {
    sortBy: 'createdAt' as ProductSortBy,
    sortOrder: 'desc' as ProductSortOrder,
  },
  view: {
    mode: 'table' as ProductViewMode,
    compact: false,
  },
  pagination: {
    limit: 20,
  },
  selection: {
    selectedIds: [],
  },
  relationships: {
    selectedProductId: undefined,
    relationshipMode: 'view' as const,
    selectedRelationshipId: undefined,
  },
};

// ====================
// Store Implementation
// ====================

export const useProductStore = create<ProductState>()(
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

        setSorting: sorting =>
          set(state => ({
            sorting: { ...state.sorting, ...sorting },
          })),

        setView: view =>
          set(state => ({
            view: { ...state.view, ...view },
          })),

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

        toggleSelection: id => {
          const state = get();
          const selectedIds = state.selection.selectedIds;
          const newSelectedIds = selectedIds.includes(id)
            ? selectedIds.filter(selectedId => selectedId !== id)
            : [...selectedIds, id];

          set(() => ({
            selection: { selectedIds: newSelectedIds },
          }));
        },

        selectAll: ids =>
          set(() => ({
            selection: { selectedIds: Array.from(new Set(ids)) },
          })),

        // Utility actions
        clearFilters: () =>
          set(state => ({
            filters: { ...initialState.filters },
            selection: { selectedIds: [] },
          })),

        resetState: () =>
          set(() => ({
            ...initialState,
          })),

        // Relationship management actions
        setRelationshipMode: mode =>
          set(state => ({
            relationships: { ...state.relationships, relationshipMode: mode },
          })),

        setSelectedProductId: id =>
          set(state => ({
            relationships: { ...state.relationships, selectedProductId: id },
          })),

        setSelectedRelationshipId: id =>
          set(state => ({
            relationships: { ...state.relationships, selectedRelationshipId: id },
          })),

        clearRelationshipSelection: () =>
          set(state => ({
            relationships: {
              ...state.relationships,
              selectedProductId: undefined,
              selectedRelationshipId: undefined,
            },
          })),
      }),
      {
        name: 'products-ui',
        partialize: state => ({
          filters: state.filters,
          sorting: state.sorting,
          view: state.view,
          pagination: state.pagination,
          relationships: state.relationships,
        }),
      }
    )
  )
);

// ====================
// Selectors
// ====================

export const productSelectors = {
  filters: (state: ProductState) => state.filters,
  sorting: (state: ProductState) => state.sorting,
  view: (state: ProductState) => state.view,
  limit: (state: ProductState) => state.pagination.limit,
  selection: (state: ProductState) => state.selection,
  relationships: (state: ProductState) => state.relationships,
  selectedIds: (state: ProductState) => state.selection.selectedIds,
  selectedProductId: (state: ProductState) => state.relationships.selectedProductId,
  relationshipMode: (state: ProductState) => state.relationships.relationshipMode,
  selectedRelationshipId: (state: ProductState) => state.relationships.selectedRelationshipId,
  isSelectionEmpty: (state: ProductState) => state.selection.selectedIds.length === 0,
  selectionCount: (state: ProductState) => state.selection.selectedIds.length,
  hasSelectedProduct: (state: ProductState) => !!state.relationships.selectedProductId,
  isRelationshipEditMode: (state: ProductState) => state.relationships.relationshipMode === 'edit',
};

// ====================
// Export Default
// ====================

export default useProductStore;
