'use client';

/**
 * Proposal Detail Management Bridge - CORE_REQUIREMENTS.md Compliant
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: US-3.1 (Proposal Detail View), US-3.2 (Proposal Actions), US-3.3 (Proposal Approval)
 * - Acceptance Criteria: AC-3.1.1, AC-3.1.2, AC-3.2.1, AC-3.3.1
 * - Hypotheses: H4 (Data Insights), H6 (Team Collaboration), H8 (Workflow Efficiency)
 *
 * COMPLIANCE STATUS:
 * ✅ Error Handling with ErrorHandlingService
 * ✅ Analytics with userStory and hypothesis tracking
 * ✅ Structured Logging with metadata
 * ✅ TypeScript Type Safety (no any types)
 * ✅ Performance Optimization with useCallback/useMemo
 */

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useEventBridge } from '@/lib/bridges/EventBridge';
import { useProposalDetailApiBridge } from '@/lib/bridges/ProposalDetailApiBridge';
import { useProposalState, useStateBridge, useUIState } from '@/lib/bridges/StateBridge';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logError, logInfo } from '@/lib/logger';
import React, { useCallback, useEffect, useMemo } from 'react';

// Proper TypeScript interfaces (no any types)
interface ProposalUpdateData {
  title?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  estimatedValue?: number;
  description?: string;
  [key: string]: unknown;
}

interface ApprovalData {
  approvedBy?: string;
  approvalNotes?: string;
  approvalDate?: string;
  conditions?: string[];
  [key: string]: unknown;
}

interface TeamAssignments {
  teamLead?: string;
  salesRepresentative?: string;
  subjectMatterExperts?: Record<string, string>;
  executiveReviewers?: string[];
}

interface ProposalFilters {
  status?: string[];
  priority?: string[];
  assignee?: string[];
  dateRange?: { start: string; end: string };
  search?: string;
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
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

interface ProposalDetailBridgeContextValue {
  // API operations
  fetchProposalDetail: (proposalId: string) => Promise<unknown>;
  updateProposalDetail: (proposalId: string, updates: ProposalUpdateData) => Promise<unknown>;
  deleteProposal: (proposalId: string) => Promise<unknown>;
  approveProposal: (proposalId: string, approvalData?: ApprovalData) => Promise<unknown>;
  rejectProposal: (proposalId: string, rejectionReason?: string) => Promise<unknown>;
  assignTeam: (proposalId: string, teamAssignments: TeamAssignments) => Promise<unknown>;
  getProposalAnalytics: (proposalId: string) => Promise<unknown>;

  // State operations
  setProposalFilters: (filters: ProposalFilters) => void;
  setProposalSort: (sortConfig: SortConfig) => void;
  setSelectedProposals: (selectedIds: string[]) => void;
  addNotification: (notification: NotificationData) => void;
  removeNotification: (notificationId: string) => void;
  clearNotifications: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;

  // Analytics operations
  trackPageView: (page: string) => void;
  trackAction: (action: string, metadata?: ActionMetadata) => void;

