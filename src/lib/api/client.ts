/**
 * Enhanced API Client with Interceptors
 * Comprehensive HTTP client with authentication, error handling, retry logic, and caching
 */

import { logger } from '@/utils/logger';// Environment-aware API base URL resolution
function getApiBaseUrl(): string {
  // Client-side: use current window location
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }

  // Server-side: check environment
  if (process.env.NODE_ENV === 'production') {
    // Production: use environment variable or fallback
    return process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
  }

  // Development: use relative path
return '/api';
}
import { authInterceptor, type ApiRequest } from './interceptors/authInterceptor';
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
  private cache: Map<string, { data: ApiResponse<any>; expires: number }> = new Map();
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

  private getCachedResponse<T>(cacheKey: string): ApiResponse<T> | null {
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data as ApiResponse<T>;
    }

    if (cached && cached.expires <= Date.now()) {
      this.cache.delete(cacheKey);
    }

    return null;
  }

  private setCachedResponse<T>(cacheKey: string, data: ApiResponse<T>, ttl: number): void {
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

    // Ensure we have a valid error to throw
    if (!lastError) {
      lastError = new Error('Request failed after retries');
    }

    throw lastError;
  }

  private async makeRequest<T>(
    url: string,
    options: EnhancedRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    logger.debug('[ApiClient] Starting request:', { url, method: options.method || 'GET' });

    // Properly construct full URL with correct slash handling
    let fullUrl: string;
    if (url.startsWith('http')) {
      fullUrl = url;
    } else {
      // Ensure proper slash between baseURL and endpoint
      const baseUrl = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
      const endpoint = url.startsWith('/') ? url : `/${url}`;
      fullUrl = `${baseUrl}${endpoint}`;
    }

    const config = { ...this.defaultConfig, ...options };
    logger.debug('[ApiClient] Request config:', config);

    // Check cache for GET requests
    const cacheKey = this.generateCacheKey(fullUrl, config);
    if (config.method === 'GET' && config.cache?.enabled) {
      logger.debug('[ApiClient] Checking cache for:', cacheKey);
      const cached = this.getCachedResponse<T>(cacheKey);
      if (cached) {
        logger.debug('[ApiClient] Cache hit:', cached);
        return {
          ...cached,
          message: 'Success (cached)',
        };
      }
      logger.debug('[ApiClient] Cache miss');

      // Check for pending request
      if (this.pendingRequests.has(cacheKey)) {
        logger.debug('[ApiClient] Using pending request for:', cacheKey);
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
    logger.debug('[ApiClient] Initial request:', apiRequest);

    // Apply auth interceptor
    logger.debug('[ApiClient] Applying auth interceptor');
    const interceptedRequest = await authInterceptor.interceptRequest(apiRequest);
    logger.debug('[ApiClient] Auth interceptor applied:', interceptedRequest);

    // Update config with intercepted headers
    config.headers = { ...config.headers, ...interceptedRequest.headers };

    const requestPromise = this.executeWithRetry(
      async (): Promise<ApiResponse<T>> => {
        try {
          logger.debug('[ApiClient] Executing request with retry');
          const response = await this.executeWithTimeout(
            fetch(interceptedRequest.url, {
              method: interceptedRequest.method,
              headers: interceptedRequest.headers,
              body: interceptedRequest.body ? JSON.stringify(interceptedRequest.body) : undefined,
            }),
            config.timeout || 10000
          );
          logger.debug('[ApiClient] Raw response:', response);

          // Handle non-JSON responses
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            logger.warn('[ApiClient] Non-JSON response received:', contentType);
            throw new Error('Invalid response format');
          }

          const data = await response.json();
          logger.debug('[ApiClient] Parsed response data:', data);

          // Apply error interceptor
          const interceptedResponse = await errorInterceptor.interceptResponse(
            response,
            data,
            config.errorHandling
          );
          logger.debug('[ApiClient] Error interceptor applied:', interceptedResponse);

          // Cache successful GET responses
          if (config.method === 'GET' && config.cache?.enabled && response.ok) {
            logger.debug('[ApiClient] Caching response');
            this.setCachedResponse(cacheKey, interceptedResponse, config.cache.ttl || 300000);
          }

          return interceptedResponse;
        } catch (error) {
          logger.error('[ApiClient] Request failed:', error);
          throw error;
        }
      },
      {
        attempts: config.retry?.attempts || 3,
        delay: config.retry?.delay || 1000,
        backoff: config.retry?.backoff || 2,
        retryCondition: config.retry?.retryCondition,
      }
    );

    // Store pending request
    if (config.method === 'GET' && config.cache?.enabled) {
      logger.debug('[ApiClient] Storing pending request:', cacheKey);
      this.pendingRequests.set(cacheKey, requestPromise);
      requestPromise.finally(() => {
        logger.debug('[ApiClient] Removing pending request:', cacheKey);
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
      body: data,
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
      body: data,
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
      body: data,
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

// Export enhanced client instance with environment-aware base URL resolution
export const apiClient = new EnhancedApiClient(getApiBaseUrl());
