/**
 * PosalPro MVP2 - Approval Workflow Screen
 * Based on APPROVAL_WORKFLOW_SCREEN.md wireframe specifications
 * Integrates all workflow components for comprehensive approval management
 *
 * User Stories: US-4.1, US-4.2, US-4.3
 * Hypotheses: H7 (40% on-time improvement)
 * Component Traceability: ApprovalWorkflowScreen, orchestrateWorkflow(), manageApprovals()
 */

'use client';

import { ApprovalQueue } from '@/components/proposals/ApprovalQueue';
import {
  DecisionInterface,
  type ChecklistItem,
  type Collaborator,
  type DecisionContext,
  type DecisionFormData,
  type DecisionHistory,
  type PolicyReference,
  type ProposalAttachment,
  type StageComment,
} from '@/components/proposals/DecisionInterface';
import { WorkflowOrchestrator } from '@/components/proposals/WorkflowOrchestrator';
import { WorkflowRuleBuilder } from '@/components/proposals/WorkflowRuleBuilder';
import { WorkflowVisualization } from '@/components/proposals/WorkflowVisualization';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug } from '@/lib/logger';
import {
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useMemo, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.2', 'US-4.3'],
  acceptanceCriteria: [
    'AC-4.1.1',
    'AC-4.1.2',
    'AC-4.1.3',
    'AC-4.2.1',
    'AC-4.2.2',
    'AC-4.3.1',
    'AC-4.3.2',
  ],
  methods: ['orchestrateWorkflow()', 'manageApprovals()', 'buildRules()', 'visualizeProgress()'],
  hypotheses: ['H7'],
  testCases: ['TC-H7-001', 'TC-H7-002', 'TC-H7-003', 'TC-H7-004'],
};

interface WorkflowCondition {
  id: string;
  type: 'field' | 'value' | 'date' | 'user' | 'role';
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number | boolean | Date | string[] | Record<string, unknown>;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  logicalOperator?: 'AND' | 'OR';
  parentGroup?: string;
}

interface WorkflowAction {
  id: string;
  type:
    | 'route_to_stage'
    | 'assign_user'
    | 'send_notification'
    | 'set_priority'
    | 'escalate'
    | 'add_comment'
    | 'require_approval';
  parameters: Record<string, string | number | boolean | string[]>;
  delay?: number;
  conditions?: string[];
}

interface WorkflowTrigger {
  id: string;
  event:
    | 'proposal_created'
    | 'stage_completed'
    | 'deadline_approaching'
    | 'value_threshold'
    | 'manual_trigger';
  timing: 'immediate' | 'delayed' | 'scheduled';
  delay?: number;
  schedule?: {
    frequency: 'once' | 'daily' | 'weekly' | 'monthly';
    time?: string;
    days?: number[];
  };
}

interface WorkflowException {
  id: string;
  condition: string;
  action: 'skip_rule' | 'override_action' | 'escalate' | 'require_manual_review';
  reason: string;
}

interface WorkflowComment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  type: 'comment' | 'approval' | 'rejection' | 'escalation';
}

interface WorkflowAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  category: 'routing' | 'approval' | 'escalation' | 'notification' | 'validation';
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  triggers: WorkflowTrigger[];
  exceptions: WorkflowException[];
  lastModified: Date;
  modifiedBy: string;
  isValid: boolean;
  validationErrors: string[];
}

interface ApprovalTask {
  id: string;
  type: 'proposal_review' | 'technical_validation' | 'budget_approval' | 'executive_sign_off';
  title: string;
  description: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  dueDate: Date;
  proposalId: string;
  proposalTitle: string;
  estimatedTime: number;
  actualTime?: number;
  dependencies: string[];
  tags: string[];
  slaCompliance: number;
  businessValue: number;
  urgencyScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  currentStage: string;
  nextStage?: string;
  comments: WorkflowComment[];
  attachments: WorkflowAttachment[];
  metadata: Record<string, unknown>;
}

