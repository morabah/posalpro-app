'use client';

/**
 * PosalPro MVP2 - Proposal Creation Step 4: Product Selection
 * Enhanced with direct data flow from product pages, cross-step validation, and advanced analytics
 * Based on PRODUCT_SELECTION_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H1 & H8 hypothesis validation
 */

import { Modal, useModal } from '@/components/ui/feedback/Modal';
import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ProposalWizardStep4Data } from '@/types/proposals';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Info, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Removed unused COMPONENT_MAPPING to satisfy unused-vars

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
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  // Detail modal state
  const {
    isOpen: isDetailOpen,
    openModal: openDetailModal,
    closeModal: closeDetailModal,
  } = useModal(false);
  const [detailProduct, setDetailProduct] = useState<SelectedProduct | null>(null);
  const [detailQuantity, setDetailQuantity] = useState<number>(1);
  const [detailNotes, setDetailNotes] = useState<string>('');

  // Recommendations state
  const [recommendationsOpen, setRecommendationsOpen] = useState(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [bundlePairs, setBundlePairs] = useState<
    Array<{ aId: string; aName: string; bId: string; bName: string; count: number }>
  >([]);

  // Dev-only: kept silent to avoid console noise
  // Removed unused dev-only effect

  // Removed unused dev-only effect

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
    const includedProducts = Array.from(selectedProducts.values()).filter(p => p.quantity > 0);
    const totalValue = includedProducts.reduce((sum, product) => sum + product.totalPrice, 0);

    const formData = {
      products: includedProducts.map(product => ({
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
      aiRecommendationsUsed: 0,
      searchHistory: [],
      crossStepValidation: {
        teamCompatibility: true,
        contentAlignment: true,
        budgetCompliance: true,
        timelineRealistic: true,
      },
    };

    // Analytics tracking for product selection
    if (analytics?.trackWizardStep) {
      analytics.trackWizardStep(4, 'Product Selection', 'products_selected', {
        productCount: includedProducts.length,
        totalValue,
        averageProductValue: includedProducts.length > 0 ? totalValue / includedProducts.length : 0,
        categories: [...new Set(includedProducts.map(p => p.category))],
      });
    }

    return formData;
  }, [selectedProducts, analytics]);

  // Helper to build form data from a provided selection map to avoid async state lag
  const buildFormDataFrom = useCallback(
    (map: Map<string, SelectedProduct>): ProposalWizardStep4Data => {
      const includedProducts = Array.from(map.values()).filter(p => p.quantity > 0);
      const totalValue = includedProducts.reduce((sum, product) => sum + product.totalPrice, 0);
      return {
        products: includedProducts.map(product => ({
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
        aiRecommendationsUsed: 0,
        searchHistory: [],
        crossStepValidation: {
          teamCompatibility: true,
          contentAlignment: true,
          budgetCompliance: true,
          timelineRealistic: true,
        },
      };
    },
    []
  );

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
        // dev logs removed for compliance
      } else {
        throw new Error('Failed to load products');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load products';
      setError(errorMessage);
      await handleAsyncError(error, 'Failed to load products', {
        component: 'ProductSelectionStep',
        operation: 'loadProducts',
      });
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  // Load AI recommendations (top winning products, common bundles)
  const loadRecommendations = useCallback(async () => {
    try {
      setRecommendationsLoading(true);
      setRecommendationsError(null);

      // Products analytics (top winning)
      const productsRes = await apiClient.get<{
        success: boolean;
        data?: {
          products?: Array<{ productId: string; name: string }>;
          topWinning?: Array<{ productId: string; name: string }>;
        };
      }>('api/proposals/analytics/products');

      const top = productsRes?.data?.topWinning || [];
      const recs = top
        .filter(p => typeof p.productId === 'string' && typeof p.name === 'string')
        .map(p => ({ id: p.productId, name: p.name }));
      setRecommendedProducts(recs);

      // Common bundles
      const bundlesRes = await apiClient.get<{
        success: boolean;
        data?: {
          pairs?: Array<{ aId: string; aName: string; bId: string; bName: string; count: number }>;
        };
      }>('api/proposals/analytics/product-bundles');

      const pairs = bundlesRes?.data?.pairs || [];
      setBundlePairs(pairs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load recommendations';
      setRecommendationsError(msg);
    } finally {
      setRecommendationsLoading(false);
    }
  }, [apiClient]);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Performance: idle-time prefetch for categories/stats (very small payload) to speed up first filtering
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const idlePrefetch = async () => {
      try {
        // fire-and-forget; ignore result
        void apiClient.get('/products/stats');
        void apiClient.get('/products/categories');
      } catch {
        // Intentionally ignore background prefetch errors to avoid user disruption
        void 0;
      }
    };
    // Type-safe access to requestIdleCallback when available
    interface IdleDeadline {
      timeRemaining: () => number;
      didTimeout: boolean;
    }
    interface WindowWithIdle {
      requestIdleCallback?: (
        callback: (deadline: IdleDeadline) => void,
        options?: { timeout?: number }
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    }
    const win = window as unknown as WindowWithIdle;
    if (typeof win.requestIdleCallback === 'function') {
      const id = win.requestIdleCallback(idlePrefetch, { timeout: 1200 });
      return () => {
        if (typeof win.cancelIdleCallback === 'function') {
          win.cancelIdleCallback(id);
        }
      };
    }
    const t = window.setTimeout(idlePrefetch, 800);
    return () => window.clearTimeout(t);
  }, [apiClient]);

  // Initialize selected products from props (hydrate prices) once
  const initializedFromDataRef = useRef(false);

  // Helper to resolve the source product ID from props (supports {id} or {productId})
  type IncomingProduct =
    | {
        id: string;
        productId?: string;
        name?: string;
        unitPrice?: number;
        quantity?: number;
        totalPrice?: number;
        category?: string;
        configuration?: Record<string, unknown>;
        customizations?: string[];
        notes?: string;
      }
    | {
        productId: string;
        id?: string;
        name?: string;
        unitPrice?: number;
        quantity?: number;
        totalPrice?: number;
        category?: string;
        configuration?: Record<string, unknown>;
        customizations?: string[];
        notes?: string;
      };

  const resolveSourceId = useCallback((p: IncomingProduct | undefined): string | undefined => {
    if (!p) return undefined;
    return (p as { id?: string }).id ?? (p as { productId?: string }).productId ?? undefined;
  }, []);

  const buildSelectedProduct = useCallback(
    (p: IncomingProduct): SelectedProduct | null => {
      const sourceId = resolveSourceId(p);
      if (!sourceId) return null;
      const dbProduct = products.find(dp => dp.id === sourceId);
      const unitPrice = (p as { unitPrice?: number }).unitPrice ?? dbProduct?.price ?? 0;
      const quantity = (p as { quantity?: number }).quantity ?? 1;
      const name = (p as { name?: string }).name ?? dbProduct?.name ?? 'Unknown Product';
      const category =
        (p as { category?: string }).category ?? dbProduct?.category?.[0] ?? 'General';
      return {
        id: sourceId,
        name,
        productId: dbProduct?.id || sourceId,
        category,
        quantity,
        unitPrice,
        totalPrice: (p as { totalPrice?: number }).totalPrice ?? unitPrice * quantity,
        priceModel: 'FIXED',
        configuration: (p as { configuration?: Record<string, unknown> }).configuration ?? {},
        customizations: (p as { customizations?: string[] }).customizations ?? [],
        notes: (p as { notes?: string }).notes,
      };
    },
    [products, resolveSourceId]
  );

  useEffect(() => {
    if (initializedFromDataRef.current) return;
    if (data.products && data.products.length > 0) {
      const productsMap = new Map<string, SelectedProduct>();
      data.products.forEach(product => {
        const sp = buildSelectedProduct(product);
        if (sp) productsMap.set(sp.id, sp);
      });
      setSelectedProducts(productsMap);
      initializedFromDataRef.current = true;
    }
  }, [data.products, products, buildSelectedProduct]);

  // Resilient hydration: if selection is still empty after products load, hydrate again from props
  useEffect(() => {
    if (selectedProducts.size === 0 && data.products && data.products.length > 0) {
      const productsMap = new Map<string, SelectedProduct>();
      (data.products as IncomingProduct[]).forEach(product => {
        const sp = buildSelectedProduct(product);
        if (sp) productsMap.set(sp.id, sp);
      });
      if (productsMap.size > 0) {
        setSelectedProducts(productsMap);
      }
    }
  }, [selectedProducts.size, data.products, products, buildSelectedProduct]);

  // Backfill any missing items if props contain more products than the current map
  const previousPropsHashRef = useRef<string | null>(null);
  const computeProductsHash = useCallback(
    (list?: IncomingProduct[]): string => {
      if (!list || list.length === 0) return '';
      const ids = list
        .map(p => resolveSourceId(p))
        .filter((id): id is string => Boolean(id))
        .sort();
      return ids.join('|');
    },
    [resolveSourceId]
  );

  useEffect(() => {
    if (!data.products || data.products.length === 0) return;

    // Only backfill when the incoming props list actually changes (external update)
    const currentHash = computeProductsHash(data.products as IncomingProduct[]);
    if (previousPropsHashRef.current === currentHash) {
      return; // No external change; avoid re-adding locally removed items
    }
    previousPropsHashRef.current = currentHash;

    const existingIds = new Set(Array.from(selectedProducts.keys()));
    const missing = (data.products as IncomingProduct[]).filter(p => {
      const sid = resolveSourceId(p);
      return sid ? !existingIds.has(sid) : false;
    });

    if (missing.length === 0) return;

    const newMap = new Map(selectedProducts);
    missing.forEach(product => {
      const sp = buildSelectedProduct(product);
      if (sp) newMap.set(sp.id, sp);
    });
    setSelectedProducts(newMap);
  }, [data.products, selectedProducts, computeProductsHash, resolveSourceId, buildSelectedProduct]);

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

    // Apply selected-only filter
    if (showSelectedOnly) {
      const selectedIds = new Set(Array.from(selectedProducts.keys()));
      filtered = filtered.filter(product => selectedIds.has(product.id));
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory, showSelectedOnly, selectedProducts]);

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

        const next = new Map(selectedProducts);
        next.set(product.id, updatedProduct);
        setSelectedProducts(next);
        // Immediate upstream update to keep props in sync
        onUpdate(buildFormDataFrom(next));
        // dev log removed
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

        const next = new Map(selectedProducts);
        next.set(product.id, newProduct);
        setSelectedProducts(next);
        // Immediate upstream update to keep props in sync
        onUpdate(buildFormDataFrom(next));
        // dev log removed
      }

      trackProductSelection('product_selected', product.id, {
        productName: product.name,
        productCategory: product.category[0],
        productPrice: product.price,
      });
    },
    [selectedProducts, trackProductSelection]
  );

  // Open detail modal for product (new or existing)
  const openProductDetail = useCallback(
    (productOrId: Product | string) => {
      let base: SelectedProduct | null = null;
      if (typeof productOrId === 'string') {
        const selected = selectedProducts.get(productOrId);
        if (selected) base = selected;
        else {
          const p = products.find(pp => pp.id === productOrId);
          if (p) {
            base = {
              id: p.id,
              name: p.name,
              productId: p.id,
              category: p.category[0] || 'General',
              quantity: 1,
              unitPrice: p.price,
              totalPrice: p.price,
              priceModel: 'FIXED',
              configuration: {},
              customizations: [],
              notes: '',
            };
          }
        }
      } else {
        const existing = selectedProducts.get(productOrId.id);
        if (existing) base = existing;
        else {
          base = {
            id: productOrId.id,
            name: productOrId.name,
            productId: productOrId.id,
            category: productOrId.category[0] || 'General',
            quantity: 1,
            unitPrice: productOrId.price,
            totalPrice: productOrId.price,
            priceModel: 'FIXED',
            configuration: {},
            customizations: [],
            notes: '',
          };
        }
      }

      if (!base) return;
      setDetailProduct(base);
      setDetailQuantity(base.quantity);
      setDetailNotes(base.notes || '');
      openDetailModal();
    },
    [products, selectedProducts, openDetailModal]
  );

  const confirmDetail = useCallback(() => {
    if (!detailProduct) return;
    const updated: SelectedProduct = {
      ...detailProduct,
      quantity: Math.max(1, Number(detailQuantity) || 1),
      totalPrice: Math.max(1, Number(detailQuantity) || 1) * detailProduct.unitPrice,
      notes: detailNotes,
    };
    const next = new Map(selectedProducts);
    next.set(updated.id, updated);
    setSelectedProducts(next);
    onUpdate(buildFormDataFrom(next));
    trackProductSelection('product_detail_saved', updated.id, {
      productName: updated.name,
      quantity: updated.quantity,
      subtotal: updated.totalPrice,
    });
    closeModal();
  }, [
    detailProduct,
    detailQuantity,
    detailNotes,
    selectedProducts,
    onUpdate,
    buildFormDataFrom,
    trackProductSelection,
  ]);

  const closeModal = useCallback(() => {
    closeDetailModal();
  }, [closeDetailModal]);

  const handleAddFromRecommendation = useCallback(
    (productId: string) => {
      const p = products.find(pp => pp.id === productId);
      if (p) {
        handleProductSelect(p);
        trackProductSelection('ai_recommendation_accepted', productId, {
          productName: p.name,
        });
      }
    },
    [products, handleProductSelect, trackProductSelection]
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

      const next = new Map(selectedProducts);
      next.delete(productId);
      setSelectedProducts(next);
      // Immediate upstream update to ensure product is removed from proposal and UI
      onUpdate(buildFormDataFrom(next));
    },
    [selectedProducts, trackProductSelection, onUpdate, buildFormDataFrom]
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

        const next = new Map(selectedProducts);
        next.set(productId, updatedProduct);
        setSelectedProducts(next);
        // Immediate upstream update to keep totals in sync
        onUpdate(buildFormDataFrom(next));

        trackProductSelection('quantity_changed', productId, {
          oldQuantity: product.quantity,
          newQuantity,
          productName: product.name,
        });
      }
    },
    [selectedProducts, trackProductSelection, onUpdate, buildFormDataFrom]
  );

  // Update form data when selections change
  useEffect(() => {
    const formData = collectFormData();
    onUpdate(formData);
    // dev log removed
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

        <label className="inline-flex items-center gap-2 text-sm text-gray-700 select-none">
          <input
            type="checkbox"
            checked={showSelectedOnly}
            onChange={e => setShowSelectedOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            aria-label="Filter selected products"
          />
          Selected products
        </label>
      </div>

      {/* AI Recommendations Panel */}
      <div className="border border-gray-200 rounded-md">
        <div className="flex items-center justify-between p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900">AI Recommendations</h3>
            {recommendationsOpen && (
              <span className="text-xs text-gray-500">Based on proposal history</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !recommendationsOpen;
              setRecommendationsOpen(next);
              if (next) void loadRecommendations();
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
            aria-expanded={recommendationsOpen}
          >
            {recommendationsOpen ? 'Hide' : 'Show'}
          </button>
        </div>
        {recommendationsOpen && (
          <div className="p-3 sm:p-4 border-t border-gray-200 space-y-4">
            {recommendationsLoading && (
              <div className="text-sm text-gray-600">Loading recommendations...</div>
            )}
            {recommendationsError && (
              <div className="text-sm text-red-600" role="alert">
                {recommendationsError}
              </div>
            )}
            {!recommendationsLoading && !recommendationsError && (
              <>
                <div>
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Suggested Products</h4>
                  {recommendedProducts.length === 0 ? (
                    <p className="text-sm text-gray-600">No suggestions available</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {recommendedProducts.slice(0, 6).map(p => (
                        <button
                          key={`rec-${p.id}`}
                          onClick={() => handleAddFromRecommendation(p.id)}
                          className="px-3 py-1.5 text-xs rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50"
                          aria-label={`Add ${p.name} to proposal`}
                        >
                          Add {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Common Bundles</h4>
                  {bundlePairs.length === 0 ? (
                    <p className="text-sm text-gray-600">No bundle data available</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {bundlePairs.slice(0, 6).map(pair => (
                        <button
                          key={`bundle-${pair.aId}-${pair.bId}`}
                          onClick={() => {
                            handleAddFromRecommendation(pair.aId);
                            handleAddFromRecommendation(pair.bId);
                            trackProductSelection(
                              'bundle_suggestion_accepted',
                              `${pair.aId}+${pair.bId}`,
                              {
                                aName: pair.aName,
                                bName: pair.bName,
                              }
                            );
                          }}
                          className="px-3 py-1.5 text-xs rounded-md border border-yellow-200 text-yellow-800 hover:bg-yellow-50"
                          aria-label={`Add bundle ${pair.aName} + ${pair.bName}`}
                        >
                          {pair.aName} + {pair.bName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
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

      {/* Products List with inline selection controls */}
      <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
        {filteredProducts.map(product => {
          const isSelected = selectedProducts.has(product.id);
          const selected = isSelected ? selectedProducts.get(product.id)! : null;
          return (
            <div
              key={`row-${product.id}`}
              className={`flex items-center justify-between p-3 sm:p-4 ${
                isSelected ? 'bg-blue-50' : 'bg-white'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openProductDetail(product)}
                    className="truncate font-medium text-gray-900 text-left hover:underline"
                    aria-label={`View details for ${product.name}`}
                  >
                    {product.name}
                  </button>
                  <span className="text-xs text-gray-500">{product.sku}</span>
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {product.category[0]}
                  {product.description ? ` • ${product.description}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-4 pl-4">
                {!isSelected ? (
                  <>
                    <span className="text-sm sm:text-base font-semibold text-gray-900">
                      ${product.price.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleProductSelect(product)}
                      className="inline-flex items-center justify-center p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px]"
                      aria-label={`Add ${product.name} to proposal`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600" htmlFor={`qty-${product.id}`}>
                        Qty
                      </label>
                      <input
                        id={`qty-${product.id}`}
                        type="number"
                        min={1}
                        value={selected?.quantity ?? 1}
                        onChange={e =>
                          handleQuantityChange(
                            product.id,
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-gray-900">
                      $
                      {(
                        (selected?.quantity || 1) * (selected?.unitPrice || product.price)
                      ).toLocaleString()}
                    </span>
                    <button
                      onClick={() => openProductDetail(product.id)}
                      className="p-2 rounded-md text-gray-600 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[36px]"
                      aria-label={`Edit ${product.name}`}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleProductRemove(product.id);
                      }}
                      className="p-2 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[36px]"
                      aria-label={`Remove ${product.name} from proposal`}
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Products Panel */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900">
          Selected Products ({selectedProducts.size})
        </h3>
        {selectedProducts.size === 0 ? (
          <div className="p-4 border border-gray-200 rounded-md text-sm text-gray-600">
            <p>No products selected yet.</p>
            <div className="mt-3">
              <button
                type="button"
                className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {
                  setRecommendationsOpen(true);
                  void loadRecommendations();
                }}
              >
                Try AI Recommendations
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden sm:block overflow-x-auto border border-gray-200 rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="text-left px-4 py-2">Product</th>
                  <th className="text-left px-4 py-2">Qty</th>
                  <th className="text-left px-4 py-2">Unit Price</th>
                  <th className="text-left px-4 py-2">Total</th>
                  <th className="text-left px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Array.from(selectedProducts.values()).map(sp => (
                  <tr key={`sel-${sp.id}`} className="bg-white">
                    <td className="px-4 py-2 text-gray-900 truncate">{sp.name}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={1}
                        value={sp.quantity}
                        onChange={e =>
                          handleQuantityChange(sp.id, Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="w-24 px-2 py-1 border border-gray-300 rounded"
                        aria-label={`Quantity for ${sp.name}`}
                      />
                    </td>
                    <td className="px-4 py-2">${sp.unitPrice.toLocaleString()}</td>
                    <td className="px-4 py-2 font-medium">${sp.totalPrice.toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openProductDetail(sp.id)}
                          className="p-1.5 rounded-md text-gray-600 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label={`Edit ${sp.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleProductRemove(sp.id)}
                          className="p-1.5 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                          aria-label={`Remove ${sp.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile cards */}
        {selectedProducts.size > 0 && (
          <div className="sm:hidden space-y-2">
            {Array.from(selectedProducts.values()).map(sp => (
              <div key={`selm-${sp.id}`} className="p-3 border border-gray-200 rounded-md bg-white">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{sp.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      ${sp.unitPrice.toLocaleString()} each
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 ml-3">
                    ${sp.totalPrice.toLocaleString()}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600" htmlFor={`mqty-${sp.id}`}>
                      Qty
                    </label>
                    <input
                      id={`mqty-${sp.id}`}
                      type="number"
                      min={1}
                      value={sp.quantity}
                      onChange={e =>
                        handleQuantityChange(sp.id, Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openProductDetail(sp.id)}
                      className="p-2 rounded-md text-gray-600 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`Edit ${sp.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleProductRemove(sp.id)}
                      className="p-2 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label={`Remove ${sp.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedProducts.size > 0 && (
          <div className="flex items-center justify-end pt-2">
            <div className="text-sm font-medium text-blue-800">
              Total: $
              {Array.from(selectedProducts.values())
                .reduce((sum, product) => sum + product.totalPrice, 0)
                .toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* No products found */}
      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or category filter</p>
        </div>
      )}

      {/* Product Detail Modal */}
      {isDetailOpen && detailProduct && (
        <Modal isOpen={isDetailOpen} onClose={closeModal} title="Product Details" size="lg">
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-semibold text-gray-900">{detailProduct.name}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {products.find(p => p.id === detailProduct.id)?.description ||
                  'Configure quantity and notes.'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="detail-qty"
                >
                  Quantity
                </label>
                <input
                  id="detail-qty"
                  type="number"
                  min={1}
                  value={detailQuantity}
                  onChange={e => setDetailQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal</label>
                <div className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 font-medium">
                  $
                  {(
                    Math.max(1, Number(detailQuantity) || 1) * detailProduct.unitPrice
                  ).toLocaleString()}
                </div>
              </div>
            </div>
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="detail-notes"
              >
                Notes
              </label>
              <textarea
                id="detail-notes"
                rows={3}
                value={detailNotes}
                onChange={e => setDetailNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Add any customization notes..."
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDetail}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                {selectedProducts.has(detailProduct.id) ? 'Save Changes' : 'Add to Proposal'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
