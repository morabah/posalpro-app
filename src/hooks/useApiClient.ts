import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import { logError } from '@/lib/logger';
import { getApiBaseUrl, logApiConfiguration, validateApiConnection } from '@/lib/utils/apiUrl';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
  patch: <T>(endpoint: string, data?: unknown) => Promise<T>;
  delete: <T>(endpoint: string) => Promise<T>;
  validateConnection: () => Promise<boolean>;
}

// ✅ NEW: Singleton API client instance
class ApiClientSingleton {
  private static instance: ApiClientSingleton | null = null;
  private baseUrl: string;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private errorHandlingService: ErrorHandlingService;

  private constructor() {
    this.baseUrl = '';
    this.errorHandlingService = ErrorHandlingService.getInstance();
  }

  public static getInstance(): ApiClientSingleton {
    if (ApiClientSingleton.instance === null) {
      ApiClientSingleton.instance = new ApiClientSingleton();
    }
    return ApiClientSingleton.instance;
  }

  public async initialize(force: boolean = false): Promise<void> {
    if (force) {
      this.isInitialized = false;
      this.initPromise = null;
    }

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

    // Fix: Remove /api prefix from endpoint if it exists to prevent double /api/api/
    let cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    if (cleanEndpoint.startsWith('api/')) {
      cleanEndpoint = cleanEndpoint.slice(4); // Remove 'api/' prefix
    }

    const url = `${baseUrl}/${cleanEndpoint}`;

    const defaultOptions: RequestInit = {
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);

      if (!response.ok) {
        // Build actionable, user-friendly error for common auth cases
        const status = response.status;
        let parsed: unknown = null;
        try {
          parsed = (await response.clone().json()) as unknown;
        } catch {
          // ignore parse errors
        }

        const method = String(defaultOptions.method || 'GET');
        const baseMetadata = {
          component: 'useApiClient',
          operation: 'makeRequest',
          endpoint,
          url,
          method,
          status,
        } as Record<string, unknown>;

        if (status === 401 || status === 403) {
          const code = status === 401 ? ErrorCodes.AUTH.UNAUTHORIZED : ErrorCodes.AUTH.FORBIDDEN;
          const std = new StandardError({
            message:
              (parsed &&
              typeof parsed === 'object' &&
              'error' in parsed &&
              typeof (parsed as any).error === 'string'
                ? (parsed as any).error
                : undefined) || `Access denied (${status})`,
            code,
            metadata: {
              ...baseMetadata,
              serverMessage:
                parsed && typeof parsed === 'object'
                  ? typeof (parsed as any).error === 'string'
                    ? (parsed as any).error
                    : typeof (parsed as any).message === 'string'
                      ? (parsed as any).message
                      : undefined
                  : undefined,
            },
          });
          // Record and throw the standardized error so UIs can show friendly guidance
          this.errorHandlingService.processError(std);
          throw std;
        }

        // Fallback for other HTTP errors
        const std = new StandardError({
          message:
            (parsed &&
            typeof parsed === 'object' &&
            'error' in parsed &&
            typeof (parsed as any).error === 'string'
              ? (parsed as any).error
              : undefined) || `API request failed: ${status} ${response.statusText}`,
          code: ErrorCodes.API.NETWORK_ERROR,
          metadata: {
            ...baseMetadata,
            serverMessage:
              parsed && typeof parsed === 'object'
                ? typeof (parsed as any).error === 'string'
                  ? (parsed as any).error
                  : typeof (parsed as any).message === 'string'
                    ? (parsed as any).message
                    : undefined
                : undefined,
          },
        });
        this.errorHandlingService.processError(std);
        throw std;
      }

      const data = (await response.json()) as T;
      return data;
    } catch (error) {
      // If it's already a StandardError, bubble up after logging
      if (error instanceof StandardError) {
        logError('API request error', error, {
          component: 'useApiClient',
          operation: 'makeRequest',
          endpoint,
          method: options.method || 'GET',
          errorCode: error.code,
        });
        throw error;
      }

      // Otherwise, convert to StandardError with friendly guidance
      const standardError = this.errorHandlingService.processError(
        error,
        'API request failed',
        ErrorCodes.API.NETWORK_ERROR,
        {
          component: 'useApiClient',
          operation: 'makeRequest',
          endpoint,
          method: options.method || 'GET',
        }
      );

      logError('API request error', error, {
        component: 'useApiClient',
        operation: 'makeRequest',
        endpoint,
        method: options.method || 'GET',
        standardError: standardError.message,
        errorCode: standardError.code,
      });

      throw standardError;
    }
  }

  public async validateConnection(): Promise<boolean> {
    try {
      await this.initialize();
      return await validateApiConnection();
    } catch {
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
  const [isClient, setIsClient] = useState(false);

  // ✅ FIXED: Ensure client-side only execution
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize API configuration
  useEffect(() => {
    if (!isClient) return;

    // ✅ NEW: Force singleton re-initialization on the client
    // This ensures the baseUrl is correct from the client's perspective
    apiClientSingleton.initialize(true); // Pass true to force re-initialization

    const baseUrl = apiClientSingleton.getBaseUrl();
    setConfig(prev => ({
      ...prev,
      baseUrl,
    }));

    // Logging is handled by the singleton now
  }, [isClient]);

  // ✅ FIXED: Use singleton makeRequest to prevent multiple API client instances
  const makeRequest = useCallback(
    async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
      // Ensure we're in browser environment
      if (typeof window === 'undefined') {
        throw new Error(`API client not available on server side for endpoint: ${endpoint}`);
      }

      // Force singleton initialization in browser context
      await apiClientSingleton.initialize(true);

      return apiClientSingleton.makeRequest<T>(endpoint, options);
    },
    [] // Remove isClient dependency to avoid closure issues
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

  // PATCH request
  const patch = useCallback(
    <T>(endpoint: string, data?: unknown): Promise<T> => {
      return makeRequest<T>(endpoint, {
        method: 'PATCH',
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
    if (!isClient) return false;

    setConfig(prev => ({ ...prev, isValidating: true }));

    try {
      const isConnected = await validateApiConnection();
      setConfig(prev => ({
        ...prev,
        isConnected,
        isValidating: false,
      }));
      return isConnected;
    } catch {
      setConfig(prev => ({
        ...prev,
        isConnected: false,
        isValidating: false,
      }));
      return false;
    }
  }, [isClient]);

  return useMemo(
    () => ({
      config,
      makeRequest,
      get,
      post,
      put,
      patch,
      delete: del,
      validateConnection,
    }),
    [config, makeRequest, get, post, put, patch, del, validateConnection]
  );
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
  const [isClient, setIsClient] = useState(false);

  // ✅ FIXED: Ensure client-side only execution
  useEffect(() => {
    setIsClient(true);
  }, []);

  const checkHealth = useCallback(async () => {
    if (!isClient) return;

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
  }, [isClient]);

  // Auto-check health on component mount and periodically in development
  useEffect(() => {
    if (!isClient) return;

    checkHealth();

    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [checkHealth, isClient]);

  return {
    ...healthStatus,
    checkHealth,
  };
}
