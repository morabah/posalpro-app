import {
  createValidationSchema,
  VALIDATION_MESSAGES,
  VALIDATION_PATTERNS,
} from '@/hooks/useFormValidation';

// ✅ Customer Edit Data Interface
export interface CustomerEditData {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  country?: string;
  industry?: string;
  tags: string[];
  tier: string;
  revenue?: number;
  companySize?: string;
}

// ✅ Customer Validation Schema
export const customerValidationSchema = createValidationSchema({
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: VALIDATION_PATTERNS.alphanumeric,
    message: 'Please enter a valid company name (2-100 characters)',
  },

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

  address: {
    required: false,
    maxLength: 200,
    message: 'Address must be less than 200 characters',
  },

  country: {
    required: false,
    maxLength: 100,
    message: 'Country must be less than 100 characters',
  },

  industry: {
    required: false,
    maxLength: 50,
    message: 'Industry must be less than 50 characters',
  },

  revenue: {
    required: false,
    custom: (value: any) => {
      if (value !== undefined && value !== null) {
        if (value < 0) return VALIDATION_MESSAGES.positiveNumber;
        // Allow zero values for revenue
      }
      return null;
    },
  },

  companySize: {
    required: false,
    maxLength: 50,
    message: 'Company size must be less than 50 characters',
  },

  tier: {
    required: true,
    message: 'Please select a customer tier',
  },
});

// ✅ Customer Create Validation Schema (for new customers)
export const customerCreateValidationSchema = createValidationSchema({
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: VALIDATION_PATTERNS.alphanumeric,
    message: 'Please enter a valid company name (2-100 characters)',
  },

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

  address: {
    required: false,
    maxLength: 200,
    message: 'Address must be less than 200 characters',
  },

  country: {
    required: false,
    maxLength: 100,
    message: 'Country must be less than 100 characters',
  },

  industry: {
    required: false,
    maxLength: 50,
    message: 'Industry must be less than 50 characters',
  },

  tier: {
    required: true,
    message: 'Please select a customer tier',
  },
});

// ✅ Customer Search Validation Schema
export const customerSearchValidationSchema = createValidationSchema({
  search: {
    required: false,
    maxLength: 100,
    message: 'Search term must be less than 100 characters',
  },

  industry: {
    required: false,
    maxLength: 50,
    message: 'Industry filter must be less than 50 characters',
  },

  tier: {
    required: false,
    message: 'Please select a valid tier filter',
  },
});

// ✅ Customer Import Validation Schema
export const customerImportValidationSchema = createValidationSchema({
  csvFile: {
    required: true,
    custom: (value: unknown) => {
      const file = value as File | null;
      if (!file) return 'Please select a CSV file to import';
      if (!file.name.endsWith('.csv')) return 'Please select a valid CSV file';
      if (file.size > 5 * 1024 * 1024) return 'File size must be less than 5MB';
      return null;
    },
  },
});

// ✅ Helper function to validate customer data
export function validateCustomerData(data: Partial<CustomerEditData>): string[] {
  const errors: string[] = [];

  // Validate required fields
  if (!data.name?.trim()) {
    errors.push('Company name is required');
  } else if (data.name.length < 2) {
    errors.push('Company name must be at least 2 characters');
  } else if (data.name.length > 100) {
    errors.push('Company name must be less than 100 characters');
  }

  if (!data.email?.trim()) {
    errors.push('Email is required');
  } else if (!VALIDATION_PATTERNS.email.test(data.email)) {
    errors.push(VALIDATION_MESSAGES.email);
  }

  // Validate optional fields (only if they have non-empty values)
  if (data.phone && data.phone.trim() && !VALIDATION_PATTERNS.phone.test(data.phone)) {
    errors.push(VALIDATION_MESSAGES.phone);
  }

  if (data.website && data.website.trim() && !VALIDATION_PATTERNS.url.test(data.website)) {
    errors.push(VALIDATION_MESSAGES.url);
  }

  if (data.address && data.address.length > 200) {
    errors.push('Address must be less than 200 characters');
  }

  if (data.country && data.country.length > 100) {
    errors.push('Country must be less than 100 characters');
  }

  if (data.industry && data.industry.length > 50) {
    errors.push('Industry must be less than 50 characters');
  }

  if (data.revenue !== undefined && data.revenue !== null) {
    if (data.revenue < 0) {
      errors.push(VALIDATION_MESSAGES.positiveNumber);
    } else if (data.revenue === 0) {
      errors.push(VALIDATION_MESSAGES.nonZero);
    }
  }

  if (data.companySize && data.companySize.length > 50) {
    errors.push('Company size must be less than 50 characters');
  }

  if (!data.tier) {
    errors.push('Customer tier is required');
  }

  return errors;
}

// ✅ Helper function to get field-specific validation rules
export function getCustomerFieldValidation(fieldName: keyof CustomerEditData) {
  return customerValidationSchema[fieldName] || null;
}

// ✅ Helper function to validate a single customer field
export function validateCustomerField(
  fieldName: keyof CustomerEditData,
  value: any
): string | null {
  const rule = customerValidationSchema[fieldName];
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
