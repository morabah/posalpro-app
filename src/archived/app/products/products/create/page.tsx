/**
 * PosalPro MVP2 - Product Creation Page
 * Product creation interface with form validation
 * Based on PRODUCT_MANAGEMENT_SCREEN.md wireframe specifications
 *
 * User Stories: US-3.1, US-3.2, US-3.3
 * Hypotheses: H5 (40% product creation efficiency), H6 (50% decision speed improvement)
 * Component Traceability: ProductCreationForm, ProductValidation, CategoryManagement
 */

'use client';

import { Button } from '@/components/ui/forms/Button';
import { useRBAC } from '@/hooks/auth/useRBAC';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useProductCreate } from '@/hooks/useProduct';
import { logDebug } from '@/lib/logger';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

// Dynamic import for heavy ProductCreationForm
const ProductCreationForm = dynamic(
  () =>
    import('@/components/products/ProductCreationForm').then(mod => ({
      default: mod.ProductCreationForm,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading product form...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

// Inline SVG components to replace Lucide React and prevent webpack chunk loading issues
const ArrowLeft = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const Package = ({ className = 'h-6 w-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
    />
  </svg>
);

const CheckCircle = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export default function ProductCreationPage() {
  const router = useRouter();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { canCreate, isAdmin } = useRBAC();

  // New bridge hook
  const createMutation = useProductCreate();

  // Local state
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [creationSuccess, setCreationSuccess] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<any>(null);

  // ====================
  // RBAC Validation
  // ====================

  if (!canCreate('products') && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to create products. Please contact your administrator.
            </p>
            <Button onClick={() => router.push('/products')} variant="primary" className="w-full">
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleProductSubmit = async (data: any) => {
    try {
      analytics(
        'product_creation_initiated',
        {
          userStory: 'US-3.1',
          hypothesis: 'H5',
          productData: data,
        },
        'medium'
      );

      const result = await createMutation.mutateAsync(data);

      setCreatedProduct(result);
      setCreationSuccess(true);
      setIsFormOpen(false);

      toast.success('Product created successfully!');

      logDebug('Product created successfully:', { result });

      analytics(
        'product_creation_success',
        {
          userStory: 'US-3.1',
          hypothesis: 'H5',
          productId: result.id,
        },
        'high'
      );

      // Auto-navigate back after success
      setTimeout(() => {
        router.push('/products');
      }, 3000);
    } catch (error) {
      analytics(
        'product_creation_failed',
        {
          userStory: 'US-3.1',
          hypothesis: 'H5',
          error: error instanceof Error ? error.message : String(error),
        },
        'high'
      );

      toast.error('Failed to create product. Please try again.');
    }
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      router.push('/products');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/products"
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Create New Product</h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Add a new product to your catalog
                </p>
              </div>
            </div>

            {/* Mobile-friendly breadcrumb */}
            <div className="hidden sm:flex items-center text-sm text-gray-500">
              <Link href="/products" className="hover:text-gray-700">
                Products
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">Create</span>
            </div>

            {/* Success indicator */}
            {creationSuccess && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Product Created!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isFormOpen ? (
          <ProductCreationForm
            isOpen={isFormOpen}
            onClose={handleClose}
            onSubmit={handleProductSubmit}
            inline={true}
          />
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Created Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your new product has been added to the catalog. You'll be redirected to the products
              list shortly.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => router.push('/products')} variant="primary">
                View All Products
              </Button>
              <Button onClick={() => setIsFormOpen(true)} variant="outline">
                Create Another Product
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
