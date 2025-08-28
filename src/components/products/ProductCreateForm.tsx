'use client';

import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { FormActions, FormErrorSummary, FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/forms/Button';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useCreateProduct, useProductCategories, useProductTags } from '@/hooks/useProducts';
import { useSkuValidation } from '@/hooks/useSkuValidation';
import { analytics } from '@/lib/analytics';
import { logError, logInfo } from '@/lib/logger';
import { productCreateValidationSchema } from '@/lib/validation/productValidation';
import { ProductCreate } from '@/services/productService';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { toast } from 'sonner';

export function ProductCreateForm() {
  const router = useRouter();
  const createProduct = useCreateProduct();

  // ✅ Fetch categories and tags from database
  const { data: categoriesData, isLoading: categoriesLoading } = useProductCategories();
  const { data: tagsData, isLoading: tagsLoading } = useProductTags();

  // ✅ REUSABLE VALIDATION HOOK
  const validation = useFormValidation(
    {
      name: '',
      description: '',
      sku: '',
      price: 0,
      currency: 'USD',
      category: [],
      tags: [],
      isActive: true,
      images: [],
      version: 1,
      userStoryMappings: ['US-4.1'],
    } as ProductCreate, // Type assertion for compatibility
    productCreateValidationSchema,
    {
      validateOnChange: true,
      validateOnBlur: true,
    }
  );

  // ✅ SKU VALIDATION HOOK
  const skuValidation = useSkuValidation({
    debounceMs: 500,
  });

  // 🚀 MODERN PATTERN: Use the hook's built-in handler
  const handleSkuChange = useCallback(
    (value: string) => {
      skuValidation.handleSkuChange(value, validation.handleFieldChange);
    },
    [skuValidation, validation.handleFieldChange]
  );

  // ✅ Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const errors = validation.validateAll();
    if (Object.keys(errors).length > 0) {
      // Show user-friendly error message instead of just logging
      const errorMessages = Object.values(errors).join(', ');
      toast.error(`Please fix the following errors: ${errorMessages}`);

      logError('Product creation: Validation failed', {
        component: 'ProductCreateForm',
        operation: 'handleSubmit',
        errors,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });
      return;
    }

    // Check SKU validation
    if (skuValidation.exists || skuValidation.error) {
      const errorMessage = skuValidation.error || 'SKU already exists';
      toast.error(errorMessage);

      logError('Product creation: SKU validation failed', {
        component: 'ProductCreateForm',
        operation: 'handleSubmit',
        sku: validation.formData.sku as string,
        skuError: skuValidation.error,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });
      return;
    }

    try {
      logInfo('Product creation: Starting product creation', {
        component: 'ProductCreateForm',
        operation: 'handleSubmit',
        productData: {
          name: validation.formData.name as string,
          sku: validation.formData.sku as string,
          price: validation.formData.price as number,
        },
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      const productData: ProductCreate = {
        name: validation.formData.name as string,
        description: (validation.formData.description as string) || '',
        sku: validation.formData.sku as string,
        price: validation.formData.price as number,
        currency: validation.formData.currency as string,
        category: validation.formData.category as string[],
        tags: validation.formData.tags as string[],
        isActive: validation.formData.isActive as boolean,
        attributes: validation.formData.attributes as Record<string, string | number | boolean>,
        images: [],
        version: 1,
        userStoryMappings: ['US-4.1'],
      };

      const result = await createProduct.mutateAsync(productData);

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
      const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
      toast.error(errorMessage);

      logError('Product creation: Failed to create product', {
        component: 'ProductCreateForm',
        operation: 'handleSubmit',
        error: errorMessage,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });
    }
  };

  const handleCancel = () => {
    router.push('/products');
  };

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Product</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              value={(validation.formData.description as string) || ''}
              onChange={value => validation.handleFieldChange('description', value)}
              onBlur={() => validation.handleFieldBlur('description')}
              error={validation.getFieldError('description')}
              touched={validation.isFieldTouched('description')}
            />
          </div>

          {/* Categories and Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Categories & Tags</h3>

            {/* Categories */}
            <SearchableDropdown
              label="Categories"
              placeholder="Select or type categories"
              value={
                Array.isArray(validation.formData.category) ? validation.formData.category : []
              }
              onChange={categories => validation.handleFieldChange('category', categories)}
              options={categoriesData?.categories || []}
              isLoading={categoriesLoading}
              error={validation.getFieldError('category')}
            />
            <p className="text-sm text-gray-500">
              Select from existing categories or type new ones
            </p>

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
            <p className="text-sm text-gray-500">Select from existing tags or type new ones</p>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Status</h3>

            <div className="flex items-center">
              <Checkbox
                id="isActive"
                checked={(validation.formData.isActive as boolean) ?? true}
                onChange={e => validation.handleFieldChange('isActive', e.target.checked)}
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Product is active and available for sale
              </label>
            </div>
            {validation.getFieldError('isActive') && (
              <p className="mt-1 text-sm text-red-600">{validation.getFieldError('isActive')}</p>
            )}
          </div>

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

          {/* Debug Information */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
              <h4 className="font-semibold mb-2">Debug Info:</h4>
              <div className="space-y-1">
                <div>Form Pending: {createProduct.isPending ? 'Yes' : 'No'}</div>
                <div>Has Errors: {validation.hasErrors ? 'Yes' : 'No'}</div>
                <div>SKU Exists: {skuValidation.exists ? 'Yes' : 'No'}</div>
                <div>SKU Validating: {skuValidation.isValidating ? 'Yes' : 'No'}</div>
                <div>SKU Error: {skuValidation.error || 'None'}</div>
                <div>
                  Button Disabled:{' '}
                  {createProduct.isPending ||
                  validation.hasErrors ||
                  skuValidation.exists ||
                  (skuValidation.isValidating && Boolean(validation.formData.sku)) ||
                  !validation.formData.name?.trim() ||
                  !validation.formData.sku?.trim() ||
                  !validation.formData.price ||
                  validation.formData.price <= 0
                    ? 'Yes'
                    : 'No'}
                </div>
                <div>Button Disabled Reasons:</div>
                <ul className="ml-4">
                  <li>Form Pending: {createProduct.isPending ? 'Yes' : 'No'}</li>
                  <li>Has Errors: {validation.hasErrors ? 'Yes' : 'No'}</li>
                  <li>SKU Exists: {skuValidation.exists ? 'Yes' : 'No'}</li>
                  <li>
                    SKU Validating:{' '}
                    {skuValidation.isValidating && Boolean(validation.formData.sku) ? 'Yes' : 'No'}
                  </li>
                  <li>No Name: {!validation.formData.name?.trim() ? 'Yes' : 'No'}</li>
                  <li>No SKU: {!validation.formData.sku?.trim() ? 'Yes' : 'No'}</li>
                  <li>No Price: {!validation.formData.price ? 'Yes' : 'No'}</li>
                  <li>Invalid Price: {(validation.formData.price || 0) <= 0 ? 'Yes' : 'No'}</li>
                </ul>
                <div>Required Fields:</div>
                <ul className="ml-4">
                  <li>Name: {validation.formData.name ? '✓' : '✗'}</li>
                  <li>SKU: {validation.formData.sku ? '✓' : '✗'}</li>
                  <li>Price: {validation.formData.price ? '✓' : '✗'}</li>
                </ul>
                <div>Form Data:</div>
                <ul className="ml-4">
                  <li>Name: "{validation.formData.name}"</li>
                  <li>SKU: "{validation.formData.sku}"</li>
                  <li>Price: {validation.formData.price}</li>
                  <li>Currency: "{validation.formData.currency}"</li>
                  <li>Category: {JSON.stringify(validation.formData.category)}</li>
                  <li>Tags: {JSON.stringify(validation.formData.tags)}</li>
                  <li>IsActive: {String(validation.formData.isActive)}</li>
                </ul>
                <div>Validation Errors:</div>
                <ul className="ml-4">
                  {Object.entries(validation.validationErrors).map(([field, error]) => (
                    <li key={field}>
                      {field}: {error}
                    </li>
                  ))}
                </ul>
                <div>Field Errors:</div>
                <ul className="ml-4">
                  <li>Name Error: {validation.getFieldError('name') || 'None'}</li>
                  <li>SKU Error: {validation.getFieldError('sku') || 'None'}</li>
                  <li>Price Error: {validation.getFieldError('price') || 'None'}</li>
                  <li>Currency Error: {validation.getFieldError('currency') || 'None'}</li>
                  <li>Category Error: {validation.getFieldError('category') || 'None'}</li>
                  <li>Tags Error: {validation.getFieldError('tags') || 'None'}</li>
                  <li>IsActive Error: {validation.getFieldError('isActive') || 'None'}</li>
                </ul>
              </div>
            </div>
          )}
        </form>
      </div>
    </Card>
  );
}
