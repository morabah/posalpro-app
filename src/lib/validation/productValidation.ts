/**
 * Product Validation Schema
 * Comprehensive validation for Product creation and editing
 * User Story: US-4.1 (Product Management)
 * Hypothesis: H5 (Modern data fetching improves performance and user experience)
 */

import { VALIDATION_PATTERNS, createValidationSchema } from '@/hooks/useFormValidation';

// ✅ TYPES: Define proper interfaces for product validation
interface ProductAttributes {
  [key: string]: string | number | boolean | string[] | number[];
}

export interface ProductEditData {
  name: string;
  description?: string;
  sku: string;
  price: number;
  currency: string;
  category: string[];
  tags: string[];
  isActive: boolean;
  attributes?: ProductAttributes;
}

// ✅ Product Validation Schema
export const productValidationSchema = createValidationSchema({
  name: {
    required: true,
    minLength: 2,
    maxLength: 200,
    pattern: VALIDATION_PATTERNS.alphanumeric,
    message: 'Please enter a valid product name (2-200 characters)',
  },

  description: {
    required: false,
    maxLength: 1000,
    message: 'Description must be less than 1000 characters',
  },

  sku: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[A-Z0-9\-_]+$/,
    message:
      'SKU must be 3-50 characters and contain only uppercase letters, numbers, hyphens, and underscores',
  },

  price: {
    required: true,
    custom: (value: unknown) => {
      if (value === undefined || value === null) {
        return 'Price is required';
      }
      if (typeof value === 'number') {
        if (value < 0) return 'Price must be positive';
        if (value === 0) return 'Price cannot be zero';
        if (value > 999999999.99) return 'Price must be less than 1 billion';
      } else {
        return 'Price must be a valid number';
      }
      return null;
    },
  },

  currency: {
    required: true,
    custom: (value: unknown) => {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
      if (!value || !validCurrencies.includes(value as string)) {
        return 'Please select a valid currency';
      }
      return null;
    },
  },

  category: {
    required: false,
    custom: (value: unknown) => {
      if (Array.isArray(value)) {
        if (value.length > 10) {
          return 'Maximum 10 categories allowed';
        }
        for (const cat of value) {
          if (typeof cat !== 'string' || cat.length > 50) {
            return 'Each category must be a string with maximum 50 characters';
          }
        }
      }
      return null;
    },
  },

  tags: {
    required: false,
    custom: (value: unknown) => {
      if (Array.isArray(value)) {
        if (value.length > 20) {
          return 'Maximum 20 tags allowed';
        }
        for (const tag of value) {
          if (typeof tag !== 'string' || tag.length > 30) {
            return 'Each tag must be a string with maximum 30 characters';
          }
        }
      }
      return null;
    },
  },

  isActive: {
    required: false,
    custom: (value: unknown) => {
      if (typeof value !== 'boolean') {
        return 'Active status must be a boolean value';
      }
      return null;
    },
  },
});

// ✅ Product Create Validation Schema (for new products)
export const productCreateValidationSchema = createValidationSchema({
  name: {
    required: true,
    minLength: 2,
    maxLength: 200,
    pattern: VALIDATION_PATTERNS.alphanumeric,
    message: 'Please enter a valid product name (2-200 characters)',
  },

  description: {
    required: false,
    maxLength: 1000,
    message: 'Description must be less than 1000 characters',
  },

  sku: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[A-Z0-9\-_]+$/,
    message:
      'SKU must be 3-50 characters and contain only uppercase letters, numbers, hyphens, and underscores',
  },

  price: {
    required: true,
    custom: (value: unknown) => {
      if (value === undefined || value === null) {
        return 'Price is required';
      }
      if (typeof value === 'number') {
        if (value < 0) return 'Price must be positive';
        if (value === 0) return 'Price cannot be zero';
        if (value > 999999999.99) return 'Price must be less than 1 billion';
      } else {
        return 'Price must be a valid number';
      }
      return null;
    },
  },

  currency: {
    required: true,
    custom: (value: unknown) => {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
      if (!value || !validCurrencies.includes(value as string)) {
        return 'Please select a valid currency';
      }
      return null;
    },
  },

  category: {
    required: false,
    custom: (value: unknown) => {
      if (Array.isArray(value)) {
        if (value.length > 10) {
          return 'Maximum 10 categories allowed';
        }
        for (const cat of value) {
          if (typeof cat !== 'string' || cat.length > 50) {
            return 'Each category must be a string with maximum 50 characters';
          }
        }
      }
      return null;
    },
  },

  tags: {
    required: false,
    custom: (value: unknown) => {
      if (Array.isArray(value)) {
        if (value.length > 20) {
          return 'Maximum 20 tags allowed';
        }
        for (const tag of value) {
          if (typeof tag !== 'string' || tag.length > 30) {
            return 'Each tag must be a string with maximum 30 characters';
          }
        }
      }
      return null;
    },
  },

  isActive: {
    required: false,
    custom: (value: unknown) => {
      if (typeof value !== 'boolean') {
        return 'Active status must be a boolean value';
      }
      return null;
    },
  },
});

