/**
 * Mobile Performance Dashboard Component
 * Extracted to prevent SSR issues with window access
 */

'use client';

import MobileResponsivenessEnhancer from '@/components/mobile/MobileResponsivenessEnhancer';
import { useAdvancedPerformanceOptimization } from '@/hooks/useAdvancedPerformanceOptimization';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useResponsive } from '@/hooks/useResponsive';
import { ErrorHandlingService } from '@/lib/errors';
import { useCallback, useEffect, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-8.1', 'US-8.2', 'US-8.3'],
  acceptanceCriteria: [
    'AC-8.1.1', // Mobile Performance Optimization
    'AC-8.2.1', // Responsive Design Standards
    'AC-8.3.1', // Touch Interaction Enhancement
  ],
  methods: [
    'trackMobilePerformance()',
    'monitorTouchInteractions()',
    'analyzeViewportAdaptation()',
    'optimizeResponsiveness()',
  ],
  hypotheses: ['H9', 'H11'], // Mobile UX and Performance Optimization
  testCases: ['TC-H9-001', 'TC-H11-001', 'TC-MOBILE-PERF-001'],
};

interface MobilePerformanceMetrics {
  viewportOptimization: number;
  touchResponsiveness: number;
  renderPerformance: number;
  networkEfficiency: number;
  batteryImpact: number;
  overallScore: number;
}

interface TouchInteractionData {
  totalInteractions: number;
  averageResponseTime: number;
  gestureAccuracy: number;
  scrollPerformance: number;
}

interface ViewportAdaptationData {
  adaptations: number;
  orientationChanges: number;
  scaleFactors: number[];
  optimalViewportScore: number;
}

