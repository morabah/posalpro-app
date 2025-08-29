/**
 * Reusable Product Form Hook
 * Implements the "Composition over Inheritance" pattern
 * Component Traceability: US-4.1, H5
 */

import { useFormValidation } from '@/hooks/useFormValidation';
import { useProductCategories, useProductTags } from '@/features/products/hooks/useProducts';
import { useSkuValidation } from '@/hooks/useSkuValidation';
import { logError, logInfo } from '@/lib/logger';
import { productCreateValidationSchema } from '@/lib/validation/productValidation';
import { ProductCreate, ProductUpdate } from '@/services/productService';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { toast } from 'sonner';

interface UseProductFormOptions {
  mode: 'create' | 'edit';
  productId?: string;
  initialData?: ProductUpdate;
  onSuccess?: (productId: string) => void;
}

interface UseProductFormReturn {
  // Form state
  validation: ReturnType<typeof useFormValidation<any>>;
  skuValidation: ReturnType<typeof useSkuValidation>;

  // Data fetching
  categoriesData: any;
  tagsData: any;
  categoriesLoading: boolean;
  tagsLoading: boolean;

  // Form handlers
  handleSubmit: (e: React.FormEvent) => Promise<boolean>;
  handleCancel: () => void;
  handleSkuChange: (value: string) => void;

  // Submit state
  isSubmitting: boolean;
}

export function useProductForm({
  mode,
  productId,
  initialData,
  onSuccess,
}: UseProductFormOptions): UseProductFormReturn {
  const router = useRouter();

  // ✅ Fetch categories and tags from database
  const { data: categoriesData, isLoading: categoriesLoading } = useProductCategories();
  const { data: tagsData, isLoading: tagsLoading } = useProductTags();

  // ✅ REUSABLE VALIDATION HOOK - Initialize with data
  const validation = useFormValidation(
    {
      name: initialData?.name || '',
      description: initialData?.description || '',
      sku: initialData?.sku || '',
      price: initialData?.price || 0,
      currency: initialData?.currency || 'USD',
      category: initialData?.category || [],
      tags: initialData?.tags || [],
      isActive: initialData?.isActive ?? true,
      images: initialData?.images || [],
      version: initialData?.version || 1,
      userStoryMappings: initialData?.userStoryMappings || ['US-4.1'],
    } as ProductCreate,
    productCreateValidationSchema,
    {
      validateOnChange: true,
      validateOnBlur: true,
    }
  );

  // ✅ SKU VALIDATION HOOK - Same logic for both forms
  const skuValidation = useSkuValidation({
    debounceMs: 500,
    excludeId: mode === 'edit' ? productId : undefined,
  });

  // 🚀 MODERN PATTERN: Use the hook's built-in handler
  const handleSkuChange = useCallback(
    (value: string) => {
      skuValidation.handleSkuChange(value, validation.handleFieldChange);
    },
    [skuValidation, validation.handleFieldChange]
  );

  // ✅ Handle form submission - Same validation logic for both forms
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate all fields
      const errors = validation.validateAll();
      if (Object.keys(errors).length > 0) {
        const errorMessages = Object.values(errors).join(', ');
        toast.error(`Please fix the following errors: ${errorMessages}`);

        logError(`Product ${mode}: Validation failed`, {
          component: `Product${mode === 'create' ? 'Create' : 'Edit'}Form`,
          operation: 'handleSubmit',
          errors,
          productId,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });
        return false;
      }

      // Check SKU validation
      if (skuValidation.exists || skuValidation.error) {
        const errorMessage = skuValidation.error || 'SKU already exists';
        toast.error(errorMessage);

        logError(`Product ${mode}: SKU validation failed`, {
          component: `Product${mode === 'create' ? 'Create' : 'Edit'}Form`,
          operation: 'handleSubmit',
          productId,
          sku: validation.formData.sku as string,
          skuError: skuValidation.error,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });
        return false;
      }

      try {
        logInfo(`Product ${mode}: Starting submission`, {
          component: `Product${mode === 'create' ? 'Create' : 'Edit'}Form`,
          operation: 'handleSubmit',
          productId,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });

        return true;
      } catch (error) {
        logError(`Product ${mode}: Submission failed`, {
          component: `Product${mode === 'create' ? 'Create' : 'Edit'}Form`,
          operation: 'handleSubmit',
          error: error instanceof Error ? error.message : 'Unknown error',
          productId,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });

        toast.error(`Failed to ${mode} product. Please try again.`);
        return false;
      }
    },
    [mode, productId, validation, skuValidation]
  );

  // ✅ Handle cancel - Same logic for both forms
  const handleCancel = useCallback(() => {
    if (mode === 'create') {
      router.push('/products');
    } else {
      router.push(`/products/${productId}`);
    }
  }, [mode, productId, router]);

  return {
    // Form state
    validation,
    skuValidation,

    // Data fetching
    categoriesData,
    tagsData,
    categoriesLoading,
    tagsLoading,

    // Form handlers
    handleSubmit,
    handleCancel,
    handleSkuChange,

    // Submit state (will be provided by specific forms)
    isSubmitting: false,
  };
}
