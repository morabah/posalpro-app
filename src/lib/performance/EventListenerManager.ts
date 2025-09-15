/**
 * Event Listener Manager - Prevents MaxListenersExceededWarning
 *
 * Monitors and manages event listeners to prevent memory leaks and
 * excessive listener accumulation that causes production warnings.
 */

import { logError, logInfo, logWarn } from '@/lib/logger';

interface ListenerInfo {
  emitter: NodeJS.EventEmitter;
  event: string;
  listener: (...args: any[]) => void;
  addedAt: Date;
  source: string;
}

class EventListenerManager {
  private static instance: EventListenerManager;
  private listeners: Map<string, ListenerInfo[]> = new Map();
  private maxListeners = 10;
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startMonitoring();
  }

  static getInstance(): EventListenerManager {
    if (!EventListenerManager.instance) {
      EventListenerManager.instance = new EventListenerManager();
    }
    return EventListenerManager.instance;
  }

  /**
   * Register a listener to be tracked
   */
  registerListener(
    emitter: NodeJS.EventEmitter,
    event: string,
    listener: (...args: any[]) => void,
    source: string
  ): void {
    const key = this.getEmitterKey(emitter);
    const listenerInfo: ListenerInfo = {
      emitter,
      event,
      listener,
      addedAt: new Date(),
      source,
    };

    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }

    this.listeners.get(key)!.push(listenerInfo);

    // Check if we're approaching the limit
    const currentCount = emitter.listenerCount(event);
    if (currentCount >= this.maxListeners - 2) {
      logWarn('Event listener count approaching limit', {
        component: 'EventListenerManager',
        operation: 'registerListener',
        emitter: key,
        event,
        count: currentCount,
        maxListeners: this.maxListeners,
        source,
      });
    }
  }

  /**
   * Unregister a listener
   */
  unregisterListener(
    emitter: NodeJS.EventEmitter,
    event: string,
    listener: (...args: any[]) => void,
    source: string
  ): void {
    const key = this.getEmitterKey(emitter);
    const emitterListeners = this.listeners.get(key);

    if (emitterListeners) {
      const index = emitterListeners.findIndex(
        info => info.event === event && info.listener === listener && info.source === source
      );

      if (index !== -1) {
        emitterListeners.splice(index, 1);
        if (emitterListeners.length === 0) {
          this.listeners.delete(key);
        }
      }
    }
  }

  /**
   * Clean up all listeners for a specific emitter
   */
  cleanupEmitter(emitter: NodeJS.EventEmitter): void {
    const key = this.getEmitterKey(emitter);
    const emitterListeners = this.listeners.get(key);

    if (emitterListeners) {
      emitterListeners.forEach(info => {
        try {
          info.emitter.removeListener(info.event, info.listener);
        } catch (error) {
          logError('Failed to remove listener', {
            component: 'EventListenerManager',
            operation: 'cleanupEmitter',
            error: error instanceof Error ? error.message : 'Unknown error',
            emitter: key,
            event: info.event,
            source: info.source,
          });
        }
      });
      this.listeners.delete(key);
    }
  }

  /**
   * Get listener statistics
   */
  getStats(): {
    totalEmitters: number;
    totalListeners: number;
    emittersWithHighCount: Array<{
      emitter: string;
      event: string;
      count: number;
      source: string;
    }>;
  } {
    const emittersWithHighCount: Array<{
      emitter: string;
      event: string;
      count: number;
      source: string;
    }> = [];

    let totalListeners = 0;

    this.listeners.forEach((listeners, emitterKey) => {
      const eventCounts = new Map<string, number>();
      const eventSources = new Map<string, string>();

      listeners.forEach(info => {
        const count = eventCounts.get(info.event) || 0;
        eventCounts.set(info.event, count + 1);
        eventSources.set(info.event, info.source);
        totalListeners++;
      });

      eventCounts.forEach((count, event) => {
        if (count >= this.maxListeners - 2) {
          emittersWithHighCount.push({
            emitter: emitterKey,
            event,
            count,
            source: eventSources.get(event) || 'unknown',
          });
        }
      });
    });

    return {
      totalEmitters: this.listeners.size,
      totalListeners,
      emittersWithHighCount,
    };
  }

  /**
   * Start monitoring for listener leaks
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      const stats = this.getStats();

      if (stats.emittersWithHighCount.length > 0) {
        logWarn('High event listener counts detected', {
          component: 'EventListenerManager',
          operation: 'monitoring',
          stats,
        });
      }

      // Log summary every 5 minutes
      if (Date.now() % (5 * 60 * 1000) < 1000) {
        logInfo('Event listener monitoring summary', {
          component: 'EventListenerManager',
          operation: 'monitoring',
          totalEmitters: stats.totalEmitters,
          totalListeners: stats.totalListeners,
        });
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Get a unique key for an emitter
   */
  private getEmitterKey(emitter: NodeJS.EventEmitter): string {
    if (emitter === process) {
      return 'process';
    }

    // Try to get a meaningful identifier
    const constructor = emitter.constructor.name;
    const id = (emitter as any).id || (emitter as any).name || 'unknown';

    return `${constructor}:${id}`;
  }

  /**
   * Clean up all tracked listeners
   */
  cleanup(): void {
    this.stopMonitoring();

    this.listeners.forEach((listeners, key) => {
      listeners.forEach(info => {
        try {
          info.emitter.removeListener(info.event, info.listener);
        } catch (error) {
          // Ignore cleanup errors
        }
      });
    });

    this.listeners.clear();
  }
}

// Export singleton instance
export const eventListenerManager = EventListenerManager.getInstance();

// Utility functions for common patterns
export const safeAddListener = (
  emitter: NodeJS.EventEmitter,
  event: string,
  listener: (...args: any[]) => void,
  source: string
): void => {
  // Check current count
  const currentCount = emitter.listenerCount(event);
  if (currentCount >= 10) {
    logWarn('High listener count detected, cleaning up', {
      component: 'EventListenerManager',
      operation: 'safeAddListener',
      emitter: emitter.constructor.name,
      event,
      currentCount,
      source,
    });

    // Remove all listeners for this event
    emitter.removeAllListeners(event);
  }

  emitter.on(event, listener);
  eventListenerManager.registerListener(emitter, event, listener, source);
};

export const safeRemoveListener = (
  emitter: NodeJS.EventEmitter,
  event: string,
  listener: (...args: any[]) => void,
  source: string
): void => {
  emitter.off(event, listener);
  eventListenerManager.unregisterListener(emitter, event, listener, source);
};

export const safeSetMaxListeners = (emitter: NodeJS.EventEmitter, max: number): void => {
  emitter.setMaxListeners(max);
  logInfo('Set max listeners', {
    component: 'EventListenerManager',
    operation: 'safeSetMaxListeners',
    emitter: emitter.constructor.name,
    maxListeners: max,
  });
};

// Graceful shutdown
process.on('SIGINT', () => {
  eventListenerManager.cleanup();
});

process.on('SIGTERM', () => {
  eventListenerManager.cleanup();
});

export { EventListenerManager };
