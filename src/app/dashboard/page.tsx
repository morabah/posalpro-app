/**
 * PosalPro MVP2 - Main Dashboard
 * Based on DASHBOARD_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H7 hypothesis validation
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import {
  ArrowRightIcon,
  BellIcon,
  ChartPieIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.3', 'AC-4.3.1', 'AC-4.3.3'],
  methods: [
    'timelineVisualization()',
    'trackOnTimeCompletion()',
    'displayPriorities()',
    'trackProgress()',
    'launchSearch()',
    'createProposal()',
  ],
  hypotheses: ['H7'],
  testCases: ['TC-H7-001', 'TC-H7-002'],
};

// User role enumeration
enum UserRole {
  PROPOSAL_MANAGER = 'proposal_manager',
  SME = 'sme',
  EXECUTIVE = 'executive',
  ADMIN = 'admin',
  SALES = 'sales',
}

// Proposal status enumeration
enum ProposalStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  ACTIVE = 'active',
  APPROVED = 'approved',
  SUBMITTED = 'submitted',
  WON = 'won',
  LOST = 'lost',
}

// Priority level enumeration
enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Dashboard proposal interface
interface DashboardProposal {
  id: string;
  title: string;
  customer: string;
  status: ProposalStatus;
  dueDate: Date;
  priority: PriorityLevel;
  progress: number;
  value?: number;
  assignedSMEs?: number;
  lastActivity: Date;
}

// Dashboard metrics interface
interface DashboardMetrics {
  proposalsInProgress: number;
  avgCompletionTime: number;
  onTimeCompletionRate: number;
  criticalPathProposals: number;
  highPriorityTasks: number;
  taskCompletionRate: number;
  priorityAccuracy: number;
  overdueTasks: number;
  dailyActiveTime: number;
  featureUsageDistribution: Record<string, number>;
  quickActionUsage: Record<string, number>;
  navigationPatterns: string[];
  searchQueries: number;
  smeAssignments: number;
  validationRuns: number;
  coordinationActions: number;
}

// Priority item interface
interface PriorityItem {
  id: string;
  type: 'validation' | 'assignment' | 'approval' | 'review';
  title: string;
  description: string;
  priority: PriorityLevel;
  actionUrl: string;
  actionLabel: string;
  dueDate?: Date;
}

// User interface
interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

// Mock user data
const MOCK_USER: User = {
  id: 'user-001',
  name: 'Mohamed Rabah',
  role: UserRole.PROPOSAL_MANAGER,
  avatar: '/avatars/mohamed.jpg',
};

// Mock proposals data
const MOCK_PROPOSALS: DashboardProposal[] = [
  {
    id: 'prop-001',
    title: 'Tech Services RFP',
    customer: 'Government Agency',
    status: ProposalStatus.DRAFT,
    dueDate: new Date('2024-12-25'),
    priority: PriorityLevel.HIGH,
    progress: 35,
    value: 2400000,
    assignedSMEs: 3,
    lastActivity: new Date(Date.now() - 3600000), // 1 hour ago
  },
  {
    id: 'prop-002',
    title: 'North Region Bid',
    customer: 'Regional Corporation',
    status: ProposalStatus.REVIEW,
    dueDate: new Date('2024-12-28'),
    priority: PriorityLevel.MEDIUM,
    progress: 78,
    value: 1800000,
    assignedSMEs: 2,
    lastActivity: new Date(Date.now() - 7200000), // 2 hours ago
  },
  {
    id: 'prop-003',
    title: 'Government Tender 27B',
    customer: 'Federal Department',
    status: ProposalStatus.ACTIVE,
    dueDate: new Date('2025-01-10'),
    priority: PriorityLevel.HIGH,
    progress: 62,
    value: 3700000,
    assignedSMEs: 5,
    lastActivity: new Date(Date.now() - 14400000), // 4 hours ago
  },
  {
    id: 'prop-004',
    title: 'Healthcare Solutions',
    customer: 'Medical Center',
    status: ProposalStatus.SUBMITTED,
    dueDate: new Date('2024-12-22'),
    priority: PriorityLevel.MEDIUM,
    progress: 100,
    value: 950000,
    assignedSMEs: 2,
    lastActivity: new Date(Date.now() - 86400000), // 1 day ago
  },
];

// Mock priority items
const MOCK_PRIORITY_ITEMS: PriorityItem[] = [
  {
    id: 'priority-001',
    type: 'validation',
    title: 'Security Configuration Alert',
    description: 'Security config needs immediate attention',
    priority: PriorityLevel.CRITICAL,
    actionUrl: '/validation',
    actionLabel: 'Fix',
  },
  {
    id: 'priority-002',
    type: 'assignment',
    title: 'SME Assignments Pending',
    description: '5 assignments awaiting your review',
    priority: PriorityLevel.HIGH,
    actionUrl: '/assignments',
    actionLabel: 'View',
  },
  {
    id: 'priority-003',
    type: 'approval',
    title: 'Executive Review Required',
    description: '2 proposals ready for executive approval',
    priority: PriorityLevel.HIGH,
    actionUrl: '/executive/review',
    actionLabel: 'Review',
  },
  {
    id: 'priority-004',
    type: 'review',
    title: 'Customer Profile Updates',
    description: '3 customer profiles need data verification',
    priority: PriorityLevel.MEDIUM,
    actionUrl: '/customers',
    actionLabel: 'Update',
  },
];

export default function MainDashboard() {
  const router = useRouter();
  const [user] = useState<User>(MOCK_USER);
  const [proposals] = useState<DashboardProposal[]>(MOCK_PROPOSALS);
  const [priorityItems] = useState<PriorityItem[]>(MOCK_PRIORITY_ITEMS);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStartTime] = useState(Date.now());

  // Calculate dashboard metrics
  const metrics = useMemo((): DashboardMetrics => {
    const inProgress = proposals.filter(p =>
      [ProposalStatus.DRAFT, ProposalStatus.REVIEW, ProposalStatus.ACTIVE].includes(p.status)
    ).length;

    const completed = proposals.filter(p =>
      [ProposalStatus.WON, ProposalStatus.SUBMITTED].includes(p.status)
    );

    const overdue = proposals.filter(
      p =>
        p.dueDate < new Date() &&
        ![ProposalStatus.WON, ProposalStatus.LOST, ProposalStatus.SUBMITTED].includes(p.status)
    ).length;

    const highPriority = proposals.filter(p =>
      [PriorityLevel.HIGH, PriorityLevel.CRITICAL].includes(p.priority)
    ).length;

    const avgProgress = proposals.reduce((sum, p) => sum + p.progress, 0) / proposals.length;

    return {
      proposalsInProgress: inProgress,
      avgCompletionTime: 14.5, // Mock: 14.5 days average
      onTimeCompletionRate: 87, // Mock: 87% on-time completion
      criticalPathProposals: proposals.filter(p => p.priority === PriorityLevel.CRITICAL).length,
      highPriorityTasks: highPriority,
      taskCompletionRate: Math.round(avgProgress),
      priorityAccuracy: 92, // Mock: 92% priority accuracy
      overdueTasks: overdue,
      dailyActiveTime: 7.2, // Mock: 7.2 hours daily active time
      featureUsageDistribution: {
        proposals: 45,
        validation: 23,
        sme: 18,
        executive: 14,
      },
      quickActionUsage: {
        newProposal: 156,
        search: 89,
        assignSME: 67,
        validate: 45,
      },
      navigationPatterns: ['/proposals', '/validation', '/sme', '/customers'],
      searchQueries: 234,
      smeAssignments: 89,
      validationRuns: 67,
      coordinationActions: 145,
    };
  }, [proposals]);

  // Analytics tracking
  const trackAction = useCallback(
    (action: string, metadata: any = {}) => {
      console.log('Dashboard Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        userId: user.id,
        userRole: user.role,
        sessionDuration: Date.now() - sessionStartTime,
      });
    },
    [user.id, user.role, sessionStartTime]
  );

  // Quick actions configuration
  const quickActions = useMemo(() => {
    const baseActions = [
      {
        id: 'new-proposal',
        label: 'New Proposal',
        icon: PlusIcon,
        url: '/proposals/create',
        color: 'bg-blue-600 hover:bg-blue-700',
      },
      {
        id: 'search',
        label: 'Search',
        icon: MagnifyingGlassIcon,
        url: '/search',
        color: 'bg-green-600 hover:bg-green-700',
      },
    ];

    // Role-based additional actions
    if (user.role === UserRole.PROPOSAL_MANAGER || user.role === UserRole.ADMIN) {
      baseActions.push(
        {
          id: 'assign-sme',
          label: 'Assign SMEs',
          icon: UserGroupIcon,
          url: '/assignments',
          color: 'bg-purple-600 hover:bg-purple-700',
        },
        {
          id: 'validate',
          label: 'Validate',
          icon: CheckCircleIcon,
          url: '/validation',
          color: 'bg-orange-600 hover:bg-orange-700',
        }
      );
    } else if (user.role === UserRole.SME) {
      baseActions.push({
        id: 'start-assignment',
        label: 'Start Assignment',
        icon: DocumentTextIcon,
        url: '/sme/contributions',
        color: 'bg-purple-600 hover:bg-purple-700',
      });
    } else if (user.role === UserRole.EXECUTIVE) {
      baseActions.push({
        id: 'review',
        label: 'Review',
        icon: EyeIcon,
        url: '/executive/review',
        color: 'bg-purple-600 hover:bg-purple-700',
      });
    }

    return baseActions;
  }, [user.role]);

  // Get status display
  const getStatusDisplay = (status: ProposalStatus) => {
    const displays = {
      [ProposalStatus.DRAFT]: { label: 'Draft', color: 'text-blue-600', bg: 'bg-blue-100' },
      [ProposalStatus.REVIEW]: { label: 'Review', color: 'text-yellow-600', bg: 'bg-yellow-100' },
      [ProposalStatus.ACTIVE]: { label: 'Active', color: 'text-green-600', bg: 'bg-green-100' },
      [ProposalStatus.APPROVED]: {
        label: 'Approved',
        color: 'text-purple-600',
        bg: 'bg-purple-100',
      },
      [ProposalStatus.SUBMITTED]: { label: 'Submitted', color: 'text-gray-600', bg: 'bg-gray-100' },
      [ProposalStatus.WON]: { label: 'Won', color: 'text-green-600', bg: 'bg-green-100' },
      [ProposalStatus.LOST]: { label: 'Lost', color: 'text-red-600', bg: 'bg-red-100' },
    };
    return displays[status];
  };

  // Get priority display
  const getPriorityDisplay = (priority: PriorityLevel) => {
    const displays = {
      [PriorityLevel.LOW]: { label: 'Low', color: 'text-green-600', bg: 'bg-green-100' },
      [PriorityLevel.MEDIUM]: { label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' },
      [PriorityLevel.HIGH]: { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
      [PriorityLevel.CRITICAL]: { label: 'Critical', color: 'text-red-600', bg: 'bg-red-100' },
    };
    return displays[priority];
  };

  // Get priority item icon
  const getPriorityIcon = (type: PriorityItem['type']) => {
    switch (type) {
      case 'validation':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'assignment':
        return <UserGroupIcon className="w-5 h-5 text-purple-600" />;
      case 'approval':
        return <CheckCircleIcon className="w-5 h-5 text-blue-600" />;
      case 'review':
        return <EyeIcon className="w-5 h-5 text-green-600" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  // Handle quick action click
  const handleQuickAction = useCallback(
    (action: any) => {
      trackAction('quick_action_clicked', {
        actionId: action.id,
        actionLabel: action.label,
      });
      router.push(action.url);
    },
    [trackAction, router]
  );

  // Handle proposal click
  const handleProposalClick = useCallback(
    (proposal: DashboardProposal) => {
      trackAction('proposal_clicked', {
        proposalId: proposal.id,
        proposalStatus: proposal.status,
      });
      router.push(`/proposals/${proposal.id}`);
    },
    [trackAction, router]
  );

  // Handle priority item click
  const handlePriorityClick = useCallback(
    (item: PriorityItem) => {
      trackAction('priority_item_clicked', {
        itemId: item.id,
        itemType: item.type,
      });
      router.push(item.actionUrl);
    },
    [trackAction, router]
  );

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      trackAction('dashboard_loaded', {
        metrics,
        loadTime: Date.now() - sessionStartTime,
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [metrics, sessionStartTime, trackAction]);

  // Track dashboard view
  useEffect(() => {
    trackAction('dashboard_viewed', {
      userRole: user.role,
      proposalsCount: proposals.length,
      priorityItemsCount: priorityItems.length,
    });
  }, [user.role, proposals.length, priorityItems.length, trackAction]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.name.split(' ')[0]}
              </h1>
              <p className="text-gray-600">
                {
                  proposals.filter(p =>
                    [ProposalStatus.DRAFT, ProposalStatus.REVIEW, ProposalStatus.ACTIVE].includes(
                      p.status
                    )
                  ).length
                }{' '}
                active proposals •
                {
                  priorityItems.filter(p =>
                    [PriorityLevel.HIGH, PriorityLevel.CRITICAL].includes(p.priority)
                  ).length
                }{' '}
                priority items
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm text-gray-600">
                <div>On-time completion: {metrics.onTimeCompletionRate}%</div>
                <div>Average completion: {metrics.avgCompletionTime} days</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map(action => {
              const IconComponent = action.icon;
              return (
                <Button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  className={`${action.color} text-white flex items-center justify-center py-4 px-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200`}
                >
                  <IconComponent className="w-5 h-5 mr-2" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Status Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Status Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <div className="p-6 text-center">
                <ChartPieIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.proposalsInProgress}
                </div>
                <div className="text-sm text-gray-600">Active Proposals</div>
                <div className="mt-2 text-xs text-gray-500">
                  {metrics.taskCompletionRate}% avg progress
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6 text-center">
                <UserGroupIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{metrics.smeAssignments}</div>
                <div className="text-sm text-gray-600">SME Assignments</div>
                <div className="mt-2 text-xs text-gray-500">
                  {proposals.reduce((sum, p) => sum + (p.assignedSMEs || 0), 0)} SMEs active
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6 text-center">
                <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {metrics.onTimeCompletionRate}%
                </div>
                <div className="text-sm text-gray-600">On-Time Rate</div>
                <div className="mt-2 text-xs text-gray-500">
                  {metrics.overdueTasks} overdue items
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6 text-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">{metrics.validationRuns}</div>
                <div className="text-sm text-gray-600">Validations</div>
                <div className="mt-2 text-xs text-gray-500">
                  {metrics.priorityAccuracy}% accuracy
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Proposals */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Active Proposals</h3>
                <span className="text-sm text-gray-500">Due dates</span>
              </div>
              <div className="space-y-3">
                {proposals
                  .filter(p =>
                    [ProposalStatus.DRAFT, ProposalStatus.REVIEW, ProposalStatus.ACTIVE].includes(
                      p.status
                    )
                  )
                  .slice(0, 5)
                  .map(proposal => {
                    const statusDisplay = getStatusDisplay(proposal.status);
                    const priorityDisplay = getPriorityDisplay(proposal.priority);
                    const isOverdue = proposal.dueDate < new Date();

                    return (
                      <div
                        key={proposal.id}
                        onClick={() => handleProposalClick(proposal)}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">{proposal.title}</span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${statusDisplay.bg} ${statusDisplay.color}`}
                            >
                              {statusDisplay.label}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">{proposal.customer}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${priorityDisplay.bg} ${priorityDisplay.color}`}
                            >
                              {priorityDisplay.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {proposal.assignedSMEs} SMEs • {proposal.progress}% complete
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-sm font-medium ${
                              isOverdue ? 'text-red-600' : 'text-gray-900'
                            }`}
                          >
                            {proposal.dueDate.toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTimeAgo(proposal.lastActivity)}
                          </div>
                        </div>
                        <ArrowRightIcon className="w-5 h-5 text-gray-400 ml-3" />
                      </div>
                    );
                  })}
              </div>
              {proposals.filter(p =>
                [ProposalStatus.DRAFT, ProposalStatus.REVIEW, ProposalStatus.ACTIVE].includes(
                  p.status
                )
              ).length > 5 && (
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      trackAction('view_all_proposals_clicked');
                      router.push('/proposals');
                    }}
                    className="w-full"
                  >
                    View All Proposals
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Priority Items */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Priority Items</h3>
              <div className="space-y-3">
                {priorityItems.map(item => {
                  const priorityDisplay = getPriorityDisplay(item.priority);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handlePriorityClick(item)}
                      className={`flex items-start space-x-3 p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
                        item.priority === PriorityLevel.CRITICAL
                          ? 'border-red-500 bg-red-50'
                          : item.priority === PriorityLevel.HIGH
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-yellow-500 bg-yellow-50'
                      }`}
                    >
                      <div className="flex-shrink-0">{getPriorityIcon(item.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${priorityDisplay.bg} ${priorityDisplay.color}`}
                          >
                            {priorityDisplay.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{item.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          {item.dueDate && (
                            <span className="text-xs text-gray-500">
                              Due: {item.dueDate.toLocaleDateString()}
                            </span>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              handlePriorityClick(item);
                            }}
                          >
                            {item.actionLabel}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
