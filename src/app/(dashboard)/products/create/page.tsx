'use client';

import { ProductCreationForm } from '@/components/products/ProductCreationForm';
import { Button } from '@/components/ui/forms/Button';
import { useCreateProduct } from '@/hooks/useProducts';
import { CreateProductData } from '@/types/entities/product';
import { ArrowLeft, CheckCircle, Package, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

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
      toast.success('Product created successfully!');

      console.log('Product created successfully:', result);

      // Auto-navigate back after success
      setTimeout(() => {
        router.push('/products');
      }, 3000);
    } catch (error) {
      console.error('Failed to create product:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create product. Please try again.';
      toast.error(errorMessage);
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
          </div>
        </div>
      </div>

      {/* Success State */}
      {creationSuccess && createdProduct && (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-green-900 mb-2">
                Product Created Successfully!
              </h2>
              <p className="text-green-700 mb-4">
                {createdProduct.name} (SKU: {createdProduct.sku}) has been added to your catalog.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/products">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    View All Products
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreationSuccess(false);
                    setCreatedProduct(null);
                    setIsFormOpen(true);
                  }}
                >
                  Create Another Product
                </Button>
              </div>
              <p className="text-sm text-green-600 mt-4">
                Redirecting to product catalog in 3 seconds...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Phase 3 Status Card - Only show when form is not success */}
      {!creationSuccess && (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-blue-900">
                    Phase 3: Complete Integration
                  </h2>
                  <div className="text-blue-700 text-sm mt-1">
                    <p className="font-medium">
                      Responsive UI ✅ | Navigation Integration ✅ | Database Ready ✅
                    </p>
                  </div>
                </div>
                <div className="text-sm text-blue-600 sm:text-right">
                  <p>Fully Responsive Design</p>
                  <p>Mobile-First Approach</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Container */}
      {!creationSuccess && (
        <div className="px-4 sm:px-6 lg:px-8 pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Mobile-optimized form header */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
                  <div className="text-sm text-gray-500">All fields marked with * are required</div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6">
                {createProductMutation.isPending ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Creating Product...</h3>
                    <p className="text-gray-600">
                      Please wait while we save your product information.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="max-w-md mx-auto">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Ready to Create Product
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Click the button below to open the product creation form.
                      </p>
                      <Button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Open Product Form
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Creation Form Modal - Responsive */}
      <ProductCreationForm
        isOpen={isFormOpen && !creationSuccess}
        onClose={handleClose}
        onSubmit={handleProductSubmit}
      />
    </div>
  );
}
