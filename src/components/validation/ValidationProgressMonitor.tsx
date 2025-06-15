/**
 * PosalPro MVP2 - Validation Progress Monitor Component
 * Real-time validation monitoring with H8 hypothesis tracking
 * Component Traceability: US-3.1, US-3.2, US-3.3, AC-3.1.3, AC-3.2.4, AC-3.3.2
 */

'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Progress } from '@/components/ui/Progress';
import { useValidation } from '@/hooks/validation/useValidation';
import { useValidationAnalytics } from '@/hooks/validation/useValidationAnalytics';
import {
  ArrowPathIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  ChartBarIcon,
  CheckCircleIcon,
  PauseIcon,
  PlayIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-3.1', 'US-3.2', 'US-3.3'],
  acceptanceCriteria: ['AC-3.1.3', 'AC-3.2.4', 'AC-3.3.2'],
  methods: [
    'trackErrorReduction()',
    'measureValidationSpeed()',
    'trackPerformanceMetrics()',
    'displayProgressIndicators()',
  ],
  hypotheses: ['H8'],
  testCases: ['TC-H8-001', 'TC-H8-002', 'TC-H8-003'],
};

interface ValidationProgressMonitorProps {
  proposalId?: string;
  showH8Progress?: boolean;
  showPerformanceMetrics?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface ValidationStatus {
  isActive: boolean;
  currentPhase: 'idle' | 'scanning' | 'analyzing' | 'generating_fixes' | 'complete';
  progress: number;
  issuesFound: number;
  issuesResolved: number;
  validationSpeed: number;
  startTime?: Date;
  estimatedCompletion?: Date;
}

export function ValidationProgressMonitor({
  proposalId,
  showH8Progress = true,
  showPerformanceMetrics = true,
  autoRefresh = true,
  refreshInterval = 5000,
}: ValidationProgressMonitorProps) {
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>({
    isActive: false,
    currentPhase: 'idle',
    progress: 0,
    issuesFound: 0,
    issuesResolved: 0,
    validationSpeed: 0,
  });

  const [isMonitoring, setIsMonitoring] = useState(autoRefresh);

  const { currentMetrics, getH8Status, measureValidationSpeed, trackValidationPerformance } =
    useValidationAnalytics();

  const { isValidating, activeIssueCount, criticalIssueCount, getValidationSummary } =
    useValidation();

  // Update validation status
  useEffect(() => {
    const updateStatus = () => {
      // Get validation summary data directly from context values instead of function
      const summary = {
        total: activeIssueCount + criticalIssueCount, // Approximate total
        resolved: 0, // Would need to be passed as prop or from context if needed
      };

      setValidationStatus(prev => ({
        ...prev,
        isActive: isValidating,
        issuesFound: activeIssueCount + criticalIssueCount,
        issuesResolved: summary.resolved,
        currentPhase: isValidating ? 'analyzing' : 'idle',
        progress: isValidating ? Math.min(prev.progress + 10, 90) : 100,
      }));
    };

    updateStatus();
  }, [isValidating, activeIssueCount, criticalIssueCount]); // Remove getValidationSummary dependency

  // Auto-refresh monitoring - optimized for performance
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      // Optimize: Only update if component is visible and progress is incomplete
      if (document.visibilityState === 'visible') {
        setValidationStatus(prev => {
          // Only update if actually progressing
          if (prev.isActive && prev.progress < 100) {
            return {
              ...prev,
              progress: Math.min(prev.progress + 5, 95),
            };
          }
          return prev;
        });
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isMonitoring, refreshInterval]);

  // Toggle monitoring
  const toggleMonitoring = useCallback(() => {
    setIsMonitoring(prev => !prev);
  }, []);

  // Get phase display info
  const getPhaseInfo = (phase: ValidationStatus['currentPhase']) => {
    const phaseConfigs = {
      idle: {
        label: 'Ready',
        icon: CheckCircleIcon,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
      },
      scanning: {
        label: 'Scanning Configuration',
        icon: ArrowPathIcon,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      },
      analyzing: {
        label: 'Analyzing Dependencies',
        icon: BoltIcon,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
      },
      generating_fixes: {
        label: 'Generating Fix Suggestions',
        icon: ShieldCheckIcon,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
      },
      complete: {
        label: 'Validation Complete',
        icon: CheckCircleIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      },
    };

    return phaseConfigs[phase];
  };

  // Get H8 hypothesis status
  const h8Status = getH8Status();

  // Calculate performance metrics
  const performanceMetrics = {
    errorReduction: currentMetrics.errorReductionPercentage,
    speedImprovement: currentMetrics.userEfficiencyGain,
    fixSuccessRate: currentMetrics.fixSuccessRate,
    automationLevel: currentMetrics.automationLevel,
  };

  const phaseInfo = getPhaseInfo(validationStatus.currentPhase);
  const PhaseIcon = phaseInfo.icon;

