/**
 * Event Listener Management Tests
 * Verifies proper cleanup and prevention of MaxListenersExceededWarning
 */

import { EventEmitter } from 'events';
import { EventListenerManager, safeAddListener, safeRemoveListener } from '@/lib/performance/EventListenerManager';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logDebug: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn(),
  logError: jest.fn(),
}));

describe('Event Listener Management Tests', () => {
  let eventListenerManager: EventListenerManager;
  let testEmitter: EventEmitter;

  beforeEach(() => {
    jest.clearAllMocks();
    eventListenerManager = EventListenerManager.getInstance();
    testEmitter = new EventEmitter();
  });

  afterEach(() => {
    testEmitter.removeAllListeners();
    eventListenerManager.cleanup();
  });

  describe('Listener Registration and Cleanup', () => {
    it('should register and track listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventListenerManager.registerListener(testEmitter, 'test-event', listener1, 'test-source-1');
      eventListenerManager.registerListener(testEmitter, 'test-event', listener2, 'test-source-2');

      const stats = eventListenerManager.getStats();
      expect(stats.totalListeners).toBe(2);
      expect(stats.totalEmitters).toBe(1);
    });

    it('should unregister listeners properly', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventListenerManager.registerListener(testEmitter, 'test-event', listener1, 'test-source-1');
      eventListenerManager.registerListener(testEmitter, 'test-event', listener2, 'test-source-2');

      eventListenerManager.unregisterListener(testEmitter, 'test-event', listener1, 'test-source-1');

      const stats = eventListenerManager.getStats();
      expect(stats.totalListeners).toBe(1);
    });

    it('should clean up all listeners for an emitter', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventListenerManager.registerListener(testEmitter, 'event1', listener1, 'test-source');
      eventListenerManager.registerListener(testEmitter, 'event2', listener2, 'test-source');

      eventListenerManager.cleanupEmitter(testEmitter);

      const stats = eventListenerManager.getStats();
      expect(stats.totalListeners).toBe(0);
      expect(stats.totalEmitters).toBe(0);
    });
  });

  describe('High Listener Count Detection', () => {
    it('should detect emitters with high listener counts', () => {
      const listeners: jest.Mock[] = [];

      // Add 12 listeners (exceeds default max of 10)
      for (let i = 0; i < 12; i++) {
        const listener = jest.fn();
        listeners.push(listener);
        eventListenerManager.registerListener(testEmitter, 'test-event', listener, `test-source-${i}`);
      }

      const stats = eventListenerManager.getStats();
      expect(stats.emittersWithHighCount).toHaveLength(1);
      expect(stats.emittersWithHighCount[0].count).toBe(12);
      expect(stats.emittersWithHighCount[0].event).toBe('test-event');
    });

    it('should not detect emitters with low listener counts', () => {
      const listeners: jest.Mock[] = [];

      // Add 5 listeners (below threshold)
      for (let i = 0; i < 5; i++) {
        const listener = jest.fn();
        listeners.push(listener);
        eventListenerManager.registerListener(testEmitter, 'test-event', listener, `test-source-${i}`);
      }

      const stats = eventListenerManager.getStats();
      expect(stats.emittersWithHighCount).toHaveLength(0);
    });
  });

  describe('Safe Listener Management', () => {
    it('should safely add listeners without exceeding limits', () => {
      const listeners: jest.Mock[] = [];

      // Add listeners using safe method
      for (let i = 0; i < 15; i++) {
        const listener = jest.fn();
        listeners.push(listener);
        safeAddListener(testEmitter, 'test-event', listener, `test-source-${i}`);
      }

      // Should not exceed max listeners due to cleanup
      expect(testEmitter.listenerCount('test-event')).toBeLessThanOrEqual(10);
    });

    it('should safely remove listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      safeAddListener(testEmitter, 'test-event', listener1, 'test-source-1');
      safeAddListener(testEmitter, 'test-event', listener2, 'test-source-2');

      expect(testEmitter.listenerCount('test-event')).toBe(2);

      safeRemoveListener(testEmitter, 'test-event', listener1, 'test-source-1');

      expect(testEmitter.listenerCount('test-event')).toBe(1);
    });
  });

  describe('Multiple Emitters', () => {
    it('should track multiple emitters separately', () => {
      const emitter1 = new EventEmitter();
      const emitter2 = new EventEmitter();
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventListenerManager.registerListener(emitter1, 'event1', listener1, 'source-1');
      eventListenerManager.registerListener(emitter2, 'event2', listener2, 'source-2');

      const stats = eventListenerManager.getStats();
      expect(stats.totalEmitters).toBe(2);
      expect(stats.totalListeners).toBe(2);
    });

    it('should clean up specific emitters without affecting others', () => {
      const emitter1 = new EventEmitter();
      const emitter2 = new EventEmitter();
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventListenerManager.registerListener(emitter1, 'event1', listener1, 'source-1');
      eventListenerManager.registerListener(emitter2, 'event2', listener2, 'source-2');

      eventListenerManager.cleanupEmitter(emitter1);

      const stats = eventListenerManager.getStats();
      expect(stats.totalEmitters).toBe(1);
      expect(stats.totalListeners).toBe(1);
    });
  });

  describe('Process Event Listeners', () => {
    it('should handle process event listeners safely', () => {
      const originalListenerCount = process.listenerCount('SIGINT');

      const listener1 = jest.fn();
      const listener2 = jest.fn();

      safeAddListener(process, 'SIGINT', listener1, 'test-process-1');
      safeAddListener(process, 'SIGINT', listener2, 'test-process-2');

      // Should not exceed reasonable limits
      expect(process.listenerCount('SIGINT')).toBeLessThanOrEqual(originalListenerCount + 2);

      // Clean up
      safeRemoveListener(process, 'SIGINT', listener1, 'test-process-1');
      safeRemoveListener(process, 'SIGINT', listener2, 'test-process-2');
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should prevent memory leaks from repeated listener additions', () => {
      const listeners: jest.Mock[] = [];

      // Simulate repeated listener additions (common leak pattern)
      for (let iteration = 0; iteration < 5; iteration++) {
        for (let i = 0; i < 3; i++) {
          const listener = jest.fn();
          listeners.push(listener);
          safeAddListener(testEmitter, 'test-event', listener, `iteration-${iteration}-source-${i}`);
        }
      }

      // Should not accumulate excessive listeners
      expect(testEmitter.listenerCount('test-event')).toBeLessThanOrEqual(10);
    });

    it('should clean up properly on manager cleanup', () => {
      const listeners: jest.Mock[] = [];

      // Add multiple listeners
      for (let i = 0; i < 5; i++) {
        const listener = jest.fn();
        listeners.push(listener);
        eventListenerManager.registerListener(testEmitter, 'test-event', listener, `test-source-${i}`);
      }

      expect(eventListenerManager.getStats().totalListeners).toBe(5);

      // Clean up manager
      eventListenerManager.cleanup();

      expect(eventListenerManager.getStats().totalListeners).toBe(0);
    });
  });

  describe('Monitoring and Statistics', () => {
    it('should provide accurate statistics', () => {
      const emitter1 = new EventEmitter();
      const emitter2 = new EventEmitter();
      const listeners: jest.Mock[] = [];

      // Add listeners to different emitters and events
      for (let i = 0; i < 3; i++) {
        const listener = jest.fn();
        listeners.push(listener);
        eventListenerManager.registerListener(emitter1, 'event1', listener, `source-${i}`);
      }

      for (let i = 0; i < 2; i++) {
        const listener = jest.fn();
        listeners.push(listener);
        eventListenerManager.registerListener(emitter2, 'event2', listener, `source-${i}`);
      }

      const stats = eventListenerManager.getStats();
      expect(stats.totalEmitters).toBe(2);
      expect(stats.totalListeners).toBe(5);
      expect(stats.emittersWithHighCount).toHaveLength(0);
    });

    it('should detect high listener counts across different events', () => {
      const listeners: jest.Mock[] = [];

      // Add many listeners to different events
      for (let i = 0; i < 6; i++) {
        const listener = jest.fn();
        listeners.push(listener);
        eventListenerManager.registerListener(testEmitter, 'event1', listener, `source-${i}`);
      }

      for (let i = 0; i < 6; i++) {
        const listener = jest.fn();
        listeners.push(listener);
        eventListenerManager.registerListener(testEmitter, 'event2', listener, `source-${i}`);
      }

      const stats = eventListenerManager.getStats();
      expect(stats.emittersWithHighCount).toHaveLength(2);
      expect(stats.emittersWithHighCount[0].count).toBe(6);
      expect(stats.emittersWithHighCount[1].count).toBe(6);
    });
  });
});
