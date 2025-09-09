/**
 * PosalPro MVP2 - Centralized HTTP Client Helper
 * Provides consistent error handling, request ID tracking, and TypeScript support
 * Follows best practices for API communication with proper error envelopes
 */

import { logDebug, logError, logInfo } from '@/lib/logger';

// API response types
export type ApiResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; details?: unknown };

export type ApiError = { ok: false; code: string; message: string; details?: unknown };

// HTTP client configuration
export interface HttpClientConfig {
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// HTTP client options
export interface HttpClientOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipErrorHandling?: boolean;
}

// HTTP client error
export class HttpClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public requestId?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'HttpClientError';
  }
}

// Default configuration
const DEFAULT_CONFIG: HttpClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate', // ✅ CACHE CONTROL: Prevent all forms of caching
    Pragma: 'no-cache', // ✅ PRAGMA HEADER: Additional cache bypass for HTTP/1.0 compatibility
  },
  timeout: 30000, // 30 seconds
  retries: 1,
  retryDelay: 1000, // 1 second
};

/**
 * Centralized HTTP client with error handling and request ID tracking
 */
export class HttpClient {
  private config: HttpClientConfig;

  constructor(config: HttpClientConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Make an HTTP request with proper error handling
   */
  async request<T = unknown>(input: RequestInfo, options: HttpClientOptions = {}): Promise<T> {
    const url = this.buildUrl(input);
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    // Prepare request options
    const requestOptions: RequestInit = {
      credentials: 'include',
      cache: 'no-store', // ✅ EXPLICIT CACHE BYPASS: Prevent browser from caching responses
      ...options,
      headers: {
        ...this.config.defaultHeaders,
        ...options.headers,
        'x-request-id': requestId,
      },
    };

    // Add timeout support
    const timeoutPromise = this.createTimeoutPromise(options.timeout || this.config.timeout!);
    const fetchPromise = this.makeRequest(url, requestOptions, requestId, startTime);

    try {
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      return this.handleResponse<T>(response, requestId, startTime);
    } catch (error) {
      return this.handleError(error, url, requestId, startTime, options);
    }
  }

  /**
   * GET request
   */
  async get<T = unknown>(input: RequestInfo, options: HttpClientOptions = {}): Promise<T> {
    return this.request<T>(input, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    input: RequestInfo,
    data?: unknown,
    options: HttpClientOptions = {}
  ): Promise<T> {
    return this.request<T>(input, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    input: RequestInfo,
    data?: unknown,
    options: HttpClientOptions = {}
  ): Promise<T> {
    return this.request<T>(input, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    input: RequestInfo,
    data?: unknown,
    options: HttpClientOptions = {}
  ): Promise<T> {
    return this.request<T>(input, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(input: RequestInfo, options: HttpClientOptions = {}): Promise<T> {
    return this.request<T>(input, { ...options, method: 'DELETE' });
  }

  /**
   * Build full URL with base URL
   */
  private buildUrl(input: RequestInfo): string {
    if (typeof input === 'string') {
      return input.startsWith('http') ? input : `${this.config.baseURL}${input}`;
    }
    return input.url;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new HttpClientError('Request timeout', 408, 'TIMEOUT'));
      }, timeout);
    });
  }

  /**
   * Make the actual HTTP request with retry logic
   */
  private async makeRequest(
    url: string,
    options: RequestInit,
    requestId: string,
    startTime: number,
    attempt: number = 1
  ): Promise<Response> {
    try {
      logDebug('HTTP request start', {
        component: 'HttpClient',
        operation: 'makeRequest',
        url,
        method: options.method || 'GET',
        requestId,
        attempt,
      });

      const response = await fetch(url, options);

      const duration = Date.now() - startTime;

      logInfo('HTTP request completed', {
        component: 'HttpClient',
        operation: 'makeRequest',
        url,
        method: options.method || 'GET',
        status: response.status,
        duration,
        requestId,
        attempt,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Handle different types of fetch errors
      let errorMessage = 'Unknown error';
      let isRetryable = false;

      if (error instanceof TypeError) {
        // Network errors, DNS failures, etc.
        if (error.message.includes('fetch')) {
          errorMessage = 'Network connection failed';
          isRetryable = true;
        } else if (error.message.includes('Load failed')) {
          errorMessage = 'Resource load failed - possible CORS or network issue';
          isRetryable = true;
        } else {
          errorMessage = `Type error: ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        // Consider timeout and network errors as retryable
        isRetryable =
          error.message.includes('timeout') ||
          error.message.includes('network') ||
          error.message.includes('connection');
      }

      logError('HTTP request failed', {
        component: 'HttpClient',
        operation: 'makeRequest',
        url,
        method: options.method || 'GET',
        error: errorMessage,
        originalError: error instanceof Error ? error.message : String(error),
        errorType: error?.constructor?.name,
        duration,
        requestId,
        attempt,
        isRetryable,
      });

      // Retry logic for retryable errors
      if (attempt < (this.config.retries || 1) && isRetryable) {
        const delay = (this.config.retryDelay || 1000) * attempt;
        logDebug('Retrying HTTP request', {
          component: 'HttpClient',
          operation: 'makeRequest',
          url,
          attempt: attempt + 1,
          delay,
          requestId,
        });
        await this.delay(delay);
        return this.makeRequest(url, options, requestId, startTime, attempt + 1);
      }

      // Create appropriate error for different scenarios
      if (errorMessage.includes('Load failed')) {
        throw new HttpClientError(
          'Service temporarily unavailable - please try again',
          503,
          'SERVICE_UNAVAILABLE',
          requestId
        );
      }

      throw error;
    }
  }

  /**
   * Handle successful response
   */
  private async handleResponse<T>(
    response: Response,
    requestId: string,
    startTime: number
  ): Promise<T> {
    const duration = Date.now() - startTime;
    const contentType = response.headers.get('content-type');

    // Parse response body
    let data: unknown;
    try {
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      logDebug('Parsed response data', {
        component: 'HttpClient',
        operation: 'handleResponse',
        url: response.url,
        status: response.status,
        dataType: typeof data,
        dataKeys: data && typeof data === 'object' ? Object.keys(data) : null,
        dataPreview:
          data && typeof data === 'object'
            ? JSON.stringify(data).substring(0, 200)
            : String(data).substring(0, 200),
        requestId,
      });
    } catch (error) {
      throw new HttpClientError(
        'Failed to parse response',
        response.status,
        'PARSE_ERROR',
        requestId
      );
    }

    // Handle non-2xx responses
    if (!response.ok) {
      const errorData = data as ApiError | undefined;
      throw new HttpClientError(
        errorData?.message || `HTTP ${response.status}`,
        response.status,
        errorData?.code || 'HTTP_ERROR',
        requestId,
        errorData?.details
      );
    }

    // Handle API response envelope
    if (data && typeof data === 'object' && ('ok' in data || 'success' in data)) {
      const apiResponse = data as any;
      const isSuccess = apiResponse.ok !== undefined ? apiResponse.ok : apiResponse.success;
      const message = apiResponse.message || 'API request failed';
      const code = apiResponse.code || 'API_ERROR';

      logDebug('HTTP client detected API envelope', {
        component: 'HttpClient',
        operation: 'handleResponse',
        isSuccess,
        hasData: 'data' in apiResponse,
        dataType: typeof apiResponse.data,
        dataKeys:
          apiResponse.data && typeof apiResponse.data === 'object'
            ? Object.keys(apiResponse.data)
            : null,
        url: response.url,
        requestId,
      });

      if (!isSuccess) {
        throw new HttpClientError(message, response.status, code, requestId, apiResponse.details);
      }
      return apiResponse.data;
    }

    // Return raw data if no envelope
    return data as T;
  }

  /**
   * Handle request errors
   */
  private handleError(
    error: unknown,
    url: string,
    requestId: string,
    startTime: number,
    options: HttpClientOptions
  ): never {
    const duration = Date.now() - startTime;

    // If error handling is skipped, re-throw
    if (options.skipErrorHandling) {
      throw error;
    }

    // Handle HttpClientError (already processed)
    if (error instanceof HttpClientError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new HttpClientError(
        'Network error - please check your connection',
        0,
        'NETWORK_ERROR',
        requestId
      );
    }

    // Handle timeout errors
    if (error instanceof HttpClientError && error.code === 'TIMEOUT') {
      throw new HttpClientError('Request timeout - please try again', 408, 'TIMEOUT', requestId);
    }

    // Handle unknown errors
    logError('HTTP client unknown error', {
      component: 'HttpClient',
      operation: 'handleError',
      url,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      requestId,
    });

    throw new HttpClientError(
      error instanceof Error ? error.message : 'Unknown error',
      500,
      'UNKNOWN_ERROR',
      requestId
    );
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof HttpClientError) {
      // Retry on 5xx errors and network errors
      return error.status >= 500 || error.status === 0;
    }

    // Retry on network errors
    if (error instanceof TypeError) {
      return error.message.includes('fetch') || error.message.includes('network');
    }

    return false;
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global HTTP client instance
export const httpClient = new HttpClient();

// HTTP client interface with both function and method signatures
interface HttpClientInterface {
  <T = unknown>(input: RequestInfo, options?: HttpClientOptions): Promise<T>;
  get: <T = unknown>(input: RequestInfo, options?: HttpClientOptions) => Promise<T>;
  post: <T = unknown>(
    input: RequestInfo,
    data?: unknown,
    options?: HttpClientOptions
  ) => Promise<T>;
  put: <T = unknown>(input: RequestInfo, data?: unknown, options?: HttpClientOptions) => Promise<T>;
  patch: <T = unknown>(
    input: RequestInfo,
    data?: unknown,
    options?: HttpClientOptions
  ) => Promise<T>;
  delete: <T = unknown>(input: RequestInfo, options?: HttpClientOptions) => Promise<T>;
  request: <T = unknown>(input: RequestInfo, options?: HttpClientOptions) => Promise<T>;
}

// Create the HTTP client function with methods
const httpFunction = <T = unknown>(input: RequestInfo, options?: HttpClientOptions): Promise<T> => {
  return httpClient.request<T>(input, options);
};

// Add convenience methods to the function
Object.assign(httpFunction, {
  get: <T = unknown>(input: RequestInfo, options?: HttpClientOptions) =>
    httpClient.get<T>(input, options),

  post: <T = unknown>(input: RequestInfo, data?: unknown, options?: HttpClientOptions) =>
    httpClient.post<T>(input, data, options),

  put: <T = unknown>(input: RequestInfo, data?: unknown, options?: HttpClientOptions) =>
    httpClient.put<T>(input, data, options),

  patch: <T = unknown>(input: RequestInfo, data?: unknown, options?: HttpClientOptions) =>
    httpClient.patch<T>(input, data, options),

  delete: <T = unknown>(input: RequestInfo, options?: HttpClientOptions) =>
    httpClient.delete<T>(input, options),

  request: <T = unknown>(input: RequestInfo, options?: HttpClientOptions) =>
    httpClient.request<T>(input, options),
});

// Export the function with methods attached
export const http = httpFunction as HttpClientInterface;

// Types are already exported above
