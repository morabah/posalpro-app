/**
 * API Response Handler Utilities
 * Defensive programming utilities for handling various API response structures
 * Prevents errors like "response.data.map is not a function"
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';

// Initialize error handling service
const errorHandlingService = ErrorHandlingService.getInstance();

// Type definitions for API responses
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T = unknown> {
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiResponseWithPagination<T = unknown> extends ApiResponse<PaginatedResponse<T>> {}

/**
 * Safely extracts an array from an API response with unknown structure
 * Handles multiple common response patterns defensively
 */
export function extractArrayFromResponse<T = unknown>(
  response: ApiResponse<unknown>,
  arrayKey?: string,
  fallback: T[] = []
): T[] {
  if (!response) {
    // Use ErrorHandlingService for structured logging
    errorHandlingService.processError(
      new Error('No response provided to extractArrayFromResponse'),
      'API response extraction failed - no response',
      ErrorCodes.API.INVALID_RESPONSE,
      {
        component: 'apiResponseHandler',
        operation: 'extractArrayFromResponse',
        userFriendlyMessage: 'Invalid API response received.',
      }
    );
    return fallback;
  }

  // Log response structure for debugging with structured error handling
  errorHandlingService.processError(
    new Error('API Response structure analysis'),
    'Analyzing API response structure',
    ErrorCodes.SYSTEM.DEBUG_INFO,
    {
      component: 'apiResponseHandler',
      operation: 'extractArrayFromResponse',
      responseStructure: {
        success: response.success,
        hasData: !!response.data,
        dataType: typeof response.data,
        isDataArray: Array.isArray(response.data),
        keys: response.data ? Object.keys(response.data) : [],
      },
      userFriendlyMessage: 'Processing API response...',
    }
  );

  // Check if response indicates failure
  if (response.success === false) {
    errorHandlingService.processError(
      new Error('API response indicates failure'),
      'API operation failed',
      ErrorCodes.API.REQUEST_FAILED,
      {
        component: 'apiResponseHandler',
        operation: 'extractArrayFromResponse',
        responseError: response.error || response.message,
        userFriendlyMessage: 'The requested operation failed. Please try again.',
      }
    );
    return fallback;
  }

  // If no data property, return fallback
  if (!response.data) {
    errorHandlingService.processError(
      new Error('No data property in API response'),
      'Missing data in API response',
      ErrorCodes.API.INVALID_RESPONSE,
      {
        component: 'apiResponseHandler',
        operation: 'extractArrayFromResponse',
        userFriendlyMessage: 'No data returned from server.',
      }
    );
    return fallback;
  }

  const responseData = response.data as Record<string, unknown>;

  // Pattern 1: Direct array response
  if (Array.isArray(responseData)) {
    errorHandlingService.processError(
      new Error(`Found direct array with ${responseData.length} items`),
      'Direct array response detected',
      ErrorCodes.SYSTEM.DEBUG_INFO,
      {
        component: 'apiResponseHandler',
        operation: 'extractArrayFromResponse',
        pattern: 'direct_array',
        itemCount: responseData.length,
        userFriendlyMessage: `Found ${responseData.length} items.`,
      }
    );
    return responseData;
  }

  // Pattern 2: Specific key provided
  if (arrayKey && responseData[arrayKey] && Array.isArray(responseData[arrayKey])) {
    errorHandlingService.processError(
      new Error(`Found array in ${arrayKey} with ${responseData[arrayKey].length} items`),
      'Specific key array found',
      ErrorCodes.SYSTEM.DEBUG_INFO,
      {
        component: 'apiResponseHandler',
        operation: 'extractArrayFromResponse',
        pattern: 'specific_key',
        arrayKey,
        itemCount: responseData[arrayKey].length,
        userFriendlyMessage: `Found ${responseData[arrayKey].length} items.`,
      }
    );
    return responseData[arrayKey];
  }

  // Pattern 3: Common nested patterns
  const commonKeys = ['data', 'items', 'results', 'list', 'records'];
  for (const key of commonKeys) {
    if (responseData[key] && Array.isArray(responseData[key])) {
      errorHandlingService.processError(
        new Error(`Found array in ${key} with ${responseData[key].length} items`),
        'Common pattern array found',
        ErrorCodes.SYSTEM.DEBUG_INFO,
        {
          component: 'apiResponseHandler',
          operation: 'extractArrayFromResponse',
          pattern: 'common_nested',
          arrayKey: key,
          itemCount: responseData[key].length,
          userFriendlyMessage: `Found ${responseData[key].length} items.`,
        }
      );
      return responseData[key];
    }
  }

  // Pattern 4: Resource-specific patterns
  const resourceKeys = ['proposals', 'users', 'products', 'customers', 'teams'];
  for (const key of resourceKeys) {
    if (responseData[key] && Array.isArray(responseData[key])) {
      errorHandlingService.processError(
        new Error(`Found array in ${key} with ${responseData[key].length} items`),
        'Resource-specific array found',
        ErrorCodes.SYSTEM.DEBUG_INFO,
        {
          component: 'apiResponseHandler',
          operation: 'extractArrayFromResponse',
          pattern: 'resource_specific',
          arrayKey: key,
          itemCount: responseData[key].length,
          userFriendlyMessage: `Found ${responseData[key].length} items.`,
        }
      );
      return responseData[key];
    }
  }

  // Pattern 5: Search for any array property
  const arrayProperties = Object.entries(responseData)
    .filter(([_, value]) => Array.isArray(value))
    .map(([key, value]) => ({ key, array: value as T[] }));

  if (arrayProperties.length > 0) {
    const { key, array } = arrayProperties[0];
    errorHandlingService.processError(
      new Error(`Found array in property '${key}' with ${array.length} items`),
      'Dynamic array property found',
      ErrorCodes.SYSTEM.DEBUG_INFO,
      {
        component: 'apiResponseHandler',
        operation: 'extractArrayFromResponse',
        pattern: 'dynamic_search',
        arrayKey: key,
        itemCount: array.length,
        userFriendlyMessage: `Found ${array.length} items.`,
      }
    );
    return array;
  }

  // Pattern 6: Pagination structure
  if (responseData.pagination && responseData.data && Array.isArray(responseData.data)) {
    errorHandlingService.processError(
      new Error(`Found paginated array with ${responseData.data.length} items`),
      'Paginated array found',
      ErrorCodes.SYSTEM.DEBUG_INFO,
      {
        component: 'apiResponseHandler',
        operation: 'extractArrayFromResponse',
        pattern: 'paginated',
        itemCount: responseData.data.length,
        userFriendlyMessage: `Found ${responseData.data.length} items.`,
      }
    );
    return responseData.data;
  }

  // No array found - log comprehensive error
  errorHandlingService.processError(
    new Error('No array found in response structure'),
    'Array extraction failed',
    ErrorCodes.API.INVALID_RESPONSE,
    {
      component: 'apiResponseHandler',
      operation: 'extractArrayFromResponse',
      responseDataStructure: responseData,
      userFriendlyMessage: 'No data could be extracted from server response.',
    }
  );

  return fallback;
}

