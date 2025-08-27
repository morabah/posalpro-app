/**
 * PosalPro MVP2 - HTTP Client Hook
 * Provides HTTP client with React Query integration and error handling
 * Follows best practices for API communication in React components
 */

import { http, httpClient, type ApiResponse, type HttpClientOptions } from '@/lib/http';
import { logDebug, logError } from '@/lib/logger';
import { useCallback } from 'react';

/**
 * Hook for using the HTTP client with React Query integration
 */
export function useHttpClient() {
  /**
   * GET request with error handling
   */
  const get = useCallback(
    async <T = unknown>(url: string, options?: HttpClientOptions): Promise<T> => {
      try {
        logDebug('HTTP GET request', {
          component: 'useHttpClient',
          operation: 'get',
          url,
          options: options ? Object.keys(options) : [],
        });

        return await http.get<T>(url, options);
      } catch (error) {
        logError('HTTP GET request failed', {
          component: 'useHttpClient',
          operation: 'get',
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    []
  );

  /**
   * POST request with error handling
   */
  const post = useCallback(
    async <T = unknown>(url: string, data?: unknown, options?: HttpClientOptions): Promise<T> => {
      try {
        logDebug('HTTP POST request', {
          component: 'useHttpClient',
          operation: 'post',
          url,
          dataKeys: data && typeof data === 'object' ? Object.keys(data) : [],
          options: options ? Object.keys(options) : [],
        });

        return await http.post<T>(url, data, options);
      } catch (error) {
        logError('HTTP POST request failed', {
          component: 'useHttpClient',
          operation: 'post',
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    []
  );

  /**
   * PUT request with error handling
   */
  const put = useCallback(
    async <T = unknown>(url: string, data?: unknown, options?: HttpClientOptions): Promise<T> => {
      try {
        logDebug('HTTP PUT request', {
          component: 'useHttpClient',
          operation: 'put',
          url,
          dataKeys: data && typeof data === 'object' ? Object.keys(data) : [],
          options: options ? Object.keys(options) : [],
        });

        return await http.put<T>(url, data, options);
      } catch (error) {
        logError('HTTP PUT request failed', {
          component: 'useHttpClient',
          operation: 'put',
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    []
  );

  /**
   * PATCH request with error handling
   */
  const patch = useCallback(
    async <T = unknown>(url: string, data?: unknown, options?: HttpClientOptions): Promise<T> => {
      try {
        logDebug('HTTP PATCH request', {
          component: 'useHttpClient',
          operation: 'patch',
          url,
          dataKeys: data && typeof data === 'object' ? Object.keys(data) : [],
          options: options ? Object.keys(options) : [],
        });

        return await http.patch<T>(url, data, options);
      } catch (error) {
        logError('HTTP PATCH request failed', {
          component: 'useHttpClient',
          operation: 'patch',
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    []
  );

  /**
   * DELETE request with error handling
   */
  const del = useCallback(
    async <T = unknown>(url: string, options?: HttpClientOptions): Promise<T> => {
      try {
        logDebug('HTTP DELETE request', {
          component: 'useHttpClient',
          operation: 'delete',
          url,
          options: options ? Object.keys(options) : [],
        });

        return await http.delete<T>(url, options);
      } catch (error) {
        logError('HTTP DELETE request failed', {
          component: 'useHttpClient',
          operation: 'delete',
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    []
  );

  /**
   * Generic request with error handling
   */
  const request = useCallback(
    async <T = unknown>(url: string, options?: HttpClientOptions): Promise<T> => {
      try {
        logDebug('HTTP request', {
          component: 'useHttpClient',
          operation: 'request',
          url,
          method: options?.method || 'GET',
          options: options ? Object.keys(options) : [],
        });

        return await http.request<T>(url, options);
      } catch (error) {
        logError('HTTP request failed', {
          component: 'useHttpClient',
          operation: 'request',
          url,
          method: options?.method || 'GET',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    []
  );

  return {
    get,
    post,
    put,
    patch,
    delete: del,
    request,
    client: httpClient,
  };
}

/**
 * Hook for API responses with proper typing
 */
export function useApiResponse<T = unknown>() {
  const httpClient = useHttpClient();

  /**
   * GET API response with proper typing
   */
  const getApiResponse = useCallback(
    async (url: string, options?: HttpClientOptions): Promise<ApiResponse<T>> => {
      try {
        const data = await httpClient.get<T>(url, options);
        return { ok: true, data };
      } catch (error) {
        return {
          ok: false,
          code: error instanceof Error && 'code' in error ? (error as any).code : 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [httpClient]
  );

  /**
   * POST API response with proper typing
   */
  const postApiResponse = useCallback(
    async (url: string, data?: unknown, options?: HttpClientOptions): Promise<ApiResponse<T>> => {
      try {
        const response = await httpClient.post<T>(url, data, options);
        return { ok: true, data: response };
      } catch (error) {
        return {
          ok: false,
          code: error instanceof Error && 'code' in error ? (error as any).code : 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [httpClient]
  );

  return {
    getApiResponse,
    postApiResponse,
  };
}

// Export types for external use
export type { ApiResponse, HttpClientOptions };
