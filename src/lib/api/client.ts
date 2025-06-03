/**
 * Enhanced API Client with Interceptors
 * Comprehensive HTTP client with authentication, error handling, retry logic, and caching
 */

import {
  authInterceptor,
  type ApiRequest,
  type ApiResponse as InterceptorApiResponse,
} from './interceptors/authInterceptor';
import { errorInterceptor, type ErrorHandlerOptions } from './interceptors/errorInterceptor';

// Export the existing types and interfaces
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RetryConfig {
  attempts: number;
  delay: number;
  backoff: number;
  retryCondition?: (error: any) => boolean;
}

interface CustomCacheConfig {
  ttl: number;
  key?: string;
  enabled: boolean;
}

interface EnhancedRequestConfig {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  retry?: Partial<RetryConfig>;
  cache?: Partial<CustomCacheConfig>;
  errorHandling?: ErrorHandlerOptions;
  timeout?: number;
}

class EnhancedApiClient {
  private baseURL: string;
  private defaultConfig: EnhancedRequestConfig;
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();

  constructor(baseURL: string = '', config: EnhancedRequestConfig = {}) {
    this.baseURL = baseURL;
    this.defaultConfig = {
      headers: {
        'Content-Type': 'application/json',
      },
      retry: {
        attempts: 3,
        delay: 1000,
        backoff: 2,
      },
      cache: {
        ttl: 300000, // 5 minutes
        enabled: false,
      },
      timeout: 10000,
      ...config,
    };
  }

  private generateCacheKey(url: string, options: EnhancedRequestConfig): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  private getCachedResponse(cacheKey: string): any | null {
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    if (cached && cached.expires <= Date.now()) {
      this.cache.delete(cacheKey);
    }

    return null;
  }

  private setCachedResponse(cacheKey: string, data: any, ttl: number): void {
    this.cache.set(cacheKey, {
      data,
      expires: Date.now() + ttl,
    });
  }

  private async executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  private async executeWithRetry<T>(fn: () => Promise<T>, retryConfig: RetryConfig): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= retryConfig.attempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Check if we should retry
        if (
          attempt === retryConfig.attempts ||
          (retryConfig.retryCondition && !retryConfig.retryCondition(error))
        ) {
          break;
        }

        // Calculate delay with backoff
        const delay = retryConfig.delay * Math.pow(retryConfig.backoff, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  private async makeRequest<T>(
    url: string,
    options: EnhancedRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    const config = { ...this.defaultConfig, ...options };

    // Check cache for GET requests
    const cacheKey = this.generateCacheKey(fullUrl, config);
    if (config.method === 'GET' && config.cache?.enabled) {
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return {
          data: cached as T,
          success: true,
          message: 'Success (cached)',
          pagination: undefined,
        } as ApiResponse<T>;
      }

      // Check for pending request
      if (this.pendingRequests.has(cacheKey)) {
        return this.pendingRequests.get(cacheKey) as Promise<ApiResponse<T>>;
      }
    }

    // Create API request object for interceptors
    const apiRequest: ApiRequest = {
      url: fullUrl,
      method: config.method || 'GET',
      headers: { ...config.headers } as Record<string, string>,
      body: config.body,
    };

    // Apply auth interceptor
    const interceptedRequest = await authInterceptor.interceptRequest(apiRequest);

    // Update config with intercepted headers
    config.headers = { ...config.headers, ...interceptedRequest.headers };

    const requestPromise = this.executeWithRetry(
      async (): Promise<ApiResponse<T>> => {
        // Create standard fetch options
        const fetchOptions: RequestInit = {
          method: interceptedRequest.method,
          headers: interceptedRequest.headers,
          body: interceptedRequest.body,
        };

        const response = await this.executeWithTimeout(
          fetch(interceptedRequest.url, fetchOptions),
          config.timeout || 10000
        );

        const interceptorResponse: InterceptorApiResponse = {
          data: response.ok ? await response.json() : await response.text(),
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
        };

        // Apply response interceptor
        const interceptedResponse = await authInterceptor.interceptResponse(
          interceptorResponse,
          interceptedRequest
        );

        // Handle retry indication from auth interceptor
        if (interceptedResponse.data?.shouldRetry) {
          const retryRequest = interceptedResponse.data.retryRequest;
          return this.makeRequest<T>(retryRequest.url, {
            ...config,
            headers: retryRequest.headers,
          });
        }

        if (!response.ok) {
          const error = errorInterceptor.processError(
            interceptedResponse,
            interceptedRequest,
            config.errorHandling
          );
          throw new Error(error.userMessage);
        }

        // Cache successful GET responses
        if (config.method === 'GET' && config.cache?.enabled) {
          this.setCachedResponse(cacheKey, interceptedResponse.data, config.cache.ttl || 300000);
        }

        return {
          data: interceptedResponse.data?.data || interceptedResponse.data,
          success: true,
          message: interceptedResponse.data?.message || 'Success',
          pagination: interceptedResponse.data?.pagination,
        } as ApiResponse<T>;
      },
      {
        attempts: config.retry?.attempts || 3,
        delay: config.retry?.delay || 1000,
        backoff: config.retry?.backoff || 2,
        retryCondition:
          config.retry?.retryCondition ||
          ((error: any) => {
            return (
              error.message?.includes('timeout') ||
              error.message?.includes('network') ||
              error.status >= 500
            );
          }),
      }
    );

    // Store pending request
    if (config.method === 'GET' && config.cache?.enabled) {
      this.pendingRequests.set(cacheKey, requestPromise);

      // Clean up pending request when done
      requestPromise.finally(() => {
        this.pendingRequests.delete(cacheKey);
      });
    }

    return requestPromise;
  }

  // HTTP Methods with enhanced features
  async get<T>(
    url: string,
    config?: Omit<EnhancedRequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...config,
      method: 'GET',
      cache: { enabled: true, ...config?.cache },
    });
  }

  async post<T>(
    url: string,
    data?: any,
    config?: Omit<EnhancedRequestConfig, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    url: string,
    data?: any,
    config?: Omit<EnhancedRequestConfig, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(
    url: string,
    data?: any,
    config?: Omit<EnhancedRequestConfig, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(
    url: string,
    config?: Omit<EnhancedRequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...config,
      method: 'DELETE',
    });
  }

  // Utility methods
  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  setAuthToken(token: string): void {
    // This will be handled by the auth interceptor
    authInterceptor.setTokens({
      accessToken: token,
      refreshToken: '', // Will be set separately
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour default
    });
  }
}

// Export enhanced client instance
export const apiClient = new EnhancedApiClient(
  process.env.NODE_ENV === 'development' ? '' : process.env.NEXT_PUBLIC_API_BASE_URL || ''
);
