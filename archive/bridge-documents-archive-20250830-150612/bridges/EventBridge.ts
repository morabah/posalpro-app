/**
 * Event Bridge - CORE_REQUIREMENTS.md Compliant
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: US-1.1 (Event Communication), US-2.1 (Cross-Component Events), US-3.1 (Real-time Updates)
 * - Acceptance Criteria: AC-1.1.1, AC-2.1.1, AC-3.1.1
 * - Hypotheses: H1 (Event Efficiency), H2 (Component Communication), H4 (Real-time Performance)
 *
 * COMPLIANCE STATUS:
 * ✅ Analytics with userStory and hypothesis tracking
 * ✅ TypeScript Type Safety (no any types)
 * ✅ Performance Optimization with useCallback/useMemo
 * ✅ Structured Logging with metadata
 */

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logInfo, logWarn } from '@/lib/logger';
import { useMemo } from 'react';

export type EventType =
  | 'PROPOSAL_CREATED'
  | 'PROPOSAL_UPDATED'
  | 'PROPOSAL_DELETED'
  | 'PROPOSAL_APPROVED'
  | 'PROPOSAL_REJECTED'
  | 'TEAM_ASSIGNED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'THEME_CHANGED'
  | 'NOTIFICATION_ADDED'
  | 'NOTIFICATION_REMOVED'
  | 'SIDEBAR_TOGGLED'
  | 'ANALYTICS_TRACKED'
  | 'ERROR_OCCURRED'
  | 'CACHE_INVALIDATED'
  | 'DATA_REFRESHED'
  | 'MODAL_OPENED'
  | 'MODAL_CLOSED'
  | 'DASHBOARD_DATA_UPDATED'
  | 'USER_ACTIVITY';

// Proper TypeScript interfaces (no any types)
export interface EventPayload {
  [key: string]: unknown;
}

export interface EventListener {
  id: string;
  type: EventType;
  callback: (payload: EventPayload) => void;
  component?: string;
  once?: boolean;
}

export interface EventBridgeConfig {
  enableLogging?: boolean;
  maxListeners?: number;
  enablePerformanceTracking?: boolean;
}

export class EventBridge {
  private listeners: Map<EventType, EventListener[]> = new Map();
  private config: Required<EventBridgeConfig>;
  private performanceMetrics: Map<string, number[]> = new Map();
  private analytics?: (
    event: string,
    data: Record<string, unknown>,
    priority?: 'low' | 'medium' | 'high'
  ) => void;

  constructor(
    config: EventBridgeConfig = {},
    analytics?: (
      event: string,
      data: Record<string, unknown>,
      priority?: 'low' | 'medium' | 'high'
    ) => void
  ) {
    this.config = {
      enableLogging: true,
      maxListeners: 50,
      enablePerformanceTracking: true,
      ...config,
    };
    this.analytics = analytics;
  }

  // Subscribe to an event
  subscribe(
    type: EventType,
    callback: (payload: EventPayload) => void,
    options: { component?: string; once?: boolean } = {}
  ): string {
    const listenerId = Math.random().toString(36).substr(2, 9);
    const listener: EventListener = {
      id: listenerId,
      type,
      callback,
      component: options.component,
      once: options.once || false,
    };

    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }

    const typeListeners = this.listeners.get(type)!;

    // Check max listeners limit
    if (typeListeners.length >= this.config.maxListeners) {
      logWarn('EventBridge: Max listeners reached', {
        component: 'EventBridge',
        operation: 'subscribe',
        eventType: type,
        maxListeners: this.config.maxListeners,
      });
      return listenerId;
    }

    typeListeners.push(listener);

    if (this.config.enableLogging) {
      logDebug('EventBridge: Subscribed to event', {
        component: 'EventBridge',
        operation: 'subscribe',
        eventType: type,
        listenerId,
        listenerComponent: options.component,
        totalListeners: typeListeners.length,
      });
    }

