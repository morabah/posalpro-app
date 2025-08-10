/**
 * PosalPro MVP2 - Form Validation Helpers
 * React Hook Form + Zod integration utilities
 * Provides reusable form validation patterns and error handling
 */

import { FieldError, FieldErrors, UseFormSetError, Path } from 'react-hook-form';
import { z } from 'zod';

/**
 * Convert Zod validation errors to React Hook Form errors
 */
export const zodErrorsToFormErrors = <TFieldValues extends Record<string, unknown>>(
  zodError: z.ZodError,
  setError: UseFormSetError<TFieldValues>
) => {
  zodError.errors.forEach(error => {
    const name = (error.path.length === 0
      ? 'root'
      : (error.path.join('.') as unknown)) as Path<TFieldValues> | 'root';
    setError(name, {
      type: 'validation',
      message: error.message,
    });
  });
};

/**
 * Extract field-level errors from React Hook Form errors
 */
export const getFieldError = <TFieldValues extends Record<string, unknown>>(
  fieldName: string,
  errors: FieldErrors<TFieldValues>
): FieldError | undefined => {
  const path = fieldName.split('.');
  let current: unknown = errors;

  for (const key of path) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  // Check if current is a FieldError (has message property)
  if (current && typeof current === 'object' && 'message' in (current as Record<string, unknown>)) {
    return current as FieldError;
  }

  return undefined;
};

/**
 * Get error message for a specific field
 */
export const getFieldErrorMessage = <TFieldValues extends Record<string, unknown>>(
  fieldName: string,
  errors: FieldErrors<TFieldValues>
): string | undefined => {
  const error = getFieldError<TFieldValues>(fieldName, errors);
  return error?.message;
};

/**
 * Check if a specific field has an error
 */
export const hasFieldError = <TFieldValues extends Record<string, unknown>>(
  fieldName: string,
  errors: FieldErrors<TFieldValues>
): boolean => {
  return !!getFieldError<TFieldValues>(fieldName, errors);
};

/**
 * Get CSS classes for form field based on validation state
 */
export const getFieldClasses = <TFieldValues extends Record<string, unknown>>(
  fieldName: string,
  errors: FieldErrors<TFieldValues>,
  baseClasses: string = 'form-field',
  errorClasses: string = 'border-error-500 focus:border-error-500 focus:ring-error-500'
): string => {
  const hasError = hasFieldError<TFieldValues>(fieldName, errors);
  return hasError ? `${baseClasses} ${errorClasses}` : baseClasses;
};

/**
 * Validation state for form fields
 */
export type FieldValidationState = 'idle' | 'validating' | 'valid' | 'invalid';

/**
 * Get validation state for a form field
 */
export const getFieldValidationState = <TFieldValues extends Record<string, unknown>>(
  fieldName: string,
  errors: FieldErrors<TFieldValues>,
  isValidating?: boolean,
  touchedFields?: Record<string, boolean>
): FieldValidationState => {
  if (isValidating) return 'validating';

  const isTouched = touchedFields?.[fieldName];
  const hasError = hasFieldError(fieldName, errors);

  if (!isTouched) return 'idle';
  if (hasError) return 'invalid';
  return 'valid';
};

/**
 * Form validation configuration
 */
export interface FormValidationConfig<T extends z.ZodType<unknown>> {
  schema: T;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  resolver?: (values: unknown, context?: unknown) => unknown; // zodResolver will be passed here
}

/**
 * Common form field validation patterns
 */