export default function ApprovalWorkflowPage() {
  const [activeTab, setActiveTab] = useState<
    'queue' | 'orchestrator' | 'visualization' | 'rules' | 'decision'
  >('queue');
  const [selectedTask, setSelectedTask] = useState<ApprovalTask | null>(null);
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([]);
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Mock data for demonstration
  const mockTasks: ApprovalTask[] = useMemo(
    () => [
      {
        id: 'task-001',
        type: 'proposal_review',
        title: 'Enterprise Software License Proposal Review',
        description:
          'Review and approve enterprise software licensing proposal for Q1 implementation',
        assignee: 'John Smith',
        priority: 'high',
        status: 'pending',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        proposalId: 'prop-001',
        proposalTitle: 'Enterprise Software License - Microsoft 365 E5',
        estimatedTime: 120, // minutes
        dependencies: [],
        tags: ['software', 'licensing', 'enterprise'],
        slaCompliance: 85,
        businessValue: 850000,
        urgencyScore: 8.5,
        riskLevel: 'medium',
        currentStage: 'initial_review',
        nextStage: 'technical_validation',
        comments: [],
        attachments: [],
        metadata: {
          requestedBy: 'IT Department',
          budgetImpact: '$850,000 annually',
          implementationDate: '2024-Q1',
        },
      },
      {
        id: 'task-002',
        type: 'budget_approval',
        title: 'Cloud Infrastructure Budget Approval',
        description: 'Approve additional cloud infrastructure budget for scaling operations',
        assignee: 'Sarah Johnson',
        priority: 'critical',
        status: 'in_progress',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        proposalId: 'prop-002',
        proposalTitle: 'AWS Infrastructure Scale-up - Q1 2024',
        estimatedTime: 90,
        dependencies: ['task-001'],
        tags: ['cloud', 'infrastructure', 'budget'],
        slaCompliance: 92,
        businessValue: 1200000,
        urgencyScore: 9.2,
        riskLevel: 'high',
        currentStage: 'budget_review',
        nextStage: 'executive_approval',
        comments: [],
        attachments: [],
        metadata: {
          requestedBy: 'Engineering Team',
          budgetImpact: '$1.2M for infrastructure scaling',
          implementationDate: '2024-Q1',
        },
      },
    ],
    []
  );

  const availableFields = useMemo(
    () => [
      'proposalValue',
      'priority',
      'assignee',
      'department',
      'riskLevel',
      'businessValue',
      'urgencyScore',
      'slaCompliance',
      'currentStage',
      'dueDate',
      'estimatedTime',
      'tags',
    ],
    []
  );

  // Track page view analytics for H7 hypothesis validation
  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab as 'queue' | 'orchestrator' | 'visualization' | 'rules' | 'decision');

      analytics(
        'approval_workflow_tab_changed',
        {
          tab,
          previousTab: activeTab,
        },
        'medium'
      );
    },
    [activeTab, analytics]
  );

  const handleTaskSelect = useCallback(
    (task: ApprovalTask) => {
      setSelectedTask(task);
      setActiveTab('decision');

      analytics(
        'approval_task_selected',
        {
          taskId: task.id,
          taskType: task.type,
          priority: task.priority,
        },
        'high'
      );
    },
    [analytics]
  );

  const handleTaskAction = useCallback(
    (taskId: string, action: string, data?: Record<string, unknown>) => {
      // Disabled console.log analytics to prevent Fast Refresh rebuilds
      // TODO: migrate to optimized analytics hook
    },
    []
  );

  const handleRuleSave = useCallback((rule: WorkflowRule) => {
    setWorkflowRules(prev => {
      const existingIndex = prev.findIndex(r => r.id === rule.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = rule;
        return updated;
      } else {
        return [...prev, rule];
      }
    });

    logDebug('Analytics: workflow_rule_saved', {
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      timestamp: Date.now(),
    });
  }, []);

  const handleRuleDelete = useCallback((ruleId: string) => {
    setWorkflowRules(prev => prev.filter(r => r.id !== ruleId));

    logDebug('Analytics: workflow_rule_deleted', {
      ruleId,
      timestamp: Date.now(),
    });
  }, []);

  const handleRuleTest = useCallback(
    async (rule: WorkflowRule, testData: Record<string, unknown>) => {
      // Mock rule testing for demonstration
      return {
        id: `test-${Date.now()}`,
        testCase: 'Mock Test',
        input: testData,
        expectedOutput: 'success',
        actualOutput: 'success',
        passed: true,
        executionTime: Math.random() * 100,
        timestamp: new Date(),
      };
    },
    []
  );

  const handleTemplateApply = useCallback((template: any) => {
    // Apply template rules to current workflow
    const newRules = template.rules.map((rule: any, index: number) => ({
      ...rule,
      id: `template-rule-${Date.now()}-${index}`,
      lastModified: new Date(),
      modifiedBy: 'Current User',
      isValid: true,
      validationErrors: [],
    }));

    setWorkflowRules(prev => [...prev, ...newRules]);

    logDebug('Analytics: workflow_template_applied', {
      templateId: template.id,
      templateName: template.name,
      rulesAdded: newRules.length,
      timestamp: Date.now(),
    });
  }, []);

  const handleDecisionSubmit = useCallback(
    (decision: DecisionFormData) => {
      logDebug('Decision submitted:', { decision });
      // TODO: Implement actual decision submission logic (US-4.2)
      // Example: call an API, update state, etc.
      // Track analytics for decision submission (H7)
      logDebug('Analytics: decision_submitted', {
        decisionType: decision.decision,
        proposalId: selectedTask?.proposalId,
        timestamp: Date.now(),
      });
    },
    [selectedTask]
  );

  const handleRequestCollaboration = useCallback(
    (collaborators: string[]) => {
      logDebug('Collaboration requested with:', { collaborators });
      // TODO: Implement actual collaboration request logic (US-4.3)
      // Example: send notifications, update task assignees
      // Track analytics for collaboration request (H7)
      logDebug('Analytics: collaboration_requested', {
        collaboratorCount: collaborators.length,
        proposalId: selectedTask?.proposalId,
        timestamp: Date.now(),
      });
    },
    [selectedTask]
  );

  const handleUpdateChecklist = useCallback(
    (itemId: string, completed: boolean, notes?: string) => {
      logDebug('Checklist item updated:', { itemId, completed, notes });
      // TODO: Implement actual checklist update logic (US-4.1)
      // Example: update task checklist state, persist changes
      // Track analytics for checklist update (H7)
      logDebug('Analytics: checklist_item_updated', {
        itemId,
        completed,
        hasNotes: !!notes,
        proposalId: selectedTask?.proposalId,
        timestamp: Date.now(),
      });
    },
    [selectedTask]
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Approval Workflow Management</h1>
            <p className="text-gray-600 mt-1">
              Intelligent workflow orchestration, task prioritization, and rule-based automation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">{mockTasks.length} Active Tasks</Badge>
            <Badge variant="success">
              {workflowRules.filter(r => r.isActive).length} Active Rules
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {mockTasks.filter(t => t.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending Tasks</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {mockTasks.filter(t => t.priority === 'critical' || t.priority === 'high').length}
              </div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(
                  mockTasks.reduce((sum, task) => sum + task.slaCompliance, 0) / mockTasks.length
                )}
                %
              </div>
              <div className="text-sm text-gray-600">SLA Compliance</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{workflowRules.length}</div>
              <div className="text-sm text-gray-600">Active Rules</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'queue', label: 'Approval Queue', icon: QueueListIcon },
            { id: 'orchestrator', label: 'Workflow Orchestrator', icon: AdjustmentsHorizontalIcon },
            { id: 'visualization', label: 'Progress Tracking', icon: ChartBarIcon },
            { id: 'rules', label: 'Rule Builder', icon: CogIcon },
            { id: 'decision', label: 'Decision Interface', icon: ClipboardDocumentListIcon },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'queue' && (
          <ApprovalQueue
            currentUser="Current User"
            onItemSelect={item => {
              // Convert QueueItem to ApprovalTask for compatibility
              const task: ApprovalTask = {
                id: item.id,
                type: 'proposal_review',
                title: item.proposalName,
                description: `Review ${item.proposalName} for ${item.client}`,
                assignee: item.assignee,
                priority: item.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
                status: item.status.toLowerCase().replace(' ', '_') as
                  | 'pending'
                  | 'in_progress'
                  | 'completed'
                  | 'rejected',
                dueDate: item.deadline,
                proposalId: item.proposalId,
                proposalTitle: item.proposalName,
                estimatedTime: item.estimatedDuration * 60, // Convert hours to minutes
                dependencies: item.dependencies,
                tags: [item.stageType.toLowerCase()],
                slaCompliance: (item.slaRemaining / 24) * 100, // Convert to percentage
                businessValue: item.proposalValue,
                urgencyScore:
                  item.urgency === 'Immediate'
                    ? 10
                    : item.urgency === 'Today'
                      ? 8
                      : item.urgency === 'This Week'
                        ? 5
                        : 2,
                riskLevel: item.riskLevel.toLowerCase() as 'low' | 'medium' | 'high',
                currentStage: item.currentStage,
                comments: [],
                attachments: [],
                metadata: {
                  client: item.client,
                  stageType: item.stageType,
                  workflowId: item.workflowId,
                },
              };
              handleTaskSelect(task);
            }}
            onBulkAction={(action, items) => {
              logDebug('Bulk action:', { action, items });
            }}
            onQueueOptimization={metrics => {
              logDebug('Queue optimization metrics:', { metrics });
            }}
          />
        )}

        {activeTab === 'orchestrator' && (
          <WorkflowOrchestrator
            proposals={mockTasks.map(task => ({
              id: task.proposalId,
              title: task.proposalTitle,
              value: task.businessValue,
              priority: task.priority,
              currentStage: task.currentStage,
              assignee: task.assignee,
              dueDate: task.dueDate,
              riskLevel: task.riskLevel,
              metadata: task.metadata as Record<string, string | number | boolean | Date>,
            }))}
            templates={[
              {
                id: 'template-1',
                name: 'Standard Enterprise Approval',
                description: 'Standard workflow for enterprise-level proposals',
                stages: [
                  'initial_review',
                  'technical_validation',
                  'budget_approval',
                  'executive_sign_off',
                ],
                category: 'enterprise',
                estimatedDuration: 5,
                complexity: 'medium',
                successRate: 92,
                isActive: true,
              },
            ]}
            onWorkflowGenerate={(proposalId, workflow) => {
              logDebug('Workflow generated:', { proposalId, workflow });
            }}
            onTemplateSelect={template => {
              logDebug('Template selected:', { template });
            }}
          />
        )}

        {activeTab === 'visualization' && mockTasks.length > 0 && (
          <WorkflowVisualization
            workflowId={mockTasks[0].id}
            proposalId={mockTasks[0].proposalId}
            proposalName={mockTasks[0].proposalTitle}
            stages={[
              {
                id: 'initial_review',
                name: 'Initial Review',
                type: 'Technical',
                status: mockTasks[0].currentStage === 'initial_review' ? 'In Progress' : 'Approved',
                assignee: mockTasks[0].assignee,
                estimatedDuration: 60,
                actualDuration: mockTasks[0].currentStage !== 'initial_review' ? 45 : 0,
                deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                endTime:
                  mockTasks[0].currentStage !== 'initial_review'
                    ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
                    : undefined,
                dependencies: [],
                isParallel: false,
                isCriticalPath: true,
                slaCompliance: true,
                bottleneckRisk: 'Low',
              },
              {
                id: 'technical_validation',
                name: 'Technical Validation',
                type: 'Technical',
                status: 'Not Started',
                assignee: 'Tech Team',
                estimatedDuration: 90,
                actualDuration: 0,
                deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                dependencies: ['initial_review'],
                isParallel: false,
                isCriticalPath: true,
                slaCompliance: true,
                bottleneckRisk: 'Medium',
              },
              {
                id: 'budget_approval',
                name: 'Budget Approval',
                type: 'Finance',
                status: 'Not Started',
                assignee: 'Finance Team',
                estimatedDuration: 120,
                actualDuration: 0,
                deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                dependencies: ['technical_validation'],
                isParallel: false,
                isCriticalPath: true,
                slaCompliance: true,
                bottleneckRisk: 'High',
              },
            ]}
            criticalPath={['initial_review', 'technical_validation', 'budget_approval']}
            parallelStages={[]}
            onStageUpdate={(stageId, updates) => {
              logDebug('Stage updated:', { stageId, updates });
            }}
            onTimelineUpdate={timeline => {
              logDebug('Timeline updated:', { timeline });
            }}
          />
        )}

        {activeTab === 'rules' && (
          <WorkflowRuleBuilder
            rules={workflowRules}
            availableFields={availableFields}
            onRuleSave={handleRuleSave as unknown as (rule: any) => void}
            onRuleDelete={handleRuleDelete as unknown as (rule: any) => void}
            onRuleTest={
              handleRuleTest as unknown as (
                rule: any,
                testData: Record<string, string | number | boolean | string[]>
              ) => Promise<any>
            }
            onTemplateApply={handleTemplateApply}
          />
        )}

        {activeTab === 'decision' &&
          selectedTask &&
          (() => {
            const decisionContextData: DecisionContext = {
              proposalId: selectedTask.proposalId,
              proposalName: selectedTask.proposalTitle,
              client: (selectedTask.metadata?.clientName as string) || 'N/A', // Example: get client from metadata or default
              stageId: selectedTask.currentStage, // Assuming stageId is currentStage
              stageName: selectedTask.currentStage, // Assuming stageName is currentStage
              stageType: (() => {
                switch (selectedTask.type) {
                  case 'technical_validation':
                    return 'Technical';
                  case 'budget_approval':
                    return 'Finance';
                  case 'executive_sign_off':
                    return 'Executive';
                  case 'proposal_review':
                    return 'Compliance'; // Example mapping
                  default:
                    return 'Compliance'; // Default or throw error
                }
              })(),
              assignee: selectedTask.assignee,
              deadline: selectedTask.dueDate,
              slaRemaining: selectedTask.slaCompliance, // Or calculate if needed
              priority: (selectedTask.priority.charAt(0).toUpperCase() +
                selectedTask.priority.slice(1)) as DecisionContext['priority'],
              proposalValue: selectedTask.businessValue,
              riskLevel: (selectedTask.riskLevel.charAt(0).toUpperCase() +
                selectedTask.riskLevel.slice(1)) as DecisionContext['riskLevel'],
              previousStageComments: (selectedTask.comments || []).map(
                (comment: any, index: number) => ({
                  id: `comment-${index}-${selectedTask.id}`,
                  stageId: comment.stageId || selectedTask.currentStage, // attempt to get from comment or default
                  stageName: comment.stageName || selectedTask.currentStage, // attempt to get from comment or default
                  author: comment.author || 'Unknown',
                  content: comment.content || String(comment), // handle if comment is just a string
                  timestamp: comment.timestamp ? new Date(comment.timestamp) : new Date(),
                  type: comment.type || 'comment',
                  isResolved: comment.isResolved || false,
                })
              ) as StageComment[],
              attachments: (selectedTask.attachments || []).map((att: any, index: number) => ({
                id: `att-${index}-${selectedTask.id}`,
                name: att.name || 'Attachment',
                type: att.type || 'unknown',
                size: att.size || 0,
                uploadedBy: att.uploadedBy || 'System',
                uploadedAt: att.uploadedAt ? new Date(att.uploadedAt) : new Date(),
                url: att.url || '#',
                category: att.category || 'general',
              })) as ProposalAttachment[],
              checklist: [
                {
                  id: 'check-1',
                  description: 'Verify budget allocation and availability',
                  isRequired: true,
                  isCompleted: false,
                  category: 'financial',
                },
                {
                  id: 'check-2',
                  description: 'Confirm technical requirements can be met',
                  isRequired: true,
                  isCompleted: false,
                  category: 'technical',
                },
                {
                  id: 'check-3',
                  description: 'Ensure adherence to all legal standards',
                  isRequired: true,
                  isCompleted: false,
                  category: 'legal',
                },
                {
                  id: 'check-4',
                  description: 'Evaluate potential security risks and mitigations',
                  isRequired: false,
                  isCompleted: false,
                  category: 'security',
                },
                {
                  id: 'check-5',
                  description: 'Confirm all key stakeholders are in agreement',
                  isRequired: true,
                  isCompleted: false,
                  category: 'business',
                },
              ] as ChecklistItem[],
              policies: [] as PolicyReference[], // Populate as needed
              collaborators: [] as Collaborator[], // Populate as needed
              history: [] as DecisionHistory[], // Populate from selectedTask.comments if applicable, or other source
            };

            return (
              <DecisionInterface
                context={decisionContextData}
                currentUser="current_user_id" // Replace with actual current user ID
                onDecisionSubmit={handleDecisionSubmit}
                onRequestCollaboration={handleRequestCollaboration}
                onUpdateChecklist={handleUpdateChecklist}
              />
            );
          })()}

        {activeTab === 'decision' && !selectedTask && (
          <Card className="p-12 text-center">
            <ClipboardDocumentListIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Task Selected</h3>
            <p className="text-gray-600 mb-4">
              Select a task from the Approval Queue to start the decision process
            </p>
            <Button onClick={() => setActiveTab('queue')}>Go to Approval Queue</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