    return listenerId;
  }

  // Unsubscribe from an event
  unsubscribe(type: EventType, listenerId: string): boolean {
    const typeListeners = this.listeners.get(type);
    if (!typeListeners) {
      return false;
    }

    const initialLength = typeListeners.length;
    const filteredListeners = typeListeners.filter(listener => listener.id !== listenerId);

    if (filteredListeners.length === initialLength) {
      return false;
    }

    this.listeners.set(type, filteredListeners);

    if (this.config.enableLogging) {
      logDebug('EventBridge: Unsubscribed from event', {
        component: 'EventBridge',
        operation: 'unsubscribe',
        eventType: type,
        listenerId,
        remainingListeners: filteredListeners.length,
      });
    }

    return true;
  }

  // Emit an event
  emit(type: EventType, payload: EventPayload = {}): void {
    const typeListeners = this.listeners.get(type);
    if (!typeListeners || typeListeners.length === 0) {
      if (this.config.enableLogging) {
        logDebug('EventBridge: No listeners for event', {
          component: 'EventBridge',
          operation: 'emit',
          eventType: type,
        });
      }
      return;
    }

    const startTime = this.config.enablePerformanceTracking ? performance.now() : 0;

    // Track event emission with analytics
    if (this.analytics) {
      this.analytics(
        `event_emitted_${type.toLowerCase()}`,
        {
          eventType: type,
          listenerCount: typeListeners.length,
          userStory: 'US-1.1',
          hypothesis: 'H1',
          ...payload,
        },
        'low'
      );
    }

    if (this.config.enableLogging) {
      logInfo('EventBridge: Emitting event', {
        component: 'EventBridge',
        operation: 'emit',
        eventType: type,
        listenerCount: typeListeners.length,
        payload: this.sanitizePayload(payload),
      });
    }

    // Execute listeners
    const listenersToRemove: string[] = [];

    typeListeners.forEach(listener => {
      try {
        listener.callback(payload);

        if (listener.once) {
          listenersToRemove.push(listener.id);
        }
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'EventBridge listener error',
          ErrorCodes.SYSTEM.INTERNAL_ERROR,
          {
            component: 'EventBridge',
            operation: 'emit',
            eventType: type,
            listenerId: listener.id,
            listenerComponent: listener.component,
          }
        );
        logWarn('EventBridge: Listener error', {
          component: 'EventBridge',
          operation: 'emit',
          eventType: type,
          listenerId: listener.id,
          listenerComponent: listener.component,
          error: standardError.message,
        });
      }
    });

    // Remove one-time listeners
    if (listenersToRemove.length > 0) {
      this.listeners.set(
        type,
        typeListeners.filter(listener => !listenersToRemove.includes(listener.id))
      );
    }

    // Track performance
    if (this.config.enablePerformanceTracking && startTime > 0) {
      const duration = performance.now() - startTime;
      if (!this.performanceMetrics.has(type)) {
        this.performanceMetrics.set(type, []);
      }
      this.performanceMetrics.get(type)!.push(duration);
    }
  }

  // Emit event once (auto-unsubscribe after first emission)
  once(type: EventType, callback: (payload: EventPayload) => void, component?: string): string {
    return this.subscribe(type, callback, { component, once: true });
  }

  // Remove all listeners for a specific event type
  removeAllListeners(type: EventType): number {
    const typeListeners = this.listeners.get(type);
    if (!typeListeners) {
      return 0;
    }

    const count = typeListeners.length;
    this.listeners.delete(type);

    if (this.config.enableLogging) {
      logDebug('EventBridge: Removed all listeners', {
        component: 'EventBridge',
        operation: 'removeAllListeners',
        eventType: type,
        removedCount: count,
      });
    }

    return count;
  }

  // Get listener count for an event type
  getListenerCount(type: EventType): number {
    const typeListeners = this.listeners.get(type);
    return typeListeners ? typeListeners.length : 0;
  }

  // Get all event types that have listeners
  getEventTypes(): EventType[] {
    return Array.from(this.listeners.keys());
  }

  // Get performance metrics
  getPerformanceMetrics(): Record<
    string,
    { avg: number; min: number; max: number; count: number }
  > {
    const metrics: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    this.performanceMetrics.forEach((durations, eventType) => {
      const avg = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);

      metrics[eventType] = {
        avg: Math.round(avg * 1000) / 1000, // Round to 3 decimal places
        min: Math.round(min * 1000) / 1000,
        max: Math.round(max * 1000) / 1000,
        count: durations.length,
      };
    });

    return metrics;
  }

  // Clear all listeners and metrics
  clear(): void {
    this.listeners.clear();
    this.performanceMetrics.clear();

    if (this.config.enableLogging) {
      logDebug('EventBridge: Cleared all listeners and metrics', {
        component: 'EventBridge',
        operation: 'clear',
      });
    }
  }

  // Sanitize payload for logging (remove sensitive data)
  private sanitizePayload(payload: EventPayload): EventPayload {
    const sanitized = { ...payload };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];

    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}