// ✅ Product Search Validation Schema
export const productSearchValidationSchema = createValidationSchema({
  search: {
    required: false,
    maxLength: 100,
    message: 'Search term must be less than 100 characters',
  },

  category: {
    required: false,
    maxLength: 50,
    message: 'Category filter must be less than 50 characters',
  },

  minPrice: {
    required: false,
    custom: (value: unknown) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'number' && value < 0) return 'Minimum price must be positive';
      }
      return null;
    },
  },

  maxPrice: {
    required: false,
    custom: (value: unknown) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'number' && value < 0) return 'Maximum price must be positive';
      }
      return null;
    },
  },
});

// ✅ Helper function to validate product data
export function validateProductData(data: Partial<ProductEditData>): string[] {
  const errors: string[] = [];

  // Validate required fields
  if (!data.name?.trim()) {
    errors.push('Product name is required');
  } else if (data.name.length < 2) {
    errors.push('Product name must be at least 2 characters');
  } else if (data.name.length > 200) {
    errors.push('Product name must be less than 200 characters');
  }

  if (!data.sku?.trim()) {
    errors.push('SKU is required');
  } else if (data.sku.length < 3) {
    errors.push('SKU must be at least 3 characters');
  } else if (data.sku.length > 50) {
    errors.push('SKU must be less than 50 characters');
  } else if (!/^[A-Z0-9\-_]+$/.test(data.sku)) {
    errors.push('SKU must contain only uppercase letters, numbers, hyphens, and underscores');
  }

  if (data.price === undefined || data.price === null) {
    errors.push('Price is required');
  } else if (typeof data.price === 'number') {
    if (data.price < 0) {
      errors.push('Price must be positive');
    } else if (data.price === 0) {
      errors.push('Price cannot be zero');
    } else if (data.price > 999999999.99) {
      errors.push('Price must be less than 1 billion');
    }
  } else {
    errors.push('Price must be a valid number');
  }

  // Validate optional fields
  if (data.description && data.description.length > 1000) {
    errors.push('Description must be less than 1000 characters');
  }

  if (data.category && Array.isArray(data.category)) {
    if (data.category.length > 10) {
      errors.push('Maximum 10 categories allowed');
    }
    for (const cat of data.category) {
      if (typeof cat !== 'string' || cat.length > 50) {
        errors.push('Each category must be a string with maximum 50 characters');
      }
    }
  }

  if (data.tags && Array.isArray(data.tags)) {
    if (data.tags.length > 20) {
      errors.push('Maximum 20 tags allowed');
    }
    for (const tag of data.tags) {
      if (typeof tag !== 'string' || tag.length > 30) {
        errors.push('Each tag must be a string with maximum 30 characters');
      }
    }
  }

  return errors;
}

// ✅ Helper function to get field-specific validation rules
export function getProductFieldValidation(fieldName: keyof ProductEditData) {
  return productValidationSchema[fieldName] || null;
}

// ✅ SKU validation types
export interface SKUValidationResult {
  success: boolean;
  data?: {
    exists: boolean;
    conflictingProduct?: {
      id: string;
      name: string;
      sku: string;
      isActive: boolean;
    };
  };
  error?: string;
}

// ✅ SKU validation function
export function validateSKUFormat(sku: string): string | null {
  if (!sku || !sku.trim()) {
    return 'SKU is required';
  }

  if (sku.length < 3) {
    return 'SKU must be at least 3 characters';
  }

  if (sku.length > 50) {
    return 'SKU must be less than 50 characters';
  }

  if (!/^[A-Z0-9\-_]+$/.test(sku)) {
    return 'SKU must contain only uppercase letters, numbers, hyphens, and underscores';
  }

  return null;
}
