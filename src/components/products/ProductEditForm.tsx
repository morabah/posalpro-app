'use client';

import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { FormErrorSummary, FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/forms/Button';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import { useFormValidation } from '@/hooks/useFormValidation';
import {
  useProductCategories,
  useProductMigrated,
  useProductTags,
  useUpdateProduct,
} from '@/features/products/hooks/useProducts';
import { useSkuValidation } from '@/hooks/useSkuValidation';
import { logError, logInfo } from '@/lib/logger';
import { productCreateValidationSchema } from '@/lib/validation/productValidation';
import { ProductUpdate } from '@/services/productService';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { toast } from 'sonner';

interface ProductEditFormProps {
  productId: string;
}

export function ProductEditForm({ productId }: ProductEditFormProps) {
  const router = useRouter();
  const { data: product, isLoading, isError, error } = useProductMigrated(productId);
  const updateProduct = useUpdateProduct();

  // ✅ Fetch categories and tags from database
  const { data: categoriesData, isLoading: categoriesLoading } = useProductCategories();
  const { data: tagsData, isLoading: tagsLoading } = useProductTags();

  // ✅ Get product data safely
  const productData = product || null;

  // ✅ REUSABLE VALIDATION HOOK - Initialize with product data if available
  const validation = useFormValidation(
    {
      name: productData?.name || '',
      description: productData?.description || '',
      sku: productData?.sku || '',
      price: productData?.price || 0,
      currency: productData?.currency || 'USD',
      category: productData?.category || [],
      tags: productData?.tags || [],
      isActive: productData?.isActive ?? true,
      images: productData?.images || [],
      version: productData?.version || 1,
      userStoryMappings: productData?.userStoryMappings || ['US-4.1'],
    } as ProductUpdate,
    productCreateValidationSchema,
    {
      validateOnChange: true,
      validateOnBlur: true,
    }
  );

  // ✅ SKU VALIDATION HOOK - Same as ProductCreateForm
  const skuValidation = useSkuValidation({
    debounceMs: 500,
    excludeId: productId, // Exclude current product from SKU validation
  });

  // 🚀 MODERN PATTERN: Use the hook's built-in handler
  const handleSkuChange = useCallback(
    (value: string) => {
      skuValidation.handleSkuChange(value, validation.handleFieldChange);
    },
    [skuValidation, validation.handleFieldChange]
  );

  // ✅ Handle form submission - Same validation logic as ProductCreateForm
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const errors = validation.validateAll();
    if (Object.keys(errors).length > 0) {
      // Show user-friendly error message instead of just logging
      const errorMessages = Object.values(errors).join(', ');
      toast.error(`Please fix the following errors: ${errorMessages}`);

      logError('Product update: Validation failed', {
        component: 'ProductEditForm',
        operation: 'handleSubmit',
        errors,
        productId,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });
      return;
    }

    // Check SKU validation
    if (skuValidation.exists || skuValidation.error) {
      const errorMessage = skuValidation.error || 'SKU already exists';
      toast.error(errorMessage);

      logError('Product update: SKU validation failed', {
        component: 'ProductEditForm',
        operation: 'handleSubmit',
        productId,
        sku: validation.formData.sku as string,
        skuError: skuValidation.error,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });
      return;
    }

    try {
      logInfo('Product update: Starting product update', {
        component: 'ProductEditForm',
        operation: 'handleSubmit',
        productId,
        productData: {
          name: validation.formData.name as string,
          sku: validation.formData.sku as string,
          price: validation.formData.price as number,
        },
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      const productData: ProductUpdate = {
        name: validation.formData.name as string,
        description: (validation.formData.description as string) || undefined,
        sku: validation.formData.sku as string,
        price: validation.formData.price as number,
        currency: validation.formData.currency as string,
        category: validation.formData.category as string[],
        tags: validation.formData.tags as string[],
        isActive: validation.formData.isActive as boolean,
        attributes: validation.formData.attributes as Record<string, string | number | boolean>,
        images: validation.formData.images as string[],
        version: validation.formData.version as number,
        userStoryMappings: validation.formData.userStoryMappings as string[],
      };

      const result = await updateProduct.mutateAsync({ id: productId, data: productData });

      // ✅ Always redirect on successful update, regardless of result structure
      toast.success('Product updated successfully!');

      logInfo('Product update: Product updated successfully', {
        component: 'ProductEditForm',
        operation: 'handleSubmit',
        productId,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      // ✅ Route to product detail page with updated info
      router.push(`/products/${productId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
      toast.error(errorMessage);

      logError('Product update: Failed to update product', {
        component: 'ProductEditForm',
        operation: 'handleSubmit',
        productId,
        error: errorMessage,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });
    }
  };

  const handleCancel = () => {
    router.push(`/products/${productId}`);
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
          <span className="ml-2">Loading product data...</span>
        </div>
      </Card>
    );
  }

  if (isError || !product) {
    logError('Failed to load product for editing', {
      component: 'ProductEditForm',
      operation: 'load',
      productId,
      error: error?.message || 'Unknown error',
      userStory: 'US-4.1',
      hypothesis: 'H5',
    });

    return (
      <Card className="p-8">
        <div className="text-center">
          <p className="text-red-600">Failed to load product data</p>
          <Button variant="secondary" onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  // ✅ Ensure we have product data before rendering form
  if (!productData) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <p className="text-red-600">No product data available</p>
          <Button variant="secondary" onClick={() => router.push('/products')} className="mt-4">
            Back to Products
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Edit Product</h2>

        <form onSubmit={handleSubmit} className="space-y-6" key={productId}>
          {/* Error Summary */}
          <FormErrorSummary errors={validation.validationErrors} />

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

            {/* Product Name */}
            <FormField
              name="name"
              label="Product Name"
              placeholder="Enter product name"
              value={validation.formData.name as string}
              onChange={value => validation.handleFieldChange('name', value)}
              onBlur={() => validation.handleFieldBlur('name')}
              error={validation.getFieldError('name')}
              touched={validation.isFieldTouched('name')}
              required
            />

            {/* SKU */}
            <FormField
              name="sku"
              label="SKU"
              placeholder="PROD-001"
              value={validation.formData.sku as string}
              onChange={handleSkuChange}
              onBlur={() => validation.handleFieldBlur('sku')}
              error={validation.getFieldError('sku') || skuValidation.error || undefined}
              touched={validation.isFieldTouched('sku')}
              required
            />
            {skuValidation.isValidating && (
              <p className="text-sm text-blue-600">Validating SKU...</p>
            )}
            {!skuValidation.isValidating && validation.formData.sku && (
              <p className="text-sm text-gray-500">
                Use uppercase letters, numbers, hyphens, and underscores only
              </p>
            )}

            {/* Price */}
            <FormField
              name="price"
              label="Price"
              type="number"
              placeholder="0.00"
              value={validation.formData.price as number}
              onChange={value => validation.handleFieldChange('price', parseFloat(value) || 0)}
              onBlur={() => validation.handleFieldBlur('price')}
              error={validation.getFieldError('price')}
              touched={validation.isFieldTouched('price')}
              required
            />

            {/* Currency */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                id="currency"
                value={validation.formData.currency as string}
                onChange={e => validation.handleFieldChange('currency', e.target.value)}
                onBlur={() => validation.handleFieldBlur('currency')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
                <option value="JPY">JPY</option>
              </select>
              {validation.getFieldError('currency') && (
                <p className="mt-1 text-sm text-red-600">{validation.getFieldError('currency')}</p>
              )}
            </div>

            {/* Description */}
            <FormField
              name="description"
              label="Description"
              type="textarea"
              placeholder="Enter product description"
              value={validation.formData.description as string}
              onChange={value => validation.handleFieldChange('description', value)}
              onBlur={() => validation.handleFieldBlur('description')}
              error={validation.getFieldError('description')}
              touched={validation.isFieldTouched('description')}
            />

            {/* Category */}
            <SearchableDropdown
              label="Category"
              placeholder="Select or type categories"
              value={
                Array.isArray(validation.formData.category) ? validation.formData.category : []
              }
              onChange={categories => validation.handleFieldChange('category', categories)}
              options={categoriesData?.categories || []}
              isLoading={categoriesLoading}
              error={validation.getFieldError('category')}
            />

            {/* Tags */}
            <SearchableDropdown
              label="Tags"
              placeholder="Select or type tags"
              value={Array.isArray(validation.formData.tags) ? validation.formData.tags : []}
              onChange={tags => validation.handleFieldChange('tags', tags)}
              options={tagsData?.tags || []}
              isLoading={tagsLoading}
              error={validation.getFieldError('tags')}
            />

            {/* Is Active */}
            <div className="flex items-center">
              <Checkbox
                id="isActive"
                checked={validation.formData.isActive as boolean}
                onChange={e => validation.handleFieldChange('isActive', e.target.checked)}
                onBlur={() => validation.handleFieldBlur('isActive')}
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active
              </label>
            </div>
            {validation.getFieldError('isActive') && (
              <p className="mt-1 text-sm text-red-600">{validation.getFieldError('isActive')}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={updateProduct.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                updateProduct.isPending ||
                validation.hasErrors ||
                skuValidation.exists ||
                (skuValidation.isValidating && Boolean(validation.formData.sku))
              }
            >
              {updateProduct.isPending ? (
                <>
                  <LoadingSpinner size="sm" />
                  Updating...
                </>
              ) : (
                'Update Product'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
