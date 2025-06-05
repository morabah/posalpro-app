/**
 * PosalPro MVP2 - Validation Analytics Hook
 * H8 Hypothesis Tracking: 50% Technical Configuration Error Reduction
 * Component Traceability: US-3.1, US-3.2, US-3.3, AC-3.1.3, AC-3.2.4, AC-3.3.3
 */

'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { useCallback, useEffect, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-3.1', 'US-3.2', 'US-3.3'],
  acceptanceCriteria: ['AC-3.1.3', 'AC-3.2.4', 'AC-3.3.3'],
  methods: [
    'trackErrorReduction()',
    'measureValidationSpeed()',
    'trackFixSuccess()',
    'calculateEfficiencyGains()',
  ],
  hypotheses: ['H8'],
  testCases: ['TC-H8-001', 'TC-H8-002', 'TC-H8-003'],
};

// H8 Hypothesis tracking interfaces
interface H8ValidationMetrics {
  // Primary H8 Metrics - 50% Error Reduction Target
  baselineErrorRate: number;
  currentErrorRate: number;
  errorReductionPercentage: number;
  targetErrorReduction: number; // 50%

  // Secondary Performance Metrics
  validationSpeed: number; // milliseconds
  fixSuccessRate: number; // percentage
  userEfficiencyGain: number; // time saved percentage
  automationLevel: number; // percentage of automated fixes
}

interface ValidationPerformanceBaseline {
  // Pre-automation baselines for comparison
  manualValidationTime: number; // minutes
  manualErrorDetectionRate: number; // percentage
  manualFixTime: number; // minutes per issue
  totalManualEffort: number; // hours per proposal
}

interface ValidationAnalyticsEvent {
  eventType:
    | 'validation_started'
    | 'validation_completed'
    | 'fix_applied'
    | 'error_detected'
    | 'performance_measured';
  proposalId: string;
  userId: string;
  timestamp: number;
  metrics: Partial<H8ValidationMetrics>;
  context: {
    configurationComplexity: 'simple' | 'medium' | 'complex';
    userExperience: 'junior' | 'mid' | 'senior';
    proposalValue: number;
    teamSize: number;
  };
}

interface PerformanceComparison {
  automatedVsManual: {
    speedImprovement: number; // percentage
    accuracyImprovement: number; // percentage
    effortReduction: number; // hours saved
  };
  weekOverWeek: {
    errorRateChange: number; // percentage change
    speedChange: number; // percentage change
    userSatisfactionChange: number; // score change
  };
  hypothesisProgress: {
    currentProgress: number; // toward 50% target
    projectedCompletion: Date;
    confidenceLevel: number; // statistical confidence
  };
}

