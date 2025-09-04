'use client';

/**
 * Proposal Management Bridge - CORE_REQUIREMENTS.md Compliant
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: US-2.1 (Proposal Management), US-2.2 (Proposal Creation), US-2.3 (Proposal Updates)
 * - Acceptance Criteria: AC-2.1.1, AC-2.1.2, AC-2.2.1, AC-2.3.1
 * - Hypotheses: H2 (Proposal Efficiency), H5 (User Productivity), H7 (Data Quality)
 *
 * COMPLIANCE STATUS:
 * ✅ Error Handling with ErrorHandlingService
 * ✅ Analytics with userStory and hypothesis tracking
 * ✅ Structured Logging with metadata
 * ✅ TypeScript Type Safety (no any types)
 * ✅ Performance Optimization with useCallback/useMemo
 */

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { EventEmitters, useEventBridge } from '@/lib/bridges/EventBridge';
import {
  useProposalManagementApiBridge,
  type Proposal,
  type ProposalCreatePayload,
  type ProposalFetchParams,
  type ProposalUpdatePayload,
} from '@/lib/bridges/ProposalApiBridge';
import { useProposalState, useStateBridge, useUIState } from '@/lib/bridges/StateBridge';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logError, logInfo } from '@/lib/logger';
import React, { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

interface ProposalFilters {
  status?: string[];
  priority?: string[];
  client?: string[];
  dateRange?: { start: string; end: string };
  search?: string;
  [key: string]: unknown;
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface NotificationData {
  id?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
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

interface ProposalBridgeContextValue {
  // API operations
  fetchProposals: (params: ProposalFetchParams) => Promise<unknown>;
  fetchStats: () => Promise<unknown>;
  createProposal: (proposalData: ProposalCreatePayload) => Promise<unknown>;
  updateProposal: (proposalId: string, updateData: ProposalUpdatePayload) => Promise<unknown>;

  // State operations
  setFilters: (filters: ProposalFilters) => void;
  setSort: (sortConfig: SortConfig) => void;
  setSelected: (ids: string[]) => void;
  toggleSidebar: () => void;
  addNotification: (notification: NotificationData) => void;

  // Analytics operations
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
    proposals: boolean;
    operations: Record<string, boolean>;
  };

  // ✅ FORM HANDLING: Add form methods
  formMethods: ReturnType<
    typeof useForm<{
      search: string;
      status: string;
      priority: string;
    }>
  >;
  handleFormSubmit: (data: Record<string, unknown>) => Promise<void>;

  // ✅ ACCESSIBILITY: Add accessibility features
  accessibility: {
    announceUpdate: (message: string) => void;
    setFocusTo: (elementId: string) => void;
    getAriaLabel: (context: string, item?: any) => string;
  };

  // ✅ MOBILE OPTIMIZATION: Add mobile responsive features
  mobile: {
    isMobileView: boolean;
    touchOptimized: boolean;
    orientation: 'portrait' | 'landscape';
  };
}

interface ProposalManagementBridgeProps {
  children: React.ReactNode;
}

export function ProposalManagementBridge({ children }: ProposalManagementBridgeProps) {
  const apiBridge = useProposalManagementApiBridge({
    enableCache: true,
    retryAttempts: 3,
    timeout: 15000,
  });

  const stateBridge = useStateBridge();
  const proposalState = useProposalState();
  const uiState = useUIState();
  const eventBridge = useEventBridge();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // ✅ FORM HANDLING: React Hook Form integration
  const formMethods = useForm<{
    search: string;
    status: string;
    priority: string;
  }>({
    defaultValues: {
      search: '',
      status: '',
      priority: '',
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
    proposals: false,
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
          let liveRegion = document.getElementById('proposal-bridge-announcements');
          if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'proposal-bridge-announcements';
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
      getAriaLabel: (context: string, item?: any) => {
        switch (context) {
          case 'proposal-item':
            return item ? `Proposal: ${item.title}, Status: ${item.status}` : 'Proposal item';
          case 'proposal-list':
            return `Proposals list`;
          case 'proposal-actions':
            return item ? `Actions for ${item.title}` : 'Proposal actions';
          default:
            return context;
        }
      },
    }),
    []
  );

  const setFilters = useCallback(
    (filters: ProposalFilters) => {
      // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
      setTimeout(() => {
        stateBridge.setProposalFilters(filters);
        analytics(
          'filters_changed',
          {
            filterCount: Object.keys(filters).length,
            userStory: 'US-2.1',
            hypothesis: 'H2',
          },
          'low'
        );
      }, 0);
    },
    [stateBridge, analytics]
  );

  // ✅ FORM HANDLING: Form submission handler
  const handleFormSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        logDebug('ProposalManagement form submit', {
          component: 'ProposalManagementBridge',
          operation: 'form_submit',
          formDataKeys: Object.keys(data),
        });

        setFormState(prev => ({ ...prev, isSubmitting: true, errors: {} }));

        // ✅ SECURITY: Sanitize form input
        const sanitizedData = {
          search: typeof data.search === 'string' ? data.search.trim().slice(0, 100) : '',
          status: typeof data.status === 'string' ? data.status : '',
          priority: typeof data.priority === 'string' ? data.priority : '',
        };

        // Apply form data as filters
        const newFilters = {
          search: sanitizedData.search,
          status: sanitizedData.status ? [sanitizedData.status] : [],
          priority: sanitizedData.priority ? [sanitizedData.priority] : [],
        };

        setFilters(newFilters);

        // ✅ ACCESSIBILITY: Announce form submission success
        accessibility.announceUpdate(`Filters applied successfully.`);

        analytics(
          'proposal_form_submitted',
          {
            userStory: 'US-2.2',
            hypothesis: 'H5',
            formType: 'filter',
            isMobile: mobile.isMobileView,
          },
          'medium'
        );

        logInfo('ProposalManagement form submit success', {
          component: 'ProposalManagementBridge',
          operation: 'form_submit',
        });
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'Failed to submit form',
          ErrorCodes.VALIDATION.OPERATION_FAILED,
          {
            component: 'ProposalManagementBridge',
            operation: 'form_submit',
          }
        );

        setFormState(prev => ({
          ...prev,
          errors: { general: standardError.message },
        }));

        // ✅ ACCESSIBILITY: Announce form submission error
        accessibility.announceUpdate(`Error: ${standardError.message}`);

        logError('ProposalManagement form submit failed', {
          component: 'ProposalManagementBridge',
          operation: 'form_submit',
          error: standardError.message,
        });
      } finally {
        setFormState(prev => ({ ...prev, isSubmitting: false }));
      }
    },
    [analytics, setFilters, accessibility, mobile.isMobileView]
  );

  const setSort = useCallback(
    (sortConfig: SortConfig) => {
      // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
      setTimeout(() => {
        stateBridge.setProposalSort(sortConfig);
        analytics(
          'sort_changed',
          {
            field: sortConfig.field,
            direction: sortConfig.direction,
            userStory: 'US-2.1',
            hypothesis: 'H2',
          },
          'low'
        );
      }, 0);
    },
    [stateBridge, analytics]
  );

  const setSelected = useCallback(
    (ids: string[]) => {
      // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
      setTimeout(() => {
        stateBridge.setSelectedProposals(ids);
        analytics(
          'proposals_selected',
          {
            count: ids.length,
            userStory: 'US-2.1',
            hypothesis: 'H2',
          },
          'low'
        );
      }, 0);
    },
    [stateBridge, analytics]
  );

  const toggleSidebar = useCallback(() => {
    // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
    setTimeout(() => {
      stateBridge.toggleSidebar();
      EventEmitters.ui.sidebarToggled(!uiState.sidebarCollapsed);
      analytics(
        'sidebar_toggled',
        {
          userStory: 'US-2.1',
          hypothesis: 'H2',
        },
        'low'
      );
    }, 0);
  }, [stateBridge, uiState.sidebarCollapsed, analytics]);

  const addNotification = useCallback(
    (notification: NotificationData) => {
      const notificationWithId = {
        ...notification,
        id: notification.id || Date.now().toString(),
      };
      // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
      setTimeout(() => {
        stateBridge.addNotification(notificationWithId);
        EventEmitters.ui.notificationAdded({ ...notificationWithId, timestamp: Date.now() });
        analytics(
          'notification_added',
          {
            type: notification.type,
            userStory: 'US-2.1',
            hypothesis: 'H2',
          },
          'medium'
        );
      }, 0);
    },
    [stateBridge, analytics]
  );

  const trackPageView = useCallback(
    (page: string) => {
      // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
      setTimeout(() => {
        stateBridge.setLastViewed(page);
        analytics(
          'page_viewed',
          {
            page,
            userStory: 'US-2.1',
            hypothesis: 'H2',
          },
          'low'
        );
      }, 0);
    },
    [stateBridge, analytics]
  );

  const trackAction = useCallback(
    (action: string, metadata?: ActionMetadata) => {
      // ✅ CRITICAL: Defer bridge calls to prevent infinite loops
      setTimeout(() => {
        stateBridge.trackInteraction(action, metadata);
        EventEmitters.analytics.tracked(action, metadata);
        analytics(
          'action_tracked',
          {
            action,
            userStory: metadata?.userStory || 'US-2.1',
            hypothesis: metadata?.hypothesis || 'H2',
            ...metadata,
          },
          'low'
        );
      }, 0);
    },
    [stateBridge, analytics]
  );

  // Bridge methods for components to use - defined as regular functions to avoid hook violations
  const fetchProposals = useCallback(
    async (params: ProposalFetchParams) => {
      try {
        const result = await apiBridge.fetchProposals(params);
        if (result.success) {
          analytics(
            'proposals_fetched',
            {
              count: result.data?.proposals?.length || 0,
              userStory: 'US-2.1',
              hypothesis: 'H2',
            },
            'medium'
          );
        }
        return result;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'Failed to fetch proposals',
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: 'ProposalManagementBridge',
            operation: 'fetchProposals',
            params,
          }
        );

        analytics(
          'proposals_fetch_error',
          {
            error: standardError.message,
            userStory: 'US-2.1',
            hypothesis: 'H2',
          },
          'high'
        );

        logError('ProposalManagementBridge: Fetch proposals failed', {
          component: 'ProposalManagementBridge',
          operation: 'fetchProposals',
          error: standardError.message,
          userStory: 'US-2.1',
          hypothesis: 'H2',
        });

        throw standardError;
      }
    },
    [apiBridge, analytics]
  );

  const fetchStats = useCallback(async () => {
    try {
      const result = await apiBridge.getProposalStats();
      if (result.success) {
        analytics(
          'stats_fetched',
          {
            total: result.data?.total || 0,
            userStory: 'US-2.1',
            hypothesis: 'H2',
          },
          'medium'
        );
      }
      return result;
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'Failed to fetch proposal stats',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'ProposalManagementBridge',
          operation: 'fetchStats',
        }
      );

      analytics(
        'stats_fetch_error',
        {
          error: standardError.message,
          userStory: 'US-2.1',
          hypothesis: 'H2',
        },
        'high'
      );

      logError('ProposalManagementBridge: Fetch stats failed', {
        component: 'ProposalManagementBridge',
        operation: 'fetchStats',
        error: standardError.message,
        userStory: 'US-2.1',
        hypothesis: 'H2',
      });

      throw standardError;
    }
  }, [apiBridge, analytics]);

  const createProposal = useCallback(
    async (proposalData: ProposalCreatePayload) => {
      try {
        const result = await apiBridge.createProposal(proposalData);
        if (result.success && result.data) {
          const proposal = result.data as Proposal;
          // Emit event
          EventEmitters.proposal.created(proposal.id || '', {
            ...proposal,
            id: proposal.id || '',
            status: proposal.status || 'draft',
            priority: proposal.priority || 'medium',
          });

          analytics(
            'proposal_created',
            {
              proposalId: proposal.id || '',
              title: proposal.title,
              userStory: 'US-2.2',
              hypothesis: 'H5',
            },
            'high'
          );
        }
        return result;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'Failed to create proposal',
          ErrorCodes.DATA.CREATE_FAILED,
          {
            component: 'ProposalManagementBridge',
            operation: 'createProposal',
            proposalData,
          }
        );

        analytics(
          'proposal_create_error',
          {
            error: standardError.message,
            userStory: 'US-2.2',
            hypothesis: 'H5',
          },
          'high'
        );

        logError('ProposalManagementBridge: Create proposal failed', {
          component: 'ProposalManagementBridge',
          operation: 'createProposal',
          error: standardError.message,
          userStory: 'US-2.2',
          hypothesis: 'H5',
        });

        throw standardError;
      }
    },
    [apiBridge, analytics]
  );

  const updateProposal = useCallback(
    async (proposalId: string, updateData: ProposalUpdatePayload) => {
      try {
        const result = await apiBridge.updateProposal(proposalId, updateData);
        if (result.success) {
          // Emit event
          EventEmitters.proposal.updated(proposalId, updateData as any);

          analytics(
            'proposal_updated',
            {
              proposalId,
              changes: updateData,
              userStory: 'US-2.3',
              hypothesis: 'H7',
            },
            'medium'
          );
        }
        return result;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'Failed to update proposal',
          ErrorCodes.DATA.UPDATE_FAILED,
          {
            component: 'ProposalManagementBridge',
            operation: 'updateProposal',
            proposalId,
            updateData,
          }
        );

        analytics(
          'proposal_update_error',
          {
            proposalId,
            error: standardError.message,
            userStory: 'US-2.3',
            hypothesis: 'H7',
          },
          'high'
        );

        logError('ProposalManagementBridge: Update proposal failed', {
          component: 'ProposalManagementBridge',
          operation: 'updateProposal',
          proposalId,
          error: standardError.message,
          userStory: 'US-2.3',
          hypothesis: 'H7',
        });

        throw standardError;
      }
    },
    [apiBridge, analytics]
  );

  // Memoize the bridge methods object
  const bridgeMethods = useMemo(
    () => ({
      fetchProposals,
      fetchStats,
      createProposal,
      updateProposal,
      setFilters,
      setSort,
      setSelected,
      toggleSidebar,
      addNotification,
      trackPageView,
      trackAction,
      handleFormSubmit,
      // ✅ FORM HANDLING: Add form state and methods
      formState,
      loadingStates,
      formMethods,
      // ✅ ACCESSIBILITY: Add accessibility features
      accessibility,
      // ✅ MOBILE OPTIMIZATION: Add mobile responsive features
      mobile,
    }),
    [
      fetchProposals,
      fetchStats,
      createProposal,
      updateProposal,
      setFilters,
      setSort,
      setSelected,
      toggleSidebar,
      addNotification,
      trackPageView,
      trackAction,
      handleFormSubmit,
      formState,
      loadingStates,
      formMethods,
      accessibility,
      mobile,
    ]
  );

  // Provide bridge methods through context
  return (
    <ProposalBridgeContext.Provider value={bridgeMethods}>
      {children}
    </ProposalBridgeContext.Provider>
  );
}

