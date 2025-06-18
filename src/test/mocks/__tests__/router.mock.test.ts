/**
 * Test suite for Next.js Router Mock
 * Target: Improve test mock coverage from 36.53% to 70%+
 *
 * Testing the mock functionality ensures our test infrastructure
 * is reliable and properly simulates Next.js router behavior.
 */

import { NextRouter } from 'next/router';
import { resetRouterMock, setupRouterMock } from '../router.mock';

interface MockRouterQuery {
  [key: string]: string | string[] | undefined;
}

interface MockRouter
  extends Omit<
    NextRouter,
    'push' | 'replace' | 'prefetch' | 'reload' | 'back' | 'beforePopState' | 'events'
  > {
  query: MockRouterQuery;
  push: jest.MockedFunction<NextRouter['push']>;
  replace: jest.MockedFunction<NextRouter['replace']>;
  prefetch: jest.MockedFunction<NextRouter['prefetch']>;
  reload: jest.MockedFunction<() => void>;
  back: jest.MockedFunction<() => void>;
  beforePopState: jest.MockedFunction<NextRouter['beforePopState']>;
  events: {
    on: jest.MockedFunction<(event: string, handler: (...args: any[]) => void) => void>;
    off: jest.MockedFunction<(event: string, handler: (...args: any[]) => void) => void>;
    emit: jest.MockedFunction<(event: string, ...args: any[]) => void>;
  };
}

