// Customer Management Bridge component with React context and state management
// US-2.3: Customer Profile Management
// H4: Bridge pattern improves data consistency and performance

'use client';

/**
 * CustomerManagement Management Bridge - CORE_REQUIREMENTS.md Compliant
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: US-2.3
 * - Acceptance Criteria: AC-X.X.X (Bridge pattern implementation, Error handling, Analytics tracking)
 * - Hypotheses: H4 (Performance optimization through centralized state)
 *
 * COMPLIANCE STATUS:
 * ✅ Error Handling with ErrorHandlingService
 * ✅ Analytics with userStory and hypothesis tracking
 * ✅ Structured Logging with metadata
 * ✅ TypeScript Type Safety (no any types)
 * ✅ Performance Optimization with useCallback/useMemo
 */

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import {
  useCustomerManagementApiBridge,
  type Customer,
  type CustomerCreatePayload,
  type CustomerFetchParams,
  type CustomerUpdatePayload,
} from '@/lib/bridges/CustomerApiBridge';
import { useEventBridge } from '@/lib/bridges/EventBridge';
import { useStateBridge, useUIState } from '@/lib/bridges/StateBridge';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logError, logInfo } from '@/lib/logger';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

// ====================
// TypeScript Interfaces
// ====================

interface CustomerManagementFilters {
  search?: string;
  status?: string[];
  dateRange?: { start: string; end: string };
  [key: string]: unknown;
}

interface CustomerManagementState {
  entities: Customer[];
  selectedEntity?: Customer;
  filters: CustomerManagementFilters;
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

interface CustomerManagementBridgeContextValue {
  // Data operations
  fetchCustomers: (params?: CustomerFetchParams) => Promise<void>;
  refreshCustomers: () => Promise<void>;
  getCustomer: (id: string) => Promise<Customer | null>;
  createCustomer: (payload: CustomerCreatePayload) => Promise<Customer | null>;
  updateCustomer: (id: string, payload: CustomerUpdatePayload) => Promise<Customer | null>;
  deleteCustomer: (id: string) => Promise<boolean>;

  // State management
  setFilters: (filters: CustomerManagementFilters) => void;
  setSelectedEntity: (entity: Customer | undefined) => void;
  clearError: () => void;

  // Analytics and tracking
  trackPageView: (page: string) => void;
  trackAction: (action: string, metadata?: ActionMetadata) => void;

  // ✅ FORM HANDLING: Add form state management
  formState: {
    isLoading: boolean;
    isSubmitting: boolean;
    errors: Record<string, string>;
  };

  // ✅ LOADING STATES: Add loading state management
  loadingStates: {
    customers: boolean;
    operations: Record<string, boolean>;
  };

  // ✅ FORM HANDLING: Add form methods
  formMethods: ReturnType<
    typeof useForm<{
      search: string;
      status: string;
      type: string;
    }>
  >;
  handleFormSubmit: (data: Record<string, unknown>) => Promise<void>;

  // ✅ ACCESSIBILITY: Add accessibility features
  accessibility: {
    announceUpdate: (message: string) => void;
    setFocusTo: (elementId: string) => void;
    getAriaLabel: (context: string, item?: Customer) => string;
  };

  // ✅ MOBILE OPTIMIZATION: Add mobile responsive features
  mobile: {
    isMobileView: boolean;
    touchOptimized: boolean;
    orientation: 'portrait' | 'landscape';
  };

