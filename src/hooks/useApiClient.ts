import { logger } from '@/utils/logger'; /**
 * React Hook for Dynamic API Client
 * Uses dynamic URL resolution to prevent port conflicts in development
 * ✅ ENHANCED: Singleton pattern to prevent multiple instances and infinite loops
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

// ✅ NEW: Singleton API client instance
class ApiClientSingleton {
  private static instance: ApiClientSingleton;
  private baseUrl: string;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    this.baseUrl = '';
  }

  public static getInstance(): ApiClientSingleton {
    if (!ApiClientSingleton.instance) {
      ApiClientSingleton.instance = new ApiClientSingleton();
    }
    return ApiClientSingleton.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    this.baseUrl = getApiBaseUrl();
    this.isInitialized = true;

    // Log configuration in development only once
    if (process.env.NODE_ENV === 'development') {
      logApiConfiguration();
    }
  }

  public getBaseUrl(): string {
    return this.baseUrl || getApiBaseUrl();
  }

  public async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await this.initialize();

    const baseUrl = this.getBaseUrl();
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

      const data = (await response.json()) as T;
      return data;
    } catch (error) {
      // ✅ ENHANCED: Better error logging with more context
      const errorDetails = {
        url,
        endpoint,
        method: options.method || 'GET',
        timestamp: new Date().toISOString(),
        singleton: true, // Mark as singleton request
      };

      if (error instanceof Error) {
        logger.error('API request error:', {
          ...errorDetails,
          errorMessage: error.message,
          errorName: error.name,
          stack: error.stack,
        });
      } else {
        logger.error('API request error (unknown type):', {
          ...errorDetails,
          error: String(error),
          errorType: typeof error,
        });
      }
      throw error;
    }
  }

  public async validateConnection(): Promise<boolean> {
    try {
      await this.initialize();
      return await validateApiConnection();
    } catch (error) {
      return false;
    }
  }
}

// ✅ NEW: Get singleton instance
const apiClientSingleton = ApiClientSingleton.getInstance();

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

    // Log configuration in development (throttled at module level)
    if (process.env.NODE_ENV === 'development') {
      logApiConfiguration();
    }
  }, []);

  // ✅ FIXED: Use singleton makeRequest to prevent multiple API client instances
  const makeRequest = useCallback(
    async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
      return apiClientSingleton.makeRequest<T>(endpoint, options);
    },
    [] // No dependencies needed - singleton handles all state
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setHealthStatus({
        isHealthy: false,
        lastCheck: new Date(),
        error: errorMessage,
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
