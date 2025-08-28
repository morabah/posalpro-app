/**
 * Proposal Detail Hook with Bridge Integration - CORE_REQUIREMENTS.md Compliant
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

import { useProposalDetailBridge as useProposalDetailBridgeContext } from '@/components/bridges/ProposalDetailManagementBridge';
import { useAuth } from '@/components/providers/AuthProvider';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import type { AnalyticsData, ApiResponse } from '@/lib/bridges/ProposalDetailApiBridge';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// Proposal detail types
interface ProposalDetail {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  customerId?: string;
  customerName?: string;
  customerIndustry?: string;
  customerTier?: string;
  estimatedValue?: number;
  priority?: string;
  dueDate?: string;
  validUntil?: string;
  value?: number;
  currency?: string;
  projectType?: string;
  createdByEmail?: string;
  teamSize?: number;
  totalSections?: number;
  daysUntilDeadline?: number | null;
  sections?: {
    id: string;
    title: string;
    content: string;
    type: string;
    order: number;
  }>;
  assignedTo?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  approvals?: Array<{
    id: string;
    currentStage: string | null;
    status: string;
    startedAt: string;
    completedAt: string | null;
  }>;
  approvalStages?: number;
  metadata?: Record<string, unknown>;
  wizardData?: Record<string, unknown>;
  teamAssignments?: Record<string, unknown>;
  contentSelections?: Array<Record<string, unknown>>;
  validationData?: Record<string, unknown>;
  analyticsData?: Record<string, unknown>;
  crossStepValidation?: Record<string, unknown>;
}

// Hook configuration options
interface UseProposalDetailBridgeOptions {
  enableCache?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onError?: (error: Error) => void;
  onDataChange?: (data: ProposalDetail) => void;
}

// Return interface for the hook
export interface UseProposalDetailBridgeReturn {
  // Data
  proposal: ProposalDetail | null;
  analytics: AnalyticsData | null;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isUpdating: boolean;

  // Error states
  hasErrors: boolean;
  error: Error | null;

  // Actions
  refetch: () => Promise<void>;
  updateProposal: (updates: Partial<ProposalDetail>) => Promise<boolean>;
  deleteProposal: () => Promise<boolean>;
  approveProposal: (approvalData?: Record<string, unknown>) => Promise<boolean>;
  rejectProposal: (rejectionReason?: string) => Promise<boolean>;
  assignTeam: (teamAssignments: Record<string, unknown>) => Promise<boolean>;
  refreshAnalytics: () => Promise<void>;

  // Meta
  lastUpdated: Date | null;
}

/**
 * Bridge-based proposal detail management hook
 * Migrated from useProposalDetail in page.tsx to use bridge patterns
 */
