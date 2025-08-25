// HTTP client helper with error propagation and request ID support
export type ApiError = {
  code?: string;
  message: string;
  details?: unknown;
};

export interface HttpOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface HttpResponse<T> {
  data: T;
  status: number;
  headers: Headers;
  requestId?: string;
}

// Default HTTP options
const DEFAULT_OPTIONS: HttpOptions = {
  timeout: 10000, // 10 seconds
  retries: 1,
  retryDelay: 1000, // 1 second
};

// Create headers with common defaults
function createHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);

  // Set default content type if not provided
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return headers;
}

// Parse error response
async function parseErrorResponse(response: Response): Promise<ApiError> {
  try {
    const payload = await response.json();
    return {
      code: payload.code || `HTTP_${response.status}`,
      message: payload.message || `HTTP ${response.status}: ${response.statusText}`,
      details: payload.details,
    };
  } catch {
    return {
      code: `HTTP_${response.status}`,
      message: `HTTP ${response.status}: ${response.statusText}`,
    };
  }
}

// Create timeout promise
function createTimeoutPromise(timeout: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);
  });
}

// Retry logic
async function retryRequest<T>(
  requestFn: () => Promise<T>,
  retries: number,
  delay: number
): Promise<T> {
  try {
    return await requestFn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, retries - 1, delay);
    }
    throw error;
  }
}

// Main HTTP function
export async function http<T>(input: RequestInfo, init?: HttpOptions): Promise<T> {
  const options = { ...DEFAULT_OPTIONS, ...init };
  const { timeout, retries, retryDelay, ...fetchOptions } = options;

  const requestFn = async (): Promise<T> => {
    const headers = createHeaders(fetchOptions.headers);

    const fetchPromise = fetch(input, {
      ...fetchOptions,
      headers,
      cache: 'no-store', // Always fetch fresh data
    });

    // Race between fetch and timeout
    const response = (await Promise.race([
      fetchPromise,
      createTimeoutPromise(timeout!),
    ])) as Response;

    // Extract request ID from response headers
    const requestId = response.headers.get('x-request-id');

    if (!response.ok) {
      const error = await parseErrorResponse(response);
      const httpError = new Error(error.message) as Error & {
        status: number;
        code: string;
        details?: unknown;
        requestId?: string;
      };

      httpError.status = response.status;
      httpError.code = error.code || `HTTP_${response.status}`;
      httpError.details = error.details;
      httpError.requestId = requestId || undefined;

      throw httpError;
    }

    // Parse JSON response
    const data = await response.json();

    // Add request ID to the response if available
    if (requestId && typeof data === 'object' && data !== null) {
      (data as any).requestId = requestId;
    }

    return data;
  };

  // Apply retry logic if retries > 0
  if (retries! > 0) {
    return retryRequest(requestFn, retries!, retryDelay!);
  }

  return requestFn();
}

// Convenience methods for different HTTP verbs
export const httpClient = {
  get: <T>(url: string, options?: HttpOptions): Promise<T> =>
    http<T>(url, { ...options, method: 'GET' }),

  post: <T>(url: string, data?: unknown, options?: HttpOptions): Promise<T> =>
    http<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(url: string, data?: unknown, options?: HttpOptions): Promise<T> =>
    http<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(url: string, data?: unknown, options?: HttpOptions): Promise<T> =>
    http<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(url: string, options?: HttpOptions): Promise<T> =>
    http<T>(url, { ...options, method: 'DELETE' }),
};

// Export the main http function as default
export default http;
