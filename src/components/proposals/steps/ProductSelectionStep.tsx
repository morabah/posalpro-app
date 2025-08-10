'use client';

/**
 * PosalPro MVP2 - Proposal Creation Step 4: Product Selection
 * Enhanced with direct data flow from product pages, cross-step validation, and advanced analytics
 * Based on PRODUCT_SELECTION_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H1 & H8 hypothesis validation
 */

import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ProposalWizardStep4Data } from '@/types/proposals';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle, Info, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-2.2', 'US-8.1'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.3', 'AC-2.2.1', 'AC-2.2.2', 'AC-8.1.1'],
  methods: [
    'loadProducts()',
    'filterProducts()',
    'selectProduct()',
    'validateSelection()',
    'calculateTotal()',
    'updateFormData()',
  ],
  hypotheses: ['H7', 'H4', 'H9', 'H10'],
  testCases: ['TC-H7-001', 'TC-H4-001', 'TC-H9-001', 'TC-H10-001'],
};

// Enhanced Product interface aligned with database schema
interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  currency: string;
  category: string[];
  tags: string[];
  attributes?: Record<string, unknown> | null;
  images: string[];
  isActive: boolean;
  version: number;
  usageAnalytics?: Record<string, unknown> | null;
  userStoryMappings: string[];
  createdAt: string;
  updatedAt: string;
}

// Enhanced Selected product interface with validation
interface SelectedProduct {
  id: string;
  name: string;
  productId: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  priceModel: string;
  configuration: Record<string, unknown>;
  customizations: string[];
  notes?: string;
  validationErrors?: string[];
  crossStepWarnings?: string[];
}

