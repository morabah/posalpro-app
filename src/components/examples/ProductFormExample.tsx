'use client';

import { Card } from '@/components/ui/Card';
import { FormActions, FormErrorSummary, FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/forms/Button';
import { productValidationSchema } from '@/lib/validation/productValidation';
import {
  CubeIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ScaleIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// ✅ Example Product Form using React Hook Form + Zod validation
export function ProductFormExample() {
  // ✅ REACT HOOK FORM SETUP
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(productValidationSchema as any),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      price: undefined,
      cost: undefined,
      category: '',
      tags: [],
      status: 'draft',
      weight: undefined,
    },
  });

  // ✅ FORM SUBMISSION HANDLER
  const onSubmit = async (data: any) => {
    console.log('Form data:', data);
    // Here you would typically call your API
  };

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Form Example</h2>

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
              touched={!!errors.name}
              required
              icon={<CubeIcon className="w-5 h-5" />}
            />

            {/* SKU */}
            <FormField
              name="sku"
              label="SKU"
              placeholder="ABC123456"
              value={validation.formData.sku}
              onChange={value => validation.handleFieldChange('sku', value)}
              onBlur={() => validation.handleFieldBlur('sku')}
              error={validation.getFieldError('sku')}
              touched={validation.isFieldTouched('sku')}
              required
              icon={<TagIcon className="w-5 h-5" />}
            />

            {/* Description */}
            <FormField
              name="description"
              label="Description"
              type="textarea"
              placeholder="Enter product description"
              value={validation.formData.description}
              onChange={value => validation.handleFieldChange('description', value)}
              onBlur={() => validation.handleFieldBlur('description')}
              error={validation.getFieldError('description')}
              touched={validation.isFieldTouched('description')}
              icon={<DocumentTextIcon className="w-5 h-5" />}
            />
          </div>

          {/* Pricing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Pricing Information</h3>

            {/* Price */}
            <FormField
              name="price"
              label="Price"
              type="number"
              placeholder="0.00"
              value={validation.formData.price}
              onChange={value => validation.handleFieldChange('price', value)}
              onBlur={() => validation.handleFieldBlur('price')}
              error={validation.getFieldError('price')}
              touched={validation.isFieldTouched('price')}
              required
              icon={<CurrencyDollarIcon className="w-5 h-5" />}
            />

            {/* Cost */}
            <FormField
              name="cost"
              label="Cost"
              type="number"
              placeholder="0.00"
              value={validation.formData.cost}
              onChange={value => validation.handleFieldChange('cost', value)}
              onBlur={() => validation.handleFieldBlur('cost')}
              error={validation.getFieldError('cost')}
              touched={validation.isFieldTouched('cost')}
              icon={<CurrencyDollarIcon className="w-5 h-5" />}
            />
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Product Details</h3>

            {/* Category */}
            <FormField
              name="category"
              label="Category"
              placeholder="e.g., Electronics, Clothing"
              value={validation.formData.category}
              onChange={value => validation.handleFieldChange('category', value)}
              onBlur={() => validation.handleFieldBlur('category')}
              error={validation.getFieldError('category')}
              touched={validation.isFieldTouched('category')}
            />

            {/* Weight */}
            <FormField
              name="weight"
              label="Weight (kg)"
              type="number"
              placeholder="0.0"
              value={validation.formData.weight}
              onChange={value => validation.handleFieldChange('weight', value)}
              onBlur={() => validation.handleFieldBlur('weight')}
              error={validation.getFieldError('weight')}
              touched={validation.isFieldTouched('weight')}
              icon={<ScaleIcon className="w-5 h-5" />}
            />

            {/* Status */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={validation.formData.status}
                onChange={e => validation.handleFieldChange('status', e.target.value)}
                onBlur={() => validation.handleFieldBlur('status')}
                className={`w-full border-b bg-transparent focus:outline-none ${
                  validation.getFieldError('status') && validation.isFieldTouched('status')
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {validation.getFieldError('status') && validation.isFieldTouched('status') && (
                <p className="text-sm text-red-600">{validation.getFieldError('status')}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <FormActions>
            <Button
              type="button"
              variant="secondary"
              onClick={() => validation.resetForm()}
              disabled={!validation.hasErrors && !validation.formData.name}
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={validation.hasErrors || !validation.isValid}
            >
              Save Product
            </Button>
          </FormActions>
        </form>

        {/* Debug Information */}
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Debug Info:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Form Valid: {validation.isValid ? 'Yes' : 'No'}</div>
            <div>Has Errors: {validation.hasErrors ? 'Yes' : 'No'}</div>
            <div>Error Count: {Object.keys(validation.validationErrors).length}</div>
            <div>Touched Fields: {Array.from(validation.touchedFields).join(', ')}</div>
            <div>Status: {validation.formData.status}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
