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

// Mock approval workflow data
const MOCK_APPROVALS: WorkflowApproval[] = [
  {
    id: 'appr-1',
    proposalId: '1',
    proposalTitle: 'Cloud Migration Services - Acme Corporation',
    client: 'Acme Corporation',
    stage: ApprovalStage.FINANCIAL,
    status: ApprovalStatus.PENDING,
    priority: Priority.HIGH,
    assignedTo: 'Maria Rodriguez',
    assignedToRole: 'Financial Approver',
    dueDate: new Date(Date.now() + 3600000), // 1 hour from now
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 3600000), // 1 hour ago
    estimatedValue: 250000,
    currentStage: 2,
    totalStages: 4,
    slaHours: 24,
    timeRemaining: 1,
    riskLevel: 'medium',
    isParallel: false,
    dependsOn: ['tech-review-1'],
    workflowPath: ['technical', 'financial', 'legal', 'executive'],
    previousDecisions: [
      {
        id: 'dec-1',
        stage: ApprovalStage.TECHNICAL,
        approver: 'John Smith',
        approverRole: 'Technical Lead',
        decision: DecisionType.APPROVE_WITH_COMMENTS,
        comments: 'Technical configuration validated. Note potential scaling issue in Y2.',
        timestamp: new Date(Date.now() - 3600000),
        timeToDecision: 4,
      },
    ],
  },
  {
    id: 'appr-2',
    proposalId: '2',
    proposalTitle: 'Security Audit - TechStart Inc',
    client: 'TechStart Inc',
    stage: ApprovalStage.EXECUTIVE,
    status: ApprovalStatus.PENDING,
    priority: Priority.HIGH,
    assignedTo: 'David Chen',
    assignedToRole: 'Executive Approver',
    dueDate: new Date(Date.now() + 21600000), // 6 hours from now
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    updatedAt: new Date(Date.now() - 7200000), // 2 hours ago
    estimatedValue: 85000,
    currentStage: 4,
    totalStages: 4,
    slaHours: 48,
    timeRemaining: 6,
    riskLevel: 'low',
    isParallel: false,
    dependsOn: ['legal-review-2'],
    workflowPath: ['technical', 'financial', 'legal', 'executive'],
    previousDecisions: [
      {
        id: 'dec-2',
        stage: ApprovalStage.TECHNICAL,
        approver: 'Alex Peterson',
        approverRole: 'Security Lead',
        decision: DecisionType.APPROVE,
        comments: 'Security audit scope is comprehensive and appropriate.',
        timestamp: new Date(Date.now() - 172800000),
        timeToDecision: 2,
      },
      {
        id: 'dec-3',
        stage: ApprovalStage.FINANCIAL,
        approver: 'Maria Rodriguez',
        approverRole: 'Financial Approver',
        decision: DecisionType.APPROVE,
        comments: 'Pricing validated and within budget parameters.',
        timestamp: new Date(Date.now() - 86400000),
        timeToDecision: 3,
      },
      {
        id: 'dec-4',
        stage: ApprovalStage.LEGAL,
        approver: 'Lisa Kim',
        approverRole: 'Legal Counsel',
        decision: DecisionType.APPROVE_WITH_COMMENTS,
        comments: 'Standard terms acceptable. Minor liability clause adjustment made.',
        timestamp: new Date(Date.now() - 7200000),
        timeToDecision: 18,
      },
    ],
  },
  {
    id: 'appr-3',
    proposalId: '3',
    proposalTitle: 'Digital Transformation - GlobalCorp',
    client: 'GlobalCorp',
    stage: ApprovalStage.TECHNICAL,
    status: ApprovalStatus.IN_PROGRESS,
    priority: Priority.MEDIUM,
    assignedTo: 'John Smith',
    assignedToRole: 'Technical Lead',
    dueDate: new Date(Date.now() + 345600000), // 4 days from now
    createdAt: new Date(Date.now() - 43200000), // 12 hours ago
    updatedAt: new Date(Date.now() - 1800000), // 30 minutes ago
    estimatedValue: 500000,
    currentStage: 1,
    totalStages: 5,
    slaHours: 72,
    timeRemaining: 96,
    riskLevel: 'high',
    isParallel: true,
    dependsOn: [],
    workflowPath: ['technical', 'security', 'financial', 'legal', 'executive'],
    previousDecisions: [],
  },
  {
    id: 'appr-4',
    proposalId: '4',
    proposalTitle: 'DevOps Implementation - InnovateTech',
    client: 'InnovateTech',
    stage: ApprovalStage.LEGAL,
    status: ApprovalStatus.ESCALATED,
    priority: Priority.URGENT,
    assignedTo: 'Lisa Kim',
    assignedToRole: 'Legal Counsel',
    dueDate: new Date(Date.now() - 7200000), // 2 hours overdue
    createdAt: new Date(Date.now() - 259200000), // 3 days ago
    updatedAt: new Date(Date.now() - 3600000), // 1 hour ago
    estimatedValue: 150000,
    currentStage: 3,
    totalStages: 4,
    slaHours: 48,
    timeRemaining: -2,
    riskLevel: 'high',
    isParallel: false,
    dependsOn: ['financial-review-4'],
    workflowPath: ['technical', 'financial', 'legal', 'executive'],
    previousDecisions: [
      {
        id: 'dec-5',
        stage: ApprovalStage.TECHNICAL,
        approver: 'John Smith',
        approverRole: 'Technical Lead',
        decision: DecisionType.APPROVE,
        comments: 'DevOps architecture is sound and follows best practices.',
        timestamp: new Date(Date.now() - 172800000),
        timeToDecision: 6,
      },
      {
        id: 'dec-6',
        stage: ApprovalStage.FINANCIAL,
        approver: 'Maria Rodriguez',
        approverRole: 'Financial Approver',
        decision: DecisionType.REQUEST_CHANGES,
        comments: 'Pricing needs adjustment for enterprise license tier.',
        timestamp: new Date(Date.now() - 86400000),
        timeToDecision: 24,
      },
    ],
  },
  {
    id: 'appr-5',
    proposalId: '5',
    proposalTitle: 'Data Analytics Platform - DataCorp',
    client: 'DataCorp',
    stage: ApprovalStage.COMPLIANCE,
    status: ApprovalStatus.PENDING,
    priority: Priority.MEDIUM,
    assignedTo: 'Sarah Johnson',
    assignedToRole: 'Compliance Officer',
    dueDate: new Date(Date.now() + 172800000), // 2 days from now
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 7200000), // 2 hours ago
    estimatedValue: 320000,
    currentStage: 3,
    totalStages: 5,
    slaHours: 48,
    timeRemaining: 48,
    riskLevel: 'medium',
    isParallel: true,
    dependsOn: ['technical-review-5', 'security-review-5'],
    workflowPath: ['technical', 'security', 'compliance', 'financial', 'executive'],
    previousDecisions: [
      {
        id: 'dec-7',
        stage: ApprovalStage.TECHNICAL,
        approver: 'Alex Peterson',
        approverRole: 'Data Engineer',
        decision: DecisionType.APPROVE,
        comments: 'Analytics platform architecture meets requirements.',
        timestamp: new Date(Date.now() - 43200000),
        timeToDecision: 8,
      },
      {
        id: 'dec-8',
        stage: ApprovalStage.SECURITY,
        approver: 'Alex Peterson',
        approverRole: 'Security Lead',
        decision: DecisionType.APPROVE_WITH_COMMENTS,
        comments: 'Data security measures adequate. Recommend additional encryption.',
        timestamp: new Date(Date.now() - 21600000),
        timeToDecision: 12,
      },
    ],
  },
];

