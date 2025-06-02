'use client';

/**
 * PosalPro MVP2 - Proposal Creation Step 4: Product Selection
 * Based on PRODUCT_SELECTION_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H1 & H8 hypothesis validation
 */

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/forms/Button';
import { ProposalWizardStep4Data } from '@/lib/validation/schemas/proposal';
import {
  CheckIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-1.2', 'US-3.1'],
  acceptanceCriteria: ['AC-1.2.1', 'AC-1.2.2', 'AC-3.1.1'],
  methods: ['suggestProducts()', 'calculatePricing()', 'validateCompatibility()'],
  hypotheses: ['H1', 'H8'],
  testCases: ['TC-H1-002', 'TC-H8-001'],
};

// Product interface for the component
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  unitPrice: number;
  pricingUnit: string;
  features: string[];
  customizations: string[];
  compatibility: string[];
  successRate?: number;
}

// Mock product catalog (would come from API in production)
const MOCK_PRODUCT_CATALOG: Product[] = [
  {
    id: '1',
    name: 'Cloud Migration Service - Basic',
    description: 'Standard cloud migration service for lift-and-shift applications',
    category: 'Services',
    unitPrice: 25000,
    pricingUnit: 'per server',
    features: [
      'Workload assessment',
      'Migration strategy document',
      'Lift-and-shift execution',
      'Basic testing and validation',
      '2 weeks post-migration support',
    ],
    customizations: [
      'Extended support (+$5,000)',
      'Application optimization (+$10,000)',
      'Knowledge transfer sessions (+$3,000)',
    ],
    compatibility: ['AWS', 'Azure', 'GCP'],
    successRate: 92,
  },
  {
    id: '2',
    name: 'Cloud Migration Service - Advanced',
    description: 'Comprehensive cloud migration with optimization and modernization',
    category: 'Services',
    unitPrice: 40000,
    pricingUnit: 'per server',
    features: [
      'Comprehensive workload assessment',
      'Cloud-native architecture design',
      'Application modernization',
      'Performance optimization',
      '6 months post-migration support',
    ],
    customizations: [
      'Multi-cloud setup (+$15,000)',
      'DevOps pipeline setup (+$12,000)',
      'Training program (+$8,000)',
    ],
    compatibility: ['AWS', 'Azure', 'GCP', 'Multi-cloud'],
    successRate: 88,
  },
  {
    id: '3',
    name: 'Security Audit Service - Standard',
    description: 'Comprehensive security assessment and compliance validation',
    category: 'Security',
    unitPrice: 15000,
    pricingUnit: 'flat fee',
    features: [
      'Infrastructure security audit',
      'Compliance assessment',
      'Vulnerability scanning',
      'Security recommendations',
      'Executive summary report',
    ],
    customizations: [
      'Penetration testing (+$8,000)',
      'Compliance certification (+$5,000)',
      'Remediation support (+$10,000)',
    ],
    compatibility: ['On-premise', 'Cloud', 'Hybrid'],
    successRate: 95,
  },
  {
    id: '4',
    name: 'Managed Service Support - Monthly',
    description: '24/7 monitoring and support for cloud infrastructure',
    category: 'Support',
    unitPrice: 3500,
    pricingUnit: 'per month',
    features: [
      '24/7 monitoring',
      'Incident response',
      'Performance optimization',
      'Monthly reports',
      'Emergency escalation',
    ],
    customizations: [
      'Dedicated support engineer (+$2,000)',
      'Custom SLA agreement (+$1,500)',
      'Enhanced monitoring (+$1,000)',
    ],
    compatibility: ['AWS', 'Azure', 'GCP', 'Multi-cloud'],
    successRate: 97,
  },
  {
    id: '5',
    name: 'Training Package - Cloud Fundamentals',
    description: 'Comprehensive training program for cloud adoption',
    category: 'Training',
    unitPrice: 8000,
    pricingUnit: 'per session',
    features: [
      'Cloud basics training',
      'Platform-specific modules',
      'Hands-on workshops',
      'Certification preparation',
      'Training materials',
    ],
    customizations: [
      'Custom curriculum (+$3,000)',
      'On-site delivery (+$2,000)',
      'Follow-up sessions (+$1,500)',
    ],
    compatibility: ['AWS', 'Azure', 'GCP'],
    successRate: 89,
  },
];

const PRODUCT_CATEGORIES = [
  'All',
  'Services',
  'Security',
  'Support',
  'Training',
  'Hardware',
  'Software',
];

// Selected product interface
interface SelectedProduct {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  configuration: Record<string, any>;
  customizations: string[];
  notes?: string;
}

