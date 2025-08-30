'use client';

/**
 * PosalPro MVP2 - Approval Queue Component
 * Refactored to use React Query following gold standard patterns
 * Performance optimized with structured logging, error handling, and analytics
 *
 * User Stories: US-4.3
 * Hypotheses: H7 (40% on-time improvement)
 * Component Traceability: ApprovalQueue, manageQueue(), calculatePriority()
 */

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Progress } from '@/components/ui/Progress';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/hooks/useApiClient';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { logDebug, logInfo, logWarn, logError } from '@/lib/logger';
import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useMemo, useState, useEffect } from 'react';

// Query key factory following gold standard pattern
const APPROVAL_QUEUE_QUERY_KEYS = {
  all: ['approval-queue'] as const,
  lists: () => [...APPROVAL_QUEUE_QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...APPROVAL_QUEUE_QUERY_KEYS.lists(), { filters }] as const,
  stats: () => [...APPROVAL_QUEUE_QUERY_KEYS.all, 'stats'] as const,
  item: (id: string) => [...APPROVAL_QUEUE_QUERY_KEYS.all, 'item', id] as const,
};

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.3'],
  acceptanceCriteria: ['AC-4.3.1', 'AC-4.3.3'],
  methods: ['manageQueue()', 'calculatePriority()', 'trackApprovalEfficiency()'],
  hypotheses: ['H7'],
  testCases: ['TC-H7-003', 'TC-H7-004'],
};

// Types for approval queue management
interface QueueItem {
  id: string;
  workflowId: string;
  proposalId: string;
  proposalName: string;
  client: string;
  currentStage: string;
  stageType: 'Technical' | 'Legal' | 'Finance' | 'Executive' | 'Security' | 'Compliance';
  assignee: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  urgency: 'Immediate' | 'Today' | 'This Week' | 'Next Week';
  complexity: number;
  estimatedDuration: number;
  deadline: Date;
  slaRemaining: number; // Hours remaining in SLA
  status: 'Pending' | 'In Review' | 'Needs Info' | 'Escalated' | 'Blocked';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  dependencies: string[];
  collaborators: string[];
  lastActivity: Date;
  proposalValue: number;
  isOverdue: boolean;
  isCriticalPath: boolean;
  escalationLevel: number;
  reviewCycles: number;
  requiredActions: string[];
  attachments: number;
}

interface QueueFilters {
  assignee: string[];
  priority: string[];
  stageType: string[];
  status: string[];
  riskLevel: string[];
  urgency: string[];
  showOverdueOnly: boolean;
  showCriticalPathOnly: boolean;
  showMyTasksOnly: boolean;
}

export interface QueueMetrics {
  totalItems: number;
  overdueItems: number;
  criticalItems: number;
  avgProcessingTime: number;
  slaComplianceRate: number;
  bottleneckStages: string[];
  productivityScore: number;
  escalationRate: number;
}

interface ApprovalQueueProps {
  currentUser: string;
  onItemSelect: (item: QueueItem) => void;
  onBulkAction: (action: string, items: QueueItem[]) => void;
  onQueueOptimization: (metrics: QueueMetrics) => void;
}

