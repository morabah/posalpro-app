/**
 * PosalPro MVP2 - Executive Review Portal
 * Based on EXECUTIVE_REVIEW_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H7 hypothesis validation
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/forms/Button';
import {
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  LightBulbIcon,
  PencilIcon,
  UserIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.2', 'AC-4.1.3', 'AC-4.3.1', 'AC-4.3.2', 'AC-4.3.3'],
  methods: [
    'complexityVisualization()',
    'calculatePriority()',
    'criticalPath()',
    'displayMetrics()',
    'generateInsights()',
    'trackProgress()',
  ],
  hypotheses: ['H7'],
  testCases: ['TC-H7-001', 'TC-H7-002'],
};

// Decision status enumeration
enum DecisionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DECLINED = 'declined',
  CONDITIONAL = 'conditional',
  DELEGATED = 'delegated',
  CHANGES_REQUESTED = 'changes_requested',
}

// Proposal status enumeration
enum ProposalStatus {
  READY = 'ready',
  AT_RISK = 'at_risk',
  UNDER_REVIEW = 'under_review',
  BLOCKED = 'blocked',
}

// Executive proposal interface
interface ExecutiveProposal {
  id: string;
  title: string;
  customer: string;
  value: number;
  deadline: Date;
  status: ProposalStatus;
  complexity: 'low' | 'medium' | 'high';
  priority: number;
  winProbability: number;
  deliveryConfidence: number;
  resourceAvailability: number;
  strategicAlignment: number;
  summary: {
    description: string;
    margin: number;
    competitorCount: number;
    duration: string;
    keyObjectives: string[];
  };
  criticalPath: CriticalPathItem[];
  aiInsights: AIInsight[];
  team: {
    proposalManager: string;
    leadSME: string;
    salesRep: string;
  };
}

// Critical path item interface
interface CriticalPathItem {
  id: string;
  step: string;
  status: 'completed' | 'in_progress' | 'pending' | 'at_risk';
  completedAt?: Date;
  assignee?: string;
}

// AI insight interface
interface AIInsight {
  id: string;
  type: 'risk' | 'opportunity' | 'recommendation';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  recommendation?: string;
  confidence: number;
}

// Decision record interface
interface DecisionRecord {
  id: string;
  proposalId: string;
  decision: DecisionStatus;
  executiveId: string;
  executiveName: string;
  timestamp: Date;
  conditions?: string;
  notes?: string;
  signature: string;
  decisionTime: number; // milliseconds
}

// Executive metrics for H7 validation
interface ExecutiveMetrics {
  proposalId: string;
  decisionTime: number;
  complexityScore: number;
  timelineImpact: number;
  criticalPathPosition: boolean;
  queuePosition: number;
  priorityScore: number;
  dependenciesConsidered: number;
  riskLevel: string;
  decisionType: string;
  contextCompleteness: number;
  aiRecommendationAccuracy: number;
  delegationFrequency: number;
  signatureTime: number;
}

export default function ExecutiveReviewPortal() {
  const router = useRouter();
  const [proposals, setProposals] = useState<ExecutiveProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [decision, setDecision] = useState<DecisionStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'team' | 'history' | 'kpis'>('pending');
  const [decisionInProgress, setDecisionInProgress] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<DecisionStatus | null>(null);
  const [conditions, setConditions] = useState('');
  const [signature, setSignature] = useState('');
  const [sessionStartTime] = useState(Date.now());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/executive/proposals');
        if (!response.ok) {
          throw new Error('Failed to fetch executive proposals');
        }
        const data = await response.json();
        setProposals(data);
        if (data.length > 0) {
          setSelectedProposalId(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

  const selectedProposal = useMemo(
    () => proposals.find(p => p.id === selectedProposalId),
    [proposals, selectedProposalId]
  );

  // Sort proposals by priority and deadline
  const sortedProposals = useMemo(() => {
    return [...proposals].sort((a, b) => {
      // First by priority (higher first)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Then by deadline (sooner first)
      return a.deadline.getTime() - b.deadline.getTime();
    });
  }, [proposals]);

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    const pending = proposals.filter(p => !p.id.includes('decided')).length;
    const totalValue = proposals.reduce((sum, p) => sum + p.value, 0);
    const avgWinProb = proposals.reduce((sum, p) => sum + p.winProbability, 0) / proposals.length;
    const atRisk = proposals.filter(p => p.status === ProposalStatus.AT_RISK).length;

    return {
      pending,
      totalValue,
      avgWinProb: Math.round(avgWinProb),
      atRisk,
    };
  }, [proposals]);

  // Analytics tracking
  const trackAction = useCallback(
    (action: string, metadata: any = {}) => {
      console.log('Executive Review Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        proposalId: selectedProposal?.id,
        sessionDuration: Date.now() - sessionStartTime,
      });
    },
    [selectedProposal?.id, sessionStartTime]
  );

  // Handle proposal selection
  const handleProposalSelect = useCallback(
    (proposal: ExecutiveProposal) => {
      setSelectedProposalId(proposal.id);
      setSelectedDecision(null);
      setConditions('');
      setSignature('');

      trackAction('proposal_selected', {
        proposalId: proposal.id,
        proposalValue: proposal.value,
        complexity: proposal.complexity,
        priority: proposal.priority,
      });
    },
    [trackAction]
  );

  // Handle decision making
  const handleDecision = useCallback(
    (decision: DecisionStatus) => {
      if (!selectedProposal) return;

      setDecisionInProgress(true);
      const decisionStartTime = Date.now();

      trackAction('decision_started', {
        decision,
        proposalId: selectedProposal.id,
        aiRecommendation:
          selectedProposal.aiInsights.find(i => i.type === 'recommendation')?.title || 'none',
      });

      // Simulate decision processing
      setTimeout(() => {
        const decisionTime = Date.now() - decisionStartTime;
        const totalSessionTime = Date.now() - sessionStartTime;

        const metrics: ExecutiveMetrics = {
          proposalId: selectedProposal.id,
          decisionTime,
          complexityScore:
            selectedProposal.complexity === 'high'
              ? 8
              : selectedProposal.complexity === 'medium'
                ? 5
                : 3,
          timelineImpact: selectedProposal.priority / 10,
          criticalPathPosition: selectedProposal.status === ProposalStatus.AT_RISK,
          queuePosition: sortedProposals.findIndex(p => p.id === selectedProposal.id) + 1,
          priorityScore: selectedProposal.priority,
          dependenciesConsidered: selectedProposal.criticalPath.length,
          riskLevel: selectedProposal.status === ProposalStatus.AT_RISK ? 'high' : 'medium',
          decisionType: decision,
          contextCompleteness: 8.5, // Mock score
          aiRecommendationAccuracy: 0.85, // Mock score
          delegationFrequency: 0.1, // Mock score
          signatureTime: signature ? 2000 : 0, // Mock time
        };

        trackAction('executive_decision_completed', metrics);

        setDecisionInProgress(false);
        setSelectedDecision(decision);

        // Navigate back to dashboard after decision
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }, 1500);
    },
    [selectedProposal, sortedProposals, sessionStartTime, signature, trackAction, router]
  );

  // Get status icon and color
  const getStatusDisplay = (status: ProposalStatus) => {
    switch (status) {
      case ProposalStatus.READY:
        return {
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bg: 'bg-green-100',
          label: 'Ready',
        };
      case ProposalStatus.AT_RISK:
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-red-600',
          bg: 'bg-red-100',
          label: 'Risk',
        };
      case ProposalStatus.UNDER_REVIEW:
        return { icon: ClockIcon, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Review' };
      case ProposalStatus.BLOCKED:
        return { icon: XCircleIcon, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Blocked' };
      default:
        return { icon: ClockIcon, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Unknown' };
    }
  };

  // Get critical path status icon
  const getCriticalPathIcon = (status: CriticalPathItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <ClockIcon className="w-5 h-5 text-blue-600" />;
      case 'at_risk':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300"></div>;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    trackAction('executive_portal_accessed', {
      pendingProposals: dashboardMetrics.pending,
      totalValue: dashboardMetrics.totalValue,
    });
  }, [dashboardMetrics, trackAction]);

  if (loading) {
    return <p>Loading executive review portal...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Executive Review Portal</h1>
              <p className="text-gray-600">
                {dashboardMetrics.pending} proposals pending review •{' '}
                {formatCurrency(dashboardMetrics.totalValue)} total value
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm text-gray-600">
                <div>Average Win Probability: {dashboardMetrics.avgWinProb}%</div>
                <div className="text-red-600">{dashboardMetrics.atRisk} proposals at risk</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <Card className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'pending', label: 'Pending Decisions', count: dashboardMetrics.pending },
                { id: 'team', label: 'My Team', count: null },
                { id: 'history', label: 'History', count: null },
                { id: 'kpis', label: 'KPIs', count: null },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-1 text-xs rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Pending Decisions Tab */}
            {activeTab === 'pending' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Proposals List */}
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Pending Decisions ({sortedProposals.length})
                  </h3>
                  <div className="space-y-3">
                    {sortedProposals.map(proposal => {
                      const statusDisplay = getStatusDisplay(proposal.status);
                      const isSelected = selectedProposal?.id === proposal.id;

                      return (
                        <Card
                          key={proposal.id}
                          className={`cursor-pointer transition-all duration-200 ${
                            isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-md'
                          }`}
                          onClick={() => handleProposalSelect(proposal)}
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-gray-900 text-sm">
                                {proposal.title}
                              </h4>
                              <div
                                className={`px-2 py-1 text-xs rounded-full ${statusDisplay.bg} ${statusDisplay.color}`}
                              >
                                {statusDisplay.label}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">{proposal.customer}</div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-green-600">
                                {formatCurrency(proposal.value)}
                              </span>
                              <span className="text-gray-500">
                                Due: {proposal.deadline.toLocaleDateString()}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <span>Win: {proposal.winProbability}%</span>
                              <span className="mx-2">•</span>
                              <span>Priority: {proposal.priority}</span>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Proposal Details */}
                <div className="lg:col-span-2">
                  {selectedProposal ? (
                    <div className="space-y-6">
                      {/* Proposal Header */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-bold text-gray-900">
                            {selectedProposal.title}
                          </h2>
                          <div className="flex items-center space-x-4">
                            {(() => {
                              const statusDisplay = getStatusDisplay(selectedProposal.status);
                              const StatusIcon = statusDisplay.icon;
                              return <StatusIcon className={`w-6 h-6 ${statusDisplay.color}`} />;
                            })()}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Customer:</span>
                            <div className="font-medium">{selectedProposal.customer}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Value:</span>
                            <div className="font-medium text-green-600">
                              {formatCurrency(selectedProposal.value)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Deadline:</span>
                            <div className="font-medium">
                              {selectedProposal.deadline.toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Margin:</span>
                            <div className="font-medium">{selectedProposal.summary.margin}%</div>
                          </div>
                        </div>
                      </div>

                      {/* Executive Summary */}
                      <Card>
                        <div className="p-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Executive Summary
                          </h3>
                          <p className="text-gray-700 mb-4">
                            {selectedProposal.summary.description}
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Duration:</span>
                              <span className="ml-2 font-medium">
                                {selectedProposal.summary.duration}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Competitors:</span>
                              <span className="ml-2 font-medium">
                                {selectedProposal.summary.competitorCount}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4">
                            <span className="text-gray-600 text-sm block mb-2">
                              Key Objectives:
                            </span>
                            <ul className="space-y-1">
                              {selectedProposal.summary.keyObjectives.map((objective, index) => (
                                <li key={index} className="flex items-start text-sm">
                                  <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                  <span className="text-gray-700">{objective}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </Card>

                      {/* Key Metrics */}
                      <Card>
                        <div className="p-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {selectedProposal.winProbability}%
                              </div>
                              <div className="text-sm text-gray-600">Win Probability</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {selectedProposal.deliveryConfidence}%
                              </div>
                              <div className="text-sm text-gray-600">Delivery Confidence</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-600">
                                {selectedProposal.resourceAvailability}%
                              </div>
                              <div className="text-sm text-gray-600">Resource Availability</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {selectedProposal.strategicAlignment}%
                              </div>
                              <div className="text-sm text-gray-600">Strategic Alignment</div>
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* Critical Path */}
                      <Card>
                        <div className="p-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Critical Path to Decision
                          </h3>
                          <div className="space-y-3">
                            {selectedProposal.criticalPath.map((item, index) => (
                              <div key={item.id} className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  {getCriticalPathIcon(item.status)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">
                                      {index + 1}. {item.step}
                                    </span>
                                    {item.completedAt && (
                                      <span className="text-sm text-gray-500">
                                        {item.completedAt.toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                  {item.assignee && (
                                    <div className="text-sm text-gray-600">
                                      Assignee: {item.assignee}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>

                      {/* AI Decision Support */}
                      {selectedProposal.aiInsights.length > 0 && (
                        <Card>
                          <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                              AI Decision Support
                            </h3>
                            <div className="space-y-4">
                              {selectedProposal.aiInsights.map(insight => (
                                <div
                                  key={insight.id}
                                  className={`p-4 rounded-lg border-l-4 ${
                                    insight.type === 'risk'
                                      ? 'border-red-500 bg-red-50'
                                      : insight.type === 'opportunity'
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-blue-500 bg-blue-50'
                                  }`}
                                >
                                  <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                      {insight.type === 'risk' && (
                                        <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                                      )}
                                      {insight.type === 'opportunity' && (
                                        <LightBulbIcon className="w-5 h-5 text-green-600" />
                                      )}
                                      {insight.type === 'recommendation' && (
                                        <LightBulbIcon className="w-5 h-5 text-blue-600" />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                                      <p className="text-sm text-gray-700 mt-1">
                                        {insight.description}
                                      </p>
                                      {insight.recommendation && (
                                        <div className="mt-2 p-2 bg-white rounded text-sm">
                                          <strong>Recommendation:</strong> {insight.recommendation}
                                        </div>
                                      )}
                                      <div className="mt-2 text-xs text-gray-500">
                                        Confidence: {insight.confidence}%
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Card>
                      )}

                      {/* Decision Actions */}
                      <Card>
                        <div className="p-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Decision Actions
                          </h3>

                          {!selectedDecision && !decisionInProgress && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <Button
                                  variant="primary"
                                  onClick={() => handleDecision(DecisionStatus.APPROVED)}
                                  className="flex items-center justify-center"
                                >
                                  <HandThumbUpIcon className="w-5 h-5 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={() => handleDecision(DecisionStatus.DECLINED)}
                                  className="flex items-center justify-center"
                                >
                                  <HandThumbDownIcon className="w-5 h-5 mr-2" />
                                  Decline
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={() => handleDecision(DecisionStatus.CONDITIONAL)}
                                  className="flex items-center justify-center"
                                >
                                  <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                                  Conditional
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={() => handleDecision(DecisionStatus.CHANGES_REQUESTED)}
                                  className="flex items-center justify-center"
                                >
                                  <PencilIcon className="w-5 h-5 mr-2" />
                                  Changes
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={() => handleDecision(DecisionStatus.DELEGATED)}
                                  className="flex items-center justify-center md:col-span-2"
                                >
                                  <UserIcon className="w-5 h-5 mr-2" />
                                  Delegate
                                </Button>
                              </div>

                              {/* Conditions Input */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Conditions or Notes (Optional)
                                </label>
                                <textarea
                                  value={conditions}
                                  onChange={e => setConditions(e.target.value)}
                                  placeholder="Enter any conditions, notes, or feedback..."
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  rows={3}
                                />
                              </div>

                              {/* Digital Signature */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Digital Signature
                                </label>
                                <Input
                                  type="text"
                                  value={signature}
                                  onChange={e => setSignature(e.target.value)}
                                  placeholder="Type your full name to sign digitally"
                                  className="max-w-md"
                                />
                              </div>
                            </div>
                          )}

                          {decisionInProgress && (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                              <p className="text-gray-600">Processing your decision...</p>
                            </div>
                          )}

                          {selectedDecision && !decisionInProgress && (
                            <div className="text-center py-8">
                              <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
                              <h4 className="text-lg font-medium text-gray-900 mb-2">
                                Decision Recorded:{' '}
                                {selectedDecision.replace('_', ' ').toUpperCase()}
                              </h4>
                              <p className="text-gray-600">
                                Your decision has been recorded and the proposal workflow will
                                continue.
                              </p>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select a proposal to review
                      </h3>
                      <p className="text-gray-600">
                        Choose a proposal from the list to view details and make a decision.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Other tabs placeholder */}
            {activeTab !== 'pending' && (
              <div className="text-center py-12">
                <CogIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} View
                </h3>
                <p className="text-gray-600">
                  This section is available for future implementation.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
