'use client';

/**
 * PosalPro MVP2 - Approval Queue Component
 * Based on APPROVAL_WORKFLOW_SCREEN.md wireframe specifications
 * Implements intelligent task prioritization and queue management
 *
 * User Stories: US-4.3
 * Hypotheses: H7 (40% on-time improvement)
 * Component Traceability: ApprovalQueue, manageQueue(), calculatePriority()
 */

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Progress } from '@/components/ui/Progress';
import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.3'],
  acceptanceCriteria: ['AC-4.3.1', 'AC-4.3.2', 'AC-4.3.3'],
  methods: ['manageQueue()', 'calculatePriority()', 'updateStatus()'],
  hypotheses: ['H7'],
  testCases: ['TC-H7-002', 'TC-H7-003'],
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

interface QueueMetrics {
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
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
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
    showMyTasksOnly: true,
  });
  const [sortBy, setSortBy] = useState<'priority' | 'deadline' | 'sla' | 'complexity'>('priority');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'timeline'>('list');

  // Mock data for demonstration - in production, fetch from API
  const MOCK_QUEUE_ITEMS: QueueItem[] = useMemo(
    () => [
      {
        id: 'queue-001',
        workflowId: 'WF-1024',
        proposalId: 'P-1001',
        proposalName: 'Enterprise IT Solution',
        client: 'TechCorp Inc.',
        currentStage: 'Finance Review',
        stageType: 'Finance',
        assignee: 'Michael Rodriguez',
        priority: 'High',
        urgency: 'Today',
        complexity: 8,
        estimatedDuration: 3,
        deadline: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        slaRemaining: 1.5,
        status: 'Pending',
        riskLevel: 'Medium',
        dependencies: ['Technical Review'],
        collaborators: ['Sarah Chen', 'Dr. Emily Watson'],
        lastActivity: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        proposalValue: 350000,
        isOverdue: false,
        isCriticalPath: true,
        escalationLevel: 1,
        reviewCycles: 2,
        requiredActions: ['Budget approval', 'Risk assessment'],
        attachments: 3,
      },
      {
        id: 'queue-002',
        workflowId: 'WF-1025',
        proposalId: 'P-1002',
        proposalName: 'Security Audit Package',
        client: 'SecureBank Corp',
        currentStage: 'Legal Review',
        stageType: 'Legal',
        assignee: 'Jennifer Park',
        priority: 'Critical',
        urgency: 'Immediate',
        complexity: 9,
        estimatedDuration: 4,
        deadline: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
        slaRemaining: 0.5,
        status: 'Escalated',
        riskLevel: 'Critical',
        dependencies: [],
        collaborators: ['Legal Team', 'Compliance Officer'],
        lastActivity: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        proposalValue: 750000,
        isOverdue: false,
        isCriticalPath: true,
        escalationLevel: 2,
        reviewCycles: 3,
        requiredActions: ['Compliance verification', 'Contract review'],
        attachments: 7,
      },
      {
        id: 'queue-003',
        workflowId: 'WF-1026',
        proposalId: 'P-1003',
        proposalName: 'Cloud Migration Services',
        client: 'StartupTech Ltd',
        currentStage: 'Technical Review',
        stageType: 'Technical',
        assignee: 'Alex Thompson',
        priority: 'Medium',
        urgency: 'This Week',
        complexity: 6,
        estimatedDuration: 2,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        slaRemaining: 8,
        status: 'In Review',
        riskLevel: 'Low',
        dependencies: [],
        collaborators: ['Cloud Architect'],
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        proposalValue: 125000,
        isOverdue: false,
        isCriticalPath: false,
        escalationLevel: 0,
        reviewCycles: 1,
        requiredActions: ['Architecture validation'],
        attachments: 2,
      },
    ],
    []
  );

  useEffect(() => {
    setQueueItems(MOCK_QUEUE_ITEMS);
  }, [MOCK_QUEUE_ITEMS]);

  // AC-4.3.1: Intelligent task prioritization algorithm
  const prioritizeQueue = useCallback((items: QueueItem[]): QueueItem[] => {
    return items.sort((a, b) => {
      // Priority scoring algorithm
      let scoreA = 0;
      let scoreB = 0;

      // Urgency weight (40%)
      const urgencyWeight = 0.4;
      const urgencyScore = {
        Immediate: 10,
        Today: 8,
        'This Week': 5,
        'Next Week': 2,
      };
      scoreA += (urgencyScore[a.urgency] || 0) * urgencyWeight;
      scoreB += (urgencyScore[b.urgency] || 0) * urgencyWeight;

      // SLA compliance weight (30%)
      const slaWeight = 0.3;
      const slaUrgencyA = Math.max(0, 10 - a.slaRemaining);
      const slaUrgencyB = Math.max(0, 10 - b.slaRemaining);
      scoreA += slaUrgencyA * slaWeight;
      scoreB += slaUrgencyB * slaWeight;

      // Business value weight (20%)
      const valueWeight = 0.2;
      const valueScoreA = Math.min(10, a.proposalValue / 100000);
      const valueScoreB = Math.min(10, b.proposalValue / 100000);
      scoreA += valueScoreA * valueWeight;
      scoreB += valueScoreB * valueWeight;

      // Critical path weight (10%)
      const criticalWeight = 0.1;
      if (a.isCriticalPath) scoreA += 10 * criticalWeight;
      if (b.isCriticalPath) scoreB += 10 * criticalWeight;

      // Risk escalation bonus
      if (a.escalationLevel > 0) scoreA += a.escalationLevel * 2;
      if (b.escalationLevel > 0) scoreB += b.escalationLevel * 2;

      return scoreB - scoreA; // Higher scores first
    });
  }, []);

  // AC-4.3.2: Advanced filtering and sorting
  const filteredAndSortedItems = useMemo(() => {
    let filtered = queueItems.filter(item => {
      // Assignee filter
      if (filters.assignee.length > 0 && !filters.assignee.includes(item.assignee)) {
        return false;
      }

      // Priority filter
      if (filters.priority.length > 0 && !filters.priority.includes(item.priority)) {
        return false;
      }

      // Stage type filter
      if (filters.stageType.length > 0 && !filters.stageType.includes(item.stageType)) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(item.status)) {
        return false;
      }

      // Risk level filter
      if (filters.riskLevel.length > 0 && !filters.riskLevel.includes(item.riskLevel)) {
        return false;
      }

      // Urgency filter
      if (filters.urgency.length > 0 && !filters.urgency.includes(item.urgency)) {
        return false;
      }

      // Special filters
      if (filters.showOverdueOnly && !item.isOverdue) return false;
      if (filters.showCriticalPathOnly && !item.isCriticalPath) return false;
      if (filters.showMyTasksOnly && item.assignee !== currentUser) return false;

      return true;
    });

    // Apply intelligent prioritization
    if (sortBy === 'priority') {
      filtered = prioritizeQueue(filtered);
    } else {
      // Manual sorting options
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'deadline':
            return a.deadline.getTime() - b.deadline.getTime();
          case 'sla':
            return a.slaRemaining - b.slaRemaining;
          case 'complexity':
            return b.complexity - a.complexity;
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [queueItems, filters, sortBy, prioritizeQueue, currentUser]);

  // AC-4.3.3: Queue performance metrics
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

  // Track queue metrics for H7 hypothesis validation
  useEffect(() => {
    onQueueOptimization(queueMetrics);

    // Track analytics for H7 hypothesis
    console.log('Analytics: approval_queue_metrics', {
      totalItems: queueMetrics.totalItems,
      overdueItems: queueMetrics.overdueItems,
      slaComplianceRate: queueMetrics.slaComplianceRate,
      productivityScore: queueMetrics.productivityScore,
      bottleneckStages: queueMetrics.bottleneckStages.length,
      escalationRate: queueMetrics.escalationRate,
      timestamp: Date.now(),
    });
  }, [queueMetrics, onQueueOptimization]);

  const handleItemSelection = useCallback((itemId: string, selected: boolean) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      if (selected) {
        newSelection.add(itemId);
      } else {
        newSelection.delete(itemId);
      }
      return newSelection;
    });
  }, []);

  const handleBulkAction = useCallback(
    (action: string) => {
      const selectedItemsArray = queueItems.filter(item => selectedItems.has(item.id));
      onBulkAction(action, selectedItemsArray);

      // Track bulk action analytics
      console.log('Analytics: approval_queue_bulk_action', {
        action,
        itemCount: selectedItemsArray.length,
        timestamp: Date.now(),
      });

      setSelectedItems(new Set());
    },
    [queueItems, selectedItems, onBulkAction]
  );

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
            Approval Queue ({filteredAndSortedItems.length} items)
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
              onChange={e => setSortBy(e.target.value as any)}
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
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Bulk Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('escalate')}>
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
          {filteredAndSortedItems.map((item, index) => (
            <div
              key={item.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedItems.has(item.id) ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'
              } ${item.isOverdue ? 'border-red-200' : 'border-gray-200'}`}
              onClick={() => onItemSelect(item)}
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

        {filteredAndSortedItems.length === 0 && (
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