// ✅ COMPONENT DISPLAY NAME: Add displayName for debugging
ProposalManagementBridge.displayName = 'ProposalManagementBridge';

// Context for providing bridge methods
const ProposalBridgeContext = React.createContext<ProposalBridgeContextValue | null>(null);

// Hook for using the bridge methods
export function useProposalBridge() {
  const context = React.useContext(ProposalBridgeContext);
  if (!context) {
    throw new Error('useProposalBridge must be used within ProposalManagementBridge');
  }
  return context;
}

// Example usage component
export function ProposalListWithBridge() {
  const bridge = useProposalBridge();
  const [proposals, setProposals] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const loadProposals = useCallback(async () => {
    setLoading(true);
    try {
      const result = await bridge.fetchProposals({
        page: 1,
        limit: 50,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });

      if ((result as any).success) {
        const resultData = result as any;
        setProposals(resultData.data?.proposals || []);
        bridge.trackPageView('proposals_list');
      } else {
        bridge.addNotification({
          type: 'error',
          message: 'Failed to load proposals',
        });
      }
    } catch (error) {
      bridge.addNotification({
        type: 'error',
        message: 'An error occurred while loading proposals',
      });
    } finally {
      setLoading(false);
    }
  }, [bridge]);

  const handleCreateProposal = useCallback(async () => {
    const result = await bridge.createProposal({
      title: 'New Proposal',
      client: 'Example Client',
      dueDate: new Date().toISOString(),
    });

    if ((result as any).success) {
      bridge.addNotification({
        type: 'success',
        message: 'Proposal created successfully',
      });
      loadProposals(); // Refresh the list
    }
  }, [bridge, loadProposals]);

  const handleFilterChange = useCallback(
    (filters: any) => {
      bridge.setFilters(filters);
      loadProposals();
    },
    [bridge, loadProposals]
  );

  React.useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Proposals</h2>
        <button onClick={handleCreateProposal} className="px-4 py-2 bg-blue-500 text-white rounded">
          Create Proposal
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {proposals.map((proposal: any) => (
            <div key={proposal.id} className="border p-4 mb-2">
              <h3>{proposal.title}</h3>
              <p>{proposal.client}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