// Validation schema for product selection step
const productSelectionSchema = z.object({
  selectedProducts: z.array(
    z.object({
      id: z.string().min(1, 'Product ID is required'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      customizations: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })
  ),
  searchQuery: z.string().optional(),
  selectedCategory: z.string().optional(),
});

type ProductSelectionFormData = z.infer<typeof productSelectionSchema>;

interface ProductSelectionStepProps {
  data: Partial<ProposalWizardStep4Data>;
  onUpdate: (data: Partial<ProposalWizardStep4Data>) => void;
  analytics: any;
}

export function ProductSelectionStep({ data, onUpdate, analytics }: ProductSelectionStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(MOCK_PRODUCT_CATALOG);
  const [selectedProducts, setSelectedProducts] = useState<Map<string, SelectedProduct>>(new Map());
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const lastSentDataRef = useRef<string>('');
  const onUpdateRef = useRef(onUpdate);

  // Keep onUpdate ref current
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  const {
    register,
    watch,
    setValue,
    formState: { errors, isValid },
    getValues,
  } = useForm<ProductSelectionFormData>({
    resolver: zodResolver(productSelectionSchema),
    defaultValues: {
      selectedProducts:
        data.products?.map(product => ({
          id: product.id,
          quantity: product.quantity || 1,
          customizations: product.customizations || [],
          notes: product.notes || '',
        })) || [],
      searchQuery: '',
      selectedCategory: 'All',
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  // Initialize selected products from props
  useEffect(() => {
    if (data.products) {
      const productMap = new Map<string, SelectedProduct>();

      data.products.forEach(product => {
        productMap.set(product.id, {
          id: product.id,
          name: product.name,
          category: product.category,
          quantity: product.quantity || 1,
          unitPrice: product.unitPrice,
          totalPrice: product.totalPrice,
          configuration: product.configuration || {},
          customizations: product.customizations || [],
          notes: product.notes || '',
        });
      });

      setSelectedProducts(productMap);
    }
  }, [data.products]);

  // Stable update function to prevent infinite loops
  const handleUpdate = useCallback((formattedData: ProposalWizardStep4Data) => {
    const dataHash = JSON.stringify(formattedData);

    if (dataHash !== lastSentDataRef.current) {
      lastSentDataRef.current = dataHash;
      onUpdateRef.current(formattedData);
    }
  }, []);

  // Update parent component when form data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const selectedProductsArray = Array.from(selectedProducts.values());
      const totalValue = selectedProductsArray.reduce(
        (sum, product) => sum + product.totalPrice,
        0
      );

      const formattedData: ProposalWizardStep4Data = {
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
        aiRecommendationsUsed: 0,
        searchHistory: data.searchHistory || [],
      };

      handleUpdate(formattedData);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedProducts, data.searchHistory, handleUpdate]);

  // Filter products based on search query and category
  useEffect(() => {
    let filtered = MOCK_PRODUCT_CATALOG;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory]);

  // Track analytics for product selection
  const trackProductSelection = useCallback(
    (action: string, productId: string, metadata: any = {}) => {
      analytics.trackWizardStep(4, 'Product Selection', action, {
        productId,
        totalSelected: selectedProducts.size,
        searchQuery,
        selectedCategory,
        ...metadata,
      });
    },
    [analytics, selectedProducts.size, searchQuery, selectedCategory]
  );

  // Generate AI product recommendations
  const generateAIRecommendations = useCallback(async () => {
    setIsLoadingRecommendations(true);
    setShowAIRecommendations(true);
    analytics.trackWizardStep(4, 'Product Selection', 'ai_recommendations_requested');

    // Simulate AI recommendation generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Show top 3 products by success rate for AI recommendations
    const recommendations = [...MOCK_PRODUCT_CATALOG]
      .sort((a, b) => (b.successRate || 0) - (a.successRate || 0))
      .slice(0, 3);

    setFilteredProducts(recommendations);
    setIsLoadingRecommendations(false);

    analytics.trackWizardStep(4, 'Product Selection', 'ai_recommendations_generated', {
      recommendationsCount: recommendations.length,
      topSuccessRate: recommendations[0]?.successRate || 0,
    });
  }, [analytics]);

  // Add product to selection
  const addProduct = useCallback(
    (product: Product) => {
      const selectedProduct: SelectedProduct = {
        id: product.id,
        name: product.name,
        category: product.category,
        quantity: 1,
        unitPrice: product.unitPrice,
        totalPrice: product.unitPrice,
        configuration: {},
        customizations: [],
        notes: '',
      };

      setSelectedProducts(prev => new Map(prev.set(product.id, selectedProduct)));

      trackProductSelection('product_added', product.id, {
        unitPrice: product.unitPrice,
        category: product.category,
        successRate: product.successRate,
      });
    },
    [trackProductSelection]
  );

  // Remove product from selection
  const removeProduct = useCallback(
    (productId: string) => {
      setSelectedProducts(prev => {
        const newMap = new Map(prev);
        newMap.delete(productId);
        return newMap;
      });

      trackProductSelection('product_removed', productId);
    },
    [trackProductSelection]
  );

  // Update product quantity
  const updateProductQuantity = useCallback(
    (productId: string, quantity: number) => {
      setSelectedProducts(prev => {
        const newMap = new Map(prev);
        const product = newMap.get(productId);
        if (product && quantity > 0) {
          const updatedProduct = {
            ...product,
            quantity,
            totalPrice: product.unitPrice * quantity,
          };
          newMap.set(productId, updatedProduct);
        }
        return newMap;
      });

      trackProductSelection('quantity_updated', productId, { newQuantity: quantity });
    },
    [trackProductSelection]
  );

  // Calculate total value
  const totalValue = useMemo(() => {
    return Array.from(selectedProducts.values()).reduce(
      (sum, product) => sum + product.totalPrice,
      0
    );
  }, [selectedProducts]);

  const selectedProductsArray = Array.from(selectedProducts.values());

  return (
    <div className="space-y-8">
      {/* AI Recommendations Panel */}
      <Card>
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <SparklesIcon className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-blue-900">AI Product Recommendations</h3>
            </div>
            <Button
              variant="secondary"
              onClick={generateAIRecommendations}
              disabled={isLoadingRecommendations}
              loading={isLoadingRecommendations}
              className="flex items-center"
            >
              Get AI Recommendations
            </Button>
          </div>

          {showAIRecommendations && (
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-600 mb-3">
                Based on your proposal details, we recommend:
              </p>
              <div className="space-y-2">
                {filteredProducts.slice(0, 3).map(product => (
                  <div key={product.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{product.name}</span>
                    {selectedProducts.has(product.id) ? (
                      <span className="text-xs text-green-600">Already added</span>
                    ) : (
                      <Button variant="primary" size="sm" onClick={() => addProduct(product)}>
                        Add
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Product Catalog */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center">
            <CubeIcon className="w-5 h-5 mr-2" />
            Product Catalog
          </h3>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedCategory}
              options={PRODUCT_CATEGORIES.map(category => ({
                value: category,
                label: category,
              }))}
              onChange={(value: string) => setSelectedCategory(value)}
            />
          </div>

          {/* Available Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.description}</p>
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded mt-1">
                          {product.category}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          ${product.unitPrice.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">{product.pricingUnit}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {selectedProducts.has(product.id) ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled
                          className="flex items-center text-green-600"
                        >
                          <CheckIcon className="w-4 h-4 mr-1" />
                          Added
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => addProduct(product)}
                          className="flex items-center"
                        >
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CubeIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No products found matching your criteria.</p>
              <p className="text-sm">Try adjusting your search or category filter.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Selected Products */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6">
            Selected Products ({selectedProductsArray.length})
          </h3>

          {selectedProductsArray.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Qty</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Price</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProductsArray.map(product => (
                      <tr key={product.id} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                              {product.category}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                updateProductQuantity(product.id, product.quantity - 1)
                              }
                              disabled={product.quantity <= 1}
                            >
                              <MinusIcon className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {product.quantity}
                            </span>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                updateProductQuantity(product.id, product.quantity + 1)
                              }
                            >
                              <PlusIcon className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              ${product.totalPrice.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              ${product.unitPrice.toLocaleString()} each
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setEditingProduct(product.id)}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => removeProduct(product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-blue-600">
                    ${totalValue.toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CubeIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No products selected yet.</p>
              <p className="text-sm">
                Add products from the catalog above to include them in your proposal.
              </p>
              <Button variant="secondary" onClick={generateAIRecommendations} className="mt-4">
                Try AI Recommendations
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              selectedProductsArray.length > 0 ? 'bg-success-600' : 'bg-neutral-300'
            }`}
          />
          <span className="text-sm text-neutral-600">
            Step 4 of 6: {selectedProductsArray.length > 0 ? 'Complete' : 'In Progress'}
          </span>
        </div>
        <div className="text-sm text-neutral-600">
          {selectedProductsArray.length} products • ${totalValue.toLocaleString()} total
        </div>
      </div>
    </div>
  );
}