/**
 * Type-safe wrapper for PaginatedResponse extraction
 */
export function extractPaginatedArray<T = unknown>(
  response: ApiResponseWithPagination<T>,
  fallback: T[] = []
): { data: T[]; pagination?: PaginatedResponse<T>['pagination'] } {
  const data = extractArrayFromResponse<T>(response, undefined, fallback);
  const pagination = (response?.data as PaginatedResponse<T>)?.pagination;

  return {
    data,
    pagination,
  };
}

/**
 * Validates that a response has the expected structure
 */
export function validateResponseStructure(
  response: ApiResponse<unknown>,
  requiredFields: string[] = ['success']
): boolean {
  if (!response || typeof response !== 'object') {
    errorHandlingService.processError(
      new Error('Response is not an object'),
      'Invalid response structure',
      ErrorCodes.API.INVALID_RESPONSE,
      {
        component: 'apiResponseHandler',
        operation: 'validateResponseStructure',
        responseType: typeof response,
        userFriendlyMessage: 'Invalid server response format.',
      }
    );
    return false;
  }

  for (const field of requiredFields) {
    if (!(field in response)) {
      errorHandlingService.processError(
        new Error(`Missing required field '${field}'`),
        'Response validation failed',
        ErrorCodes.API.INVALID_RESPONSE,
        {
          component: 'apiResponseHandler',
          operation: 'validateResponseStructure',
          missingField: field,
          requiredFields,
          userFriendlyMessage: `Server response missing required field: ${field}`,
        }
      );
      return false;
    }
  }

  return true;
}

/**
 * Logs response structure for debugging
 */
export function debugResponseStructure(
  response: ApiResponse<unknown>,
  label = 'API Response'
): void {
  errorHandlingService.processError(
    new Error(`Debug response structure: ${label}`),
    'Response structure debug analysis',
    ErrorCodes.SYSTEM.DEBUG_INFO,
    {
      component: 'apiResponseHandler',
      operation: 'debugResponseStructure',
      label,
      responseAnalysis: {
        type: typeof response,
        keys: response ? Object.keys(response) : 'No response',
        dataType: response?.data ? typeof response.data : undefined,
        isDataArray: response?.data ? Array.isArray(response.data) : undefined,
        dataKeys:
          response?.data && typeof response.data === 'object' && !Array.isArray(response.data)
            ? Object.keys(response.data)
            : undefined,
      },
      fullResponse: response,
      userFriendlyMessage: `Debugging response structure for ${label}`,
    }
  );
}
