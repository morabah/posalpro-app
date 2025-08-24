// __FILE_DESCRIPTION__: Management Bridge component template with React context and state management
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

'use client';

/**
 * __BRIDGE_NAME__ Management Bridge - CORE_REQUIREMENTS.md Compliant
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: __USER_STORY__
 * - Acceptance Criteria: AC-X.X.X (Bridge pattern implementation, Error handling, Analytics tracking)
 * - Hypotheses: __HYPOTHESIS__ (Performance optimization through centralized state)
 *
 * COMPLIANCE STATUS:
 * ✅ Error Handling with ErrorHandlingService
 * ✅ Analytics with userStory and hypothesis tracking
 * ✅ Structured Logging with metadata
 * ✅ TypeScript Type Safety (no any types)
 * ✅ Performance Optimization with useCallback/useMemo
 * ✅ Infinite Loop Prevention Patterns
 *
 * 🚨 CRITICAL: INFINITE LOOP PREVENTION PATTERNS
 *
 * This template includes specific patterns to prevent "Maximum update depth exceeded" errors:
 *
 * 1. ✅ useEffect with Empty Dependency Arrays:
 *    - Use `useEffect(() => { ... }, [])` for mount-only effects
 *    - Never include unstable functions (analytics, bridge methods) in dependencies
 *    - Add ESLint suppression comments explaining the rationale
 *
 * 2. ✅ setTimeout Pattern for Bridge Calls:
 *    - Wrap all bridge.set* calls in `setTimeout(() => { ... }, 0)`
 *    - This defers state updates to the next tick, preventing render-time loops
 *    - Apply to: setFilters, setSelectedEntity, trackPageView, trackAction
 *
 * 3. ✅ Event Subscription Safety:
 *    - Use empty dependency arrays for event subscriptions
 *    - Defer bridge calls within event handlers using setTimeout
 *    - Always clean up subscriptions in useEffect return
 *
 * 4. ✅ Auto-refresh Safety:
 *    - Use empty dependency arrays for auto-refresh effects
 *    - Defer refresh calls using setTimeout within intervals
 *    - Never include refresh functions in dependencies
 *
 * 5. ✅ State Update Safety:
 *    - Defer all state updates that might trigger re-renders
 *    - Use setTimeout for analytics calls that might cause loops
 *    - Avoid direct bridge calls during render cycles
 *
 * PATTERN EXAMPLES:
 * ```typescript
 * // ✅ CORRECT: Empty dependency array
 * useEffect(() => {
 *   // Mount-only logic
 * }, []); // CRITICAL: Empty dependency array to prevent infinite loops
 *
 * // ✅ CORRECT: Deferred bridge calls
 * const setFilters = useCallback((filters) => {
 *   setTimeout(() => {
 *     stateBridge.setFilters(filters);
 *     analytics('filters_changed', data);
 *   }, 0);
 * }, []);
 *
 * // ❌ WRONG: Unstable dependencies
 * useEffect(() => {
 *   refreshData();
 * }, [refreshData]); // Causes infinite loops!
 *
 * // ❌ WRONG: Direct bridge calls
 * const setFilters = useCallback((filters) => {
 *   stateBridge.setFilters(filters); // Causes infinite loops!
 * }, [stateBridge]);
 * ```
 */

import { useAuth } from '@/components/providers/AuthProvider';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import {
  use__BRIDGE_NAME__ApiBridge,
  type __ENTITY_TYPE__,
  type __ENTITY_TYPE__FetchParams,
} from '@/lib/bridges/__BRIDGE_NAME__ApiBridge';
import { useEventBridge } from '@/lib/bridges/EventBridge';
import { useStateBridge, useUIState } from '@/lib/bridges/StateBridge';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logError, logInfo } from '@/lib/logger';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

// ====================
// TypeScript Interfaces
// ====================

interface __BRIDGE_NAME__Filters {
  search?: string;
  status?: string[];
  dateRange?: { start: string; end: string };
  [key: string]: unknown;
}

