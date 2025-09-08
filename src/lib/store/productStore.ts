/**
 * Product Zustand Store - Modern Architecture
 * User Story: US-4.1 (Product Management)
 * Hypothesis: H5 (Modern data fetching improves performance and user experience)
 */

import { logDebug } from '@/lib/logger';
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ====================
// Store Types
// ====================

interface ProductFilters {
  search: string;
  category?: string;
  isActive?: boolean;
  sortBy: 'createdAt' | 'name' | 'price' | 'isActive';
  sortOrder: 'asc' | 'desc';
}

interface ProductState {
  // UI State Only
  selectedProducts: string[];
  filters: ProductFilters;
}

interface ProductActions {
  // UI Selection Management - UI STATE ONLY
  selectProduct: (id: string) => void;
  deselectProduct: (id: string) => void;
  toggleProductSelection: (id: string) => void;
  selectAllProducts: (productIds?: string[]) => void;
  clearSelection: () => void;

  // UI Filter Management - UI STATE ONLY
  setFilters: (filters: Partial<ProductFilters>) => void;
  resetFilters: () => void;
}

type ProductStore = ProductState & ProductActions;

// ====================
// Initial State
// ====================

const initialFilters: ProductFilters = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

// Initial state - UI STATE ONLY
const initialState: ProductState = {
  selectedProducts: [],
  filters: initialFilters,
};

// ====================
// Store Implementation
// ====================

export const useProductStore = create<ProductStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        // UI State Management - Server state moved to React Query

        // Selection Management
        selectProduct: (id: string) => {
          set(state => {
            if (!state.selectedProducts.includes(id)) {
              state.selectedProducts.push(id);
            }
          });
        },

        deselectProduct: (id: string) => {
          set(state => {
            state.selectedProducts = state.selectedProducts.filter(pid => pid !== id);
          });
        },

        toggleProductSelection: (id: string) => {
          set(state => {
            const index = state.selectedProducts.indexOf(id);
            if (index === -1) {
              state.selectedProducts.push(id);
            } else {
              state.selectedProducts.splice(index, 1);
            }
          });
        },

        selectAllProducts: (productIds?: string[]) => {
          set(state => {
            // If productIds are provided, use them; otherwise clear selection
            // This allows components to pass the current product IDs from React Query
            state.selectedProducts = productIds || [];
          });
        },

        clearSelection: () => {
          set(state => {
            state.selectedProducts = [];
          });
        },

        // Filter Management
        setFilters: (filters: Partial<ProductFilters>) => {
          set(state => {
            state.filters = { ...state.filters, ...filters };
          });
        },

        resetFilters: () => {
          set(state => {
            state.filters = initialFilters;
          });
        },

        // Server state management moved to React Query hooks
      }))
    ),
    {
      name: 'product-store',
      partialize: (state: ProductState) => ({
        filters: state.filters,
        selectedProducts: state.selectedProducts,
      }),
    }
  )
);

// ====================
// Selectors with Shallow Comparison
// ====================
// Note: Direct selector functions removed to comply with Rules of Hooks
// Use useProductStore directly in components instead

// ====================
// Store Actions (Bound)
// ====================

export const useProductActions = (): {
  // UI Selection Management - UI STATE ONLY
  selectProduct: (id: string) => void;
  deselectProduct: (id: string) => void;
  toggleProductSelection: (id: string) => void;
  selectAllProducts: (productIds?: string[]) => void;
  clearSelection: () => void;

  // UI Filter Management - UI STATE ONLY
  setFilters: (filters: Partial<ProductFilters>) => void;
  resetFilters: () => void;
} =>
  useProductStore(state => ({
    // UI Selection Management - UI STATE ONLY
    selectProduct: state.selectProduct,
    deselectProduct: state.deselectProduct,
    toggleProductSelection: state.toggleProductSelection,
    selectAllProducts: state.selectAllProducts,
    clearSelection: state.clearSelection,

    // UI Filter Management - UI STATE ONLY
    setFilters: state.setFilters,
    resetFilters: state.resetFilters,
  }));

// ====================
// Utility Functions
// ====================
// Server state utility functions moved to React Query hooks
// Filtering and sorting now handled by useInfiniteProductsMigrated hook

/**
 * Subscribe to store changes for debugging
 */
if (process.env.NODE_ENV === 'development') {
  useProductStore.subscribe(
    state => state.selectedProducts,
    selectedProducts => {
      logDebug('[ProductStore] Selection changed', {
        component: 'ProductStore',
        operation: 'selectionChange',
        itemCount: selectedProducts.length,
      });
    }
  );

  useProductStore.subscribe(
    state => state.filters,
    filters => {
      logDebug('[ProductStore] Filters changed', {
        component: 'ProductStore',
        operation: 'filterChange',
        filters,
      });
    }
  );
}

export default useProductStore;
