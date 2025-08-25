/**
 * Product Zustand Store - Modern Architecture
 * User Story: US-4.1 (Product Management)
 * Hypothesis: H5 (Modern data fetching improves performance and user experience)
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import type { Product } from '@/services/productService';

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
  // Data
  products: Record<string, Product>;
  productIds: string[];
  selectedProducts: string[];
  filters: ProductFilters;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor: string | null;
  
  // Bulk Operations
  bulkOperationInProgress: boolean;
  bulkOperationType: 'delete' | 'update' | null;
  
  // Statistics
  stats: {
    total: number;
    active: number;
    inactive: number;
    draft: number;
    categories: Record<string, number>;
  } | null;
}

interface ProductActions {
  // Product Management
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  clearProducts: () => void;
  
  // Selection Management
  selectProduct: (id: string) => void;
  deselectProduct: (id: string) => void;
  toggleProductSelection: (id: string) => void;
  selectAllProducts: () => void;
  clearSelection: () => void;
  
  // Filter Management
  setFilters: (filters: Partial<ProductFilters>) => void;
  resetFilters: () => void;
  
  // UI State Management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (hasMore: boolean, nextCursor: string | null) => void;
  
  // Bulk Operations
  setBulkOperation: (type: 'delete' | 'update' | null, inProgress: boolean) => void;
  
  // Statistics
  setStats: (stats: ProductState['stats']) => void;
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

const initialState: ProductState = {
  // Data
  products: {},
  productIds: [],
  selectedProducts: [],
  filters: initialFilters,
  
  // UI State
  isLoading: false,
  error: null,
  hasMore: true,
  nextCursor: null,
  
  // Bulk Operations
  bulkOperationInProgress: false,
  bulkOperationType: null,
  
  // Statistics
  stats: null,
};

// ====================
// Store Implementation
// ====================

export const useProductStore = create<ProductStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,
        
        // Product Management
        setProducts: (products: Product[]) => {
          set((state) => {
            const productMap: Record<string, Product> = {};
            const ids: string[] = [];
            
            products.forEach((product) => {
              productMap[product.id] = product;
              ids.push(product.id);
            });
            
            state.products = productMap;
            state.productIds = ids;
          });
        },
        
        addProduct: (product: Product) => {
          set((state) => {
            state.products[product.id] = product;
            if (!state.productIds.includes(product.id)) {
              state.productIds.unshift(product.id);
            }
          });
        },
        
        updateProduct: (id: string, updates: Partial<Product>) => {
          set((state) => {
            if (state.products[id]) {
              state.products[id] = { ...state.products[id], ...updates };
            }
          });
        },
        
        removeProduct: (id: string) => {
          set((state) => {
            delete state.products[id];
            state.productIds = state.productIds.filter((pid) => pid !== id);
            state.selectedProducts = state.selectedProducts.filter((pid) => pid !== id);
          });
        },
        
        clearProducts: () => {
          set((state) => {
            state.products = {};
            state.productIds = [];
            state.selectedProducts = [];
          });
        },
        
        // Selection Management
        selectProduct: (id: string) => {
          set((state) => {
            if (!state.selectedProducts.includes(id)) {
              state.selectedProducts.push(id);
            }
          });
        },
        
        deselectProduct: (id: string) => {
          set((state) => {
            state.selectedProducts = state.selectedProducts.filter((pid) => pid !== id);
          });
        },
        
        toggleProductSelection: (id: string) => {
          set((state) => {
            const index = state.selectedProducts.indexOf(id);
            if (index === -1) {
              state.selectedProducts.push(id);
            } else {
              state.selectedProducts.splice(index, 1);
            }
          });
        },
        
        selectAllProducts: () => {
          set((state) => {
            state.selectedProducts = [...state.productIds];
          });
        },
        
        clearSelection: () => {
          set((state) => {
            state.selectedProducts = [];
          });
        },
        
        // Filter Management
        setFilters: (filters: Partial<ProductFilters>) => {
          set((state) => {
            state.filters = { ...state.filters, ...filters };
          });
        },
        
        resetFilters: () => {
          set((state) => {
            state.filters = initialFilters;
          });
        },
        
        // UI State Management
        setLoading: (loading: boolean) => {
          set((state) => {
            state.isLoading = loading;
          });
        },
        
        setError: (error: string | null) => {
          set((state) => {
            state.error = error;
          });
        },
        
        setPagination: (hasMore: boolean, nextCursor: string | null) => {
          set((state) => {
            state.hasMore = hasMore;
            state.nextCursor = nextCursor;
          });
        },
        
        // Bulk Operations
        setBulkOperation: (type: 'delete' | 'update' | null, inProgress: boolean) => {
          set((state) => {
            state.bulkOperationType = type;
            state.bulkOperationInProgress = inProgress;
          });
        },
        
        // Statistics
        setStats: (stats: ProductState['stats']) => {
          set((state) => {
            state.stats = stats;
          });
        },
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

export const useProductActions = () => useProductStore((state) => ({
  // Product Management
  setProducts: state.setProducts,
  addProduct: state.addProduct,
  updateProduct: state.updateProduct,
  removeProduct: state.removeProduct,
  clearProducts: state.clearProducts,
  
  // Selection Management
  selectProduct: state.selectProduct,
  deselectProduct: state.deselectProduct,
  toggleProductSelection: state.toggleProductSelection,
  selectAllProducts: state.selectAllProducts,
  clearSelection: state.clearSelection,
  
  // Filter Management
  setFilters: state.setFilters,
  
  // UI State Management
  setLoading: state.setLoading,
  setError: state.setError,
  
  // Bulk Operations
  setBulkOperation: state.setBulkOperation,
  
  // Statistics
  setStats: state.setStats,
}));

// ====================
// Utility Functions
// ====================

/**
 * Get filtered and sorted products based on current filters
 */
export const getFilteredProducts = (state: ProductStore): Product[] => {
  const { products, productIds, filters } = state;
  let filteredProducts = productIds.map(id => products[id]).filter(Boolean);
  
  // Apply search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredProducts = filteredProducts.filter(product => 
      product.name.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      product.sku.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply category filter
  if (filters.category) {
    filteredProducts = filteredProducts.filter(product => 
      product.category.includes(filters.category!)
    );
  }
  
  // Apply active status filter
  if (filters.isActive !== undefined) {
    filteredProducts = filteredProducts.filter(product => 
      product.isActive === filters.isActive
    );
  }
  
  // Apply sorting
  filteredProducts.sort((a, b) => {
    const { sortBy, sortOrder } = filters;
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'isActive':
        comparison = Number(a.isActive) - Number(b.isActive);
        break;
      case 'createdAt':
      default:
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
  
  return filteredProducts;
};

/**
 * Subscribe to store changes for debugging
 */
if (process.env.NODE_ENV === 'development') {
  useProductStore.subscribe(
    (state) => state.selectedProducts,
    (selectedProducts) => {
      console.debug('[ProductStore] Selection changed:', selectedProducts.length, 'items');
    }
  );
  
  useProductStore.subscribe(
    (state) => state.filters,
    (filters) => {
      console.debug('[ProductStore] Filters changed:', filters);
    }
  );
}

export default useProductStore;