// Global event bridge instance
export const globalEventBridge = new EventBridge({
  enableLogging: true,
  maxListeners: 100,
  enablePerformanceTracking: true,
});

// Hook for using the event bridge in React components
export function useEventBridge() {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Create a new instance with analytics if not already created
  const eventBridgeWithAnalytics = useMemo(() => {
    return new EventBridge(
      {
        enableLogging: true,
        maxListeners: 100,
        enablePerformanceTracking: true,
      },
      analytics
    );
  }, [analytics]);

  return eventBridgeWithAnalytics;
}

// Proper TypeScript interfaces for event data (no any types)
interface ProposalData {
  id: string;
  title: string;
  client: string;
  status: string;
  priority: string;
  dueDate: string;
  estimatedValue?: number;
  [key: string]: unknown;
}

interface ProposalChanges {
  title?: string;
  client?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  estimatedValue?: number;
  [key: string]: unknown;
}

interface UserData {
  id: string;
  email: string;
  role: string;
  name?: string;
  [key: string]: unknown;
}

interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
  [key: string]: unknown;
}

interface ModalProps {
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  [key: string]: unknown;
}

interface AnalyticsMetadata {
  userStory?: string;
  hypothesis?: string;
  [key: string]: unknown;
}

interface ErrorContext {
  component?: string;
  operation?: string;
  [key: string]: unknown;
}

// Predefined event emitters for common actions
export const EventEmitters = {
  proposal: {
    created: (proposalId: string, proposalData: ProposalData) => {
      globalEventBridge.emit('PROPOSAL_CREATED', { proposalId, proposalData });
    },
    updated: (proposalId: string, changes: ProposalChanges) => {
      globalEventBridge.emit('PROPOSAL_UPDATED', { proposalId, changes });
    },
    deleted: (proposalId: string) => {
      globalEventBridge.emit('PROPOSAL_DELETED', { proposalId });
    },
  },
  user: {
    login: (userData: UserData) => {
      globalEventBridge.emit('USER_LOGIN', { userData });
    },
    logout: () => {
      globalEventBridge.emit('USER_LOGOUT', {});
    },
  },
  ui: {
    themeChanged: (theme: 'light' | 'dark') => {
      globalEventBridge.emit('THEME_CHANGED', { theme });
    },
    sidebarToggled: (collapsed: boolean) => {
      globalEventBridge.emit('SIDEBAR_TOGGLED', { collapsed });
    },
    notificationAdded: (notification: NotificationData) => {
      globalEventBridge.emit('NOTIFICATION_ADDED', { notification });
    },
    notificationRemoved: (notificationId: string) => {
      globalEventBridge.emit('NOTIFICATION_REMOVED', { notificationId });
    },
    modalOpened: (modalType: string, props?: ModalProps) => {
      globalEventBridge.emit('MODAL_OPENED', { modalType, props });
    },
    modalClosed: (modalType: string) => {
      globalEventBridge.emit('MODAL_CLOSED', { modalType });
    },
  },
  analytics: {
    tracked: (action: string, metadata?: AnalyticsMetadata) => {
      globalEventBridge.emit('ANALYTICS_TRACKED', { action, metadata });
    },
  },
  system: {
    errorOccurred: (error: Error, context?: ErrorContext) => {
      globalEventBridge.emit('ERROR_OCCURRED', { error: error.message, context });
    },
    cacheInvalidated: (pattern: string) => {
      globalEventBridge.emit('CACHE_INVALIDATED', { pattern });
    },
    dataRefreshed: (dataType: string) => {
      globalEventBridge.emit('DATA_REFRESHED', { dataType });
    },
  },
};