interface __BRIDGE_NAME__State {
  entities: __ENTITY_TYPE__[];
  selectedEntity?: __ENTITY_TYPE__;
  filters: __BRIDGE_NAME__Filters;
  loading: boolean;
  error: string | null;
  lastFetch?: Date;
}

interface NotificationData {
  id?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp?: string;
  read?: boolean;
}

interface ActionMetadata {
  component?: string;
  operation?: string;
  userStory?: string;
  hypothesis?: string;
  [key: string]: unknown;
}

interface __BRIDGE_NAME__BridgeContextValue {
  // Data operations
  fetch__ENTITY_TYPE__s: (params?: __ENTITY_TYPE__FetchParams) => Promise<void>;
  refresh__ENTITY_TYPE__s: () => Promise<void>;
  get__ENTITY_TYPE__: (id: string) => Promise<__ENTITY_TYPE__ | null>;
  create__ENTITY_TYPE__: (payload: Record<string, unknown>) => Promise<__ENTITY_TYPE__ | null>;
  update__ENTITY_TYPE__: (
    id: string,
    payload: Record<string, unknown>
  ) => Promise<__ENTITY_TYPE__ | null>;
  delete__ENTITY_TYPE__: (id: string) => Promise<boolean>;

  // State management
  setFilters: (filters: __BRIDGE_NAME__Filters) => void;
  setSelectedEntity: (entity: __ENTITY_TYPE__ | undefined) => void;
  clearError: () => void;

  // Analytics and tracking
  trackPageView: (page: string) => void;
  trackAction: (action: string, metadata?: ActionMetadata) => void;

  // State access
  state: __BRIDGE_NAME__State;
  uiState: unknown;
}

interface __BRIDGE_NAME__ManagementBridgeProps {
  children: React.ReactNode;
  initialFilters?: __BRIDGE_NAME__Filters;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// ====================
// Context Setup
// ====================

const __BRIDGE_NAME__BridgeContext = React.createContext<__BRIDGE_NAME__BridgeContextValue | null>(
  null
);

// ====================
// Management Bridge Component
// ====================

export function __BRIDGE_NAME__ManagementBridge({
  children,
}: __BRIDGE_NAME__ManagementBridgeProps) {
  // ====================
  // Hooks and Dependencies
  // ====================

  const apiBridge = use__BRIDGE_NAME__ApiBridge({
    enableCache: true,
    retryAttempts: 3,
    timeout: 15000,
    // ✅ SECURITY: RBAC configuration
    requireAuth: true,
    requiredPermissions: [
      `__RESOURCE_NAME__:read`,
      `__RESOURCE_NAME__:create`,
      `__RESOURCE_NAME__:update`,
      `__RESOURCE_NAME__:delete`,
    ],
    defaultScope: 'TEAM',
  });

  const stateBridge = useStateBridge();
  const uiState = useUIState();
  const eventBridge = useEventBridge();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // ✅ SECURITY: Authentication and authorization
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // ====================
  // Local State
  // ====================

  const [state, setState] = useState<__BRIDGE_NAME__State>({
    entities: [],
    filters: initialFilters,
    loading: false,
    error: null,
  });

  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  // ====================
  // Event Subscriptions
  // ====================

  // ✅ CRITICAL: Empty dependency array to prevent infinite loops
  useEffect(() => {
    const dataRefreshedListener = eventBridge.subscribe(
      'DATA_REFRESHED',
      payload => {
        logInfo('__BRIDGE_NAME__ManagementBridge: Data refreshed event received', {
          component: '__BRIDGE_NAME__ManagementBridge',
          operation: 'dataRefreshed',
          entityType: '__RESOURCE_NAME__',
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        });

        // Refresh data if it matches our resource
        if (payload.entityType === '__RESOURCE_NAME__' || !payload.entityType) {
          // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
          setTimeout(() => {
            refresh__ENTITY_TYPE__s();
          }, 0);
        }
      },
      { component: '__BRIDGE_NAME__ManagementBridge' }
    );

    return () => {
      eventBridge.unsubscribe('DATA_REFRESHED', dataRefreshedListener);
    };
  }, []); // ✅ CRITICAL: Empty dependency array to prevent infinite loops

  // ====================
  // Auto-refresh Setup
  // ====================

  // ✅ CRITICAL: Empty dependency array to prevent infinite loops
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      logDebug('__BRIDGE_NAME__ManagementBridge: Auto-refresh triggered', {
        component: '__BRIDGE_NAME__ManagementBridge',
        operation: 'autoRefresh',
        interval: refreshInterval,
      });
      // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
      setTimeout(() => {
        refresh__ENTITY_TYPE__s();
      }, 0);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, []); // ✅ CRITICAL: Empty dependency array to prevent infinite loops

