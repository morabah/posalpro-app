/**
 * PosalPro MVP2 - Advanced Performance Optimization Hook
 * Real-time performance monitoring and optimization with hypothesis validation
 *
 * Component Traceability Matrix Integration
 * User Stories: US-6.1 (Performance), US-6.2 (User Experience), US-6.3 (Data Efficiency)
 * Hypotheses: H8 (Load Time), H9 (User Engagement), H11 (Cache Hit Rate)
 *
 * Phase 7 Implementation: Advanced Performance Infrastructure
 */

'use client';

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import {
  EnhancedPerformanceMetrics,
  enhancedPerformanceService,
  PerformanceAlert,
  PerformanceRecommendation,
} from '@/lib/performance/EnhancedPerformanceService';
import { useCallback, useEffect, useRef, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-6.1', 'US-6.2', 'US-6.3', 'US-4.1'],
  acceptanceCriteria: [
    'AC-6.1.1', // Load time optimization
    'AC-6.1.2', // Bundle size reduction
    'AC-6.1.3', // Cache performance
    'AC-6.2.1', // User experience preservation
    'AC-6.3.1', // Data access efficiency
    'AC-4.1.6', // Performance tracking
  ],
  methods: [
    'useAdvancedPerformanceOptimization()',
    'monitorRealTimeMetrics()',
    'triggerOptimizations()',
    'generateInsights()',
    'trackHypotheses()',
  ],
  hypotheses: ['H8', 'H9', 'H11'],
  testCases: ['TC-H8-008', 'TC-H9-005', 'TC-H11-004'],
};

export interface AdvancedPerformanceOptimizationOptions {
  enableRealTimeMonitoring?: boolean;
  monitoringInterval?: number;
  enableAutomaticOptimization?: boolean;
  enablePredictiveOptimization?: boolean;
  enableHypothesisValidation?: boolean;
  optimizationThreshold?: number;
  enablePerformanceInsights?: boolean;
  enableCriticalAlerts?: boolean;
  enableBundleOptimization?: boolean;
  enableMemoryOptimization?: boolean;
  enableMobileOptimization?: boolean;
  enableAccessibilityOptimization?: boolean;
}

export interface PerformanceOptimizationState {
  metrics: EnhancedPerformanceMetrics;
  isMonitoring: boolean;
  isOptimizing: boolean;
  isGeneratingInsights: boolean;
  optimizationScore: number;
  recommendations: PerformanceRecommendation[];
  alerts: PerformanceAlert[];
  insights: PerformanceInsight[];
  optimizationHistory: OptimizationEvent[];
  lastOptimization: Date | null;
  nextOptimizationPrediction: Date | null;
}

export interface PerformanceInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'prediction' | 'recommendation';
  category: 'performance' | 'user-experience' | 'resource-usage' | 'optimization';
  title: string;
  description: string;
  confidence: number; // 0-1
  impact: 'critical' | 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'short-term' | 'long-term';
  data: unknown;
  actionable: boolean;
  relatedMetrics: string[];
  hypotheses: string[];
}

export interface OptimizationEvent {
  id: string;
  timestamp: Date;
  trigger: 'manual' | 'automatic' | 'threshold' | 'prediction';
  type: 'bundle' | 'memory' | 'cache' | 'mobile' | 'comprehensive';
  beforeScore: number;
  afterScore: number;
  improvement: number;
  duration: number; // ms
  success: boolean;
  details: OptimizationResult | null;
}

type OptimizationResult =
  | { type: 'bundle'; optimizations: string[] }
  | { type: 'memory'; optimizations: string[] }
  | { type: 'mobile'; optimizations: string[] }
  | { type: 'comprehensive'; results: Array<{ type: 'bundle' | 'memory' | 'mobile'; optimizations: string[] } | null>; optimizations: string[] };

/**
 * Advanced Performance Optimization Hook
 * Provides comprehensive performance monitoring and optimization capabilities
 */