export default function ApprovalWorkflowDashboard() {
  const router = useRouter();
  const [approvals, setApprovals] = useState<WorkflowApproval[]>(MOCK_APPROVALS);
  const [filteredApprovals, setFilteredApprovals] = useState<WorkflowApproval[]>(MOCK_APPROVALS);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);
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
    sortOrder: 'asc',
  });

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...approvals];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        approval =>
          approval.proposalTitle.toLowerCase().includes(filters.search.toLowerCase()) ||
          approval.client.toLowerCase().includes(filters.search.toLowerCase()) ||
          approval.assignedTo.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(approval => approval.status === filters.status);
    }

    // Stage filter
    if (filters.stage !== 'all') {
      filtered = filtered.filter(approval => approval.stage === filters.stage);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(approval => approval.priority === filters.priority);
    }

    // Assignee filter
    if (filters.assignee !== 'all') {
      filtered = filtered.filter(approval => approval.assignedTo === filters.assignee);
    }

    // Timeframe filter
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

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'dueDate':
          aValue = a.dueDate;
          bValue = b.dueDate;
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'stage':
          aValue = a.currentStage;
          bValue = b.currentStage;
          break;
        case 'value':
          aValue = a.estimatedValue;
          bValue = b.estimatedValue;
          break;
        default:
          aValue = a.updatedAt;
          bValue = b.updatedAt;
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredApprovals(filtered);
  }, [approvals, filters]);

  // Filter handlers
  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
      sortOrder: 'asc',
    });
  }, []);

  // Analytics tracking
  const trackAction = useCallback(
    (action: string, metadata: any = {}) => {
      console.log('Approval Workflow Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        filters: filters,
        approvalCount: filteredApprovals.length,
      });
    },
    [filters, filteredApprovals.length]
  );

  // Status badge component
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

  // Priority indicator component
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

  // Workflow progress component
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

  // Time remaining indicator
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

  // Calculate dashboard metrics
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
          {isLoading ? (
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
                  selectedApproval === approval.id ? 'ring-2 ring-blue-500' : ''
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
                          setSelectedApproval(approval.id);
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
