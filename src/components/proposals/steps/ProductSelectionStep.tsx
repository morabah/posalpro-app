'use client';

/**
 * PosalPro MVP2 - Modern Product Selection Step
 * Built from scratch using React Query and modern patterns
 * Follows PROPOSAL_MIGRATION_ASSESSMENT.md guidelines
 */

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useProposalSetStepData } from '@/lib/store/proposalStore';
import { productService, type Product } from '@/services/productService';
import { useQuery } from '@tanstack/react-query';
import { logDebug, logError } from '@/lib/logger';
import { useCallback, useMemo, useState } from 'react';
import { type ProposalProductData } from '@/lib/store/proposalStore';

interface ProductSelectionStepProps {
  data?: ProposalProductData;
  onNext: () => void;
  onBack: () => void;
  onUpdate?: (data: ProposalProductData) => void;
}

export function ProductSelectionStep({
  data,
  onNext,
  onBack,
  onUpdate,
}: ProductSelectionStepProps) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const setStepData = useProposalSetStepData();

  // Local state for form data
  const [selectedProducts, setSelectedProducts] = useState<ProposalProductData['products']>(() => {
    const initialProducts = data?.products || [];
    
    // ✅ ADDED: Debug logging to track initial product data
    logDebug('ProductSelectionStep: Initializing with existing data', {
      component: 'ProductSelectionStep',
      operation: 'useState_initialization',
      hasData: !!data,
      initialProductsCount: initialProducts.length,
      initialProducts: initialProducts.map(p => ({
        id: p.id,
        productId: p.productId,
        name: p.name,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        total: p.total,
      })),
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });
    
    return initialProducts;
  });

  // Fetch products using React Query with productService
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery<Product[]>({
    queryKey: ['products', 'proposal-wizard'],
    queryFn: async () => {
      logDebug('Fetching products for proposal wizard', {
        component: 'ProductSelectionStep',
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
          logDebug('Products loaded successfully for proposal wizard', {
            component: 'ProductSelectionStep',
            operation: 'fetchProducts',
            count: response.data.items.length,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          });
          return response.data.items;
        }
        throw new Error('Failed to load products: Invalid response format');
      } catch (error) {
        logError('Failed to fetch products for proposal wizard', {
          component: 'ProductSelectionStep',
          operation: 'fetchProducts',
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });
        throw error;
      }
    },
    staleTime: 30000, // 30 seconds - shorter for better responsiveness
    gcTime: 120000, // 2 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Product options for select dropdown
  const productOptions = useMemo(() => {
    if (!productsData || productsError) return [];
    return productsData.map(product => ({
      value: product.id,
      label: `${product.name} - ${product.sku}`,
    }));
  }, [productsData, productsError]);

  // Handle product addition
  const handleAddProduct = useCallback(
    (productId: string) => {
      if (!productsData || productsError) return;
      
      const product = productsData.find(p => p.id === productId);
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
          const updated = [...prev, newProduct];
          
          // ✅ ADDED: Debug logging to track product addition
          logDebug('ProductSelectionStep: Product added', {
            component: 'ProductSelectionStep',
            operation: 'handleAddProduct',
            productId: product.id,
            productName: product.name,
            newProduct,
            updatedProductsCount: updated.length,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          });
          
          return updated;
        });

        analytics('product_added_to_proposal', {
          productId: product.id,
          productName: product.name,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        }, 'medium');
      }
    },
    [productsData, selectedProducts, analytics, productsError]
  );

  // Handle quantity change
  const handleQuantityChange = useCallback((productId: string, quantity: number) => {
    setSelectedProducts(prev =>
      prev.map(product =>
        product.productId === productId
          ? { ...product, quantity, total: product.unitPrice * quantity }
          : product
      )
    );
  }, []);

  // Handle product removal
  const handleRemoveProduct = useCallback(
    (productId: string) => {
      setSelectedProducts(prev => prev.filter(p => p.productId !== productId));

      analytics('product_removed_from_proposal', {
        productId,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      }, 'medium');
    },
    [analytics]
  );

  // Calculate total
  const totalAmount = useMemo(() => {
    if (!selectedProducts || selectedProducts.length === 0) return 0;
    return selectedProducts.reduce((sum, product) => sum + (product.total || 0), 0);
  }, [selectedProducts]);

  const handleNext = useCallback(() => {
    // Calculate fresh total to ensure accuracy
    const freshTotal = selectedProducts.reduce((sum, product) => {
      return sum + (product.unitPrice * product.quantity);
    }, 0);

    const stepData: ProposalProductData = {
      products: selectedProducts,
      totalValue: freshTotal, // ✅ FIXED: Use freshly calculated total
    };

    // ✅ ADDED: Debug logging to track step data saving
    logDebug('ProductSelectionStep: Saving step data', {
      component: 'ProductSelectionStep',
      operation: 'handleNext',
      stepData,
      productsCount: selectedProducts.length,
      totalValue: freshTotal,
      selectedProducts: selectedProducts.map(p => ({ 
        id: p.id, 
        name: p.name, 
        unitPrice: p.unitPrice, 
        quantity: p.quantity 
      }))
    });

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

    analytics('proposal_step_completed', {
      step: 4,
      stepName: 'Product Selection',
      productCount: selectedProducts.length,
      totalAmount: freshTotal,
      userStory: 'US-3.1',
      hypothesis: 'H4',
    }, 'medium');

    onNext();
  }, [analytics, onNext, selectedProducts, setStepData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Product Selection</h2>
        <p className="mt-2 text-gray-600">Choose products and services for your proposal</p>
      </div>

      {/* Product Selection */}
      <Card className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Add Products</label>
          <Select
            placeholder="Select a product..."
            options={productOptions}
            onChange={value => handleAddProduct(value as string)}
            disabled={productsLoading}
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
        {selectedProducts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Selected Products</h3>
            {!selectedProducts || selectedProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No products selected</p>
            ) : (
              selectedProducts.map((product) => (
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
                        onChange={e => handleQuantityChange(product.productId, parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveProduct(product.productId)}
                        className="text-red-600 hover:text-red-700"
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
              ))
            )}
          </div>
        )}

        {/* Total */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900">
              Total: ${(totalAmount || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </Card>

      <div className="flex justify-between pt-6 border-t border-gray-200">
        <Button variant="outline" onClick={onBack}>
          Previous
        </Button>
        <Button onClick={handleNext} disabled={!selectedProducts || selectedProducts.length === 0}>
          Next Step
        </Button>
      </div>
    </div>
  );
}
