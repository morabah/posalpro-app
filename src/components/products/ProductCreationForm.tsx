/**
 * ProductCreationForm Component - Simplified for New Bridge Pattern
 *
 * Component Traceability Matrix:
 * - User Stories: US-1.2, US-3.1, US-3.2
 * - Acceptance Criteria: AC-1.2.1, AC-3.1.1, AC-3.2.1
 * - Methods: createProduct(), validateConfiguration(), trackCreation()
 * - Hypotheses: H1 (Content Discovery), H8 (Technical Validation)
 * - Test Cases: TC-H1-002, TC-H8-001, TC-H8-002
 *
 * This form serves as the foundation for all proposal management,
 * content discovery, and validation systems in PosalPro MVP2.
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert } from '@/components/ui/feedback/Alert';
import { Button } from '@/components/ui/forms/Button';
import { CategoryDropdown } from '@/components/ui/forms/CategoryDropdown';
import { logDebug } from '@/lib/logger';
import { CreateProductData } from '@/types/entities/product';
import { toast } from 'sonner';

// Simplified form validation schema
const productCreationSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(200, 'Product name must be less than 200 characters'),

  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),

  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU must be less than 50 characters')
    .regex(
      /^[A-Z0-9-_]+$/,
      'SKU must contain only uppercase letters, numbers, hyphens, and underscores'
    ),

  price: z.coerce
    .number()
    .min(0, 'Price must be non-negative')
    .max(1000000, 'Price must be less than 1,000,000'),

  currency: z.string().default('USD'),

  category: z.array(z.string()).min(1, 'At least one category is required'),

  tags: z.array(z.string()).optional().default([]),

  isActive: z.boolean().default(true),
});

type ProductCreationFormData = z.infer<typeof productCreationSchema>;

interface ProductCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductData) => Promise<void>;
  inline?: boolean;
  initialData?: Partial<ProductCreationFormData>;
}

export function ProductCreationForm({
  isOpen,
  onClose,
  onSubmit,
  inline = false,
  initialData,
}: ProductCreationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const form = useForm<ProductCreationFormData>({
    resolver: zodResolver(productCreationSchema),
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      price: 0,
      currency: 'USD',
      category: [],
      tags: [],
      isActive: true,
      ...initialData,
    },
  });

  const handleSubmit = useCallback(
    async (data: ProductCreationFormData) => {
      setIsSubmitting(true);
      setValidationErrors([]);

      try {
        logDebug('Creating product via onSubmit prop', {
          component: 'ProductCreationForm',
          operation: 'handleSubmit',
          productData: { name: data.name, sku: data.sku },
        });

        // Convert form data to CreateProductData format
        const productData: CreateProductData = {
          name: data.name,
          description: data.description,
          sku: data.sku,
          price: Number(data.price) || 0,
          currency: data.currency,
          category: data.category && data.category.length > 0 ? data.category : ['General'],
          tags: data.tags,
          attributes: {},
          images: [],
          userStoryMappings: [],
        };

        await onSubmit(productData);

        logDebug('Product created successfully via onSubmit', {
          component: 'ProductCreationForm',
          operation: 'handleSubmit',
          sku: data.sku,
        });

        onClose();

        toast.success('Product Created Successfully', {
          description: `Product "${data.name}" has been created with SKU: ${data.sku}`,
          duration: 3000,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
        setValidationErrors([errorMessage]);

        logDebug('Product creation failed', {
          component: 'ProductCreationForm',
          operation: 'handleSubmit',
          error: errorMessage,
          sku: data.sku,
        });

        toast.error('Product Creation Failed', {
          description: errorMessage,
          duration: 4000,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, onClose]
  );

  if (!isOpen) return null;

  const formContent = (
    <div className={inline ? '' : 'bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto'}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Create New Product</h2>
          <p className="text-sm text-gray-500 mt-1">Add a new product to your catalog</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={isSubmitting}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Form Content */}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6 space-y-6">
        {/* Error Display */}
        {validationErrors.length > 0 && (
          <Alert variant="error" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <div className="text-red-700">
              {validationErrors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </Alert>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                id="name"
                type="text"
                {...form.register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter product name"
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* SKU */}
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                SKU *
              </label>
              <input
                id="sku"
                type="text"
                {...form.register('sku')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder="PROD-001"
              />
              {form.formState.errors.sku && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.sku.message}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <div className="relative">
                <input
                  id="price"
                  type="number"
                  {...form.register('price')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm">USD</span>
                </div>
              </div>
              {form.formState.errors.price && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.price.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              {...form.register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter product description..."
            />
            {form.formState.errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Category */}
          <CategoryDropdown
            value={form.watch('category')}
            onChange={selectedCategories => {
              form.setValue('category', selectedCategories);
              form.trigger('category');
            }}
            placeholder="Select categories..."
            error={form.formState.errors.category?.message}
            required={true}
          />

          {/* Active Status */}
          <div className="flex items-center">
            <input
              id="isActive"
              type="checkbox"
              {...form.register('isActive')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Active Product
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !form.formState.isValid}
            className="inline-flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Creating...
              </>
            ) : (
              'Create Product'
            )}
          </Button>
        </div>
      </form>
    </div>
  );

  return inline ? (
    formContent
  ) : (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl mt-8 mb-8">{formContent}</div>
    </div>
  );
}
