/**
 * Email Validation Hook
 * Provides real-time email uniqueness validation for any entity forms
 * Configurable for different entities (customers, users, contacts, etc.)
 *
 * @example
 * // For customers (default)
 * const emailValidation = useEmailValidation();
 *
 * // For users
 * const emailValidation = useEmailValidation({
 *   apiEndpoint: '/api/users/validate-email',
 *   userStory: 'US-2.1',
 *   hypothesis: 'H2',
 *   entityType: 'User'
 * });
 */

import { useApiClient } from '@/hooks/useApiClient';
import { analytics } from '@/lib/analytics';
import { logDebug, logError } from '@/lib/logger';
import { useCallback, useState } from 'react';

interface UseEmailValidationOptions {
  debounceMs?: number;
  excludeId?: string;
  apiEndpoint?: string;
  userStory?: string;
  hypothesis?: string;
  entityType?: string;
}

interface EmailValidationState {
  isValidating: boolean;
  isValid: boolean;
  error: string | null;
  exists: boolean;
  conflictingCustomer?: any;
}

export function useEmailValidation(options: UseEmailValidationOptions = {}) {
  const {
    debounceMs = 500,
    excludeId,
    apiEndpoint = '/api/customers/validate-email',
    userStory = 'US-1.1',
    hypothesis = 'H1',
    entityType = 'Customer',
  } = options;
  const apiClient = useApiClient();
  const [validationState, setValidationState] = useState<EmailValidationState>({
    isValidating: false,
    isValid: false,
    error: null,
    exists: false,
  });
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const validateEmailFormat = useCallback((email: string): string | null => {
    // Stricter TLD check: require 2+ alpha characters to avoid invalid calls like test@a.c
    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Invalid email format';
    if (email.length > 254) return 'Email must be 254 characters or less';
    return null;
  }, []);

  const validateEmailUniqueness = useCallback(
    async (email: string) => {
      try {
        const params = new URLSearchParams({ email });
        if (excludeId) {
          params.append('excludeId', excludeId);
        }

        const response = await apiClient.get<{
          success: boolean;
          data: {
            exists: boolean;
            conflictingCustomer?: {
              id: string;
              name: string;
              email: string;
              status: string;
            };
          };
          message: string;
        }>(`${apiEndpoint}?${params.toString()}`);

        logDebug('Email uniqueness validation completed', {
          component: 'useEmailValidation',
          operation: 'validateEmail',
          email,
          exists: response.data?.exists,
          userStory,
          hypothesis,
        });

        if (response.data?.exists) {
          setValidationState({
            isValidating: false,
            isValid: false,
            error: 'Email already exists',
            exists: true,
            conflictingCustomer: response.data.conflictingCustomer,
          });
        } else {
          setValidationState({
            isValidating: false,
            isValid: true,
            error: null,
            exists: false,
            conflictingCustomer: null,
          });
        }

        // Track analytics
        analytics.trackOptimized(
          'email_validation_completed',
          {
            email,
            exists: response.data?.exists || false,
            userStory,
            hypothesis,
          },
          'low'
        );

        return {
          success: true,
          data: {
            exists: response.data?.exists || false,
            conflictingCustomer: response.data?.conflictingCustomer,
          },
        };
      } catch (error) {
        logError('Email uniqueness validation failed', {
          component: 'useEmailValidation',
          operation: 'validateEmailUniqueness',
          email,
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory,
          hypothesis,
        });

        return {
          success: false,
          error: 'Failed to validate email uniqueness',
        };
      }
    },
    [apiClient, excludeId, apiEndpoint, userStory, hypothesis]
  );

  const validateEmail = useCallback(
    async (email: string) => {
      // Clear any existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Set validating state immediately
      setValidationState(prev => ({ ...prev, isValidating: true, error: null }));

      // Client-side format validation first
      const formatError = validateEmailFormat(email);
      if (formatError) {
        setValidationState({
          isValidating: false,
          isValid: false,
          error: formatError,
          exists: false,
        });
        return;
      }

      // Debounced server-side validation
      const timer = setTimeout(async () => {
        try {
          const result = await validateEmailUniqueness(email);

          if (result.success && result.data) {
            setValidationState({
              isValidating: false,
              isValid: !result.data.exists,
              error: result.data.exists ? 'Email already exists' : null,
              exists: result.data.exists,
              conflictingCustomer: result.data.conflictingCustomer,
            });

            // Track analytics
            analytics.trackOptimized(
              'email_validation_completed',
              {
                email,
                exists: result.data?.exists || false,
                userStory,
                hypothesis,
              },
              'low'
            );
          } else {
            setValidationState({
              isValidating: false,
              isValid: false,
              error: result.error || 'Validation failed',
              exists: false,
            });
          }
        } catch (error) {
          setValidationState({
            isValidating: false,
            isValid: false,
            error: 'Validation failed',
            exists: false,
          });
        }
      }, debounceMs);

      setDebounceTimer(timer);
    },
    [
      debounceTimer,
      debounceMs,
      validateEmailFormat,
      validateEmailUniqueness,
      apiEndpoint,
      userStory,
      hypothesis,
    ]
  );

  const clearValidation = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    setValidationState({
      isValidating: false,
      isValid: false,
      error: null,
      exists: false,
    });
  }, [debounceTimer]);

  const getErrorMessage = useCallback(() => {
    if (validationState.error) {
      return validationState.error;
    }
    if (validationState.exists) {
      return 'Email already exists';
    }
    return null;
  }, [validationState]);

  // 🚀 MODERN PATTERN: Direct validation handler for forms
  const handleEmailChange = useCallback(
    (value: string, onFieldChange?: (field: string, value: string) => void) => {
      // Update form field if callback provided
      if (onFieldChange) {
        onFieldChange('email', value);
      }

      // Validate email if it has content
      if (value && value.trim()) {
        validateEmail(value.trim());
      } else {
        clearValidation();
      }
    },
    [validateEmail, clearValidation]
  );

  return {
    isValidating: validationState.isValidating,
    isValid: validationState.isValid,
    error: validationState.error,
    exists: validationState.exists,
    conflictingCustomer: validationState.conflictingCustomer,
    validateEmail,
    validateEmailFormat,
    validateEmailUniqueness,
    clearValidation,
    getErrorMessage,
    // 🚀 NEW: Direct handler for form integration
    handleEmailChange,
  };
}
