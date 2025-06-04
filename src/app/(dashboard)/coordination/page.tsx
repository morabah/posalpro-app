/**
 * PosalPro MVP2 - Coordination Hub
 * Based on COORDINATION_HUB_SCREEN.md wireframe specifications
 * Implements cross-department coordination with AI-powered insights
 *
 * User Stories: US-2.2, US-2.3, US-4.1, US-4.3
 * Hypotheses: H4 (40% coordination reduction), H7 (40% on-time improvement)
 * Component Traceability: ProposalOverview, TeamAssignmentBoard, CommunicationCenter, TimelineVisualization
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import {
  AdjustmentsHorizontalIcon,
  ArrowTrendingUpIcon,
  BellIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  LightBulbIcon,
  PlusIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.2', 'US-2.3', 'US-4.1', 'US-4.3'],
  acceptanceCriteria: [
    'AC-2.2.1',
    'AC-2.2.2',
    'AC-2.2.3',
    'AC-2.2.4',
    'AC-2.3.1',
    'AC-2.3.2',
    'AC-2.3.3',
    'AC-4.1.1',
    'AC-4.1.2',
    'AC-4.1.3',
    'AC-4.3.1',
    'AC-4.3.2',
    'AC-4.3.3',
  ],
  methods: [
    'statusUpdates()',
    'roleBasedView()',
    'suggestContributors()',
    'trackCoordinationTime()',
    'clientInsights()',
    'complexityEstimation()',
    'criticalPath()',
    'calculatePriority()',
    'mapDependencies()',
  ],
  hypotheses: ['H4', 'H7'],
  testCases: ['TC-H4-001', 'TC-H4-002', 'TC-H7-001', 'TC-H7-002'],
};

// Types for coordination management
interface Proposal {
  id: string;
  name: string;
  client: string;
  status: 'Draft' | 'In Progress' | 'Review' | 'Completed';
  progress: number;
  deadline: Date;
  teamMembers: TeamMember[];
  priority: 'High' | 'Medium' | 'Low';
  complexity: number;
  estimatedHours: number;
  actualHours: number;
  lastUpdate: Date;
  criticalPath: boolean;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  assignedSections: string[];
  workload: number;
  availability: 'Available' | 'Busy' | 'Unavailable';
  lastActive: Date;
  completionRate: number;
}

interface Task {
  id: string;
  proposalId: string;
  title: string;
  assignee: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Not Started' | 'In Progress' | 'Review' | 'Completed';
  deadline: Date;
  dependencies: string[];
  estimatedHours: number;
  actualHours: number;
  section: string;
}

interface AIInsight {
  id: string;
  type: 'bottleneck' | 'optimization' | 'risk' | 'suggestion';
  message: string;
  confidence: number;
  priority: 'High' | 'Medium' | 'Low';
  actionable: boolean;
  proposalId?: string;
  teamMemberId?: string;
}

// Mock data for demonstration
const MOCK_PROPOSALS: Proposal[] = [
  {
    id: '1',
    name: 'Enterprise IT Solution',
    client: 'TechCorp Inc.',
    status: 'In Progress',
    progress: 75,
    deadline: new Date('2024-06-10'),
    priority: 'High',
    complexity: 8,
    estimatedHours: 160,
    actualHours: 120,
    lastUpdate: new Date('2024-01-04T10:30:00'),
    criticalPath: true,
    riskLevel: 'Medium',
    teamMembers: [
      {
        id: '1',
        name: 'Sarah Chen',
        role: 'Technical Lead',
        department: 'Engineering',
        assignedSections: ['Architecture', 'Security'],
        workload: 85,
        availability: 'Busy',
        lastActive: new Date('2024-01-04T09:15:00'),
        completionRate: 92,
      },
      {
        id: '2',
        name: 'Michael Rodriguez',
        role: 'Solution Architect',
        department: 'Engineering',
        assignedSections: ['Infrastructure', 'Integration'],
        workload: 70,
        availability: 'Available',
        lastActive: new Date('2024-01-04T11:45:00'),
        completionRate: 88,
      },
    ],
  },
  {
    id: '2',
    name: 'Healthcare Platform RFP',
    client: 'MedSys Healthcare',
    status: 'Review',
    progress: 45,
    deadline: new Date('2024-06-05'),
    priority: 'High',
    complexity: 9,
    estimatedHours: 200,
    actualHours: 90,
    lastUpdate: new Date('2024-01-04T14:20:00'),
    criticalPath: false,
    riskLevel: 'High',
    teamMembers: [
      {
        id: '3',
        name: 'Dr. Emily Watson',
        role: 'Domain Expert',
        department: 'Healthcare',
        assignedSections: ['Compliance', 'Clinical Workflows'],
        workload: 60,
        availability: 'Available',
        lastActive: new Date('2024-01-04T13:30:00'),
        completionRate: 95,
      },
    ],
  },
  {
    id: '3',
    name: 'Education Platform',
    client: 'EduTech Solutions',
    status: 'Draft',
    progress: 90,
    deadline: new Date('2024-06-25'),
    priority: 'Medium',
    complexity: 6,
    estimatedHours: 120,
    actualHours: 108,
    lastUpdate: new Date('2024-01-04T16:00:00'),
    criticalPath: false,
    riskLevel: 'Low',
    teamMembers: [
      {
        id: '4',
        name: 'Alex Thompson',
        role: 'Content Specialist',
        department: 'Education',
        assignedSections: ['Curriculum', 'Assessment'],
        workload: 45,
        availability: 'Available',
        lastActive: new Date('2024-01-04T15:45:00'),
        completionRate: 87,
      },
    ],
  },
];

const MOCK_AI_INSIGHTS: AIInsight[] = [
  {
    id: '1',
    type: 'bottleneck',
    message:
      'Healthcare Platform RFP is behind schedule due to pending compliance review. Consider allocating additional compliance expertise.',
    confidence: 0.92,
    priority: 'High',
    actionable: true,
    proposalId: '2',
  },
  {
    id: '2',
    type: 'optimization',
    message:
      "Sarah Chen's workload is at 85%. Consider redistributing Architecture tasks to reduce risk of burnout.",
    confidence: 0.78,
    priority: 'Medium',
    actionable: true,
    teamMemberId: '1',
  },
  {
    id: '3',
    type: 'suggestion',
    message:
      'Enterprise IT Solution can leverage existing security templates from previous TechCorp projects to save 15% time.',
    confidence: 0.85,
    priority: 'Medium',
    actionable: true,
    proposalId: '1',
  },
];

export default function CoordinationHub() {
  const [activeTab, setActiveTab] = useState<'proposals' | 'team' | 'timeline' | 'analytics'>(
    'proposals'
  );
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

  // Filter proposals based on search and filters
  const filteredProposals = useMemo(() => {
    return MOCK_PROPOSALS.filter(proposal => {
      const matchesSearch =
        proposal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.client.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || proposal.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || proposal.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [searchTerm, statusFilter, priorityFilter]);

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'In Progress':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'Review':
        return <EyeIcon className="h-5 w-5 text-yellow-500" />;
      case 'Draft':
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
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

  // Analytics calculations
  const coordinationMetrics = useMemo(() => {
    const totalProposals = MOCK_PROPOSALS.length;
    const completedProposals = MOCK_PROPOSALS.filter(p => p.status === 'Completed').length;
    const inProgressProposals = MOCK_PROPOSALS.filter(p => p.status === 'In Progress').length;
    const overdue = MOCK_PROPOSALS.filter(
      p => new Date(p.deadline) < new Date() && p.status !== 'Completed'
    ).length;
    const avgProgress = MOCK_PROPOSALS.reduce((acc, p) => acc + p.progress, 0) / totalProposals;
    const highRiskCount = MOCK_PROPOSALS.filter(
      p => p.riskLevel === 'High' || p.riskLevel === 'Critical'
    ).length;

    return {
      totalProposals,
      completedProposals,
      inProgressProposals,
      overdue,
      avgProgress: Math.round(avgProgress),
      highRiskCount,
      onTimeRate: Math.round(((totalProposals - overdue) / totalProposals) * 100),
    };
  }, []);

  const handleViewProposal = useCallback((proposalId: string) => {
    setSelectedProposal(proposalId);
    toast.success(`Viewing proposal: ${MOCK_PROPOSALS.find(p => p.id === proposalId)?.name}`);
  }, []);

  const handleAssignTeamMember = useCallback((proposalId: string) => {
    toast.success('Team assignment interface would open here');
  }, []);

  const handleUpdateStatus = useCallback((proposalId: string, newStatus: string) => {
    toast.success(`Status updated to: ${newStatus}`);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Coordination Hub</h1>
              <p className="mt-1 text-sm text-gray-500">
                Cross-department coordination and timeline management
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BellIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">{MOCK_AI_INSIGHTS.length} insights</span>
              </div>
              <Button onClick={() => toast('New proposal wizard would open')}>
                <PlusIcon className="h-4 w-4 mr-2" />
                New Proposal
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Proposals</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {coordinationMetrics.totalProposals}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-gray-500">
                {coordinationMetrics.inProgressProposals} in progress
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Progress</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {coordinationMetrics.avgProgress}%
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-green-600">Target: ≥40% improvement (H7)</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">On-Time Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {coordinationMetrics.onTimeRate}%
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-gray-500">{coordinationMetrics.overdue} overdue</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">High Risk</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {coordinationMetrics.highRiskCount}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-red-600">Requires attention</div>
            </div>
          </Card>
        </div>

        {/* AI Insights Panel */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <LightBulbIcon className="h-6 w-6 text-yellow-500" />
              <h3 className="text-lg font-medium text-gray-900">AI Insights & Recommendations</h3>
            </div>
            <Button variant="outline" size="sm">
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
          <div className="space-y-3">
            {MOCK_AI_INSIGHTS.map(insight => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.priority === 'High'
                    ? 'border-red-400 bg-red-50'
                    : insight.priority === 'Medium'
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-blue-400 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {insight.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {Math.round(insight.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">{insight.message}</p>
                  </div>
                  {insight.actionable && (
                    <Button size="sm" variant="outline">
                      Take Action
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'proposals', label: 'Active Proposals', icon: DocumentTextIcon },
              { key: 'team', label: 'Team View', icon: UserGroupIcon },
              { key: 'timeline', label: 'Timeline', icon: CalendarIcon },
              { key: 'analytics', label: 'Analytics', icon: ChartBarIcon },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'proposals' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Search proposals..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>All</option>
                  <option>Draft</option>
                  <option>In Progress</option>
                  <option>Review</option>
                  <option>Completed</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>All</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <Button onClick={() => toast('Filter options would open')}>
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                Advanced Filters
              </Button>
            </div>

            {/* Proposals List */}
            <div className="grid gap-6">
              {filteredProposals.map(proposal => (
                <Card key={proposal.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(proposal.status)}
                        <h3 className="text-lg font-medium text-gray-900">{proposal.name}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(proposal.priority)}`}
                        >
                          {proposal.priority}
                        </span>
                        {proposal.criticalPath && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            Critical Path
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Client: {proposal.client}</p>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Progress</div>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${proposal.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {proposal.progress}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Deadline</div>
                          <div className="text-sm font-medium text-gray-900">
                            {proposal.deadline.toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Team Size</div>
                          <div className="text-sm font-medium text-gray-900">
                            {proposal.teamMembers.length} members
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Risk Level</div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded border ${getRiskColor(proposal.riskLevel)}`}
                          >
                            {proposal.riskLevel}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {proposal.teamMembers.slice(0, 3).map(member => (
                          <div
                            key={member.id}
                            className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"
                          >
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-700">{member.name}</span>
                          </div>
                        ))}
                        {proposal.teamMembers.length > 3 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{proposal.teamMembers.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Button size="sm" onClick={() => handleViewProposal(proposal.id)}>
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAssignTeamMember(proposal.id)}
                      >
                        <UsersIcon className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toast('Communication center would open')}
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="text-center py-12">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Team Assignment Board</h3>
            <p className="mt-2 text-sm text-gray-500">
              Smart contributor suggestions and workload management interface would be implemented
              here.
            </p>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Timeline Visualization</h3>
            <p className="mt-2 text-sm text-gray-500">
              Critical path identification and complexity-based timeline estimation would be
              implemented here.
            </p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Coordination Analytics</h3>
            <p className="mt-2 text-sm text-gray-500">
              Hypothesis H4 and H7 validation metrics and coordination efficiency tracking would be
              implemented here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
