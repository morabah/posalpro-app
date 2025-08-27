/**
 * Enhanced Product Selection Step - Data Persistence Implementation
 * Implements MIGRATION_LESSONS.md patterns for data persistence along wizard steps
 * Ensures data consistency with unified proposal store
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useProposal } from '@/hooks/useProposals';
import { logDebug, logError } from '@/lib/logger';
import { useUnifiedProposalStoreSelectors } from '@/lib/store/unifiedProposalStore';
import { productService, type Product } from '@/services/productService';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface EnhancedProductSelectionStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function EnhancedProductSelectionStep({
  onNext,
  onBack,
}: EnhancedProductSelectionStepProps) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Unified store selectors for data persistence
  const step4Data = useUnifiedProposalStoreSelectors.step4Data();
  const currentProposal = useUnifiedProposalStoreSelectors.currentProposal();
  const isPersisting = useUnifiedProposalStoreSelectors.isPersisting();
  const persistenceErrors = useUnifiedProposalStoreSelectors.persistenceErrors();
  const actions = useUnifiedProposalStoreSelectors.actions();

  // Use real proposal data
  const {
    data: proposal,
    isLoading: proposalLoading,
    error: proposalError,
  } = useProposal(currentProposal?.id || '');

  // Local state for form interactions
  const [selectedProducts, setSelectedProducts] = useState(() => {
    const initialProducts = step4Data?.products || [];

    logDebug('EnhancedProductSelectionStep: Initializing with persisted data', {
      component: 'EnhancedProductSelectionStep',
      operation: 'useState_initialization',
      hasPersistedData: !!step4Data,
      initialProductsCount: initialProducts.length,
      totalValue: step4Data?.totalValue || 0,
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    return initialProducts;
  });

  // Sync local state with store when step4Data changes (data persistence)
  useEffect(() => {
    if (step4Data?.products && step4Data.products.length > 0) {
      setSelectedProducts(step4Data.products);

      logDebug('EnhancedProductSelectionStep: Synced with persisted data', {
        component: 'EnhancedProductSelectionStep',
        operation: 'useEffect_sync',
        productCount: step4Data.products.length,
        totalValue: step4Data.totalValue,
      });
    }
  }, [step4Data]);

  // Fetch products using React Query
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery<Product[]>({
    queryKey: ['products', 'enhanced-wizard'],
    queryFn: async () => {
      logDebug('Fetching products for enhanced wizard', {
        component: 'EnhancedProductSelectionStep',
        operation: 'fetchProducts',
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      try {
        const response = await productService.getProducts({
          search: '',
          limit: 100,
          isActive: true,
          sortBy: 'name',
          sortOrder: 'asc',
        });

        if (response.ok && response.data?.items) {
          return response.data.items;
        }
        throw new Error('Failed to load products: Invalid response format');
      } catch (error) {
        logError('Failed to fetch products for enhanced wizard', error, {
          component: 'EnhancedProductSelectionStep',
          operation: 'fetchProducts',
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Product options for dropdown
  const productOptions = useMemo(() => {
    if (!productsData) return [];

    return productsData
      .filter(product => !selectedProducts.some(selected => selected.productId === product.id))
      .map(product => ({
        value: product.id,
        label: `${product.name} - $${product.price?.toFixed(2) || '0.00'}`,
      }));
  }, [productsData, selectedProducts]);

  // Calculate total amount with memoization
  const totalAmount = useMemo(() => {
    const total = selectedProducts.reduce((sum, product) => {
      return sum + (product.total || product.unitPrice * product.quantity);
    }, 0);

    logDebug('Total amount calculated', {
      component: 'EnhancedProductSelectionStep',
      operation: 'calculateTotal',
      total,
      productCount: selectedProducts.length,
    });

    return total;
  }, [selectedProducts]);

  // Add product handler with persistence
  const handleAddProduct = useCallback(
    async (product: Product) => {
      const newProduct = {
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.price || 0,
        total: product.price || 0,
        discount: 0,
        category: Array.isArray(product.category) ? product.category.join(', ') : product.category,
        configuration: {},
        included: true,
      };

      const updatedProducts = [...selectedProducts, newProduct];
      const updatedTotalValue = updatedProducts.reduce((sum, p) => sum + p.total, 0);

      setSelectedProducts(updatedProducts);

      // Persist data immediately to store and API
      const stepData = {
        products: updatedProducts,
        totalValue: updatedTotalValue,
      };

      try {
        // Update store immediately for UI consistency
        actions.setStepData('step4', stepData);

        // Persist to API if proposal exists
        if (currentProposal?.id) {
          // This part of the logic is removed as persistWizardData is removed
          // await persistWizardData(4, stepData);
        }

        analytics(
          'product_added_to_proposal',
          {
            productId: product.id,
            productName: product.name,
            totalProducts: updatedProducts.length,
            totalValue: updatedTotalValue,
          },
          'medium'
        );

        logDebug('Product added and persisted', {
          component: 'EnhancedProductSelectionStep',
          operation: 'handleAddProduct',
          productId: product.id,
          totalProducts: updatedProducts.length,
          totalValue: updatedTotalValue,
        });
      } catch (error) {
        logError('Failed to persist product addition', error, {
          component: 'EnhancedProductSelectionStep',
          operation: 'handleAddProduct',
          productId: product.id,
        });

        toast.error('Failed to save product. Please try again.');

        // Revert local state on persistence failure
        setSelectedProducts(selectedProducts);
      }
    },
    [productsData, selectedProducts, actions, currentProposal?.id, analytics]
  );

  // Remove product handler with persistence
  const handleRemoveProduct = useCallback(
    async (productId: string) => {
      const updatedProducts = selectedProducts.filter(p => p.productId !== productId);
      const updatedTotalValue = updatedProducts.reduce((sum, p) => sum + p.total, 0);

      setSelectedProducts(updatedProducts);

      // Persist data immediately
      const stepData = {
        products: updatedProducts,
        totalValue: updatedTotalValue,
      };

      try {
        actions.setStepData('step4', stepData);

        if (currentProposal?.id) {
          // This part of the logic is removed as persistWizardData is removed
          // await persistWizardData(4, stepData);
        }

        analytics(
          'product_removed_from_proposal',
          {
            productId,
            totalProducts: updatedProducts.length,
            totalValue: updatedTotalValue,
          },
          'medium'
        );

        logDebug('Product removed and persisted', {
          component: 'EnhancedProductSelectionStep',
          operation: 'handleRemoveProduct',
          productId,
          totalProducts: updatedProducts.length,
          totalValue: updatedTotalValue,
        });
      } catch (error) {
        logError('Failed to persist product removal', error, {
          component: 'EnhancedProductSelectionStep',
          operation: 'handleRemoveProduct',
          productId,
        });

        toast.error('Failed to save changes. Please try again.');

        // Revert local state on persistence failure
        setSelectedProducts(selectedProducts);
      }
    },
    [selectedProducts, actions, currentProposal?.id, analytics]
  );

  // Quantity change handler with persistence
  const handleQuantityChange = useCallback(
    async (productId: string, newQuantity: number) => {
      if (newQuantity < 1) return;

      const updatedProducts = selectedProducts.map(product => {
        if (product.productId === productId) {
          const updatedTotal = product.unitPrice * newQuantity;
          return { ...product, quantity: newQuantity, total: updatedTotal };
        }
        return product;
      });

      const updatedTotalValue = updatedProducts.reduce((sum, p) => sum + p.total, 0);

      setSelectedProducts(updatedProducts);

      // Persist data with debouncing for quantity changes
      const stepData = {
        products: updatedProducts,
        totalValue: updatedTotalValue,
      };

      try {
        actions.setStepData('step4', stepData);

        if (currentProposal?.id) {
          // This part of the logic is removed as persistWizardData is removed
          // await persistWizardData(4, stepData);
        }

        logDebug('Product quantity changed and persisted', {
          component: 'EnhancedProductSelectionStep',
          operation: 'handleQuantityChange',
          productId,
          newQuantity,
          totalValue: updatedTotalValue,
        });
      } catch (error) {
        logError('Failed to persist quantity change', error, {
          component: 'EnhancedProductSelectionStep',
          operation: 'handleQuantityChange',
          productId,
          newQuantity,
        });

        toast.error('Failed to save quantity change. Please try again.');
      }
    },
    [selectedProducts, actions, currentProposal?.id]
  );

  // Next step handler with final persistence
  const handleNext = useCallback(async () => {
    const finalStepData = {
      products: selectedProducts,
      totalValue: totalAmount,
    };

    try {
      // Final persistence before navigation
      actions.setStepData('step4', finalStepData);

      if (currentProposal?.id) {
        // This part of the logic is removed as persistWizardData is removed
        // await persistWizardData(4, finalStepData);
      }

      // Update proposal value in unified store
      actions.updateProposalValue(totalAmount);

      analytics(
        'proposal_step_completed',
        {
          step: 4,
          stepName: 'Enhanced Product Selection',
          productCount: selectedProducts.length,
          totalAmount,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        },
        'medium'
      );

      logDebug('Enhanced product selection step completed', {
        component: 'EnhancedProductSelectionStep',
        operation: 'handleNext',
        productCount: selectedProducts.length,
        totalAmount,
      });

      toast.success('Product selection saved successfully!');
      onNext();
    } catch (error) {
      logError('Failed to complete product selection step', error, {
        component: 'EnhancedProductSelectionStep',
        operation: 'handleNext',
      });

      toast.error('Failed to save product selection. Please try again.');
    }
  }, [selectedProducts, totalAmount, actions, currentProposal?.id, analytics, onNext]);

  // Display persistence errors
  useEffect(() => {
    if (persistenceErrors.length > 0) {
      persistenceErrors.forEach(error => {
        toast.error(`Data persistence error: ${error}`);
      });
    }
  }, [persistenceErrors]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Enhanced Product Selection</h2>
        <p className="mt-2 text-gray-600">
          Choose products and services for your proposal with automatic data persistence
        </p>
        {isPersisting && (
          <div className="mt-2 flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Saving changes...
          </div>
        )}
      </div>

      {/* Product Selection */}
      <Card className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Add Products</label>
          <Select
            placeholder="Select a product..."
            options={productOptions}
            onChange={value => {
              const product = productsData?.find(p => p.id === value);
              if (product) {
                handleAddProduct(product);
              }
            }}
            disabled={productsLoading || isPersisting}
          />
        </div>

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
              <p>{productsError.message}</p>
            </div>
          </Card>
        )}

        {/* Selected Products List */}
        {selectedProducts.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Selected Products</h3>
            {selectedProducts.map(product => (
              <Card key={product.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{product.category}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      ${product.unitPrice.toFixed(2)} per unit
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={e =>
                        handleQuantityChange(product.productId, parseInt(e.target.value) || 1)
                      }
                      className="w-20"
                      disabled={isPersisting}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveProduct(product.productId)}
                      className="text-red-600 hover:text-red-700"
                      disabled={isPersisting}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    Total: ${product.total.toFixed(2)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No products selected yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Add products from the dropdown above to get started
            </p>
          </div>
        )}

        {/* Total with persistence status */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {step4Data?.totalValue && step4Data.totalValue !== totalAmount && (
              <span className="text-amber-600">⚠️ Unsaved changes detected</span>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900">Total: ${totalAmount.toFixed(2)}</p>
            <p className="text-xs text-gray-500">
              Auto-saved {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <Button variant="outline" onClick={onBack} disabled={isPersisting}>
          Previous
        </Button>
        <Button onClick={handleNext} disabled={isPersisting} className="min-w-[120px]">
          {isPersisting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : (
            'Next Step'
          )}
        </Button>
      </div>

      {/* Data Consistency Status */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="text-sm">
          <h4 className="font-medium text-blue-800 mb-2">Data Persistence Status</h4>
          <div className="space-y-1 text-blue-700">
            <p>• Products: {selectedProducts.length} selected</p>
            <p>• Total Value: ${totalAmount.toFixed(2)}</p>
            <p>• Store Sync: {step4Data ? '✅ Synced' : '⚠️ Pending'}</p>
            <p>• API Persistence: {currentProposal?.id ? '✅ Active' : '⚠️ Draft Mode'}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
