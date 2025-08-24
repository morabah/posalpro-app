/**
 * PosalPro MVP2 - Product Management Page
 * Administrative interface for managing products and catalog
 * PHASE 1 IMPLEMENTATION: Full CRUD Operations with ErrorHandlingService
 */

'use client';

import {
  ProductManagementManagementBridge,
  useProductManagementBridge,
} from '@/components/bridges/ProductManagementBridge';
import { Breadcrumbs } from '@/components/layout';
import { useAuth } from '@/components/providers/AuthProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useResponsive } from '@/hooks/useResponsive';
import type { Product } from '@/lib/bridges/ProductApiBridge';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import { CreateProductData, Product as EntityProduct } from '@/types/entities/product';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// Dynamic imports to reduce bundle size
const ProductCreationForm = dynamic(
  () =>
    import('@/components/products/ProductCreationForm').then(mod => ({
      default: mod.ProductCreationForm,
    })),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />,
    ssr: false,
  }
);
const CircleStackIcon = dynamic(
  () => import('@heroicons/react/24/outline').then(m => m.CircleStackIcon),
  { ssr: false }
);
const CogIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.CogIcon), {
  ssr: false,
});
const PencilIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.PencilIcon), {
  ssr: false,
});
const PlusIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.PlusIcon), {
  ssr: false,
});
const TrashIcon = dynamic(() => import('@heroicons/react/24/outline').then(m => m.TrashIcon), {
  ssr: false,
});

// Component Traceability Matrix - Enhanced with CRUD operations
// Note: Used for analytics tracking and component traceability
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const COMPONENT_MAPPING = {
  userStories: ['US-6.4', 'US-6.5', 'US-3.2'],
  acceptanceCriteria: ['AC-6.4.1', 'AC-6.5.1', 'AC-3.2.1', 'AC-3.2.2'],
  methods: [
    'manageProducts()',
    'editProductCatalog()',
    'trackProductChanges()',
    'createProduct()',
    'updateProduct()',
    'deleteProduct()',
    'autoDetectLicenses()',
    'checkDependencies()',
    'calculateImpact()',
  ],
  hypotheses: ['H12', 'H8'],
  testCases: ['TC-H12-001', 'TC-H8-002'],
} as const;