export function useValidationAnalytics() {
  const [baseline, setBaseline] = useState<ValidationPerformanceBaseline | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<H8ValidationMetrics>({
    baselineErrorRate: 0,
    currentErrorRate: 0,
    errorReductionPercentage: 0,
    targetErrorReduction: 50,
    validationSpeed: 0,
    fixSuccessRate: 0,
    userEfficiencyGain: 0,
    automationLevel: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  const analytics = useAnalytics();

  // Initialize baseline metrics from historical data
  useEffect(() => {
    if (isInitialized) return;

    const initializeBaseline = async () => {
      try {
        // In a real implementation, this would fetch from analytics API
        const historicalBaseline: ValidationPerformanceBaseline = {
          manualValidationTime: 45, // 45 minutes average
          manualErrorDetectionRate: 65, // 65% detection rate
          manualFixTime: 15, // 15 minutes per issue
          totalManualEffort: 2.5, // 2.5 hours per proposal
        };

        setBaseline(historicalBaseline);

        // Set initial baseline error rate for H8 tracking
        setCurrentMetrics(prev => ({
          ...prev,
          baselineErrorRate: 100 - historicalBaseline.manualErrorDetectionRate,
        }));

        analytics.track('validation_baseline_initialized', {
          baseline: historicalBaseline,
          timestamp: Date.now(),
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize validation baseline:', error);
      }
    };

    initializeBaseline();
  }, [isInitialized]); // Remove analytics dependency to prevent infinite loop

  // Track validation performance for H8 hypothesis (AC-3.1.3)
  const trackValidationPerformance = useCallback(
    (event: ValidationAnalyticsEvent) => {
      const updatedMetrics = { ...currentMetrics };

      // Calculate error reduction percentage for H8 hypothesis
      if (event.metrics.currentErrorRate !== undefined) {
        updatedMetrics.currentErrorRate = event.metrics.currentErrorRate;
        updatedMetrics.errorReductionPercentage =
          ((updatedMetrics.baselineErrorRate - updatedMetrics.currentErrorRate) /
            updatedMetrics.baselineErrorRate) *
          100;
      }

      // Update validation speed metrics (AC-3.2.4)
      if (event.metrics.validationSpeed !== undefined) {
        updatedMetrics.validationSpeed = event.metrics.validationSpeed;
      }

      // Update fix success rate (AC-3.3.3)
      if (event.metrics.fixSuccessRate !== undefined) {
        updatedMetrics.fixSuccessRate = event.metrics.fixSuccessRate;
      }

      setCurrentMetrics(updatedMetrics);

      // Track the analytics event with enhanced context
      analytics.track(`h8_${event.eventType}`, {
        ...event,
        h8Progress: {
          errorReductionTarget: 50,
          currentReduction: updatedMetrics.errorReductionPercentage,
          progressPercentage: (updatedMetrics.errorReductionPercentage / 50) * 100,
        },
        performanceMetrics: updatedMetrics,
      });
    },
    [currentMetrics] // Remove analytics dependency
  );

  // Measure error detection accuracy (TC-H8-001)
  const measureErrorDetection = useCallback(
    (proposalId: string, detectedErrors: number, actualErrors: number, validationTime: number) => {
      const detectionRate = (detectedErrors / Math.max(actualErrors, 1)) * 100;
      const missedErrors = Math.max(0, actualErrors - detectedErrors);
      const falsePositives = Math.max(0, detectedErrors - actualErrors);

      const event: ValidationAnalyticsEvent = {
        eventType: 'error_detected',
        proposalId,
        userId: 'current-user', // Would be from auth context
        timestamp: Date.now(),
        metrics: {
          currentErrorRate: (missedErrors / Math.max(actualErrors, 1)) * 100,
          validationSpeed: validationTime,
        },
        context: {
          configurationComplexity:
            actualErrors > 10 ? 'complex' : actualErrors > 5 ? 'medium' : 'simple',
          userExperience: 'mid', // Would be from user profile
          proposalValue: 0, // Would be from proposal context
          teamSize: 1,
        },
      };

      trackValidationPerformance(event);

      return {
        detectionRate,
        missedErrors,
        falsePositives,
        accuracy: detectionRate - (falsePositives / Math.max(detectedErrors, 1)) * 100,
      };
    },
    [trackValidationPerformance]
  );

  // Measure validation speed improvement (TC-H8-002)
  const measureValidationSpeed = useCallback(
    (proposalId: string, automatedTime: number, estimatedManualTime?: number) => {
      const manualTime = estimatedManualTime || baseline?.manualValidationTime || 45;
      const speedImprovement = ((manualTime - automatedTime / 60000) / manualTime) * 100;

      const event: ValidationAnalyticsEvent = {
        eventType: 'performance_measured',
        proposalId,
        userId: 'current-user',
        timestamp: Date.now(),
        metrics: {
          validationSpeed: automatedTime,
          userEfficiencyGain: speedImprovement,
        },
        context: {
          configurationComplexity:
            automatedTime > 10000 ? 'complex' : automatedTime > 5000 ? 'medium' : 'simple',
          userExperience: 'mid',
          proposalValue: 0,
          teamSize: 1,
        },
      };

      trackValidationPerformance(event);

      return {
        automatedTimeMinutes: automatedTime / 60000,
        manualTimeMinutes: manualTime,
        speedImprovement,
        timeSaved: manualTime - automatedTime / 60000,
      };
    },
    [baseline, trackValidationPerformance]
  );

  // Track fix success rates (TC-H8-003)
  const trackFixSuccess = useCallback(
    (proposalId: string, fixId: string, success: boolean, fixTime: number, fixType: string) => {
      const event: ValidationAnalyticsEvent = {
        eventType: 'fix_applied',
        proposalId,
        userId: 'current-user',
        timestamp: Date.now(),
        metrics: {
          fixSuccessRate: success ? 100 : 0,
          automationLevel: fixType === 'automatic' ? 100 : 0,
        },
        context: {
          configurationComplexity: 'medium',
          userExperience: 'mid',
          proposalValue: 0,
          teamSize: 1,
        },
      };

      trackValidationPerformance(event);

      // Track detailed fix analytics
      analytics.track('validation_fix_attempt', {
        fixId,
        proposalId,
        success,
        fixTime,
        fixType,
        timestamp: Date.now(),
      });

      return {
        success,
        fixTimeMinutes: fixTime / 60000,
        efficiency: success ? (baseline?.manualFixTime || 15) / (fixTime / 60000) : 0,
      };
    },
    [baseline, trackValidationPerformance] // Remove analytics dependency
  );

  // Generate H8 hypothesis progress report
  const generateH8ProgressReport = useCallback((): PerformanceComparison => {
    const manualBaseline = baseline || {
      manualValidationTime: 45,
      manualErrorDetectionRate: 65,
      manualFixTime: 15,
      totalManualEffort: 2.5,
    };

    const automatedVsManual = {
      speedImprovement: currentMetrics.userEfficiencyGain,
      accuracyImprovement: currentMetrics.errorReductionPercentage,
      effortReduction: manualBaseline.totalManualEffort * (currentMetrics.userEfficiencyGain / 100),
    };

    const hypothesisProgress = {
      currentProgress: Math.min(currentMetrics.errorReductionPercentage, 50),
      projectedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days estimate
      confidenceLevel: Math.min(currentMetrics.errorReductionPercentage * 2, 95), // Simple confidence calc
    };

    const report: PerformanceComparison = {
      automatedVsManual,
      weekOverWeek: {
        errorRateChange: -currentMetrics.errorReductionPercentage,
        speedChange: currentMetrics.userEfficiencyGain,
        userSatisfactionChange: currentMetrics.fixSuccessRate - 70, // Baseline satisfaction
      },
      hypothesisProgress,
    };

    // Track report generation
    analytics.track('h8_progress_report_generated', {
      report,
      currentMetrics,
      timestamp: Date.now(),
    });

    return report;
  }, [baseline, currentMetrics]); // Remove analytics dependency

  // Get real-time H8 hypothesis status
  const getH8Status = useCallback(() => {
    const progressPercentage = (currentMetrics.errorReductionPercentage / 50) * 100;
    const isOnTrack = progressPercentage >= 60; // 60% of target is considered on track

    return {
      targetReduction: 50,
      currentReduction: currentMetrics.errorReductionPercentage,
      progressPercentage,
      isOnTrack,
      daysToTarget: isOnTrack ? 14 : 30, // Estimated days
      confidenceLevel: Math.min(progressPercentage * 0.8, 95),
      nextMilestone:
        progressPercentage < 25
          ? '25% reduction'
          : progressPercentage < 50
            ? '50% reduction'
            : 'Optimization phase',
    };
  }, [currentMetrics]);

  // Export analytics data for reporting
  const exportAnalyticsData = useCallback(
    async (startDate: Date, endDate: Date) => {
      const data = {
        period: { startDate, endDate },
        baseline,
        currentMetrics,
        h8Status: getH8Status(),
        performanceComparison: generateH8ProgressReport(),
        componentMapping: COMPONENT_MAPPING,
      };

      analytics.track('validation_analytics_exported', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timestamp: Date.now(),
      });

      return data;
    },
    [baseline, currentMetrics, getH8Status, generateH8ProgressReport] // Remove analytics dependency
  );

  return {
    // Metrics state
    currentMetrics,
    baseline,

    // Tracking functions
    trackValidationPerformance,
    measureErrorDetection,
    measureValidationSpeed,
    trackFixSuccess,

    // Analysis functions
    generateH8ProgressReport,
    getH8Status,
    exportAnalyticsData,

    // Component traceability
    componentMapping: COMPONENT_MAPPING,
  };
}

// Export types for use in other components
export type {
  H8ValidationMetrics,
  PerformanceComparison,
  ValidationAnalyticsEvent,
  ValidationPerformanceBaseline,
};
