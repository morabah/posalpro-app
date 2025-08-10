/**
 * API Client Foundation
 * Provides standardized HTTP client with authentication, error handling,
 * retry mechanisms, and integration with logging and performance monitoring
 * Uses standardized error handling
 */

import { Environment, getApiConfig, getAuthConfig, getCurrentEnvironment } from './env';
import { ErrorCodes, StandardError, errorHandlingService } from './errors';
import { logInfo, logWarn } from './logger';
import { endMeasurement, startMeasurement } from './performance';

// HTTP methods enum
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

// Error types enum
export enum ApiErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  SERVER = 'server',
  CLIENT = 'client',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown',
}

/**
 * Map API error type to ErrorCode
 */
function mapApiErrorTypeToErrorCode(type: ApiErrorType, status?: number): string {
  switch (type) {
    case ApiErrorType.NETWORK:
      return ErrorCodes.API.NETWORK_ERROR;
    case ApiErrorType.AUTHENTICATION:
      return ErrorCodes.AUTH.UNAUTHORIZED;
    case ApiErrorType.AUTHORIZATION:
      return ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS;
    case ApiErrorType.VALIDATION:
      return ErrorCodes.VALIDATION.INVALID_INPUT;
    case ApiErrorType.SERVER:
      return ErrorCodes.API.RESPONSE_ERROR;
    case ApiErrorType.CLIENT:
      return ErrorCodes.API.REQUEST_FAILED;
    case ApiErrorType.TIMEOUT:
      return ErrorCodes.API.TIMEOUT;
    case ApiErrorType.RATE_LIMIT:
      return ErrorCodes.API.RATE_LIMIT;
    default:
      // If we have a status code, try to map it
      if (status) {
        if (status === 404) return ErrorCodes.DATA.NOT_FOUND;
        if (status === 409) return ErrorCodes.DATA.CONFLICT;
        if (status >= 500) return ErrorCodes.API.RESPONSE_ERROR;
        if (status >= 400) return ErrorCodes.API.REQUEST_FAILED;
      }
      return ErrorCodes.API.REQUEST_FAILED;
  }
}

// API error class
export class ApiError extends StandardError {
  public readonly type: ApiErrorType;
  public readonly status?: number;
  public readonly statusText?: string;
  public readonly response?: unknown;
  public readonly requestId?: string;

  constructor(
    type: ApiErrorType,
    message: string,
    status?: number,
    statusText?: string,
    response?: unknown,
    requestId?: string
  ) {
    // Create StandardError with appropriate error code
    super({
      message,
      code: mapApiErrorTypeToErrorCode(type, status),
      metadata: {
        component: 'ApiClient',
        type,
        status,
        statusText,
        response,
        requestId,
      },
    });

    // Set ApiError specific properties
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
    this.statusText = statusText;
    this.response = response;
    this.requestId = requestId;
  }

  /**
   * Check if this error is retryable
   */
  isRetryable(): boolean {
    // 5xx (except 501 Not Implemented) and specific 4xx codes are retryable
    if (this.status) {
      return (
        (this.status >= 500 && this.status !== 501) ||
        this.status === 408 || // Request Timeout
        this.status === 429 // Too Many Requests
      );
    }

    // Network errors and timeouts are retryable
    return (
      this.type === ApiErrorType.NETWORK ||
      this.type === ApiErrorType.TIMEOUT ||
      this.type === ApiErrorType.RATE_LIMIT
    );
  }
}

// Request configuration interface
export interface RequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  useAuth?: boolean;
  authType?: 'bearer' | 'api-key' | 'custom';
  customAuth?: (headers: Record<string, string>) => Record<string, string>;
  validateStatus?: (status: number) => boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer';
  metadata?: Record<string, unknown>;
}

// Response interface
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
  requestId: string;
  duration: number;
  fromCache?: boolean;
}

// Request interceptor interface
export interface RequestInterceptor {
  onRequest?: (
    config: RequestConfig,
    url: string
  ) => Promise<{ config: RequestConfig; url: string }>;
  onError?: (error: Error) => Promise<Error>;
}

