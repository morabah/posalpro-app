/**
 * API Response Handler Utilities
 * Defensive programming utilities for handling various API response structures
 * Prevents errors like "response.data.map is not a function"
 */

/**
 * Safely extracts an array from an API response with unknown structure
 * Handles multiple common response patterns defensively
 */
export function extractArrayFromResponse<T = any>(
  response: any,
  arrayKey?: string,
  fallback: T[] = []
): T[] {
  if (!response) {
    console.warn('extractArrayFromResponse: No response provided');
    return fallback;
  }

  // Log response structure for debugging
  console.log('API Response structure:', {
    success: response.success,
    hasData: !!response.data,
    dataType: typeof response.data,
    isDataArray: Array.isArray(response.data),
    keys: response.data ? Object.keys(response.data) : [],
  });

  // Check if response indicates failure
  if (response.success === false) {
    console.warn('API response indicates failure:', response.error || response.message);
    return fallback;
  }

  // If no data property, return fallback
  if (!response.data) {
    console.warn('extractArrayFromResponse: No data property in response');
    return fallback;
  }

  const responseData = response.data;

  // Pattern 1: Direct array response
  if (Array.isArray(responseData)) {
    console.log('Found direct array with', responseData.length, 'items');
    return responseData;
  }

  // Pattern 2: Specific key provided
  if (arrayKey && responseData[arrayKey] && Array.isArray(responseData[arrayKey])) {
    console.log(`Found array in ${arrayKey} with`, responseData[arrayKey].length, 'items');
    return responseData[arrayKey];
  }

  // Pattern 3: Common nested patterns
  const commonKeys = ['data', 'items', 'results', 'list', 'records'];
  for (const key of commonKeys) {
    if (responseData[key] && Array.isArray(responseData[key])) {
      console.log(`Found array in ${key} with`, responseData[key].length, 'items');
      return responseData[key];
    }
  }

  // Pattern 4: Resource-specific patterns (proposals, users, etc.)
  const resourceKeys = ['proposals', 'users', 'products', 'customers', 'teams'];
  for (const key of resourceKeys) {
    if (responseData[key] && Array.isArray(responseData[key])) {
      console.log(`Found array in ${key} with`, responseData[key].length, 'items');
      return responseData[key];
    }
  }

  // Pattern 5: Search for any array property
  const arrayProperties = Object.entries(responseData)
    .filter(([_, value]) => Array.isArray(value))
    .map(([key, value]) => ({ key, array: value as T[] }));

  if (arrayProperties.length > 0) {
    const { key, array } = arrayProperties[0];
    console.log(`Found array in property '${key}' with`, array.length, 'items');
    return array;
  }

  // Pattern 6: Pagination structure with data array
  if (responseData.pagination && responseData.data && Array.isArray(responseData.data)) {
    console.log('Found paginated array with', responseData.data.length, 'items');
    return responseData.data;
  }

  console.warn('extractArrayFromResponse: No array found in response structure');
  console.warn('Response data structure:', responseData);
  return fallback;
}

/**
 * Type-safe wrapper for PaginatedResponse extraction
 */
export function extractPaginatedArray<T = any>(
  response: any,
  fallback: T[] = []
): { data: T[]; pagination?: any } {
  const data = extractArrayFromResponse<T>(response, undefined, fallback);
  const pagination = response?.pagination || response?.data?.pagination;

  return {
    data,
    pagination,
  };
}

/**
 * Validates that a response has the expected structure
 */
export function validateResponseStructure(
  response: any,
  requiredFields: string[] = ['success']
): boolean {
  if (!response || typeof response !== 'object') {
    console.error('validateResponseStructure: Response is not an object');
    return false;
  }

  for (const field of requiredFields) {
    if (!(field in response)) {
      console.error(`validateResponseStructure: Missing required field '${field}'`);
      return false;
    }
  }

  return true;
}

/**
 * Logs response structure for debugging
 */
export function debugResponseStructure(response: any, label = 'API Response'): void {
  console.group(`🔍 ${label} Structure Debug`);
  console.log('Type:', typeof response);
  console.log('Keys:', response ? Object.keys(response) : 'No response');

  if (response?.data) {
    console.log('Data type:', typeof response.data);
    console.log('Is data array:', Array.isArray(response.data));

    if (typeof response.data === 'object' && !Array.isArray(response.data)) {
      console.log('Data keys:', Object.keys(response.data));
    }
  }

  console.log('Full response:', response);
  console.groupEnd();
}
