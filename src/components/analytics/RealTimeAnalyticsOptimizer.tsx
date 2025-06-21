/**
 * PosalPro MVP2 - Real-Time Analytics Optimizer
 * Phase 8: Advanced Analytics Integration & Optimization
 *
 * Component Traceability Matrix Integration
 * User Stories: US-5.1 (Analytics), US-5.2 (Hypothesis Tracking), US-6.1 (Performance)
 * Hypotheses: H1, H3, H4, H6, H7, H8 (All hypothesis validation with optimization)
 *
 * Phase 8 Implementation: Real-Time Analytics Integration
 */

'use client';

import { useAdvancedPerformanceOptimization } from '@/hooks/useAdvancedPerformanceOptimization';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import {
  ArrowPathIcon,
  BoltIcon,
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  DocumentChartBarIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FireIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-5.1', 'US-5.2', 'US-6.1', 'US-6.2', 'US-4.1'],
  acceptanceCriteria: [
    'AC-5.1.1', // Real-time analytics
    'AC-5.1.2', // Hypothesis tracking
    'AC-5.2.1', // Performance optimization
    'AC-6.1.1', // Load time optimization
    'AC-6.1.2', // Bundle optimization
    'AC-4.1.6', // Analytics integration
  ],
  methods: [
    'integrateRealTimeAnalytics()',
    'optimizePerformanceMetrics()',
    'validateAllHypotheses()',
    'generateOptimizationInsights()',
    'trackRealTimeEvents()',
  ],
  hypotheses: ['H1', 'H3', 'H4', 'H6', 'H7', 'H8'],
  testCases: ['TC-H1-009', 'TC-H3-006', 'TC-H4-007', 'TC-H6-004', 'TC-H7-005', 'TC-H8-009'],
};

interface RealTimeAnalyticsData {
  hypothesesMetrics: HypothesisMetric[];
  performanceMetrics: PerformanceMetric[];
  optimizationRecommendations: OptimizationRecommendation[];
  realTimeEvents: AnalyticsEvent[];
  systemHealth: SystemHealthMetric[];
  predictionInsights: PredictionInsight[];
}

interface HypothesisMetric {
  id: string;
  hypothesis: 'H1' | 'H3' | 'H4' | 'H6' | 'H7' | 'H8';
  name: string;
  currentValue: number;
  targetValue: number;
  progressPercentage: number;
  trend: 'improving' | 'stable' | 'declining';
  confidence: number;
  lastUpdated: Date;
  eventsCount: number;
  status: 'excellent' | 'good' | 'needs_attention' | 'critical';
}

interface PerformanceMetric {
  id: string;
  category: 'web_vitals' | 'bundle' | 'memory' | 'mobile' | 'user_experience';
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'healthy' | 'warning' | 'critical';
  trend: number; // percentage change
  optimization: string[];
}

interface OptimizationRecommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'performance' | 'analytics' | 'user_experience' | 'infrastructure';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  estimatedImprovement: string;
  relatedHypotheses: string[];
  implementationSteps: string[];
}

interface AnalyticsEvent {
  id: string;
  timestamp: Date;
  type: string;
  hypothesis: string;
  impact: number;
  userStory: string;
  success: boolean;
}

interface SystemHealthMetric {
  component: string;
  status: 'healthy' | 'degraded' | 'critical';
  responseTime: number;
  errorRate: number;
  throughput: number;
}

interface PredictionInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk';
  title: string;
  description: string;
  confidence: number;
  timeframe: 'immediate' | 'short_term' | 'long_term';
  actionable: boolean;
  relatedMetrics: string[];
}

interface RealTimeAnalyticsOptimizerProps {
  className?: string;
  refreshInterval?: number;
  enableRealTimeUpdates?: boolean;
  enableOptimization?: boolean;
  enablePredictions?: boolean;
  userRole?: 'admin' | 'developer' | 'analyst' | 'user';
}