  return (
    <div className="space-y-4">
      {/* Main validation status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Validation Monitor</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMonitoring}
              className="flex items-center gap-2"
            >
              {isMonitoring ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
              {isMonitoring ? 'Pause' : 'Start'} Monitoring
            </Button>

            {proposalId && <Badge variant="outline">Proposal #{proposalId}</Badge>}
          </div>
        </div>

        {/* Current phase and progress */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${phaseInfo.bgColor}`}>
              <PhaseIcon className={`h-5 w-5 ${phaseInfo.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{phaseInfo.label}</span>
                <span className="text-sm text-gray-500">{validationStatus.progress}%</span>
              </div>
              <Progress value={validationStatus.progress} className="mt-2" size="sm" />
            </div>
          </div>

          {/* Validation summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{validationStatus.issuesFound}</div>
              <div className="text-sm text-gray-500">Issues Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {validationStatus.issuesResolved}
              </div>
              <div className="text-sm text-gray-500">Resolved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{criticalIssueCount}</div>
              <div className="text-sm text-gray-500">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {validationStatus.validationSpeed > 0
                  ? `${(validationStatus.validationSpeed / 1000).toFixed(1)}s`
                  : '—'}
              </div>
              <div className="text-sm text-gray-500">Speed</div>
            </div>
          </div>
        </div>
      </Card>

      {/* H8 Hypothesis Progress */}
      {showH8Progress && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">H8 Hypothesis Progress</h3>
            <Badge
              variant={h8Status.isOnTrack ? 'success' : 'warning'}
              className="flex items-center gap-1"
            >
              {h8Status.isOnTrack ? (
                <ArrowTrendingUpIcon className="h-3 w-3" />
              ) : (
                <ArrowTrendingDownIcon className="h-3 w-3" />
              )}
              {h8Status.isOnTrack ? 'On Track' : 'Needs Attention'}
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Progress toward 50% error reduction */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  Error Reduction Target (50%)
                </span>
                <span className="text-sm text-gray-500">
                  {h8Status.currentReduction.toFixed(1)}% achieved
                </span>
              </div>
              <Progress
                value={h8Status.progressPercentage}
                className="mb-2"
                variant={h8Status.isOnTrack ? 'success' : 'warning'}
              />
              <div className="text-xs text-gray-500">Next milestone: {h8Status.nextMilestone}</div>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-md">
                <div className="text-lg font-bold text-blue-600">
                  {h8Status.confidenceLevel.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">Confidence</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-md">
                <div className="text-lg font-bold text-green-600">{h8Status.daysToTarget}</div>
                <div className="text-xs text-gray-500">Days to Target</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-md">
                <div className="text-lg font-bold text-purple-600">
                  {currentMetrics.fixSuccessRate.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">Fix Success</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-md">
                <div className="text-lg font-bold text-orange-600">
                  {currentMetrics.automationLevel.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">Automation</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Performance Metrics */}
      {showPerformanceMetrics && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4" />
              View Details
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Error Reduction */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Error Reduction</span>
                <span
                  className={`text-sm font-semibold ${
                    performanceMetrics.errorReduction >= 25 ? 'text-green-600' : 'text-orange-600'
                  }`}
                >
                  {performanceMetrics.errorReduction.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={(performanceMetrics.errorReduction / 50) * 100}
                variant={performanceMetrics.errorReduction >= 25 ? 'success' : 'warning'}
              />
              <div className="text-xs text-gray-500 mt-1">Target: 50% reduction</div>
            </div>

            {/* Speed Improvement */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Speed Improvement</span>
                <span
                  className={`text-sm font-semibold ${
                    performanceMetrics.speedImprovement >= 20 ? 'text-green-600' : 'text-orange-600'
                  }`}
                >
                  {performanceMetrics.speedImprovement.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={Math.min(performanceMetrics.speedImprovement, 100)}
                variant={performanceMetrics.speedImprovement >= 20 ? 'success' : 'warning'}
              />
              <div className="text-xs text-gray-500 mt-1">Target: 20% faster than manual</div>
            </div>
          </div>

          {/* Real-time stats */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-500">Avg. Validation Time</div>
                <div className="text-lg font-semibold text-gray-900">
                  {currentMetrics.validationSpeed > 0
                    ? `${(currentMetrics.validationSpeed / 1000).toFixed(1)}s`
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Fix Success Rate</div>
                <div className="text-lg font-semibold text-green-600">
                  {currentMetrics.fixSuccessRate.toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Automation Level</div>
                <div className="text-lg font-semibold text-blue-600">
                  {currentMetrics.automationLevel.toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Efficiency Gain</div>
                <div className="text-lg font-semibold text-purple-600">
                  {currentMetrics.userEfficiencyGain.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Real-time activity log */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {validationStatus.isActive ? (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              <span>Validation in progress...</span>
              <span className="text-gray-400">{new Date().toLocaleTimeString()}</span>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-4">No recent activity</div>
          )}
        </div>
      </Card>
    </div>
  );
}
