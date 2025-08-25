'use client';

import { useCallback, useMemo, useState } from 'react';

// ✅ Validation Rules Interface
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
  message?: string;
}

// ✅ Validation Schema Interface
export interface ValidationSchema {
  [fieldName: string]: ValidationRule;
}

// ✅ Form Data Interface
export interface FormData {
  [fieldName: string]: unknown;
}

// ✅ Generic form data type for better type safety
export type GenericFormData = Record<string, unknown> | { [key: string]: unknown };

// ✅ Validation Errors Interface
export interface ValidationErrors {
  [fieldName: string]: string;
}

// ✅ Built-in Validation Patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[+]?[\d][\d\s\-()]{0,20}$/,
  url: /^https?:\/\/.+/,
  numeric: /^\d+$/,
  alphanumeric: /^[a-zA-Z0-9\s]+$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^\d{2}:\d{2}$/,
  zipCode: /^\d{5}(-\d{4})?$/,
  currency: /^\d+(\.\d{1,2})?$/,
} as const;

// ✅ Built-in Validation Messages
export const VALIDATION_MESSAGES = {
  required: 'This field is required',
  email: 'Please enter a valid email address (e.g., contact@company.com)',
  phone: 'Please enter a valid phone number (e.g., +1234567890 or 123-456-7890)',
  url: 'Please enter a valid website URL starting with http:// or https://',
  numeric: 'Please enter numbers only',
  alphanumeric: 'Please enter letters and numbers only',
  date: 'Please enter a valid date (YYYY-MM-DD)',
  time: 'Please enter a valid time (HH:MM)',
  zipCode: 'Please enter a valid ZIP code',
  currency: 'Please enter a valid amount',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be no more than ${max} characters`,
  minValue: (min: number) => `Must be at least ${min}`,
  maxValue: (max: number) => `Must be no more than ${max}`,
  positiveNumber: 'Please enter a positive number',
  nonZero: 'This value cannot be zero - please enter a positive number or leave empty',
} as const;

// ✅ Reusable Form Validation Hook
export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  validationSchema: ValidationSchema,
  options?: {
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    debounceMs?: number;
  }
) {
  const [formData, setFormData] = useState<T>(initialData);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const { validateOnChange = true, validateOnBlur = true } = options || {};

  // ✅ Validate a single field
  const validateField = useCallback(
    (fieldName: string, value: unknown): string | null => {
      const rule = validationSchema[fieldName];
      if (!rule) return null;

      // Required validation
      if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
        return rule.message || VALIDATION_MESSAGES.required;
      }

      // Skip other validations if value is empty and not required
      if (!value || (typeof value === 'string' && !value.trim())) {
        return null;
      }

      // Min length validation
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        return rule.message || VALIDATION_MESSAGES.minLength(rule.minLength);
      }

      // Max length validation
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        return rule.message || VALIDATION_MESSAGES.maxLength(rule.maxLength);
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        return rule.message || 'Invalid format';
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          return rule.message || customError;
        }
      }

      return null;
    },
    [validationSchema]
  );

  // ✅ Validate all fields
  const validateAll = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {};

    Object.keys(validationSchema).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        errors[fieldName] = error;
      }
    });

    setValidationErrors(errors);
    return errors;
  }, [formData, validationSchema, validateField]);

  // ✅ Check if form is valid
  const isValid = useMemo(() => {
    return Object.keys(validationSchema).every(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      return !error;
    });
  }, [formData, validationSchema, validateField]);

  // ✅ Check if form has any errors
  const hasErrors = useMemo(() => {
    return Object.keys(validationErrors).length > 0;
  }, [validationErrors]);

  // ✅ Handle field change with validation
  const handleFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      setFormData(prev => ({ ...prev, [fieldName]: value }));

      // Clear previous error for this field by removing it entirely
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });

      // Validate on change if enabled
      if (validateOnChange) {
        const error = validateField(fieldName, value);
        if (error) {
          setValidationErrors(prev => ({ ...prev, [fieldName]: error }));
        }
      }
    },
    [validateOnChange, validateField]
  );

  // ✅ Handle field blur with validation
  const handleFieldBlur = useCallback(
    (fieldName: string) => {
      setTouchedFields(prev => new Set(prev).add(fieldName));

      if (validateOnBlur) {
        const error = validateField(fieldName, formData[fieldName]);
        if (error) {
          setValidationErrors(prev => ({ ...prev, [fieldName]: error }));
        } else {
          // Remove error if field is now valid
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
          });
        }
      }
    },
    [validateOnBlur, validateField, formData]
  );

  // ✅ Reset form
  const resetForm = useCallback(
    (newData?: T | Partial<T>) => {
      setFormData((newData || initialData) as T);
      setValidationErrors({});
      setTouchedFields(new Set());
    },
    [initialData]
  );

  // ✅ Set form data
  const setData = useCallback((data: T) => {
    setFormData(data);
  }, []);

  // ✅ Get field error
  const getFieldError = useCallback(
    (fieldName: string): string => {
      return validationErrors[fieldName] || '';
    },
    [validationErrors]
  );

  // ✅ Check if field is touched
  const isFieldTouched = useCallback(
    (fieldName: string): boolean => {
      return touchedFields.has(fieldName);
    },
    [touchedFields]
  );

  // ✅ Get field validation class
  const getFieldValidationClass = useCallback(
    (fieldName: string): string => {
      const error = validationErrors[fieldName];
      const touched = touchedFields.has(fieldName);

      if (error && touched) {
        return 'border-red-500 focus:border-red-500';
      }
      return 'border-gray-300 focus:border-blue-500';
    },
    [validationErrors, touchedFields]
  );

  return {
    // Data
    formData,
    validationErrors,
    touchedFields,

    // State
    isValid,
    hasErrors,

    // Actions
    handleFieldChange,
    handleFieldBlur,
    validateField,
    validateAll,
    resetForm,
    setData,

    // Utilities
    getFieldError,
    isFieldTouched,
    getFieldValidationClass,
  };
}

// ✅ Predefined Validation Schemas
export const COMMON_VALIDATION_SCHEMAS = {
  email: {
    required: true,
    pattern: VALIDATION_PATTERNS.email,
    message: VALIDATION_MESSAGES.email,
  },

  phone: {
    required: false,
    pattern: VALIDATION_PATTERNS.phone,
    message: VALIDATION_MESSAGES.phone,
  },

  website: {
    required: false,
    pattern: VALIDATION_PATTERNS.url,
    message: VALIDATION_MESSAGES.url,
  },

  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: VALIDATION_PATTERNS.alphanumeric,
    message: 'Please enter a valid name (2-100 characters)',
  },

  positiveNumber: {
    required: false,
    custom: (value: unknown) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'number' && value < 0) return VALIDATION_MESSAGES.positiveNumber;
        if (typeof value === 'number' && value === 0) return VALIDATION_MESSAGES.nonZero;
      }
      return null;
    },
  },

  required: {
    required: true,
    message: VALIDATION_MESSAGES.required,
  },
} as const;

// ✅ Helper function to create validation schema
export function createValidationSchema(schema: ValidationSchema): ValidationSchema {
  return schema;
}
