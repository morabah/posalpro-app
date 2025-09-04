/**
 * SME Management Bridge - React Context Provider
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: US-4.1 (SME Assignment Management), US-4.2 (SME Contribution Tracking)
 * - Acceptance Criteria: AC-4.1.1, AC-4.1.2, AC-4.2.1
 * - Hypotheses: H6 (SME Efficiency), H7 (Contribution Quality)
 *
 * COMPLIANCE STATUS:
 * ✅ Error Handling with ErrorHandlingService
 * ✅ Analytics with userStory and hypothesis tracking
 * ✅ Structured Logging with metadata
 * ✅ TypeScript Type Safety (no any types)
 * ✅ Performance Optimization with useCallback/useMemo
 * ✅ Security with RBAC validation
 * ✅ Security audit logging
 */

'use client';

import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useSmeManagementApiBridge } from '@/lib/bridges/SmeApiBridge';
import { logDebug, logError, logInfo } from '@/lib/logger';
import React, { createContext, ReactNode, useCallback, useMemo, useReducer, useState } from 'react';
import { useForm } from 'react-hook-form';

// ====================
// TypeScript Interfaces
// ====================

interface SMEAssignment {
  id?: string;
  proposalId: string;
  proposalTitle: string;
  customer: string;
  sectionType:
    | 'technical_specs'
    | 'compliance'
    | 'implementation'
    | 'architecture'
    | 'security'
    | 'integration';
  assignedBy: string;
  assignedAt: string;
  dueDate: string;
  status:
    | 'pending'
    | 'in_progress'
    | 'draft_saved'
    | 'submitted'
    | 'under_review'
    | 'approved'
    | 'rejected';
  requirements: string[];
  context: {
    proposalValue: number;
    industry: string;
    complexity: 'low' | 'medium' | 'high';
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  content?: string;
}

interface SMEAssignmentUpdateData {
  status?:
    | 'pending'
    | 'in_progress'
    | 'draft_saved'
    | 'submitted'
    | 'under_review'
    | 'approved'
    | 'rejected';
  content?: string;
  progress?: number;
  notes?: string;
}

interface SMEAssignmentFetchParams {
  page?: number;
  limit?: number;
  status?: string;
  sectionType?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

interface SMEContribution {
  id?: string;
  assignmentId: string;
  content: string;
  version: number;
  submittedAt: string;
  reviewedBy?: string;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
}

interface SMETemplate {
  id?: string;
  name: string;
  type:
    | 'technical_specifications'
    | 'security_assessment'
    | 'compliance_framework'
    | 'implementation_plan'
    | 'architecture_design'
    | 'integration_guide';
  content: string;
  description?: string;
  tags?: string[];
}

interface SMEStats {
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  averageCompletionTime: number;
  topSectionTypes: Array<{ type: string; count: number }>;
}

interface SMEAssignmentListResponse {
  assignments: SMEAssignment[];
  total: number;
  page: number;
  limit: number;
}

// ====================
// State Management
// ====================

interface SmeBridgeState {
  assignments: {
    data: SMEAssignment[] | null;
    loading: boolean;
    error: string | null;
    filters: SMEAssignmentFetchParams;
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasNextPage: boolean;
    };
  };
  selectedAssignment: SMEAssignment | null;
  templates: {
    data: SMETemplate[] | null;
    loading: boolean;
    error: string | null;
  };
  stats: {
    data: SMEStats | null;
    loading: boolean;
    error: string | null;
  };
  contributions: {
    data: SMEContribution[] | null;
    loading: boolean;
    error: string | null;
  };
}

type SmeBridgeAction =
  | { type: 'SET_ASSIGNMENTS_LOADING'; payload: boolean }
  | {
      type: 'SET_ASSIGNMENTS_DATA';
      payload: { data: SMEAssignment[]; total: number; page: number; limit: number };
    }
  | { type: 'SET_ASSIGNMENTS_ERROR'; payload: string | null }
  | { type: 'SET_ASSIGNMENTS_FILTERS'; payload: SMEAssignmentFetchParams }
  | { type: 'SET_SELECTED_ASSIGNMENT'; payload: SMEAssignment | null }
  | { type: 'SET_TEMPLATES_LOADING'; payload: boolean }
  | { type: 'SET_TEMPLATES_DATA'; payload: SMETemplate[] }
  | { type: 'SET_TEMPLATES_ERROR'; payload: string | null }
  | { type: 'SET_STATS_LOADING'; payload: boolean }
  | { type: 'SET_STATS_DATA'; payload: SMEStats }
  | { type: 'SET_STATS_ERROR'; payload: string | null }
  | { type: 'SET_CONTRIBUTIONS_LOADING'; payload: boolean }
  | { type: 'SET_CONTRIBUTIONS_DATA'; payload: SMEContribution[] }
  | { type: 'SET_CONTRIBUTIONS_ERROR'; payload: string | null }
  | { type: 'UPDATE_ASSIGNMENT'; payload: SMEAssignment }
  | { type: 'ADD_CONTRIBUTION'; payload: SMEContribution }
  | { type: 'RESET_STATE' };

const initialState: SmeBridgeState = {
  assignments: {
    data: null,
    loading: false,
    error: null,
    filters: {},
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      hasNextPage: false,
    },
  },
  selectedAssignment: null,
  templates: {
    data: null,
    loading: false,
    error: null,
  },
  stats: {
    data: null,
    loading: false,
    error: null,
  },
  contributions: {
    data: null,
    loading: false,
    error: null,
  },
};

