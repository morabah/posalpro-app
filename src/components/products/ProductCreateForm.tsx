'use client';

import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { FormActions, FormErrorSummary, FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/forms/Button';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import type { ProductCreate } from '@/features/products';
import {
  useCreateProduct,
  useProductBrandOptions,
  useProductCategories,
  useProductTags,
} from '@/features/products';
import { ProductCreateSchema } from '@/features/products/schemas';
import { useSkuValidation } from '@/hooks/useSkuValidation';
import { analytics } from '@/lib/analytics';
import { logError, logInfo } from '@/lib/logger';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ImageUpload } from './ImageUpload';
import { ImageGallery } from './ImageGallery';

export function ProductCreateForm() {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const [productImages, setProductImages] = useState<string[]>([]);

  // ✅ Fetch categories and tags from database
  const { data: categoriesData, isLoading: categoriesLoading } = useProductCategories();
  const { data: tagsData, isLoading: tagsLoading } = useProductTags();
  const { data: brandOptionsData, isLoading: brandsLoading } = useProductBrandOptions();

  // ✅ REACT HOOK FORM SETUP
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
    watch,
    setValue,
    trigger,
  } = useForm<ProductCreate>({
    resolver: zodResolver(ProductCreateSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      price: 0,
      currency: 'USD',
      category: [],
      tags: [],
      brandNames: [],
      stockQuantity: 0,
      status: 'ACTIVE' as const,
      isActive: true,
      images: [],
      datasheetPath: '',
      version: 1,
      userStoryMappings: ['US-4.1'],
    },
  });

  // ✅ SKU VALIDATION HOOK
  const skuValidation = useSkuValidation({
    debounceMs: 500,
  });

  // ✅ Watch SKU field for validation
  const watchedSku = watch('sku');

  // 🚀 MODERN PATTERN: Use the hook's built-in handler
  const handleSkuChange = useCallback(
    (value: string) => {
      skuValidation.handleSkuChange(value, (field, val) => {
        setValue(field as keyof ProductCreate, val);
        trigger(field as keyof ProductCreate);
      });
    },
    [skuValidation, setValue, trigger]
  );

  // ✅ Handle form submission with React Hook Form
  const onSubmit = async (data: ProductCreate) => {
    // Check SKU validation
    if (skuValidation.exists || skuValidation.error) {
      const errorMessage = skuValidation.error || 'SKU already exists';
      toast.error(errorMessage);

      logError('Product creation: SKU validation failed', {
        component: 'ProductCreateForm',
        operation: 'onSubmit',
        sku: data.sku,
        skuError: skuValidation.error,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });
      return;
    }

    try {
      logInfo('Product creation: Starting product creation', {
        component: 'ProductCreateForm',
        operation: 'onSubmit',
        productData: {
          name: data.name,
          sku: data.sku,
          price: data.price,
        },
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

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
      const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
      toast.error(errorMessage);

      logError('Product creation: Failed to create product', {
        component: 'ProductCreateForm',
        operation: 'onSubmit',
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

            {/* Product Name */}
            <FormField
              {...register('name')}
              name="name"
              label="Product Name"
              placeholder="Enter product name"
              value={watch('name') || ''}
              onBlur={() => register('name').onBlur}
              error={errors.name?.message}
              touched={!!touchedFields.name}
              required
            />

            {/* SKU */}
            <FormField
              {...register('sku', {
                onChange: e => {
                  if (!e || !e.target) {
                    console.error('ProductCreateForm: Invalid event object for SKU onChange', {
                      event: e,
                    });
                    return;
                  }
                  handleSkuChange(e.target.value);
                },
              })}
              name="sku"
              label="SKU"
              placeholder="PROD-001"
              value={watchedSku || ''}
              error={errors.sku?.message || skuValidation.error || undefined}
              touched={!!touchedFields.sku}
              required
            />
            {skuValidation.isValidating && (
              <p className="text-sm text-blue-600">Validating SKU...</p>
            )}
            {!skuValidation.isValidating && watchedSku && (
              <p className="text-sm text-gray-500">
                Use uppercase letters, numbers, hyphens, and underscores only
              </p>
            )}

            {/* Price */}
            <FormField
              {...register('price', { valueAsNumber: true })}
              name="price"
              label="Price"
              type="number"
              placeholder="0.00"
              value={watch('price') || ''}
              onBlur={() => register('price').onBlur}
              error={errors.price?.message}
              touched={!!touchedFields.price}
              required
            />

            {/* Currency */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                {...register('currency')}
                id="currency"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
                <option value="JPY">JPY</option>
              </select>
              {errors.currency && (
                <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>
              )}
            </div>

            {/* Description */}
            <FormField
              {...register('description')}
              name="description"
              label="Description"
              type="textarea"
              placeholder="Enter product description"
              value={watch('description') || ''}
              onBlur={() => register('description').onBlur}
              error={errors.description?.message}
              touched={!!touchedFields.description}
            />

            {/* Datasheet Path */}
            <div>
              <label
                htmlFor="datasheetPath"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Datasheet Path (Optional)
              </label>
              <div className="flex space-x-2">
                <FormField
                  {...register('datasheetPath')}
                  name="datasheetPath"
                  placeholder="Enter datasheet path or select file"
                  value={watch('datasheetPath') || ''}
                  onBlur={() => register('datasheetPath').onBlur}
                  error={errors.datasheetPath?.message}
                  touched={!!touchedFields.datasheetPath}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt';
                    input.onchange = e => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        // Get the complete path from the file input
                        const fullPath = (e.target as HTMLInputElement).value;
                        if (fullPath) {
                          // Use the complete path if available
                          setValue('datasheetPath', fullPath);
                        } else {
                          // Fallback to just filename if path is not accessible
                          setValue('datasheetPath', file.name);
                        }
                        trigger('datasheetPath');
                      }
                    };
                    input.click();
                  }}
                  className="px-4 py-2"
                >
                  Browse...
                </Button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Enter network path or select local file (PDF, DOC, DOCX, XLS, XLSX, TXT)
              </p>
            </div>
          </div>

          {/* Product Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Product Images</h3>

            {/* Image Upload */}
            <ImageUpload
              productId="new" // Placeholder for new products
              onUploadSuccess={imageUrl => {
                setProductImages(prev => [...prev, imageUrl]);
                setValue('images', [...productImages, imageUrl]);
              }}
              onUploadError={error => {
                toast.error(`Image upload failed: ${error}`);
              }}
              maxFiles={10}
              disabled={productImages.length >= 10}
            />

            {/* Image Gallery */}
            {productImages.length > 0 && (
              <ImageGallery
                productId="new" // Placeholder for new products
                images={productImages}
                onImageDelete={imageUrl => {
                  setProductImages(prev => prev.filter(img => img !== imageUrl));
                  setValue(
                    'images',
                    productImages.filter(img => img !== imageUrl)
                  );
                }}
                onImageDeleteError={error => {
                  toast.error(`Image deletion failed: ${error}`);
                }}
                maxImages={10}
              />
            )}
          </div>

          {/* Categories and Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Categories & Tags</h3>

            {/* Categories */}
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <SearchableDropdown
                  label="Categories"
                  placeholder="Select or type categories"
                  value={field.value || []}
                  onChange={field.onChange}
                  options={categoriesData?.categories || []}
                  isLoading={categoriesLoading}
                  error={errors.category?.message}
                />
              )}
            />
            <p className="text-sm text-gray-500">
              Select from existing categories or type new ones
            </p>

            {/* Tags */}
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <SearchableDropdown
                  label="Tags"
                  placeholder="Select or type tags"
                  value={field.value || []}
                  onChange={field.onChange}
                  options={tagsData?.tags || []}
                  isLoading={tagsLoading}
                  error={errors.tags?.message}
                />
              )}
            />
            <p className="text-sm text-gray-500">Select from existing tags or type new ones</p>

            <Controller
              name="brandNames"
              control={control}
              render={({ field }) => (
                <SearchableDropdown
                  label="Brand Names"
                  placeholder="Select relevant brands"
                  value={field.value || []}
                  onChange={field.onChange}
                  options={brandOptionsData || []}
                  isLoading={brandsLoading}
                  error={errors.brandNames?.message}
                />
              )}
            />
            <p className="text-sm text-gray-500">
              Link this product to customer brands for proposal filtering
            </p>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Status</h3>

            <div className="flex items-center">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <>
                    <Checkbox
                      id="isActive"
                      checked={field.value ?? true}
                      onChange={checked => field.onChange(checked)}
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                      Product is active and available for sale
                    </label>
                  </>
                )}
              />
            </div>
            {errors.isActive && (
              <p className="mt-1 text-sm text-red-600">{errors.isActive.message}</p>
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
                !isValid ||
                skuValidation.exists ||
                (skuValidation.isValidating && Boolean(watchedSku)) ||
                !watchedSku?.trim() ||
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

          {/* Debug Information */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
              <h4 className="font-semibold mb-2">Debug Info:</h4>
              <div className="space-y-1">
                <div>Form Pending: {createProduct.isPending ? 'Yes' : 'No'}</div>
                <div>Form Valid: {isValid ? 'Yes' : 'No'}</div>
                <div>SKU Exists: {skuValidation.exists ? 'Yes' : 'No'}</div>
                <div>SKU Validating: {skuValidation.isValidating ? 'Yes' : 'No'}</div>
                <div>SKU Error: {skuValidation.error || 'None'}</div>
                <div>
                  Button Disabled:{' '}
                  {createProduct.isPending ||
                  !isValid ||
                  skuValidation.exists ||
                  (skuValidation.isValidating && Boolean(watchedSku)) ||
                  !watchedSku?.trim() ||
                  !watch('price') ||
                  watch('price') <= 0
                    ? 'Yes'
                    : 'No'}
                </div>
                <div>Button Disabled Reasons:</div>
                <ul className="ml-4">
                  <li>Form Pending: {createProduct.isPending ? 'Yes' : 'No'}</li>
                  <li>Form Invalid: {!isValid ? 'Yes' : 'No'}</li>
                  <li>SKU Exists: {skuValidation.exists ? 'Yes' : 'No'}</li>
                  <li>
                    SKU Validating:{' '}
                    {skuValidation.isValidating && Boolean(watchedSku) ? 'Yes' : 'No'}
                  </li>
                  <li>No SKU: {!watchedSku?.trim() ? 'Yes' : 'No'}</li>
                  <li>No Price: {!watch('price') ? 'Yes' : 'No'}</li>
                  <li>Invalid Price: {(watch('price') || 0) <= 0 ? 'Yes' : 'No'}</li>
                </ul>
                <div>Required Fields:</div>
                <ul className="ml-4">
                  <li>Name: {watch('name') ? '✓' : '✗'}</li>
                  <li>SKU: {watchedSku ? '✓' : '✗'}</li>
                  <li>Price: {watch('price') ? '✓' : '✗'}</li>
                </ul>
                <div>Form Data:</div>
                <ul className="ml-4">
                  <li>Name: "{watch('name')}"</li>
                  <li>SKU: "{watchedSku}"</li>
                  <li>Price: {watch('price')}</li>
                  <li>Currency: "{watch('currency')}"</li>
                  <li>Category: {JSON.stringify(watch('category'))}</li>
                  <li>Tags: {JSON.stringify(watch('tags'))}</li>
                  <li>IsActive: {String(watch('isActive'))}</li>
                </ul>
                <div>Validation Errors:</div>
                <ul className="ml-4">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>
                      {field}:{' '}
                      {typeof error === 'object' && 'message' in error && error.message
                        ? String(error.message)
                        : 'Unknown error'}
                    </li>
                  ))}
                </ul>
                <div>Field Errors:</div>
                <ul className="ml-4">
                  <li>Name Error: {errors.name?.message || 'None'}</li>
                  <li>SKU Error: {errors.sku?.message || 'None'}</li>
                  <li>Price Error: {errors.price?.message || 'None'}</li>
                  <li>Currency Error: {errors.currency?.message || 'None'}</li>
                  <li>Category Error: {errors.category?.message || 'None'}</li>
                  <li>Tags Error: {errors.tags?.message || 'None'}</li>
                  <li>IsActive Error: {errors.isActive?.message || 'None'}</li>
                </ul>
              </div>
            </div>
          )}
        </form>
      </div>
    </Card>
  );
}
