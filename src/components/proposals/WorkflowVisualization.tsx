'use client';

/**
 * PosalPro MVP2 - Workflow Visualization Component
 * Based on APPROVAL_WORKFLOW_SCREEN.md wireframe specifications
 * Implements critical path visualization and timeline optimization
 *
 * User Stories: US-4.1
 * Hypotheses: H7 (40% on-time improvement)
 * Component Traceability: WorkflowVisualization, criticalPath(), trackOnTimeCompletion()
 */

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Progress } from '@/components/ui/Progress';
// import { useAnalytics } from '@/hooks/analytics/useAnalytics';
import {
  ArrowRightIcon,
  BoltIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1'],
  acceptanceCriteria: ['AC-4.1.2', 'AC-4.1.3'],
  methods: ['criticalPath()', 'trackOnTimeCompletion()'],
  hypotheses: ['H7'],
  testCases: ['TC-H7-001'],
};

// Types for workflow visualization
interface WorkflowStage {
  id: string;
  name: string;
  type: 'Technical' | 'Legal' | 'Finance' | 'Executive' | 'Security' | 'Compliance';
  status: 'Not Started' | 'In Progress' | 'Pending Approval' | 'Approved' | 'Rejected' | 'On Hold';
  assignee: string;
  estimatedDuration: number;
  actualDuration: number;
  deadline: Date;
  dependencies: string[];
  isParallel: boolean;
  isCriticalPath: boolean;
  startTime?: Date;
  endTime?: Date;
  slaCompliance: boolean;
  bottleneckRisk: 'Low' | 'Medium' | 'High';
}

interface WorkflowVisualizationProps {
  workflowId: string;
  proposalId: string;
  proposalName: string;
  stages: WorkflowStage[];
  criticalPath: string[];
  parallelStages: string[][];
  onStageUpdate: (stageId: string, updates: Partial<WorkflowStage>) => void;
  onTimelineUpdate: (timeline: TimelineMetrics) => void;
}

interface TimelineMetrics {
  totalEstimatedDuration: number;
  totalActualDuration: number;
  criticalPathDuration: number;
  parallelSavings: number;
  slaComplianceRate: number;
  onTimeCompletionLikelihood: number;
  bottleneckStages: string[];
  optimizationOpportunities: string[];
}