export default function RealTimeAnalyticsOptimizer({
  className = '',
  refreshInterval = 10000,
  enableRealTimeUpdates = true,
  enableOptimization = true,
  enablePredictions = true,
  userRole = 'developer',
}: RealTimeAnalyticsOptimizerProps) {
  // Hooks
  const analytics = useAnalytics();
  const { handleAsyncError } = useErrorHandler();
  const { deviceInfo, isMobile, getOptimalTouchTargetSize, getMobileClasses } =
    useMobileDetection();

  const {
    metrics: performanceMetrics,
    optimizationScore,
    triggerOptimization,
    isOptimizing,
    recommendations: performanceRecommendations,
    generateReport,
  } = useAdvancedPerformanceOptimization({
    enableRealTimeMonitoring: true,
    enableAutomaticOptimization: enableOptimization,
    enablePredictiveOptimization: enablePredictions,
    enableHypothesisValidation: true,
    optimizationThreshold: 80,
  });

  // State
  const [analyticsData, setAnalyticsData] = useState<RealTimeAnalyticsData>({
    hypothesesMetrics: [],
    performanceMetrics: [],
    optimizationRecommendations: [],
    realTimeEvents: [],
    systemHealth: [],
    predictionInsights: [],
  });

  const [selectedView, setSelectedView] = useState<
    'overview' | 'hypotheses' | 'performance' | 'predictions'
  >('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [optimizationResults, setOptimizationResults] = useState<any>(null);

  /**
   * Generate comprehensive analytics data
   */
  const generateAnalyticsData = useCallback((): RealTimeAnalyticsData => {
    // Mock comprehensive analytics data
    const hypothesesMetrics: HypothesisMetric[] = [
      {
        id: 'h1-metric',
        hypothesis: 'H1',
        name: 'Content Discovery Efficiency',
        currentValue: 42.3,
        targetValue: 45,
        progressPercentage: 94.0,
        trend: 'improving',
        confidence: 92,
        lastUpdated: new Date(),
        eventsCount: 234,
        status: 'excellent',
      },
      {
        id: 'h3-metric',
        hypothesis: 'H3',
        name: 'SME Contribution Efficiency',
        currentValue: 48.7,
        targetValue: 50,
        progressPercentage: 97.4,
        trend: 'improving',
        confidence: 95,
        lastUpdated: new Date(),
        eventsCount: 187,
        status: 'excellent',
      },
      {
        id: 'h4-metric',
        hypothesis: 'H4',
        name: 'Cross-Department Coordination',
        currentValue: 37.2,
        targetValue: 40,
        progressPercentage: 93.0,
        trend: 'stable',
        confidence: 88,
        lastUpdated: new Date(),
        eventsCount: 156,
        status: 'good',
      },
      {
        id: 'h6-metric',
        hypothesis: 'H6',
        name: 'RFP Requirement Extraction',
        currentValue: 29.1,
        targetValue: 30,
        progressPercentage: 97.0,
        trend: 'improving',
        confidence: 94,
        lastUpdated: new Date(),
        eventsCount: 98,
        status: 'excellent',
      },
      {
        id: 'h7-metric',
        hypothesis: 'H7',
        name: 'Timeline Estimation Accuracy',
        currentValue: 25.4,
        targetValue: 40,
        progressPercentage: 63.5,
        trend: 'improving',
        confidence: 72,
        lastUpdated: new Date(),
        eventsCount: 89,
        status: 'needs_attention',
      },
      {
        id: 'h8-metric',
        hypothesis: 'H8',
        name: 'Technical Validation Automation',
        currentValue: 23.1,
        targetValue: 50,
        progressPercentage: 46.2,
        trend: 'improving',
        confidence: 68,
        lastUpdated: new Date(),
        eventsCount: 76,
        status: 'needs_attention',
      },
    ];

    const performanceMetricsData: PerformanceMetric[] = [
      {
        id: 'web-vitals',
        category: 'web_vitals',
        name: 'Web Vitals Score',
        value: optimizationScore,
        unit: 'score',
        threshold: 90,
        status:
          optimizationScore >= 90 ? 'healthy' : optimizationScore >= 70 ? 'warning' : 'critical',
        trend: 5.2,
        optimization: ['LCP optimization', 'CLS improvement', 'FID reduction'],
      },
      {
        id: 'bundle-size',
        category: 'bundle',
        name: 'Bundle Size',
        value: performanceMetrics.bundleMetrics?.totalSize || 0,
        unit: 'KB',
        threshold: 500000,
        status: (performanceMetrics.bundleMetrics?.totalSize || 0) < 500000 ? 'healthy' : 'warning',
        trend: -12.3,
        optimization: ['Code splitting', 'Tree shaking', 'Compression'],
      },
      {
        id: 'memory-usage',
        category: 'memory',
        name: 'Memory Usage',
        value: performanceMetrics.memoryMetrics?.memoryUsagePercentage || 0,
        unit: '%',
        threshold: 80,
        status:
          (performanceMetrics.memoryMetrics?.memoryUsagePercentage || 0) < 80
            ? 'healthy'
            : 'critical',
        trend: -3.1,
        optimization: ['Memory leak detection', 'GC optimization'],
      },
    ];

    const optimizationRecommendations: OptimizationRecommendation[] = [
      {
        id: 'h7-timeline-optimization',
        priority: 'high',
        category: 'analytics',
        title: 'Enhance Timeline Estimation Analytics',
        description:
          'H7 hypothesis is underperforming. Implement advanced timeline prediction algorithms.',
        impact: 'Improve timeline accuracy by 15-20%',
        effort: 'medium',
        estimatedImprovement: '15-20% accuracy improvement',
        relatedHypotheses: ['H7'],
        implementationSteps: [
          'Implement machine learning timeline prediction',
          'Add historical data analysis',
          'Create timeline confidence scoring',
          'Integrate with project management tools',
        ],
      },
      {
        id: 'h8-validation-automation',
        priority: 'high',
        category: 'infrastructure',
        title: 'Accelerate Technical Validation Automation',
        description: 'H8 hypothesis needs optimization. Enhance automated validation capabilities.',
        impact: 'Reduce validation time by 25-30%',
        effort: 'high',
        estimatedImprovement: '25-30% time reduction',
        relatedHypotheses: ['H8'],
        implementationSteps: [
          'Expand automated validation rules',
          'Implement AI-powered error detection',
          'Create validation workflow optimization',
          'Add real-time validation feedback',
        ],
      },
    ];

    const realTimeEvents: AnalyticsEvent[] = [
      {
        id: 'event-1',
        timestamp: new Date(Date.now() - 30000),
        type: 'content_search_efficiency',
        hypothesis: 'H1',
        impact: 8.2,
        userStory: 'US-1.1',
        success: true,
      },
      {
        id: 'event-2',
        timestamp: new Date(Date.now() - 45000),
        type: 'sme_contribution_speed',
        hypothesis: 'H3',
        impact: 12.1,
        userStory: 'US-1.2',
        success: true,
      },
    ];

    const systemHealth: SystemHealthMetric[] = [
      {
        component: 'Analytics API',
        status: 'healthy',
        responseTime: 89,
        errorRate: 0.1,
        throughput: 1240,
      },
      {
        component: 'Performance Monitor',
        status: 'healthy',
        responseTime: 156,
        errorRate: 0.0,
        throughput: 890,
      },
    ];

    const predictionInsights: PredictionInsight[] = [
      {
        id: 'prediction-1',
        type: 'opportunity',
        title: 'H1 Target Achievement Predicted',
        description: 'Based on current trends, H1 hypothesis will exceed target within 7 days',
        confidence: 89,
        timeframe: 'short_term',
        actionable: false,
        relatedMetrics: ['content_search_time', 'user_satisfaction'],
      },
      {
        id: 'prediction-2',
        type: 'risk',
        title: 'H7 Performance Risk Detected',
        description: 'Timeline estimation accuracy may plateau without intervention',
        confidence: 76,
        timeframe: 'long_term',
        actionable: true,
        relatedMetrics: ['timeline_accuracy', 'estimation_confidence'],
      },
    ];

    return {
      hypothesesMetrics,
      performanceMetrics: performanceMetricsData,
      optimizationRecommendations,
      realTimeEvents,
      systemHealth,
      predictionInsights,
    };
  }, [optimizationScore, performanceMetrics]);

  /**
   * Refresh analytics data
   */
  const refreshAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const newData = generateAnalyticsData();
      setAnalyticsData(newData);
      setLastRefresh(Date.now());

      // Track refresh event
      analytics.track('real_time_analytics_refreshed', {
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        refreshType: 'manual',
        dataPoints: newData.hypothesesMetrics.length + newData.performanceMetrics.length,
        timestamp: Date.now(),
        componentMapping: COMPONENT_MAPPING,
      });
    } catch (error) {
      handleAsyncError(error as Error, 'Failed to refresh analytics data', {
        context: 'RealTimeAnalyticsOptimizer.refreshAnalyticsData',
        component: 'RealTimeAnalyticsOptimizer',
        userStory: 'US-5.1',
        severity: 'medium',
      });
    } finally {
      setIsLoading(false);
    }
  }, [generateAnalyticsData, analytics, handleAsyncError]);

  /**
   * Trigger comprehensive optimization
   */
  const handleOptimization = useCallback(async () => {
    try {
      const result = await triggerOptimization('manual', 'comprehensive');
      setOptimizationResults(result);

      // Track optimization trigger
      analytics.track('comprehensive_optimization_triggered', {
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        optimizationType: 'comprehensive',
        beforeScore: optimizationScore,
        timestamp: Date.now(),
        componentMapping: COMPONENT_MAPPING,
      });
    } catch (error) {
      handleAsyncError(error as Error, 'Failed to trigger optimization', {
        context: 'RealTimeAnalyticsOptimizer.handleOptimization',
        component: 'RealTimeAnalyticsOptimizer',
        userStory: 'US-6.1',
        severity: 'medium',
      });
    }
  }, [triggerOptimization, analytics, optimizationScore, handleAsyncError]);

  /**
   * Generate comprehensive report
   */
  const handleGenerateReport = useCallback(async () => {
    try {
      const report = await generateReport();

      // Download as JSON
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-optimization-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Track report generation
      analytics.track('analytics_optimization_report_generated', {
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        reportType: 'comprehensive',
        timestamp: Date.now(),
        componentMapping: COMPONENT_MAPPING,
      });
    } catch (error) {
      handleAsyncError(error as Error, 'Failed to generate report', {
        context: 'RealTimeAnalyticsOptimizer.handleGenerateReport',
        component: 'RealTimeAnalyticsOptimizer',
        userStory: 'US-5.1',
        severity: 'medium',
      });
    }
  }, [generateReport, analytics, handleAsyncError]);

  /**
   * Initialize and set up real-time updates
   */
  useEffect(() => {
    refreshAnalyticsData();

    // Track component initialization
    analytics.track('real_time_analytics_optimizer_initialized', {
      userStories: COMPONENT_MAPPING.userStories,
      hypotheses: COMPONENT_MAPPING.hypotheses,
      enableRealTimeUpdates,
      enableOptimization,
      enablePredictions,
      userRole,
      deviceType: deviceInfo?.deviceType,
      timestamp: Date.now(),
      componentMapping: COMPONENT_MAPPING,
    });

    // Set up real-time updates
    if (enableRealTimeUpdates) {
      const interval = setInterval(refreshAnalyticsData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [
    refreshAnalyticsData,
    enableRealTimeUpdates,
    refreshInterval,
    analytics,
    enableOptimization,
    enablePredictions,
    userRole,
    deviceInfo?.deviceType,
  ]);

  // Generate mobile classes
  const mobileClasses = getMobileClasses();
  const combinedClasses = `${mobileClasses} ${className}`.trim();

  return (
    <div className={`real-time-analytics-optimizer ${combinedClasses}`}>
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <RocketLaunchIcon className="w-6 h-6 text-blue-600" />
              Real-Time Analytics Optimizer
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Advanced analytics integration with real-time optimization
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Optimization Score */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <SparklesIcon className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Score:</span>
              <span
                className={`text-lg font-bold ${
                  optimizationScore >= 90
                    ? 'text-green-600'
                    : optimizationScore >= 70
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {optimizationScore.toFixed(0)}
              </span>
            </div>

            {/* Action Buttons */}
            <button
              onClick={refreshAnalyticsData}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              style={{ minHeight: `${getOptimalTouchTargetSize()}px` }}
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={handleOptimization}
              disabled={isOptimizing}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              style={{ minHeight: `${getOptimalTouchTargetSize()}px` }}
            >
              <BoltIcon className="w-4 h-4" />
              {isOptimizing ? 'Optimizing...' : 'Optimize'}
            </button>

            <button
              onClick={handleGenerateReport}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              style={{ minHeight: `${getOptimalTouchTargetSize()}px` }}
            >
              <DocumentChartBarIcon className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Last Refresh Indicator */}
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <ClockIcon className="w-3 h-3" />
          Last updated: {new Date(lastRefresh).toLocaleTimeString()}
          {enableRealTimeUpdates && (
            <span className="flex items-center gap-1 ml-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live updates enabled
            </span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
            { id: 'hypotheses', name: 'Hypotheses', icon: LightBulbIcon },
            { id: 'performance', name: 'Performance', icon: CpuChipIcon },
            { id: 'predictions', name: 'Predictions', icon: EyeIcon },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id as any)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  selectedView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              style={{ minHeight: `${getOptimalTouchTargetSize()}px` }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {selectedView === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div
              className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}
            >
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Hypotheses</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData.hypothesesMetrics.length}
                    </p>
                  </div>
                  <LightBulbIcon className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Progress</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {analyticsData.hypothesesMetrics.length > 0
                        ? (
                            analyticsData.hypothesesMetrics.reduce(
                              (sum, h) => sum + h.progressPercentage,
                              0
                            ) / analyticsData.hypothesesMetrics.length
                          ).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                  <ChartBarIcon className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Optimization Score</p>
                    <p
                      className={`text-2xl font-bold ${
                        optimizationScore >= 90
                          ? 'text-green-600'
                          : optimizationScore >= 70
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {optimizationScore.toFixed(0)}
                    </p>
                  </div>
                  <FireIcon className="w-8 h-8 text-orange-500" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Recommendations</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {analyticsData.optimizationRecommendations.length}
                    </p>
                  </div>
                  <ExclamationTriangleIcon className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Hypotheses Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Hypotheses Status</h3>
              <div className="space-y-3">
                {analyticsData.hypothesesMetrics.map(hypothesis => (
                  <div
                    key={hypothesis.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900">
                          {hypothesis.hypothesis}
                        </span>
                        <span className="text-sm text-gray-600">{hypothesis.name}</span>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            hypothesis.status === 'excellent'
                              ? 'bg-green-100 text-green-800'
                              : hypothesis.status === 'good'
                                ? 'bg-blue-100 text-blue-800'
                                : hypothesis.status === 'needs_attention'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {hypothesis.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>
                            {hypothesis.currentValue.toFixed(1)}
                            {hypothesis.hypothesis === 'H1' ||
                            hypothesis.hypothesis === 'H3' ||
                            hypothesis.hypothesis === 'H8'
                              ? '% reduction'
                              : '% improvement'}
                          </span>
                          <span>{hypothesis.progressPercentage.toFixed(1)}% to target</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              hypothesis.progressPercentage >= 90
                                ? 'bg-green-500'
                                : hypothesis.progressPercentage >= 70
                                  ? 'bg-blue-500'
                                  : hypothesis.progressPercentage >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(hypothesis.progressPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedView === 'performance' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData.performanceMetrics.map(metric => (
                  <div key={metric.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{metric.name}</h4>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          metric.status === 'healthy'
                            ? 'bg-green-100 text-green-800'
                            : metric.status === 'warning'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {metric.status}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {metric.value.toLocaleString()} {metric.unit}
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      Threshold: {metric.threshold.toLocaleString()} {metric.unit}
                    </div>
                    <div className="space-y-1">
                      {metric.optimization.map((opt, index) => (
                        <div key={index} className="text-xs text-gray-500">
                          • {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