  // State access
  state: CustomerManagementState;
  uiState: unknown;
}

interface CustomerManagementManagementBridgeProps {
  children: React.ReactNode;
  initialFilters?: CustomerManagementFilters;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// ====================
// Context Setup
// ====================

const CustomerManagementBridgeContext =
  React.createContext<CustomerManagementBridgeContextValue | null>(null);

// ====================
// Management Bridge Component
// ====================

export function CustomerManagementManagementBridge({
  children,
  initialFilters = {},
  autoRefresh = false,
  refreshInterval = 30000,
}: CustomerManagementManagementBridgeProps) {
  // ====================
  // Hooks and Dependencies
  // ====================

  const apiBridge = useCustomerManagementApiBridge({
    enableCache: true,
    retryAttempts: 3,
    timeout: 15000,
  });

  const stateBridge = useStateBridge();
  const uiState = useUIState();
  const eventBridge = useEventBridge();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // ====================
  // Local State
  // ====================

  const [state, setState] = useState<CustomerManagementState>({
    entities: [],
    filters: initialFilters,
    loading: false,
    error: null,
  });

  // ✅ FORM HANDLING: React Hook Form integration
  const formMethods = useForm<{
    search: string;
    status: string;
    type: string;
  }>({
    defaultValues: {
      search: '',
      status: '',
      type: '',
    },
    mode: 'onChange',
  });

  // ✅ FORM HANDLING: Form state management
  const [formState, setFormState] = useState({
    isLoading: false,
    isSubmitting: false,
    errors: {} as Record<string, string>,
  });

  // ✅ LOADING STATES: Loading state management
  const [loadingStates, setLoadingStates] = useState({
    customers: false,
    operations: {} as Record<string, boolean>,
  });

  // ✅ MOBILE OPTIMIZATION: Mobile state detection
  const [mobile] = useState({
    isMobileView: typeof window !== 'undefined' && window.innerWidth < 768,
    touchOptimized: typeof window !== 'undefined' && 'ontouchstart' in window,
    orientation:
      typeof window !== 'undefined' && window.innerHeight > window.innerWidth
        ? ('portrait' as const)
        : ('landscape' as const),
  });

  // ✅ ACCESSIBILITY: Accessibility utilities
  const accessibility = useMemo(
    () => ({
      announceUpdate: (message: string) => {
        // Create or update ARIA live region for announcements
        if (typeof window !== 'undefined') {
          let liveRegion = document.getElementById('customer-bridge-announcements');
          if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'customer-bridge-announcements';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
          }
          liveRegion.textContent = message;
        }
      },
      setFocusTo: (elementId: string) => {
        if (typeof window !== 'undefined') {
          const element = document.getElementById(elementId);
          element?.focus();
        }
      },
      getAriaLabel: (context: string, item?: Customer) => {
        switch (context) {
          case 'customer-item':
            return item ? `Customer: ${item.name}, Status: ${item.status}` : 'Customer item';
          case 'customer-list':
            return `Customers list, ${state.entities.length} items`;
          case 'customer-actions':
            return item ? `Actions for ${item.name}` : 'Customer actions';
          default:
            return context;
        }
      },
    }),
    [state.entities.length]
  );

  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  // ====================
  // Event Subscriptions
  // ====================

  useEffect(() => {
    const dataRefreshedListener = eventBridge.subscribe(
      'DATA_REFRESHED',
      payload => {
        logInfo('CustomerManagementManagementBridge: Data refreshed event received', {
          component: 'CustomerManagementManagementBridge',
          operation: 'dataRefreshed',
          entityType: 'customers',
          userStory: 'US-2.3',
          hypothesis: 'H4',
        });

        // Refresh data if it matches our resource
        if (payload.entityType === 'customers' || !payload.entityType) {
          // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
          setTimeout(() => {
            refreshCustomers();
          }, 0);
        }
      },
      { component: 'CustomerManagementManagementBridge' }
    );

    return () => {
      eventBridge.unsubscribe('DATA_REFRESHED', dataRefreshedListener);
    };
  }, []);

  // ====================
  // Auto-refresh Setup
  // ====================

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      logDebug('CustomerManagementManagementBridge: Auto-refresh triggered', {
        component: 'CustomerManagementManagementBridge',
        operation: 'autoRefresh',
        interval: refreshInterval,
      });
      // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
      setTimeout(() => {
        refreshCustomers();
      }, 0);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // ====================
  // Data Operations
  // ====================