  // ====================
  // Data Operations
  // ====================

  const fetch__ENTITY_TYPE__s = useCallback(
    async (params?: __ENTITY_TYPE__FetchParams) => {
      // ✅ SECURITY: Check authentication before proceeding
      if (!isAuthenticated || authLoading) {
        logDebug('__BRIDGE_NAME__ManagementBridge: Authentication check', {
          component: '__BRIDGE_NAME__ManagementBridge',
          operation: 'fetch__ENTITY_TYPE__s',
          isAuthenticated,
          authLoading,
        });
        return;
      }

      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        logDebug('__BRIDGE_NAME__ManagementBridge: Fetch start', {
          component: '__BRIDGE_NAME__ManagementBridge',
          operation: 'fetch__ENTITY_TYPE__s',
          params,
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        });

        const fetchParams = {
          ...params,
          ...state.filters,
          fields: 'id,name,status,updatedAt', // Minimal fields per CORE_REQUIREMENTS
        };

        // ✅ SECURITY: Pass session data to API bridge for RBAC validation
        const result = await apiBridge.fetch__ENTITY_TYPE__s(fetchParams, {
          user: {
            id: user?.id,
            roles: user?.roles || [],
            permissions: user?.permissions || [],
          },
        });

        if (result.success && result.data) {
          setState(prev => ({
            ...prev,
            entities: result.data,
            loading: false,
            lastFetch: new Date(),
          }));

          analytics(
            '__RESOURCE_NAME___fetched',
            {
              count: result.data.length,
              userStory: '__USER_STORY__',
              hypothesis: '__HYPOTHESIS__',
            },
            'medium'
          );

          logInfo('__BRIDGE_NAME__ManagementBridge: Fetch success', {
            component: '__BRIDGE_NAME__ManagementBridge',
            operation: 'fetch__ENTITY_TYPE__s',
            resultCount: result.data.length,
          });
        } else {
          throw new Error('Failed to fetch data');
        }
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'Failed to fetch __RESOURCE_NAME__',
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: '__BRIDGE_NAME__ManagementBridge',
            operation: 'fetch__ENTITY_TYPE__s',
            params,
          }
        );

        setState(prev => ({
          ...prev,
          loading: false,
          error: standardError.message,
        }));

        analytics(
          '__RESOURCE_NAME___fetch_error',
          {
            error: standardError.message,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          },
          'high'
        );

        logError('__BRIDGE_NAME__ManagementBridge: Fetch failed', {
          component: '__BRIDGE_NAME__ManagementBridge',
          operation: 'fetch__ENTITY_TYPE__s',
          error: standardError.message,
        });

