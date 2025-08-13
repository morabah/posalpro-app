'use client';

/**
 * PosalPro MVP2 - Decision Interface Component
 * Based on APPROVAL_WORKFLOW_SCREEN.md wireframe specifications
 * Implements collaborative decision-making with contextual approval forms
 *
 * User Stories: US-4.1, US-4.3
 * Hypotheses: H7 (40% on-time improvement)
 * Component Traceability: DecisionInterface, updateStatus(), trackActivity()
 */

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Progress } from '@/components/ui/Progress';
import {
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  HandRaisedIcon,
  InformationCircleIcon,
  PaperClipIcon,
  UserGroupIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3'],
  acceptanceCriteria: ['AC-4.1.3', 'AC-4.3.2'],
  methods: ['updateStatus()', 'trackActivity()'],
  hypotheses: ['H7'],
  testCases: ['TC-H7-003'],
};

// Types for decision interface
export interface DecisionContext {
  proposalId: string;
  proposalName: string;
  client: string;
  stageId: string;
  stageName: string;
  stageType: 'Technical' | 'Legal' | 'Finance' | 'Executive' | 'Security' | 'Compliance';
  assignee: string;
  deadline: Date;
  slaRemaining: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  proposalValue: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  previousStageComments: StageComment[];
  attachments: ProposalAttachment[];
  checklist: ChecklistItem[];
  policies: PolicyReference[];
  collaborators: Collaborator[];
  history: DecisionHistory[];
}

export interface StageComment {
  id: string;
  stageId: string;
  stageName: string;
  author: string;
  content: string;
  timestamp: Date;
  type: 'comment' | 'concern' | 'recommendation';
  isResolved: boolean;
}

export interface ProposalAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  url: string;
  category: 'proposal' | 'contract' | 'technical' | 'financial' | 'legal';
}

export interface ChecklistItem {
  id: string;
  description: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Date;
  notes?: string;
  category: 'compliance' | 'technical' | 'financial' | 'legal' | 'business';
}

export interface PolicyReference {
  id: string;
  title: string;
  description: string;
  type: 'guideline' | 'requirement' | 'policy';
  applicableStages: string[];
  riskLevel: 'info' | 'warning' | 'critical';
  url?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  department: string;
  isRequired: boolean;
  hasReviewed: boolean;
  reviewedAt?: Date;
  feedback?: string;
  recommendation?: 'approve' | 'reject' | 'needs_changes';
}

export interface DecisionHistory {
  id: string;
  decision: 'approved' | 'rejected' | 'needs_changes' | 'delegated' | 'escalated';
  decisionBy: string;
  timestamp: Date;
  comments: string;
  nextStage?: string;
  delegatedTo?: string;
}

export interface DecisionFormData {
  decision:
    | 'approve'
    | 'approve_with_comments'
    | 'needs_changes'
    | 'reject'
    | 'delegate'
    | 'escalate';
  comments: string;
  delegateTo?: string;
  nextReviewDate?: Date;
  requiredChanges?: string[];
  escalationReason?: string;
  notifyStakeholders: boolean;
  attachments: File[];
}

interface DecisionInterfaceProps {
  context: DecisionContext;
  currentUser: string;
  onDecisionSubmit: (decision: DecisionFormData) => void;
  onRequestCollaboration: (collaborators: string[]) => void;
  onUpdateChecklist: (itemId: string, completed: boolean, notes?: string) => void;
}

