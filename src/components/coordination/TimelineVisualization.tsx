/**
 * PosalPro MVP2 - Timeline Visualization Component
 * Critical Path Identification & Complexity-Based Timeline Estimation
 *
 * Component Traceability Matrix:
 * - User Stories: US-4.1 (Timeline Management)
 * - Acceptance Criteria: AC-4.1.1 (Complexity estimation), AC-4.1.2 (Critical path), AC-4.1.3 (40% on-time improvement)
 * - Methods: complexityEstimation(), criticalPath(), trackOnTimeCompletion()
 * - Hypotheses: H7 (Deadline Management - 40% on-time improvement)
 * - Test Cases: TC-H7-001, TC-H7-002
 */

'use client';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Select } from '@/components/ui/forms/Select';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.2', 'AC-4.1.3'],
  methods: [
    'complexityEstimation()',
    'criticalPath()',
    'trackOnTimeCompletion()',
    'calculateDependencies()',
    'optimizeTimeline()',
    'predictBottlenecks()',
  ],
  hypotheses: ['H7'],
  testCases: ['TC-H7-001', 'TC-H7-002'],
};

// Timeline task interface
interface TimelineTask {
  id: string;
  name: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar?: string;
  estimatedHours: number;
  actualHours?: number;
  startDate: Date;
  endDate: Date;
  completionPercentage: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'blocked';
  dependencies: string[];
  dependents: string[];
  complexity: ComplexityFactor;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  notes?: string;
}

// Complexity factors for estimation
interface ComplexityFactor {
  technical: number;
  coordination: number;
  research: number;
  review: number;
  external: number;
  overall: number;
}

// Critical path analysis
interface CriticalPathNode {
  taskId: string;
  earliestStart: Date;
  latestStart: Date;
  earliestFinish: Date;
  latestFinish: Date;
  slack: number;
  isCritical: boolean;
  criticalityScore: number;
}

// Timeline metrics for H7 validation
interface TimelineMetrics {
  totalTasks: number;
  completedTasks: number;
  delayedTasks: number;
  averageCompletionTime: number;
  criticalPathDuration: number;
  estimatedCompletion: Date;
  actualCompletion?: Date;
  onTimeCompletionLikelihood: number;
  bottlenecks: string[];
  riskFactors: string[];
  optimizationOpportunities: string[];
}

// Props interface
interface TimelineVisualizationProps {
  proposalId: string;
  proposalName: string;
  tasks: TimelineTask[];
  onTaskUpdate: (task: TimelineTask) => void;
  onTimelineOptimization: (optimizations: string[]) => void;
  className?: string;
}