        addNotification({
          type: 'error',
          title: 'Fetch Error',
          message: ehs.getUserFriendlyMessage(error),
        });
      }
    },
    [apiBridge, analytics, state.filters]
  );

  const refresh__ENTITY_TYPE__s = useCallback(async () => {
    apiBridge.clearCache('list');
    await fetch__ENTITY_TYPE__s();
  }, [apiBridge, fetch__ENTITY_TYPE__s]);

  const get__ENTITY_TYPE__ = useCallback(
    async (id: string): Promise<__ENTITY_TYPE__ | null> => {
      try {
        logDebug('__BRIDGE_NAME__ManagementBridge: Get entity start', {
          component: '__BRIDGE_NAME__ManagementBridge',
          operation: 'get__ENTITY_TYPE__',
          id,
        });

        const result = await apiBridge.get__ENTITY_TYPE__(id);

        if (result.success && result.data) {
          analytics(
            '__RESOURCE_NAME___detail_fetched',
            {
              id,
              userStory: '__USER_STORY__',
              hypothesis: '__HYPOTHESIS__',
            },
            'medium'
          );

          logInfo('__BRIDGE_NAME__ManagementBridge: Get entity success', {
            component: '__BRIDGE_NAME__ManagementBridge',
            operation: 'get__ENTITY_TYPE__',
            id,
          });

          return result.data;
        }

        return null;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          `Failed to get __RESOURCE_NAME__ ${id}`,
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: '__BRIDGE_NAME__ManagementBridge',
            operation: 'get__ENTITY_TYPE__',
            id,
          }
        );

        analytics(
          '__RESOURCE_NAME___detail_fetch_error',
          {
            id,
            error: standardError.message,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          },
          'high'
        );

        logError('__BRIDGE_NAME__ManagementBridge: Get entity failed', {
          component: '__BRIDGE_NAME__ManagementBridge',
          operation: 'get__ENTITY_TYPE__',
          id,
          error: standardError.message,
        });

        addNotification({
          type: 'error',
          title: 'Fetch Error',
          message: ehs.getUserFriendlyMessage(error),
        });

        return null;
      }
    },
    [apiBridge, analytics]
  );

  const create__ENTITY_TYPE__ = useCallback(
    async (payload: Record<string, unknown>): Promise<__ENTITY_TYPE__ | null> => {
      try {
        logDebug('__BRIDGE_NAME__ManagementBridge: Create entity start', {
          component: '__BRIDGE_NAME__ManagementBridge',
          operation: 'create__ENTITY_TYPE__',
          payloadKeys: Object.keys(payload),
        });

        const result = await apiBridge.create__ENTITY_TYPE__(payload);

        if (result.success && result.data) {
          // Refresh list to include new entity
          await refresh__ENTITY_TYPE__s();

          analytics(
            '__RESOURCE_NAME___created',
            {
              id: result.data.id,
              userStory: '__USER_STORY__',
              hypothesis: '__HYPOTHESIS__',
            },
            'high'
          );

          logInfo('__BRIDGE_NAME__ManagementBridge: Create entity success', {
            component: '__BRIDGE_NAME__ManagementBridge',
            operation: 'create__ENTITY_TYPE__',
            id: result.data.id,
          });

          addNotification({
            type: 'success',
            title: 'Success',
            message: '__ENTITY_TYPE__ created successfully',
          });

          return result.data;
        }

        return null;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'Failed to create __RESOURCE_NAME__',
          ErrorCodes.DATA.CREATE_FAILED,
          {
            component: '__BRIDGE_NAME__ManagementBridge',
            operation: 'create__ENTITY_TYPE__',
            payloadKeys: Object.keys(payload),
          }
        );

        analytics(
          '__RESOURCE_NAME___create_error',
          {
            error: standardError.message,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          },
          'high'
        );

        logError('__BRIDGE_NAME__ManagementBridge: Create entity failed', {
          component: '__BRIDGE_NAME__ManagementBridge',
          operation: 'create__ENTITY_TYPE__',
          error: standardError.message,
        });

        addNotification({
          type: 'error',
          title: 'Creation Error',
          message: ehs.getUserFriendlyMessage(error),
        });

        return null;
      }
    },
    [apiBridge, analytics, refresh__ENTITY_TYPE__s]
  );

  const update__ENTITY_TYPE__ = useCallback(
    async (id: string, payload: Record<string, unknown>): Promise<__ENTITY_TYPE__ | null> => {
      try {
        logDebug('__BRIDGE_NAME__ManagementBridge: Update entity start', {
          component: '__BRIDGE_NAME__ManagementBridge',
          operation: 'update__ENTITY_TYPE__',
          id,
          payloadKeys: Object.keys(payload),
        });

        const result = await apiBridge.update__ENTITY_TYPE__(id, payload);

        if (result.success && result.data) {
          // Update entity in local state
          setState(prev => ({
            ...prev,
            entities: prev.entities.map(entity => (entity.id === id ? result.data! : entity)),
          }));

          analytics(
            '__RESOURCE_NAME___updated',
            {
              id,
              userStory: '__USER_STORY__',
              hypothesis: '__HYPOTHESIS__',
            },
            'high'
          );

          logInfo('__BRIDGE_NAME__ManagementBridge: Update entity success', {
            component: '__BRIDGE_NAME__ManagementBridge',
            operation: 'update__ENTITY_TYPE__',
            id,
          });

          addNotification({
            type: 'success',
            title: 'Success',
            message: '__ENTITY_TYPE__ updated successfully',
          });

          return result.data;
        }

        return null;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          `Failed to update __RESOURCE_NAME__ ${id}`,
          ErrorCodes.DATA.UPDATE_FAILED,
          {
            component: '__BRIDGE_NAME__ManagementBridge',
            operation: 'update__ENTITY_TYPE__',
            id,
            payloadKeys: Object.keys(payload),
          }
        );

        analytics(
          '__RESOURCE_NAME___update_error',
          {
            id,
            error: standardError.message,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          },
          'high'
        );

        logError('__BRIDGE_NAME__ManagementBridge: Update entity failed', {
          component: '__BRIDGE_NAME__ManagementBridge',
          operation: 'update__ENTITY_TYPE__',
          id,
          error: standardError.message,
        });

        addNotification({
          type: 'error',
          title: 'Update Error',
          message: ehs.getUserFriendlyMessage(error),
        });

        return null;
      }
    },
    [apiBridge, analytics]
  );

  const delete__ENTITY_TYPE__ = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        logDebug('__BRIDGE_NAME__ManagementBridge: Delete entity start', {
          component: '__BRIDGE_NAME__ManagementBridge',
          operation: 'delete__ENTITY_TYPE__',
          id,
        });

        const result = await apiBridge.delete__ENTITY_TYPE__(id);

        if (result.success) {
          // Remove entity from local state
          setState(prev => ({
            ...prev,
            entities: prev.entities.filter(entity => entity.id !== id),
          }));

          analytics(
            '__RESOURCE_NAME___deleted',
            {
              id,
              userStory: '__USER_STORY__',
              hypothesis: '__HYPOTHESIS__',
            },
            'high'
          );

          logInfo('__BRIDGE_NAME__ManagementBridge: Delete entity success', {
            component: '__BRIDGE_NAME__ManagementBridge',
            operation: 'delete__ENTITY_TYPE__',
            id,
          });

          addNotification({
            type: 'success',
            title: 'Success',
            message: '__ENTITY_TYPE__ deleted successfully',
          });

          return true;
        }

        return false;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          `Failed to delete __RESOURCE_NAME__ ${id}`,
          ErrorCodes.DATA.DELETE_FAILED,
          {
            component: '__BRIDGE_NAME__ManagementBridge',
            operation: 'delete__ENTITY_TYPE__',
            id,
          }
        );

        analytics(
          '__RESOURCE_NAME___delete_error',
          {
            id,
            error: standardError.message,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          },
          'high'
        );

        logError('__BRIDGE_NAME__ManagementBridge: Delete entity failed', {
          component: '__BRIDGE_NAME__ManagementBridge',
          operation: 'delete__ENTITY_TYPE__',
          id,
          error: standardError.message,
        });

        addNotification({
          type: 'error',
          title: 'Delete Error',
          message: ehs.getUserFriendlyMessage(error),
        });

        return false;
      }
    },
    [apiBridge, analytics]
  );

  // ====================
  // State Management
  // ====================

  const setFilters = useCallback(
    (filters: __BRIDGE_NAME__Filters) => {
      // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
      setTimeout(() => {
        setState(prev => ({ ...prev, filters }));
        analytics(
          '__RESOURCE_NAME___filters_changed',
          {
            filterCount: Object.keys(filters).length,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          },
          'low'
        );
      }, 0);
    },
    [analytics]
  );

  const setSelectedEntity = useCallback((entity: __ENTITY_TYPE__ | undefined) => {
    // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
    setTimeout(() => {
      setState(prev => ({ ...prev, selectedEntity: entity }));
    }, 0);
  }, []);

  const clearError = useCallback(() => {
    // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
    setTimeout(() => {
      setState(prev => ({ ...prev, error: null }));
    }, 0);
  }, []);

  // ====================
  // Analytics and Tracking
  // ====================

  const trackPageView = useCallback(
    (page: string) => {
      // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
      setTimeout(() => {
        analytics(
          'page_viewed',
          {
            page,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          },
          'low'
        );
      }, 0);
    },
    [analytics]
  );

  const trackAction = useCallback(
    (action: string, metadata?: ActionMetadata) => {
      // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
      setTimeout(() => {
        analytics(
          'action_tracked',
          {
            action,
            userStory: metadata?.userStory || '__USER_STORY__',
            hypothesis: metadata?.hypothesis || '__HYPOTHESIS__',
            ...metadata,
          },
          'low'
        );
      }, 0);
    },
    [analytics]
  );

  // ====================
  // Utility Functions
  // ====================

  const addNotification = useCallback(
    (notification: Omit<NotificationData, 'id' | 'timestamp'>) => {
      const newNotification: NotificationData = {
        ...notification,
        id: `notification-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep max 5 notifications
    },
    []
  );

  // ====================
  // Context Value
  // ====================

  const bridgeValue = useMemo(
    () => ({
      // Data operations
      fetch__ENTITY_TYPE__s,
      refresh__ENTITY_TYPE__s,
      get__ENTITY_TYPE__,
      create__ENTITY_TYPE__,
      update__ENTITY_TYPE__,
      delete__ENTITY_TYPE__,

      // State management
      setFilters,
      setSelectedEntity,
      clearError,

      // Analytics and tracking
      trackPageView,
      trackAction,

      // State access
      state,
      uiState,
    }),
    [
      fetch__ENTITY_TYPE__s,
      refresh__ENTITY_TYPE__s,
      get__ENTITY_TYPE__,
      create__ENTITY_TYPE__,
      update__ENTITY_TYPE__,
      delete__ENTITY_TYPE__,
      setFilters,
      setSelectedEntity,
      clearError,
      trackPageView,
      trackAction,
      state,
      uiState,
    ]
  );

  // ====================
  // Render
  // ====================

  return (
    <div
      role="region"
      aria-label="__BRIDGE_NAME__ Management Bridge"
      className="w-full min-h-0 sm:min-h-screen md:min-h-0 lg:min-h-screen"
      data-testid="__BRIDGE_NAME__-management-bridge"
    >
      <__BRIDGE_NAME__BridgeContext.Provider value={bridgeValue}>
        {children}
      </__BRIDGE_NAME__BridgeContext.Provider>
    </div>
  );
}

// ====================
// Hook for accessing bridge
// ====================

export function use__BRIDGE_NAME__Bridge() {
  const context = React.useContext(__BRIDGE_NAME__BridgeContext);
  if (!context) {
    throw new Error('use__BRIDGE_NAME__Bridge must be used within __BRIDGE_NAME__ManagementBridge');
  }
  return context;
}

export { __BRIDGE_NAME__BridgeContext };

// Add displayName for debugging and React DevTools
__BRIDGE_NAME__ManagementBridge.displayName = '__BRIDGE_NAME__ManagementBridge';
