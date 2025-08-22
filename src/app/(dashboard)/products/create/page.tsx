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
import dynamic from 'next/dynamic';
import { logDebug } from '@/lib/logger';

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

import { useCreateProduct } from '@/hooks/useProducts';
import { CreateProductData } from '@/types/entities/product';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';

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
      d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
    />
  </svg>
);

const Settings = ({ className = 'h-5 w-5' }) => (
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
      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Simple toast function to replace sonner
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  logDebug(`Toast (${type}):`, { message });
  // In a real implementation, this would show a toast notification
};

export default function ProductCreationPage() {
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [creationSuccess, setCreationSuccess] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<CreateProductData | null>(null);
  const router = useRouter();

  // Use React Query mutation for product creation
  const createProductMutation = useCreateProduct();

  const handleProductSubmit = async (data: CreateProductData) => {
    try {
      const result = await createProductMutation.mutateAsync(data);

      setCreatedProduct(data);
      setCreationSuccess(true);
      setIsFormOpen(false);

      // Show success toast
      showToast('Product created successfully!');

      logDebug('Product created successfully:', { result });

      // Auto-navigate back after success
      setTimeout(() => {
        router.push('/products');
      }, 3000);
    } catch (error) {
      ErrorHandlingService.getInstance().processError(
        error as Error,
        'Failed to create product. Please try again.',
        ErrorCodes.BUSINESS.PROCESS_FAILED,
        {
          component: 'ProductCreationPage',
          operation: 'handleProductSubmit',
          context: { productData: data }
        }
      );
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create product. Please try again.';
      showToast(errorMessage, 'error');
    }
  };

  const handleClose = () => {
    if (!createProductMutation.isPending) {
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
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {isFormOpen && !creationSuccess && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Settings className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Product Details</h2>
                      <p className="text-sm text-gray-600">Fill in the product information below</p>
                    </div>
                  </div>
                </div>
              </div>

              <ProductCreationForm
                isOpen={true}
                inline={true}
                onClose={handleClose}
                onSubmit={handleProductSubmit}
              />
            </div>
          )}

          {/* Success State */}
          {creationSuccess && createdProduct && (
            <div className="bg-white rounded-lg shadow-sm border border-green-200">
              <div className="px-6 py-8 text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Product Created Successfully!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your new product "{createdProduct.name}" has been added to the catalog.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => router.push('/products')}
                    variant="primary"
                    className="flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    View All Products
                  </Button>
                  <Button
                    onClick={() => {
                      setCreationSuccess(false);
                      setIsFormOpen(true);
                      setCreatedProduct(null);
                    }}
                    variant="secondary"
                  >
                    Create Another Product
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