export default function ProductManagementPage() {
  // Note: user and isAuthenticated are available for future RBAC implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user: _user, isAuthenticated: _isAuthenticated } = useAuth();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const errorHandlingService = ErrorHandlingService.getInstance();
  const [sessionStartTime] = useState(Date.now());
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EntityProduct | null>(null);
  // Note: Modal states reserved for future feature implementation
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBulkOperationsModalOpen, setIsBulkOperationsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([
    'Software',
    'Hardware',
    'Services',
    'Licensing',
  ]);

  // ✅ FIXED: Use centralized responsive hook instead of manual detection
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Product management bridge - with context safety
  let bridge;
  try {
    bridge = useProductManagementBridge();
  } catch (error) {
    // Bridge context not available yet - return loading state
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading product management...</p>
        </div>
      </div>
    );
  }

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // Load products on component mount
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await bridge.fetchProducts({ limit: 100 });
        if (result.success && result.data) {
          setProducts(result.data);
        } else {
          setError(new Error('Failed to fetch products'));
        }
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []); // Empty dependency array to prevent infinite loops

  // Refetch function for manual refresh
  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await bridge.fetchProducts({ limit: 100 });
      if (result.success && result.data) {
        setProducts(result.data);
      } else {
        setError(new Error('Failed to fetch products'));
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array to prevent infinite loops

  const trackAction = useCallback(
    (action: string, metadata: Record<string, unknown> = {}) => {
      analytics(
        'product_management_action',
        {
          action,
          metadata: {
            ...metadata,
            component: 'ProductManagementPage',
            userStory: 'US-6.4',
            hypothesis: 'H12',
            sessionDuration: Date.now() - sessionStartTime,
          },
        },
        'low'
      );
    },
    [sessionStartTime, analytics]
  );

  // Enhanced error handling for product operations
  const handleError = useCallback(
    (error: unknown, operation: string, context?: Record<string, unknown>) => {
      const standardError =
        error instanceof Error
          ? new StandardError({
              code: ErrorCodes.VALIDATION.OPERATION_FAILED,
              message: `Product ${operation} failed: ${error.message}`,
              cause: error,
              metadata: { operation, context, component: 'ProductManagementPage' },
            })
          : new StandardError({
              code: ErrorCodes.VALIDATION.OPERATION_FAILED,
              message: `Product ${operation} failed: Unknown error`,
              metadata: { operation, context, component: 'ProductManagementPage' },
            });

      errorHandlingService.processError(standardError);

      const userMessage = errorHandlingService.getUserFriendlyMessage(standardError);
      toast.error(userMessage);

      trackAction(`${operation}_error`, { error: standardError.message, context });
    },
    [errorHandlingService, trackAction]
  );

  // Product creation handler
  const handleCreateProduct = useCallback(
    async (data: CreateProductData) => {
      try {
        trackAction('create_product_started', { productData: data });

        // Use bridge's createProductWithValidation method
        const newProduct = await bridge.createProductWithValidation(data as any);

        if (newProduct) {
          toast.success('Product created successfully');
          trackAction('create_product_success', { productId: newProduct.id });
          setIsCreateFormOpen(false);
          // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
          setTimeout(() => {
            bridge.refreshProducts();
          }, 0);
        }
      } catch (error) {
        handleError(error, 'creation', { productData: data });
      }
    },
    [bridge, trackAction, handleError]
  );

  // Product update handler
  const handleUpdateProduct = useCallback(
    async (productId: string, data: Partial<CreateProductData>) => {
      try {
        trackAction('update_product_started', { productId, updates: data });

        // Use bridge's updateProduct method
        const updatedProduct = await bridge.updateProduct(productId, data as any);

        if (updatedProduct) {
          toast.success('Product updated successfully');
          trackAction('update_product_success', { productId: updatedProduct.id });
          setEditingProduct(null);
          // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
          setTimeout(() => {
            bridge.refreshProducts();
          }, 0);
        }
      } catch (error) {
        handleError(error, 'update', { productId, updates: data });
      }
    },
    [bridge, trackAction, handleError]
  );

  // Product deletion handler with confirmation
  const handleDeleteProduct = useCallback(
    async (productId: string, productName: string) => {
      if (
        !confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)
      ) {
        trackAction('delete_product_cancelled', { productId });
        return;
      }

      try {
        trackAction('delete_product_started', { productId });

        // Use bridge's deleteProduct method
        const success = await bridge.deleteProduct(productId);

        if (success) {
          toast.success('Product deleted successfully');
          trackAction('delete_product_success', { productId });
          // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
          setTimeout(() => {
            bridge.refreshProducts();
          }, 0);
        }
      } catch (error) {
        handleError(error, 'deletion', { productId });
      }
    },
    [bridge, trackAction, handleError]
  );

  // Management action handlers
  const handleAddProduct = useCallback(() => {
    trackAction('add_product_clicked');
    setIsCreateFormOpen(true);
  }, [trackAction]);

  const handleManageCategories = useCallback(() => {
    trackAction('manage_categories_clicked');
    setIsCategoryModalOpen(true);
  }, [trackAction]);

  const handleBulkOperations = useCallback(() => {
    trackAction('bulk_operations_clicked');
    setIsBulkOperationsModalOpen(true);
  }, [trackAction]);

  const handleEditProduct = useCallback(
    (product: Product) => {
      // ✅ FIXED: Accept hook's Product type, convert as needed
      trackAction('edit_product_clicked', { productId: product.id });

      // ✅ FIXED: Safe object spread with null checks
      const safeProduct = product || {};

      // Convert string dates to Date objects for entity compatibility
      const entityProduct = {
        id: safeProduct.id || '',
        name: safeProduct.name || '',
        description: safeProduct.description || '',
        sku: safeProduct.sku || '',
        price: safeProduct.price || 0,
        cost: safeProduct.cost || 0,
        status: safeProduct.status || 'draft',
        weight: safeProduct.weight || 0,
        dimensions: safeProduct.dimensions || { length: 0, width: 0, height: 0 },
        category: Array.isArray(safeProduct.category)
          ? safeProduct.category
          : [safeProduct.category || ''],
        tags: Array.isArray(safeProduct.tags) ? safeProduct.tags : [],
        images: Array.isArray(safeProduct.images) ? safeProduct.images : [],
        createdAt: new Date(safeProduct.createdAt || Date.now()),
        updatedAt: new Date(safeProduct.updatedAt || Date.now()),
        currency: (safeProduct as any).currency || 'USD',
        isActive: safeProduct.status === 'active',
        version: (safeProduct as any).version || '1.0',
        userStoryMappings: Array.isArray((safeProduct as any).userStoryMappings)
          ? (safeProduct as any).userStoryMappings
          : [],
      } as EntityProduct;

      setEditingProduct(entityProduct);
      setIsCreateFormOpen(true);
    },
    [trackAction]
  );

  // Display loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const managementActions = [
    {
      id: 'add-product',
      title: 'Add New Product',
      description: 'Create a new product in the catalog',
      icon: PlusIcon,
      action: handleAddProduct,
    },
    {
      id: 'manage-categories',
      title: 'Manage Categories',
      description: 'Organize products into categories',
      icon: CircleStackIcon,
      action: handleManageCategories,
    },
    {
      id: 'bulk-operations',
      title: 'Bulk Operations',
      description: 'Perform operations on multiple products',
      icon: CogIcon,
      action: handleBulkOperations,
    },
  ];

  return (
    <ProductManagementManagementBridge>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Breadcrumbs className="mb-4" />
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
              <p className="text-gray-600 mt-1">Manage your product catalog and configurations</p>
            </div>
            <Button
              onClick={handleAddProduct}
              variant="primary"
              className="flex items-center min-h-[44px]"
              aria-label="Add new product"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              {isMobile ? 'Add' : 'Add Product'}
            </Button>
          </div>
        </div>

        {/* Management Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {managementActions.map(action => {
            const IconComponent = action.icon;
            return (
              <Card key={action.id} className="hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <IconComponent className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{action.description}</p>
                  <Button
                    onClick={action.action}
                    variant="primary"
                    className="w-full min-h-[44px]"
                    aria-label={action.title}
                  >
                    {action.title}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Products Table */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Recent Products</h3>

            {products.length === 0 ? (
              <div className="text-center py-12">
                <PlusIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first product.
                </p>
                <div className="mt-6">
                  <Button onClick={handleAddProduct} variant="primary">
                    <PlusIcon className="w-4 w-4 mr-2" />
                    Create Product
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.slice(0, 10).map(product => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {Array.isArray(product.category)
                              ? product.category.join(', ')
                              : product.category}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              product.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {(product.currency || 'USD') +
                            ' ' +
                            (product.price || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-blue-600 hover:text-blue-900 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                              title="Edit product"
                              aria-label={`Edit ${product.name}`}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              className="text-red-600 hover:text-red-900 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                              title="Delete product"
                              aria-label={`Delete ${product.name}`}
                              disabled={isLoading}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Enhanced Notice */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Product Management Features
                </h4>
                <p className="text-gray-600 mb-4">
                  Core CRUD operations are now fully functional. Additional features being
                  developed.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">✅ Product creation and editing</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">✅ Product deletion</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">🔄 Advanced category management</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      🔄 Bulk operations and import/export
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Product Creation/Edit Form Modal */}
        <ProductCreationForm
          isOpen={isCreateFormOpen}
          onClose={() => {
            setIsCreateFormOpen(false);
            setEditingProduct(null);
          }}
          onSubmit={
            editingProduct
              ? data => handleUpdateProduct(editingProduct.id, data)
              : handleCreateProduct
          }
          initialData={
            editingProduct
              ? {
                  name: editingProduct.name,
                  description: editingProduct.description || '',
                  price: editingProduct.price,
                  currency: editingProduct.currency,
                  category: Array.isArray(editingProduct.category)
                    ? editingProduct.category
                    : [editingProduct.category],
                  sku: editingProduct.sku,
                  isActive: editingProduct.isActive,
                }
              : undefined
          }
        />
      </div>
    </ProductManagementManagementBridge>
  );
}