// Response interceptor interface
export interface ResponseInterceptor {
  onResponse?: <T>(response: ApiResponse<T>) => Promise<ApiResponse<T>>;
  onError?: (error: ApiError) => Promise<ApiError>;
}

// Retry configuration interface
interface RetryConfig {
  attempts: number;
  delay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition: (error: ApiError) => boolean;
}

// API client configuration interface
interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  defaultRetryAttempts: number;
  defaultRetryDelay: number;
  defaultHeaders: Record<string, string>;
  enableLogging: boolean;
  enablePerformanceTracking: boolean;
  maxCacheSize: number;
  cacheTimeout: number;
}

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// API client class
class ApiClient {
  private config: ApiClientConfig;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private cache = new Map<string, CacheEntry<unknown>>();
  private rateLimitState = new Map<string, { count: number; resetTime: number }>();

  constructor(config?: Partial<ApiClientConfig>) {
    const apiConfig = getApiConfig();
    const environment = getCurrentEnvironment();

    this.config = {
      baseURL: apiConfig.baseUrl,
      timeout: apiConfig.timeout,
      defaultRetryAttempts: apiConfig.retryAttempts,
      defaultRetryDelay: apiConfig.retryDelay,
      defaultHeaders: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': `PosalPro-Client/1.0.0 (${environment})`,
      },
      enableLogging: environment !== Environment.TEST,
      enablePerformanceTracking: true,
      maxCacheSize: environment === Environment.PRODUCTION ? 100 : 50,
      cacheTimeout: 300000, // 5 minutes
      ...config,
    };

