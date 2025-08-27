/**
 * Refactored Product Create Form
 * Uses "Composition over Inheritance" pattern
 * Component Traceability: US-4.1, H5
 */

'use client';

import { ProductFormFields } from '@/components/products/ProductFormFields';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { FormActions, FormErrorSummary } from '@/components/ui/FormField';
import { Button } from '@/components/ui/forms/Button';
import { useProductForm } from '@/hooks/useProductForm';
import { useCreateProduct } from '@/hooks/useProducts';
import { analytics } from '@/lib/analytics';
import { ProductCreate } from '@/services/productService';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function ProductCreateFormRefactored() {
  const router = useRouter();
  const createProduct = useCreateProduct();

  // ✅ REUSABLE FORM HOOK - All the common logic is here!
  const {
    validation,
    skuValidation,
    categoriesData,
    tagsData,
    categoriesLoading,
    tagsLoading,
    handleSkuChange,
    handleCancel,
  } = useProductForm({
    mode: 'create',
  });

  // ✅ SPECIFIC SUBMIT LOGIC - Only what's different for create
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors = validation.validateAll();
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      const result = await createProduct.mutateAsync(validation.formData as ProductCreate);

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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ✅ REUSABLE FORM FIELDS - All the UI is here! */}
          <ProductFormFields
            validation={validation}
            skuValidation={skuValidation}
            handleSkuChange={handleSkuChange}
            categoriesData={categoriesData}
            tagsData={tagsData}
            categoriesLoading={categoriesLoading}
            tagsLoading={tagsLoading}
            mode="create"
          />

          {/* Error Summary */}
          {validation.hasErrors && <FormErrorSummary errors={validation.validationErrors} />}

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
                validation.hasErrors ||
                skuValidation.exists ||
                (skuValidation.isValidating && Boolean(validation.formData.sku)) ||
                !validation.formData.name?.trim() ||
                !validation.formData.sku?.trim() ||
                !validation.formData.price ||
                validation.formData.price <= 0
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
