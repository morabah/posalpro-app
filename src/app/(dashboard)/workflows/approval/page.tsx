/**
 * PosalPro MVP2 - Approval Workflow Management
 * Based on APPROVAL_WORKFLOW_SCREEN.md wireframe specifications
 * Implements intelligent workflow orchestration with timeline optimization
 *
 * User Stories: US-4.1, US-4.3
 * Hypotheses: H7 (40% on-time improvement)
 * Component Traceability: WorkflowOrchestrator, WorkflowVisualization, ApprovalQueue, WorkflowRuleBuilder
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  InformationCircleIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.2', 'AC-4.1.3', 'AC-4.3.1', 'AC-4.3.2', 'AC-4.3.3'],
  methods: [
    'complexityEstimation()',
    'calculatePriority()',
    'routeApproval()',
    'criticalPath()',
    'trackOnTimeCompletion()',
    'manageQueue()',
    'mapDependencies()',
    'defineRules()',
    'updateStatus()',
  ],
  hypotheses: ['H7'],
  testCases: ['TC-H7-001', 'TC-H7-002'],
};

// Types for approval workflow management
interface ApprovalWorkflow {
  id: string;
  proposalId: string;
  proposalName: string;
  client: string;
  currentStage: string;
  stages: WorkflowStage[];
  priority: 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Pending' | 'Completed' | 'Paused' | 'Failed';
  dueDate: Date;
  estimatedHours: number;
  actualHours: number;
  slaCompliance: boolean;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  complexity: number;
  parallelStagesCount: number;
  criticalPath: WorkflowStage[];
  createdAt: Date;
  lastUpdated: Date;
  bottlenecks: string[];
}

interface WorkflowStage {
  id: string;
  name: string;
  type: 'Technical' | 'Legal' | 'Finance' | 'Executive' | 'Compliance';
  status: 'Not Started' | 'In Progress' | 'Pending Approval' | 'Approved' | 'Rejected' | 'On Hold';
  assignee: string;
  estimatedDuration: number;
  actualDuration: number;
  deadline: Date;
  dependencies: string[];
  isParallel: boolean;
  isCriticalPath: boolean;
  approvalDecision?: 'Approved' | 'Rejected' | 'Needs Changes';
  comments?: string;
  documents: string[];
  metrics: {
    timeSpent: number;
    reviewCycles: number;
    feedbackProvided: boolean;
  };
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  proposalType: string;
  stages: Omit<WorkflowStage, 'id' | 'status' | 'actualDuration' | 'metrics'>[];
  averageDuration: number;
  successRate: number;
  usageCount: number;
}

interface WorkflowMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  completedToday: number;
  averageCompletionTime: number;
  slaComplianceRate: number;
  bottleneckStages: string[];
  priorityDistribution: Record<string, number>;
  onTimeCompletionRate: number;
}

// Mock data for demonstration
const MOCK_WORKFLOWS: ApprovalWorkflow[] = [
  {
    id: 'WF-1024',
    proposalId: 'P-1001',
    proposalName: 'Enterprise IT Solution',
    client: 'TechCorp Inc.',
    currentStage: 'Finance Review',
    priority: 'High',
    status: 'Active',
    dueDate: new Date('2024-01-05T17:00:00'),
    estimatedHours: 8,
    actualHours: 6,
    slaCompliance: true,
    riskLevel: 'Medium',
    complexity: 7,
    parallelStagesCount: 2,
    createdAt: new Date('2024-01-04T09:00:00'),
    lastUpdated: new Date('2024-01-04T15:30:00'),
    bottlenecks: [],
    stages: [
      {
        id: 'ST-1',
        name: 'Technical Review',
        type: 'Technical',
        status: 'Approved',
        assignee: 'Sarah Chen',
        estimatedDuration: 2,
        actualDuration: 1.5,
        deadline: new Date('2024-01-04T12:00:00'),
        dependencies: [],
        isParallel: false,
        isCriticalPath: true,
        approvalDecision: 'Approved',
        documents: ['technical-spec.pdf'],
        metrics: {
          timeSpent: 1.5,
          reviewCycles: 1,
          feedbackProvided: true,
        },
      },
      {
        id: 'ST-2',
        name: 'Finance Review',
        type: 'Finance',
        status: 'In Progress',
        assignee: 'Michael Rodriguez',
        estimatedDuration: 3,
        actualDuration: 0,
        deadline: new Date('2024-01-05T17:00:00'),
        dependencies: ['ST-1'],
        isParallel: false,
        isCriticalPath: true,
        documents: ['budget-analysis.xlsx'],
        metrics: {
          timeSpent: 2,
          reviewCycles: 0,
          feedbackProvided: false,
        },
      },
      {
        id: 'ST-3',
        name: 'Executive Approval',
        type: 'Executive',
        status: 'Not Started',
        assignee: 'Dr. Emily Watson',
        estimatedDuration: 1,
        actualDuration: 0,
        deadline: new Date('2024-01-06T12:00:00'),
        dependencies: ['ST-2'],
        isParallel: false,
        isCriticalPath: true,
        documents: [],
        metrics: {
          timeSpent: 0,
          reviewCycles: 0,
          feedbackProvided: false,
        },
      },
    ],
    criticalPath: [],
  },
  {
    id: 'WF-1036',
    proposalId: 'P-1002',
    proposalName: 'Healthcare Platform',
    client: 'MedSys Healthcare',
    currentStage: 'Legal Review',
    priority: 'High',
    status: 'Active',
    dueDate: new Date('2024-01-05T09:00:00'),
    estimatedHours: 12,
    actualHours: 8,
    slaCompliance: false,
    riskLevel: 'High',
    complexity: 9,
    parallelStagesCount: 1,
    createdAt: new Date('2024-01-03T14:00:00'),
    lastUpdated: new Date('2024-01-04T16:20:00'),
    bottlenecks: ['Legal Review'],
    stages: [],
    criticalPath: [],
  },
  {
    id: 'WF-1042',
    proposalId: 'P-1003',
    proposalName: 'Retail Analytics',
    client: 'RetailCorp',
    currentStage: 'Executive Approval',
    priority: 'Medium',
    status: 'Pending',
    dueDate: new Date('2024-01-06T12:00:00'),
    estimatedHours: 6,
    actualHours: 4,
    slaCompliance: true,
    riskLevel: 'Low',
    complexity: 5,
    parallelStagesCount: 0,
    createdAt: new Date('2024-01-03T10:00:00'),
    lastUpdated: new Date('2024-01-04T11:15:00'),
    bottlenecks: [],
    stages: [],
    criticalPath: [],
  },
];

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'TPL-1',
    name: 'Standard Enterprise Proposal',
    description: 'Multi-stage approval for enterprise solutions',
    proposalType: 'Enterprise',
    averageDuration: 8,
    successRate: 92,
    usageCount: 45,
    stages: [],
  },
  {
    id: 'TPL-2',
    name: 'Healthcare Compliance Workflow',
    description: 'Enhanced compliance review for healthcare proposals',
    proposalType: 'Healthcare',
    averageDuration: 12,
    successRate: 88,
    usageCount: 23,
    stages: [],
  },
];

export default function ApprovalWorkflowPage() {
  const [activeTab, setActiveTab] = useState<'approvals' | 'workflows' | 'templates' | 'analytics'>(
    'approvals'
  );
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All Pending');
  const [priorityFilter, setPriorityFilter] = useState<string>('Mine');

  // Filter workflows based on search and filters
  const filteredWorkflows = useMemo(() => {
    return MOCK_WORKFLOWS.filter(workflow => {
      const matchesSearch =
        workflow.proposalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'All Pending' || workflow.status === statusFilter;
      const matchesPriority = priorityFilter === 'Mine' || workflow.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [searchTerm, statusFilter, priorityFilter]);

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'In Progress':
      case 'Active':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'Pending Approval':
      case 'Pending':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'Rejected':
      case 'Failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'Paused':
        return <PauseIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
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
        return 'text-red-600 bg-red-50 border-red-200';
      case 'High':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Calculate workflow metrics
  const workflowMetrics = useMemo(() => {
    const totalWorkflows = MOCK_WORKFLOWS.length;
    const activeWorkflows = MOCK_WORKFLOWS.filter(w => w.status === 'Active').length;
    const completedToday = MOCK_WORKFLOWS.filter(
      w =>
        w.status === 'Completed' &&
        new Date(w.lastUpdated).toDateString() === new Date().toDateString()
    ).length;
    const atRiskCount = MOCK_WORKFLOWS.filter(
      w => !w.slaCompliance || w.riskLevel === 'High'
    ).length;
    const avgCompletionTime =
      MOCK_WORKFLOWS.reduce((acc, w) => acc + w.actualHours, 0) / totalWorkflows;
    const onTimeRate = Math.round(
      (MOCK_WORKFLOWS.filter(w => w.slaCompliance).length / totalWorkflows) * 100
    );

    return {
      totalWorkflows,
      activeWorkflows,
      completedToday,
      atRiskCount,
      avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
      onTimeRate,
    };
  }, []);

  // Format time remaining
  const getTimeRemaining = (dueDate: Date) => {
    const now = new Date();
    const diffHours = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffHours < 0) return 'Overdue';
    if (diffHours < 24) return `${diffHours}h`;
    const days = Math.ceil(diffHours / 24);
    return `${days}d`;
  };

  const handleViewWorkflow = useCallback((workflowId: string) => {
    setSelectedWorkflow(workflowId);
    toast.success(`Viewing workflow: ${workflowId}`);
  }, []);

  const handleApprove = useCallback((workflowId: string) => {
    toast.success(`Workflow ${workflowId} approved`);
  }, []);

  const handleReject = useCallback((workflowId: string) => {
    toast.error(`Workflow ${workflowId} rejected`);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Approval Workflow Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Intelligent workflow orchestration and timeline optimization
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <span className="text-sm text-gray-600">{workflowMetrics.atRiskCount} at risk</span>
              </div>
              <Button onClick={() => toast('New workflow wizard would open')}>
                <PlusIcon className="h-4 w-4 mr-2" />
                New Workflow
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
                <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Workflows</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {workflowMetrics.activeWorkflows}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-gray-500">{workflowMetrics.totalWorkflows} total</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Time</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {workflowMetrics.avgCompletionTime}h
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
                <CheckCircleIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">On-Time Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {workflowMetrics.onTimeRate}%
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-gray-500">SLA compliance</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">At Risk</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {workflowMetrics.atRiskCount}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-red-600">Requires attention</div>
            </div>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'approvals', label: 'My Approvals', icon: ShieldCheckIcon },
              { key: 'workflows', label: 'All Workflows', icon: ArrowPathIcon },
              { key: 'templates', label: 'Templates', icon: DocumentTextIcon },
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
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Search workflows..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>All Pending</option>
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Completed</option>
                  <option>Failed</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Mine</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <Button onClick={() => toast('Advanced filter options would open')}>
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                Advanced Filters
              </Button>
            </div>

            {/* Workflows Table */}
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Active Approval Workflows ({filteredWorkflows.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Proposal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Risk
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredWorkflows.map(workflow => (
                      <tr key={workflow.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {workflow.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {workflow.proposalName}
                            </div>
                            <div className="text-sm text-gray-500">{workflow.client}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(workflow.status)}
                            <span className="text-sm text-gray-900">{workflow.currentStage}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm ${
                              new Date(workflow.dueDate) < new Date()
                                ? 'text-red-600 font-medium'
                                : 'text-gray-900'
                            }`}
                          >
                            {getTimeRemaining(workflow.dueDate)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(workflow.priority)}`}
                          >
                            {workflow.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded border ${getRiskColor(workflow.riskLevel)}`}
                          >
                            {workflow.riskLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <Button size="sm" onClick={() => handleViewWorkflow(workflow.id)}>
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {workflow.status === 'Active' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(workflow.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(workflow.id)}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <XCircleIcon className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'workflows' && (
          <div className="text-center py-12">
            <ArrowPathIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Workflow Visualization</h3>
            <p className="mt-2 text-sm text-gray-500">
              Critical path identification and workflow orchestration interface would be implemented
              here.
            </p>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="grid gap-6">
              {WORKFLOW_TEMPLATES.map(template => (
                <Card key={template.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Type</div>
                          <div className="text-sm font-medium text-gray-900">
                            {template.proposalType}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Avg Duration</div>
                          <div className="text-sm font-medium text-gray-900">
                            {template.averageDuration}h
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Success Rate</div>
                          <div className="text-sm font-medium text-gray-900">
                            {template.successRate}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Usage</div>
                          <div className="text-sm font-medium text-gray-900">
                            {template.usageCount} times
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm">
                        <PlayIcon className="h-4 w-4 mr-1" />
                        Use Template
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Workflow Analytics</h3>
            <p className="mt-2 text-sm text-gray-500">
              Hypothesis H7 validation metrics and workflow optimization analytics would be
              implemented here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
