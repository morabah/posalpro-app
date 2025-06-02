'use client';

/**
 * PosalPro MVP2 - Deadline Management Analytics Hook (H.7)
 * Tracks deadline performance and validates ≥40% on-time completion improvement
 * Based on PROMPT_H7_DEADLINE_MANAGEMENT.md specifications
 */

import { useAuth } from '@/components/providers/AuthProvider';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  DeadlineManagementMetrics,
  DeadlinePerformanceData,
  H7_COMPONENT_MAPPING,
} from '@/types/deadlines';
import { useCallback, useRef, useState } from 'react';

interface DeadlineTrackingSession {
  sessionId: string;
  startTime: number;
  interactions: number;
  deadlinesCreated: number;
  deadlinesCompleted: number;
  estimationsGenerated: number;
  criticalPathsCalculated: number;
  notificationsEngaged: number;
  escalationsTriggered: number;
}

export function useDeadlineManagementAnalytics() {
  const analytics = useAnalytics();
  const { user } = useAuth();

  const [sessionStartTime] = useState(Date.now());
  const sessionData = useRef<DeadlineTrackingSession>({
    sessionId: `deadline-session-${Date.now()}`,
    startTime: Date.now(),
    interactions: 0,
    deadlinesCreated: 0,
    deadlinesCompleted: 0,
    estimationsGenerated: 0,
    criticalPathsCalculated: 0,
    notificationsEngaged: 0,
    escalationsTriggered: 0,
  });

  // Track overall deadline management performance (H7 validation)
  const trackDeadlinePerformance = useCallback(
    (metrics: DeadlineManagementMetrics) => {
      analytics.track('deadline_management_performance', {
        ...metrics,
        timestamp: Date.now(),
        userId: user?.id,
        userRole: user?.roles?.[0],
        sessionId: sessionData.current.sessionId,
        userStories: H7_COMPONENT_MAPPING.userStories,
        hypotheses: H7_COMPONENT_MAPPING.hypotheses,
        componentTraceability: H7_COMPONENT_MAPPING,
      });

      // H7 specific tracking: On-time completion improvement
      analytics.track('hypothesis_validation_h7', {
        hypothesis: 'H7',
        metric: 'on_time_completion_improvement',
        onTimeCompletionRate: metrics.onTimeCompletionRate,
        baselineCompletionRate: metrics.baselineCompletionRate,
        improvementPercentage: metrics.improvementPercentage,
        target: 'improve_on_time_completion_by_40_percent',
        achieved: metrics.improvementPercentage >= 40,
        timelineAccuracy: metrics.timelineAccuracy,
        criticalPathEffectiveness: metrics.criticalPathEffectiveness,
        timestamp: Date.now(),
      });
    },
    [analytics, user]
  );

  // Track timeline estimation accuracy (AC-4.1.1)
  const trackTimelineEstimation = useCallback(
    (estimationData: {
      deadlineId: string;
      estimationType: 'ai' | 'manual' | 'historical';
      complexityLevel: string;
      estimatedHours: number;
      actualHours?: number;
      accuracy?: number;
      confidenceScore?: number;
      factors: string[];
    }) => {
      sessionData.current.estimationsGenerated++;

      analytics.track('timeline_estimation', {
        ...estimationData,
        userStory: 'US-4.1',
        acceptanceCriteria: 'AC-4.1.1',
        method: 'complexityEstimation()',
        sessionInteractions: sessionData.current.interactions++,
        timestamp: Date.now(),
      });

      // Track estimation method effectiveness
      if (estimationData.actualHours && estimationData.estimatedHours) {
        const accuracy = Math.max(
          0,
          100 -
            (Math.abs(estimationData.actualHours - estimationData.estimatedHours) /
              estimationData.estimatedHours) *
              100
        );

        analytics.track('estimation_accuracy', {
          deadlineId: estimationData.deadlineId,
          estimationType: estimationData.estimationType,
          accuracy,
          complexityLevel: estimationData.complexityLevel,
          userStory: 'US-4.1',
          acceptanceCriteria: 'AC-4.1.1',
          timestamp: Date.now(),
        });
      }
    },
    [analytics]
  );

  // Track critical path analysis (AC-4.1.2)
  const trackCriticalPathAnalysis = useCallback(
    (criticalPathData: {
      proposalId?: string;
      deadlineId: string;
      pathLength: number;
      bottlenecksFound: number;
      slackTime: number;
      riskScore: number;
      calculationTime: number;
      predictedBottlenecks: string[];
      actualBottlenecks?: string[];
    }) => {
      sessionData.current.criticalPathsCalculated++;

      analytics.track('critical_path_analysis', {
        ...criticalPathData,
        userStory: 'US-4.1',
        acceptanceCriteria: 'AC-4.1.2',
        method: 'criticalPath()',
        sessionCalculations: sessionData.current.criticalPathsCalculated,
        timestamp: Date.now(),
      });

      // Track prediction accuracy if actual bottlenecks are available
      if (criticalPathData.actualBottlenecks) {
        const predictedSet = new Set(criticalPathData.predictedBottlenecks);
        const actualSet = new Set(criticalPathData.actualBottlenecks);
        const correctPredictions = [...actualSet].filter(b => predictedSet.has(b)).length;
        const accuracy = actualSet.size > 0 ? (correctPredictions / actualSet.size) * 100 : 0;

        analytics.track('bottleneck_prediction_accuracy', {
          deadlineId: criticalPathData.deadlineId,
          accuracy,
          predictedCount: criticalPathData.predictedBottlenecks.length,
          actualCount: criticalPathData.actualBottlenecks.length,
          correctPredictions,
          userStory: 'US-4.1',
          acceptanceCriteria: 'AC-4.1.2',
          timestamp: Date.now(),
        });
      }
    },
    [analytics]
  );

  // Track priority calculation effectiveness (AC-4.3.1)
  const trackPriorityCalculation = useCallback(
    (priorityData: {
      deadlineId: string;
      algorithmType: 'ai' | 'rule_based' | 'manual';
      calculatedPriority: string;
      factors: string[];
      calculationTime: number;
      userAgreed?: boolean;
      manualOverride?: string;
    }) => {
      analytics.track('priority_calculation', {
        ...priorityData,
        userStory: 'US-4.3',
        acceptanceCriteria: 'AC-4.3.1',
        method: 'calculatePriority()',
        timestamp: Date.now(),
      });

      // Track user agreement with priority suggestions
      if (priorityData.userAgreed !== undefined) {
        analytics.track('priority_algorithm_effectiveness', {
          deadlineId: priorityData.deadlineId,
          algorithmType: priorityData.algorithmType,
          userAgreed: priorityData.userAgreed,
          overrideApplied: !!priorityData.manualOverride,
          userStory: 'US-4.3',
          acceptanceCriteria: 'AC-4.3.1',
          timestamp: Date.now(),
        });
      }
    },
    [analytics]
  );

  // Track dependency mapping (AC-4.3.2)
  const trackDependencyMapping = useCallback(
    (dependencyData: {
      deadlineId: string;
      dependenciesIdentified: number;
      mappingMethod: 'ai' | 'manual' | 'template';
      mappingTime: number;
      cyclesDetected: number;
      conflictsResolved: number;
      accuracy?: number;
    }) => {
      analytics.track('dependency_mapping', {
        ...dependencyData,
        userStory: 'US-4.3',
        acceptanceCriteria: 'AC-4.3.2',
        method: 'mapDependencies()',
        timestamp: Date.now(),
      });
    },
    [analytics]
  );

  // Track progress tracking engagement (AC-4.3.3)
  const trackProgressTracking = useCallback(
    (progressData: {
      deadlineId: string;
      progressUpdate: number;
      updateFrequency: number; // days since last update
      statusChange?: string;
      blockerReported?: boolean;
      estimatedCompletion?: Date;
      actualCompletion?: Date;
    }) => {
      analytics.track('progress_tracking', {
        ...progressData,
        userStory: 'US-4.3',
        acceptanceCriteria: 'AC-4.3.3',
        method: 'trackProgress()',
        timestamp: Date.now(),
      });

      // Track completion accuracy if both estimated and actual are available
      if (progressData.estimatedCompletion && progressData.actualCompletion) {
        const estimatedTime = progressData.estimatedCompletion.getTime();
        const actualTime = progressData.actualCompletion.getTime();
        const accuracy = Math.max(
          0,
          100 - Math.abs(actualTime - estimatedTime) / (24 * 60 * 60 * 1000)
        ); // days difference

        analytics.track('completion_prediction_accuracy', {
          deadlineId: progressData.deadlineId,
          accuracy,
          daysEarlyOrLate: (actualTime - estimatedTime) / (24 * 60 * 60 * 1000),
          userStory: 'US-4.3',
          acceptanceCriteria: 'AC-4.3.3',
          timestamp: Date.now(),
        });
      }
    },
    [analytics]
  );

  // Track deadline creation with AI assistance
  const trackDeadlineCreation = useCallback(
    (creationData: {
      deadlineId: string;
      creationType: 'manual' | 'ai_assisted' | 'template';
      aiSuggestionsUsed: number;
      aiSuggestionsTotal: number;
      creationTime: number;
      complexityAssigned: string;
      estimationMethod: string;
    }) => {
      sessionData.current.deadlinesCreated++;

      analytics.track('deadline_creation', {
        ...creationData,
        aiAcceptanceRate:
          creationData.aiSuggestionsTotal > 0
            ? (creationData.aiSuggestionsUsed / creationData.aiSuggestionsTotal) * 100
            : 0,
        sessionDeadlinesCreated: sessionData.current.deadlinesCreated,
        userStory: 'US-4.1',
        method: 'createDeadline()',
        timestamp: Date.now(),
      });
    },
    [analytics]
  );

  // Track deadline completion and performance
  const trackDeadlineCompletion = useCallback(
    (completionData: DeadlinePerformanceData) => {
      sessionData.current.deadlinesCompleted++;

      analytics.track('deadline_completion', {
        ...completionData,
        sessionDeadlinesCompleted: sessionData.current.deadlinesCompleted,
        userStory: completionData.onTime ? 'US-4.1' : 'US-4.3',
        timestamp: Date.now(),
      });

      // Track H7 core metrics
      analytics.track('h7_completion_metric', {
        deadlineId: completionData.deadlineId,
        onTime: completionData.onTime,
        estimationAccuracy: completionData.estimationAccuracy,
        daysEarlyOrLate: completionData.daysEarlyOrLate,
        complexityActual: completionData.complexityActual,
        hypothesis: 'H7',
        timestamp: Date.now(),
      });
    },
    [analytics]
  );

  // Track notification engagement
  const trackNotificationEngagement = useCallback(
    (engagementData: {
      notificationId: string;
      notificationType: string;
      deadlineId: string;
      action: 'viewed' | 'clicked' | 'dismissed' | 'snoozed';
      responseTime: number; // seconds
      followUpAction?: string;
    }) => {
      if (engagementData.action === 'clicked') {
        sessionData.current.notificationsEngaged++;
      }

      analytics.track('notification_engagement', {
        ...engagementData,
        sessionEngagements: sessionData.current.notificationsEngaged,
        timestamp: Date.now(),
      });
    },
    [analytics]
  );

  // Track escalation effectiveness
  const trackEscalation = useCallback(
    (escalationData: {
      deadlineId: string;
      escalationType: string;
      trigger: string;
      escalationLevel: number;
      responseTime: number; // hours
      resolved: boolean;
      newDeadline?: Date;
      resourcesAdded?: number;
    }) => {
      sessionData.current.escalationsTriggered++;

      analytics.track('deadline_escalation', {
        ...escalationData,
        sessionEscalations: sessionData.current.escalationsTriggered,
        timestamp: Date.now(),
      });
    },
    [analytics]
  );

  // Track user workload and capacity management
  const trackWorkloadManagement = useCallback(
    (workloadData: {
      userId: string;
      currentWorkloadScore: number; // 0-100
      optimalWorkloadScore: number;
      deadlineCount: number;
      averageComplexity: number;
      utilizationRate: number;
      burnoutRisk: number;
      recommendedActions: string[];
    }) => {
      analytics.track('workload_management', {
        ...workloadData,
        timestamp: Date.now(),
      });
    },
    [analytics]
  );

  // Get session summary for performance analysis
  const getSessionSummary = useCallback(() => {
    const sessionDuration = Date.now() - sessionData.current.startTime;

    return {
      sessionId: sessionData.current.sessionId,
      sessionDuration,
      interactions: sessionData.current.interactions,
      deadlinesCreated: sessionData.current.deadlinesCreated,
      deadlinesCompleted: sessionData.current.deadlinesCompleted,
      estimationsGenerated: sessionData.current.estimationsGenerated,
      criticalPathsCalculated: sessionData.current.criticalPathsCalculated,
      notificationsEngaged: sessionData.current.notificationsEngaged,
      escalationsTriggered: sessionData.current.escalationsTriggered,
      efficiency:
        sessionData.current.deadlinesCompleted / Math.max(sessionData.current.deadlinesCreated, 1),
    };
  }, []);

  // Calculate real-time H7 metrics
  const calculateH7Metrics = useCallback((performanceHistory: DeadlinePerformanceData[]) => {
    if (performanceHistory.length === 0) {
      return null;
    }

    const onTimeCount = performanceHistory.filter(d => d.onTime).length;
    const onTimeRate = (onTimeCount / performanceHistory.length) * 100;

    const avgAccuracy =
      performanceHistory.reduce((sum, d) => sum + d.estimationAccuracy, 0) /
      performanceHistory.length;

    const avgCompletionTime =
      performanceHistory.reduce((sum, d) => sum + d.actualDuration, 0) / performanceHistory.length;

    // Calculate improvement against baseline (assuming 60% baseline)
    const baselineRate = 60;
    const improvement = onTimeRate - baselineRate;
    const improvementPercentage = (improvement / baselineRate) * 100;

    const metrics: DeadlineManagementMetrics = {
      onTimeCompletionRate: onTimeRate,
      timelineAccuracy: avgAccuracy,
      criticalPathEffectiveness: 85, // Placeholder - would be calculated from actual data
      averageCompletionTime: avgCompletionTime,
      deadlineAdjustmentFrequency: 0.15, // Placeholder
      notificationEngagementRate: 75, // Placeholder
      taskReprioritizationRate: 0.12, // Placeholder
      userProductivityScore: 78, // Placeholder
      systemResponseTime: 150, // Placeholder
      dataProcessingLatency: 50, // Placeholder
      uiInteractionSpeed: 120, // Placeholder
      complexityEstimationAccuracy: avgAccuracy,
      criticalPathIdentificationSuccess: 85, // Placeholder
      priorityAlgorithmEffectiveness: 82, // Placeholder
      dependencyMappingAccuracy: 78, // Placeholder
      progressTrackingEngagement: 70, // Placeholder
      baselineCompletionRate: baselineRate,
      improvementPercentage,
      timeToCompletionImprovement: improvement,
    };

    return metrics;
  }, []);

  return {
    trackDeadlinePerformance,
    trackTimelineEstimation,
    trackCriticalPathAnalysis,
    trackPriorityCalculation,
    trackDependencyMapping,
    trackProgressTracking,
    trackDeadlineCreation,
    trackDeadlineCompletion,
    trackNotificationEngagement,
    trackEscalation,
    trackWorkloadManagement,
    getSessionSummary,
    calculateH7Metrics,
    componentMapping: H7_COMPONENT_MAPPING,
  };
}
