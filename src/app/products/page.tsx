/**
 * PosalPro MVP2 - Product Management Interface
 * Based on PRODUCT_MANAGEMENT_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H8 hypothesis validation
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import {
  ArrowDownTrayIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PhotoIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-3.2', 'US-3.1', 'US-1.2'],
  acceptanceCriteria: ['AC-3.2.1', 'AC-3.2.2', 'AC-3.2.3', 'AC-3.1.1', 'AC-1.2.1'],
  methods: [
    'autoDetectLicenses()',
    'checkDependencies()',
    'calculateImpact()',
    'searchProducts()',
    'validateConfiguration()',
    'trackCalculationTime()',
  ],
  hypotheses: ['H8'],
  testCases: ['TC-H8-002', 'TC-H8-001', 'TC-H1-002'],
};

// Product interfaces
enum ProductCategory {
  SECURITY = 'Security',
  SERVICES = 'Services',
  SOFTWARE = 'Software',
  HARDWARE = 'Hardware',
  CONSULTING = 'Consulting',
}

enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

enum PriceModel {
  FIXED = 'fixed',
  HOURLY = 'hourly',
  SUBSCRIPTION = 'subscription',
}

interface ProductOption {
  id: string;
  name: string;
  type: 'single_select' | 'multi_select' | 'text_input' | 'number_input';
  choices: Array<{
    label: string;
    value: string;
    priceModifier: number;
  }>;
}

interface Product {
  id: string;
  name: string;
  productId: string;
  category: ProductCategory;
  subCategory: string;
  shortDescription: string;
  detailedDescription: string;
  status: ProductStatus;
  priceModel: PriceModel;
  basePrice: number;
  options: ProductOption[];
  resources: Array<{
    id: string;
    name: string;
    type: 'document' | 'image';
    url: string;
  }>;
  licenseDependencies: string[];
  createdAt: Date;
  createdBy: string;
  lastModified: Date;
  modifiedBy: string;
  isVisible: boolean;
  isFeatured: boolean;
  clientSpecificPricing: boolean;
}

// Mock products data
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Cloud Security Suite',
    productId: 'CS-2025-001',
    category: ProductCategory.SECURITY,
    subCategory: 'Cloud Solutions',
    shortDescription: 'Enterprise-grade cloud security solution with advanced threat detection',
    detailedDescription:
      'Comprehensive cloud security platform with AI-powered threat detection, compliance automation, and real-time monitoring capabilities.',
    status: ProductStatus.ACTIVE,
    priceModel: PriceModel.FIXED,
    basePrice: 2500,
    options: [
      {
        id: 'opt-001',
        name: 'Deployment Type',
        type: 'single_select',
        choices: [
          { label: 'Cloud-only', value: 'cloud', priceModifier: 0 },
          { label: 'Hybrid', value: 'hybrid', priceModifier: 500 },
          { label: 'On-premises', value: 'onprem', priceModifier: 1200 },
        ],
      },
    ],
    resources: [
      {
        id: 'res-001',
        name: 'Security_Whitepaper.pdf',
        type: 'document',
        url: '/docs/security-whitepaper.pdf',
      },
      {
        id: 'res-002',
        name: 'Dashboard_Screenshot.png',
        type: 'image',
        url: '/images/dashboard-screenshot.png',
      },
    ],
    licenseDependencies: ['Enterprise Security License', 'Cloud Platform License'],
    createdAt: new Date('2024-04-10'),
    createdBy: 'Mohamed Rabah',
    lastModified: new Date('2024-05-22'),
    modifiedBy: 'Sarah Johnson',
    isVisible: true,
    isFeatured: true,
    clientSpecificPricing: false,
  },
  {
    id: 'prod-002',
    name: 'Data Migration Service',
    productId: 'DMS-2025-002',
    category: ProductCategory.SERVICES,
    subCategory: 'Data Services',
    shortDescription: 'Professional data migration and integration services',
    detailedDescription:
      'Expert-led data migration services ensuring seamless transition with minimal downtime and data integrity validation.',
    status: ProductStatus.ACTIVE,
    priceModel: PriceModel.HOURLY,
    basePrice: 175,
    options: [
      {
        id: 'opt-002',
        name: 'Data Volume',
        type: 'single_select',
        choices: [
          { label: 'Up to 1TB', value: 'small', priceModifier: 0 },
          { label: '1-10TB', value: 'medium', priceModifier: 25 },
          { label: '10TB+', value: 'large', priceModifier: 50 },
        ],
      },
    ],
    resources: [
      {
        id: 'res-003',
        name: 'Migration_Methodology.pdf',
        type: 'document',
        url: '/docs/migration-methodology.pdf',
      },
    ],
    licenseDependencies: ['Data Processing License'],
    createdAt: new Date('2024-03-15'),
    createdBy: 'Alex Chen',
    lastModified: new Date('2024-06-01'),
    modifiedBy: 'Mohamed Rabah',
    isVisible: true,
    isFeatured: false,
    clientSpecificPricing: true,
  },
  {
    id: 'prod-003',
    name: 'AI Analytics Dashboard',
    productId: 'AAD-2025-003',
    category: ProductCategory.SOFTWARE,
    subCategory: 'Analytics',
    shortDescription: 'AI-powered business intelligence dashboard',
    detailedDescription:
      'Advanced analytics platform with machine learning capabilities for predictive insights and automated reporting.',
    status: ProductStatus.DRAFT,
    priceModel: PriceModel.SUBSCRIPTION,
    basePrice: 950,
    options: [
      {
        id: 'opt-003',
        name: 'User Licenses',
        type: 'number_input',
        choices: [{ label: 'Per User/Month', value: 'per_user', priceModifier: 95 }],
      },
    ],
    resources: [
      {
        id: 'res-004',
        name: 'Feature_Overview.pdf',
        type: 'document',
        url: '/docs/feature-overview.pdf',
      },
      { id: 'res-005', name: 'Demo_Video.mp4', type: 'document', url: '/videos/demo-video.mp4' },
    ],
    licenseDependencies: ['AI Platform License', 'Analytics License'],
    createdAt: new Date('2024-06-10'),
    createdBy: 'Lisa Wang',
    lastModified: new Date('2024-06-15'),
    modifiedBy: 'Lisa Wang',
    isVisible: false,
    isFeatured: false,
    clientSpecificPricing: false,
  },
  {
    id: 'prod-004',
    name: 'Network Audit Package',
    productId: 'NAP-2025-004',
    category: ProductCategory.SERVICES,
    subCategory: 'Network Services',
    shortDescription: 'Comprehensive network security audit and assessment',
    detailedDescription:
      'Full network security assessment including vulnerability scanning, penetration testing, and compliance validation.',
    status: ProductStatus.ACTIVE,
    priceModel: PriceModel.FIXED,
    basePrice: 3500,
    options: [
      {
        id: 'opt-004',
        name: 'Scope Level',
        type: 'single_select',
        choices: [
          { label: 'Basic Assessment', value: 'basic', priceModifier: 0 },
          { label: 'Advanced Audit', value: 'advanced', priceModifier: 1500 },
          { label: 'Full Penetration Test', value: 'full', priceModifier: 3000 },
        ],
      },
    ],
    resources: [
      {
        id: 'res-006',
        name: 'Audit_Checklist.pdf',
        type: 'document',
        url: '/docs/audit-checklist.pdf',
      },
      {
        id: 'res-007',
        name: 'Sample_Report.pdf',
        type: 'document',
        url: '/docs/sample-report.pdf',
      },
    ],
    licenseDependencies: ['Security Audit License', 'Penetration Testing License'],
    createdAt: new Date('2024-02-20'),
    createdBy: 'John Smith',
    lastModified: new Date('2024-05-30'),
    modifiedBy: 'Sarah Johnson',
    isVisible: true,
    isFeatured: true,
    clientSpecificPricing: true,
  },
];

// Analytics interfaces
interface ProductManagementMetrics {
  licenseDetectionTime: number;
  dependencyCheckDuration: number;
  missingComponentsDetected: number;
  pricingCalculationAccuracy: number;
  validationSpeedImprovement: number;
  productSearchTime: number;
  catalogBrowsingEfficiency: number;
  configurationComplexity: number;
  validationRuleCount: number;
  compatibilityChecks: number;
  dependencyMappingAccuracy: number;
  licensePoolUtilization: number;
  pricingVariations: number;
  productCreationTime: number;
  configurationChanges: number;
  validationOverrides: number;
  exportOperations: number;
}

export default function ProductManagement() {
  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStartTime] = useState(Date.now());

  // Analytics tracking
  const trackProductAction = useCallback(
    (action: string, metadata: any = {}) => {
      console.log('Product Management Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        sessionDuration: Date.now() - sessionStartTime,
      });
    },
    [sessionStartTime]
  );

  // Product validation metrics
  const validationMetrics = useMemo((): ProductManagementMetrics => {
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === ProductStatus.ACTIVE).length;
    const productsWithDependencies = products.filter(p => p.licenseDependencies.length > 0).length;

    return {
      licenseDetectionTime: 1.2, // Mock: 1.2 seconds average
      dependencyCheckDuration: 0.8, // Mock: 0.8 seconds
      missingComponentsDetected: 3, // Mock: 3 missing components detected
      pricingCalculationAccuracy: 98.5, // Mock: 98.5% accuracy
      validationSpeedImprovement: 23.5, // Mock: 23.5% improvement over baseline
      productSearchTime: 0.3, // Mock: 0.3 seconds search time
      catalogBrowsingEfficiency: 85.2, // Mock: 85.2% efficiency rating
      configurationComplexity: totalProducts * 2.5, // Mock complexity score
      validationRuleCount: productsWithDependencies * 3, // Mock: 3 rules per dependency
      compatibilityChecks: 156, // Mock: 156 compatibility checks performed
      dependencyMappingAccuracy: 94.8, // Mock: 94.8% mapping accuracy
      licensePoolUtilization: 67.3, // Mock: 67.3% license pool utilization
      pricingVariations: products.reduce((sum, p) => sum + p.options.length, 0),
      productCreationTime: 8.5, // Mock: 8.5 minutes average creation time
      configurationChanges: 45, // Mock: 45 configuration changes this session
      validationOverrides: 7, // Mock: 7 validation overrides
      exportOperations: 12, // Mock: 12 export operations
    };
  }, [products]);

  // Filter and search products
  useEffect(() => {
    let filtered = products;

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(searchLower) ||
          product.shortDescription.toLowerCase().includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower) ||
          product.productId.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price':
        filtered.sort((a, b) => a.basePrice - b.basePrice);
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);

    // Track search and filter actions
    if (searchTerm || selectedCategory !== 'all') {
      trackProductAction('catalog_filtered', {
        searchTerm,
        category: selectedCategory,
        resultsCount: filtered.length,
        searchTime: 0.3, // Mock search time
      });
    }
  }, [products, searchTerm, selectedCategory, sortBy, trackProductAction]);

  // Get status display
  const getStatusDisplay = (status: ProductStatus) => {
    switch (status) {
      case ProductStatus.ACTIVE:
        return { label: 'Active', color: 'text-green-600', bg: 'bg-green-100' };
      case ProductStatus.DRAFT:
        return { label: 'Draft', color: 'text-gray-600', bg: 'bg-gray-100' };
      case ProductStatus.ARCHIVED:
        return { label: 'Archived', color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { label: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  // Format price display
  const formatPrice = (product: Product) => {
    switch (product.priceModel) {
      case PriceModel.FIXED:
        return `$${product.basePrice.toLocaleString()}`;
      case PriceModel.HOURLY:
        return `$${product.basePrice}/hr`;
      case PriceModel.SUBSCRIPTION:
        return `$${product.basePrice}/mo`;
      default:
        return `$${product.basePrice}`;
    }
  };

  // Handle product creation
  const handleCreateProduct = useCallback(() => {
    trackProductAction('create_product_initiated');
    setShowCreateModal(true);
  }, [trackProductAction]);

  // Handle product view
  const handleViewProduct = useCallback(
    (product: Product) => {
      trackProductAction('product_viewed', {
        productId: product.id,
        productName: product.name,
        category: product.category,
      });
      setSelectedProduct(product);
    },
    [trackProductAction]
  );

  // Handle product edit
  const handleEditProduct = useCallback(
    (product: Product) => {
      trackProductAction('product_edit_initiated', {
        productId: product.id,
        productName: product.name,
      });
      // Would open edit modal
      console.log('Edit product:', product.id);
    },
    [trackProductAction]
  );

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      trackProductAction('product_management_loaded', {
        totalProducts: products.length,
        metrics: validationMetrics,
        loadTime: Date.now() - sessionStartTime,
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [products.length, validationMetrics, sessionStartTime, trackProductAction]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
              <p className="text-gray-600">
                {filteredProducts.length} of {products.length} products •{' '}
                {validationMetrics.validationSpeedImprovement}% validation improvement
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleCreateProduct}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Product
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  trackProductAction('import_data_initiated');
                  console.log('Import data clicked');
                }}
                className="flex items-center"
              >
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                Import Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Validation Metrics Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Validation Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <div className="p-6 text-center">
                <ClockIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {validationMetrics.licenseDetectionTime}s
                </div>
                <div className="text-sm text-gray-600">License Detection</div>
                <div className="mt-2 text-xs text-green-600">
                  +{validationMetrics.validationSpeedImprovement}% faster
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6 text-center">
                <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {validationMetrics.dependencyMappingAccuracy}%
                </div>
                <div className="text-sm text-gray-600">Mapping Accuracy</div>
                <div className="mt-2 text-xs text-gray-500">
                  {validationMetrics.compatibilityChecks} checks
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6 text-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">
                  {validationMetrics.missingComponentsDetected}
                </div>
                <div className="text-sm text-gray-600">Missing Components</div>
                <div className="mt-2 text-xs text-gray-500">Auto-detected issues</div>
              </div>
            </Card>

            <Card>
              <div className="p-6 text-center">
                <ChartBarIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  {validationMetrics.licensePoolUtilization}%
                </div>
                <div className="text-sm text-gray-600">License Utilization</div>
                <div className="mt-2 text-xs text-gray-500">Pool optimization</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  {Object.values(ProductCategory).map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="price">Price Low-High</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Product List */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Product Catalog ({filteredProducts.length} products)
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <FunnelIcon className="w-4 h-4" />
                <span>
                  Filtered by: {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
                </span>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedCategory !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Get started by creating your first product.'}
                </p>
                <Button
                  onClick={handleCreateProduct}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Product
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dependencies
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map(product => {
                      const statusDisplay = getStatusDisplay(product.status);

                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.productId}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {product.shortDescription}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm text-gray-900">{product.category}</div>
                              <div className="text-sm text-gray-500">{product.subCategory}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {formatPrice(product)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.priceModel} pricing
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusDisplay.bg} ${statusDisplay.color}`}
                            >
                              {statusDisplay.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {product.licenseDependencies.length} licenses
                            </div>
                            {product.licenseDependencies.length > 0 && (
                              <div className="text-sm text-gray-500">
                                {product.licenseDependencies[0]}
                                {product.licenseDependencies.length > 1 &&
                                  ` +${product.licenseDependencies.length - 1} more`}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleViewProduct(product)}
                              >
                                <EyeIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleEditProduct(product)}
                              >
                                <PencilIcon className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {filteredProducts.length > 0 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Showing {filteredProducts.length} of {products.length} products
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="secondary" size="sm" disabled>
                    Previous
                  </Button>
                  <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</span>
                  <Button variant="secondary" size="sm">
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Product Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create New Product</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center py-12">
                <Cog6ToothIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Product Creation Form</h3>
                <p className="text-gray-600 mb-4">
                  This would contain the full product creation form with:
                </p>
                <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
                  <li>• Product information fields</li>
                  <li>• Pricing configuration</li>
                  <li>• Customization options</li>
                  <li>• Resource attachments</li>
                  <li>• License dependency mapping</li>
                  <li>• Visibility and status settings</li>
                  <li>• AI-assisted description generation</li>
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCreateModal(false)}>Save Draft</Button>
              <Button
                onClick={() => {
                  trackProductAction('product_created', {
                    creationTime: validationMetrics.productCreationTime,
                    licenseValidationTime: validationMetrics.licenseDetectionTime,
                  });
                  setShowCreateModal(false);
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Save and Activate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedProduct.name}</h2>
                  <p className="text-gray-600">{selectedProduct.productId}</p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Product Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <p className="text-sm text-gray-900">{selectedProduct.category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sub-category</label>
                    <p className="text-sm text-gray-900">{selectedProduct.subCategory}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="text-sm text-gray-900">{selectedProduct.detailedDescription}</p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Base Price</label>
                    <p className="text-sm text-gray-900">{formatPrice(selectedProduct)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price Model</label>
                    <p className="text-sm text-gray-900 capitalize">
                      {selectedProduct.priceModel} pricing
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Customization Options
                    </label>
                    <div className="space-y-2">
                      {selectedProduct.options.map(option => (
                        <div key={option.id} className="text-sm text-gray-900">
                          • {option.name} ({option.choices.length} choices)
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* License Dependencies */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">License Dependencies</h3>
                <div className="space-y-2">
                  {selectedProduct.licenseDependencies.map((license, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-900">{license}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Resources & Documentation
                </h3>
                <div className="space-y-2">
                  {selectedProduct.resources.map(resource => (
                    <div key={resource.id} className="flex items-center space-x-2">
                      {resource.type === 'document' ? (
                        <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                      ) : (
                        <PhotoIcon className="w-4 h-4 text-green-600" />
                      )}
                      <span className="text-sm text-gray-900">{resource.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product History */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Product History</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block font-medium text-gray-700">Created</label>
                    <p className="text-gray-900">
                      {selectedProduct.createdAt.toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">By: {selectedProduct.createdBy}</p>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700">Last Modified</label>
                    <p className="text-gray-900">
                      {selectedProduct.lastModified.toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">By: {selectedProduct.modifiedBy}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setSelectedProduct(null)}>
                Close
              </Button>
              <Button onClick={() => handleEditProduct(selectedProduct)}>Edit Product</Button>
              <Button
                onClick={() => {
                  trackProductAction('product_cloned', {
                    originalProductId: selectedProduct.id,
                    originalProductName: selectedProduct.name,
                  });
                  console.log('Clone product:', selectedProduct.id);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Clone Product
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