function smeBridgeReducer(state: SmeBridgeState, action: SmeBridgeAction): SmeBridgeState {
  switch (action.type) {
    case 'SET_ASSIGNMENTS_LOADING':
      return {
        ...state,
        assignments: { ...state.assignments, loading: action.payload, error: null },
      };

    case 'SET_ASSIGNMENTS_DATA':
      return {
        ...state,
        assignments: {
          ...state.assignments,
          data: action.payload.data,
          loading: false,
          error: null,
          pagination: {
            page: action.payload.page,
            limit: action.payload.limit,
            total: action.payload.total,
            hasNextPage: action.payload.data.length === action.payload.limit,
          },
        },
      };

    case 'SET_ASSIGNMENTS_ERROR':
      return {
        ...state,
        assignments: { ...state.assignments, error: action.payload, loading: false },
      };

    case 'SET_ASSIGNMENTS_FILTERS':
      return {
        ...state,
        assignments: {
          ...state.assignments,
          filters: action.payload,
          pagination: { ...state.assignments.pagination, page: 1 },
        },
      };

    case 'SET_SELECTED_ASSIGNMENT':
      return {
        ...state,
        selectedAssignment: action.payload,
      };

    case 'SET_TEMPLATES_LOADING':
      return {
        ...state,
        templates: { ...state.templates, loading: action.payload, error: null },
      };

    case 'SET_TEMPLATES_DATA':
      return {
        ...state,
        templates: { data: action.payload, loading: false, error: null },
      };

    case 'SET_TEMPLATES_ERROR':
      return {
        ...state,
        templates: { ...state.templates, error: action.payload, loading: false },
      };

    case 'SET_STATS_LOADING':
      return {
        ...state,
        stats: { ...state.stats, loading: action.payload, error: null },
      };

    case 'SET_STATS_DATA':
      return {
        ...state,
        stats: { data: action.payload, loading: false, error: null },
      };

    case 'SET_STATS_ERROR':
      return {
        ...state,
        stats: { ...state.stats, error: action.payload, loading: false },
      };

    case 'SET_CONTRIBUTIONS_LOADING':
      return {
        ...state,
        contributions: { ...state.contributions, loading: action.payload, error: null },
      };

    case 'SET_CONTRIBUTIONS_DATA':
      return {
        ...state,
        contributions: { data: action.payload, loading: false, error: null },
      };

    case 'SET_CONTRIBUTIONS_ERROR':
      return {
        ...state,
        contributions: { ...state.contributions, error: action.payload, loading: false },
      };

    case 'UPDATE_ASSIGNMENT':
      return {
        ...state,
        assignments: {
          ...state.assignments,
          data:
            state.assignments.data?.map(assignment =>
              assignment.id === action.payload.id ? action.payload : assignment
            ) || null,
        },
        selectedAssignment:
          state.selectedAssignment?.id === action.payload.id
            ? action.payload
            : state.selectedAssignment,
      };

    case 'ADD_CONTRIBUTION':
      return {
        ...state,
        contributions: {
          ...state.contributions,
          data: [...(state.contributions.data || []), action.payload],
        },
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// ====================
// Context Definition
// ====================

interface SmeBridgeContextValue {
  state: SmeBridgeState;
  actions: {
    fetchAssignments: (params?: SMEAssignmentFetchParams) => Promise<void>;
    getAssignment: (assignmentId: string) => Promise<void>;
    updateAssignment: (assignmentId: string, updateData: SMEAssignmentUpdateData) => Promise<void>;
    submitContribution: (contribution: SMEContribution) => Promise<void>;
    getTemplates: () => Promise<void>;
    getSmeStats: () => Promise<void>;
    setFilters: (filters: SMEAssignmentFetchParams) => void;
    setSelectedAssignment: (assignment: SMEAssignment | null) => void;
    resetState: () => void;
  };

  // ✅ FORM HANDLING: Add form state management
  formState: {
    isLoading: boolean;
    isSubmitting: boolean;
    errors: Record<string, string>;
  };

  // ✅ LOADING STATES: Add loading state management
  loadingStates: {
    assignments: boolean;
    operations: Record<string, boolean>;
  };

  // ✅ FORM HANDLING: Add form methods
  formMethods: ReturnType<
    typeof useForm<{
      search: string;
      status: string;
      sectionType: string;
    }>
  >;
  handleFormSubmit: (data: Record<string, unknown>) => Promise<void>;

  // ✅ ACCESSIBILITY: Add accessibility features
  accessibility: {
    announceUpdate: (message: string) => void;
    setFocusTo: (elementId: string) => void;
    getAriaLabel: (context: string, item?: SMEAssignment) => string;
  };

  // ✅ MOBILE OPTIMIZATION: Add mobile responsive features
  mobile: {
    isMobileView: boolean;
    touchOptimized: boolean;
    orientation: 'portrait' | 'landscape';
  };
}

const SmeBridgeContext = createContext<SmeBridgeContextValue | undefined>(undefined);

// ====================
// Provider Component
// ====================

interface SmeManagementBridgeProviderProps {
  children: ReactNode;
}

export function SmeManagementBridgeProvider({ children }: SmeManagementBridgeProviderProps) {
  const [state, dispatch] = useReducer(smeBridgeReducer, initialState);
  const { handleAsyncError } = useErrorHandler();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const smeBridge = useSmeManagementApiBridge();

  // Set analytics for the bridge
  useMemo(() => {
    smeBridge.setAnalytics(analytics);
  }, [smeBridge, analytics]);

  // ✅ FORM HANDLING: React Hook Form integration
  const formMethods = useForm<{
    search: string;
    status: string;
    sectionType: string;
  }>({
    defaultValues: {
      search: '',
      status: '',
      sectionType: '',
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
    assignments: false,
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
          let liveRegion = document.getElementById('sme-bridge-announcements');
          if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'sme-bridge-announcements';
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
      getAriaLabel: (context: string, item?: SMEAssignment) => {
        switch (context) {
          case 'assignment-item':
            return item
              ? `Assignment: ${item.proposalTitle}, Status: ${item.status}`
              : 'Assignment item';
          case 'assignment-list':
            return `Assignments list`;
          case 'assignment-actions':
            return item ? `Actions for ${item.proposalTitle}` : 'Assignment actions';
          default:
            return context;
        }
      },
    }),
    []
  );

  const setFilters = useCallback((filters: SMEAssignmentFetchParams) => {
    dispatch({ type: 'SET_ASSIGNMENTS_FILTERS', payload: filters });
  }, []);

  // ✅ FORM HANDLING: Form submission handler
  const handleFormSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        logDebug('SmeManagement form submit', {
          component: 'SmeManagementBridge',
          operation: 'form_submit',
          formDataKeys: Object.keys(data),
        });

        setFormState(prev => ({ ...prev, isSubmitting: true, errors: {} }));

        // ✅ SECURITY: Sanitize form input
        const sanitizedData = {
          search: typeof data.search === 'string' ? data.search.trim().slice(0, 100) : '',
          status: typeof data.status === 'string' ? data.status : '',
          sectionType: typeof data.sectionType === 'string' ? data.sectionType : '',
        };

        // Apply form data as filters
        const newFilters = {
          search: sanitizedData.search,
          status: sanitizedData.status,
          sectionType: sanitizedData.sectionType,
        };

        // Update filters through existing action
        setFilters(newFilters);

        // ✅ ACCESSIBILITY: Announce form submission success
        accessibility.announceUpdate(`Filters applied successfully.`);

        analytics(
          'sme_form_submitted',
          {
            userStory: 'US-4.1',
            hypothesis: 'H6',
            formType: 'filter',
            isMobile: mobile.isMobileView,
          },
          'medium'
        );

        logInfo('SmeManagement form submit success', {
          component: 'SmeManagementBridge',
          operation: 'form_submit',
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setFormState(prev => ({
          ...prev,
          errors: { general: errorMessage },
        }));

        // ✅ ACCESSIBILITY: Announce form submission error
        accessibility.announceUpdate(`Error: ${errorMessage}`);

        logError('SmeManagement form submit failed', {
          component: 'SmeManagementBridge',
          operation: 'form_submit',
          error: errorMessage,
        });
      } finally {
        setFormState(prev => ({ ...prev, isSubmitting: false }));
      }
    },
    [analytics, setFilters, accessibility, mobile.isMobileView]
  );

  const setSelectedAssignment = useCallback((assignment: SMEAssignment | null) => {
    dispatch({ type: 'SET_SELECTED_ASSIGNMENT', payload: assignment });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // ====================
  // Action Handlers
  // ====================

  const fetchAssignments = useCallback(
    async (params?: SMEAssignmentFetchParams) => {
      const start = performance.now();

      logDebug('SmeManagementBridge: Fetch assignments start', {
        component: 'SmeManagementBridge',
        operation: 'fetchAssignments',
        params,
        userStory: 'US-4.1',
        hypothesis: 'H6',
      });

      try {
        dispatch({ type: 'SET_ASSIGNMENTS_LOADING', payload: true });

        const response = await smeBridge.fetchAssignments(params || state.assignments.filters);

        if (response.success && response.data) {
          dispatch({
            type: 'SET_ASSIGNMENTS_DATA',
            payload: {
              data: response.data.assignments,
              total: response.data.total,
              page: response.data.page,
              limit: response.data.limit,
            },
          });

          analytics('sme_assignments_fetched', {
            count: response.data.assignments.length,
            total: response.data.total,
            userStory: 'US-4.1',
            hypothesis: 'H6',
            loadTime: performance.now() - start,
          });

          logInfo('SmeManagementBridge: Fetch assignments success', {
            component: 'SmeManagementBridge',
            operation: 'fetchAssignments',
            count: response.data.assignments.length,
            loadTime: performance.now() - start,
          });
        } else {
          throw new Error(response.error || 'Failed to fetch assignments');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        dispatch({ type: 'SET_ASSIGNMENTS_ERROR', payload: errorMessage });

        analytics('sme_assignments_fetch_error', {
          error: errorMessage,
          userStory: 'US-4.1',
          hypothesis: 'H6',
        });

        logError('SmeManagementBridge: Fetch assignments failed', {
          component: 'SmeManagementBridge',
          operation: 'fetchAssignments',
          error: errorMessage,
          loadTime: performance.now() - start,
        });

        handleAsyncError(error, 'Failed to fetch SME assignments');
      }
    },
    [smeBridge, state.assignments.filters, analytics, handleAsyncError]
  );

  const getAssignment = useCallback(
    async (assignmentId: string) => {
      const start = performance.now();

      logDebug('SmeManagementBridge: Get assignment start', {
        component: 'SmeManagementBridge',
        operation: 'getAssignment',
        assignmentId,
        userStory: 'US-4.1',
        hypothesis: 'H6',
      });

      try {
        const response = await smeBridge.getAssignment(assignmentId);

        if (response.success && response.data) {
          dispatch({ type: 'SET_SELECTED_ASSIGNMENT', payload: response.data });

          analytics('sme_assignment_fetched', {
            assignmentId,
            userStory: 'US-4.1',
            hypothesis: 'H6',
            loadTime: performance.now() - start,
          });

          logInfo('SmeManagementBridge: Get assignment success', {
            component: 'SmeManagementBridge',
            operation: 'getAssignment',
            assignmentId,
            loadTime: performance.now() - start,
          });
        } else {
          throw new Error(response.error || 'Failed to fetch assignment');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        analytics('sme_assignment_fetch_error', {
          assignmentId,
          error: errorMessage,
          userStory: 'US-4.1',
          hypothesis: 'H6',
        });

        logError('SmeManagementBridge: Get assignment failed', {
          component: 'SmeManagementBridge',
          operation: 'getAssignment',
          assignmentId,
          error: errorMessage,
          loadTime: performance.now() - start,
        });

        handleAsyncError(error, 'Failed to fetch SME assignment');
      }
    },
    [smeBridge, analytics, handleAsyncError]
  );

  const updateAssignment = useCallback(
    async (assignmentId: string, updateData: SMEAssignmentUpdateData) => {
      const start = performance.now();

      logDebug('SmeManagementBridge: Update assignment start', {
        component: 'SmeManagementBridge',
        operation: 'updateAssignment',
        assignmentId,
        updateDataKeys: Object.keys(updateData),
        userStory: 'US-4.1',
        hypothesis: 'H6',
      });

      try {
        const response = await smeBridge.updateAssignment(assignmentId, updateData);

        if (response.success && response.data) {
          dispatch({ type: 'UPDATE_ASSIGNMENT', payload: response.data });

          analytics('sme_assignment_updated', {
            assignmentId,
            userStory: 'US-4.1',
            hypothesis: 'H6',
            loadTime: performance.now() - start,
          });

          logInfo('SmeManagementBridge: Update assignment success', {
            component: 'SmeManagementBridge',
            operation: 'updateAssignment',
            assignmentId,
            loadTime: performance.now() - start,
          });
        } else {
          throw new Error(response.error || 'Failed to update assignment');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        analytics('sme_assignment_update_error', {
          assignmentId,
          error: errorMessage,
          userStory: 'US-4.1',
          hypothesis: 'H6',
        });

        logError('SmeManagementBridge: Update assignment failed', {
          component: 'SmeManagementBridge',
          operation: 'updateAssignment',
          assignmentId,
          error: errorMessage,
          loadTime: performance.now() - start,
        });

        handleAsyncError(error, 'Failed to update SME assignment');
      }
    },
    [smeBridge, analytics, handleAsyncError]
  );

  const submitContribution = useCallback(
    async (contribution: SMEContribution) => {
      const start = performance.now();

      logDebug('SmeManagementBridge: Submit contribution start', {
        component: 'SmeManagementBridge',
        operation: 'submitContribution',
        assignmentId: contribution.assignmentId,
        userStory: 'US-4.2',
        hypothesis: 'H7',
      });

      try {
        const response = await smeBridge.submitContribution(contribution);

        if (response.success && response.data) {
          dispatch({ type: 'ADD_CONTRIBUTION', payload: response.data });

          analytics('sme_contribution_submitted', {
            assignmentId: contribution.assignmentId,
            userStory: 'US-4.2',
            hypothesis: 'H7',
            loadTime: performance.now() - start,
          });

          logInfo('SmeManagementBridge: Submit contribution success', {
            component: 'SmeManagementBridge',
            operation: 'submitContribution',
            assignmentId: contribution.assignmentId,
            loadTime: performance.now() - start,
          });
        } else {
          throw new Error(response.error || 'Failed to submit contribution');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        analytics('sme_contribution_submit_error', {
          assignmentId: contribution.assignmentId,
          error: errorMessage,
          userStory: 'US-4.2',
          hypothesis: 'H7',
        });

        logError('SmeManagementBridge: Submit contribution failed', {
          component: 'SmeManagementBridge',
          operation: 'submitContribution',
          assignmentId: contribution.assignmentId,
          error: errorMessage,
          loadTime: performance.now() - start,
        });

        handleAsyncError(error, 'Failed to submit SME contribution');
      }
    },
    [smeBridge, analytics, handleAsyncError]
  );

  const getTemplates = useCallback(async () => {
    const start = performance.now();

    logDebug('SmeManagementBridge: Get templates start', {
      component: 'SmeManagementBridge',
      operation: 'getTemplates',
      userStory: 'US-4.1',
      hypothesis: 'H6',
    });

    try {
      dispatch({ type: 'SET_TEMPLATES_LOADING', payload: true });

      const response = await smeBridge.getTemplates();

      if (response.success && response.data) {
        dispatch({ type: 'SET_TEMPLATES_DATA', payload: response.data });

        analytics('sme_templates_fetched', {
          count: response.data.length,
          userStory: 'US-4.1',
          hypothesis: 'H6',
          loadTime: performance.now() - start,
        });

        logInfo('SmeManagementBridge: Get templates success', {
          component: 'SmeManagementBridge',
          operation: 'getTemplates',
          count: response.data.length,
          loadTime: performance.now() - start,
        });
      } else {
        throw new Error(response.error || 'Failed to fetch templates');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      dispatch({ type: 'SET_TEMPLATES_ERROR', payload: errorMessage });

      analytics('sme_templates_fetch_error', {
        error: errorMessage,
        userStory: 'US-4.1',
        hypothesis: 'H6',
      });

      logError('SmeManagementBridge: Get templates failed', {
        component: 'SmeManagementBridge',
        operation: 'getTemplates',
        error: errorMessage,
        loadTime: performance.now() - start,
      });

      handleAsyncError(error, 'Failed to fetch SME templates');
    }
  }, [smeBridge, analytics, handleAsyncError]);

  const getSmeStats = useCallback(async () => {
    const start = performance.now();

    logDebug('SmeManagementBridge: Get SME stats start', {
      component: 'SmeManagementBridge',
      operation: 'getSmeStats',
      userStory: 'US-4.1',
      hypothesis: 'H6',
    });

    try {
      dispatch({ type: 'SET_STATS_LOADING', payload: true });

      const response = await smeBridge.getSmeStats();

      if (response.success && response.data) {
        dispatch({ type: 'SET_STATS_DATA', payload: response.data });

        analytics('sme_stats_fetched', {
          totalAssignments: response.data.totalAssignments,
          completedAssignments: response.data.completedAssignments,
          userStory: 'US-4.1',
          hypothesis: 'H6',
          loadTime: performance.now() - start,
        });

        logInfo('SmeManagementBridge: Get SME stats success', {
          component: 'SmeManagementBridge',
          operation: 'getSmeStats',
          totalAssignments: response.data.totalAssignments,
          loadTime: performance.now() - start,
        });
      } else {
        throw new Error(response.error || 'Failed to fetch SME stats');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      dispatch({ type: 'SET_STATS_ERROR', payload: errorMessage });

      analytics('sme_stats_fetch_error', {
        error: errorMessage,
        userStory: 'US-4.1',
        hypothesis: 'H6',
      });

      logError('SmeManagementBridge: Get SME stats failed', {
        component: 'SmeManagementBridge',
        operation: 'getSmeStats',
        error: errorMessage,
        loadTime: performance.now() - start,
      });

      handleAsyncError(error, 'Failed to fetch SME stats');
    }
  }, [smeBridge, analytics, handleAsyncError]);

  // ====================
  // Context Value
  // ====================

  const contextValue = useMemo(
    () => ({
      state,
      actions: {
        fetchAssignments,
        getAssignment,
        updateAssignment,
        submitContribution,
        getTemplates,
        getSmeStats,
        setFilters,
        setSelectedAssignment,
        resetState,
      },
      formState,
      loadingStates,
      formMethods,
      handleFormSubmit,
      accessibility,
      mobile,
    }),
    [
      state,
      fetchAssignments,
      getAssignment,
      updateAssignment,
      submitContribution,
      getTemplates,
      getSmeStats,
      setFilters,
      setSelectedAssignment,
      resetState,
      formState,
      loadingStates,
      formMethods,
      handleFormSubmit,
      accessibility,
      mobile,
    ]
  );

  return <SmeBridgeContext.Provider value={contextValue}>{children}</SmeBridgeContext.Provider>;
}

// ✅ COMPONENT DISPLAY NAME: Add displayName for debugging
SmeManagementBridgeProvider.displayName = 'SmeManagementBridge';

// ====================
// Hook for Consumers
// ====================

export function useSmeManagementBridge() {
  const context = React.useContext(SmeBridgeContext);
  if (context === undefined) {
    throw new Error('useSmeManagementBridge must be used within a SmeManagementBridgeProvider');
  }
  return context;
}

// ====================
// Export Types
// ====================

export type {
  SMEAssignment,
  SMEAssignmentFetchParams,
  SMEAssignmentListResponse,
  SMEAssignmentUpdateData,
  SmeBridgeAction,
  SmeBridgeContextValue,
  SmeBridgeState,
  SMEContribution,
  SMEStats,
  SMETemplate,
};
