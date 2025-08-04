/**
 * PosalPro MVP2 - Approval Workflow Interface
 * Based on APPROVAL_WORKFLOW_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H7 hypothesis validation
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/forms/Button';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useApiClient } from '@/hooks/useApiClient';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import {
  ArrowRightIcon,
  BellIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.3', 'AC-4.3.1', 'AC-4.3.3'],
  methods: [
    'complexityEstimation()',
    'calculatePriority()',
    'trackOnTimeCompletion()',
    'routeApproval()',
  ],
  hypotheses: ['H7'],
  testCases: ['TC-H7-001', 'TC-H7-002'],
};

// Approval status enumeration
enum ApprovalStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ESCALATED = 'escalated',
  DELEGATED = 'delegated',
  OVERDUE = 'overdue',
}

// Approval stage enumeration
enum ApprovalStage {
  TECHNICAL = 'technical',
  FINANCIAL = 'financial',
  LEGAL = 'legal',
  SECURITY = 'security',
  EXECUTIVE = 'executive',
  COMPLIANCE = 'compliance',
}

// Priority levels
enum Priority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// Decision types
enum DecisionType {
  APPROVE = 'approve',
  APPROVE_WITH_COMMENTS = 'approve_with_comments',
  REQUEST_CHANGES = 'request_changes',
  REJECT = 'reject',
  DELEGATE = 'delegate',
  ESCALATE = 'escalate',
}

// Workflow approval interface
interface WorkflowApproval {
  id: string;
  proposalId: string;
  proposalTitle: string;
  client: string;
  stage: ApprovalStage;
  status: ApprovalStatus;
  priority: Priority;
  assignedTo: string;
  assignedToRole: string;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  estimatedValue: number;
  currentStage: number;
  totalStages: number;
  slaHours: number;
  timeRemaining: number; // in hours
  riskLevel: 'low' | 'medium' | 'high';
  isParallel: boolean;
  dependsOn: string[];
  completedBy?: string;
  completedAt?: Date;
  decision?: DecisionType;
  comments?: string;
  nextStage?: ApprovalStage;
  workflowPath: string[];
  previousDecisions: ApprovalDecision[];
}

// Approval decision interface
interface ApprovalDecision {
  id: string;
  stage: ApprovalStage;
  approver: string;
  approverRole: string;
  decision: DecisionType;
  comments: string;
  timestamp: Date;
  timeToDecision: number; // in hours
  delegatedTo?: string;
}

// Filter state interface
interface FilterState {
  search: string;
  status: string;
  stage: string;
  priority: string;
  assignee: string;
  timeframe: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function ApprovalWorkflowDashboard() {
  const router = useRouter();
  const apiClient = useApiClient();
  const errorHandlingService = ErrorHandlingService.getInstance();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  const [approvals, setApprovals] = useState<WorkflowApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredApprovals, setFilteredApprovals] = useState<WorkflowApproval[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<WorkflowApproval | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    stage: 'all',
    priority: 'all',
    assignee: 'all',
    timeframe: 'all',
    sortBy: 'dueDate',
    sortOrder: 'desc',
  });

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use apiClient instead of direct fetch
        const data = await apiClient.get<WorkflowApproval[]>('approvals');
        setApprovals(data);

        // Track successful load with Component Traceability Matrix
        analytics('approval_workflow_loaded', {
          userStories: COMPONENT_MAPPING.userStories,
          acceptanceCriteria: COMPONENT_MAPPING.acceptanceCriteria,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          testCases: COMPONENT_MAPPING.testCases,
          approvalCount: data.length,
          timestamp: Date.now(),
        }, 'medium');
      } catch (err) {
        // Use standardized error handling
        const standardError = errorHandlingService.processError(
          err,
          'Failed to load approval workflow',
          ErrorCodes.DATA.FETCH_FAILED,
          {
            component: 'ApprovalWorkflowDashboard',
            operation: 'fetchApprovals',
            userStories: COMPONENT_MAPPING.userStories,
            acceptanceCriteria: COMPONENT_MAPPING.acceptanceCriteria,
            hypotheses: COMPONENT_MAPPING.hypotheses,
            testCases: COMPONENT_MAPPING.testCases,
            timestamp: Date.now(),
          }
        );

        const userFriendlyMessage = errorHandlingService.getUserFriendlyMessage(standardError);
        setError(userFriendlyMessage);

        // Track error analytics with Component Traceability Matrix
        analytics('approval_workflow_load_error', {
          userStories: COMPONENT_MAPPING.userStories,
          acceptanceCriteria: COMPONENT_MAPPING.acceptanceCriteria,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          testCases: COMPONENT_MAPPING.testCases,
          errorType: standardError.code,
          errorMessage: standardError.message,
          timestamp: Date.now(),
        }, 'high');
      } finally {
        setLoading(false);
      }
    };

    fetchApprovals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)

  useEffect(() => {
    let filtered = [...approvals];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        approval =>
          approval.proposalTitle.toLowerCase().includes(searchTerm) ||
          approval.client.toLowerCase().includes(searchTerm) ||
          approval.assignedTo.toLowerCase().includes(searchTerm)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(approval => approval.status === filters.status);
    }

    // Apply stage filter
    if (filters.stage !== 'all') {
      filtered = filtered.filter(approval => approval.stage === filters.stage);
    }

    // Apply priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(approval => approval.priority === filters.priority);
    }

    // Apply assignee filter
    if (filters.assignee !== 'all') {
      filtered = filtered.filter(approval => approval.assignedTo === filters.assignee);
    }

    // Apply timeframe filter
    if (filters.timeframe !== 'all') {
      const now = new Date();
      let cutoffHours = 0;

      switch (filters.timeframe) {
        case 'urgent':
          cutoffHours = 2;
          break;
        case 'today':
          cutoffHours = 24;
          break;
        case 'week':
          cutoffHours = 168;
          break;
      }

      if (cutoffHours > 0) {
        filtered = filtered.filter(approval => approval.timeRemaining <= cutoffHours);
      }
    }

    // Apply sort
    filtered.sort((a, b) => {
      const aVal = a[filters.sortBy as keyof WorkflowApproval];
      const bVal = b[filters.sortBy as keyof WorkflowApproval];

      if (aVal === undefined || bVal === undefined) return 0;
      if (aVal < bVal) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredApprovals(filtered);
  }, [approvals, filters]);

  const handleFilterChange = useCallback((filterName: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    trackAction('filter_changed', { filter: filterName, value });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      stage: 'all',
      priority: 'all',
      assignee: 'all',
      timeframe: 'all',
      sortBy: 'dueDate',
      sortOrder: 'desc',
    });
  }, []);

  const handleApprovalAction = useCallback((approvalId: string, decision: DecisionType) => {
    trackAction('approval_action', { approvalId, decision });
  }, []);

  const trackAction = useCallback((action: string, metadata: object = {}) => {
    console.log('Approval Workflow Analytics:', {
      action,
      metadata,
      timestamp: Date.now(),
    });
  }, []);

  useEffect(() => {
    trackAction('dashboard_viewed');
  }, []);

  // ✅ FIXED: Move useMemo before early returns to comply with Rules of Hooks
  const dashboardMetrics = useMemo(() => {
    const total = approvals.length;
    const pending = approvals.filter(a => a.status === ApprovalStatus.PENDING).length;
    const overdue = approvals.filter(a => a.timeRemaining < 0).length;
    const urgent = approvals.filter(a => a.priority === Priority.URGENT).length;
    const avgDecisionTime =
      approvals
        .flatMap(a => a.previousDecisions)
        .reduce((sum, dec) => sum + dec.timeToDecision, 0) /
        Math.max(approvals.flatMap(a => a.previousDecisions).length, 1) || 0;

    return {
      total,
      pending,
      overdue,
      urgent,
      avgDecisionTime: Math.round(avgDecisionTime * 10) / 10,
    };
  }, [approvals]);

  if (loading) {
    return <p>Loading approval workflow dashboard...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  // Render Functions
  const StatusBadge = ({ status }: { status: ApprovalStatus }) => {
    const getStatusStyle = (status: ApprovalStatus) => {
      switch (status) {
        case ApprovalStatus.PENDING:
          return 'bg-yellow-100 text-yellow-800';
        case ApprovalStatus.IN_PROGRESS:
          return 'bg-blue-100 text-blue-800';
        case ApprovalStatus.APPROVED:
          return 'bg-green-100 text-green-800';
        case ApprovalStatus.REJECTED:
          return 'bg-red-100 text-red-800';
        case ApprovalStatus.ESCALATED:
          return 'bg-orange-100 text-orange-800';
        case ApprovalStatus.DELEGATED:
          return 'bg-purple-100 text-purple-800';
        case ApprovalStatus.OVERDUE:
          return 'bg-red-100 text-red-800 animate-pulse';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(
          status
        )}`}
      >
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const PriorityIndicator = ({ priority }: { priority: Priority }) => {
    const getPriorityColor = (priority: Priority) => {
      switch (priority) {
        case Priority.URGENT:
          return 'text-red-600 animate-pulse';
        case Priority.HIGH:
          return 'text-red-600';
        case Priority.MEDIUM:
          return 'text-yellow-600';
        case Priority.LOW:
          return 'text-green-600';
        default:
          return 'text-gray-600';
      }
    };

    return (
      <span className={`text-sm font-medium ${getPriorityColor(priority)}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const WorkflowProgress = ({ approval }: { approval: WorkflowApproval }) => {
    const progressPercentage = (approval.currentStage / approval.totalStages) * 100;

    return (
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-600">
          {approval.currentStage}/{approval.totalStages}
        </span>
      </div>
    );
  };

  const TimeRemaining = ({ approval }: { approval: WorkflowApproval }) => {
    const isOverdue = approval.timeRemaining < 0;
    const isUrgent = approval.timeRemaining <= 2 && approval.timeRemaining > 0;

    return (
      <div className="flex items-center space-x-1">
        <ClockIcon
          className={`w-4 h-4 ${
            isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-gray-600'
          }`}
        />
        <span
          className={`text-sm ${
            isOverdue
              ? 'text-red-600 font-semibold'
              : isUrgent
                ? 'text-orange-600'
                : 'text-gray-600'
          }`}
        >
          {isOverdue
            ? `${Math.abs(approval.timeRemaining)}h overdue`
            : `${approval.timeRemaining}h left`}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Approval Workflows</h1>
              <p className="text-gray-600">Manage proposal approvals and track workflow progress</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                onClick={() => {
                  trackAction('view_workflow_analytics');
                  // Navigate to analytics dashboard
                }}
                className="flex items-center"
              >
                <ChartBarIcon className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  trackAction('create_workflow_template');
                  // Navigate to workflow template creation
                }}
                className="flex items-center"
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Approvals</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.total}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <ClockIcon className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.pending}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.overdue}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <BellIcon className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Urgent</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.urgent}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <ChartBarIcon className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Decision</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardMetrics.avgDecisionTime}h
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-5xl">
                {/* Search */}
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search proposals, clients, or approvers..."
                    value={filters.search}
                    onChange={e => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Status Filter */}
                <Select
                  value={filters.status}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'rejected', label: 'Rejected' },
                    { value: 'escalated', label: 'Escalated' },
                    { value: 'overdue', label: 'Overdue' },
                  ]}
                  onChange={(value: string) => handleFilterChange('status', value)}
                />

                {/* Stage Filter */}
                <Select
                  value={filters.stage}
                  options={[
                    { value: 'all', label: 'All Stages' },
                    { value: 'technical', label: 'Technical' },
                    { value: 'financial', label: 'Financial' },
                    { value: 'legal', label: 'Legal' },
                    { value: 'security', label: 'Security' },
                    { value: 'executive', label: 'Executive' },
                    { value: 'compliance', label: 'Compliance' },
                  ]}
                  onChange={(value: string) => handleFilterChange('stage', value)}
                />

                {/* Priority Filter */}
                <Select
                  value={filters.priority}
                  options={[
                    { value: 'all', label: 'All Priority' },
                    { value: 'urgent', label: 'Urgent' },
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' },
                  ]}
                  onChange={(value: string) => handleFilterChange('priority', value)}
                />

                {/* Timeframe Filter */}
                <Select
                  value={filters.timeframe}
                  options={[
                    { value: 'all', label: 'All Time' },
                    { value: 'urgent', label: 'Due in 2h' },
                    { value: 'today', label: 'Due Today' },
                    { value: 'week', label: 'Due This Week' },
                  ]}
                  onChange={(value: string) => handleFilterChange('timeframe', value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="secondary" onClick={clearFilters} size="sm">
                  <FunnelIcon className="w-4 h-4 mr-1" />
                  Clear
                </Button>
                <span className="text-sm text-gray-600">
                  {filteredApprovals.length} of {approvals.length} approvals
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Approvals List */}
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <div className="p-6 animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </Card>
            ))
          ) : filteredApprovals.length === 0 ? (
            // Empty state
            <Card>
              <div className="p-12 text-center">
                <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No approvals found</h3>
                <p className="text-gray-600 mb-6">
                  {filters.search || filters.status !== 'all' || filters.stage !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'No pending approvals at this time.'}
                </p>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (filters.search || filters.status !== 'all' || filters.stage !== 'all') {
                      clearFilters();
                    } else {
                      router.push('/proposals');
                    }
                  }}
                >
                  {filters.search || filters.status !== 'all' || filters.stage !== 'all'
                    ? 'Clear Filters'
                    : 'View All Proposals'}
                </Button>
              </div>
            </Card>
          ) : (
            // Approval cards
            filteredApprovals.map(approval => (
              <Card
                key={approval.id}
                className={`hover:shadow-lg transition-shadow duration-200 ${
                  selectedApproval === approval ? 'ring-2 ring-blue-500' : ''
                } ${approval.timeRemaining < 0 ? 'border-l-4 border-red-500' : ''}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                          {approval.proposalTitle}
                        </h3>
                        <StatusBadge status={approval.status} />
                        <PriorityIndicator priority={approval.priority} />
                      </div>
                      <p className="text-gray-600 mb-2">{approval.client}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          Current Stage:{' '}
                          {approval.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span>•</span>
                        <span>Assigned to: {approval.assignedTo}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          trackAction('view_approval_details', { approvalId: approval.id });
                          setSelectedApproval(approval);
                        }}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          trackAction('make_decision', { approvalId: approval.id });
                          setShowDecisionModal(approval.id);
                        }}
                        disabled={approval.status !== ApprovalStatus.PENDING}
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-4 h-4 mr-2 text-green-600">$</span>
                      Value: ${approval.estimatedValue.toLocaleString()}
                    </div>
                    <TimeRemaining approval={approval} />
                    <div className="flex items-center text-sm text-gray-600">
                      <UserGroupIcon className="w-4 h-4 mr-2" />
                      Stage: {approval.currentStage}/{approval.totalStages}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          approval.riskLevel === 'high'
                            ? 'bg-red-500'
                            : approval.riskLevel === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                      />
                      Risk: {approval.riskLevel}
                    </div>
                  </div>

                  {/* Workflow Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Workflow Progress</span>
                      <span className="text-sm text-gray-600">
                        {Math.round((approval.currentStage / approval.totalStages) * 100)}%
                      </span>
                    </div>
                    <WorkflowProgress approval={approval} />
                  </div>

                  {/* Workflow Path */}
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700 mb-2 block">
                      Approval Path:
                    </span>
                    <div className="flex items-center space-x-2">
                      {approval.workflowPath.map((stage, index) => (
                        <div key={stage} className="flex items-center">
                          <div
                            className={`px-2 py-1 text-xs rounded ${
                              index < approval.currentStage
                                ? 'bg-green-100 text-green-800'
                                : index === approval.currentStage - 1
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {stage.charAt(0).toUpperCase() + stage.slice(1)}
                          </div>
                          {index < approval.workflowPath.length - 1 && (
                            <ArrowRightIcon className="w-3 h-3 text-gray-400 mx-1" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Previous Decisions */}
                  {approval.previousDecisions.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <span className="text-sm font-medium text-gray-700 mb-2 block">
                        Recent Decisions:
                      </span>
                      <div className="space-y-2">
                        {approval.previousDecisions.slice(-2).map(decision => (
                          <div key={decision.id} className="flex items-start space-x-3 text-sm">
                            <div
                              className={`w-2 h-2 rounded-full mt-2 ${
                                decision.decision === DecisionType.APPROVE
                                  ? 'bg-green-500'
                                  : decision.decision === DecisionType.APPROVE_WITH_COMMENTS
                                    ? 'bg-blue-500'
                                    : 'bg-red-500'
                              }`}
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{decision.approver}</span>
                                <span className="text-gray-500">•</span>
                                <span className="text-gray-500">{decision.stage}</span>
                                <span className="text-gray-500">•</span>
                                <span className="text-gray-500">
                                  {decision.timeToDecision}h to decide
                                </span>
                              </div>
                              {decision.comments && (
                                <p className="text-gray-600 mt-1">{decision.comments}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
