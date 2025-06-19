'use client';

/**
 * PosalPro MVP2 - Proposal Creation Step 4: Product Selection
 * Enhanced with direct data flow from product pages, cross-step validation, and advanced analytics
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
  ExclamationTriangleIcon,
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
  userStories: ['US-1.2', 'US-3.1', 'US-6.2'],
  acceptanceCriteria: ['AC-1.2.1', 'AC-1.2.2', 'AC-3.1.1', 'AC-6.2.1'],
  methods: [
    'suggestProducts()',
    'calculatePricing()',
    'validateCompatibility()',
    'integrateProductCatalog()',
    'validateCrossStepData()',
    'trackProductAnalytics()',
  ],
  hypotheses: ['H1', 'H8', 'H10'],
  testCases: ['TC-H1-002', 'TC-H8-001', 'TC-H10-001'],
};

// Enhanced Product interface aligned with product management system
interface Product {
  id: string;
  name: string;
  productId: string;
  description: string;
  category: string;
  subCategory?: string;
  unitPrice: number;
  pricingUnit: string;
  priceModel: 'FIXED' | 'VARIABLE' | 'TIERED';
  features: string[];
  customizations: string[];
  compatibility: string[];
  licenseDependencies?: string[];
  resources?: Array<{
    id: string;
    name: string;
    type: 'document' | 'image' | 'video';
    url: string;
  }>;
  successRate?: number;
  isVisible: boolean;
  isFeatured: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

// Enhanced Product Catalog - integrated from product management system
const ENHANCED_PRODUCT_CATALOG: Product[] = [
  {
    id: 'prod-001',
    name: 'Cloud Security Suite',
    productId: 'CS-2025-001',
    description: 'Enterprise-grade cloud security solution with advanced threat detection',
    category: 'Security',
    subCategory: 'Cloud Solutions',
    unitPrice: 2500,
    pricingUnit: 'per month',
    priceModel: 'FIXED',
    features: [
      'AI-powered threat detection',
      'Compliance automation',
      'Real-time monitoring',
      '24/7 security operations center',
      'Advanced reporting dashboard',
    ],
    customizations: [
      'Multi-cloud deployment (+$500)',
      'Custom threat intelligence (+$800)',
      'Extended monitoring (+$300)',
    ],
    compatibility: ['AWS', 'Azure', 'GCP', 'Hybrid'],
    licenseDependencies: ['Enterprise Security License', 'Cloud Platform License'],
    resources: [
      {
        id: 'res-001',
        name: 'Security_Whitepaper.pdf',
        type: 'document',
        url: '/docs/security-whitepaper.pdf',
      },
    ],
    successRate: 92,
    isVisible: true,
    isFeatured: true,
    status: 'ACTIVE',
  },
  {
    id: 'prod-002',
    name: 'Data Analytics Platform',
    productId: 'DAP-2025-002',
    description: 'AI-powered analytics and business intelligence platform',
    category: 'Software',
    subCategory: 'Analytics',
    unitPrice: 1800,
    pricingUnit: 'per month',
    priceModel: 'TIERED',
    features: [
      'Machine learning insights',
      'Real-time dashboards',
      'Custom report builder',
      'API integrations',
      'Data visualization tools',
    ],
    customizations: [
      'Custom ML models (+$1200)',
      'Advanced integrations (+$600)',
      'White-label option (+$900)',
    ],
    compatibility: ['Cloud', 'On-premise', 'Hybrid'],
    licenseDependencies: ['Analytics License'],
    successRate: 88,
    isVisible: true,
    isFeatured: true,
    status: 'ACTIVE',
  },
  {
    id: 'prod-003',
    name: 'Professional Services Package',
    productId: 'PSP-2025-003',
    description: 'Comprehensive professional services for implementation and support',
    category: 'Services',
    subCategory: 'Implementation',
    unitPrice: 150,
    pricingUnit: 'per hour',
    priceModel: 'VARIABLE',
    features: [
      'Expert consultation',
      'Implementation support',
      'Training programs',
      'Knowledge transfer',
      'Post-implementation support',
    ],
    customizations: [
      'On-site delivery (+$50/hour)',
      'Accelerated timeline (+$25/hour)',
      'Extended support (+$20/hour)',
    ],
    compatibility: ['All platforms'],
    successRate: 95,
    isVisible: true,
    isFeatured: false,
    status: 'ACTIVE',
  },
  {
    id: 'prod-004',
    name: 'Network Audit Package',
    productId: 'NAP-2025-004',
    description: 'Comprehensive network security audit and assessment',
    category: 'Services',
    subCategory: 'Security Assessment',
    unitPrice: 3500,
    pricingUnit: 'flat fee',
    priceModel: 'FIXED',
    features: [
      'Infrastructure security audit',
      'Vulnerability scanning',
      'Penetration testing',
      'Compliance validation',
      'Executive summary report',
    ],
    customizations: [
      'Advanced penetration testing (+$1500)',
      'Compliance certification (+$1000)',
      'Remediation support (+$2000)',
    ],
    compatibility: ['On-premise', 'Cloud', 'Hybrid'],
    licenseDependencies: ['Security Audit License', 'Penetration Testing License'],
    successRate: 97,
    isVisible: true,
    isFeatured: true,
    status: 'ACTIVE',
  },
];

const PRODUCT_CATEGORIES = ['All', 'Security', 'Software', 'Services', 'Hardware', 'Training'];

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
  configuration: Record<string, any>;
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
  analytics: any;
  // Cross-step data for validation
  proposalMetadata?: any;
  teamData?: any;
  contentData?: any;
}

export function ProductSelectionStep({
  data,
  onUpdate,
  analytics,
  proposalMetadata,
  teamData,
  contentData,
}: ProductSelectionStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(ENHANCED_PRODUCT_CATALOG);
  const [selectedProducts, setSelectedProducts] = useState<Map<string, SelectedProduct>>(new Map());
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [crossStepValidationResults, setCrossStepValidationResults] = useState<{
    errors: string[];
    warnings: string[];
    suggestions: string[];
  }>({ errors: [], warnings: [], suggestions: [] });
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
  } = useForm<EnhancedProductSelectionFormData>({
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
    mode: 'onChange',
  });

  const watchedValues = watch();

  // Initialize selected products from props
  useEffect(() => {
    if (data.products) {
      const productsMap = new Map<string, SelectedProduct>();
      data.products.forEach(product => {
        const catalogProduct = ENHANCED_PRODUCT_CATALOG.find(p => p.id === product.id);
        if (catalogProduct) {
          productsMap.set(product.id, {
            id: product.id,
            name: product.name,
            productId: catalogProduct.productId,
            category: product.category,
            quantity: product.quantity || 1,
            unitPrice: product.unitPrice,
            totalPrice: product.totalPrice,
            priceModel: catalogProduct.priceModel,
            configuration: product.configuration || {},
            customizations: product.customizations || [],
            notes: product.notes,
          });
        }
      });
      setSelectedProducts(productsMap);
    }
  }, [data.products]);

  // Enhanced analytics tracking with cross-step context
  const trackProductSelection = useCallback(
    (action: string, productId: string, metadata: any = {}) => {
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

  // Cross-step validation logic
  const performCrossStepValidation = useCallback(() => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const selectedProductsArray = Array.from(selectedProducts.values());
    const totalValue = selectedProductsArray.reduce((sum, product) => sum + product.totalPrice, 0);

    // Validate against proposal metadata
    if (proposalMetadata) {
      if (proposalMetadata.estimatedValue && totalValue > proposalMetadata.estimatedValue * 1.2) {
        errors.push(
          `Total product value ($${totalValue.toLocaleString()}) exceeds estimated proposal value by more than 20%`
        );
      } else if (
        proposalMetadata.estimatedValue &&
        totalValue > proposalMetadata.estimatedValue * 1.1
      ) {
        warnings.push(`Total product value approaching estimated proposal limit`);
      }

      // Check project type compatibility
      const projectType = proposalMetadata.projectType;
      const hasCompatibleProducts = selectedProductsArray.some(product => {
        switch (projectType) {
          case 'consulting':
            return product.category === 'Services';
          case 'development':
            return product.category === 'Software' || product.category === 'Services';
          case 'strategy':
            return product.category === 'Services';
          default:
            return true;
        }
      });

      if (!hasCompatibleProducts && selectedProductsArray.length > 0) {
        warnings.push(`No products align with project type: ${projectType}`);
      }
    }

    // Validate against team data
    if (teamData) {
      const securityProducts = selectedProductsArray.filter(p => p.category === 'Security');
      const hasSecurityExpert = teamData.subjectMatterExperts?.some(
        (expert: any) =>
          expert.expertiseArea === 'Security' || expert.expertiseArea === 'Cybersecurity'
      );

      if (securityProducts.length > 0 && !hasSecurityExpert) {
        warnings.push('Security products selected but no security expert assigned to team');
        suggestions.push(
          'Consider adding a security expert to the team for selected security products'
        );
      }

      // Check if team has expertise for all selected product categories
      const uniqueCategories = [...new Set(selectedProductsArray.map(p => p.category))];
      const teamExpertise =
        teamData.subjectMatterExperts?.map((expert: any) => expert.expertiseArea) || [];

      uniqueCategories.forEach(category => {
        const hasExpertise = teamExpertise.includes(category) || teamExpertise.includes('General');
        if (!hasExpertise) {
          suggestions.push(`Consider adding ${category} expertise to the team`);
        }
      });
    }

    // Validate against content data
    if (contentData?.selectedContent) {
      const contentCategories = contentData.selectedContent
        .map((content: any) => content.item.tags)
        .flat();
      const productCategories = selectedProductsArray.map(p => p.category);

      const hasAlignedContent = productCategories.some(category =>
        contentCategories.some((tag: string) => tag.toLowerCase().includes(category.toLowerCase()))
      );

      if (!hasAlignedContent && selectedProductsArray.length > 0) {
        suggestions.push('Consider adding content that aligns with selected product categories');
      }
    }

    // License dependency validation
    const allLicenseDependencies = selectedProductsArray.flatMap(product => {
      const catalogProduct = ENHANCED_PRODUCT_CATALOG.find(p => p.id === product.id);
      return catalogProduct?.licenseDependencies || [];
    });

    const uniqueLicenses = [...new Set(allLicenseDependencies)];
    if (uniqueLicenses.length > 0) {
      suggestions.push(`Required licenses: ${uniqueLicenses.join(', ')}`);
    }

    setCrossStepValidationResults({ errors, warnings, suggestions });

    // Track validation results
    trackProductSelection('cross_step_validation', '', {
      errorsCount: errors.length,
      warningsCount: warnings.length,
      suggestionsCount: suggestions.length,
      validationPassed: errors.length === 0,
    });

    return { errors, warnings, suggestions };
  }, [selectedProducts, proposalMetadata, teamData, contentData, trackProductSelection]);

  // Stable update function to prevent infinite loops
  const handleUpdate = useCallback((formattedData: ProposalWizardStep4Data) => {
    const dataHash = JSON.stringify(formattedData);

    if (dataHash !== lastSentDataRef.current) {
      lastSentDataRef.current = dataHash;
      onUpdateRef.current(formattedData);
    }
  }, []);

  // Update parent component when form data changes with cross-step validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const selectedProductsArray = Array.from(selectedProducts.values());
      const totalValue = selectedProductsArray.reduce(
        (sum, product) => sum + product.totalPrice,
        0
      );

      const validationResults = performCrossStepValidation();

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
        aiRecommendationsUsed: showAIRecommendations ? 1 : 0,
        searchHistory: data.searchHistory || [],
        crossStepValidation: {
          teamCompatibility: validationResults.errors.filter(e => e.includes('team')).length === 0,
          contentAlignment:
            validationResults.errors.filter(e => e.includes('content')).length === 0,
          budgetCompliance: validationResults.errors.filter(e => e.includes('value')).length === 0,
          timelineRealistic: true, // Would be calculated based on delivery timelines
        },
      };

      handleUpdate(formattedData);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    selectedProducts,
    data.searchHistory,
    handleUpdate,
    performCrossStepValidation,
    showAIRecommendations,
  ]);

  // Filter products based on search query and category with enhanced filtering
  useEffect(() => {
    let filtered = ENHANCED_PRODUCT_CATALOG.filter(
      product => product.isVisible && product.status === 'ACTIVE'
    );

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by search query with enhanced matching
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.productId.toLowerCase().includes(query) ||
          product.features.some(feature => feature.toLowerCase().includes(query)) ||
          product.customizations.some(custom => custom.toLowerCase().includes(query))
      );
    }

    // Sort by featured status and success rate
    filtered.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return (b.successRate || 0) - (a.successRate || 0);
    });

    setFilteredProducts(filtered);

    // Track search analytics
    if (searchQuery.trim()) {
      trackProductSelection('search_performed', '', {
        query: searchQuery,
        resultsCount: filtered.length,
        selectedCategory,
      });
    }
  }, [searchQuery, selectedCategory, trackProductSelection]);

  // Enhanced AI recommendations based on cross-step data
  const generateAIRecommendations = useCallback(async () => {
    setIsLoadingRecommendations(true);
    setShowAIRecommendations(false);

    try {
      // Simulate AI processing with cross-step context
      await new Promise(resolve => setTimeout(resolve, 2000));

      const context = {
        projectType: proposalMetadata?.projectType,
        estimatedValue: proposalMetadata?.estimatedValue,
        teamExpertise:
          teamData?.subjectMatterExperts?.map((expert: any) => expert.expertiseArea) || [],
        contentTopics:
          contentData?.selectedContent?.flatMap((content: any) => content.item.tags) || [],
        currentSelections: Array.from(selectedProducts.keys()),
      };

      // Generate recommendations based on context
      const recommendations = ENHANCED_PRODUCT_CATALOG.filter(
        product => !selectedProducts.has(product.id)
      )
        .filter(product => {
          // Filter based on project type
          if (context.projectType === 'consulting') {
            return product.category === 'Services';
          }
          if (context.projectType === 'development') {
            return product.category === 'Software' || product.category === 'Services';
          }
          return true;
        })
        .slice(0, 3);

      setShowAIRecommendations(true);

      trackProductSelection('ai_recommendations_generated', '', {
        recommendationsCount: recommendations.length,
        context,
        processingTime: 2000,
      });
    } catch (error) {
      console.error('AI recommendation error:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [proposalMetadata, teamData, contentData, selectedProducts, trackProductSelection]);

  // Add product to selection with enhanced validation
  const addProduct = useCallback(
    (product: Product) => {
      const selectedProduct: SelectedProduct = {
        id: product.id,
        name: product.name,
        productId: product.productId,
        category: product.category,
        quantity: 1,
        unitPrice: product.unitPrice,
        totalPrice: product.unitPrice,
        priceModel: product.priceModel,
        configuration: {},
        customizations: [],
        notes: '',
      };

      setSelectedProducts(prev => new Map(prev.set(product.id, selectedProduct)));

      trackProductSelection('product_added', product.id, {
        unitPrice: product.unitPrice,
        category: product.category,
        successRate: product.successRate,
        isFeatured: product.isFeatured,
        priceModel: product.priceModel,
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

  // Update product quantity with price recalculation
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

  // Update product customizations
  const updateProductCustomizations = useCallback(
    (productId: string, customizations: string[]) => {
      setSelectedProducts(prev => {
        const newMap = new Map(prev);
        const product = newMap.get(productId);
        if (product) {
          // Calculate additional cost from customizations
          const catalogProduct = ENHANCED_PRODUCT_CATALOG.find(p => p.id === productId);
          let additionalCost = 0;

          if (catalogProduct) {
            customizations.forEach(customization => {
              const customMatch = catalogProduct.customizations.find(c =>
                c.includes(customization)
              );
              if (customMatch) {
                const costMatch = customMatch.match(/\+\$(\d+)/);
                if (costMatch) {
                  additionalCost += parseInt(costMatch[1]);
                }
              }
            });
          }

          const updatedProduct = {
            ...product,
            customizations,
            totalPrice: (product.unitPrice + additionalCost) * product.quantity,
          };
          newMap.set(productId, updatedProduct);
        }
        return newMap;
      });

      trackProductSelection('customizations_updated', productId, {
        customizations: customizations.length,
        customizationList: customizations,
      });
    },
    [trackProductSelection]
  );

  // Calculate total value with validation
  const totalValue = useMemo(() => {
    return Array.from(selectedProducts.values()).reduce(
      (sum, product) => sum + product.totalPrice,
      0
    );
  }, [selectedProducts]);

  const selectedProductsArray = Array.from(selectedProducts.values());

  return (
    <div className="space-y-8">
      {/* Cross-step Validation Results */}
      {(crossStepValidationResults.errors.length > 0 ||
        crossStepValidationResults.warnings.length > 0 ||
        crossStepValidationResults.suggestions.length > 0) && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-yellow-500" />
              Cross-step Validation
            </h3>

            {crossStepValidationResults.errors.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-red-700 mb-2">Errors (Must Fix)</h4>
                <ul className="space-y-1">
                  {crossStepValidationResults.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-600 flex items-start">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {crossStepValidationResults.warnings.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-yellow-700 mb-2">
                  Warnings (Should Review)
                </h4>
                <ul className="space-y-1">
                  {crossStepValidationResults.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-600 flex items-start">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {crossStepValidationResults.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-blue-700 mb-2">Suggestions (Consider)</h4>
                <ul className="space-y-1">
                  {crossStepValidationResults.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-blue-600 flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* AI Recommendations */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
              <SparklesIcon className="w-5 h-5 mr-2" />
              AI Product Recommendations
            </h3>
            <Button
              variant="secondary"
              onClick={generateAIRecommendations}
              disabled={isLoadingRecommendations}
              loading={isLoadingRecommendations}
              className="flex items-center"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Generate Recommendations
            </Button>
          </div>

          {showAIRecommendations && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredProducts
                .filter(product => !selectedProducts.has(product.id))
                .slice(0, 3)
                .map(product => (
                  <div
                    key={product.id}
                    className="border border-blue-200 rounded-lg p-4 bg-blue-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-blue-900">{product.name}</h4>
                      {product.isFeatured && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-blue-700 mb-3">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">
                        ${product.unitPrice.toLocaleString()} {product.pricingUnit}
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => addProduct(product)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </Card>

      {/* Enhanced Product Catalog */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center">
            <CubeIcon className="w-5 h-5 mr-2" />
            Product Catalog ({filteredProducts.length} available)
          </h3>

          {/* Enhanced Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products, features, or categories..."
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

          {/* Enhanced Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Pricing</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Success Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="flex items-center mb-1">
                          <p className="font-medium text-gray-900">{product.name}</p>
                          {product.isFeatured && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{product.description}</p>
                        <div className="flex items-center space-x-2">
                          <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                            {product.category}
                          </span>
                          {product.subCategory && (
                            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {product.subCategory}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          ${product.unitPrice.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">{product.pricingUnit}</p>
                        <p className="text-xs text-gray-500">{product.priceModel} pricing</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${product.successRate || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-700">{product.successRate || 0}%</span>
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

      {/* Enhanced Selected Products */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">
              Selected Products ({selectedProductsArray.length})
            </h3>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">${totalValue.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
          </div>

          {selectedProductsArray.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Qty</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Price</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Customizations
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProductsArray.map(product => (
                      <tr key={product.id} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-600">{product.productId}</p>
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
                            <p className="text-xs text-gray-500">{product.priceModel}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {product.customizations.length > 0 ? (
                              product.customizations.map((customization, index) => (
                                <span
                                  key={index}
                                  className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mr-1"
                                >
                                  {customization}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">None</span>
                            )}
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

              {/* Enhanced Summary */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedProductsArray.length}
                    </div>
                    <div className="text-sm text-gray-600">Products Selected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      ${totalValue.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(
                        selectedProductsArray.reduce((sum, product) => {
                          const catalogProduct = ENHANCED_PRODUCT_CATALOG.find(
                            p => p.id === product.id
                          );
                          return sum + (catalogProduct?.successRate || 0);
                        }, 0) / selectedProductsArray.length
                      )}
                      %
                    </div>
                    <div className="text-sm text-gray-600">Avg Success Rate</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CubeIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No products selected yet.</p>
              <p className="text-sm">Add products from the catalog above to get started.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