    this.setupDefaultInterceptors();
  }

  // Setup default interceptors
  private setupDefaultInterceptors(): void {
    // Request interceptor for authentication
    this.addRequestInterceptor({
      onRequest: async (config, url) => {
        if (config.useAuth !== false) {
          config.headers = this.addAuthHeaders(config.headers || {}, config);
        }
        return { config, url };
      },
    });

    // Response interceptor for error handling
    this.addResponseInterceptor({
      onError: async error => {
        await this.handleApiError(error);
        return error;
      },
    });
  }

  // Add authentication headers
  private addAuthHeaders(
    headers: Record<string, string>,
    config: RequestConfig
  ): Record<string, string> {
    try {
      const authConfig = getAuthConfig();

      if (config.customAuth) {
        return config.customAuth(headers);
      }

      switch (config.authType || 'bearer') {
        case 'bearer':
          if (authConfig.jwtSecret && authConfig.jwtSecret !== 'dev-secret-key') {
            headers['Authorization'] = `Bearer ${authConfig.jwtSecret}`;
          }
          break;

        case 'api-key':
          if (authConfig.apiKey && authConfig.apiKey !== 'dev-api-key') {
            headers['X-API-Key'] = authConfig.apiKey;
          }
          break;
      }

      return headers;
    } catch (error) {
      logWarn('Failed to add authentication headers', {
        error: error instanceof Error ? error.message : String(error),
      });
      return headers;
    }
  }

  // Generate request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Build URL with query parameters
  private buildUrl(url: string, params?: Record<string, string | number | boolean>): string {
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseURL}${url}`;

    if (!params || Object.keys(params).length === 0) {
      return fullUrl;
    }

    const urlObj = new URL(fullUrl);
    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.set(key, String(value));
    });

    return urlObj.toString();
  }

  // Cache management
  private getCacheKey(method: string, url: string, data?: unknown): string {
    const dataHash = data ? JSON.stringify(data) : '';
    return `${method}:${url}:${dataHash}`;
  }

  private getFromCache<T>(cacheKey: string): T | null {
    const entry = this.cache.get(cacheKey) as CacheEntry<T> | undefined;

    if (!entry) return null;

    const now = Date.now();
    if (now > entry.timestamp + entry.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(cacheKey: string, data: T, ttl = this.config.cacheTimeout): void {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.config.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  // Rate limit checking
  private checkRateLimit(url: string): boolean {
    const now = Date.now();
    const state = this.rateLimitState.get(url);

    if (!state || now > state.resetTime) {
      this.rateLimitState.set(url, { count: 1, resetTime: now + 60000 }); // 1 minute window
      return true;
    }

    if (state.count >= 100) {
      // 100 requests per minute
      return false;
    }

    state.count++;
    return true;
  }

  // Retry logic with exponential backoff
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    requestId: string
  ): Promise<T> {
    let lastError: ApiError;

    for (let attempt = 0; attempt <= config.attempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError =
          error instanceof ApiError
            ? error
            : new ApiError(
                ApiErrorType.UNKNOWN,
                error instanceof Error ? error.message : String(error),
                undefined,
                undefined,
                undefined,
                requestId
              );

        // Don't retry on last attempt or if retry condition fails
        if (attempt === config.attempts || !config.retryCondition(lastError)) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.delay * Math.pow(config.backoffFactor, attempt),
          config.maxDelay
        );

        logWarn('API request failed, retrying', {
          requestId,
          attempt: attempt + 1,
          maxAttempts: config.attempts + 1,
          delay,
          error: lastError.toJSON(),
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // Default retry condition
  private defaultRetryCondition(this: void, error: ApiError): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.type === ApiErrorType.NETWORK ||
      error.type === ApiErrorType.TIMEOUT ||
      (error.status !== undefined && error.status >= 500)
    );
  }

  // Handle API errors with logging
  private async handleApiError(error: ApiError): Promise<void> {
    if (this.config.enableLogging) {
      // Use ErrorHandlingService to log the error with appropriate severity
      // The error is already a StandardError with proper error code and metadata
      errorHandlingService.processError(error);

      // Also log warning for retryable errors
      if (error.isRetryable()) {
        logWarn('API request failed, may retry', {
          requestId: error.requestId,
          status: error.status,
          type: error.type,
          code: error.code,
        });
      }
    }
  }

  // Execute HTTP request
  private async executeRequest<T>(
    method: HttpMethod,
    url: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    const measurementId = startMeasurement(`api_${method.toLowerCase()}_${url}`, {
      method,
      url,
      requestId,
      category: 'api',
    });

    try {
      // Apply request interceptors
      let processedConfig = config;
      let processedUrl = url;

      for (const interceptor of this.requestInterceptors) {
        if (interceptor.onRequest) {
          const result = await interceptor.onRequest(processedConfig, processedUrl);
          processedConfig = result.config;
          processedUrl = result.url;
        }
      }

      // Check rate limit
      if (!this.checkRateLimit(processedUrl)) {
        throw new ApiError(
          ApiErrorType.RATE_LIMIT,
          'Rate limit exceeded',
          429,
          'Too Many Requests',
          undefined,
          requestId
        );
      }

      // Check cache for GET requests
      const cacheKey = this.getCacheKey(method, processedUrl, processedConfig.data);
      if (method === HttpMethod.GET) {
        const cachedData = this.getFromCache<T>(cacheKey);
        if (cachedData) {
          const duration = endMeasurement(measurementId);

          if (this.config.enableLogging) {
            logInfo('API request served from cache', {
              method,
              url: processedUrl,
              requestId,
              duration,
            });
          }

          return {
            data: cachedData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: processedConfig,
            requestId,
            duration,
            fromCache: true,
          };
        }
      }

      // Build final URL with parameters
      const finalUrl = this.buildUrl(processedUrl, processedConfig.params);

      // Prepare request options
      const requestOptions: RequestInit = {
        method,
        headers: {
          ...this.config.defaultHeaders,
          ...processedConfig.headers,
        },
        signal: AbortSignal.timeout(processedConfig.timeout || this.config.timeout),
      };

      // Add body for non-GET requests
      if (method !== HttpMethod.GET && method !== HttpMethod.HEAD && processedConfig.data) {
        if (processedConfig.data instanceof FormData) {
          requestOptions.body = processedConfig.data;
          // Remove Content-Type to let browser set it with boundary
          delete (requestOptions.headers as Record<string, string>)['Content-Type'];
        } else {
          requestOptions.body = JSON.stringify(processedConfig.data);
        }
      }

      // Execute request with retry logic
      const retryConfig: RetryConfig = {
        attempts: processedConfig.retryAttempts ?? this.config.defaultRetryAttempts,
        delay: processedConfig.retryDelay ?? this.config.defaultRetryDelay,
        maxDelay: 30000, // 30 seconds max delay
        backoffFactor: 2,
        retryCondition: this.defaultRetryCondition,
      };

      const response = await this.executeWithRetry(
        async () => {
          const fetchResponse = await fetch(finalUrl, requestOptions);

          // Check if response is successful
          const isSuccess = processedConfig.validateStatus
            ? processedConfig.validateStatus(fetchResponse.status)
            : fetchResponse.status >= 200 && fetchResponse.status < 300;

          if (!isSuccess) {
            let errorType = ApiErrorType.SERVER;

            if (fetchResponse.status === 401) {
              errorType = ApiErrorType.AUTHENTICATION;
            } else if (fetchResponse.status === 403) {
              errorType = ApiErrorType.AUTHORIZATION;
            } else if (fetchResponse.status >= 400 && fetchResponse.status < 500) {
              errorType = ApiErrorType.CLIENT;
            } else if (fetchResponse.status >= 500) {
              errorType = ApiErrorType.SERVER;
            }

            const errorData = await fetchResponse.text().catch(() => 'Unknown error');

            throw new ApiError(
              errorType,
              `Request failed with status ${fetchResponse.status}`,
              fetchResponse.status,
              fetchResponse.statusText,
              errorData,
              requestId
            );
          }

          return fetchResponse;
        },
        retryConfig,
        requestId
      );

      // Parse response based on type
      let data: T;
      const responseType = processedConfig.responseType || 'json';

      switch (responseType) {
        case 'json':
          data = await response.json();
          break;
        case 'text':
          data = (await response.text()) as T;
          break;
        case 'blob':
          data = (await response.blob()) as T;
          break;
        case 'arrayBuffer':
          data = (await response.arrayBuffer()) as T;
          break;
        default:
          data = await response.json();
      }

      // Extract headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const duration = endMeasurement(measurementId);

      // Create response object
      const apiResponse: ApiResponse<T> = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers,
        config: processedConfig,
        requestId,
        duration,
      };

      // Cache GET responses
      if (method === HttpMethod.GET && response.status === 200) {
        this.setCache(cacheKey, data);
      }

      // Apply response interceptors
      let processedResponse = apiResponse;
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onResponse) {
          processedResponse = await interceptor.onResponse(processedResponse);
        }
      }

      // Log successful request
      if (this.config.enableLogging) {
        logInfo('API request completed successfully', {
          method,
          url: finalUrl,
          status: response.status,
          requestId,
          duration,
          fromCache: false,
        });
      }

      return processedResponse;
    } catch (error) {
      endMeasurement(measurementId);

      if (error instanceof ApiError) {
        throw error;
      }

      // Handle fetch errors
      let errorType = ApiErrorType.NETWORK;
      let errorMessage = 'Network request failed';

      if (error instanceof Error) {
        if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
          errorType = ApiErrorType.TIMEOUT;
          errorMessage = 'Request timeout';
        } else if (error.message.includes('fetch')) {
          errorType = ApiErrorType.NETWORK;
          errorMessage = 'Network error';
        }
      }

      throw new ApiError(
        errorType,
        errorMessage,
        undefined,
        undefined,
        error instanceof Error ? error.message : String(error),
        requestId
      );
    }
  }

  // Public HTTP methods
  public async get<T>(
    url: string,
    config?: Omit<RequestConfig, 'method' | 'data'>
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(HttpMethod.GET, url, config);
  }

  public async post<T>(
    url: string,
    data?: unknown,
    config?: Omit<RequestConfig, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(HttpMethod.POST, url, { ...config, data });
  }

  public async put<T>(
    url: string,
    data?: unknown,
    config?: Omit<RequestConfig, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(HttpMethod.PUT, url, { ...config, data });
  }

  public async patch<T>(
    url: string,
    data?: unknown,
    config?: Omit<RequestConfig, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(HttpMethod.PATCH, url, { ...config, data });
  }

  public async delete<T>(
    url: string,
    config?: Omit<RequestConfig, 'method' | 'data'>
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(HttpMethod.DELETE, url, config);
  }

  public async head(
    url: string,
    config?: Omit<RequestConfig, 'method' | 'data'>
  ): Promise<ApiResponse<void>> {
    return this.executeRequest<void>(HttpMethod.HEAD, url, config);
  }

  public async options(
    url: string,
    config?: Omit<RequestConfig, 'method' | 'data'>
  ): Promise<ApiResponse<void>> {
    return this.executeRequest<void>(HttpMethod.OPTIONS, url, config);
  }

  // Interceptor management
  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  public addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  public clearInterceptors(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.setupDefaultInterceptors();
  }

  // Cache management
  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheSize(): number {
    return this.cache.size;
  }

  // Configuration
  public updateConfig(updates: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public getConfig(): ApiClientConfig {
    return { ...this.config };
  }
}

// Create singleton API client
const apiClient = new ApiClient();

// Export convenience functions
export const get = <T>(url: string, config?: Omit<RequestConfig, 'method' | 'data'>) =>
  apiClient.get<T>(url, config);

export const post = <T>(url: string, data?: unknown, config?: Omit<RequestConfig, 'method'>) =>
  apiClient.post<T>(url, data, config);

export const put = <T>(url: string, data?: unknown, config?: Omit<RequestConfig, 'method'>) =>
  apiClient.put<T>(url, data, config);

export const patch = <T>(url: string, data?: unknown, config?: Omit<RequestConfig, 'method'>) =>
  apiClient.patch<T>(url, data, config);

export const del = <T>(url: string, config?: Omit<RequestConfig, 'method' | 'data'>) =>
  apiClient.delete<T>(url, config);

export const head = (url: string, config?: Omit<RequestConfig, 'method' | 'data'>) =>
  apiClient.head(url, config);

export const options = (url: string, config?: Omit<RequestConfig, 'method' | 'data'>) =>
  apiClient.options(url, config);

// Export interceptor functions
export const addRequestInterceptor = (interceptor: RequestInterceptor) =>
  apiClient.addRequestInterceptor(interceptor);

export const addResponseInterceptor = (interceptor: ResponseInterceptor) =>
  apiClient.addResponseInterceptor(interceptor);

export const clearInterceptors = () => apiClient.clearInterceptors();

// Export cache functions
export const clearCache = () => apiClient.clearCache();
export const getCacheSize = () => apiClient.getCacheSize();

// Export configuration functions
export const updateApiConfig = (updates: Partial<ApiClientConfig>) =>
  apiClient.updateConfig(updates);

export const getApiClientConfig = () => apiClient.getConfig();

// Export API client for advanced usage
export { apiClient };

// Helper function for creating custom clients
export const createApiClient = (config?: Partial<ApiClientConfig>) => new ApiClient(config);

// API response caching for performance optimization
const apiCache = new Map<string, { data: unknown; timestamp: number }>();
const API_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Cache cleanup function to prevent memory leaks
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of apiCache.entries()) {
    if (now - value.timestamp > API_CACHE_TTL) {
      apiCache.delete(key);
    }
  }
};

// Run cache cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupCache, 5 * 60 * 1000);
}

export const makeRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<unknown> => {
  const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
  const cached = apiCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < API_CACHE_TTL) {
    logInfo(`📦 [API Cache] Returning cached response for ${endpoint}`);
    return cached.data;
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      credentials: 'include', // Ensure cookies are sent
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: unknown = await response.json();

    // Cache successful responses
    apiCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return data;
  } catch (error) {
    logWarn(`❌ [API] Request failed for ${endpoint}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
