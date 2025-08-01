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
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
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
import { useCallback, useEffect, useState, useRef } from 'react';

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
  const { trackOptimized: analytics } = useOptimizedAnalytics();
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
    // 🚨 CRITICAL FIX: Use stable timestamp to prevent infinite re-renders
    const currentTime = Date.now();
    const baseDate = new Date(currentTime);
    
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
        lastUpdated: baseDate, // 🚨 FIX: Use stable date
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
        lastUpdated: baseDate, // 🚨 FIX: Use stable date
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
        lastUpdated: baseDate, // 🚨 FIX: Use stable date
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
        lastUpdated: baseDate, // 🚨 FIX: Use stable date
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
        lastUpdated: baseDate, // 🚨 FIX: Use stable date
        eventsCount: 89,
        status: 'needs_attention',
      },
    ];

    // Generate performance metrics
    const performanceMetrics: PerformanceMetric[] = [
      {
        id: 'perf-1',
        category: 'web_vitals',
        name: 'Page Load Speed',
        value: 1.2,
        unit: 'seconds',
        threshold: 2.0,
        status: 'healthy',
        trend: 2.5,
        optimization: ['Bundle splitting', 'Image optimization'],
      },
      {
        id: 'perf-2',
        category: 'web_vitals',
        name: 'API Response Time',
        value: 245,
        unit: 'ms',
        threshold: 300,
        status: 'healthy',
        trend: 1.8,
        optimization: ['Response caching', 'Database optimization'],
      },
      {
        id: 'perf-3',
        category: 'bundle',
        name: 'Bundle Size',
        value: 324,
        unit: 'KB',
        threshold: 250,
        status: 'warning',
        trend: -0.5,
        optimization: ['Code splitting', 'Tree shaking'],
      },
    ];

    return {
      hypothesesMetrics,
      performanceMetrics,
      optimizationRecommendations: [],
      realTimeEvents: [],
      systemHealth: [],
      predictionInsights: [],
    };
  }, []); // 🚨 CRITICAL FIX: Empty dependency array makes function stable

  /**
   * Refresh analytics data
   */
  const refreshAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // 🚨 CRITICAL FIX: Generate data inline to avoid dependency issues
      const newData = generateAnalyticsData();
      setAnalyticsData(newData);
      setLastRefresh(Date.now());

      // Track refresh event
      analytics('real_time_analytics_refreshed', {
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        refreshType: 'manual',
        dataPoints: newData.hypothesesMetrics.length + newData.performanceMetrics.length,
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
  }, [analytics, handleAsyncError, generateAnalyticsData]);

  /**
   * Trigger comprehensive optimization
   */
  const handleOptimization = useCallback(async () => {
    try {
      const result = await triggerOptimization('manual', 'comprehensive');
      setOptimizationResults(result);

      // Track optimization trigger
      analytics('comprehensive_optimization_triggered', {
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        optimizationType: 'comprehensive',
        beforeScore: optimizationScore,
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
      analytics('analytics_optimization_report_generated', {
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        reportType: 'comprehensive',
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
    analytics('real_time_analytics_optimizer_initialized', {
      userStories: COMPONENT_MAPPING.userStories,
      hypotheses: COMPONENT_MAPPING.hypotheses,
      enableRealTimeUpdates,
      enableOptimization,
      enablePredictions,
      userRole,
      deviceType: deviceInfo?.deviceType,
      componentMapping: COMPONENT_MAPPING,
    });

    // Set up real-time updates
    if (enableRealTimeUpdates) {
      const interval = setInterval(refreshAnalyticsData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [
    enableRealTimeUpdates,
    refreshInterval,
    refreshAnalyticsData,
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}