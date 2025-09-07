'use client';

/**
 * PosalPro MVP2 - Modern Product Selection Step
 * Built from scratch using React Query and modern patterns
 * Follows PROPOSAL_MIGRATION_ASSESSMENT.md guidelines
 */

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Tooltip } from '@/components/ui/Tooltip';
import type { Product } from '@/features/products';
import { useInfiniteProductsMigrated, useProductCategories } from '@/features/products/hooks';
import { useUpdateProposal, type WizardProposalUpdateData } from '@/features/proposals';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { useProposalSetStepData, type ProposalProductData } from '@/lib/store/proposalStore';
import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

interface ProductSelectionStepProps {
  data?: ProposalProductData;
  onNext: () => void;
  onBack: () => void;
  onUpdate?: (data: ProposalProductData) => void;
  proposalId?: string; // ✅ ADDED: For unique localStorage keys per proposal
}

// ✅ REACT HOOK FORM SCHEMA FOR FILTER CONTROLS
const filterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.string().optional(),
  showSelectedOnly: z.boolean().optional(),
});

type FilterFormData = z.infer<typeof filterSchema>;

export const ProductSelectionStep = React.memo(function ProductSelectionStep({
  data,
  onNext,
  onBack,
  onUpdate,
  proposalId,
}: ProductSelectionStepProps) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const setStepData = useProposalSetStepData();
  const updateProposalMutation = useUpdateProposal();

  // Local state for form data
  const [selectedProducts, setSelectedProducts] = useState<ProposalProductData['products']>(() => {
    const initialProducts = data?.products || [];

    // Reduced logging - only in development
    if (process.env.NODE_ENV === 'development') {
      logDebug('ProductSelectionStep: Initialized', {
        component: 'ProductSelectionStep',
        operation: 'initialization',
        hasData: !!data,
        initialProductsCount: initialProducts.length,
        proposalId,
        productsData: initialProducts.map(p => ({
          id: p.id,
          productId: p.productId,
          name: p.name,
          quantity: p.quantity,
        })),
      });
    }

    return initialProducts;
  });

  // UI state: search and sorting (persisted in localStorage)
  // ✅ FIXED: Make storage key unique per proposal to prevent caching issues
  const STORAGE_KEY = useMemo(
    () => (proposalId ? `wizard:step4:products:${proposalId}` : 'wizard:step4:products'),
    [proposalId]
  );
  // ✅ REACT HOOK FORM SETUP FOR FILTER CONTROLS
  const { register, control, watch, setValue } = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: '',
      category: '',
      sortBy: 'name',
      sortOrder: 'asc',
      showSelectedOnly: false,
    },
  });

  // Watch form values for easier access
  const search = watch('search') || '';
  const category = watch('category') || '';
  const sortBy = (watch('sortBy') as 'createdAt' | 'name' | 'price' | 'isActive') || 'name';
  const sortOrder = (watch('sortOrder') as 'asc' | 'desc') || 'asc';
  const showSelectedOnly = watch('showSelectedOnly') || false;

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as FilterFormData;
        if (saved.search !== undefined) setValue('search', saved.search);
        if (saved.sortBy) setValue('sortBy', saved.sortBy);
        if (saved.sortOrder) setValue('sortOrder', saved.sortOrder);
        if (saved.category !== undefined) setValue('category', saved.category);
        if (saved.showSelectedOnly !== undefined)
          setValue('showSelectedOnly', saved.showSelectedOnly);
      }
    } catch {
      // Ignore localStorage read failures - will use default values
    }
  }, [STORAGE_KEY, setValue]); // ✅ FIXED: Include STORAGE_KEY in dependency to re-load when proposal changes

  // ✅ FIXED: Reset UI state when proposal changes to prevent stale data
  useEffect(() => {
    if (proposalId) {
      if (process.env.NODE_ENV === 'development') {
        logDebug('ProductSelectionStep: UI state reset', {
          component: 'ProductSelectionStep',
          operation: 'reset_ui_state',
          proposalId,
        });
      }

      // Clear previous state when switching proposals
      setValue('search', '');
      setValue('sortBy', 'name');
      setValue('sortOrder', 'asc');
      setValue('category', '');
      setValue('showSelectedOnly', false);
    }
  }, [proposalId, setValue]);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ search, sortBy, sortOrder, category, showSelectedOnly })
      );
    } catch {
      // Ignore localStorage write failures - non-critical
    }
  }, [STORAGE_KEY, search, sortBy, sortOrder, category, showSelectedOnly]);

  // Debounced search for API fetch
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  // Fetch products using React Query with productService
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProductsMigrated({
    search: debouncedSearch,
    limit: 50,
    sortBy,
    sortOrder,
    filters: {
      category: category || undefined,
      isActive: true,
    },
  });

  // Flatten the paginated data for compatibility
  const flattenedProductsData: Product[] = productsData?.pages?.flatMap(page => page.items) || [];

  // Quick lookup sets
  const selectedSet = useMemo(
    () => new Set(selectedProducts.map(p => p.productId)),
    [selectedProducts]
  );
  const selectedCategories = useMemo(
    () => new Set((selectedProducts || []).map(p => p.category)),
    [selectedProducts]
  );

  // Categories for filter using feature hook
  const { data: categoryData } = useProductCategories();

  // Displayed list supports "selected only"
  const productsMap = useMemo(
    () => new Map((flattenedProductsData || []).map(p => [p.id, p] as const)),
    [flattenedProductsData]
  );
  const displayedItems: Product[] = useMemo(() => {
    if (!showSelectedOnly) {
      const items = flattenedProductsData || [];
      if (!items.length) return items;
      const pinned = items.filter(p => selectedSet.has(p.id));
      const rest = items.filter(p => !selectedSet.has(p.id));
      return [...pinned, ...rest];
    }
    return (selectedProducts || []).map(
      sp =>
        (productsMap.get(sp.productId) as Product) ||
        ({
          id: sp.productId,
          name: sp.name,
          description: '',
          price: sp.unitPrice,
          currency: 'USD',
          sku: '',
          category: [sp.category || 'General'],
          tags: [],
          attributes: {},
          images: [],
          isActive: true,
          version: 1,
          usageAnalytics: {},
          userStoryMappings: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as Product)
    );
  }, [showSelectedOnly, selectedProducts, productsMap, flattenedProductsData, selectedSet]);

  // Handle product addition
  const handleAddProduct = useCallback(
    (productId: string) => {
      if (!flattenedProductsData || productsError) return;

      const product = flattenedProductsData.find(p => p.id === productId);
      if (product && !selectedProducts.find(p => p.productId === productId)) {
        const newProduct: ProposalProductData['products'][0] = {
          id: `temp-${Date.now()}`, // Temporary ID for UI
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.price || 0,
          total: product.price || 0,
          discount: 0,
          category: product.category[0] || 'General',
          configuration: {},
        };

        setSelectedProducts(prev => {
          // Deduplicate by productId to avoid double-add in strict mode or double events
          if (prev.some(p => p.productId === product.id)) {
            return prev;
          }
          const next = [...prev, newProduct];

          // Reduced logging for product addition
          if (process.env.NODE_ENV === 'development') {
            logDebug('ProductSelectionStep: Product added', {
              component: 'ProductSelectionStep',
              operation: 'handleAddProduct',
              productId: product.id,
              productName: product.name,
              updatedProductsCount: next.length,
            });
          }

          return next;
        });

        analytics(
          'product_added_to_proposal',
          {
            productId: product.id,
            productName: product.name,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          },
          'medium'
        );
      }
    },
    [flattenedProductsData, selectedProducts, analytics, productsError]
  );

  // Handle quantity change
  const handleQuantityChange = useCallback((productId: string, quantity: number) => {
    const q = Math.max(1, Number.isFinite(quantity) ? quantity : 1);
    setSelectedProducts(prev =>
      prev.map(product =>
        product.productId === productId
          ? { ...product, quantity: q, total: product.unitPrice * q }
          : product
      )
    );
  }, []);

  // Handle product removal
  const handleRemoveProduct = useCallback(
    (productId: string) => {
      setSelectedProducts(prev => prev.filter(p => p.productId !== productId));

      analytics(
        'product_removed_from_proposal',
        {
          productId,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        },
        'medium'
      );
    },
    [analytics]
  );

  // Calculate total
  const totalAmount = useMemo(() => {
    if (!selectedProducts || selectedProducts.length === 0) return 0;
    return selectedProducts.reduce((sum, product) => sum + (product.total || 0), 0);
  }, [selectedProducts]);

  // Track last saved state to prevent unnecessary saves
  const lastSavedDataRef = useRef<string>('');
  const pendingSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Persist current step data into the store and auto-save to database with proper debouncing
  useEffect(() => {
    const freshTotal = selectedProducts.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
    const stepData: ProposalProductData = {
      products: selectedProducts,
      totalValue: freshTotal,
    };

    // Update store immediately (local state)
    setStepData(4, stepData);

    // Only auto-save if we have a proposalId and actual changes
    if (proposalId && selectedProducts.length > 0) {
      const currentDataString = JSON.stringify({
        products: selectedProducts.map(p => ({
          productId: p.productId,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          total: p.total,
          discount: p.discount || 0,
        })),
        totalValue: freshTotal,
      });

      // Skip if no actual changes
      if (currentDataString === lastSavedDataRef.current) {
        return;
      }

      // Clear any pending save
      if (pendingSaveTimeoutRef.current) {
        clearTimeout(pendingSaveTimeoutRef.current);
      }

      const autoSaveData = {
        value: freshTotal,
        metadata: {
          productData: {
            products: selectedProducts.map(p => ({
              productId: p.productId,
              quantity: p.quantity,
              unitPrice: p.unitPrice,
              total: p.total,
              discount: p.discount || 0,
              category: p.category,
              configuration: p.configuration || {},
            })),
            totalValue: freshTotal,
          },
        },
      };

      // Reduced logging - only log in development and at info level
      if (process.env.NODE_ENV === 'development') {
        logDebug('ProductSelectionStep: Auto-save queued', {
          component: 'ProductSelectionStep',
          operation: 'autoSave_queued',
          proposalId,
          productsCount: selectedProducts.length,
          totalValue: freshTotal,
        });
      }

      // Increased debounce to 2 seconds to reduce server load
      pendingSaveTimeoutRef.current = setTimeout(() => {
        updateProposalMutation.mutate(
          { id: proposalId, proposal: autoSaveData as WizardProposalUpdateData },
          {
            onSuccess: () => {
              // Update last saved state only on success
              lastSavedDataRef.current = currentDataString;
              if (process.env.NODE_ENV === 'development') {
                logInfo('ProductSelectionStep: Auto-save successful', {
                  component: 'ProductSelectionStep',
                  operation: 'autoSave_success',
                  proposalId,
                  totalValue: freshTotal,
                });
              }
            },
            onError: error => {
              logError('ProductSelectionStep: Auto-save failed', {
                component: 'ProductSelectionStep',
                operation: 'autoSave_error',
                proposalId,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            },
          }
        );
        pendingSaveTimeoutRef.current = null;
      }, 2000); // Increased to 2 seconds

      return () => {
        if (pendingSaveTimeoutRef.current) {
          clearTimeout(pendingSaveTimeoutRef.current);
          pendingSaveTimeoutRef.current = null;
        }
      };
    }
  }, [selectedProducts, setStepData, proposalId, updateProposalMutation]);

  const handleNext = useCallback(() => {
    // Calculate fresh total to ensure accuracy
    const freshTotal = selectedProducts.reduce((sum, product) => {
      return sum + product.unitPrice * product.quantity;
    }, 0);

    const stepData: ProposalProductData = {
      products: selectedProducts,
      totalValue: freshTotal, // ✅ FIXED: Use freshly calculated total
    };

    // Reduced logging for step navigation
    if (process.env.NODE_ENV === 'development') {
      logDebug('ProductSelectionStep: Step data saved', {
        component: 'ProductSelectionStep',
        operation: 'handleNext',
        productsCount: selectedProducts.length,
        totalValue: freshTotal,
      });
    }

    // ✅ FIXED: Use proper store setStepData with step number (4 for ProductSelectionStep)
    setStepData(4, stepData);

    // Track analytics
    analytics('proposal_step_data_saved', {
      userStory: 'product_selection_completion',
      hypothesis: 'saving_product_data_enables_proposal_completion',
      metadata: {
        step: 'product_selection',
        productsSelected: selectedProducts.length,
        totalValue: freshTotal,
      },
    });

    analytics(
      'proposal_step_completed',
      {
        step: 4,
        stepName: 'Product Selection',
        productCount: selectedProducts.length,
        totalAmount: freshTotal,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      },
      'medium'
    );

    onNext();
  }, [analytics, onNext, selectedProducts, setStepData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Product Selection</h2>
        <p className="mt-2 text-gray-600">Choose products and services for your proposal</p>
      </div>

      {/* Search & Sort */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Products</label>
            <Input
              {...register('search')}
              value={search}
              onChange={e => setValue('search', e.target.value)}
              placeholder="Search by name, SKU, or description..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              {...register('category')}
              className="border rounded px-3 py-2 text-sm w-full"
              value={category}
              onChange={e => setValue('category', e.target.value)}
            >
              <option value="">All categories</option>
              {(categoryData?.categories || []).map(c => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <Controller
              name="sortBy"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="border rounded px-3 py-2 text-sm w-full"
                  value={`${sortBy}:${sortOrder}`}
                  onChange={e => {
                    const [sb, so] = e.target.value.split(':') as [typeof sortBy, typeof sortOrder];
                    setValue('sortBy', sb);
                    setValue('sortOrder', so);
                  }}
                >
                  <option value="name:asc">Name (A→Z)</option>
                  <option value="name:desc">Name (Z→A)</option>
                  <option value="price:asc">Price (Low→High)</option>
                  <option value="price:desc">Price (High→Low)</option>
                  <option value="createdAt:desc">Newest</option>
                  <option value="createdAt:asc">Oldest</option>
                </select>
              )}
            />
          </div>
          <div className="flex items-center gap-2">
            <Controller
              name="showSelectedOnly"
              control={control}
              render={({ field: { value, ...field } }) => (
                <input
                  {...field}
                  id="show-selected-only"
                  type="checkbox"
                  className="accent-blue-600"
                  checked={showSelectedOnly}
                  onChange={e => setValue('showSelectedOnly', e.target.checked)}
                />
              )}
            />
            <label htmlFor="show-selected-only" className="text-sm text-gray-700">
              Show selected only
            </label>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {productsLoading && (
        <div className="text-center py-4">
          <p className="text-gray-500">Loading products...</p>
        </div>
      )}

      {/* Error State */}
      {productsError && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-sm text-red-800">
            <h4 className="font-medium mb-2">Error loading products:</h4>
            <p>{(productsError as Error).message}</p>
          </div>
        </Card>
      )}
      {/* Catalog with quick add / steppers */}
      <Card className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Catalog</h3>
        {!displayedItems || displayedItems.length === 0 ? (
          <p className="text-gray-500 py-6 text-center">
            No products found. Try a different filter.
          </p>
        ) : (
          <div className="divide-y">
            {displayedItems.map(p => {
              const isSelected = selectedSet.has(p.id);
              const compat =
                selectedCategories.size === 0 || p.category.some(c => selectedCategories.has(c))
                  ? 'compatible'
                  : 'check';
              const sp = selectedProducts.find(sp => sp.productId === p.id);
              return (
                <div key={p.id} className="py-3 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 truncate">{p.name}</h4>
                      {p.sku ? <span className="text-xs text-gray-500">{p.sku}</span> : null}
                      {isSelected && (
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          Selected
                        </span>
                      )}
                      <Tooltip
                        content={
                          compat === 'compatible'
                            ? 'Likely compatible with current selection'
                            : 'Compatibility not verified (non-blocking)'
                        }
                      >
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${compat === 'compatible' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {compat === 'compatible' ? 'Compatible' : 'Check'}
                        </span>
                      </Tooltip>
                    </div>
                    <div className="text-sm text-gray-600 mt-0.5">
                      {(p.category || []).join(', ')}
                    </div>
                    <div className="text-sm text-gray-900 mt-1">
                      ${(p.price ?? 0).toFixed(2)} per unit
                    </div>
                  </div>
                  {!isSelected ? (
                    <div className="shrink-0">
                      <Button size="sm" onClick={() => handleAddProduct(p.id)}>
                        Add
                      </Button>
                    </div>
                  ) : (
                    <div className="shrink-0 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(p.id, (sp?.quantity || 1) - 1)}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={sp?.quantity || 1}
                        onChange={e => handleQuantityChange(p.id, parseInt(e.target.value) || 1)}
                        className="w-16 text-center"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(p.id, (sp?.quantity || 1) + 1)}
                      >
                        +
                      </Button>
                      <div className="ml-3 text-sm font-medium text-gray-900">
                        ${((sp?.unitPrice || 0) * (sp?.quantity || 1)).toFixed(2)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2 text-red-600"
                        onClick={() => handleRemoveProduct(p.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Sticky totals bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-700">
            <span className="font-medium">{selectedProducts.length}</span> product
            {selectedProducts.length !== 1 ? 's' : ''} selected
          </div>
          <div className="text-lg font-semibold text-gray-900">
            Total: ${(totalAmount || 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Previous
        </Button>
        <Button onClick={handleNext} disabled={!selectedProducts || selectedProducts.length === 0}>
          Next Step
        </Button>
      </div>
    </div>
  );
});

ProductSelectionStep.displayName = 'ProductSelectionStep';
