import {
  createValidationSchema,
  VALIDATION_MESSAGES,
  VALIDATION_PATTERNS,
} from '@/hooks/useFormValidation';

// ✅ Product Data Interface
export interface ProductEditData {
  name: string;
  description?: string;
  sku: string;
  price: number;
  cost?: number;
  category?: string;
  tags: string[];
  status: 'active' | 'inactive' | 'draft';
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
}

// ✅ Product Validation Schema
export const productValidationSchema = createValidationSchema({
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: VALIDATION_PATTERNS.alphanumeric,
    message: 'Please enter a valid product name (2-100 characters)',
  },

  description: {
    required: false,
    maxLength: 500,
    message: 'Description must be less than 500 characters',
  },

  sku: {
    required: true,
    pattern: /^[A-Z0-9]{6,12}$/,
    message: 'SKU must be 6-12 characters (uppercase letters and numbers)',
  },

  price: {
    required: true,
    custom: (value: any) => {
      if (value === undefined || value === null) {
        return 'Price is required';
      }
      if (value <= 0) {
        return 'Price must be greater than 0';
      }
      if (value > 999999.99) {
        return 'Price cannot exceed $999,999.99';
      }
      return null;
    },
  },

  cost: {
    required: false,
    custom: (value: any) => {
      if (value !== undefined && value !== null) {
        if (value < 0) {
          return 'Cost cannot be negative';
        }
        if (value > 999999.99) {
          return 'Cost cannot exceed $999,999.99';
        }
      }
      return null;
    },
  },

  category: {
    required: false,
    maxLength: 50,
    message: 'Category must be less than 50 characters',
  },

  status: {
    required: true,
    custom: (value: any) => {
      const validStatuses = ['active', 'inactive', 'draft'];
      if (!validStatuses.includes(value)) {
        return 'Please select a valid status';
      }
      return null;
    },
  },

  weight: {
    required: false,
    custom: (value: any) => {
      if (value !== undefined && value !== null) {
        if (value < 0) {
          return 'Weight cannot be negative';
        }
        if (value > 1000) {
          return 'Weight cannot exceed 1000 kg';
        }
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
    maxLength: 100,
    pattern: VALIDATION_PATTERNS.alphanumeric,
    message: 'Please enter a valid product name (2-100 characters)',
  },

  sku: {
    required: true,
    pattern: /^[A-Z0-9]{6,12}$/,
    message: 'SKU must be 6-12 characters (uppercase letters and numbers)',
  },

  price: {
    required: true,
    custom: (value: any) => {
      if (value === undefined || value === null) {
        return 'Price is required';
      }
      if (value <= 0) {
        return 'Price must be greater than 0';
      }
      if (value > 999999.99) {
        return 'Price cannot exceed $999,999.99';
      }
      return null;
    },
  },

  status: {
    required: true,
    custom: (value: any) => {
      const validStatuses = ['active', 'inactive', 'draft'];
      if (!validStatuses.includes(value)) {
        return 'Please select a valid status';
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
    custom: (value: any) => {
      if (value !== undefined && value !== null) {
        if (value < 0) {
          return 'Minimum price cannot be negative';
        }
      }
      return null;
    },
  },

  maxPrice: {
    required: false,
    custom: (value: any) => {
      if (value !== undefined && value !== null) {
        if (value < 0) {
          return 'Maximum price cannot be negative';
        }
      }
      return null;
    },
  },

  status: {
    required: false,
    custom: (value: any) => {
      if (value && !['active', 'inactive', 'draft'].includes(value)) {
        return 'Please select a valid status filter';
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
  } else if (data.name.length > 100) {
    errors.push('Product name must be less than 100 characters');
  }

  if (!data.sku?.trim()) {
    errors.push('SKU is required');
  } else if (!/^[A-Z0-9]{6,12}$/.test(data.sku)) {
    errors.push('SKU must be 6-12 characters (uppercase letters and numbers)');
  }

  if (data.price === undefined || data.price === null) {
    errors.push('Price is required');
  } else if (data.price <= 0) {
    errors.push('Price must be greater than 0');
  } else if (data.price > 999999.99) {
    errors.push('Price cannot exceed $999,999.99');
  }

  // Validate optional fields
  if (data.description && data.description.length > 500) {
    errors.push('Description must be less than 500 characters');
  }

  if (data.category && data.category.length > 50) {
    errors.push('Category must be less than 50 characters');
  }

  if (data.cost !== undefined && data.cost !== null) {
    if (data.cost < 0) {
      errors.push('Cost cannot be negative');
    } else if (data.cost > 999999.99) {
      errors.push('Cost cannot exceed $999,999.99');
    }
  }

  if (data.weight !== undefined && data.weight !== null) {
    if (data.weight < 0) {
      errors.push('Weight cannot be negative');
    } else if (data.weight > 1000) {
      errors.push('Weight cannot exceed 1000 kg');
    }
  }

  if (!data.status) {
    errors.push('Product status is required');
  } else if (!['active', 'inactive', 'draft'].includes(data.status)) {
    errors.push('Please select a valid status');
  }

  return errors;
}

// ✅ Helper function to get field-specific validation rules
export function getProductFieldValidation(fieldName: keyof ProductEditData) {
  return productValidationSchema[fieldName] || null;
}

// ✅ Helper function to validate a single product field
export function validateProductField(fieldName: keyof ProductEditData, value: any): string | null {
  const rule = productValidationSchema[fieldName];
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
}
