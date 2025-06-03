/**
 * PosalPro MVP2 - Centralized Validation Messages
 * Consistent error messages for form validation across the application
 * Supports internationalization and accessibility requirements
 */

export const ValidationMessages = {
  // Common field validation messages
  required: (fieldName: string) => `${fieldName} is required`,
  email: 'Please enter a valid email address',
  password: {
    minLength: (min: number) => `Password must be at least ${min} characters long`,
    maxLength: (max: number) => `Password must be no more than ${max} characters long`,
    pattern:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    mismatch: 'Passwords do not match',
  },
  name: {
    minLength: (min: number) => `Name must be at least ${min} characters long`,
    maxLength: (max: number) => `Name must be no more than ${max} characters long`,
    pattern: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  },
  phone: {
    invalid: 'Please enter a valid phone number',
    format: 'Phone number must be in format: (XXX) XXX-XXXX or XXX-XXX-XXXX',
  },

  // User-specific validation messages
  user: {
    firstName: {
      required: 'First name is required',
      minLength: 'First name must be at least 2 characters long',
      maxLength: 'First name must be no more than 50 characters long',
    },
    lastName: {
      required: 'Last name is required',
      minLength: 'Last name must be at least 2 characters long',
      maxLength: 'Last name must be no more than 50 characters long',
    },
    email: {
      required: 'Email address is required',
      invalid: 'Please enter a valid email address',
      exists: 'This email address is already registered',
    },
    jobTitle: {
      required: 'Job title is required',
      maxLength: 'Job title must be no more than 100 characters long',
    },
    department: {
      required: 'Department selection is required',
      invalid: 'Please select a valid department',
    },
    role: {
      required: 'Role selection is required',
      invalid: 'Please select a valid role',
      unauthorized: 'You do not have permission to assign this role',
    },
  },

  // Authentication validation messages
  auth: {
    login: {
      required: 'Email and password are required',
      invalid: 'Invalid email or password',
      blocked: 'Account has been temporarily blocked due to multiple failed login attempts',
      expired: 'Your session has expired. Please log in again',
    },
    registration: {
      terms: 'You must accept the Terms of Service and Privacy Policy',
      securityQuestion: 'Security question and answer are required',
      roleJustification: 'Justification for role selection is required',
    },
    password: {
      current: 'Current password is required',
      new: 'New password is required',
      confirm: 'Password confirmation is required',
      mismatch: 'New password and confirmation do not match',
      sameAsCurrent: 'New password must be different from current password',
    },
  },

  // Proposal validation messages
  proposal: {
    title: {
      required: 'Proposal title is required',
      minLength: 'Title must be at least 10 characters long',
      maxLength: 'Title must be no more than 200 characters long',
    },
    description: {
      required: 'Proposal description is required',
      minLength: 'Description must be at least 50 characters long',
      maxLength: 'Description must be no more than 2000 characters long',
    },
    customer: {
      required: 'Customer selection is required',
      invalid: 'Please select a valid customer',
    },
    deadline: {
      required: 'Proposal deadline is required',
      pastDate: 'Deadline cannot be in the past',
      tooSoon: 'Deadline must be at least 3 days from now',
    },
    budget: {
      required: 'Budget information is required',
      minimum: (min: number) => `Budget must be at least $${min.toLocaleString()}`,
      maximum: (max: number) => `Budget cannot exceed $${max.toLocaleString()}`,
    },
  },

  // Product validation messages
  product: {
    name: {
      required: 'Product name is required',
      minLength: 'Product name must be at least 3 characters long',
      maxLength: 'Product name must be no more than 100 characters long',
      exists: 'A product with this name already exists',
    },
    category: {
      required: 'Product category is required',
      invalid: 'Please select a valid category',
    },
    pricing: {
      required: 'Pricing information is required',
      minimum: 'Price must be greater than $0',
      format: 'Please enter a valid price amount',
    },
  },

  // File upload validation messages
  file: {
    required: 'File selection is required',
    size: (maxMB: number) => `File size must be less than ${maxMB}MB`,
    type: (allowedTypes: string[]) => `File must be one of: ${allowedTypes.join(', ')}`,
    corrupted: 'File appears to be corrupted. Please select a different file',
    uploadFailed: 'File upload failed. Please try again',
  },

  // Search validation messages
  search: {
    query: {
      required: 'Search query is required',
      minLength: 'Search query must be at least 2 characters long',
      maxLength: 'Search query must be no more than 100 characters long',
    },
    filters: {
      dateRange: 'Please select a valid date range',
      category: 'Please select at least one category',
    },
  },

  // Network and system error messages
  system: {
    network: {
      offline: 'You appear to be offline. Please check your internet connection',
      timeout: 'Request timed out. Please try again',
      serverError: 'Server error occurred. Please try again later',
      unauthorized: 'You are not authorized to perform this action',
      forbidden: 'Access denied. Please contact your administrator',
      notFound: 'The requested resource was not found',
    },
    validation: {
      failed: 'Validation failed. Please check your input and try again',
      invalidData: 'The data provided is invalid. Please review and correct',
      missingFields: 'Some required fields are missing. Please complete the form',
    },
  },

  // Accessibility-specific messages
  accessibility: {
    loading: 'Loading content, please wait',
    error: 'An error occurred',
    success: 'Action completed successfully',
    warning: 'Please review the following warning',
    navigation: {
      skipToContent: 'Skip to main content',
      backToTop: 'Back to top',
      previousPage: 'Go to previous page',
      nextPage: 'Go to next page',
    },
    form: {
      requiredFields: 'Fields marked with an asterisk (*) are required',
      characterCount: (current: number, max: number) => `${current} of ${max} characters used`,
      optionalField: 'This field is optional',
    },
  },
} as const;

/**
 * Type-safe message getter with fallback
 */
export const getMessage = (path: string, fallback: string = 'Invalid input'): string => {
  try {
    const keys = path.split('.');
    let current: any = ValidationMessages;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return fallback;
      }
    }

    return typeof current === 'string' ? current : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Validation message types for TypeScript support
 */
export type ValidationMessagePath =
  | 'user.firstName.required'
  | 'user.email.invalid'
  | 'auth.login.invalid'
  | 'proposal.title.required'
  | 'system.network.offline'
  // Add more specific paths as needed
  | string;

/**
 * Helper function for commonly used validation messages
 */
export const getValidationMessage = (
  field: string,
  type: 'required' | 'invalid' | 'minLength' | 'maxLength' | 'exists',
  context?: { min?: number; max?: number }
): string => {
  switch (type) {
    case 'required':
      return ValidationMessages.required(field);
    case 'invalid':
      return `Please enter a valid ${field.toLowerCase()}`;
    case 'minLength':
      return context?.min
        ? `${field} must be at least ${context.min} characters long`
        : `${field} is too short`;
    case 'maxLength':
      return context?.max
        ? `${field} must be no more than ${context.max} characters long`
        : `${field} is too long`;
    case 'exists':
      return `This ${field.toLowerCase()} already exists`;
    default:
      return `Invalid ${field.toLowerCase()}`;
  }
};