export function useAdvancedPerformanceOptimization(
  options: AdvancedPerformanceOptimizationOptions = {}
) {
  const {
    enableRealTimeMonitoring = true,
    monitoringInterval = 30000,
    enableAutomaticOptimization = false,
    enablePredictiveOptimization = true,
    enableHypothesisValidation = true,
    optimizationThreshold = 70,
    enablePerformanceInsights = true,
    enableBundleOptimization = true,
    enableMemoryOptimization = true,
    enableMobileOptimization = true,
  } = options;

  // Hooks
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { handleAsyncError } = useErrorHandler();

  // State
  const [state, setState] = useState<PerformanceOptimizationState>({
    metrics: {} as EnhancedPerformanceMetrics,
    isMonitoring: false,
    isOptimizing: false,
    isGeneratingInsights: false,
    optimizationScore: 100,
    recommendations: [],
    alerts: [],
    insights: [],
    optimizationHistory: [],
    lastOptimization: null,
    nextOptimizationPrediction: null,
  });

  // Refs
  const monitoringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const optimizationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insightsGenerationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerOptimizationRef = useRef<
    ((trigger: 'manual' | 'automatic' | 'threshold' | 'prediction', type: 'bundle' | 'memory' | 'cache' | 'mobile' | 'comprehensive') => Promise<OptimizationEvent | void>) | null
  >(null);
  const generatePerformanceInsightsRef = useRef<
    ((metrics: EnhancedPerformanceMetrics) => Promise<void>) | null
  >(null);

  /**
   * Initialize performance monitoring
   */
  const initializeMonitoring = useCallback(async () => {
    try {
      // Initialize Enhanced Performance Service with analytics
      // Create a wrapper to match AnalyticsService interface
      const analyticsWrapper = {
        track: (event: string, data: Record<string, unknown>) => {
          analytics(event, data, 'medium');
        }
      };
      enhancedPerformanceService.initializeAnalytics(analyticsWrapper);

      // Start monitoring if enabled
      if (enableRealTimeMonitoring) {
        enhancedPerformanceService.startMonitoring(monitoringInterval);
        setState(prev => ({ ...prev, isMonitoring: true }));

        // Set up periodic state updates
        monitoringIntervalRef.current = setInterval(async () => {
          const metrics = enhancedPerformanceService.getMetrics();
          setState(prev => ({
            ...prev,
            metrics,
            optimizationScore: metrics.optimizationScore,
            recommendations: metrics.recommendations,
            alerts: metrics.alerts,
          }));

          // Check for automatic optimization
          if (enableAutomaticOptimization && metrics.optimizationScore < optimizationThreshold) {
            await triggerOptimizationRef.current?.('automatic', 'comprehensive');
          }

          // Generate insights
          if (enablePerformanceInsights) {
            await generatePerformanceInsightsRef.current?.(metrics);
          }
        }, monitoringInterval);
      }

      // Track initialization
      analytics('advanced_performance_optimization_initialized', {
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        options: {
          enableRealTimeMonitoring,
          enableAutomaticOptimization,
          enablePredictiveOptimization,
          optimizationThreshold,
        },
        componentMapping: COMPONENT_MAPPING,
      }, 'low');
    } catch (error) {
      handleAsyncError(error, 'Failed to initialize performance monitoring', {
        context: 'useAdvancedPerformanceOptimization.initializeMonitoring',
        component: 'useAdvancedPerformanceOptimization',
        userStory: 'US-6.1',
        severity: 'high',
      });
    }
  }, [
    analytics,
    enableRealTimeMonitoring,
    monitoringInterval,
    enableAutomaticOptimization,
    optimizationThreshold,
    enablePerformanceInsights,
    handleAsyncError,
    enablePredictiveOptimization,
  ]);

  // Helper functions for optimization types (hoisted above usage)
  const optimizeBundlePerformance = useCallback(
    async (): Promise<{ type: 'bundle'; optimizations: string[] }> => {
      return { type: 'bundle', optimizations: ['code-splitting', 'tree-shaking', 'compression'] };
    },
    []
  );

  const optimizeMemoryUsage = useCallback(
    async (): Promise<{ type: 'memory'; optimizations: string[] }> => {
      return {
        type: 'memory',
        optimizations: ['garbage-collection', 'memory-leak-detection', 'cache-cleanup'],
      };
    },
    []
  );

  const optimizeMobilePerformance = useCallback(
    async (): Promise<{ type: 'mobile'; optimizations: string[] }> => {
      return {
        type: 'mobile',
        optimizations: ['touch-optimization', 'responsive-images', 'adaptive-loading'],
      };
    },
    []
  );

  const performComprehensiveOptimization = useCallback(async (): Promise<OptimizationResult> => {
    const results = await Promise.all([
      enableBundleOptimization ? optimizeBundlePerformance() : null,
      enableMemoryOptimization ? optimizeMemoryUsage() : null,
      enableMobileOptimization ? optimizeMobilePerformance() : null,
    ]);

    return {
      type: 'comprehensive',
      results: results.filter(Boolean),
      optimizations: ['bundle', 'memory', 'mobile', 'cache', 'accessibility'],
    };
  }, [
    enableBundleOptimization,
    enableMemoryOptimization,
    enableMobileOptimization,
    optimizeBundlePerformance,
    optimizeMemoryUsage,
    optimizeMobilePerformance,
  ]);

  /**
   * Trigger performance optimization
   */
  const triggerOptimization = useCallback(
    async (
      trigger: 'manual' | 'automatic' | 'threshold' | 'prediction' = 'manual',
      type: 'bundle' | 'memory' | 'cache' | 'mobile' | 'comprehensive' = 'comprehensive'
    ) => {
      if (state.isOptimizing) {
        return;
      }

      try {
        setState(prev => ({ ...prev, isOptimizing: true }));

        const startTime = Date.now();
        const beforeScore = state.optimizationScore;

        // Track optimization start
        analytics('performance_optimization_started', {
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          trigger,
          type,
          beforeScore,
          componentMapping: COMPONENT_MAPPING,
        }, 'medium');

        // Perform optimization based on type
        let optimizationResult: OptimizationResult | null = null;

        switch (type) {
          case 'bundle':
            if (enableBundleOptimization) {
              // Bundle-specific optimization logic would go here
              optimizationResult = await optimizeBundlePerformance();
            }
            break;
          case 'memory':
            if (enableMemoryOptimization) {
              // Memory-specific optimization logic would go here
              optimizationResult = await optimizeMemoryUsage();
            }
            break;
          case 'mobile':
            if (enableMobileOptimization) {
              // Mobile-specific optimization logic would go here
              optimizationResult = await optimizeMobilePerformance();
            }
            break;
          case 'comprehensive':
          default:
            // Comprehensive optimization
            optimizationResult = await performComprehensiveOptimization();
            break;
        }

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Get updated metrics
        const updatedMetrics = enhancedPerformanceService.getMetrics();
        const afterScore = updatedMetrics.optimizationScore;
        const improvement = afterScore - beforeScore;

        // Create optimization event
        const optimizationEvent: OptimizationEvent = {
          id: `opt-${Date.now()}`,
          timestamp: new Date(),
          trigger,
          type,
          beforeScore,
          afterScore,
          improvement,
          duration,
          success: improvement > 0,
          details: optimizationResult,
        };

        // Update state
        setState(prev => ({
          ...prev,
          isOptimizing: false,
          metrics: updatedMetrics,
          optimizationScore: afterScore,
          recommendations: updatedMetrics.recommendations,
          alerts: updatedMetrics.alerts,
          optimizationHistory: [optimizationEvent, ...prev.optimizationHistory.slice(0, 9)], // Keep last 10
          lastOptimization: new Date(),
        }));

        // Predict next optimization if enabled
        if (enablePredictiveOptimization) {
          const nextOptimization = predictNextOptimization(
            optimizationEvent,
            state.optimizationHistory
          );
          setState(prev => ({ ...prev, nextOptimizationPrediction: nextOptimization }));
        }

        // Track optimization completion
        analytics('performance_optimization_completed', {
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          trigger,
          type,
          beforeScore,
          afterScore,
          improvement,
          duration,
          success: improvement > 0,
          componentMapping: COMPONENT_MAPPING,
        }, 'medium');

        return optimizationEvent;
      } catch (error) {
        setState(prev => ({ ...prev, isOptimizing: false }));
        handleAsyncError(error, 'Failed to perform optimization', {
          context: 'useAdvancedPerformanceOptimization.triggerOptimization',
          component: 'useAdvancedPerformanceOptimization',
          userStory: 'US-6.1',
          severity: 'medium',
          trigger,
          type,
        });
        throw error;
      }
    },
    [
      state.isOptimizing,
      state.optimizationScore,
      state.optimizationHistory,
      analytics,
      enableBundleOptimization,
      enableMemoryOptimization,
      enableMobileOptimization,
      enablePredictiveOptimization,
      handleAsyncError,
      performComprehensiveOptimization,
      optimizeBundlePerformance,
      optimizeMemoryUsage,
      optimizeMobilePerformance,
    ]
  );

  // (moved ref-sync effects below generatePerformanceInsights)

  /**
   * Generate performance insights
   */
  const generatePerformanceInsights = useCallback(
    async (metrics: EnhancedPerformanceMetrics) => {
      if (state.isGeneratingInsights) {
        return;
      }

      try {
        setState(prev => ({ ...prev, isGeneratingInsights: true }));

        const insights: PerformanceInsight[] = [];

        // Trend analysis
        const trendInsights = await analyzeTrends(metrics, state.optimizationHistory);
        insights.push(...trendInsights);

        // Anomaly detection
        const anomalyInsights = await detectAnomalies(metrics);
        insights.push(...anomalyInsights);

        // Predictive insights
        if (enablePredictiveOptimization) {
          const predictiveInsights = await generatePredictiveInsights(
            metrics,
            state.optimizationHistory
          );
          insights.push(...predictiveInsights);
        }

        // Hypothesis validation insights
        if (enableHypothesisValidation) {
          const hypothesisInsights = await validateHypotheses(metrics);
          insights.push(...hypothesisInsights);
        }

        setState(prev => ({
          ...prev,
          isGeneratingInsights: false,
          insights: insights.slice(0, 20), // Keep top 20 insights
        }));

        // Track insights generation
        analytics('performance_insights_generated', {
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          insightsCount: insights.length,
          insightTypes: insights.map(i => i.type),
          componentMapping: COMPONENT_MAPPING,
        }, 'low');
      } catch (error) {
        setState(prev => ({ ...prev, isGeneratingInsights: false }));
        handleAsyncError(error, 'Failed to generate performance insights', {
          context: 'useAdvancedPerformanceOptimization.generatePerformanceInsights',
          component: 'useAdvancedPerformanceOptimization',
          userStory: 'US-6.1',
          severity: 'low',
        });
      }
    },
    [
      state.isGeneratingInsights,
      state.optimizationHistory,
      enablePredictiveOptimization,
      enableHypothesisValidation,
      analytics,
      handleAsyncError,
    ]
  );

  // Keep refs in sync to avoid cyclic deps in initializeMonitoring (top-level, after declaration)
  useEffect(() => {
    triggerOptimizationRef.current = triggerOptimization;
  }, [triggerOptimization]);
  useEffect(() => {
    generatePerformanceInsightsRef.current = generatePerformanceInsights;
  }, [generatePerformanceInsights]);

  /**
   * Generate comprehensive performance report
   */
  const generateReport = useCallback(async () => {
    try {
      const reportUnknown = (await enhancedPerformanceService.generateComprehensiveReport()) as unknown;
      const baseReport = (typeof reportUnknown === 'object' && reportUnknown !== null
        ? (reportUnknown as Record<string, unknown>)
        : {}) as Record<string, unknown>;

      // Add hook-specific data
      const enhancedReport: Record<string, unknown> = {
        ...baseReport,
        hookData: {
          optimizationHistory: state.optimizationHistory,
          insights: state.insights,
          lastOptimization: state.lastOptimization,
          nextOptimizationPrediction: state.nextOptimizationPrediction,
          componentMapping: COMPONENT_MAPPING,
        },
      };

      // Track report generation
      analytics('advanced_performance_report_generated', {
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        optimizationScore: state.optimizationScore,
        optimizationCount: state.optimizationHistory.length,
        insightsCount: state.insights.length,
        componentMapping: COMPONENT_MAPPING,
      }, 'low');

      return enhancedReport;
    } catch (error) {
      handleAsyncError(error, 'Failed to generate performance report', {
        context: 'useAdvancedPerformanceOptimization.generateReport',
        component: 'useAdvancedPerformanceOptimization',
        userStory: 'US-6.1',
        severity: 'medium',
      });
      throw error;
    }
  }, [
    state.optimizationHistory,
    state.insights,
    state.lastOptimization,
    state.nextOptimizationPrediction,
    state.optimizationScore,
    analytics,
    handleAsyncError,
  ]);

  /**
   * Stop monitoring and cleanup
   */
  const stopMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }

    if (optimizationTimeoutRef.current) {
      clearTimeout(optimizationTimeoutRef.current);
      optimizationTimeoutRef.current = null;
    }

    if (insightsGenerationRef.current) {
      clearTimeout(insightsGenerationRef.current);
      insightsGenerationRef.current = null;
    }

    enhancedPerformanceService.stopMonitoring();
    setState(prev => ({ ...prev, isMonitoring: false }));

    analytics('advanced_performance_monitoring_stopped', {
      userStories: COMPONENT_MAPPING.userStories,
    }, 'low');
  }, [analytics]);

  // Initialize monitoring on mount
  useEffect(() => {
    initializeMonitoring();

    // Return cleanup function that doesn't depend on stopMonitoring
    return () => {
      // Direct cleanup without calling stopMonitoring (which has setState)
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }

      if (optimizationTimeoutRef.current) {
        clearTimeout(optimizationTimeoutRef.current);
        optimizationTimeoutRef.current = null;
      }

      if (insightsGenerationRef.current) {
        clearTimeout(insightsGenerationRef.current);
        insightsGenerationRef.current = null;
      }

      enhancedPerformanceService.stopMonitoring();
    };
  }, [initializeMonitoring]);

  async function analyzeTrends(
    metrics: EnhancedPerformanceMetrics,
    history: OptimizationEvent[]
  ): Promise<PerformanceInsight[]> {
    const insights: PerformanceInsight[] = [];

    if (history.length >= 3) {
      const recentScores = history.slice(0, 3).map(h => h.afterScore);
      const trend = recentScores[0] > recentScores[2] ? 'improving' : 'declining';

      insights.push({
        id: `trend-${Date.now()}`,
        type: 'trend',
        category: 'performance',
        title: `Performance Score ${trend === 'improving' ? 'Improving' : 'Declining'}`,
        description: `Performance score has been ${trend} over recent optimizations`,
        confidence: 0.8,
        impact: trend === 'declining' ? 'high' : 'medium',
        timeframe: 'short-term',
        data: { trend, scores: recentScores },
        actionable: trend === 'declining',
        relatedMetrics: ['optimizationScore'],
        hypotheses: ['H8', 'H9'],
      });
    }

    return insights;
  }

  async function detectAnomalies(
    metrics: EnhancedPerformanceMetrics
  ): Promise<PerformanceInsight[]> {
    const insights: PerformanceInsight[] = [];

    // Memory usage anomaly
    if (metrics.memoryMetrics.memoryUsagePercentage > 90) {
      insights.push({
        id: `anomaly-memory-${Date.now()}`,
        type: 'anomaly',
        category: 'resource-usage',
        title: 'High Memory Usage Detected',
        description: 'Memory usage is critically high and may impact performance',
        confidence: 0.95,
        impact: 'critical',
        timeframe: 'immediate',
        data: { memoryUsage: metrics.memoryMetrics.memoryUsagePercentage },
        actionable: true,
        relatedMetrics: ['memoryMetrics.memoryUsagePercentage'],
        hypotheses: ['H11'],
      });
    }

    return insights;
  }


  async function generatePredictiveInsights(
    metrics: EnhancedPerformanceMetrics,
    history: OptimizationEvent[]
  ): Promise<PerformanceInsight[]> {
    const insights: PerformanceInsight[] = [];

    // Predict performance degradation
    if (history.length >= 5) {
      const averageImprovement = history.slice(0, 5).reduce((sum, h) => sum + h.improvement, 0) / 5;

      if (averageImprovement < 0) {
        insights.push({
          id: `prediction-degradation-${Date.now()}`,
          type: 'prediction',
          category: 'performance',
          title: 'Performance Degradation Predicted',
          description:
            'Based on recent trends, performance may continue to decline without intervention',
          confidence: 0.7,
          impact: 'high',
          timeframe: 'long-term',
          data: { averageImprovement, trend: 'negative' },
          actionable: true,
          relatedMetrics: ['optimizationScore'],
          hypotheses: ['H8', 'H9'],
        });
      }
    }

    return insights;
  }

  async function validateHypotheses(
    metrics: EnhancedPerformanceMetrics
  ): Promise<PerformanceInsight[]> {
    const insights: PerformanceInsight[] = [];

    // H8: Load Time Hypothesis
    if (metrics.webVitals.lcp < 2500) {
      insights.push({
        id: `hypothesis-h8-${Date.now()}`,
        type: 'recommendation',
        category: 'optimization',
        title: 'Load Time Hypothesis Validated',
        description: 'LCP is within acceptable range, supporting load time optimization hypothesis',
        confidence: 0.9,
        impact: 'medium',
        timeframe: 'immediate',
        data: { lcp: metrics.webVitals.lcp, threshold: 2500 },
        actionable: false,
        relatedMetrics: ['webVitals.lcp'],
        hypotheses: ['H8'],
      });
    }

    return insights;
  }

  function predictNextOptimization(
    lastEvent: OptimizationEvent,
    history: OptimizationEvent[]
  ): Date | null {
    if (history.length < 3) return null;

    // Simple prediction based on average time between optimizations
    const intervals = history
      .slice(0, 3)
      .map((event, index) => {
        if (index === history.length - 1) return 0;
        return history[index].timestamp.getTime() - history[index + 1].timestamp.getTime();
      })
      .filter(interval => interval > 0);

    if (intervals.length === 0) return null;

    const averageInterval =
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    return new Date(lastEvent.timestamp.getTime() + averageInterval);
  }

  return {
    // State
    ...state,

    // Actions
    triggerOptimization,
    generateReport,
    stopMonitoring,

    // Computed values
    hasRecommendations: state.recommendations.length > 0,
    hasCriticalAlerts: state.alerts.some(alert => alert.severity === 'critical'),
    hasInsights: state.insights.length > 0,
    isHealthy: state.optimizationScore >= optimizationThreshold,

    // Component Traceability Matrix
    componentMapping: COMPONENT_MAPPING,
  };
}