export function DecisionInterface({
  context,
  currentUser,
  onDecisionSubmit,
  onRequestCollaboration,
  onUpdateChecklist,
}: DecisionInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'checklist' | 'collaboration' | 'history'>(
    'summary'
  );
  const [decisionForm, setDecisionForm] = useState<DecisionFormData>({
    decision: 'approve',
    comments: '',
    delegateTo: '',
    nextReviewDate: undefined,
    requiredChanges: [],
    escalationReason: '',
    notifyStakeholders: true,
    attachments: [],
  });
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);

  // Temporary analytics stub until useAnalytics is available
  const analytics = {
    track: (_event: string, _data: Record<string, unknown>) => {
      // no-op to avoid console noise; integrate with useOptimizedAnalytics if needed
    },
  };

  // Calculate completion metrics
  const completionMetrics = useMemo(() => {
    const totalChecklist = context.checklist.length;
    const completedChecklist = context.checklist.filter(item => item.isCompleted).length;
    const requiredCompleted = context.checklist.filter(
      item => item.isRequired && item.isCompleted
    ).length;
    const totalRequired = context.checklist.filter(item => item.isRequired).length;

    const totalCollaborators = context.collaborators.filter(c => c.isRequired).length;
    const reviewedCollaborators = context.collaborators.filter(
      c => c.isRequired && c.hasReviewed
    ).length;

    const checklistProgress =
      totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 100;
    const collaborationProgress =
      totalCollaborators > 0 ? (reviewedCollaborators / totalCollaborators) * 100 : 100;
    const overallProgress = (checklistProgress + collaborationProgress) / 2;

    const canProceed =
      requiredCompleted === totalRequired && reviewedCollaborators === totalCollaborators;

    return {
      checklistProgress,
      collaborationProgress,
      overallProgress,
      canProceed,
      totalChecklist,
      completedChecklist,
      totalRequired,
      requiredCompleted,
      totalCollaborators,
      reviewedCollaborators,
    };
  }, [context.checklist, context.collaborators]);

  // Track decision analytics for H7 hypothesis validation
  useEffect(() => {
    // analytics event hook placeholder
  }, [context, completionMetrics.overallProgress]);

  const handleDecisionSubmit = useCallback(() => {
    // Validate required fields
    if (!decisionForm.comments.trim() && decisionForm.decision !== 'approve') {
      alert('Comments are required for this decision type.');
      return;
    }

    if (decisionForm.decision === 'delegate' && !decisionForm.delegateTo) {
      alert('Please select someone to delegate to.');
      return;
    }

    if (
      decisionForm.decision === 'escalate' &&
      (!decisionForm.escalationReason || !decisionForm.escalationReason.trim())
    ) {
      alert('Please provide an escalation reason.');
      return;
    }

    // Track decision analytics
    // analytics event placeholder

    onDecisionSubmit(decisionForm);
  }, [decisionForm, context, completionMetrics.overallProgress, onDecisionSubmit]);

  const handleChecklistUpdate = useCallback(
    (itemId: string, completed: boolean, notes?: string) => {
      onUpdateChecklist(itemId, completed, notes);

      // Track checklist progress for H7 hypothesis
      // analytics event placeholder
    },
    [context, completionMetrics.checklistProgress, onUpdateChecklist]
  );

  const handleCollaborationRequest = useCallback(() => {
    if (selectedCollaborators.length === 0) return;

    onRequestCollaboration(selectedCollaborators);
    setSelectedCollaborators([]);

    // analytics event placeholder
  }, [selectedCollaborators, context, onRequestCollaboration]);

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'approve':
      case 'approve_with_comments':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'reject':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'needs_changes':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'delegate':
        return <UserGroupIcon className="h-5 w-5 text-blue-500" />;
      case 'escalate':
        return <HandRaisedIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'text-red-600 bg-red-100';
      case 'High':
        return 'text-orange-600 bg-orange-100';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'Low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Context Summary */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {context.stageName} - {context.proposalName}
            </h2>
            <div className="text-sm text-gray-600 mt-1">
              {context.client} • Value: ${(context.proposalValue / 1000).toFixed(0)}K
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getPriorityColor(context.priority)}>{context.priority}</Badge>
            <Badge variant={context.slaRemaining < 2 ? 'destructive' : 'default'}>
              SLA: {context.slaRemaining.toFixed(1)}h
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Progress Overview</h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Overall Completion</span>
                  <span>{completionMetrics.overallProgress.toFixed(0)}%</span>
                </div>
                <Progress
                  value={completionMetrics.overallProgress}
                  className="h-2"
                  variant={completionMetrics.overallProgress > 80 ? 'success' : 'warning'}
                />
              </div>
              <div className="text-xs text-gray-500">
                Ready to proceed: {completionMetrics.canProceed ? 'Yes' : 'No'}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Key Information</h4>
            <div className="space-y-1 text-sm">
              <div>Assignee: {context.assignee}</div>
              <div>Deadline: {context.deadline.toLocaleDateString()}</div>
              <div>Risk Level: {context.riskLevel}</div>
              <div>Attachments: {context.attachments.length}</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Recent Activity</h4>
            <div className="space-y-1 text-sm">
              {context.history.slice(0, 3).map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  {getDecisionIcon(item.decision)}
                  <span className="text-gray-600">
                    {item.decision} by {item.decisionBy}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'summary', label: 'Summary', icon: InformationCircleIcon },
            { id: 'checklist', label: 'Checklist', icon: CheckCircleIcon },
            { id: 'collaboration', label: 'Collaboration', icon: UserGroupIcon },
            { id: 'history', label: 'History', icon: ClockIcon },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as 'summary' | 'checklist' | 'collaboration' | 'history')
              }
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Tab Content */}
        <div className="space-y-6">
          {activeTab === 'summary' && (
            <Card className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">Proposal Summary</h3>

              {/* Previous Stage Comments */}
              {context.previousStageComments.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Previous Stage Comments
                  </h4>
                  <div className="space-y-3">
                    {context.previousStageComments.map(comment => (
                      <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-sm text-gray-900">
                            {comment.stageName} - {comment.author}
                          </div>
                          <Badge
                            variant={comment.type === 'concern' ? 'warning' : 'default'}
                            size="sm"
                          >
                            {comment.type}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-700">{comment.content}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {comment.timestamp.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Policy References */}
              {context.policies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Relevant Policies</h4>
                  <div className="space-y-2">
                    {context.policies.map(policy => (
                      <div key={policy.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            policy.riskLevel === 'critical'
                              ? 'bg-red-500'
                              : policy.riskLevel === 'warning'
                                ? 'bg-yellow-500'
                                : 'bg-blue-500'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">{policy.title}</div>
                          <div className="text-sm text-gray-600">{policy.description}</div>
                          {policy.url && (
                            <a href={policy.url} className="text-xs text-blue-600 hover:underline">
                              View Policy
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {activeTab === 'checklist' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Review Checklist</h3>
                <Badge variant={completionMetrics.canProceed ? 'success' : 'warning'}>
                  {completionMetrics.completedChecklist}/{completionMetrics.totalChecklist} Complete
                </Badge>
              </div>

              <div className="space-y-3">
                {context.checklist.map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      checked={item.isCompleted}
                      onChange={e => handleChecklistUpdate(item.id, e.target.checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div
                        className={`text-sm ${item.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}
                      >
                        {item.description}
                        {item.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      {item.isCompleted && item.completedBy && (
                        <div className="text-xs text-gray-500 mt-1">
                          Completed by {item.completedBy} on{' '}
                          {item.completedAt?.toLocaleDateString()}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-xs text-gray-600 mt-1 italic">Note: {item.notes}</div>
                      )}
                    </div>
                    <Badge variant="outline" size="sm">
                      {item.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'collaboration' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Required Reviews</h3>
                <Badge
                  variant={
                    completionMetrics.reviewedCollaborators === completionMetrics.totalCollaborators
                      ? 'success'
                      : 'warning'
                  }
                >
                  {completionMetrics.reviewedCollaborators}/{completionMetrics.totalCollaborators}{' '}
                  Reviewed
                </Badge>
              </div>

              <div className="space-y-3">
                {context.collaborators.map(collaborator => (
                  <div
                    key={collaborator.id}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        collaborator.hasReviewed ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">
                        {collaborator.name} - {collaborator.role}
                      </div>
                      <div className="text-sm text-gray-600">{collaborator.department}</div>
                      {collaborator.hasReviewed && collaborator.feedback && (
                        <div className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                          {collaborator.feedback}
                        </div>
                      )}
                      {collaborator.hasReviewed && collaborator.recommendation && (
                        <Badge
                          variant={
                            collaborator.recommendation === 'approve'
                              ? 'success'
                              : collaborator.recommendation === 'reject'
                                ? 'destructive'
                                : 'warning'
                          }
                          size="sm"
                          className="mt-2"
                        >
                          {collaborator.recommendation}
                        </Badge>
                      )}
                    </div>
                    {collaborator.isRequired && (
                      <Badge variant="outline" size="sm">
                        Required
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Request Additional Review
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter collaborator name or email"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={selectedCollaborators.join(', ')}
                    onChange={e =>
                      setSelectedCollaborators(e.target.value.split(',').map(s => s.trim()))
                    }
                  />
                  <Button
                    size="sm"
                    onClick={handleCollaborationRequest}
                    disabled={selectedCollaborators.length === 0}
                  >
                    <UserGroupIcon className="h-4 w-4 mr-1" />
                    Request
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'history' && (
            <Card className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">Decision History</h3>
              <div className="space-y-3">
                {context.history.map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    {getDecisionIcon(item.decision)}
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">
                        {item.decision.replace('_', ' ')} by {item.decisionBy}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{item.comments}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.timestamp.toLocaleString()}
                      </div>
                      {item.delegatedTo && (
                        <div className="text-xs text-blue-600 mt-1">
                          Delegated to: {item.delegatedTo}
                        </div>
                      )}
                      {item.nextStage && (
                        <div className="text-xs text-green-600 mt-1">
                          Next stage: {item.nextStage}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Decision Form */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Make Decision</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex items-center gap-2"
              >
                <CogIcon className="h-4 w-4" />
                Advanced
              </Button>
            </div>

            {/* Decision Options */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
                <div className="space-y-2">
                  {[
                    { value: 'approve', label: 'Approve', color: 'text-green-600' },
                    {
                      value: 'approve_with_comments',
                      label: 'Approve with Comments',
                      color: 'text-green-600',
                    },
                    { value: 'needs_changes', label: 'Request Changes', color: 'text-yellow-600' },
                    { value: 'reject', label: 'Reject', color: 'text-red-600' },
                    { value: 'delegate', label: 'Delegate', color: 'text-blue-600' },
                    { value: 'escalate', label: 'Escalate', color: 'text-orange-600' },
                  ].map(option => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="decision"
                        value={option.value}
                        checked={decisionForm.decision === option.value}
                        onChange={e =>
                          setDecisionForm(prev => ({
                            ...prev,
                            decision: e.target.value as DecisionFormData['decision'],
                          }))
                        }
                        className="mr-2"
                      />
                      <span className={`text-sm ${option.color}`}>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments{' '}
                  {decisionForm.decision !== 'approve' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={decisionForm.comments}
                  onChange={e => setDecisionForm(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Provide feedback, concerns, or recommendations..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              {/* Conditional Fields */}
              {decisionForm.decision === 'delegate' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delegate To <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={decisionForm.delegateTo}
                    onChange={e =>
                      setDecisionForm(prev => ({ ...prev, delegateTo: e.target.value }))
                    }
                    placeholder="Enter name or email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              )}

              {decisionForm.decision === 'escalate' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Escalation Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={decisionForm.escalationReason}
                    onChange={e =>
                      setDecisionForm(prev => ({ ...prev, escalationReason: e.target.value }))
                    }
                    placeholder="Explain why this needs escalation..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              )}

              {/* Advanced Options */}
              {showAdvancedOptions && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={decisionForm.notifyStakeholders}
                        onChange={e =>
                          setDecisionForm(prev => ({
                            ...prev,
                            notifyStakeholders: e.target.checked,
                          }))
                        }
                        className="mr-2"
                      />
                      <span className="text-sm">Notify stakeholders of this decision</span>
                    </label>
                  </div>

                  {decisionForm.decision === 'needs_changes' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Next Review Date
                      </label>
                      <input
                        type="date"
                        value={decisionForm.nextReviewDate?.toISOString().split('T')[0] || ''}
                        onChange={e =>
                          setDecisionForm(prev => ({
                            ...prev,
                            nextReviewDate: e.target.value ? new Date(e.target.value) : undefined,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  onClick={handleDecisionSubmit}
                  disabled={!completionMetrics.canProceed && decisionForm.decision === 'approve'}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {getDecisionIcon(decisionForm.decision)}
                  Submit Decision
                </Button>

                {!completionMetrics.canProceed && decisionForm.decision === 'approve' && (
                  <div className="text-sm text-yellow-600 mt-2">
                    Complete all required checklist items and reviews before approving.
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Attachments */}
          {context.attachments.length > 0 && (
            <Card className="p-6">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <PaperClipIcon className="h-4 w-4" />
                Attachments ({context.attachments.length})
              </h3>
              <div className="space-y-2">
                {context.attachments.map(attachment => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">{attachment.name}</div>
                      <div className="text-xs text-gray-500">
                        {attachment.category} • {(attachment.size / 1024).toFixed(1)} KB •
                        {attachment.uploadedBy}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