describe('Router Mock', () => {
  let mockRouter: MockRouter;

  beforeEach(() => {
    // Import the mockRouter instance directly to ensure we're using the same reference
    // This follows our quality-first approach by ensuring test consistency
    mockRouter = require('../router.mock').mockRouter as MockRouter;
    resetRouterMock();

    // Restore the default resolved values after reset
    mockRouter.push.mockResolvedValue(true);
    mockRouter.replace.mockResolvedValue(true);
    mockRouter.prefetch.mockResolvedValue(undefined);
  });

  describe('Default Mock Properties', () => {
    it('has correct default values', () => {
      expect(mockRouter.basePath).toBe('');
      expect(mockRouter.pathname).toBe('/');
      expect(mockRouter.route).toBe('/');
      expect(mockRouter.asPath).toBe('/');
      expect(mockRouter.query).toEqual({});
      expect(mockRouter.isFallback).toBe(false);
      expect(mockRouter.isLocaleDomain).toBe(false);
      expect(mockRouter.isReady).toBe(true);
      expect(mockRouter.isPreview).toBe(false);
    });
  });

  describe('Navigation Methods', () => {
    it('push method returns resolved promise', async () => {
      const result = await mockRouter.push('/test');
      expect(result).toBe(true);
      expect(mockRouter.push).toHaveBeenCalledWith('/test');
    });

    it('replace method returns resolved promise', async () => {
      const result = await mockRouter.replace('/test');
      expect(result).toBe(true);
      expect(mockRouter.replace).toHaveBeenCalledWith('/test');
    });

    it('reload method can be called', () => {
      mockRouter.reload();
      expect(mockRouter.reload).toHaveBeenCalled();
    });

    it('back method can be called', () => {
      mockRouter.back();
      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('prefetch method returns resolved promise', async () => {
      const result = await mockRouter.prefetch('/test');
      expect(result).toBeUndefined();
      expect(mockRouter.prefetch).toHaveBeenCalledWith('/test');
    });

    it('beforePopState method can be called', () => {
      const callback = jest.fn();
      mockRouter.beforePopState(callback);
      expect(mockRouter.beforePopState).toHaveBeenCalledWith(callback);
    });
  });

  describe('Events System', () => {
    it('has event methods available', () => {
      expect(typeof mockRouter.events.on).toBe('function');
      expect(typeof mockRouter.events.off).toBe('function');
      expect(typeof mockRouter.events.emit).toBe('function');
    });

    it('can register event listeners', () => {
      const handler = jest.fn();
      mockRouter.events.on('routeChangeStart', handler);
      expect(mockRouter.events.on).toHaveBeenCalledWith('routeChangeStart', handler);
    });

    it('can remove event listeners', () => {
      const handler = jest.fn();
      mockRouter.events.off('routeChangeStart', handler);
      expect(mockRouter.events.off).toHaveBeenCalledWith('routeChangeStart', handler);
    });

    it('can emit events', () => {
      mockRouter.events.emit('routeChangeStart', '/test');
      expect(mockRouter.events.emit).toHaveBeenCalledWith('routeChangeStart', '/test');
    });
  });

  describe('resetRouterMock', () => {
    it('resets all router mock functions', () => {
      // Call some methods first
      mockRouter.push('/test');
      mockRouter.events.on('routeChangeStart', jest.fn());

      expect(mockRouter.push).toHaveBeenCalled();
      expect(mockRouter.events.on).toHaveBeenCalled();

      // Reset and verify
      resetRouterMock();

      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(mockRouter.events.on).not.toHaveBeenCalled();
    });

    it('maintains function references after reset', () => {
      const originalPush = mockRouter.push;
      resetRouterMock();

      expect(typeof mockRouter.push).toBe('function');
      expect(mockRouter.push).toBe(originalPush);
    });
  });

  describe('setupRouterMock', () => {
    it('applies overrides to mock router', () => {
      const overrides = {
        pathname: '/custom',
        query: { id: '123' },
        isReady: false,
      };

      const result = setupRouterMock(overrides);

      expect(result.pathname).toBe('/custom');
      expect(result.query).toEqual({ id: '123' });
      expect(result.isReady).toBe(false);
      expect(result).toBe(mockRouter);
    });

    it('preserves non-overridden properties', () => {
      const overrides = { pathname: '/custom' };

      setupRouterMock(overrides);

      expect(mockRouter.pathname).toBe('/custom');
      expect(mockRouter.basePath).toBe(''); // Should remain default
      expect(mockRouter.route).toBe('/'); // Should remain default
    });

    it('can override method implementations', () => {
      const customPush = jest.fn().mockResolvedValue(false);

      setupRouterMock({ push: customPush });

      expect(mockRouter.push).toBe(customPush);
    });
  });

  describe('Mock Function Behavior', () => {
    it('tracks call counts correctly', () => {
      mockRouter.push('/page1');
      mockRouter.push('/page2');
      mockRouter.replace('/page3');

      expect(mockRouter.push).toHaveBeenCalledTimes(2);
      expect(mockRouter.replace).toHaveBeenCalledTimes(1);
    });

    it('tracks call arguments correctly', () => {
      mockRouter.push('/test', '/test', { shallow: true });

      expect(mockRouter.push).toHaveBeenCalledWith('/test', '/test', { shallow: true });
    });
  });

  describe('Integration Scenarios', () => {
    it('simulates route change workflow', async () => {
      // Simulate a route change
      setupRouterMock({ pathname: '/initial' });

      const result = await mockRouter.push('/destination');

      expect(result).toBe(true);
      expect(mockRouter.push).toHaveBeenCalledWith('/destination');
    });

    it('simulates query parameter updates', () => {
      (mockRouter.query as MockRouterQuery).q = 'initial';
      expect(mockRouter.query.q).toBe('initial');

      (mockRouter.query as MockRouterQuery).page = '2';
      expect(mockRouter.query.page).toBe('2');
    });

    it('simulates fallback and preview states', () => {
      setupRouterMock({
        isFallback: true,
        isPreview: true,
        isReady: false,
      });

      expect(mockRouter.isFallback).toBe(true);
      expect(mockRouter.isPreview).toBe(true);
      expect(mockRouter.isReady).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('handles undefined overrides gracefully', () => {
      expect(() => setupRouterMock({})).not.toThrow();
    });

    it('maintains mock integrity after multiple setups', () => {
      setupRouterMock({ pathname: '/first' });
      setupRouterMock({ pathname: '/second' });
      setupRouterMock({ query: { test: 'value' } });

      expect(mockRouter.pathname).toBe('/second');
      expect((mockRouter.query as any).test).toBe('value');
      expect(typeof mockRouter.push).toBe('function');
    });
  });
});
