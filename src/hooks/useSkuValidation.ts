/**
 * SKU Validation Hook
 * Provides real-time SKU uniqueness validation for product forms
 * User Story: US-4.1 (Product Management)
 * Hypothesis: H5 (Modern data fetching improves performance and user experience)
 */

import { useApiClient } from '@/hooks/useApiClient';
import { analytics } from '@/lib/analytics';
import { logDebug, logError } from '@/lib/logger';
import { SKUValidationResult, validateSKUFormat } from '@/lib/validation/productValidation';
import { useCallback, useState } from 'react';

interface UseSkuValidationOptions {
  debounceMs?: number;
  excludeId?: string;
}

interface SkuValidationState {
  isValidating: boolean;
  isValid: boolean;
  error: string | null;
  exists: boolean;
  conflictingProduct?: any;
}

export function useSkuValidation(options: UseSkuValidationOptions = {}) {
  const { debounceMs = 500, excludeId } = options;
  const apiClient = useApiClient();
  const [validationState, setValidationState] = useState<SkuValidationState>({
    isValidating: false,
    isValid: false,
    error: null,
    exists: false,
  });
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const validateSkuFormat = useCallback((sku: string): string | null => {
    return validateSKUFormat(sku);
  }, []);

  const validateSkuUniqueness = useCallback(
    async (sku: string): Promise<SKUValidationResult> => {
      try {
        const params = new URLSearchParams({ sku });
        if (excludeId) {
          params.append('excludeId', excludeId);
        }

        const response = await apiClient.get<{
          success: boolean;
          data: {
            exists: boolean;
            conflictingProduct?: {
              id: string;
              name: string;
              sku: string;
              isActive: boolean;
            };
          };
          message: string;
        }>(`/api/products/validate-sku?${params.toString()}`);

        logDebug('SKU uniqueness validation completed', {
          component: 'useSkuValidation',
          operation: 'validateSku',
          sku,
          exists: response.data?.exists,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });

        if (response.data?.exists) {
          setValidationState({
            isValidating: false,
            isValid: false,
            error: 'SKU already exists',
            exists: true,
            conflictingProduct: response.data.conflictingProduct,
          });
        } else {
          setValidationState({
            isValidating: false,
            isValid: true,
            error: null,
            exists: false,
            conflictingProduct: null,
          });
        }

        // Track analytics
        analytics.trackOptimized(
          'sku_validation_completed',
          {
            sku,
            exists: response.data?.exists || false,
            userStory: 'US-4.1',
            hypothesis: 'H5',
          },
          'low'
        );

        return {
          success: true,
          data: {
            exists: response.data?.exists || false,
            conflictingProduct: response.data?.conflictingProduct,
          },
        };
      } catch (error) {
        logError('SKU uniqueness validation failed', {
          component: 'useSkuValidation',
          operation: 'validateSkuUniqueness',
          sku,
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: 'US-4.1',
          hypothesis: 'H5',
        });

        return {
          success: false,
          error: 'Failed to validate SKU uniqueness',
        };
      }
    },
    [apiClient, excludeId]
  );

  const validateSku = useCallback(
    async (sku: string) => {
      // Clear any existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Set validating state immediately
      setValidationState(prev => ({ ...prev, isValidating: true, error: null }));

      // Client-side format validation first
      const formatError = validateSkuFormat(sku);
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
          const result = await validateSkuUniqueness(sku);

          if (result.success && result.data) {
            setValidationState({
              isValidating: false,
              isValid: !result.data.exists,
              error: result.data.exists ? 'SKU already exists' : null,
              exists: result.data.exists,
              conflictingProduct: result.data.conflictingProduct,
            });

            // Track analytics
            analytics.trackOptimized(
              'sku_validation_completed',
              {
                sku,
                exists: result.data?.exists || false,
                userStory: 'US-4.1',
                hypothesis: 'H5',
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
    [debounceTimer, debounceMs, validateSkuFormat, validateSkuUniqueness]
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
      return 'SKU already exists';
    }
    return null;
  }, [validationState]);

  // 🚀 MODERN PATTERN: Direct validation handler for forms
  const handleSkuChange = useCallback(
    (value: string, onFieldChange?: (field: string, value: string) => void) => {
      const upperSku = value.toUpperCase();

      // Update form field if callback provided
      if (onFieldChange) {
        onFieldChange('sku', upperSku);
      }

      // Validate SKU if it has content
      if (upperSku && upperSku.trim()) {
        validateSku(upperSku);
      } else {
        clearValidation();
      }
    },
    [validateSku, clearValidation]
  );

  return {
    isValidating: validationState.isValidating,
    isValid: validationState.isValid,
    error: validationState.error,
    exists: validationState.exists,
    conflictingProduct: validationState.conflictingProduct,
    validateSku,
    validateSkuFormat,
    validateSkuUniqueness,
    clearValidation,
    getErrorMessage,
    // 🚀 NEW: Direct handler for form integration
    handleSkuChange,
  };
}