export default function MobilePerformanceDashboard() {
  const [mobileMetrics, setMobileMetrics] = useState<MobilePerformanceMetrics>({
    viewportOptimization: 0,
    touchResponsiveness: 0,
    renderPerformance: 0,
    networkEfficiency: 0,
    batteryImpact: 0,
    overallScore: 0,
  });

  const [touchData, setTouchData] = useState<TouchInteractionData>({
    totalInteractions: 0,
    averageResponseTime: 0,
    gestureAccuracy: 0,
    scrollPerformance: 0,
  });

  const [viewportData, setViewportData] = useState<ViewportAdaptationData>({
    adaptations: 0,
    orientationChanges: 0,
    scaleFactors: [],
    optimalViewportScore: 0,
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastOptimization, setLastOptimization] = useState<Date | null>(null);

  // Hooks
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { isMobile, isTablet, screenWidth, screenHeight } = useResponsive();
  const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';
  const {
    metrics: performanceData,
    triggerOptimization,
    isOptimizing: performanceOptimizing,
  } = useAdvancedPerformanceOptimization({
    enableMobileOptimization: true,
    enableAutomaticOptimization: false, // Manual control for dashboard
  });

  // Error handling
  const errorHandlingService = ErrorHandlingService.getInstance();

  /**
   * Handle Mobile Metrics Update
   * Receives metrics from MobileResponsivenessEnhancer
   */
  const handleMobileMetricsUpdate = useCallback(
    (metrics: MobilePerformanceMetrics) => {
      setMobileMetrics(metrics);

      // Track metrics in analytics
      analytics('mobile_performance_metrics_updated', {
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        measurementData: {
          ...metrics,
          deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
          screenSize: `${screenWidth}x${screenHeight}`,
          orientation,
        },
        componentMapping: COMPONENT_MAPPING,
      }, 'low');
    },
    [analytics, isMobile, isTablet, screenWidth, screenHeight, orientation]
  );

  /**
   * Trigger Mobile Optimization
   * Manually trigger comprehensive mobile optimization
   */
  const handleOptimizationTrigger = useCallback(async () => {
    try {
      setIsOptimizing(true);

      const optimizationResult = await triggerOptimization('manual', 'mobile');

      if (optimizationResult) {
        setLastOptimization(new Date());

        analytics('mobile_optimization_triggered', {
          optimizationType: 'mobile',
          triggerMethod: 'manual',
          performanceBefore: performanceData?.optimizationScore || 0,
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          componentMapping: COMPONENT_MAPPING,
        }, 'medium');
      }
    } catch (error) {
      errorHandlingService.processError(error as Error, 'Mobile optimization trigger failed');
    } finally {
      setIsOptimizing(false);
    }
  }, [
    triggerOptimization,
    analytics,
    isMobile,
    isTablet,
    screenWidth,
    screenHeight,
    orientation,
    errorHandlingService,
  ]);

  /**
   * Initialize Dashboard Analytics
   */
  useEffect(() => {
    analytics('mobile_performance_dashboard_loaded', {
      userStories: COMPONENT_MAPPING.userStories,
      hypotheses: COMPONENT_MAPPING.hypotheses,
      componentMapping: COMPONENT_MAPPING,
    }, 'medium');
  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)

  /**
   * Get Performance Status Color
   */
  const getPerformanceColor = (score: number): string => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  /**
   * Get Performance Status Text
   */
  const getPerformanceStatus = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  // ✅ Safe window access with fallback
  const devicePixelRatio =
    typeof window !== 'undefined' ? window.devicePixelRatio?.toFixed(1) || '1.0' : '1.0';

  return (
    <MobileResponsivenessEnhancer
      onMetricsUpdate={handleMobileMetricsUpdate}
      config={{
        enableAdaptiveViewport: true,
        enableTouchOptimization: true,
        enablePerformanceMonitoring: true,
        enableProgressiveEnhancement: true,
        optimizationLevel: 'aggressive',
      }}
    >
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Mobile Performance Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Real-time monitoring and optimization of mobile user experience
            </p>
          </div>

          {/* Device Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}
                </div>
                <div className="text-sm text-gray-600">Device Type</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {screenWidth}×{screenHeight}
                </div>
                <div className="text-sm text-gray-600">Screen Size</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 capitalize">{orientation}</div>
                <div className="text-sm text-gray-600">Orientation</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{devicePixelRatio}x</div>
                <div className="text-sm text-gray-600">Pixel Ratio</div>
              </div>
            </div>
          </div>

          {/* Performance Metrics Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Performance Metrics</h2>
              <button
                onClick={handleOptimizationTrigger}
                disabled={isOptimizing || performanceOptimizing}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                {isOptimizing || performanceOptimizing ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Optimizing...
                  </span>
                ) : (
                  'Optimize Performance'
                )}
              </button>
            </div>

            {/* Overall Score */}
            <div className="text-center mb-8">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {mobileMetrics.overallScore.toFixed(1)}
              </div>
              <div
                className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getPerformanceColor(mobileMetrics.overallScore)}`}
              >
                {getPerformanceStatus(mobileMetrics.overallScore)}
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-semibold text-gray-900 mb-1">
                  {mobileMetrics.viewportOptimization.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Viewport Optimization</div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${mobileMetrics.viewportOptimization}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-semibold text-gray-900 mb-1">
                  {mobileMetrics.touchResponsiveness.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Touch Responsiveness</div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${mobileMetrics.touchResponsiveness}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-semibold text-gray-900 mb-1">
                  {mobileMetrics.renderPerformance.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Render Performance</div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${mobileMetrics.renderPerformance}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-semibold text-gray-900 mb-1">
                  {mobileMetrics.networkEfficiency.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Network Efficiency</div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${mobileMetrics.networkEfficiency}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-semibold text-gray-900 mb-1">
                  {mobileMetrics.batteryImpact.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Battery Impact</div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${mobileMetrics.batteryImpact}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Performance Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Web Vitals */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Web Vitals</h3>
              {performanceData?.webVitals ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Largest Contentful Paint</span>
                    <span className="font-semibold">{performanceData.webVitals.lcp}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">First Input Delay</span>
                    <span className="font-semibold">{performanceData.webVitals.fid}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cumulative Layout Shift</span>
                    <span className="font-semibold">
                      {performanceData.webVitals.cls.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">First Contentful Paint</span>
                    <span className="font-semibold">{performanceData.webVitals.fcp}ms</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Loading Web Vitals data...</div>
              )}
            </div>

            {/* Optimization History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last Optimization</span>
                  <span className="font-semibold">
                    {lastOptimization ? lastOptimization.toLocaleTimeString() : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span
                    className={`font-semibold ${isOptimizing || performanceOptimizing ? 'text-yellow-600' : 'text-green-600'}`}
                  >
                    {isOptimizing || performanceOptimizing ? 'Optimizing' : 'Ready'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Auto-Optimization</span>
                  <span className="font-semibold text-blue-600">Enabled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 10 Implementation Note */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              🚀 Phase 10: Advanced Mobile Responsiveness & Performance Monitoring
            </h3>
            <p className="text-blue-800 mb-4">
              This dashboard showcases the enhanced mobile performance monitoring capabilities
              implemented in Phase 10:
            </p>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>Real-time mobile performance metrics with comprehensive scoring</li>
              <li>Adaptive viewport optimization based on device capabilities</li>
              <li>Touch interaction monitoring with gesture recognition accuracy</li>
              <li>Progressive enhancement with capability-based feature activation</li>
              <li>Integration with advanced performance monitoring infrastructure</li>
              <li>Mobile-specific Web Vitals analysis and optimization</li>
            </ul>
          </div>
        </div>
      </div>
    </MobileResponsivenessEnhancer>
  );
}