export function TimelineVisualization({
  proposalId,
  proposalName,
  tasks,
  onTaskUpdate,
  onTimelineOptimization,
  className = '',
}: TimelineVisualizationProps) {
  // State management
  const [viewMode, setViewMode] = useState<'gantt' | 'critical_path' | 'dependencies'>('gantt');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timelineMetrics, setTimelineMetrics] = useState<TimelineMetrics | null>(null);
  const [criticalPath, setCriticalPath] = useState<CriticalPathNode[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<'day' | 'week' | 'month'>('week');

  // Services and hooks
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { collectMetrics: collectPerformanceMetrics } = usePerformanceOptimization();
  const errorHandlingService = ErrorHandlingService.getInstance();

  // Error handling
  const handleError = useCallback(
    (error: unknown, operation: string, context?: any) => {
      const standardError =
        error instanceof Error
          ? new StandardError({
              code: ErrorCodes.VALIDATION.OPERATION_FAILED,
              message: `Timeline ${operation} failed: ${error.message}`,
              cause: error,
              metadata: {
                operation,
                context,
                proposalId,
                component: 'TimelineVisualization',
                userStories: ['US-4.1'],
                hypotheses: ['H7'],
              },
            })
          : new StandardError({
              code: ErrorCodes.VALIDATION.OPERATION_FAILED,
              message: `Timeline ${operation} failed: Unknown error`,
              metadata: {
                operation,
                context,
                proposalId,
                component: 'TimelineVisualization',
                userStories: ['US-4.1'],
                hypotheses: ['H7'],
              },
            });

      errorHandlingService.processError(standardError);
      const userMessage = errorHandlingService.getUserFriendlyMessage(standardError);
      toast.error(userMessage);

      analytics('timeline_visualization_error', {
        error: userMessage,
        proposalId,
        component: 'TimelineVisualization',
        traceability: COMPONENT_MAPPING,
      }, 'medium');
    },
    [errorHandlingService, analytics, proposalId]
  );

  // Calculate complexity estimation for tasks
  const calculateComplexity = useCallback(
    (task: TimelineTask): ComplexityFactor => {
      try {
        const { technical, coordination, research, review, external } = task.complexity;

        const weights = {
          technical: 0.25,
          coordination: 0.2,
          research: 0.2,
          review: 0.15,
          external: 0.2,
        };

        const overall =
          technical * weights.technical +
          coordination * weights.coordination +
          research * weights.research +
          review * weights.review +
          external * weights.external;

        return {
          ...task.complexity,
          overall: Math.round(overall * 100) / 100,
        };
      } catch (error) {
        handleError(error, 'calculate_complexity', { taskId: task.id });
        return { technical: 1, coordination: 1, research: 1, review: 1, external: 1, overall: 1 };
      }
    },
    [handleError]
  );

  // Critical path analysis implementation
  const calculateCriticalPath = useCallback((): CriticalPathNode[] => {
    try {
      const nodes: CriticalPathNode[] = tasks.map(task => {
        const dependencyEndDates = task.dependencies
          .map(depId => tasks.find(t => t.id === depId))
          .filter(Boolean)
          .map(dep => dep!.endDate);

        const earliestStart =
          dependencyEndDates.length > 0
            ? new Date(Math.max(...dependencyEndDates.map(d => d.getTime())))
            : task.startDate;

        const earliestFinish = new Date(
          earliestStart.getTime() + task.estimatedHours * 60 * 60 * 1000
        );

        const projectEndDate = new Date(Math.max(...tasks.map(t => t.endDate.getTime())));
        const latestFinish = projectEndDate;
        const latestStart = new Date(latestFinish.getTime() - task.estimatedHours * 60 * 60 * 1000);

        const slack = (latestStart.getTime() - earliestStart.getTime()) / (1000 * 60 * 60);

        const isCritical = slack <= 0;
        const criticalityScore = Math.max(0, 100 - slack * 2);

        return {
          taskId: task.id,
          earliestStart,
          latestStart,
          earliestFinish,
          latestFinish,
          slack,
          isCritical,
          criticalityScore,
        };
      });

      const criticalTasks = nodes.filter(n => n.isCritical);
      analytics('critical_path_calculated', {
        proposalId,
        totalTasks: tasks.length,
        criticalTasks: criticalTasks.length,
        criticalPathDuration: criticalTasks.reduce((sum, node) => {
          const task = tasks.find(t => t.id === node.taskId);
          return sum + (task?.estimatedHours || 0);
        }, 0),
        userStories: ['US-4.1'],
        hypotheses: ['H7'],
        acceptanceCriteria: ['AC-4.1.2'],
      });

      return nodes;
    } catch (error) {
      handleError(error, 'calculate_critical_path');
      return [];
    }
  }, [tasks, analytics, proposalId, handleError]);

  // Timeline metrics calculation for H7 hypothesis validation
  const calculateTimelineMetrics = useCallback((): TimelineMetrics => {
    try {
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const delayedTasks = tasks.filter(t => t.status === 'delayed').length;

      const averageCompletionTime =
        tasks.filter(t => t.actualHours).reduce((sum, t) => sum + t.actualHours!, 0) /
        Math.max(1, completedTasks);

      const criticalPathDuration = criticalPath.reduce((sum, node) => {
        const task = tasks.find(t => t.id === node.taskId);
        return sum + (task?.estimatedHours || 0);
      }, 0);

      const projectStartDate = new Date(Math.min(...tasks.map(t => t.startDate.getTime())));
      const estimatedCompletion = new Date(
        projectStartDate.getTime() + criticalPathDuration * 60 * 60 * 1000
      );

      const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
      const delayRate = totalTasks > 0 ? delayedTasks / totalTasks : 0;
      const complexityFactor = tasks.reduce((sum, t) => sum + t.complexity.overall, 0) / totalTasks;
      const onTimeCompletionLikelihood = Math.max(
        0,
        Math.min(100, completionRate * 100 - delayRate * 50 - complexityFactor * 10)
      );

      const bottlenecks = criticalPath
        .filter(node => {
          const task = tasks.find(t => t.id === node.taskId);
          return task && task.complexity.overall >= 3;
        })
        .map(node => node.taskId);

      const riskFactors = [
        ...tasks.filter(t => t.riskLevel === 'high' || t.riskLevel === 'critical').map(t => t.id),
        ...tasks.filter(t => t.dependencies.length > 3).map(t => t.id),
      ];

      const optimizationOpportunities = [
        ...tasks
          .filter(
            t => t.complexity.coordination > 3 && !criticalPath.some(cp => cp.taskId === t.id)
          )
          .map(t => `Parallel execution opportunity: ${t.name}`),
        ...tasks
          .filter(t => t.estimatedHours > 40)
          .map(t => `Task decomposition opportunity: ${t.name}`),
      ];

      return {
        totalTasks,
        completedTasks,
        delayedTasks,
        averageCompletionTime,
        criticalPathDuration,
        estimatedCompletion,
        onTimeCompletionLikelihood,
        bottlenecks,
        riskFactors,
        optimizationOpportunities,
      };
    } catch (error) {
      handleError(error, 'calculate_timeline_metrics');
      return {
        totalTasks: 0,
        completedTasks: 0,
        delayedTasks: 0,
        averageCompletionTime: 0,
        criticalPathDuration: 0,
        estimatedCompletion: new Date(),
        onTimeCompletionLikelihood: 0,
        bottlenecks: [],
        riskFactors: [],
        optimizationOpportunities: [],
      };
    }
  }, [tasks, criticalPath, handleError]);

  // AI-powered timeline optimization
  const optimizeTimeline = useCallback(async () => {
    try {
      setIsAnalyzing(true);

      // Caching is now handled by built-in mechanisms
      // Removed custom cacheManager usage to comply with core requirements

      await new Promise(resolve => setTimeout(resolve, 2000));

      const optimizations: string[] = [];
      const metrics = timelineMetrics || calculateTimelineMetrics();

      if (metrics.bottlenecks.length > 0) {
        optimizations.push(`Parallel execution for ${metrics.bottlenecks.length} bottleneck tasks`);
        optimizations.push('Consider additional resources for critical path tasks');
      }

      const highComplexityTasks = tasks.filter(t => t.complexity.overall > 3.5);
      if (highComplexityTasks.length > 0) {
        optimizations.push(
          `Review complexity of ${highComplexityTasks.length} high-complexity tasks`
        );
      }

      const highDependencyTasks = tasks.filter(t => t.dependencies.length > 2);
      if (highDependencyTasks.length > 0) {
        optimizations.push('Reduce dependencies to enable parallel work streams');
      }

      if (metrics.onTimeCompletionLikelihood < 70) {
        optimizations.push('Fast-track non-critical tasks to create buffer time');
        optimizations.push('Consider milestone-based delivery approach');
      }

      // Cache storage is now handled by built-in mechanisms

      onTimelineOptimization(optimizations);

      analytics('timeline_optimization_performed', {
        proposalId,
        optimizationsCount: optimizations.length,
        bottlenecksFound: metrics.bottlenecks.length,
        onTimeCompletionLikelihood: metrics.onTimeCompletionLikelihood,
        criticalPathDuration: metrics.criticalPathDuration,
        userStories: ['US-4.1'],
        hypotheses: ['H7'],
        acceptanceCriteria: ['AC-4.1.3'],
      });

      toast.success(`Generated ${optimizations.length} optimization recommendations`);
    } catch (error) {
      handleError(error, 'optimize_timeline');
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    proposalId,
    tasks,
    timelineMetrics,
    calculateTimelineMetrics,
    onTimelineOptimization,
    analytics,
    handleError,
  ]);

  // Get task status color
  const getStatusColor = useCallback((status: TimelineTask['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delayed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'blocked':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  // Get priority color
  const getPriorityColor = useCallback((priority: TimelineTask['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }, []);

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const statusMatch = filterStatus === 'all' || task.status === filterStatus;
      const assigneeMatch = filterAssignee === 'all' || task.assigneeId === filterAssignee;
      return statusMatch && assigneeMatch;
    });
  }, [tasks, filterStatus, filterAssignee]);

  // Calculate and update critical path and metrics
  useEffect(() => {
    const newCriticalPath = calculateCriticalPath();
    setCriticalPath(newCriticalPath);

    const newMetrics = calculateTimelineMetrics();
    setTimelineMetrics(newMetrics);
  }, [tasks, calculateCriticalPath, calculateTimelineMetrics]);

  // Track component usage for H7 hypothesis validation
  useEffect(() => {
    analytics('timeline_visualization_viewed', {
      proposalId,
      proposalName,
      tasksCount: tasks.length,
      viewMode,
      criticalTasksCount: criticalPath.filter(cp => cp.isCritical).length,
      onTimeCompletionLikelihood: timelineMetrics?.onTimeCompletionLikelihood || 0,
      userStories: ['US-4.1'],
      hypotheses: ['H7'],
      acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.2'],
    });
  }, [analytics, proposalId, proposalName, tasks.length, viewMode, criticalPath, timelineMetrics]);

  // Render critical path view
  const renderCriticalPathView = () => {
    const criticalTasks = criticalPath
      .filter(cp => cp.isCritical)
      .map(cp => ({ ...cp, task: tasks.find(t => t.id === cp.taskId)! }))
      .sort((a, b) => a.earliestStart.getTime() - b.earliestStart.getTime());

    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            <h4 className="font-medium text-red-900">Critical Path Analysis</h4>
          </div>
          <p className="text-sm text-red-700">
            {criticalTasks.length} tasks are on the critical path. Any delay in these tasks will
            directly impact the project completion date.
          </p>
          <div className="mt-2 text-sm text-red-600">
            Total Critical Path Duration: {Math.round(timelineMetrics?.criticalPathDuration || 0)}h
          </div>
        </div>

        <div className="space-y-3">
          {criticalTasks.map(({ task, criticalityScore, slack }, index) => (
            <Card key={task.id} className="p-4 border-l-4 border-l-red-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-red-800">{index + 1}</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">{task.name}</h5>
                    <p className="text-sm text-gray-600">{task.description}</p>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>{task.estimatedHours}h</span>
                      <span>Assigned to {task.assigneeName}</span>
                      <span>Slack: {Math.round(slack)}h</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                  <div className="text-sm text-gray-500 mt-1">
                    Criticality: {Math.round(criticalityScore)}%
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`} data-testid="timeline-visualization">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Timeline Visualization</h3>
          <p className="text-sm text-gray-600 mt-1">
            Critical path analysis • {proposalName} • {tasks.length} tasks
          </p>
          {timelineMetrics && (
            <div className="flex items-center space-x-4 mt-2 text-sm">
              <Badge
                className={
                  timelineMetrics.onTimeCompletionLikelihood >= 70
                    ? 'bg-green-100 text-green-800'
                    : timelineMetrics.onTimeCompletionLikelihood >= 40
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }
              >
                {Math.round(timelineMetrics.onTimeCompletionLikelihood)}% On-Time Likelihood
              </Badge>
              <span className="text-gray-500">
                Critical Path: {Math.round(timelineMetrics.criticalPathDuration)}h
              </span>
              <span className="text-gray-500">
                Est. Completion: {timelineMetrics.estimatedCompletion.toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'gantt' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('gantt')}
            >
              <ChartBarIcon className="w-4 h-4 mr-2" />
              Gantt
            </Button>
            <Button
              variant={viewMode === 'critical_path' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('critical_path')}
            >
              <ClockIcon className="w-4 h-4 mr-2" />
              Critical Path
            </Button>
            <Button
              variant={viewMode === 'dependencies' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('dependencies')}
            >
              <UserGroupIcon className="w-4 h-4 mr-2" />
              Dependencies
            </Button>
          </div>
          <Button
            onClick={optimizeTimeline}
            disabled={isAnalyzing}
            loading={isAnalyzing}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <SparklesIcon className="w-4 h-4 mr-2" />
            AI Optimize
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <Select
              value={filterStatus}
              onChange={value => setFilterStatus(value as string)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'not_started', label: 'Not Started' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'delayed', label: 'Delayed' },
                { value: 'blocked', label: 'Blocked' },
              ]}
              className="min-w-[120px]"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Assignee:</label>
            <Select
              value={filterAssignee}
              onChange={value => setFilterAssignee(value as string)}
              options={[
                { value: 'all', label: 'All Assignees' },
                ...Array.from(new Set(tasks.map(t => t.assigneeName))).map(name => ({
                  value: tasks.find(t => t.assigneeName === name)?.assigneeId || '',
                  label: name,
                })),
              ]}
              className="min-w-[120px]"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Zoom:</label>
          <div className="flex space-x-1">
            {(['day', 'week', 'month'] as const).map(zoom => (
              <Button
                key={zoom}
                variant={zoomLevel === zoom ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setZoomLevel(zoom)}
              >
                {zoom.charAt(0).toUpperCase() + zoom.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="space-y-6">
        {viewMode === 'gantt' && (
          <div className="space-y-3">
            {filteredTasks.map(task => {
              const criticalNode = criticalPath.find(cp => cp.taskId === task.id);
              const isCritical = criticalNode?.isCritical || false;
              const complexity = calculateComplexity(task);

              return (
                <Card
                  key={task.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedTask === task.id ? 'ring-2 ring-blue-500' : ''
                  } ${isCritical ? 'border-l-4 border-l-red-500' : ''}`}
                  onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className="font-medium text-gray-900">{task.name}</h5>
                          {isCritical && (
                            <Badge variant="destructive" className="text-xs">
                              Critical Path
                            </Badge>
                          )}
                          <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            {task.startDate.toLocaleDateString()} -{' '}
                            {task.endDate.toLocaleDateString()}
                          </span>
                          <span>{task.estimatedHours}h estimated</span>
                          {task.actualHours && <span>{task.actualHours}h actual</span>}
                          <span>Complexity: {complexity.overall.toFixed(1)}/5</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Avatar
                          src={task.assigneeAvatar}
                          alt={task.assigneeName}
                          name={task.assigneeName}
                          size="sm"
                        />
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {task.completionPercentage}%
                          </div>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                task.status === 'completed'
                                  ? 'bg-green-500'
                                  : task.status === 'delayed'
                                    ? 'bg-red-500'
                                    : 'bg-blue-500'
                              }`}
                              style={{ width: `${task.completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {viewMode === 'critical_path' && renderCriticalPathView()}

        {viewMode === 'dependencies' && (
          <div className="text-center py-12">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Dependencies Visualization</h3>
            <p className="mt-2 text-sm text-gray-500">
              Interactive dependency mapping would be implemented here with D3.js or similar
              library.
            </p>
          </div>
        )}

        {/* Timeline Metrics Summary */}
        {timelineMetrics && (
          <Card className="p-6">
            <h4 className="font-medium text-gray-900 mb-4">Timeline Performance Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {timelineMetrics.completedTasks}/{timelineMetrics.totalTasks}
                </div>
                <div className="text-sm text-gray-600">Tasks Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(timelineMetrics.onTimeCompletionLikelihood)}%
                </div>
                <div className="text-sm text-gray-600">On-Time Likelihood</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(timelineMetrics.criticalPathDuration)}h
                </div>
                <div className="text-sm text-gray-600">Critical Path</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {timelineMetrics.delayedTasks}
                </div>
                <div className="text-sm text-gray-600">Delayed Tasks</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