export function ApprovalQueue({
  currentUser,
  onItemSelect,
  onBulkAction,
  onQueueOptimization,
}: ApprovalQueueProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<QueueFilters>({
    assignee: [],
    priority: [],
    stageType: [],
    status: [],
    riskLevel: [],
    urgency: [],
    showOverdueOnly: false,
    showCriticalPathOnly: false,
    showMyTasksOnly: false,
  });
  const [sortBy, setSortBy] = useState<'priority' | 'deadline' | 'sla' | 'complexity'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  const { trackOptimized } = useOptimizedAnalytics();
  const errorHandlingService = ErrorHandlingService.getInstance();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  // React Query: Fetch approval queue items
  const {
    data: queueData,
    error: queueError,
    isLoading,
    refetch: refetchQueue
  } = useQuery({
    queryKey: APPROVAL_QUEUE_QUERY_KEYS.list({ currentUser, filters, sortBy, sortOrder }),
    queryFn: async (): Promise<QueueItem[]> => {
      logDebug('Fetch approval queue start', {
        component: 'ApprovalQueue',
        operation: 'fetchQueueItems',
        currentUser,
        filters,
        sortBy,
        sortOrder
      });

      try {
        const startTime = Date.now();
        const response = await apiClient.get('/api/approval-queue');
        const loadTime = Date.now() - startTime;

        const apiResponse = response as any;
        const items: QueueItem[] = (apiResponse?.items || []).map((item: any) => ({
          ...item,
          deadline: new Date(item.deadline),
          lastActivity: new Date(item.lastActivity),
        }));

        logInfo('Fetch approval queue success', {
          component: 'ApprovalQueue',
          operation: 'fetchQueueItems',
          loadTime,
          itemCount: items.length,
          currentUser
        });

        return items;
      } catch (error) {
        logError('Fetch approval queue failed', error, {
          component: 'ApprovalQueue',
          operation: 'fetchQueueItems',
          currentUser,
          filters,
          sortBy,
          sortOrder
        });
        throw error;
      }
    },
    staleTime: 30000, // 30 seconds
    gcTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // React Query: Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, items }: { action: string; items: QueueItem[] }) => {
      logDebug('Bulk action start', {
        component: 'ApprovalQueue',
        operation: 'bulkAction',
        action,
        itemCount: items.length,
        itemIds: items.map(item => item.id)
      });

      try {
        const startTime = Date.now();
        const response = await apiClient.post('/api/approval-queue/bulk-action', {
          action,
          itemIds: items.map(item => item.id),
        });
        const loadTime = Date.now() - startTime;

        logInfo('Bulk action success', {
          component: 'ApprovalQueue',
          operation: 'bulkAction',
          action,
          loadTime,
          itemCount: items.length
        });

        return response;
      } catch (error) {
        logError('Bulk action failed', error, {
          component: 'ApprovalQueue',
          operation: 'bulkAction',
          action,
          itemCount: items.length
        });
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch queue data
      queryClient.invalidateQueries({ queryKey: APPROVAL_QUEUE_QUERY_KEYS.all });

      trackOptimized('approval_bulk_action_success', {
        action: variables.action,
        itemCount: variables.items.length,
        userStory: COMPONENT_MAPPING.userStories[0],
        hypothesis: COMPONENT_MAPPING.hypotheses[0]
      }, 'medium');
    },
    onError: (error, variables) => {
      errorHandlingService.processError(
        error,
        `Failed to perform bulk action: ${variables.action}`,
        ErrorCodes.API.REQUEST_FAILED,
        {
          component: 'ApprovalQueue',
          operation: 'bulkAction',
          action: variables.action,
          itemCount: variables.items.length
        }
      );
    },
  });

  // Handle React Query errors
  useEffect(() => {
    if (queueError) {
      errorHandlingService.processError(
        queueError,
        'Failed to load approval queue',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'ApprovalQueue',
          operation: 'fetchQueueItems',
          currentUser,
          userStory: COMPONENT_MAPPING.userStories[0],
          hypothesis: COMPONENT_MAPPING.hypotheses[0]
        }
      );
    }
  }, [queueError, errorHandlingService, currentUser]);

  // Get queue items from React Query data
  const queueItems = queueData || [];

  // Calculate priority score for sorting
  const calculatePriority = useCallback((item: QueueItem) => {
    let score = 0;

    // Priority scoring
    switch (item.priority) {
      case 'Critical':
        score += 100;
        break;
      case 'High':
        score += 75;
        break;
      case 'Medium':
        score += 50;
        break;
      case 'Low':
        score += 25;
        break;
    }

    // Urgency scoring
    switch (item.urgency) {
      case 'Immediate':
        score += 50;
        break;
      case 'Today':
        score += 40;
        break;
      case 'This Week':
        score += 20;
        break;
      case 'Next Week':
        score += 10;
        break;
    }

    // SLA remaining scoring
    if (item.slaRemaining < 2) score += 30;
    else if (item.slaRemaining < 8) score += 20;
    else if (item.slaRemaining < 24) score += 10;

    // Overdue penalty
    if (item.isOverdue) score += 50;

    // Critical path bonus
    if (item.isCriticalPath) score += 25;

    return score;
  }, []);

  // Apply client-side filtering and sorting
  const filteredItems = useMemo(() => {
    let filtered = [...queueItems];

    // Apply filters
    if (filters.showMyTasksOnly) {
      filtered = filtered.filter(item => item.assignee === currentUser);
    }
    if (filters.showOverdueOnly) {
      filtered = filtered.filter(item => item.isOverdue);
    }
    if (filters.showCriticalPathOnly) {
      filtered = filtered.filter(item => item.isCriticalPath);
    }
    if (filters.priority.length > 0) {
      filtered = filtered.filter(item => filters.priority.includes(item.priority));
    }
    if (filters.stageType.length > 0) {
      filtered = filtered.filter(item => filters.stageType.includes(item.stageType));
    }
    if (filters.status.length > 0) {
      filtered = filtered.filter(item => filters.status.includes(item.status));
    }
    if (filters.riskLevel.length > 0) {
      filtered = filtered.filter(item => filters.riskLevel.includes(item.riskLevel));
    }
    if (filters.urgency.length > 0) {
      filtered = filtered.filter(item => filters.urgency.includes(item.urgency));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'priority':
          aValue = calculatePriority(a);
          bValue = calculatePriority(b);
          break;
        case 'deadline':
          aValue = a.deadline.getTime();
          bValue = b.deadline.getTime();
          break;
        case 'sla':
          aValue = a.slaRemaining;
          bValue = b.slaRemaining;
          break;
        case 'complexity':
          aValue = a.complexity;
          bValue = b.complexity;
          break;
        default:
          aValue = calculatePriority(a);
          bValue = calculatePriority(b);
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [queueItems, filters, sortBy, sortOrder, currentUser, calculatePriority]);

  // Calculate queue metrics
  const queueMetrics = useMemo((): QueueMetrics => {
    const totalItems = queueItems.length;
    const overdueItems = queueItems.filter(item => item.isOverdue).length;
    const criticalItems = queueItems.filter(
      item => item.priority === 'Critical' || item.urgency === 'Immediate'
    ).length;

    const avgProcessingTime =
      queueItems.reduce((sum, item) => sum + item.estimatedDuration, 0) / totalItems || 0;

    const slaCompliantItems = queueItems.filter(item => item.slaRemaining > 0).length;
    const slaComplianceRate = (slaCompliantItems / totalItems) * 100 || 0;

    const stageGroups = queueItems.reduce(
      (acc, item) => {
        acc[item.stageType] = (acc[item.stageType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const bottleneckStages = Object.entries(stageGroups)
      .filter(([_, count]) => count > 2)
      .map(([stage]) => stage);

    const escalatedItems = queueItems.filter(item => item.escalationLevel > 0).length;
    const escalationRate = (escalatedItems / totalItems) * 100 || 0;

    // Productivity score based on SLA compliance and processing efficiency
    const productivityScore = Math.max(0, 100 - escalationRate - (100 - slaComplianceRate));

    return {
      totalItems,
      overdueItems,
      criticalItems,
      avgProcessingTime,
      slaComplianceRate,
      bottleneckStages,
      productivityScore,
      escalationRate,
    };
  }, [queueItems]);

  // Notify parent of queue optimization metrics
  useEffect(() => {
    onQueueOptimization(queueMetrics);
  }, [queueMetrics, onQueueOptimization]);

  // Event handlers
  const handleItemSelect = useCallback(
    (item: QueueItem) => {
      onItemSelect(item);
      trackOptimized('approval_item_selected', {
        itemId: item.id,
        proposalId: item.proposalId,
        stageType: item.stageType,
        priority: item.priority,
        userStory: COMPONENT_MAPPING.userStories[0],
        hypothesis: COMPONENT_MAPPING.hypotheses[0]
      }, 'medium');
    },
    [onItemSelect, trackOptimized]
  );

  const handleBulkAction = useCallback(
    (action: string) => {
      const selectedItemsList = queueItems.filter(item => selectedItems.has(item.id));

      // Execute bulk action through mutation
      bulkActionMutation.mutate({ action, items: selectedItemsList });

      // Also call parent handler for immediate UI updates
      onBulkAction(action, selectedItemsList);
      setSelectedItems(new Set());
    },
    [queueItems, selectedItems, onBulkAction, bulkActionMutation]
  );

  const handleSortChange = useCallback(
    (newSortBy: 'priority' | 'deadline' | 'sla' | 'complexity') => {
      setSortBy(newSortBy);
      trackOptimized('approval_queue_sort_changed', {
        sortBy: newSortBy,
        sortOrder,
        userStory: COMPONENT_MAPPING.userStories[0],
        hypothesis: COMPONENT_MAPPING.hypotheses[0]
      }, 'low');
    },
    [sortOrder, trackOptimized]
  );

  // Handle item selection for bulk actions
  const handleItemSelection = useCallback((itemId: string, isSelected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  }, []);

  // Utility functions for styling
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'Immediate':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'Today':
        return <ClockIcon className="h-4 w-4 text-orange-500" />;
      case 'This Week':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Review':
        return 'bg-blue-100 text-blue-800';
      case 'Needs Info':
        return 'bg-orange-100 text-orange-800';
      case 'Escalated':
        return 'bg-red-100 text-red-800';
      case 'Blocked':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (queueError) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load approval queue</h3>
          <p className="text-gray-600 mb-6">
            There was an error loading the approval queue. Please try again.
          </p>
          <Button
            variant="primary"
            onClick={() => refetchQueue()}
            disabled={isLoading}
          >
            {isLoading ? 'Retrying...' : 'Retry'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Queue Metrics Dashboard */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Approval Queue Metrics</h3>
          <div className="flex items-center gap-2">
            <Badge variant={queueMetrics.productivityScore > 80 ? 'success' : 'warning'}>
              Productivity: {queueMetrics.productivityScore.toFixed(0)}%
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{queueMetrics.totalItems}</div>
            <div className="text-sm text-gray-600">Total Items</div>
            {queueMetrics.criticalItems > 0 && (
              <div className="text-xs text-red-600 mt-1">{queueMetrics.criticalItems} critical</div>
            )}
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {queueMetrics.slaComplianceRate.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">SLA Compliance</div>
            <Progress
              value={queueMetrics.slaComplianceRate}
              className="h-2 mt-2"
              variant={queueMetrics.slaComplianceRate > 90 ? 'success' : 'warning'}
            />
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {queueMetrics.avgProcessingTime.toFixed(1)}h
            </div>
            <div className="text-sm text-gray-600">Avg Processing</div>
            <div className="text-xs text-gray-500 mt-1">per approval stage</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{queueMetrics.overdueItems}</div>
            <div className="text-sm text-gray-600">Overdue Items</div>
            {queueMetrics.escalationRate > 10 && (
              <div className="text-xs text-red-600 mt-1">
                {queueMetrics.escalationRate.toFixed(0)}% escalation rate
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Queue Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Approval Queue ({filteredItems.length} items)
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <FunnelIcon className="h-4 w-4" />
              Filters
            </Button>

            <select
              value={sortBy}
              onChange={e => handleSortChange(e.target.value as 'priority' | 'deadline' | 'sla' | 'complexity')}
              className="px-3 py-1 border border-gray-200 rounded-md text-sm"
            >
              <option value="priority">Smart Priority</option>
              <option value="deadline">Deadline</option>
              <option value="sla">SLA Remaining</option>
              <option value="complexity">Complexity</option>
            </select>

            {selectedItems.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{selectedItems.size} selected</span>
                <Button
                  size="sm"
                  onClick={() => handleBulkAction('approve')}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={bulkActionMutation.isPending}
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  {bulkActionMutation.isPending ? 'Processing...' : 'Bulk Approve'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('escalate')}
                  disabled={bulkActionMutation.isPending}
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                  Escalate
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <div className="space-y-1">
                  {['Critical', 'High', 'Medium', 'Low'].map(priority => (
                    <label key={priority} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.priority.includes(priority)}
                        onChange={e => {
                          const newPriority = e.target.checked
                            ? [...filters.priority, priority]
                            : filters.priority.filter(p => p !== priority);
                          setFilters(prev => ({ ...prev, priority: newPriority }));
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{priority}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stage Type</label>
                <div className="space-y-1">
                  {['Technical', 'Legal', 'Finance', 'Executive'].map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.stageType.includes(type)}
                        onChange={e => {
                          const newTypes = e.target.checked
                            ? [...filters.stageType, type]
                            : filters.stageType.filter(t => t !== type);
                          setFilters(prev => ({ ...prev, stageType: newTypes }));
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Filters
                </label>
                <div className="space-y-1">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.showMyTasksOnly}
                      onChange={e =>
                        setFilters(prev => ({
                          ...prev,
                          showMyTasksOnly: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">My Tasks Only</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.showCriticalPathOnly}
                      onChange={e =>
                        setFilters(prev => ({
                          ...prev,
                          showCriticalPathOnly: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">Critical Path Only</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.showOverdueOnly}
                      onChange={e =>
                        setFilters(prev => ({
                          ...prev,
                          showOverdueOnly: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">Overdue Only</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Queue Items List */}
        <div className="space-y-3">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedItems.has(item.id) ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'
              } ${item.isOverdue ? 'border-red-200' : 'border-gray-200'}`}
              onClick={() => handleItemSelect(item)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={e => {
                      e.stopPropagation();
                      handleItemSelection(item.id, e.target.checked);
                    }}
                    className="mt-1"
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-medium text-gray-900">{item.proposalName}</div>
                      <Badge size="sm" className={`border ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </Badge>
                      {item.isCriticalPath && (
                        <Badge size="sm" variant="warning">
                          Critical Path
                        </Badge>
                      )}
                      {item.escalationLevel > 0 && (
                        <Badge size="sm" variant="destructive">
                          Escalated L{item.escalationLevel}
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      {item.client} • {item.currentStage} • {item.assignee}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Deadline</div>
                        <div
                          className={`font-medium ${
                            item.slaRemaining < 2 ? 'text-red-600' : 'text-gray-900'
                          }`}
                        >
                          {item.deadline.toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">SLA Remaining</div>
                        <div
                          className={`font-medium ${
                            item.slaRemaining < 2 ? 'text-red-600' : 'text-gray-900'
                          }`}
                        >
                          {item.slaRemaining.toFixed(1)}h
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Status</div>
                        <Badge size="sm" className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-gray-500">Value</div>
                        <div className="font-medium">
                          ${(item.proposalValue / 1000).toFixed(0)}K
                        </div>
                      </div>
                    </div>

                    {item.requiredActions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Required Actions:</div>
                        <div className="flex flex-wrap gap-1">
                          {item.requiredActions.map((action, idx) => (
                            <Badge key={idx} size="sm" variant="outline">
                              {action}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getUrgencyIcon(item.urgency)}
                  <div className="text-right">
                    <div className="text-sm font-medium">#{index + 1}</div>
                    <div className="text-xs text-gray-500">Queue Position</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No items in queue</h3>
            <p className="mt-2 text-sm text-gray-500">
              All approvals are up to date or filtered out.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