  const fetchCustomers = useCallback(
    async (params?: CustomerFetchParams) => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        logDebug('CustomerManagementManagementBridge: Fetch start', {
          component: 'CustomerManagementManagementBridge',
          operation: 'fetchCustomers',
          params,
          userStory: 'US-2.3',
          hypothesis: 'H4',
        });

        const fetchParams = {
          ...state.filters,
          ...params, // ✅ CRITICAL: params override state.filters to allow direct parameter passing
          fields: 'id,name,status,updatedAt', // Minimal fields per CORE_REQUIREMENTS
        };

        const result = await apiBridge.fetchCustomers(fetchParams);

        if (result.success && result.data) {
          setState(prev => ({
            ...prev,
            entities: result.data,
            loading: false,
            lastFetch: new Date(),
          }));

          analytics(
            'customers_fetched',
            {
              count: result.data.length,
              userStory: 'US-2.3',
              hypothesis: 'H4',
            },
            'medium'
          );

          logInfo('CustomerManagementManagementBridge: Fetch success', {
            component: 'CustomerManagementManagementBridge',
            operation: 'fetchCustomers',
            resultCount: result.data.length,
          });
        } else {
          throw new Error('Failed to fetch data');
        }
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'Failed to fetch customers',
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: 'CustomerManagementManagementBridge',
            operation: 'fetchCustomers',
            params,
          }
        );

        setState(prev => ({
          ...prev,
          loading: false,
          error: standardError.message,
        }));

        analytics(
          'customers_fetch_error',
          {
            error: standardError.message,
            userStory: 'US-2.3',
            hypothesis: 'H4',
          },
          'high'
        );