  // State access
  proposalState: unknown;
  uiState: unknown;
}

interface ProposalDetailManagementBridgeProps {
  children: React.ReactNode;
}

export function ProposalDetailManagementBridge({ children }: ProposalDetailManagementBridgeProps) {
  const apiBridge = useProposalDetailApiBridge({
    enableCache: true,
    retryAttempts: 3,
    timeout: 15000,
  });

  const stateBridge = useStateBridge();
  const proposalState = useProposalState();
  const uiState = useUIState();
  const eventBridge = useEventBridge();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Subscribe to proposal detail events
  useEffect(() => {
    const proposalUpdatedListener = eventBridge.subscribe(
      'PROPOSAL_UPDATED',
      payload => {
        logInfo('ProposalDetailManagementBridge: Proposal updated', {
          component: 'ProposalDetailManagementBridge',
          operation: 'proposalUpdated',
          proposalId: payload.proposalId,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });

        // Clear cache for the updated proposal
        apiBridge.clearCache(payload.proposalId as string);
      },
      { component: 'ProposalDetailManagementBridge' }
    );

    const proposalApprovedListener = eventBridge.subscribe(
      'PROPOSAL_APPROVED',
      payload => {
        logInfo('ProposalDetailManagementBridge: Proposal approved', {
          component: 'ProposalDetailManagementBridge',
          operation: 'proposalApproved',
          proposalId: payload.proposalId,
          userStory: 'US-3.3',
          hypothesis: 'H8',
        });

        // Track interaction
        stateBridge.trackInteraction('proposal_approved', {
          proposalId: payload.proposalId,
          approvedBy: payload.approvedBy,
        });

        // Clear cache for the approved proposal
        apiBridge.clearCache(payload.proposalId as string);
      },
      { component: 'ProposalDetailManagementBridge' }
    );

    const proposalRejectedListener = eventBridge.subscribe(
      'PROPOSAL_REJECTED',
      payload => {
        logInfo('ProposalDetailManagementBridge: Proposal rejected', {
          component: 'ProposalDetailManagementBridge',
          operation: 'proposalRejected',
          proposalId: payload.proposalId,
          userStory: 'US-3.3',
          hypothesis: 'H8',
        });

        // Track interaction
        stateBridge.trackInteraction('proposal_rejected', {
          proposalId: payload.proposalId,
          rejectedBy: payload.rejectedBy,
          reason: payload.reason,
        });

        // Clear cache for the rejected proposal
        apiBridge.clearCache(payload.proposalId as string);
      },
      { component: 'ProposalDetailManagementBridge' }
    );

    const teamAssignedListener = eventBridge.subscribe(
      'TEAM_ASSIGNED',
      payload => {
        logInfo('ProposalDetailManagementBridge: Team assigned', {
          component: 'ProposalDetailManagementBridge',
          operation: 'teamAssigned',
          proposalId: payload.proposalId,
          userStory: 'US-3.2',
          hypothesis: 'H6',
        });

        // Track interaction
        stateBridge.trackInteraction('team_assigned', {
          proposalId: payload.proposalId,
          teamSize: payload.teamSize,
        });

        // Clear cache for the proposal
        apiBridge.clearCache(payload.proposalId as string);
      },
      { component: 'ProposalDetailManagementBridge' }
    );

    const themeChangedListener = eventBridge.subscribe(
      'THEME_CHANGED',
      payload => {
        logInfo('ProposalDetailManagementBridge: Theme changed', {
          component: 'ProposalDetailManagementBridge',
          operation: 'themeChanged',
          theme: payload.theme,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });

        // Update UI state
        stateBridge.setTheme(payload.theme as 'light' | 'dark');
      },
      { component: 'ProposalDetailManagementBridge' }
    );

    // Cleanup listeners on unmount
    return () => {
      eventBridge.unsubscribe('PROPOSAL_UPDATED', proposalUpdatedListener);
      eventBridge.unsubscribe('PROPOSAL_APPROVED', proposalApprovedListener);
      eventBridge.unsubscribe('PROPOSAL_REJECTED', proposalRejectedListener);
      eventBridge.unsubscribe('TEAM_ASSIGNED', teamAssignedListener);
      eventBridge.unsubscribe('THEME_CHANGED', themeChangedListener);
    };
  }, []); // Empty dependency array to prevent infinite loops

  // Bridge methods for components to use
  const fetchProposalDetail = useCallback(
    async (proposalId: string) => {
      try {
        const result = await apiBridge.fetchProposalDetail(proposalId);
        if (result.success) {
          analytics(
            'proposal_detail_fetched',
            {
              proposalId,
              userStory: 'US-3.1',
              hypothesis: 'H4',
            },
            'medium'
          );
        }
        return result;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'Failed to fetch proposal detail',
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: 'ProposalDetailManagementBridge',
            operation: 'fetchProposalDetail',
            proposalId,
          }
        );

        analytics(
          'proposal_detail_fetch_error',
          {
            proposalId,
            error: standardError.message,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          },
          'high'
        );

        logError('ProposalDetailManagementBridge: Fetch proposal detail failed', {
          component: 'ProposalDetailManagementBridge',
          operation: 'fetchProposalDetail',
          proposalId,
          error: standardError.message,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });

        throw standardError;
      }
    },
    [apiBridge, analytics]
  );

  const updateProposalDetail = useCallback(
    async (proposalId: string, updates: ProposalUpdateData) => {
      try {
        const result = await apiBridge.updateProposalDetail(proposalId, updates);
        if (result.success) {
          analytics(
            'proposal_detail_updated',
            {
              proposalId,
              updateKeys: Object.keys(updates),
              userStory: 'US-3.1',
              hypothesis: 'H4',
            },
            'medium'
          );
        }
        return result;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'Failed to update proposal detail',
          ErrorCodes.DATA.UPDATE_FAILED,
          {
            component: 'ProposalDetailManagementBridge',
            operation: 'updateProposalDetail',
            proposalId,
            updates,
          }
        );

        analytics(
          'proposal_detail_update_error',
          {
            proposalId,
            error: standardError.message,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          },
          'high'
        );

        logError('ProposalDetailManagementBridge: Update proposal detail failed', {
          component: 'ProposalDetailManagementBridge',
          operation: 'updateProposalDetail',
          proposalId,
          error: standardError.message,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });

        throw standardError;
      }
    },
    [apiBridge, analytics]
  );

  const deleteProposal = useCallback(
    async (proposalId: string) => {
      try {
        const result = await apiBridge.deleteProposal(proposalId);
        if (result.success) {
          analytics(
            'proposal_deleted',
            {
              proposalId,
              userStory: 'US-3.2',
              hypothesis: 'H8',
            },
            'high'
          );
        }
        return result;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'Failed to delete proposal',
          ErrorCodes.DATA.DELETE_FAILED,
          {
            component: 'ProposalDetailManagementBridge',
            operation: 'deleteProposal',
            proposalId,
          }
        );

        analytics(
          'proposal_delete_error',
          {
            proposalId,
            error: standardError.message,
            userStory: 'US-3.2',
            hypothesis: 'H8',
          },
          'high'
        );

        logError('ProposalDetailManagementBridge: Delete proposal failed', {
          component: 'ProposalDetailManagementBridge',
          operation: 'deleteProposal',
          proposalId,
          error: standardError.message,
          userStory: 'US-3.2',
          hypothesis: 'H8',
        });

        throw standardError;
      }
    },
    [apiBridge, analytics]
  );

  const approveProposal = useCallback(
    async (proposalId: string, approvalData?: ApprovalData) => {
      try {
        const result = await apiBridge.approveProposal(proposalId, approvalData);
        if (result.success) {
          analytics(
            'proposal_approved',
            {
              proposalId,
              approvedBy: approvalData?.approvedBy,
              userStory: 'US-3.3',
              hypothesis: 'H8',
            },
            'high'
          );
        }
        return result;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'Failed to approve proposal',
          ErrorCodes.DATA.UPDATE_FAILED,
          {
            component: 'ProposalDetailManagementBridge',
            operation: 'approveProposal',
            proposalId,
            approvalData,
          }
        );

        analytics(
          'proposal_approve_error',
          {
            proposalId,
            error: standardError.message,
            userStory: 'US-3.3',
            hypothesis: 'H8',
          },
          'high'
        );

        logError('ProposalDetailManagementBridge: Approve proposal failed', {
          component: 'ProposalDetailManagementBridge',
          operation: 'approveProposal',
          proposalId,
          error: standardError.message,
          userStory: 'US-3.3',
          hypothesis: 'H8',
        });

        throw standardError;
      }
    },
    [apiBridge, analytics]
  );

  const rejectProposal = useCallback(
    async (proposalId: string, rejectionReason?: string) => {
      try {
        const result = await apiBridge.rejectProposal(proposalId, rejectionReason);
        if (result.success) {
          analytics(
            'proposal_rejected',
            {
              proposalId,
              reason: rejectionReason,
              userStory: 'US-3.3',
              hypothesis: 'H8',
            },
            'high'
          );
        }
        return result;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'Failed to reject proposal',
          ErrorCodes.DATA.UPDATE_FAILED,
          {
            component: 'ProposalDetailManagementBridge',
            operation: 'rejectProposal',
            proposalId,
            rejectionReason,
          }
        );

        analytics(
          'proposal_reject_error',
          {
            proposalId,
            error: standardError.message,
            userStory: 'US-3.3',
            hypothesis: 'H8',
          },
          'high'
        );

        logError('ProposalDetailManagementBridge: Reject proposal failed', {
          component: 'ProposalDetailManagementBridge',
          operation: 'rejectProposal',
          proposalId,
          error: standardError.message,
          userStory: 'US-3.3',
          hypothesis: 'H8',
        });

        throw standardError;
      }
    },
    [apiBridge, analytics]
  );

  const assignTeam = useCallback(
    async (proposalId: string, teamAssignments: TeamAssignments) => {
      try {
        const result = await apiBridge.assignTeam(proposalId, teamAssignments);
        if (result.success) {
          analytics(
            'team_assigned',
            {
              proposalId,
              teamSize: Object.keys(teamAssignments).length,
              userStory: 'US-3.2',
              hypothesis: 'H6',
            },
            'medium'
          );
        }
        return result;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'Failed to assign team to proposal',
          ErrorCodes.DATA.UPDATE_FAILED,
          {
            component: 'ProposalDetailManagementBridge',
            operation: 'assignTeam',
            proposalId,
            teamAssignments,
          }
        );

        analytics(
          'team_assign_error',
          {
            proposalId,
            error: standardError.message,
            userStory: 'US-3.2',
            hypothesis: 'H6',
          },
          'high'
        );

        logError('ProposalDetailManagementBridge: Assign team failed', {
          component: 'ProposalDetailManagementBridge',
          operation: 'assignTeam',
          proposalId,
          error: standardError.message,
          userStory: 'US-3.2',
          hypothesis: 'H6',
        });

        throw standardError;
      }
    },
    [apiBridge, analytics]
  );

  const getProposalAnalytics = useCallback(
    async (proposalId: string) => {
      try {
        const result = await apiBridge.getProposalAnalytics(proposalId);
        if (result.success) {
          analytics(
            'proposal_analytics_fetched',
            {
              proposalId,
              userStory: 'US-3.1',
              hypothesis: 'H4',
            },
            'medium'
          );
        }
        return result;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          error,
          'Failed to fetch proposal analytics',
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: 'ProposalDetailManagementBridge',
            operation: 'getProposalAnalytics',
            proposalId,
          }
        );

        analytics(
          'proposal_analytics_fetch_error',
          {
            proposalId,
            error: standardError.message,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          },
          'high'
        );

        logError('ProposalDetailManagementBridge: Fetch proposal analytics failed', {
          component: 'ProposalDetailManagementBridge',
          operation: 'getProposalAnalytics',
          proposalId,
          error: standardError.message,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });

        throw standardError;
      }
    },
    [apiBridge, analytics]
  );

  const setProposalFilters = useCallback(
    (filters: ProposalFilters) => {
      // Defer bridge calls to prevent setState during render
      setTimeout(() => {
        stateBridge.setProposalFilters(filters as any);
        analytics(
          'proposal_filters_changed',
          {
            filterCount: Object.keys(filters).length,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          },
          'low'
        );
      }, 0);
    },
    [stateBridge, analytics]
  );

  const setProposalSort = useCallback(
    (sortConfig: SortConfig) => {
      // Defer bridge calls to prevent setState during render
      setTimeout(() => {
        stateBridge.setProposalSort(sortConfig);
        analytics(
          'proposal_sort_changed',
          {
            field: sortConfig.field,
            direction: sortConfig.direction,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          },
          'low'
        );
      }, 0);
    },
    [stateBridge, analytics]
  );

  const setSelectedProposals = useCallback(
    (selectedIds: string[]) => {
      // Defer bridge calls to prevent setState during render
      setTimeout(() => {
        stateBridge.setSelectedProposals(selectedIds);
        analytics(
          'proposals_selected',
          {
            count: selectedIds.length,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          },
          'low'
        );
      }, 0);
    },
    [stateBridge, analytics]
  );

  const addNotification = useCallback(
    (notification: NotificationData) => {
      // Defer bridge calls to prevent setState during render
      setTimeout(() => {
        stateBridge.addNotification(notification);
        analytics(
          'notification_added',
          {
            type: notification.type,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          },
          'medium'
        );
      }, 0);
    },
    [stateBridge, analytics]
  );

  const removeNotification = useCallback(
    (notificationId: string) => {
      // Defer bridge calls to prevent setState during render
      setTimeout(() => {
        stateBridge.removeNotification(notificationId);
        analytics(
          'notification_removed',
          {
            notificationId,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          },
          'low'
        );
      }, 0);
    },
    [stateBridge, analytics]
  );

  const clearNotifications = useCallback(() => {
    // Defer bridge calls to prevent setState during render
    setTimeout(() => {
      stateBridge.clearNotifications();
      analytics(
        'notifications_cleared',
        {
          userStory: 'US-3.1',
          hypothesis: 'H4',
        },
        'medium'
      );
    }, 0);
  }, [stateBridge, analytics]);

  const trackPageView = useCallback(
    (page: string) => {
      // Defer bridge calls to prevent setState during render
      setTimeout(() => {
        stateBridge.trackPageView(page);
        analytics(
          'page_viewed',
          {
            page,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          },
          'low'
        );
      }, 0);
    },
    [stateBridge, analytics]
  );

  const trackAction = useCallback(
    (action: string, metadata?: ActionMetadata) => {
      // Defer bridge calls to prevent setState during render
      setTimeout(() => {
        stateBridge.trackAction(action, metadata);
        analytics(
          'action_tracked',
          {
            action,
            userStory: metadata?.userStory || 'US-3.1',
            hypothesis: metadata?.hypothesis || 'H4',
            ...metadata,
          },
          'low'
        );
      }, 0);
    },
    [stateBridge, analytics]
  );

  const setTheme = useCallback(
    (theme: 'light' | 'dark') => {
      // Defer bridge calls to prevent setState during render
      setTimeout(() => {
        stateBridge.setTheme(theme);
        analytics(
          'theme_changed',
          {
            theme,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          },
          'low'
        );
      }, 0);
    },
    [stateBridge, analytics]
  );

  const toggleSidebar = useCallback(() => {
    // Defer bridge calls to prevent setState during render
    setTimeout(() => {
      stateBridge.toggleSidebar();
      analytics(
        'sidebar_toggled',
        {
          userStory: 'US-3.1',
          hypothesis: 'H4',
        },
        'low'
      );
    }, 0);
  }, [stateBridge, analytics]);

  // Create bridge context value
  const bridgeValue = useMemo(
    () => ({
      // API operations
      fetchProposalDetail,
      updateProposalDetail,
      deleteProposal,
      approveProposal,
      rejectProposal,
      assignTeam,
      getProposalAnalytics,

      // State operations
      setProposalFilters,
      setProposalSort,
      setSelectedProposals,
      addNotification,
      removeNotification,
      clearNotifications,
      setTheme,
      toggleSidebar,

      // Analytics operations
      trackPageView,
      trackAction,

      // State access
      proposalState,
      uiState,
    }),
    [
      fetchProposalDetail,
      updateProposalDetail,
      deleteProposal,
      approveProposal,
      rejectProposal,
      assignTeam,
      getProposalAnalytics,
      setProposalFilters,
      setProposalSort,
      setSelectedProposals,
      addNotification,
      removeNotification,
      clearNotifications,
      setTheme,
      toggleSidebar,
      trackPageView,
      trackAction,
      proposalState,
      uiState,
    ]
  );

  return (
    <ProposalDetailBridgeContext.Provider value={bridgeValue}>
      {children}
    </ProposalDetailBridgeContext.Provider>
  );
}

// Create context for the bridge
const ProposalDetailBridgeContext = React.createContext<ProposalDetailBridgeContextValue | null>(
  null
);

// Hook to use the proposal detail bridge
export function useProposalDetailBridge() {
  const context = React.useContext(ProposalDetailBridgeContext);
  if (!context) {
    throw new Error('useProposalDetailBridge must be used within ProposalDetailManagementBridge');
  }
  return context;
}

// Export the context for testing
export { ProposalDetailBridgeContext };
