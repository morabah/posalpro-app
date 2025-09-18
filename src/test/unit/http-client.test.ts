/**
 * PosalPro MVP2 - HTTP Client Unit Tests
 * Comprehensive unit tests for the HTTP client utility
 * Covers success, timeout, retry, and error scenarios using mocked fetch
 */

import { http, HttpClient, HttpClientError, type ApiResponse } from '@/lib/http';
import { jest } from '@jest/globals';

// Mock the logger to capture log calls
jest.mock('@/lib/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn(),
}));

describe('HttpClient', () => {
  let client: HttpClient;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create a fresh client for each test
    client = new HttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
      retries: 2,
      retryDelay: 100,
    });

    // Mock fetch globally
    mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = mockFetch;
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultClient = new HttpClient();
      expect(defaultClient).toBeInstanceOf(HttpClient);
    });

    it('should override default configuration with provided config', () => {
      const customClient = new HttpClient({
        baseURL: 'https://custom.api.com',
        timeout: 10000,
        retries: 5,
      });
      expect(customClient).toBeInstanceOf(HttpClient);
    });
  });

  describe('URL Building', () => {
    it('should build full URL with base URL for relative paths', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        text: () => Promise.resolve(''),
        headers: new Headers(),
      } as Response);

      await client.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
    });

    it('should use absolute URLs as-is', async () => {
      const absoluteUrl = 'https://external.api.com/test';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        text: () => Promise.resolve(''),
        headers: new Headers(),
      } as Response);

      await client.get(absoluteUrl);

      expect(mockFetch).toHaveBeenCalledWith(
        absoluteUrl,
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('HTTP Methods', () => {
    const testData = { name: 'test', value: 123 };
    const mockResponse = {
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true, data: testData }),
      text: () => Promise.resolve(''),
      headers: new Headers({ 'content-type': 'application/json' }),
      url: 'https://api.example.com/test',
    } as Response;

    beforeEach(() => {
      mockFetch.mockResolvedValue(mockResponse);
    });

    it('should handle GET requests', async () => {
      const result = await client.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(testData);
    });

    it('should handle POST requests with data', async () => {
      const result = await client.post('/test', testData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(testData),
        })
      );
      expect(result).toEqual(testData);
    });

    it('should handle PUT requests with data', async () => {
      const result = await client.put('/test', testData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(testData),
        })
      );
      expect(result).toEqual(testData);
    });

    it('should handle PATCH requests with data', async () => {
      const result = await client.patch('/test', testData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(testData),
        })
      );
      expect(result).toEqual(testData);
    });

    it('should handle DELETE requests', async () => {
      const result = await client.delete('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toEqual(testData);
    });
  });

  describe('Success Responses', () => {
    it('should handle successful JSON responses', async () => {
      const responseData = { id: 1, name: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responseData),
        text: () => Promise.resolve(''),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      const result = await client.get('/test');

      expect(result).toEqual(responseData);
    });

    it('should handle successful text responses', async () => {
      const responseText = 'Hello World';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
        text: () => Promise.resolve(responseText),
        headers: new Headers({ 'content-type': 'text/plain' }),
      } as Response);

      const result = await client.get('/test');

      expect(result).toEqual(responseText);
    });

    it('should handle API envelope responses with "ok" property', async () => {
      const apiResponse: ApiResponse<{ id: 1; name: 'test' }> = {
        ok: true,
        data: { id: 1, name: 'test' },
        success: true,
        message: 'Success',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(apiResponse),
        text: () => Promise.resolve(''),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      const result = await client.get('/test');

      expect(result).toEqual(apiResponse.data);
    });

    it('should handle API envelope responses with "success" property', async () => {
      const apiResponse = {
        success: true,
        data: { id: 1, name: 'test' },
        message: 'Success',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(apiResponse),
        text: () => Promise.resolve(''),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      const result = await client.get('/test');

      expect(result).toEqual(apiResponse.data);
    });

    it('should include request headers and default headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        text: () => Promise.resolve(''),
        headers: new Headers(),
      } as Response);

      await client.get('/test', {
        headers: { 'X-Custom-Header': 'custom-value' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            'x-request-id': expect.any(String),
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });
  });

  describe('Timeout Handling', () => {
    it('should throw HttpClientError on timeout', async () => {
      // Mock fetch to never resolve (simulate timeout)
      mockFetch.mockImplementation(() => new Promise(() => {}));

      await expect(client.get('/test')).rejects.toThrow(HttpClientError);
      await expect(client.get('/test')).rejects.toThrow('Request timeout');
    });

    it('should use custom timeout from options', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const startTime = Date.now();

      await expect(client.get('/test', { timeout: 100 })).rejects.toThrow(HttpClientError);

      const duration = Date.now() - startTime;
      // Should timeout after ~100ms, not the default 5000ms
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network errors', async () => {
      // First two calls fail with network error, third succeeds
      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: 'success' }),
          text: () => Promise.resolve(''),
          headers: new Headers(),
        } as Response);

      const result = await client.get('/test');

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'success' });
    });

    it('should retry on 5xx server errors', async () => {
      // First call returns 500, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Server Error' }),
          text: () => Promise.resolve(''),
          headers: new Headers(),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: 'success' }),
          text: () => Promise.resolve(''),
          headers: new Headers(),
        } as Response);

      const result = await client.get('/test');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    it('should not retry on 4xx client errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not Found' }),
        text: () => Promise.resolve(''),
        headers: new Headers(),
      } as Response);

      await expect(client.get('/test')).rejects.toThrow(HttpClientError);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should respect retry configuration', async () => {
      const customClient = new HttpClient({
        retries: 1,
        retryDelay: 50,
      });

      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'success' }),
        text: () => Promise.resolve(''),
        headers: new Headers(),
      } as Response);

      const result = await customClient.get('/test');

      expect(mockFetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
      expect(result).toEqual({ data: 'success' });
    });

    it('should use exponential backoff for retries', async () => {
      jest.useFakeTimers();

      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: 'success' }),
          text: () => Promise.resolve(''),
          headers: new Headers(),
        } as Response);

      const retryPromise = client.get('/test');

      // First retry delay (100ms)
      jest.advanceTimersByTime(100);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Second retry delay (200ms due to backoff)
      jest.advanceTimersByTime(200);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      const result = await retryPromise;
      expect(result).toEqual({ data: 'success' });

      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(client.get('/test')).rejects.toThrow(HttpClientError);
      await expect(client.get('/test')).rejects.toThrow('Network error');
    });

    it('should handle 4xx client errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ code: 'VALIDATION_ERROR', message: 'Bad Request' }),
        text: () => Promise.resolve(''),
        headers: new Headers(),
      } as Response);

      await expect(client.get('/test')).rejects.toThrow(HttpClientError);
      await expect(client.get('/test')).rejects.toThrow('Bad Request');
    });

    it('should handle 5xx server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ code: 'SERVER_ERROR', message: 'Internal Server Error' }),
        text: () => Promise.resolve(''),
        headers: new Headers(),
      } as Response);

      await expect(client.get('/test')).rejects.toThrow(HttpClientError);
      await expect(client.get('/test')).rejects.toThrow('Internal Server Error');
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
        text: () => Promise.reject(new Error('Invalid text')),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await expect(client.get('/test')).rejects.toThrow(HttpClientError);
      await expect(client.get('/test')).rejects.toThrow('Failed to parse response');
    });

    it('should handle API error envelopes', async () => {
      const errorResponse = {
        ok: false,
        code: 'API_ERROR',
        message: 'Something went wrong',
        details: { field: 'email', issue: 'invalid format' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true, // HTTP 200 but API error
        status: 200,
        json: () => Promise.resolve(errorResponse),
        text: () => Promise.resolve(''),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await expect(client.get('/test')).rejects.toThrow(HttpClientError);
      await expect(client.get('/test')).rejects.toThrow('Something went wrong');
    });

    it('should skip error handling when configured', async () => {
      mockFetch.mockRejectedValue(new TypeError('Network error'));

      // Should throw the original error, not HttpClientError
      await expect(client.get('/test', { skipErrorHandling: true })).rejects.toThrow(TypeError);
    });
  });

  describe('Request ID Tracking', () => {
    it('should generate unique request IDs', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        text: () => Promise.resolve(''),
        headers: new Headers(),
      } as Response);

      await client.get('/test1');
      await client.get('/test2');

      const calls = mockFetch.mock.calls;
      const requestId1 = (calls[0][1] as RequestInit).headers?.['x-request-id'];
      const requestId2 = (calls[1][1] as RequestInit).headers?.['x-request-id'];

      expect(requestId1).toBeDefined();
      expect(requestId2).toBeDefined();
      expect(requestId1).not.toBe(requestId2);
    });

    it('should include request ID in error responses', async () => {
      mockFetch.mockRejectedValue(new TypeError('Network error'));

      try {
        await client.get('/test');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpClientError);
        expect((error as HttpClientError).requestId).toBeDefined();
      }
    });
  });

  describe('Logging Integration', () => {
    const { logDebug, logError, logInfo } = require('@/lib/logger');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should log request start', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        text: () => Promise.resolve(''),
        headers: new Headers(),
      } as Response);

      await client.get('/test');

      expect(logDebug).toHaveBeenCalledWith(
        'HTTP request start',
        expect.objectContaining({
          component: 'HttpClient',
          operation: 'makeRequest',
          url: 'https://api.example.com/test',
          method: 'GET',
          requestId: expect.any(String),
          attempt: 1,
        })
      );
    });

    it('should log successful responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        text: () => Promise.resolve(''),
        headers: new Headers(),
      } as Response);

      await client.get('/test');

      expect(logInfo).toHaveBeenCalledWith(
        'HTTP request completed',
        expect.objectContaining({
          component: 'HttpClient',
          operation: 'makeRequest',
          url: 'https://api.example.com/test',
          method: 'GET',
          status: 200,
          duration: expect.any(Number),
          requestId: expect.any(String),
          attempt: 1,
        })
      );
    });

    it('should log failed requests', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

      try {
        await client.get('/test');
      } catch {
        // Expected to throw
      }

      expect(logError).toHaveBeenCalledWith(
        'HTTP request failed',
        expect.objectContaining({
          component: 'HttpClient',
          operation: 'makeRequest',
          url: 'https://api.example.com/test',
          method: 'GET',
          error: 'Network error',
          duration: expect.any(Number),
          requestId: expect.any(String),
          attempt: 1,
        })
      );
    });
  });

  describe('Global HTTP Function', () => {
    it('should provide global http function with all methods', () => {
      expect(typeof http).toBe('function');
      expect(typeof http.get).toBe('function');
      expect(typeof http.post).toBe('function');
      expect(typeof http.put).toBe('function');
      expect(typeof http.patch).toBe('function');
      expect(typeof http.delete).toBe('function');
      expect(typeof http.request).toBe('function');
    });

    it('should use global httpClient instance', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ok: true, data: 'test' }),
        text: () => Promise.resolve(''),
        headers: new Headers({ 'content-type': 'application/json' }),
        url: 'https://api.example.com/test',
      } as Response);

      const result = await http.get('https://api.example.com/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual('test');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty response body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204, // No Content
        json: () => Promise.resolve(null),
        text: () => Promise.resolve(''),
        headers: new Headers({ 'content-type': 'application/json' }),
        url: 'https://api.example.com/test',
      } as Response);

      const result = await client.get('/test');

      expect(result).toBeNull();
    });

    it('should handle non-JSON content types', async () => {
      const xmlContent = '<xml><message>Hello</message></xml>';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Not JSON')),
        text: () => Promise.resolve(xmlContent),
        headers: new Headers({ 'content-type': 'application/xml' }),
      } as Response);

      const result = await client.get('/test');

      expect(result).toBe(xmlContent);
    });

    it('should handle headers correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        text: () => Promise.resolve(''),
        headers: new Headers(),
      } as Response);

      await client.get('/test', {
        headers: {
          Authorization: 'Bearer token123',
          'X-API-Key': 'key456',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token123',
            'X-API-Key': 'key456',
            'Content-Type': 'application/json',
            'x-request-id': expect.any(String),
          }),
        })
      );
    });
  });
});