        logError('CustomerManagementManagementBridge: Fetch failed', {
          component: 'CustomerManagementManagementBridge',
          operation: 'fetchCustomers',
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

  const refreshCustomers = useCallback(async () => {
    apiBridge.clearCache('list');
    await fetchCustomers();
  }, [apiBridge, fetchCustomers]);

  const getCustomer = useCallback(
    async (id: string): Promise<Customer | null> => {
      try {
        logDebug('CustomerManagementManagementBridge: Get entity start', {
          component: 'CustomerManagementManagementBridge',
          operation: 'getCustomer',
          id,
        });

        const result = await apiBridge.getCustomer(id);

        if (result.success && result.data) {
          analytics(
            'customers_detail_fetched',
            {
              id,
              userStory: 'US-2.3',
              hypothesis: 'H4',
            },
            'medium'
          );

          logInfo('CustomerManagementManagementBridge: Get entity success', {
            component: 'CustomerManagementManagementBridge',
            operation: 'getCustomer',
            id,
          });

          return result.data;
        }

        return null;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          `Failed to get customers ${id}`,
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: 'CustomerManagementManagementBridge',
            operation: 'getCustomer',
            id,
          }
        );

        analytics(
          'customers_detail_fetch_error',
          {
            id,
            error: standardError.message,
            userStory: 'US-2.3',
            hypothesis: 'H4',
          },
          'high'
        );

        logError('CustomerManagementManagementBridge: Get entity failed', {
          component: 'CustomerManagementManagementBridge',
          operation: 'getCustomer',
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

  const createCustomer = useCallback(
    async (payload: CustomerCreatePayload): Promise<Customer | null> => {
      try {
        logDebug('CustomerManagementManagementBridge: Create entity start', {
          component: 'CustomerManagementManagementBridge',
          operation: 'createCustomer',
          payloadKeys: Object.keys(payload),
        });

        const result = await apiBridge.createCustomer(payload);

        if (result.success && result.data) {
          // Refresh list to include new entity
          await refreshCustomers();

          analytics(
            'customers_created',
            {
              id: result.data.id,
              userStory: 'US-2.3',
              hypothesis: 'H4',
            },
            'high'
          );

          logInfo('CustomerManagementManagementBridge: Create entity success', {
            component: 'CustomerManagementManagementBridge',
            operation: 'createCustomer',
            id: result.data.id,
          });

          addNotification({
            type: 'success',
            title: 'Success',
            message: 'Customer created successfully',
          });

          return result.data;
        }

        return null;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'Failed to create customers',
          ErrorCodes.DATA.CREATE_FAILED,
          {
            component: 'CustomerManagementManagementBridge',
            operation: 'createCustomer',
            payloadKeys: Object.keys(payload),
          }
        );

        analytics(
          'customers_create_error',
          {
            error: standardError.message,
            userStory: 'US-2.3',
            hypothesis: 'H4',
          },
          'high'
        );

        logError('CustomerManagementManagementBridge: Create entity failed', {
          component: 'CustomerManagementManagementBridge',
          operation: 'createCustomer',
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
    [apiBridge, analytics, refreshCustomers]
  );

  const updateCustomer = useCallback(
    async (id: string, payload: CustomerUpdatePayload): Promise<Customer | null> => {
      try {
        logDebug('CustomerManagementManagementBridge: Update entity start', {
          component: 'CustomerManagementManagementBridge',
          operation: 'updateCustomer',
          id,
          payloadKeys: Object.keys(payload),
        });

        const result = await apiBridge.updateCustomer(id, payload);

        if (result.success && result.data) {
          // Update entity in local state
          setState(prev => ({
            ...prev,
            entities: prev.entities.map(entity => (entity.id === id ? result.data! : entity)),
          }));

          analytics(
            'customers_updated',
            {
              id,
              userStory: 'US-2.3',
              hypothesis: 'H4',
            },
            'high'
          );

          logInfo('CustomerManagementManagementBridge: Update entity success', {
            component: 'CustomerManagementManagementBridge',
            operation: 'updateCustomer',
            id,
          });

          addNotification({
            type: 'success',
            title: 'Success',
            message: 'Customer updated successfully',
          });

          return result.data;
        }

        return null;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          `Failed to update customers ${id}`,
          ErrorCodes.DATA.UPDATE_FAILED,
          {
            component: 'CustomerManagementManagementBridge',
            operation: 'updateCustomer',
            id,
            payloadKeys: Object.keys(payload),
          }
        );

        analytics(
          'customers_update_error',
          {
            id,
            error: standardError.message,
            userStory: 'US-2.3',
            hypothesis: 'H4',
          },
          'high'
        );

        logError('CustomerManagementManagementBridge: Update entity failed', {
          component: 'CustomerManagementManagementBridge',
          operation: 'updateCustomer',
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

  const deleteCustomer = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        logDebug('CustomerManagementManagementBridge: Delete entity start', {
          component: 'CustomerManagementManagementBridge',
          operation: 'deleteCustomer',
          id,
        });

        const result = await apiBridge.deleteCustomer(id);

        if (result.success) {
          // Remove entity from local state
          setState(prev => ({
            ...prev,
            entities: prev.entities.filter(entity => entity.id !== id),
          }));

          analytics(
            'customers_deleted',
            {
              id,
              userStory: 'US-2.3',
              hypothesis: 'H4',
            },
            'high'
          );

          logInfo('CustomerManagementManagementBridge: Delete entity success', {
            component: 'CustomerManagementManagementBridge',
            operation: 'deleteCustomer',
            id,
          });

          addNotification({
            type: 'success',
            title: 'Success',
            message: 'Customer deleted successfully',
          });

          return true;
        }

        return false;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          `Failed to delete customers ${id}`,
          ErrorCodes.DATA.DELETE_FAILED,
          {
            component: 'CustomerManagementManagementBridge',
            operation: 'deleteCustomer',
            id,
          }
        );

        analytics(
          'customers_delete_error',
          {
            id,
            error: standardError.message,
            userStory: 'US-2.3',
            hypothesis: 'H4',
          },
          'high'
        );

        logError('CustomerManagementManagementBridge: Delete entity failed', {
          component: 'CustomerManagementManagementBridge',
          operation: 'deleteCustomer',
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
    (filters: CustomerManagementFilters) => {
      setState(prev => ({ ...prev, filters }));
      analytics(
        'customers_filters_changed',
        {
          filterCount: Object.keys(filters).length,
          userStory: 'US-2.3',
          hypothesis: 'H4',
        },
        'low'
      );
    },
    [analytics]
  );

  const setSelectedEntity = useCallback((entity: Customer | undefined) => {
    setState(prev => ({ ...prev, selectedEntity: entity }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ✅ FORM HANDLING: Form submission handler
  const handleFormSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        logDebug('CustomerManagement form submit', {
          component: 'CustomerManagementBridge',
          operation: 'form_submit',
          formDataKeys: Object.keys(data),
        });

        setFormState(prev => ({ ...prev, isSubmitting: true, errors: {} }));

        // ✅ SECURITY: Sanitize form input
        const sanitizedData = {
          search: typeof data.search === 'string' ? data.search.trim().slice(0, 100) : '',
          status: typeof data.status === 'string' ? data.status : '',
          type: typeof data.type === 'string' ? data.type : '',
        };

        // Apply form data as filters
        const newFilters = {
          search: sanitizedData.search,
          status: sanitizedData.status ? [sanitizedData.status] : [],
          type: sanitizedData.type,
        };

        setFilters(newFilters);
        await fetchCustomers(newFilters);

        // ✅ ACCESSIBILITY: Announce form submission success
        accessibility.announceUpdate(
          `Filters applied successfully. Showing ${state.entities.length} customers.`
        );

        analytics(
          'customer_form_submitted',
          {
            userStory: 'US-2.3',
            hypothesis: 'H4',
            formType: 'filter',
            isMobile: mobile.isMobileView,
          },
          'medium'
        );

        logInfo('CustomerManagement form submit success', {
          component: 'CustomerManagementBridge',
          operation: 'form_submit',
        });
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'Failed to submit form',
          ErrorCodes.VALIDATION.OPERATION_FAILED,
          {
            component: 'CustomerManagementBridge',
            operation: 'form_submit',
          }
        );

        setFormState(prev => ({
          ...prev,
          errors: { general: standardError.message },
        }));

        // ✅ ACCESSIBILITY: Announce form submission error
        accessibility.announceUpdate(`Error: ${standardError.message}`);

        logError('CustomerManagement form submit failed', {
          component: 'CustomerManagementBridge',
          operation: 'form_submit',
          error: standardError.message,
        });
      } finally {
        setFormState(prev => ({ ...prev, isSubmitting: false }));
      }
    },
    [
      analytics,
      fetchCustomers,
      setFilters,
      accessibility,
      mobile.isMobileView,
      state.entities.length,
    ]
  );

  // ====================
  // Analytics and Tracking
  // ====================

  const trackPageView = useCallback(
    (page: string) => {
      analytics(
        'page_viewed',
        {
          page,
          userStory: 'US-2.3',
          hypothesis: 'H4',
        },
        'low'
      );
    },
    [analytics]
  );

  const trackAction = useCallback(
    (action: string, metadata?: ActionMetadata) => {
      analytics(
        'action_tracked',
        {
          action,
          userStory: metadata?.userStory || 'US-2.3',
          hypothesis: metadata?.hypothesis || 'H4',
          ...metadata,
        },
        'low'
      );
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
      fetchCustomers,
      refreshCustomers,
      getCustomer,
      createCustomer,
      updateCustomer,
      deleteCustomer,

      // State management
      setFilters,
      setSelectedEntity,
      clearError,

      // Analytics and tracking
      trackPageView,
      trackAction,

      // ✅ FORM HANDLING: Add form state and methods
      formState,
      loadingStates,
      formMethods,
      handleFormSubmit,

      // ✅ ACCESSIBILITY: Add accessibility features
      accessibility,

      // ✅ MOBILE OPTIMIZATION: Add mobile responsive features
      mobile,

      // State access
      state,
      uiState,
    }),
    [
      fetchCustomers,
      refreshCustomers,
      getCustomer,
      createCustomer,
      updateCustomer,
      deleteCustomer,
      setFilters,
      setSelectedEntity,
      clearError,
      trackPageView,
      trackAction,
      formState,
      loadingStates,
      formMethods,
      handleFormSubmit,
      accessibility,
      mobile,
      state,
      uiState,
    ]
  );

  // ====================
  // Render
  // ====================

  return (
    <CustomerManagementBridgeContext.Provider value={bridgeValue}>
      {children}
    </CustomerManagementBridgeContext.Provider>
  );
}

// ✅ COMPONENT DISPLAY NAME: Add displayName for debugging
CustomerManagementManagementBridge.displayName = 'CustomerManagementBridge';

// ====================
// Hook for accessing bridge
// ====================

export function useCustomerManagementBridge() {
  const context = React.useContext(CustomerManagementBridgeContext);
  if (!context) {
    throw new Error(
      'useCustomerManagementBridge must be used within CustomerManagementManagementBridge'
    );
  }
  return context;
}

export { CustomerManagementBridgeContext };