export function WorkflowVisualization({
  workflowId,
  proposalId,
  proposalName,
  stages,
  criticalPath,
  parallelStages,
  onStageUpdate,
  onTimelineUpdate,
}: WorkflowVisualizationProps) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'graph' | 'gantt'>('timeline');
  const [showOptimizations, setShowOptimizations] = useState(false);
  // const analytics = useAnalytics();
  const analytics = {
    track: (event: string, data: any) => {
      console.log(`Analytics: ${event}`, data);
    },
  };

  // AC-4.1.2: Critical path calculation and visualization
  const criticalPathAnalysis = useMemo(() => {
    const criticalStages = stages.filter(stage => criticalPath.includes(stage.id));
    const totalCriticalDuration = criticalStages.reduce(
      (sum, stage) => sum + stage.estimatedDuration,
      0
    );
    const actualCriticalDuration = criticalStages.reduce(
      (sum, stage) => sum + (stage.actualDuration || 0),
      0
    );

    // Calculate progress along critical path
    const completedCriticalStages = criticalStages.filter(
      stage => stage.status === 'Approved' || stage.status === 'Rejected'
    );
    const criticalPathProgress = (completedCriticalStages.length / criticalStages.length) * 100;

    // Identify bottlenecks
    const bottleneckStages = criticalStages.filter(
      stage =>
        stage.actualDuration > stage.estimatedDuration * 1.2 || stage.bottleneckRisk === 'High'
    );

    return {
      stages: criticalStages,
      totalDuration: totalCriticalDuration,
      actualDuration: actualCriticalDuration,
      progress: criticalPathProgress,
      bottlenecks: bottleneckStages,
      isOnTrack: actualCriticalDuration <= totalCriticalDuration,
    };
  }, [stages, criticalPath]);

  // AC-4.1.3: On-time completion tracking
  const timelineMetrics = useMemo((): TimelineMetrics => {
    const totalEstimated = stages.reduce((sum, stage) => sum + stage.estimatedDuration, 0);
    const totalActual = stages.reduce((sum, stage) => sum + (stage.actualDuration || 0), 0);

    // Calculate parallel processing savings
    const parallelSavings = parallelStages.reduce((savings, group) => {
      const groupStages = stages.filter(stage => group.includes(stage.id));
      const maxGroupDuration = Math.max(...groupStages.map(s => s.estimatedDuration));
      const totalGroupDuration = groupStages.reduce((sum, s) => sum + s.estimatedDuration, 0);
      return savings + (totalGroupDuration - maxGroupDuration);
    }, 0);

    // SLA compliance rate
    const slaCompliantStages = stages.filter(stage => stage.slaCompliance);
    const slaComplianceRate = (slaCompliantStages.length / stages.length) * 100;

    // On-time completion likelihood based on current progress
    const completedStages = stages.filter(
      stage => stage.status === 'Approved' || stage.status === 'Rejected'
    );
    const averageVariance =
      completedStages.length > 0
        ? completedStages.reduce(
            (sum, stage) => sum + stage.actualDuration / stage.estimatedDuration,
            0
          ) / completedStages.length
        : 1;

    const remainingWork = stages
      .filter(stage => stage.status === 'Not Started' || stage.status === 'In Progress')
      .reduce((sum, stage) => sum + stage.estimatedDuration, 0);

    const projectedCompletion = totalActual + remainingWork * averageVariance;
    const onTimeCompletionLikelihood = Math.max(
      0,
      100 - ((projectedCompletion - totalEstimated) / totalEstimated) * 100
    );

    // Identify optimization opportunities
    const optimizationOpportunities: string[] = [];
    if (parallelSavings > 0) {
      optimizationOpportunities.push(
        `Parallel processing saves ${parallelSavings.toFixed(1)} hours`
      );
    }
    if (slaComplianceRate < 90) {
      optimizationOpportunities.push('SLA compliance needs improvement');
    }
    if (criticalPathAnalysis.bottlenecks.length > 0) {
      optimizationOpportunities.push('Critical path bottlenecks identified');
    }

    return {
      totalEstimatedDuration: totalEstimated,
      totalActualDuration: totalActual,
      criticalPathDuration: criticalPathAnalysis.totalDuration,
      parallelSavings,
      slaComplianceRate,
      onTimeCompletionLikelihood,
      bottleneckStages: criticalPathAnalysis.bottlenecks.map(s => s.id),
      optimizationOpportunities,
    };
  }, [stages, parallelStages, criticalPathAnalysis]);

  // Track timeline updates for H7 hypothesis validation
  useEffect(() => {
    onTimelineUpdate(timelineMetrics);

    // Track analytics for H7 hypothesis
    analytics.track('workflow_timeline_analysis', {
      workflowId,
      proposalId,
      onTimeCompletionLikelihood: timelineMetrics.onTimeCompletionLikelihood,
      slaComplianceRate: timelineMetrics.slaComplianceRate,
      criticalPathProgress: criticalPathAnalysis.progress,
      bottleneckCount: timelineMetrics.bottleneckStages.length,
      parallelSavings: timelineMetrics.parallelSavings,
      timestamp: Date.now(),
    });
  }, [
    timelineMetrics,
    criticalPathAnalysis.progress,
    workflowId,
    proposalId,
    analytics,
    onTimelineUpdate,
  ]);

  const getStageStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'Rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'In Progress':
        return <PlayCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'Pending Approval':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'On Hold':
        return <PauseCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStageStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 border-green-200 text-green-800';
      case 'Rejected':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'In Progress':
        return 'bg-blue-100 border-blue-200 text-blue-800';
      case 'Pending Approval':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'On Hold':
        return 'bg-gray-100 border-gray-200 text-gray-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const renderTimelineView = () => (
    <div className="space-y-4">
      {/* Critical Path Highlight */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <BoltIcon className="h-4 w-4 text-orange-500" />
            Critical Path
          </h4>
          <Badge
            variant={criticalPathAnalysis.isOnTrack ? 'success' : 'warning'}
            className="flex items-center gap-1"
          >
            <ClockIcon className="h-3 w-3" />
            {criticalPathAnalysis.progress.toFixed(0)}% Complete
          </Badge>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {criticalPath.map((stageId, index) => {
            const stage = stages.find(s => s.id === stageId);
            if (!stage) return null;

            return (
              <div key={stageId} className="flex items-center">
                <div
                  className={`px-3 py-2 rounded-lg border-2 min-w-max cursor-pointer transition-all ${
                    stage.isCriticalPath
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-gray-200 bg-white'
                  } ${getStageStatusColor(stage.status)}`}
                  onClick={() => setSelectedStage(stageId)}
                >
                  <div className="flex items-center gap-2">
                    {getStageStatusIcon(stage.status)}
                    <div>
                      <div className="text-sm font-medium">{stage.name}</div>
                      <div className="text-xs opacity-75">
                        {stage.estimatedDuration}h est. • {stage.assignee}
                      </div>
                    </div>
                  </div>
                </div>

                {index < criticalPath.length - 1 && (
                  <ArrowRightIcon className="h-4 w-4 text-gray-400 mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* All Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stages.map(stage => (
          <div
            key={stage.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
              stage.isCriticalPath ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'
            } ${selectedStage === stage.id ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedStage(stage.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {getStageStatusIcon(stage.status)}
                <div>
                  <h5 className="font-medium text-gray-900">{stage.name}</h5>
                  <p className="text-sm text-gray-600">{stage.type} Review</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={stage.slaCompliance ? 'success' : 'destructive'} size="sm">
                  SLA {stage.slaCompliance ? 'Met' : 'At Risk'}
                </Badge>
                {stage.isCriticalPath && (
                  <Badge variant="warning" size="sm" className="ml-1">
                    Critical
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Assignee</div>
                <div className="font-medium">{stage.assignee}</div>
              </div>
              <div>
                <div className="text-gray-600">Deadline</div>
                <div className="font-medium">{stage.deadline.toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-gray-600">Duration</div>
                <div className="font-medium">
                  {stage.actualDuration || 0}h / {stage.estimatedDuration}h
                </div>
              </div>
              <div>
                <div className="text-gray-600">Progress</div>
                <Progress
                  value={(stage.actualDuration / stage.estimatedDuration) * 100}
                  className="h-2 mt-1"
                  variant={stage.actualDuration > stage.estimatedDuration ? 'error' : 'success'}
                />
              </div>
            </div>

            {stage.dependencies.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600">
                  Depends on:{' '}
                  {stage.dependencies
                    .map(dep => {
                      const depStage = stages.find(s => s.id === dep);
                      return depStage?.name;
                    })
                    .join(', ')}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Workflow Timeline: {proposalName}</h3>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'timeline' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('timeline')}
            >
              Timeline
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOptimizations(!showOptimizations)}
              className="flex items-center gap-2"
            >
              <ChartBarIcon className="h-4 w-4" />
              Optimize
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {timelineMetrics.onTimeCompletionLikelihood.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">On-Time Likelihood</div>
            <Progress
              value={timelineMetrics.onTimeCompletionLikelihood}
              className="h-2 mt-2"
              variant={timelineMetrics.onTimeCompletionLikelihood > 80 ? 'success' : 'warning'}
            />
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {timelineMetrics.slaComplianceRate.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">SLA Compliance</div>
            <div className="text-xs text-gray-500 mt-1">
              {stages.filter(s => s.slaCompliance).length}/{stages.length} stages
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {timelineMetrics.parallelSavings.toFixed(1)}h
            </div>
            <div className="text-sm text-gray-600">Parallel Savings</div>
            <div className="text-xs text-gray-500 mt-1">vs. sequential processing</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {timelineMetrics.bottleneckStages.length}
            </div>
            <div className="text-sm text-gray-600">Bottlenecks</div>
            <div className="text-xs text-gray-500 mt-1">requiring attention</div>
          </div>
        </div>
      </Card>

      {/* Optimization Recommendations */}
      {showOptimizations && timelineMetrics.optimizationOpportunities.length > 0 && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <BoltIcon className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">Optimization Opportunities</h4>
          </div>
          <div className="space-y-2">
            {timelineMetrics.optimizationOpportunities.map((opportunity, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-blue-800">
                <ChartBarIcon className="h-4 w-4" />
                {opportunity}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Workflow Visualization */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-medium text-gray-900">Workflow Progress</h4>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              Est: {timelineMetrics.totalEstimatedDuration}h
            </div>
            <div className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              Actual: {timelineMetrics.totalActualDuration}h
            </div>
          </div>
        </div>

        {viewMode === 'timeline' && renderTimelineView()}
      </Card>

      {/* Selected Stage Details */}
      {selectedStage && (
        <Card className="p-6">
          {(() => {
            const stage = stages.find(s => s.id === selectedStage);
            if (!stage) return null;

            return (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Stage Details: {stage.name}</h4>
                  <Button variant="outline" size="sm" onClick={() => setSelectedStage(null)}>
                    Close
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-3">Stage Information</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Status</span>
                        <Badge variant={stage.status === 'Approved' ? 'success' : 'destructive'}>
                          {stage.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Type</span>
                        <span>{stage.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Assignee</span>
                        <span>{stage.assignee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Deadline</span>
                        <span>{stage.deadline.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-700 mb-3">Performance Metrics</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Estimated Duration</span>
                        <span>{stage.estimatedDuration}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Actual Duration</span>
                        <span>{stage.actualDuration}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SLA Compliance</span>
                        <Badge variant={stage.slaCompliance ? 'success' : 'destructive'}>
                          {stage.slaCompliance ? 'Compliant' : 'At Risk'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Bottleneck Risk</span>
                        <Badge
                          variant={
                            stage.status === 'Approved'
                              ? 'success'
                              : stage.status === 'Rejected'
                                ? 'destructive'
                                : 'warning'
                          }
                        >
                          {stage.bottleneckRisk}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </Card>
      )}
    </div>
  );
}