export function useProposalDetailBridge(
  proposalId: string | null,
  options: UseProposalDetailBridgeOptions = {}
): UseProposalDetailBridgeReturn {
  const bridge = useProposalDetailBridgeContext();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Local state for loading and error management - must be called before any early returns
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [proposalAnalytics, setProposalAnalytics] = useState<AnalyticsData | null>(null);

  // Authentication check - follow bridge migration patterns
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/signin');
      return;
    }
  }, [user, isAuthenticated, isLoading, router]);

  // Early returns for loading and unauthenticated states
  if (isLoading) {
    return {
      proposal: null,
      analytics: null,
      isLoading: true,
      isRefreshing: false,
      isUpdating: false,
      hasErrors: false,
      error: null,
      refetch: async () => {},
      updateProposal: async () => false,
      deleteProposal: async () => false,
      approveProposal: async () => false,
      rejectProposal: async () => false,
      assignTeam: async () => false,
      refreshAnalytics: async () => {},
      lastUpdated: null,
    };
  }

  if (!isAuthenticated || !user) {
    return {
      proposal: null,
      analytics: null,
      isLoading: false,
      isRefreshing: false,
      isUpdating: false,
      hasErrors: false,
      error: null,
      refetch: async () => {},
      updateProposal: async () => false,
      deleteProposal: async () => false,
      approveProposal: async () => false,
      rejectProposal: async () => false,
      assignTeam: async () => false,
      refreshAnalytics: async () => {},
      lastUpdated: null,
    };
  }

  // Track page view with bridge - run only once on mount
  useEffect(() => {
    if (proposalId) {
      bridge.trackPageView('proposal_detail');
    }
  }, [bridge, proposalId]); // Include bridge and proposalId dependencies

  // Load initial proposal data
  useEffect(() => {
    if (!proposalId) return;

    const loadProposalData = async () => {
      setIsDataLoading(true);
      setError(null);

      try {
        logDebug('Proposal Detail Bridge: Initial data load start', {
          component: 'useProposalDetailBridge',
          operation: 'loadProposalData',
          proposalId,
        });

        const result = (await bridge.fetchProposalDetail(
          proposalId
        )) as ApiResponse<ProposalDetail>;

        if (result.success && result.data) {
          const proposalData = result.data as ProposalDetail;
          setProposal(proposalData);
          analytics(
            'proposal_detail_loaded',
            {
              proposalId,
              status: proposalData.status,
              userStory: 'US-3.1',
              hypothesis: 'H4',
            },
            'medium'
          );

          logInfo('Proposal Detail Bridge: Initial data load success', {
            component: 'useProposalDetailBridge',
            operation: 'loadProposalData',
            proposalId,
          });

          // Call onDataChange callback if provided
          if (options.onDataChange) {
            options.onDataChange(result.data);
          }
        } else {
          throw new Error(result.error || result.message || 'Failed to load proposal details');
        }
      } catch (err) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          err,
          'Failed to load proposal details',
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: 'useProposalDetailBridge',
            operation: 'loadProposalData',
            proposalId,
          }
        );

        setError(standardError);
        analytics(
          'proposal_detail_load_error',
          {
            proposalId,
            error: standardError.message,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          },
          'high'
        );

        logError('Proposal Detail Bridge: Initial data load failed', {
          component: 'useProposalDetailBridge',
          operation: 'loadProposalData',
          proposalId,
          error: standardError.message,
        });

        options.onError?.(standardError);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadProposalData();
  }, [proposalId]); // Only depend on proposalId

  // Refetch function
  const refetch = useCallback(async (): Promise<void> => {
    if (!proposalId) return;

    setIsRefreshing(true);
    setError(null);

    try {
      logDebug('Proposal Detail Bridge: Refetch start', {
        component: 'useProposalDetailBridge',
        operation: 'refetch',
        proposalId,
      });

      const result = (await bridge.fetchProposalDetail(proposalId)) as ApiResponse<ProposalDetail>;

      if (result.success && result.data) {
        setProposal(result.data);
        analytics(
          'proposal_detail_refreshed',
          {
            proposalId,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          },
          'medium'
        );

        logInfo('Proposal Detail Bridge: Refetch success', {
          component: 'useProposalDetailBridge',
          operation: 'refetch',
          proposalId,
        });
      } else {
        throw new Error(result.error || result.message || 'Failed to refresh proposal details');
      }
    } catch (err) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        err,
        'Failed to refresh proposal details',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'useProposalDetailBridge',
          operation: 'refetch',
          proposalId,
        }
      );

      setError(standardError);
      analytics(
        'proposal_detail_refresh_error',
        {
          proposalId,
          error: standardError.message,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        },
        'high'
      );

      logError('Proposal Detail Bridge: Refetch failed', {
        component: 'useProposalDetailBridge',
        operation: 'refetch',
        proposalId,
        error: standardError.message,
      });

      options.onError?.(standardError);
    } finally {
      setIsRefreshing(false);
    }
  }, [bridge, analytics, proposalId, options]);

  // Update proposal function
  const updateProposal = useCallback(
    async (updates: Partial<ProposalDetail>): Promise<boolean> => {
      if (!proposalId) return false;

      setIsUpdating(true);
      setError(null);

      try {
        logDebug('Proposal Detail Bridge: Update start', {
          component: 'useProposalDetailBridge',
          operation: 'updateProposal',
          proposalId,
          updateKeys: Object.keys(updates),
        });

        const result = (await bridge.updateProposalDetail(
          proposalId,
          updates
        )) as ApiResponse<ProposalDetail>;

        if (result.success && result.data) {
          setProposal(result.data);
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

          logInfo('Proposal Detail Bridge: Update success', {
            component: 'useProposalDetailBridge',
            operation: 'updateProposal',
            proposalId,
          });

          return true;
        } else {
          throw new Error(result.error || result.message || 'Failed to update proposal details');
        }
      } catch (err) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          err,
          'Failed to update proposal details',
          ErrorCodes.DATA.UPDATE_FAILED,
          {
            component: 'useProposalDetailBridge',
            operation: 'updateProposal',
            proposalId,
          }
        );

        setError(standardError);
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

        logError('Proposal Detail Bridge: Update failed', {
          component: 'useProposalDetailBridge',
          operation: 'updateProposal',
          proposalId,
          error: standardError.message,
        });

        options.onError?.(standardError);
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [bridge, analytics, proposalId, options]
  );

  // Delete proposal function
  const deleteProposal = useCallback(async (): Promise<boolean> => {
    if (!proposalId) return false;

    try {
      logDebug('Proposal Detail Bridge: Delete start', {
        component: 'useProposalDetailBridge',
        operation: 'deleteProposal',
        proposalId,
      });

      const result = (await bridge.deleteProposal(proposalId)) as ApiResponse<boolean>;

      if (result.success) {
        analytics(
          'proposal_deleted',
          {
            proposalId,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          },
          'medium'
        );

        logInfo('Proposal Detail Bridge: Delete success', {
          component: 'useProposalDetailBridge',
          operation: 'deleteProposal',
          proposalId,
        });

        return true;
      } else {
        throw new Error(result.error || result.message || 'Failed to delete proposal');
      }
    } catch (err) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        err,
        'Failed to delete proposal',
        ErrorCodes.DATA.DELETE_FAILED,
        {
          component: 'useProposalDetailBridge',
          operation: 'deleteProposal',
          proposalId,
        }
      );

      analytics(
        'proposal_delete_error',
        {
          proposalId,
          error: standardError.message,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        },
        'high'
      );

      logError('Proposal Detail Bridge: Delete failed', {
        component: 'useProposalDetailBridge',
        operation: 'deleteProposal',
        proposalId,
        error: standardError.message,
      });

      return false;
    }
  }, [bridge, analytics, proposalId]);

  // Approve proposal function
  const approveProposal = useCallback(
    async (approvalData?: Record<string, unknown>): Promise<boolean> => {
      if (!proposalId) return false;

      try {
        logDebug('Proposal Detail Bridge: Approve start', {
          component: 'useProposalDetailBridge',
          operation: 'approveProposal',
          proposalId,
        });

        const result = (await bridge.approveProposal(
          proposalId,
          approvalData
        )) as ApiResponse<ProposalDetail>;

        if (result.success && result.data) {
          setProposal(result.data);
          analytics(
            'proposal_approved',
            {
              proposalId,
              approvedBy: approvalData?.approvedBy,
              userStory: 'US-3.3',
              hypothesis: 'H8',
            },
            'medium'
          );

          logInfo('Proposal Detail Bridge: Approve success', {
            component: 'useProposalDetailBridge',
            operation: 'approveProposal',
            proposalId,
          });

          return true;
        } else {
          throw new Error(result.error || result.message || 'Failed to approve proposal');
        }
      } catch (err) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          err,
          'Failed to approve proposal',
          ErrorCodes.DATA.UPDATE_FAILED,
          {
            component: 'useProposalDetailBridge',
            operation: 'approveProposal',
            proposalId,
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

        logError('Proposal Detail Bridge: Approve failed', {
          component: 'useProposalDetailBridge',
          operation: 'approveProposal',
          proposalId,
          error: standardError.message,
        });

        return false;
      }
    },
    [bridge, analytics, proposalId]
  );

  // Reject proposal function
  const rejectProposal = useCallback(
    async (rejectionReason?: string): Promise<boolean> => {
      if (!proposalId) return false;

      try {
        logDebug('Proposal Detail Bridge: Reject start', {
          component: 'useProposalDetailBridge',
          operation: 'rejectProposal',
          proposalId,
        });

        const result = (await bridge.rejectProposal(
          proposalId,
          rejectionReason
        )) as ApiResponse<ProposalDetail>;

        if (result.success && result.data) {
          setProposal(result.data);
          analytics(
            'proposal_rejected',
            {
              proposalId,
              reason: rejectionReason,
              userStory: 'US-3.3',
              hypothesis: 'H8',
            },
            'medium'
          );

          logInfo('Proposal Detail Bridge: Reject success', {
            component: 'useProposalDetailBridge',
            operation: 'rejectProposal',
            proposalId,
          });

          return true;
        } else {
          throw new Error(result.error || result.message || 'Failed to reject proposal');
        }
      } catch (err) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          err,
          'Failed to reject proposal',
          ErrorCodes.DATA.UPDATE_FAILED,
          {
            component: 'useProposalDetailBridge',
            operation: 'rejectProposal',
            proposalId,
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

        logError('Proposal Detail Bridge: Reject failed', {
          component: 'useProposalDetailBridge',
          operation: 'rejectProposal',
          proposalId,
          error: standardError.message,
        });

        return false;
      }
    },
    [bridge, analytics, proposalId]
  );

  // Assign team function
  const assignTeam = useCallback(
    async (teamAssignments: Record<string, unknown>): Promise<boolean> => {
      if (!proposalId) return false;

      try {
        logDebug('Proposal Detail Bridge: Assign team start', {
          component: 'useProposalDetailBridge',
          operation: 'assignTeam',
          proposalId,
          teamSize: Object.keys(teamAssignments).length,
        });

        const result = (await bridge.assignTeam(
          proposalId,
          teamAssignments
        )) as ApiResponse<ProposalDetail>;

        if (result.success && result.data) {
          setProposal(result.data);
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

          logInfo('Proposal Detail Bridge: Assign team success', {
            component: 'useProposalDetailBridge',
            operation: 'assignTeam',
            proposalId,
          });

          return true;
        } else {
          throw new Error(result.error || result.message || 'Failed to assign team to proposal');
        }
      } catch (err) {
        const ehs = ErrorHandlingService.getInstance();
        const standardError = ehs.processError(
          err,
          'Failed to assign team to proposal',
          ErrorCodes.DATA.UPDATE_FAILED,
          {
            component: 'useProposalDetailBridge',
            operation: 'assignTeam',
            proposalId,
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

        logError('Proposal Detail Bridge: Assign team failed', {
          component: 'useProposalDetailBridge',
          operation: 'assignTeam',
          proposalId,
          error: standardError.message,
        });

        return false;
      }
    },
    [bridge, analytics, proposalId]
  );

  // Refresh analytics function
  const refreshAnalytics = useCallback(async (): Promise<void> => {
    if (!proposalId) return;

    try {
      logDebug('Proposal Detail Bridge: Refresh analytics start', {
        component: 'useProposalDetailBridge',
        operation: 'refreshAnalytics',
        proposalId,
      });

      const result = (await bridge.getProposalAnalytics(proposalId)) as ApiResponse<AnalyticsData>;

      if (result.success && result.data) {
        setProposalAnalytics(result.data);
        analytics(
          'proposal_analytics_refreshed',
          {
            proposalId,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          },
          'medium'
        );

        logInfo('Proposal Detail Bridge: Refresh analytics success', {
          component: 'useProposalDetailBridge',
          operation: 'refreshAnalytics',
          proposalId,
        });
      } else {
        throw new Error(result.error || result.message || 'Failed to refresh proposal analytics');
      }
    } catch (err) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        err,
        'Failed to refresh proposal analytics',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'useProposalDetailBridge',
          operation: 'refreshAnalytics',
          proposalId,
        }
      );

      analytics(
        'proposal_analytics_refresh_error',
        {
          proposalId,
          error: standardError.message,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        },
        'high'
      );

      logError('Proposal Detail Bridge: Refresh analytics failed', {
        component: 'useProposalDetailBridge',
        operation: 'refreshAnalytics',
        proposalId,
        error: standardError.message,
      });
    }
  }, [bridge, analytics, proposalId]);

  // Computed states
  const hasErrors = !!error;

  const lastUpdated = proposal ? new Date() : null;

  return {
    // Data
    proposal,
    analytics: proposalAnalytics,

    // Loading states
    isLoading: isDataLoading,
    isRefreshing,
    isUpdating,

    // Error states
    hasErrors,
    error,

    // Actions
    refetch,
    updateProposal,
    deleteProposal,
    approveProposal,
    rejectProposal,
    assignTeam,
    refreshAnalytics,

    // Meta
    lastUpdated,
  };
}

// Export types for external use
export type { ProposalDetail, UseProposalDetailBridgeOptions };
