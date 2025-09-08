/**
 * Refactored Product Create Form
 * Uses "Composition over Inheritance" pattern
 * Component Traceability: US-4.1, H5
 */

'use client';

import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { FormActions, FormErrorSummary } from '@/components/ui/FormField';
import { Button } from '@/components/ui/forms/Button';
import type { ProductCreate } from '@/features/products';
import { useCreateProduct } from '@/features/products/hooks/useProducts';
import { analytics } from '@/lib/analytics';
import { ProductCreateSchema } from '@/features/products/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export function ProductCreateFormRefactored() {
  const router = useRouter();
  const createProduct = useCreateProduct();

  // ✅ REACT HOOK FORM SETUP
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
  } = useForm<ProductCreate>({
    resolver: zodResolver(ProductCreateSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      sku: '',
      price: 0,
      currency: 'USD',
      description: '',
      category: [],
      tags: [],
      isActive: true,
    },
  });

  // ✅ MOCK DATA FOR DEMO - In real app, use actual hooks
  const categoriesData = { categories: [] };
  const tagsData = { tags: [] };
  const categoriesLoading = false;
  const tagsLoading = false;

  const handleSkuChange = (value: string) => {
    setValue('sku', value);
    trigger('sku');
  };

  const handleCancel = () => {
    router.push('/products');
  };

  // ✅ FORM SUBMISSION HANDLER
  const onSubmit = async (data: ProductCreate) => {
    try {
      const result = await createProduct.mutateAsync(data);

      if (result) {
        analytics.trackOptimized('product_created', {
          productId: result.id,
          productName: result.name,
          productSku: result.sku,
          userStories: ['US-4.1'],
          hypotheses: ['H5'],
          priority: 'medium',
        });

        toast.success('Product created successfully!');
        router.push(`/products/${result.id}`);
      }
    } catch (error) {
      // Error handling is already done in the hook
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Product</h1>
          <p className="text-gray-600">Add a new product to your catalog</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* ✅ INLINE FORM FIELDS - Consistent with other forms */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  {...register('name')}
                  id="name"
                  type="text"
                  value={watch('name') || ''}
                  placeholder="Enter product name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>

              {/* SKU */}
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                  SKU *
                </label>
                <input
                  {...register('sku')}
                  id="sku"
                  type="text"
                  value={watch('sku') || ''}
                  onChange={e => handleSkuChange(e.target.value)}
                  placeholder="PROD-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>}
              </div>
            </div>

            {/* Additional fields can be added here following the same pattern */}
          </div>

          {/* Error Summary */}
          <FormErrorSummary
            errors={Object.entries(errors).reduce(
              (acc, [key, error]) => {
                if (error?.message && typeof error.message === 'string') {
                  acc[key] = error.message;
                }
                return acc;
              },
              {} as Record<string, string>
            )}
          />

          {/* Form Actions */}
          <FormActions>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={createProduct.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                createProduct.isPending ||
                !isValid ||
                !watch('name')?.trim() ||
                !watch('sku')?.trim() ||
                !watch('price') ||
                watch('price') <= 0
              }
            >
              {createProduct.isPending ? (
                <>
                  <LoadingSpinner size="sm" />
                  Creating...
                </>
              ) : (
                'Create Product'
              )}
            </Button>
          </FormActions>
        </form>
      </div>
    </Card>
  );
}
