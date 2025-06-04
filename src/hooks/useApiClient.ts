/**
 * React Hook for Dynamic API Client
 * Uses dynamic URL resolution to prevent port conflicts in development
 */

import { getApiBaseUrl, logApiConfiguration, validateApiConnection } from '@/lib/utils/apiUrl';
import { useCallback, useEffect, useState } from 'react';

interface ApiClientConfig {
  baseUrl: string;
  isConnected: boolean;
  isValidating: boolean;
}

interface UseApiClientReturn {
  config: ApiClientConfig;
  makeRequest: <T>(endpoint: string, options?: RequestInit) => Promise<T>;
  get: <T>(endpoint: string) => Promise<T>;
  post: <T>(endpoint: string, data?: unknown) => Promise<T>;
  put: <T>(endpoint: string, data?: unknown) => Promise<T>;
  delete: <T>(endpoint: string) => Promise<T>;
  validateConnection: () => Promise<boolean>;
}

/**
 * Dynamic API Client Hook
 * Provides API methods that automatically resolve URLs based on current port
 */
export function useApiClient(): UseApiClientReturn {
  const [config, setConfig] = useState<ApiClientConfig>({
    baseUrl: '',
    isConnected: false,
    isValidating: false,
  });

  // Initialize API configuration
  useEffect(() => {
    const baseUrl = getApiBaseUrl();
    setConfig(prev => ({
      ...prev,
      baseUrl,
    }));

    // Log configuration in development
    if (process.env.NODE_ENV === 'development') {
      logApiConfiguration();
    }
  }, []);

  // Generic request method with dynamic URL resolution
  const makeRequest = useCallback(
    async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
      const baseUrl = getApiBaseUrl();
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      const url = `${baseUrl}/${cleanEndpoint}`;

      const defaultOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      try {
        const response = await fetch(url, defaultOptions);

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('API request error:', {
          url,
          endpoint,
          error: error instanceof Error ? error.message : error,
        });
        throw error;
      }
    },
    []
  );

  // GET request
  const get = useCallback(
    <T>(endpoint: string): Promise<T> => {
      return makeRequest<T>(endpoint, { method: 'GET' });
    },
    [makeRequest]
  );

  // POST request
  const post = useCallback(
    <T>(endpoint: string, data?: unknown): Promise<T> => {
      return makeRequest<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      });
    },
    [makeRequest]
  );

  // PUT request
  const put = useCallback(
    <T>(endpoint: string, data?: unknown): Promise<T> => {
      return makeRequest<T>(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      });
    },
    [makeRequest]
  );

  // DELETE request
  const del = useCallback(
    <T>(endpoint: string): Promise<T> => {
      return makeRequest<T>(endpoint, { method: 'DELETE' });
    },
    [makeRequest]
  );

  // Validate API connection
  const validateConnection = useCallback(async (): Promise<boolean> => {
    setConfig(prev => ({ ...prev, isValidating: true }));

    try {
      const isConnected = await validateApiConnection();
      setConfig(prev => ({
        ...prev,
        isConnected,
        isValidating: false,
      }));
      return isConnected;
    } catch (error) {
      setConfig(prev => ({
        ...prev,
        isConnected: false,
        isValidating: false,
      }));
      return false;
    }
  }, []);

  return {
    config,
    makeRequest,
    get,
    post,
    put,
    delete: del,
    validateConnection,
  };
}

/**
 * Hook for API health monitoring in development
 */
export function useApiHealth() {
  const [healthStatus, setHealthStatus] = useState<{
    isHealthy: boolean;
    lastCheck: Date | null;
    error: string | null;
  }>({
    isHealthy: false,
    lastCheck: null,
    error: null,
  });

  const checkHealth = useCallback(async () => {
    try {
      const isConnected = await validateApiConnection();
      setHealthStatus({
        isHealthy: isConnected,
        lastCheck: new Date(),
        error: null,
      });
    } catch (error) {
      setHealthStatus({
        isHealthy: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, []);

  // Auto-check health on component mount and periodically in development
  useEffect(() => {
    checkHealth();

    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [checkHealth]);

  return {
    ...healthStatus,
    checkHealth,
  };
}
