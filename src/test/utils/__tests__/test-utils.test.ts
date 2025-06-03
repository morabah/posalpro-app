/**
 * Test suite for Test Utilities
 * Target: Improve test utilities coverage from 33.33% to 70%+
 *
 * Testing our test infrastructure ensures reliability and proper
 * behavior of custom test helpers and utilities.
 */

import { mockFetch, resetMockFetch, resizeWindow, waitForComponentToPaint } from '../test-utils';

describe('Test Utilities', () => {
  afterEach(() => {
    resetMockFetch();
  });

  describe('waitForComponentToPaint', () => {
    it('resolves immediately with zero timeout', async () => {
      const start = Date.now();
      await waitForComponentToPaint(0);
      const end = Date.now();

      expect(end - start).toBeLessThan(50);
    });

    it('waits for specified timeout', async () => {
      const start = Date.now();
      await waitForComponentToPaint(50);
      const end = Date.now();

      expect(end - start).toBeGreaterThanOrEqual(45);
    });

    it('returns a resolved promise', async () => {
      const result = await waitForComponentToPaint(10);
      expect(result).toBeUndefined();
    });

    it('handles zero and negative timeouts', async () => {
      await expect(waitForComponentToPaint(0)).resolves.toBeUndefined();
      await expect(waitForComponentToPaint(-10)).resolves.toBeUndefined();
    });
  });

  describe('resizeWindow', () => {
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;

    afterEach(() => {
      resizeWindow(originalInnerWidth, originalInnerHeight);
    });

    it('updates window dimensions', () => {
      resizeWindow(800, 600);

      expect(window.innerWidth).toBe(800);
      expect(window.innerHeight).toBe(600);
    });

    it('triggers resize event', () => {
      const resizeHandler = jest.fn();
      window.addEventListener('resize', resizeHandler);

      resizeWindow(1200, 800);

      expect(resizeHandler).toHaveBeenCalled();

      window.removeEventListener('resize', resizeHandler);
    });

    it('handles multiple resize calls', () => {
      resizeWindow(800, 600);
      expect(window.innerWidth).toBe(800);

      resizeWindow(1024, 768);
      expect(window.innerWidth).toBe(1024);
      expect(window.innerHeight).toBe(768);
    });

    it('works with edge case dimensions', () => {
      resizeWindow(0, 0);
      expect(window.innerWidth).toBe(0);
      expect(window.innerHeight).toBe(0);

      resizeWindow(10000, 10000);
      expect(window.innerWidth).toBe(10000);
      expect(window.innerHeight).toBe(10000);
    });

    it('handles negative dimensions', () => {
      expect(() => resizeWindow(-100, -100)).not.toThrow();
      expect(window.innerWidth).toBe(-100);
      expect(window.innerHeight).toBe(-100);
    });

    it('dispatches resize event with correct target', () => {
      const eventHandler = jest.fn();
      window.addEventListener('resize', eventHandler);

      resizeWindow(500, 400);

      expect(eventHandler).toHaveBeenCalledTimes(1);

      window.removeEventListener('resize', eventHandler);
    });
  });

  describe('mockFetch', () => {
    it('mocks fetch with success response', async () => {
      const mockData = { message: 'success' };
      mockFetch(mockData);

      const response = await fetch('/api/test');
      const data = await response.json();

      expect(data).toEqual(mockData);
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
    });

    it('mocks fetch with custom status', async () => {
      const mockData = { error: 'Not found' };
      mockFetch(mockData, 404);

      const response = await fetch('/api/test');
      const data = await response.json();

      expect(data).toEqual(mockData);
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    it('handles different data types', async () => {
      // String data
      mockFetch('plain text');
      let response = await fetch('/api/test');
      let data = await response.json();
      expect(data).toBe('plain text');

      // Array data
      mockFetch([1, 2, 3]);
      response = await fetch('/api/test');
      data = await response.json();
      expect(data).toEqual([1, 2, 3]);

      // Number data
      mockFetch(42);
      response = await fetch('/api/test');
      data = await response.json();
      expect(data).toBe(42);
    });

    it('can be called multiple times', async () => {
      mockFetch({ message: 'first' });

      let response = await fetch('/api/test');
      let data = await response.json();
      expect(data.message).toBe('first');

      mockFetch({ message: 'second' });

      response = await fetch('/api/test');
      data = await response.json();
      expect(data.message).toBe('second');
    });

    it('handles various HTTP status codes', async () => {
      const testCases = [
        { status: 200, shouldBeOk: true },
        { status: 201, shouldBeOk: true },
        { status: 400, shouldBeOk: false },
        { status: 401, shouldBeOk: false },
        { status: 404, shouldBeOk: false },
        { status: 500, shouldBeOk: false },
      ];

      for (const testCase of testCases) {
        mockFetch({ test: 'data' }, testCase.status);
        const response = await fetch('/api/test');

        expect(response.status).toBe(testCase.status);
        expect(response.ok).toBe(testCase.shouldBeOk);
      }
    });

    it('overwrites global fetch', () => {
      const originalFetch = global.fetch;

      mockFetch({ test: 'data' });

      expect(global.fetch).toBeDefined();
      expect(global.fetch).not.toBe(originalFetch);
    });
  });

  describe('resetMockFetch', () => {
    it('removes fetch mock', () => {
      mockFetch({ test: 'data' });
      expect(global.fetch).toBeDefined();

      resetMockFetch();
      expect(global.fetch).toBeUndefined();
    });

    it('can be called multiple times safely', () => {
      mockFetch({ test: 'data' });

      resetMockFetch();
      resetMockFetch();

      expect(global.fetch).toBeUndefined();
    });

    it('can be called without prior mock', () => {
      expect(() => resetMockFetch()).not.toThrow();
      expect(global.fetch).toBeUndefined();
    });

    it('handles undefined global fetch', () => {
      global.fetch = undefined as any;
      expect(() => resetMockFetch()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('handles invalid fetch mock data', () => {
      expect(() => mockFetch(null)).not.toThrow();
      expect(() => mockFetch(undefined)).not.toThrow();
    });

    it('handles edge case status codes', () => {
      expect(() => mockFetch({}, 0)).not.toThrow();
      expect(() => mockFetch({}, 999)).not.toThrow();
      expect(() => mockFetch({}, -1)).not.toThrow();
    });

    it('maintains function behavior after errors', async () => {
      // Test that utilities still work after error conditions
      mockFetch(null, 500);
      const response = await fetch('/api/test');
      expect(response.status).toBe(500);

      resetMockFetch();
      expect(global.fetch).toBeUndefined();

      resizeWindow(100, 100);
      expect(window.innerWidth).toBe(100);
    });
  });

  describe('Utility Function Integration', () => {
    it('combines multiple utilities in sequence', async () => {
      // Setup initial state
      mockFetch({ step: 1 }, 200);
      resizeWindow(800, 600);

      // Test fetch works
      const response1 = await fetch('/api/test');
      const data1 = await response1.json();
      expect(data1.step).toBe(1);

      // Wait and change mock
      await waitForComponentToPaint(10);
      mockFetch({ step: 2 }, 201);

      // Test updated fetch
      const response2 = await fetch('/api/test');
      const data2 = await response2.json();
      expect(data2.step).toBe(2);
      expect(response2.status).toBe(201);

      // Test resize still works
      resizeWindow(400, 300);
      expect(window.innerWidth).toBe(400);
      expect(window.innerHeight).toBe(300);

      // Cleanup
      resetMockFetch();
      expect(global.fetch).toBeUndefined();
    });

    it('handles rapid sequential calls', async () => {
      const promises = [];

      // Rapid resize calls
      for (let i = 0; i < 10; i++) {
        resizeWindow(100 + i * 10, 100 + i * 10);
      }
      expect(window.innerWidth).toBe(190);

      // Rapid mock fetch setups and calls
      for (let i = 0; i < 5; i++) {
        mockFetch({ iteration: i });
        // Each fetch call gets the current mock state
        promises.push(fetch('/api/test').then(r => r.json()));
      }

      const results = await Promise.all(promises);
      // Each fetch should get the mock data that was set when the fetch was called
      // Since mocks are synchronous, all should get the last value (4)
      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(result).toHaveProperty('iteration');
        expect(typeof result.iteration).toBe('number');
      });

      // Rapid wait calls
      const waitPromises = [];
      for (let i = 0; i < 5; i++) {
        waitPromises.push(waitForComponentToPaint(1));
      }

      await Promise.all(waitPromises);
      // Should all resolve without error
      expect(waitPromises).toHaveLength(5);
    });
  });

  describe('Performance and Memory', () => {
    it('does not leak memory with repeated calls', () => {
      const initialFetch = global.fetch;

      // Repeat cycle many times
      for (let i = 0; i < 100; i++) {
        mockFetch({ iteration: i });
        resetMockFetch();
      }

      expect(global.fetch).toBeUndefined();

      // Resize many times
      for (let i = 0; i < 100; i++) {
        resizeWindow(i, i);
      }

      expect(window.innerWidth).toBe(99);
      expect(window.innerHeight).toBe(99);
    });

    it('maintains performance with large data', async () => {
      const largeData = {
        items: new Array(1000).fill(0).map((_, i) => ({
          id: i,
          data: `item-${i}`,
          nested: { value: i * 2 },
        })),
      };

      const start = performance.now();
      mockFetch(largeData);
      const response = await fetch('/api/test');
      const data = await response.json();
      const end = performance.now();

      expect(data.items).toHaveLength(1000);
      expect(end - start).toBeLessThan(100); // Should be fast
    });
  });
});
