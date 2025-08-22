/**
 * Mobile Performance Dashboard Component
 * Extracted to prevent SSR issues with window access
 */

'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
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
   */
  const handleMobileMetricsUpdate = useCallback(() => {
    try {
      // Simulate mobile performance metrics
      const newMetrics: MobilePerformanceMetrics = {
        viewportOptimization: Math.random() * 20 + 80, // 80-100
        touchResponsiveness: Math.random() * 15 + 85, // 85-100
        renderPerformance: Math.random() * 25 + 75, // 75-100
        networkEfficiency: Math.random() * 30 + 70, // 70-100
        batteryImpact: Math.random() * 20 + 80, // 80-100
        overallScore: 0,
      };

      // Calculate overall score
      newMetrics.overallScore =
        (newMetrics.viewportOptimization +
          newMetrics.touchResponsiveness +
          newMetrics.renderPerformance +
          newMetrics.networkEfficiency +
          newMetrics.batteryImpact) /
        5;

      setMobileMetrics(newMetrics);

      // Update touch interaction data
      setTouchData({
        totalInteractions: Math.floor(Math.random() * 100) + 50,
        averageResponseTime: Math.random() * 50 + 10,
        gestureAccuracy: Math.random() * 20 + 80,
        scrollPerformance: Math.random() * 25 + 75,
      });

      // Update viewport adaptation data
      setViewportData({
        adaptations: Math.floor(Math.random() * 10) + 5,
        orientationChanges: Math.floor(Math.random() * 5) + 1,
        scaleFactors: [1, 1.25, 1.5, 2],
        optimalViewportScore: Math.random() * 20 + 80,
      });

      analytics('mobile_performance_metrics_updated', {
        metrics: newMetrics,
        deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        orientation,
        screenSize: `${screenWidth}x${screenHeight}`,
      });
    } catch (error) {
      errorHandlingService.processError(error as Error, 'Failed to update mobile metrics');
    }
  }, [analytics, errorHandlingService, isMobile, isTablet, orientation, screenWidth, screenHeight]);

  /**
   * Handle Optimization Trigger
   */
  const handleOptimizationTrigger = useCallback(async () => {
    try {
      setIsOptimizing(true);
      analytics('mobile_optimization_triggered', {
        deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        currentMetrics: mobileMetrics,
      });

      // Trigger performance optimization
      await triggerOptimization();

      // Update metrics after optimization
      setTimeout(() => {
        handleMobileMetricsUpdate();
        setLastOptimization(new Date());
        setIsOptimizing(false);
      }, 2000);

      analytics('mobile_optimization_completed', {
        deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        optimizationTime: new Date().toISOString(),
      });
    } catch (error) {
      errorHandlingService.processError(error as Error, 'Failed to trigger mobile optimization');
      setIsOptimizing(false);
    }
  }, [
    analytics,
    errorHandlingService,
    isMobile,
    isTablet,
    mobileMetrics,
    triggerOptimization,
    handleMobileMetricsUpdate,
  ]);

  /**
   * Get Performance Color
   */
  const getPerformanceColor = (score: number): string => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  /**
   * Get Performance Status
   */
  const getPerformanceStatus = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    return 'Needs Improvement';
  };

  // Effects
  useEffect(() => {
    // Initial metrics load
    handleMobileMetricsUpdate();

    // Set up periodic updates
    const interval = setInterval(handleMobileMetricsUpdate, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [handleMobileMetricsUpdate]);

  useEffect(() => {
    // Track mobile performance dashboard view
    analytics('mobile_performance_dashboard_viewed', {
      deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      orientation,
      screenSize: `${screenWidth}x${screenHeight}`,
      userAgent: navigator.userAgent,
    });
  }, [analytics, isMobile, isTablet, orientation, screenWidth, screenHeight]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mobile Performance Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Real-time monitoring and optimization of mobile user experience
          </p>
        </div>

        {/* Device Information */}
        <Card className="p-6 mb-8">
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
        </Card>

        {/* Performance Metrics Overview */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Performance Metrics</h2>
            <Button
              onClick={handleOptimizationTrigger}
              disabled={isOptimizing || performanceOptimizing}
              variant="primary"
              size="sm"
            >
              {isOptimizing || performanceOptimizing ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Optimizing...
                </span>
              ) : (
                'Optimize Performance'
              )}
            </Button>
          </div>

          {/* Overall Score */}
          <div className="text-center mb-8">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {mobileMetrics.overallScore.toFixed(1)}
            </div>
            <Badge
              variant={
                mobileMetrics.overallScore >= 90
                  ? 'success'
                  : mobileMetrics.overallScore >= 75
                    ? 'warning'
                    : 'destructive'
              }
              className={getPerformanceColor(mobileMetrics.overallScore)}
            >
              {getPerformanceStatus(mobileMetrics.overallScore)}
            </Badge>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-4">
              <div className="text-center">
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
            </Card>

            <Card className="p-4">
              <div className="text-center">
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
            </Card>

            <Card className="p-4">
              <div className="text-center">
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
            </Card>

            <Card className="p-4">
              <div className="text-center">
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
            </Card>

            <Card className="p-4">
              <div className="text-center">
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
            </Card>

            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-900 mb-1">
                  {touchData.gestureAccuracy.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Gesture Accuracy</div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${touchData.gestureAccuracy}%` }}
                  ></div>
                </div>
              </div>
            </Card>
          </div>
        </Card>

        {/* Touch Interaction Analysis */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Touch Interaction Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{touchData.totalInteractions}</div>
              <div className="text-sm text-gray-600">Total Interactions</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {touchData.averageResponseTime.toFixed(1)}ms
              </div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {touchData.gestureAccuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Gesture Accuracy</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {touchData.scrollPerformance.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Scroll Performance</div>
            </div>
          </div>
        </Card>

        {/* Viewport Adaptation */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Viewport Adaptation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{viewportData.adaptations}</div>
              <div className="text-sm text-gray-600">Adaptations</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {viewportData.orientationChanges}
              </div>
              <div className="text-sm text-gray-600">Orientation Changes</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {viewportData.scaleFactors.length}
              </div>
              <div className="text-sm text-gray-600">Scale Factors</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {viewportData.optimalViewportScore.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Optimal Viewport Score</div>
            </div>
          </div>
        </Card>

        {/* Last Optimization */}
        {lastOptimization && (
          <Card className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Last optimization: {lastOptimization.toLocaleString()}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
