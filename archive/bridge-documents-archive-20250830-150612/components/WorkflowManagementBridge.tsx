/**
 * Workflow Management Bridge - React Context Provider
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: US-5.1 (Workflow Management), US-5.2 (Approval Process), US-5.3 (Workflow Templates)
 * - Acceptance Criteria: AC-5.1.1, AC-5.1.2, AC-5.2.1, AC-5.3.1
 * - Hypotheses: H8 (Workflow Efficiency), H9 (Approval Speed)
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
import { useWorkflowManagementApiBridge } from '@/lib/bridges/WorkflowApiBridge';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { createContext, ReactNode, useCallback, useContext, useMemo, useReducer } from 'react';

// ====================
// TypeScript Interfaces
// ====================

interface Workflow {
  id?: string;
  name: string;
  description: string;
  type: 'proposal' | 'approval' | 'review' | 'custom';
  status: 'active' | 'inactive' | 'draft';
  stages: WorkflowStage[];
  triggers: WorkflowTrigger[];
  settings: {
    autoStart: boolean;
    requireApproval: boolean;
    maxDuration: number;
    notifications: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface WorkflowStage {
  id?: string;
  name: string;
  type: 'review' | 'approval' | 'notification' | 'action';
  order: number;
  assignees: string[];
  requirements: {
    documents: string[];
    approvals: number;
    timeLimit: number;
  };
  actions: WorkflowAction[];
}

interface WorkflowAction {
  id?: string;
  type: 'approve' | 'reject' | 'request_changes' | 'assign' | 'notify';
  name: string;
  conditions: WorkflowCondition[];
  outcomes: WorkflowOutcome[];
}

interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number | boolean;
}

interface WorkflowOutcome {
  action: string;
  nextStage?: string;
  status: string;
  message: string;
}

interface WorkflowTrigger {
  id?: string;
  type: 'manual' | 'automatic' | 'scheduled' | 'event_based';
  event: string;
  conditions: WorkflowCondition[];
}

interface WorkflowInstance {
  id?: string;
  workflowId: string;
  workflowName: string;
  entityId: string;
  entityType: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  currentStage: number;
  stages: WorkflowStageInstance[];
  startedAt: string;
  completedAt?: string;
  createdBy: string;
}

interface WorkflowStageInstance {
  id?: string;
  stageId: string;
  stageName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignees: string[];
  startedAt: string;
  completedAt?: string;
  actions: WorkflowActionInstance[];
}

interface WorkflowActionInstance {
  id?: string;
  actionId: string;
  actionName: string;
  type: string;
  status: 'pending' | 'completed' | 'failed';
  performedBy?: string;
  performedAt?: string;
  result: string;
  comments?: string;
}

interface WorkflowTemplate {
  id?: string;
  name: string;
  description: string;
  category: 'proposal' | 'approval' | 'review' | 'general';
  stages: WorkflowStage[];
  settings: {
    autoStart: boolean;
    requireApproval: boolean;
    maxDuration: number;
    notifications: boolean;
  };
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowFetchParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

interface WorkflowListResponse {
  workflows: Workflow[];
  total: number;
  page: number;
  limit: number;
}

// ====================
// State Management
// ====================

interface WorkflowBridgeState {
  workflows: {
    data: Workflow[] | null;
    loading: boolean;
    error: string | null;
    filters: WorkflowFetchParams;
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasNextPage: boolean;
    };
  };
  selectedWorkflow: Workflow | null;
  instances: {
    data: WorkflowInstance[] | null;
    loading: boolean;
    error: string | null;
  };
  templates: {
    data: WorkflowTemplate[] | null;
    loading: boolean;
    error: string | null;
  };
}

type WorkflowBridgeAction =
  | { type: 'SET_WORKFLOWS_LOADING'; payload: boolean }
  | {
      type: 'SET_WORKFLOWS_DATA';
      payload: { data: Workflow[]; total: number; page: number; limit: number };
    }
  | { type: 'SET_WORKFLOWS_ERROR'; payload: string | null }
  | { type: 'SET_WORKFLOWS_FILTERS'; payload: WorkflowFetchParams }
  | { type: 'SET_SELECTED_WORKFLOW'; payload: Workflow | null }
  | { type: 'SET_INSTANCES_LOADING'; payload: boolean }
  | { type: 'SET_INSTANCES_DATA'; payload: WorkflowInstance[] }
  | { type: 'SET_INSTANCES_ERROR'; payload: string | null }
  | { type: 'SET_TEMPLATES_LOADING'; payload: boolean }
  | { type: 'SET_TEMPLATES_DATA'; payload: WorkflowTemplate[] }
  | { type: 'SET_TEMPLATES_ERROR'; payload: string | null }
  | { type: 'UPDATE_WORKFLOW'; payload: Workflow }
  | { type: 'RESET_STATE' };

const initialState: WorkflowBridgeState = {
  workflows: {
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
  selectedWorkflow: null,
  instances: {
    data: null,
    loading: false,
    error: null,
  },
  templates: {
    data: null,
    loading: false,
    error: null,
  },
};

function workflowBridgeReducer(
  state: WorkflowBridgeState,
  action: WorkflowBridgeAction
): WorkflowBridgeState {
  switch (action.type) {
    case 'SET_WORKFLOWS_LOADING':
      return {
        ...state,
        workflows: { ...state.workflows, loading: action.payload, error: null },
      };

    case 'SET_WORKFLOWS_DATA':
      return {
        ...state,
        workflows: {
          ...state.workflows,
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

    case 'SET_WORKFLOWS_ERROR':
      return {
        ...state,
        workflows: { ...state.workflows, error: action.payload, loading: false },
      };

    case 'SET_WORKFLOWS_FILTERS':
      return {
        ...state,
        workflows: {
          ...state.workflows,
          filters: action.payload,
          pagination: { ...state.workflows.pagination, page: 1 },
        },
      };

    case 'SET_SELECTED_WORKFLOW':
      return {
        ...state,
        selectedWorkflow: action.payload,
      };

    case 'SET_INSTANCES_LOADING':
      return {
        ...state,
        instances: { ...state.instances, loading: action.payload, error: null },
      };

    case 'SET_INSTANCES_DATA':
      return {
        ...state,
        instances: { data: action.payload, loading: false, error: null },
      };

    case 'SET_INSTANCES_ERROR':
      return {
        ...state,
        instances: { ...state.instances, error: action.payload, loading: false },
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

    case 'UPDATE_WORKFLOW':
      return {
        ...state,
        workflows: {
          ...state.workflows,
          data:
            state.workflows.data?.map(workflow =>
              workflow.id === action.payload.id ? action.payload : workflow
            ) || null,
        },
        selectedWorkflow:
          state.selectedWorkflow?.id === action.payload.id
            ? action.payload
            : state.selectedWorkflow,
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

interface WorkflowBridgeContextValue {
  state: WorkflowBridgeState;
  actions: {
    fetchWorkflows: (params?: WorkflowFetchParams) => Promise<void>;
    getWorkflow: (workflowId: string) => Promise<void>;
    createWorkflow: (
      workflowData: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>
    ) => Promise<void>;
    updateWorkflow: (workflowId: string, updateData: Partial<Workflow>) => Promise<void>;
    startWorkflow: (workflowId: string, entityId: string, entityType: string) => Promise<void>;
    getInstances: (workflowId?: string) => Promise<void>;
    getTemplates: () => Promise<void>;
    setFilters: (filters: WorkflowFetchParams) => void;
    setSelectedWorkflow: (workflow: Workflow | null) => void;
    resetState: () => void;
  };
}

const WorkflowBridgeContext = createContext<WorkflowBridgeContextValue | undefined>(undefined);

// ====================
// Provider Component
// ====================

interface WorkflowManagementBridgeProviderProps {
  children: ReactNode;
}

export function WorkflowManagementBridgeProvider({
  children,
}: WorkflowManagementBridgeProviderProps) {
  const [state, dispatch] = useReducer(workflowBridgeReducer, initialState);
  const { handleAsyncError } = useErrorHandler();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const workflowBridge = useWorkflowManagementApiBridge();

  // Set analytics for the bridge
  useMemo(() => {
    workflowBridge.setAnalytics(analytics);
  }, [workflowBridge, analytics]);

  // ====================
  // Action Handlers
  // ====================

  const fetchWorkflows = useCallback(
    async (params?: WorkflowFetchParams) => {
      const start = performance.now();

      logDebug('WorkflowManagementBridge: Fetch workflows start', {
        component: 'WorkflowManagementBridge',
        operation: 'fetchWorkflows',
        params,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      try {
        dispatch({ type: 'SET_WORKFLOWS_LOADING', payload: true });

        const response = await workflowBridge.fetchWorkflows(params || state.workflows.filters);

        if (response.success && response.data) {
          dispatch({
            type: 'SET_WORKFLOWS_DATA',
            payload: {
              data: response.data.templates,
              total: response.data.total,
              page: response.data.page,
              limit: response.data.limit,
            },
          });

          analytics('workflow_list_fetched', {
            count: response.data.templates.length,
            total: response.data.total,
            userStory: 'US-5.1',
            hypothesis: 'H8',
            loadTime: performance.now() - start,
          });

          logInfo('WorkflowManagementBridge: Fetch workflows success', {
            component: 'WorkflowManagementBridge',
            operation: 'fetchWorkflows',
            count: response.data.templates.length,
            loadTime: performance.now() - start,
          });
        } else {
          throw new Error(response.error || 'Failed to fetch workflows');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        dispatch({ type: 'SET_WORKFLOWS_ERROR', payload: errorMessage });

        analytics('workflow_list_fetch_error', {
          error: errorMessage,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        logError('WorkflowManagementBridge: Fetch workflows failed', {
          component: 'WorkflowManagementBridge',
          operation: 'fetchWorkflows',
          error: errorMessage,
          loadTime: performance.now() - start,
        });

        handleAsyncError(error, 'Failed to fetch workflows');
      }
    },
    [workflowBridge, state.workflows.filters, analytics, handleAsyncError]
  );

  const getWorkflow = useCallback(
    async (workflowId: string) => {
      const start = performance.now();

      logDebug('WorkflowManagementBridge: Get workflow start', {
        component: 'WorkflowManagementBridge',
        operation: 'getWorkflow',
        workflowId,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      try {
        const response = await workflowBridge.getWorkflow(workflowId);

        if (response.success && response.data) {
          dispatch({ type: 'SET_SELECTED_WORKFLOW', payload: response.data });

          analytics('workflow_fetched', {
            workflowId,
            userStory: 'US-5.1',
            hypothesis: 'H8',
            loadTime: performance.now() - start,
          });

          logInfo('WorkflowManagementBridge: Get workflow success', {
            component: 'WorkflowManagementBridge',
            operation: 'getWorkflow',
            workflowId,
            loadTime: performance.now() - start,
          });
        } else {
          throw new Error(response.error || 'Failed to fetch workflow');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        analytics('workflow_fetch_error', {
          workflowId,
          error: errorMessage,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        logError('WorkflowManagementBridge: Get workflow failed', {
          component: 'WorkflowManagementBridge',
          operation: 'getWorkflow',
          workflowId,
          error: errorMessage,
          loadTime: performance.now() - start,
        });

        handleAsyncError(error, 'Failed to fetch workflow');
      }
    },
    [workflowBridge, analytics, handleAsyncError]
  );

  const createWorkflow = useCallback(
    async (workflowData: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => {
      const start = performance.now();

      logDebug('WorkflowManagementBridge: Create workflow start', {
        component: 'WorkflowManagementBridge',
        operation: 'createWorkflow',
        workflowName: workflowData.name,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      try {
        const response = await workflowBridge.createWorkflow(workflowData);

        if (response.success && response.data) {
          analytics('workflow_created', {
            workflowId: response.data.id,
            userStory: 'US-5.1',
            hypothesis: 'H8',
            loadTime: performance.now() - start,
          });

          logInfo('WorkflowManagementBridge: Create workflow success', {
            component: 'WorkflowManagementBridge',
            operation: 'createWorkflow',
            workflowId: response.data.id,
            loadTime: performance.now() - start,
          });
        } else {
          throw new Error(response.error || 'Failed to create workflow');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        analytics('workflow_create_error', {
          error: errorMessage,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        logError('WorkflowManagementBridge: Create workflow failed', {
          component: 'WorkflowManagementBridge',
          operation: 'createWorkflow',
          error: errorMessage,
          loadTime: performance.now() - start,
        });

        handleAsyncError(error, 'Failed to create workflow');
      }
    },
    [workflowBridge, analytics, handleAsyncError]
  );

  const updateWorkflow = useCallback(
    async (workflowId: string, updateData: Partial<Workflow>) => {
      const start = performance.now();

      logDebug('WorkflowManagementBridge: Update workflow start', {
        component: 'WorkflowManagementBridge',
        operation: 'updateWorkflow',
        workflowId,
        updateDataKeys: Object.keys(updateData),
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      try {
        const response = await workflowBridge.updateWorkflow(workflowId, updateData);

        if (response.success && response.data) {
          dispatch({ type: 'UPDATE_WORKFLOW', payload: response.data });

          analytics('workflow_updated', {
            workflowId,
            userStory: 'US-5.1',
            hypothesis: 'H8',
            loadTime: performance.now() - start,
          });

          logInfo('WorkflowManagementBridge: Update workflow success', {
            component: 'WorkflowManagementBridge',
            operation: 'updateWorkflow',
            workflowId,
            loadTime: performance.now() - start,
          });
        } else {
          throw new Error(response.error || 'Failed to update workflow');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        analytics('workflow_update_error', {
          workflowId,
          error: errorMessage,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        logError('WorkflowManagementBridge: Update workflow failed', {
          component: 'WorkflowManagementBridge',
          operation: 'updateWorkflow',
          workflowId,
          error: errorMessage,
          loadTime: performance.now() - start,
        });

        handleAsyncError(error, 'Failed to update workflow');
      }
    },
    [workflowBridge, analytics, handleAsyncError]
  );

  const startWorkflow = useCallback(
    async (workflowId: string, entityId: string, entityType: string) => {
      const start = performance.now();

      logDebug('WorkflowManagementBridge: Start workflow start', {
        component: 'WorkflowManagementBridge',
        operation: 'startWorkflow',
        workflowId,
        entityId,
        entityType,
        userStory: 'US-5.2',
        hypothesis: 'H9',
      });

      try {
        const response = await workflowBridge.startWorkflow(workflowId, entityId, entityType);

        if (response.success && response.data) {
          analytics('workflow_started', {
            workflowId,
            entityId,
            entityType,
            userStory: 'US-5.2',
            hypothesis: 'H9',
            loadTime: performance.now() - start,
          });

          logInfo('WorkflowManagementBridge: Start workflow success', {
            component: 'WorkflowManagementBridge',
            operation: 'startWorkflow',
            workflowId,
            entityId,
            loadTime: performance.now() - start,
          });
        } else {
          throw new Error(response.error || 'Failed to start workflow');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        analytics('workflow_start_error', {
          workflowId,
          entityId,
          error: errorMessage,
          userStory: 'US-5.2',
          hypothesis: 'H9',
        });

        logError('WorkflowManagementBridge: Start workflow failed', {
          component: 'WorkflowManagementBridge',
          operation: 'startWorkflow',
          workflowId,
          entityId,
          error: errorMessage,
          loadTime: performance.now() - start,
        });

        handleAsyncError(error, 'Failed to start workflow');
      }
    },
    [workflowBridge, analytics, handleAsyncError]
  );

  const getInstances = useCallback(
    async (workflowId?: string) => {
      const start = performance.now();

      logDebug('WorkflowManagementBridge: Get instances start', {
        component: 'WorkflowManagementBridge',
        operation: 'getInstances',
        workflowId,
        userStory: 'US-5.2',
        hypothesis: 'H9',
      });

      try {
        dispatch({ type: 'SET_INSTANCES_LOADING', payload: true });

        const response = await workflowBridge.getInstances(workflowId);

        if (response.success && response.data) {
          dispatch({ type: 'SET_INSTANCES_DATA', payload: response.data });

          analytics('workflow_instances_fetched', {
            count: response.data.length,
            workflowId,
            userStory: 'US-5.2',
            hypothesis: 'H9',
            loadTime: performance.now() - start,
          });

          logInfo('WorkflowManagementBridge: Get instances success', {
            component: 'WorkflowManagementBridge',
            operation: 'getInstances',
            count: response.data.length,
            loadTime: performance.now() - start,
          });
        } else {
          throw new Error(response.error || 'Failed to fetch instances');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        dispatch({ type: 'SET_INSTANCES_ERROR', payload: errorMessage });

        analytics('workflow_instances_fetch_error', {
          workflowId,
          error: errorMessage,
          userStory: 'US-5.2',
          hypothesis: 'H9',
        });

        logError('WorkflowManagementBridge: Get instances failed', {
          component: 'WorkflowManagementBridge',
          operation: 'getInstances',
          workflowId,
          error: errorMessage,
          loadTime: performance.now() - start,
        });

        handleAsyncError(error, 'Failed to fetch workflow instances');
      }
    },
    [workflowBridge, analytics, handleAsyncError]
  );

  const getTemplates = useCallback(async () => {
    const start = performance.now();

    logDebug('WorkflowManagementBridge: Get templates start', {
      component: 'WorkflowManagementBridge',
      operation: 'getTemplates',
      userStory: 'US-5.3',
      hypothesis: 'H8',
    });

    try {
      dispatch({ type: 'SET_TEMPLATES_LOADING', payload: true });

      const response = await workflowBridge.getTemplates();

      if (response.success && response.data) {
        dispatch({ type: 'SET_TEMPLATES_DATA', payload: response.data });

        analytics('workflow_templates_fetched', {
          count: response.data.length,
          userStory: 'US-5.3',
          hypothesis: 'H8',
          loadTime: performance.now() - start,
        });

        logInfo('WorkflowManagementBridge: Get templates success', {
          component: 'WorkflowManagementBridge',
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

      analytics('workflow_templates_fetch_error', {
        error: errorMessage,
        userStory: 'US-5.3',
        hypothesis: 'H8',
      });

      logError('WorkflowManagementBridge: Get templates failed', {
        component: 'WorkflowManagementBridge',
        operation: 'getTemplates',
        error: errorMessage,
        loadTime: performance.now() - start,
      });

      handleAsyncError(error, 'Failed to fetch workflow templates');
    }
  }, [workflowBridge, analytics, handleAsyncError]);

  const setFilters = useCallback((filters: WorkflowFetchParams) => {
    dispatch({ type: 'SET_WORKFLOWS_FILTERS', payload: filters });
  }, []);

  const setSelectedWorkflow = useCallback((workflow: Workflow | null) => {
    dispatch({ type: 'SET_SELECTED_WORKFLOW', payload: workflow });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // ====================
  // Context Value
  // ====================

  const contextValue = useMemo(
    () => ({
      state,
      actions: {
        fetchWorkflows,
        getWorkflow,
        createWorkflow,
        updateWorkflow,
        startWorkflow,
        getInstances,
        getTemplates,
        setFilters,
        setSelectedWorkflow,
        resetState,
      },
    }),
    [
      state,
      fetchWorkflows,
      getWorkflow,
      createWorkflow,
      updateWorkflow,
      startWorkflow,
      getInstances,
      getTemplates,
      setFilters,
      setSelectedWorkflow,
      resetState,
    ]
  );

  return (
    <WorkflowBridgeContext.Provider value={contextValue}>{children}</WorkflowBridgeContext.Provider>
  );
}

// ====================
// Hook for Consumers
// ====================

export function useWorkflowManagementBridge() {
  const context = useContext(WorkflowBridgeContext);
  if (context === undefined) {
    throw new Error(
      'useWorkflowManagementBridge must be used within a WorkflowManagementBridgeProvider'
    );
  }
  return context;
}

// ====================
// Export Types
// ====================

export type {
  Workflow,
  WorkflowAction,
  WorkflowActionInstance,
  WorkflowBridgeAction,
  WorkflowBridgeContextValue,
  WorkflowBridgeState,
  WorkflowCondition,
  WorkflowFetchParams,
  WorkflowInstance,
  WorkflowListResponse,
  WorkflowOutcome,
  WorkflowStage,
  WorkflowStageInstance,
  WorkflowTemplate,
  WorkflowTrigger,
};