// Enhanced validation schema with cross-step validation
const enhancedProductSelectionSchema = z.object({
  selectedProducts: z
    .array(
      z.object({
        id: z.string().min(1, 'Product ID is required'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
        customizations: z.array(z.string()).optional(),
        notes: z.string().optional(),
      })
    )
    .min(1, 'At least one product must be selected'),
  totalValue: z.number().min(0, 'Total value must be non-negative'),
  crossStepValidation: z
    .object({
      teamCompatibility: z.boolean().default(true),
      contentAlignment: z.boolean().default(true),
      budgetCompliance: z.boolean().default(true),
      timelineRealistic: z.boolean().default(true),
    })
    .optional(),
  searchQuery: z.string().optional(),
  selectedCategory: z.string().optional(),
});

type EnhancedProductSelectionFormData = z.infer<typeof enhancedProductSelectionSchema>;

interface ProductSelectionStepProps {
  data: Partial<ProposalWizardStep4Data>;
  onUpdate: (data: Partial<ProposalWizardStep4Data>) => void;
  analytics: {
    trackWizardStep?: (
      stepNumber: number,
      stepName: string,
      action: string,
      metadata: Record<string, unknown>
    ) => void;
  };
  // Cross-step data for validation
  proposalMetadata?: { projectType?: string; budget?: number };
  teamData?: { teamMembers?: Array<{ id?: string; name?: string; expertise?: string }> };
  contentData?: { selectedContent?: unknown[] };
}

export function ProductSelectionStep({
  data,
  onUpdate,
  analytics,
  proposalMetadata,
  teamData,
  contentData,
}: ProductSelectionStepProps) {
  const apiClient = useApiClient();
  const { handleAsyncError } = useErrorHandler();

  // State for real products from database
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Map<string, SelectedProduct>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [crossStepValidationResults, setCrossStepValidationResults] = useState<{
    errors: string[];
    warnings: string[];
  }>({ errors: [], warnings: [] });

  // DEBUG: Log incoming props and selection size
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ProductSelectionStep][DEBUG] props.data.products:', Array.isArray(data.products) ? data.products.length : 0);
    }
  }, [data.products]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ProductSelectionStep][DEBUG] selectedProducts size:', selectedProducts.size, 'ids:', Array.from(selectedProducts.keys()));
    }
  }, [selectedProducts]);

  // Mobile detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Initialize form schema (values not directly read here; validation is handled on submit paths)
  useForm<EnhancedProductSelectionFormData>({
    resolver: zodResolver(enhancedProductSelectionSchema),
    defaultValues: {
      selectedProducts:
        data.products?.map(product => ({
          id: product.id,
          quantity: product.quantity || 1,
          customizations: product.customizations || [],
          notes: product.notes || '',
        })) || [],
      totalValue: data.totalValue || 0,
      searchQuery: '',
      selectedCategory: 'All',
    },
    // ✅ CRITICAL FIX: Mobile-optimized validation mode
    mode: isMobile ? 'onBlur' : 'onChange',
    reValidateMode: 'onBlur',
    criteriaMode: 'firstError',
  });

  // ✅ PERFORMANCE OPTIMIZATION: Manual form data collection instead of watch()
  const collectFormData = useCallback((): ProposalWizardStep4Data => {
    const selectedProductsArray = Array.from(selectedProducts.values());
    const totalValue = selectedProductsArray.reduce((sum, product) => sum + product.totalPrice, 0);

    return {
      products: selectedProductsArray.map(product => ({
        id: product.id,
        name: product.name,
        included: true,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
        totalPrice: product.totalPrice,
        category: product.category,
        configuration: product.configuration,
        customizations: product.customizations,
        notes: product.notes,
      })),
      totalValue,
      aiRecommendationsUsed: 0, // Would track actual usage
      searchHistory: data.searchHistory || [],
      crossStepValidation: {
        teamCompatibility: crossStepValidationResults.errors.length === 0,
        contentAlignment: true, // Would be calculated
        budgetCompliance: true, // Would be calculated
        timelineRealistic: true, // Would be calculated
      },
    };
  }, [selectedProducts, crossStepValidationResults, data.searchHistory]);

  // Load products from database
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<{
        success: boolean;
        data: {
          products: Product[];
          total: number;
          page: number;
          limit: number;
        };
      }>('/api/products?page=1&limit=100&isActive=true');

      if (response.success) {
        setProducts(response.data.products);
        setFilteredProducts(response.data.products);
        if (process.env.NODE_ENV === 'development') {
          console.log('[ProductSelectionStep][DEBUG] loaded products count:', response.data.products.length);
        }
      } else {
        throw new Error('Failed to load products');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load products';
      setError(errorMessage);
      console.error('[ProductSelectionStep] Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Initialize selected products from props (hydrate prices) once
  const initializedFromDataRef = useRef(false);

  // Helper to resolve the source product ID from props (supports {id} or {productId})
  const resolveSourceId = useCallback((p: any): string | undefined => {
    return (p && (p.id || p.productId)) || undefined;
  }, []);

  const buildSelectedProduct = useCallback(
    (p: any): SelectedProduct | null => {
      const sourceId = resolveSourceId(p);
      if (!sourceId) return null;
      const dbProduct = products.find(dp => dp.id === sourceId);
      const unitPrice = p.unitPrice || dbProduct?.price || 0;
      const quantity = p.quantity || 1;
      const name = p.name || dbProduct?.name || 'Unknown Product';
      const category = p.category || dbProduct?.category?.[0] || 'General';
      return {
        id: sourceId,
        name,
        productId: dbProduct?.id || sourceId,
        category,
        quantity,
        unitPrice,
        totalPrice: p.totalPrice || unitPrice * quantity,
        priceModel: 'FIXED',
        configuration: p.configuration || {},
        customizations: p.customizations || [],
        notes: p.notes,
      };
    },
    [products, resolveSourceId]
  );

  useEffect(() => {
    if (initializedFromDataRef.current) return;
    if (data.products && data.products.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[ProductSelectionStep][DEBUG] initial hydration from props, count:', data.products.length);
      }
      const productsMap = new Map<string, SelectedProduct>();
      data.products.forEach(product => {
        const sp = buildSelectedProduct(product);
        if (sp) productsMap.set(sp.id, sp);
      });
      if (process.env.NODE_ENV === 'development') {
        console.log('[ProductSelectionStep][DEBUG] hydration map size:', productsMap.size);
      }
      setSelectedProducts(productsMap);
      initializedFromDataRef.current = true;
    }
  }, [data.products, products, buildSelectedProduct]);

  // Backfill any missing items if props contain more products than the current map
  useEffect(() => {
    if (!data.products || data.products.length === 0) return;
    const existingIds = new Set(Array.from(selectedProducts.keys()));
    const missing = data.products.filter(p => {
      const sid = resolveSourceId(p);
      return sid ? !existingIds.has(sid) : false;
    });
    if (process.env.NODE_ENV === 'development') {
      console.log(
        '[ProductSelectionStep][DEBUG] backfill check: props=',
        data.products.length,
        'map=',
        selectedProducts.size,
        'missing=',
        missing.map(m => resolveSourceId(m))
      );
    }
    if (missing.length === 0) return;

    const newMap = new Map(selectedProducts);
    missing.forEach(product => {
      const sp = buildSelectedProduct(product);
      if (sp) newMap.set(sp.id, sp);
    });
    if (process.env.NODE_ENV === 'development') {
      console.log('[ProductSelectionStep][DEBUG] backfill applied, new map size:', newMap.size);
    }
    setSelectedProducts(newMap);
  }, [data.products, selectedProducts, products, resolveSourceId, buildSelectedProduct]);

  // Enhanced analytics tracking with cross-step context
  const trackProductSelection = useCallback(
    (action: string, productId: string, metadata: Record<string, unknown> = {}) => {
      const enhancedMetadata = {
        ...metadata,
        stepContext: 'product_selection',
        proposalType: proposalMetadata?.projectType,
        teamSize: teamData?.teamMembers?.length || 0,
        contentSections: contentData?.selectedContent?.length || 0,
        totalSelectedProducts: selectedProducts.size,
        sessionDuration: Date.now() - Date.now(), // Would be tracked properly
        crossStepValidationStatus:
          crossStepValidationResults.errors.length === 0 ? 'valid' : 'invalid',
      };

      analytics?.trackWizardStep?.(4, 'Product Selection', action, {
        productId,
        ...enhancedMetadata,
        component: 'ProductSelectionStep',
        traceability: COMPONENT_MAPPING,
      });
    },
    [
      selectedProducts,
      proposalMetadata,
      teamData,
      contentData,
      crossStepValidationResults,
      analytics,
    ]
  );

  // Filter products based on search and category
  const filterProducts = useCallback(() => {
    let filtered = products.filter(product => product.isActive);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query) ||
          product.category.some(cat => cat.toLowerCase().includes(query)) ||
          product.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category.includes(selectedCategory));
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory]);

  // Update filters when dependencies change
  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  // Get unique categories from products
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    products.forEach(product => {
      product.category.forEach(cat => categorySet.add(cat));
    });
    return ['All', ...Array.from(categorySet).sort()];
  }, [products]);

  // Handle product selection
  const handleProductSelect = useCallback(
    (product: Product) => {
      const existingProduct = selectedProducts.get(product.id);

      if (existingProduct) {
        // Update existing product
        const updatedProduct = {
          ...existingProduct,
          quantity: existingProduct.quantity + 1,
          totalPrice: (existingProduct.quantity + 1) * existingProduct.unitPrice,
        };

        setSelectedProducts(prev => new Map(prev.set(product.id, updatedProduct)));
        if (process.env.NODE_ENV === 'development') {
          console.log('[ProductSelectionStep][DEBUG] increment quantity for', product.id, 'map size:', selectedProducts.size);
        }
      } else {
        // Add new product
        const newProduct: SelectedProduct = {
          id: product.id,
          name: product.name,
          productId: product.id,
          category: product.category[0] || 'General',
          quantity: 1,
          unitPrice: product.price,
          totalPrice: product.price,
          priceModel: 'FIXED',
          configuration: {},
          customizations: [],
          notes: '',
        };

        setSelectedProducts(prev => new Map(prev.set(product.id, newProduct)));
        if (process.env.NODE_ENV === 'development') {
          console.log('[ProductSelectionStep][DEBUG] add new product', product.id, 'map size:', selectedProducts.size + 1);
        }
      }

      trackProductSelection('product_selected', product.id, {
        productName: product.name,
        productCategory: product.category[0],
        productPrice: product.price,
      });
    },
    [selectedProducts, trackProductSelection]
  );

  // Handle product removal
  const handleProductRemove = useCallback(
    (productId: string) => {
      const product = selectedProducts.get(productId);
      if (product) {
        trackProductSelection('product_removed', productId, {
          productName: product.name,
          productCategory: product.category,
        });
      }

      setSelectedProducts(prev => {
        const newMap = new Map(prev);
        newMap.delete(productId);
        return newMap;
      });
    },
    [selectedProducts, trackProductSelection]
  );

  // Handle quantity change
  const handleQuantityChange = useCallback(
    (productId: string, newQuantity: number) => {
      const product = selectedProducts.get(productId);
      if (product && newQuantity > 0) {
        const updatedProduct = {
          ...product,
          quantity: newQuantity,
          totalPrice: newQuantity * product.unitPrice,
        };

        setSelectedProducts(prev => new Map(prev.set(productId, updatedProduct)));

        trackProductSelection('quantity_changed', productId, {
          oldQuantity: product.quantity,
          newQuantity,
          productName: product.name,
        });
      }
    },
    [selectedProducts, trackProductSelection]
  );

  // Update form data when selections change
  useEffect(() => {
    const formData = collectFormData();
    onUpdate(formData);
    if (process.env.NODE_ENV === 'development') {
      console.log('[ProductSelectionStep][DEBUG] onUpdate sent products:', formData.products.length);
    }
  }, [collectFormData, onUpdate]);

  // Cross-step validation
  useEffect(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate team compatibility
    if (teamData?.teamMembers) {
        const hasTechnicalExpert = teamData.teamMembers.some(
          (member: { expertise?: string }) => member.expertise === 'Technical'
        );

      if (!hasTechnicalExpert && selectedProducts.size > 0) {
        warnings.push('Consider adding a technical expert to the team for complex products');
      }
    }

    // Validate budget compliance
    const totalValue = Array.from(selectedProducts.values()).reduce(
      (sum, product) => sum + product.totalPrice,
      0
    );

    if (proposalMetadata?.budget && totalValue > proposalMetadata.budget) {
      errors.push(
        `Total value ($${totalValue.toLocaleString()}) exceeds budget ($${proposalMetadata.budget.toLocaleString()})`
      );
    }

    setCrossStepValidationResults({ errors, warnings });
  }, [selectedProducts, teamData, proposalMetadata]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (formData: EnhancedProductSelectionFormData) => {
      try {
        if (crossStepValidationResults.errors.length > 0) {
          throw new Error(`Validation errors: ${crossStepValidationResults.errors.join(', ')}`);
        }

        const stepData = collectFormData();
        onUpdate(stepData);

        trackProductSelection('step_completed', 'step_4', {
          totalProducts: selectedProducts.size,
          totalValue: stepData.totalValue,
          validationStatus: 'valid',
        });

        return true;
      } catch (error) {
        await handleAsyncError(error, 'Failed to submit product selection', {
          component: 'ProductSelectionStep',
          operation: 'handleSubmit',
          metadata: {
            formData,
            selectedProducts: Array.from(selectedProducts.values()),
            crossStepValidationResults,
          },
        });
        return false;
      }
    },
    [
      crossStepValidationResults,
      collectFormData,
      onUpdate,
      selectedProducts,
      trackProductSelection,
      handleAsyncError,
    ]
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading products...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <h3 className="text-lg font-medium text-red-800">Failed to load products</h3>
        </div>
        <p className="mt-2 text-red-700">{error}</p>
        <button
          onClick={loadProducts}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Product Selection</h2>
          <p className="text-sm text-gray-600 mt-1">
            Select products and services for your proposal
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
          </span>
          {selectedProducts.size > 0 && (
            <span className="text-sm font-medium text-green-600">
              Total: $
              {Array.from(selectedProducts.values())
                .reduce((sum, product) => sum + product.totalPrice, 0)
                .toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {categories.map(category => (
            <option key={`opt-${category}`} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Cross-step validation warnings */}
      {crossStepValidationResults.warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-yellow-500 mr-2" />
            <h4 className="text-sm font-medium text-yellow-800">Recommendations</h4>
          </div>
          <ul className="mt-2 text-sm text-yellow-700">
            {crossStepValidationResults.warnings.map((warning, index) => (
              <li key={`warn-${index}-${String(warning)}`} className="list-disc list-inside">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cross-step validation errors */}
      {crossStepValidationResults.errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <h4 className="text-sm font-medium text-red-800">Validation Issues</h4>
          </div>
          <ul className="mt-2 text-sm text-red-700">
            {crossStepValidationResults.errors.map((error, index) => (
              <li key={`err-${index}-${String(error)}`} className="list-disc list-inside">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <div
            key={`card-${product.id}`}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedProducts.has(product.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
            onClick={() => handleProductSelect(product)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-semibold text-gray-900">
                    ${product.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">{product.category[0]}</span>
                </div>
              </div>

              {selectedProducts.has(product.id) && (
                <CheckCircle className="h-5 w-5 text-blue-500 ml-2" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Products */}
      {selectedProducts.size > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Selected Products</h3>

          <div className="space-y-3">
            {Array.from(selectedProducts.values()).map(product => (
              <div
                key={`sel-${product.id}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{product.name}</h4>
                  <p className="text-sm text-gray-600">{product.category}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Qty:</label>
                    <input
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={e =>
                        handleQuantityChange(product.id, parseInt(e.target.value) || 1)
                      }
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  <span className="text-lg font-semibold text-gray-900">
                    ${product.totalPrice.toLocaleString()}
                  </span>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleProductRemove(product.id);
                    }}
                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <span className="text-lg font-medium text-gray-900">Total Value</span>
            <span className="text-2xl font-bold text-green-600">
              $
              {Array.from(selectedProducts.values())
                .reduce((sum, product) => sum + product.totalPrice, 0)
                .toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* No products found */}
      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or category filter</p>
        </div>
      )}
    </div>
  );
}