export const fieldValidationPatterns = {
  /**
   * Password strength indicator
   */
  getPasswordStrength: (
    password: string
  ): {
    score: number;
    label: string;
    requirements: Array<{ met: boolean; text: string }>;
  } => {
    const requirements = [
      { regex: /.{8,}/, text: 'At least 8 characters' },
      { regex: /[A-Z]/, text: 'One uppercase letter' },
      { regex: /[a-z]/, text: 'One lowercase letter' },
      { regex: /[0-9]/, text: 'One number' },
      { regex: /[^A-Za-z0-9]/, text: 'One special character' },
    ];

    const results = requirements.map(req => ({
      met: req.regex.test(password),
      text: req.text,
    }));

    const score = results.filter(r => r.met).length;

    let label = 'Very Weak';
    if (score >= 5) label = 'Very Strong';
    else if (score >= 4) label = 'Strong';
    else if (score >= 3) label = 'Medium';
    else if (score >= 2) label = 'Weak';

    return { score, label, requirements: results };
  },

  /**
   * Email validation with domain suggestions
   */
  validateEmailWithSuggestions: (
    email: string
  ): {
    isValid: boolean;
    suggestions: string[];
  } => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const suggestions: string[] = [];

    // Common domain typos
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const [local, domain] = email.split('@');

    if (domain && !isValid) {
      commonDomains.forEach(commonDomain => {
        if (domain.toLowerCase().includes(commonDomain.slice(0, 3))) {
          suggestions.push(`${local}@${commonDomain}`);
        }
      });
    }

    return { isValid, suggestions };
  },

  /**
   * Phone number formatting and validation
   */
  formatPhoneNumber: (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }

    return value;
  },
};

/**
 * Form submission helpers
 */
export const formSubmissionHelpers = {
  /**
   * Handle form submission with loading state
   */
  createSubmissionHandler: <T>(
    onSubmit: (data: T) => Promise<void>,
    setIsLoading: (loading: boolean) => void,
    setError: (error: string | null) => void
  ) => {
    return async (data: T) => {
      try {
        setIsLoading(true);
        setError(null);
        await onSubmit(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
  },

  /**
   * Create optimistic update handler
   */
  createOptimisticHandler: <T>(
    onSubmit: (data: T) => Promise<void>,
    onOptimisticUpdate: (data: T) => void,
    onRevert: () => void
  ) => {
    return async (data: T) => {
      // Apply optimistic update
      onOptimisticUpdate(data);

      try {
        await onSubmit(data);
      } catch (error) {
        // Revert on failure
        onRevert();
        throw error;
      }
    };
  },
};

/**
 * Validation timing helpers
 */
export const validationTiming = {
  /**
   * Debounced validation for real-time feedback
   */
  createDebouncedValidator: <T>(validator: (value: T) => Promise<boolean>, delay: number = 300) => {
    let timeoutId: NodeJS.Timeout;

    return (value: T): Promise<boolean> => {
      return new Promise(resolve => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          const result = await validator(value);
          resolve(result);
        }, delay);
      });
    };
  },

  /**
   * Throttled validation to limit API calls
   */
  createThrottledValidator: <T>(
    validator: (value: T) => Promise<boolean>,
    interval: number = 1000
  ) => {
    let lastCall = 0;
    let lastResult: boolean | null = null;

    return async (value: T): Promise<boolean> => {
      const now = Date.now();

      if (now - lastCall < interval && lastResult !== null) {
        return lastResult;
      }

      lastCall = now;
      lastResult = await validator(value);
      return lastResult;
    };
  },
};

/**
 * Form analytics integration
 */
export const formAnalytics = {
  /**
   * Track form field interactions
   */
  
  // Typed analytics function signature used across helpers
  // event, payload, optional priority
  
  trackFieldInteraction: (
    fieldName: string,
    action: 'focus' | 'blur' | 'change' | 'error',
    analytics?: (event: string, payload: Record<string, unknown>, priority?: 'low' | 'medium' | 'high') => void
  ) => {
    if (analytics) {
      analytics('form_field_interaction', {
        field: fieldName,
        action,
      }, 'low');
    }
  },

  /**
   * Track form submission attempts
   */
  trackFormSubmission: (
    formName: string,
    success: boolean,
    errors?: string[],
    analytics?: (event: string, payload: Record<string, unknown>, priority?: 'low' | 'medium' | 'high') => void
  ) => {
    if (analytics) {
      analytics('form_submission', {
        form: formName,
        success,
        errors,
      }, 'medium');
    }
  },

  /**
   * Track validation errors
   */
  trackValidationErrors: (
    formName: string,
    errors: Record<string, string>,
    analytics?: (event: string, payload: Record<string, unknown>, priority?: 'low' | 'medium' | 'high') => void
  ) => {
    if (analytics) {
      analytics('form_validation_errors', {
        form: formName,
        errorCount: Object.keys(errors).length,
        errorFields: Object.keys(errors),
      }, 'medium');
    }
  },
};
