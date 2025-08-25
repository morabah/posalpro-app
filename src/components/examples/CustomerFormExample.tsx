'use client';

import { Card } from '@/components/ui/Card';
import { FormActions, FormErrorSummary, FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/forms/Button';
import { useFormValidation } from '@/hooks/useFormValidation';
import { customerValidationSchema } from '@/lib/validation/customerValidation';
import {
  BuildingOfficeIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import React from 'react';

// ✅ Example Customer Form using the new validation library
export function CustomerFormExample() {
  // ✅ Initialize form data
  const initialData = {
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    industry: '',
    annualRevenue: undefined as number | undefined,
    employeeCount: undefined as number | undefined,
    tier: 'bronze',
    tags: [] as string[],
  };

  // ✅ Use the reusable validation hook
  const validation = useFormValidation(initialData, customerValidationSchema, {
    validateOnChange: true,
    validateOnBlur: true,
  });

  // ✅ Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const errors = validation.validateAll();

    if (Object.keys(errors).length > 0) {
      console.log('Validation errors:', errors);
      return;
    }

    // Form is valid, proceed with submission
    console.log('Form data:', validation.formData);
    // Here you would typically call your API
  };

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Form Example</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Summary */}
          <FormErrorSummary errors={validation.validationErrors} />

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

            {/* Company Name */}
            <FormField
              name="name"
              label="Company Name"
              placeholder="Enter company name"
              value={validation.formData.name}
              onChange={value => validation.handleFieldChange('name', value)}
              onBlur={() => validation.handleFieldBlur('name')}
              error={validation.getFieldError('name')}
              touched={validation.isFieldTouched('name')}
              required
              icon={<BuildingOfficeIcon className="w-5 h-5" />}
            />

            {/* Email */}
            <FormField
              name="email"
              label="Email Address"
              type="email"
              placeholder="contact@company.com"
              value={validation.formData.email}
              onChange={value => validation.handleFieldChange('email', value)}
              onBlur={() => validation.handleFieldBlur('email')}
              error={validation.getFieldError('email')}
              touched={validation.isFieldTouched('email')}
              required
              icon={<EnvelopeIcon className="w-5 h-5" />}
            />

            {/* Phone */}
            <FormField
              name="phone"
              label="Phone Number"
              type="tel"
              placeholder="+1234567890"
              value={validation.formData.phone}
              onChange={value => validation.handleFieldChange('phone', value)}
              onBlur={() => validation.handleFieldBlur('phone')}
              error={validation.getFieldError('phone')}
              touched={validation.isFieldTouched('phone')}
              icon={<PhoneIcon className="w-5 h-5" />}
            />
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>

            {/* Website */}
            <FormField
              name="website"
              label="Website"
              type="url"
              placeholder="https://company.com"
              value={validation.formData.website}
              onChange={value => validation.handleFieldChange('website', value)}
              onBlur={() => validation.handleFieldBlur('website')}
              error={validation.getFieldError('website')}
              touched={validation.isFieldTouched('website')}
              icon={<GlobeAltIcon className="w-5 h-5" />}
            />

            {/* Address */}
            <FormField
              name="address"
              label="Address"
              placeholder="Enter company address"
              value={validation.formData.address}
              onChange={value => validation.handleFieldChange('address', value)}
              onBlur={() => validation.handleFieldBlur('address')}
              error={validation.getFieldError('address')}
              touched={validation.isFieldTouched('address')}
              icon={<MapPinIcon className="w-5 h-5" />}
            />
          </div>

          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Business Information</h3>

            {/* Industry */}
            <FormField
              name="industry"
              label="Industry"
              placeholder="e.g., Technology, Healthcare"
              value={validation.formData.industry}
              onChange={value => validation.handleFieldChange('industry', value)}
              onBlur={() => validation.handleFieldBlur('industry')}
              error={validation.getFieldError('industry')}
              touched={validation.isFieldTouched('industry')}
            />

            {/* Annual Revenue */}
            <FormField
              name="annualRevenue"
              label="Annual Revenue"
              type="number"
              placeholder="Enter annual revenue"
              value={validation.formData.annualRevenue}
              onChange={value => validation.handleFieldChange('annualRevenue', value)}
              onBlur={() => validation.handleFieldBlur('annualRevenue')}
              error={validation.getFieldError('annualRevenue')}
              touched={validation.isFieldTouched('annualRevenue')}
            />

            {/* Employee Count */}
            <FormField
              name="employeeCount"
              label="Employee Count"
              type="number"
              placeholder="Enter number of employees"
              value={validation.formData.employeeCount}
              onChange={value => validation.handleFieldChange('employeeCount', value)}
              onBlur={() => validation.handleFieldBlur('employeeCount')}
              error={validation.getFieldError('employeeCount')}
              touched={validation.isFieldTouched('employeeCount')}
            />
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
              Save Customer
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
          </div>
        </div>
      </div>
    </Card>
  );
}
