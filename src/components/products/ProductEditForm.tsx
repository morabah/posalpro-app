'use client';

import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { FormErrorSummary, FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/forms/Button';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import type { ProductUpdate } from '@/features/products';
import {
  useProductBrandOptions,
  useProductCategories,
  useProductMigrated,
  useProductTags,
  useUpdateProduct,
} from '@/features/products/hooks/useProducts';
import { ProductUpdateSchema } from '@/features/products/schemas';
import { useDatasheetUpload } from '@/hooks/useDatasheetUpload';
import { useSkuValidation } from '@/hooks/useSkuValidation';
import { logError, logInfo } from '@/lib/logger';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ImageGallery } from './ImageGallery';
import { ImageUpload } from './ImageUpload';

interface ProductEditFormProps {
  productId: string;
}

export function ProductEditForm({ productId }: ProductEditFormProps) {
  const router = useRouter();
  const { data: product, isLoading, isError, error } = useProductMigrated(productId);
  const updateProduct = useUpdateProduct();
  const [productImages, setProductImages] = useState<string[]>([]);
  const { uploadFile, isUploading, uploadProgress, error: uploadError } = useDatasheetUpload();

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
    reset,
  } = useForm<ProductUpdate>({
    resolver: zodResolver(ProductUpdateSchema),
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
      isActive: true,
      images: [],
      datasheetPath: '',
      version: 1,
      userStoryMappings: ['US-4.1'],
    },
  });

  // ✅ Reset form when product data is loaded
  useEffect(() => {
    if (product) {
      const productImagesArray = product.images || [];
      setProductImages(productImagesArray);
      reset({
        name: product.name || '',
        description: product.description || '',
        sku: product.sku || '',
        price: product.price || 0,
        currency: product.currency || 'USD',
        category: product.category || [],
        tags: product.tags || [],
        brandNames: product.brandNames || [],
        isActive: product.isActive ?? true,
        images: productImagesArray,
        datasheetPath: product.datasheetPath || '',
        version: product.version || 1,
        userStoryMappings: product.userStoryMappings || ['US-4.1'],
      });
    }
  }, [product, reset]);

  // ✅ SKU VALIDATION HOOK - Same as ProductCreateForm
  const skuValidation = useSkuValidation({
    debounceMs: 500,
    excludeId: productId, // Exclude current product from SKU validation
  });

  // ✅ Watch SKU field for validation
  const watchedSku = watch('sku');

  // 🚀 MODERN PATTERN: Use the hook's built-in handler
  const handleSkuChange = useCallback(
    (value: string) => {
      skuValidation.handleSkuChange(value, (field, val) => {
        setValue(field as keyof ProductUpdate, val);
        trigger(field as keyof ProductUpdate);
      });
    },
    [skuValidation, setValue, trigger]
  );

  // ✅ Handle form submission with React Hook Form
  const onSubmit = async (data: ProductUpdate) => {
    // Check SKU validation
    if (skuValidation.exists || skuValidation.error) {
      const errorMessage = skuValidation.error || 'SKU already exists';
      toast.error(errorMessage);

      logError('Product update: SKU validation failed', {
        component: 'ProductEditForm',
        operation: 'onSubmit',
        sku: data.sku,
        skuError: skuValidation.error,
        productId,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });
      return;
    }

    try {
      logInfo('Product update: Starting product update', {
        component: 'ProductEditForm',
        operation: 'onSubmit',
        productData: {
          name: data.name,
          sku: data.sku,
          price: data.price,
        },
        productId,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      const result = await updateProduct.mutateAsync({ id: productId, data });

      // ✅ Always redirect on successful update, regardless of result structure
      toast.success('Product updated successfully!');

      logInfo('Product update: Product updated successfully', {
        component: 'ProductEditForm',
        operation: 'onSubmit',
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
        operation: 'onSubmit',
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
  if (!product) {
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" key={productId}>
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
                    console.error('ProductEditForm: Invalid event object for SKU onChange', {
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
            <div className="space-y-4">
              <label htmlFor="datasheetPath" className="block text-sm font-medium text-gray-700">
                Datasheet (Optional)
              </label>

              {/* Network URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Network URL</label>
                <FormField
                  {...register('datasheetPath')}
                  name="datasheetPath"
                  placeholder="https://example.com/document.pdf"
                  value={watch('datasheetPath') || ''}
                  onBlur={() => register('datasheetPath').onBlur}
                  error={errors.datasheetPath?.message}
                  touched={!!touchedFields.datasheetPath}
                  className="w-full"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter a network URL for document preview (PDF, DOC, DOCX supported)
                </p>
              </div>

              {/* File Upload Alternative */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Upload File
                </label>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploading}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt';
                      input.onchange = async e => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          try {
                            logInfo('Starting file upload', {
                              component: 'ProductEditForm',
                              operation: 'fileUpload',
                              filename: file.name,
                              size: file.size,
                              type: file.type,
                              userStory: 'US-4.1',
                              hypothesis: 'H5',
                            });

                            // Upload file to local server
                            const result = await uploadFile(file);

                            // Set the uploaded file URL
                            setValue('datasheetPath', result.url);
                            trigger('datasheetPath');

                            logInfo('File uploaded successfully', {
                              component: 'ProductEditForm',
                              operation: 'fileUpload',
                              filename: file.name,
                              uploadedFilename: result.filename,
                              url: result.url,
                              size: result.size,
                              userStory: 'US-4.1',
                              hypothesis: 'H5',
                            });

                            toast.success(`File "${result.originalName}" uploaded successfully!`);
                          } catch (error) {
                            const errorMessage =
                              error instanceof Error ? error.message : 'Upload failed';

                            logError('File upload failed', {
                              component: 'ProductEditForm',
                              operation: 'fileUpload',
                              filename: file.name,
                              error: errorMessage,
                              userStory: 'US-4.1',
                              hypothesis: 'H5',
                            });

                            toast.error(`Upload failed: ${errorMessage}`);
                          }
                        }
                      };
                      input.click();
                    }}
                    className="px-4 py-2"
                  >
                    {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Upload File'}
                  </Button>
                  <span className="text-sm text-gray-500">
                    {isUploading ? 'Uploading file...' : 'Select a file to upload'}
                  </span>
                </div>
                {uploadError && (
                  <p className="mt-1 text-sm text-red-600">
                    ❌ Upload failed: {uploadError.error || 'Unknown error'}
                  </p>
                )}
                <p className="mt-1 text-sm text-blue-600">
                  📁 Files are uploaded securely and validated for type and size. Supported formats:
                  PDF, DOC, DOCX, XLS, XLSX, TXT, RTF (max 10MB).
                </p>
              </div>
            </div>

            {/* Product Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Product Images</h3>

              {/* Image Upload */}
              <ImageUpload
                productId={productId}
                onUploadSuccess={imageUrl => {
                  setProductImages(prev => [...prev, imageUrl]);
                  setValue('images', [...productImages, imageUrl]);
                }}
                onUploadError={error => {
                  toast.error(`Image upload failed: ${error}`);
                }}
                disabled={productImages.length >= 10}
              />

              {/* Image Gallery */}
              {productImages.length > 0 && (
                <ImageGallery
                  productId={productId}
                  images={productImages}
                  onImageDelete={imageUrl => {
                    setProductImages(prev => prev.filter(img => img !== imageUrl));
                    setValue(
                      'images',
                      productImages.filter(img => img !== imageUrl)
                    );
                  }}
                  onImageDeleteError={(error: string) => {
                    toast.error(`Image operation failed: ${error}`);
                  }}
                />
              )}
            </div>

            {/* Category */}
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <SearchableDropdown
                  label="Category"
                  placeholder="Select or type categories"
                  value={field.value || []}
                  onChange={field.onChange}
                  options={categoriesData?.categories || []}
                  isLoading={categoriesLoading}
                  error={errors.category?.message}
                />
              )}
            />

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

            {/* Brand Names */}
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

            {/* Is Active */}
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
                      Active
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
                !isValid ||
                skuValidation.exists ||
                (skuValidation.isValidating && Boolean(watchedSku))
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
