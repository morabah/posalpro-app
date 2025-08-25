/**
 * Reusable Product Form Fields Component
 * Implements "Composition over Inheritance" pattern
 * Component Traceability: US-4.1, H5
 */

import { Checkbox } from '@/components/ui/Checkbox';
import { FormField } from '@/components/ui/FormField';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useSkuValidation } from '@/hooks/useSkuValidation';

interface ProductFormFieldsProps {
  validation: ReturnType<typeof useFormValidation>;
  skuValidation: ReturnType<typeof useSkuValidation>;
  handleSkuChange: (value: string) => void;
  categoriesData: any;
  tagsData: any;
  categoriesLoading: boolean;
  tagsLoading: boolean;
  mode: 'create' | 'edit';
}

export function ProductFormFields({
  validation,
  skuValidation,
  handleSkuChange,
  categoriesData,
  tagsData,
  categoriesLoading,
  tagsLoading,
  mode,
}: ProductFormFieldsProps) {
  return (
    <>
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

        {/* Name */}
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
        {skuValidation.isValidating && <p className="text-sm text-blue-600">Validating SKU...</p>}
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
      </div>

      {/* Categories and Tags */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Categories & Tags</h3>

        {/* Categories */}
        <SearchableDropdown
          label="Categories"
          placeholder="Select or type categories"
          value={Array.isArray(validation.formData.category) ? validation.formData.category : []}
          onChange={categories => validation.handleFieldChange('category', categories)}
          options={categoriesData?.categories || []}
          isLoading={categoriesLoading}
          error={validation.getFieldError('category')}
        />
        <p className="text-sm text-gray-500">Select from existing categories or type new ones</p>

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
            checked={validation.formData.isActive as boolean}
            onChange={e => validation.handleFieldChange('isActive', e.target.checked)}
            onBlur={() => validation.handleFieldBlur('isActive')}
          />
          <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
            {mode === 'create' ? 'Product is active and available for sale' : 'Active'}
          </label>
        </div>
        {validation.getFieldError('isActive') && (
          <p className="mt-1 text-sm text-red-600">{validation.getFieldError('isActive')}</p>
        )}
      </div>
    </>
  );
}
