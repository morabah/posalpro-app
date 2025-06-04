/**
 * PosalPro MVP2 - Analytics & Hypothesis Validation Dashboard
 * Based on implementation plan requirements for comprehensive hypothesis tracking
 * Supports all hypotheses (H1, H3, H4, H6, H7, H8) with real-time measurement and validation
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  SparklesIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['All User Stories', 'Platform Analytics'],
  acceptanceCriteria: [
    'Hypothesis Validation',
    'Performance Measurement',
    'Baseline Comparison',
    'Statistical Analysis',
    'Real-time Tracking',
    'Success Threshold Monitoring',
  ],
  methods: [
    'trackHypothesisProgress()',
    'measurePerformance()',
    'compareBaselines()',
    'validateStatisticalSignificance()',
    'generateInsights()',
    'monitorThresholds()',
    'calculateImprovements()',
    'trackUserStoryCompletion()',
    'analyzeTestResults()',
    'generateReports()',
  ],
  hypotheses: ['H1', 'H3', 'H4', 'H6', 'H7', 'H8'],
  testCases: ['All TC-HX-XXX Test Cases'],
};

// Hypothesis definitions and targets
enum HypothesisStatus {
  ON_TRACK = 'On Track',
  AT_RISK = 'At Risk',
  BEHIND = 'Behind',
  EXCEEDED = 'Exceeded',
  COMPLETED = 'Completed',
}

interface Hypothesis {
  id: string;
  code: 'H1' | 'H3' | 'H4' | 'H6' | 'H7' | 'H8';
  title: string;
  description: string;
  targetImprovement: number;
  currentProgress: number;
  status: HypothesisStatus;
  baselineValue: number;
  currentValue: number;
  unit: string;
  userStories: string[];
  testCases: string[];
  confidenceLevel: number;
  sampleSize: number;
  measurementPeriod: string;
  lastUpdated: Date;
}

interface PerformanceMetric {
  id: string;
  hypothesis: string;
  metricName: string;
  baselineValue: number;
  currentValue: number;
  targetValue: number;
  improvement: number;
  trend: 'improving' | 'declining' | 'stable';
  confidence: number;
  significance: boolean;
  lastMeasured: Date;
}

interface UserStoryProgress {
  id: string;
  userStoryId: string;
  title: string;
  hypothesis: string[];
  completed: boolean;
  acceptanceCriteriaPassed: number;
  acceptanceCriteriaTotal: number;
  testsPassed: number;
  testsTotal: number;
  performanceTarget: number;
  actualPerformance: number;
  status: 'completed' | 'in_progress' | 'blocked' | 'not_started';
}

interface TestExecutionSummary {
  id: string;
  testCaseId: string;
  hypothesis: string;
  userStory: string;
  passed: boolean;
  executionTime: number;
  performanceMetrics: Record<string, number>;
  executedAt: Date;
  environment: string;
}

// Mock data based on our implementations
const MOCK_HYPOTHESES: Hypothesis[] = [
  {
    id: 'h1',
    code: 'H1',
    title: 'Content Discovery Efficiency',
    description: '45% reduction in content search time through AI-powered semantic search',
    targetImprovement: 45,
    currentProgress: 52,
    status: HypothesisStatus.EXCEEDED,
    baselineValue: 7.0,
    currentValue: 3.8,
    unit: 'seconds',
    userStories: ['US-1.1', 'US-1.2', 'US-1.3'],
    testCases: ['TC-H1-001', 'TC-H1-002', 'TC-H1-003'],
    confidenceLevel: 95,
    sampleSize: 450,
    measurementPeriod: '30 days',
    lastUpdated: new Date(),
  },
  {
    id: 'h3',
    code: 'H3',
    title: 'SME Contribution Efficiency',
    description: '50% reduction in SME contribution time through AI-assisted content generation',
    targetImprovement: 50,
    currentProgress: 58,
    status: HypothesisStatus.EXCEEDED,
    baselineValue: 4.5,
    currentValue: 1.9,
    unit: 'hours',
    userStories: ['US-2.1'],
    testCases: ['TC-H3-001'],
    confidenceLevel: 92,
    sampleSize: 180,
    measurementPeriod: '30 days',
    lastUpdated: new Date(),
  },
  {
    id: 'h4',
    code: 'H4',
    title: 'Cross-Department Coordination',
    description:
      '40% reduction in coordination effort through intelligent assignment and communication',
    targetImprovement: 40,
    currentProgress: 38,
    status: HypothesisStatus.ON_TRACK,
    baselineValue: 2.8,
    currentValue: 1.8,
    unit: 'hours per proposal',
    userStories: ['US-2.2', 'US-2.3', 'US-4.1', 'US-4.3'],
    testCases: ['TC-H4-001', 'TC-H4-002'],
    confidenceLevel: 88,
    sampleSize: 320,
    measurementPeriod: '30 days',
    lastUpdated: new Date(),
  },
  {
    id: 'h6',
    code: 'H6',
    title: 'Automated Requirement Extraction',
    description: '30% improvement in requirement extraction completeness through NLP processing',
    targetImprovement: 30,
    currentProgress: 31,
    status: HypothesisStatus.EXCEEDED,
    baselineValue: 32,
    currentValue: 42,
    unit: 'requirements extracted',
    userStories: ['US-4.2'],
    testCases: ['TC-H6-001'],
    confidenceLevel: 94,
    sampleSize: 75,
    measurementPeriod: '30 days',
    lastUpdated: new Date(),
  },
  {
    id: 'h7',
    code: 'H7',
    title: 'Deadline Management',
    description: '40% improvement in on-time proposal completion through timeline optimization',
    targetImprovement: 40,
    currentProgress: 35,
    status: HypothesisStatus.ON_TRACK,
    baselineValue: 65,
    currentValue: 88,
    unit: '% on-time completion',
    userStories: ['US-4.1', 'US-4.3'],
    testCases: ['TC-H7-001', 'TC-H7-002'],
    confidenceLevel: 90,
    sampleSize: 250,
    measurementPeriod: '60 days',
    lastUpdated: new Date(),
  },
  {
    id: 'h8',
    code: 'H8',
    title: 'Technical Configuration Validation',
    description: '50% reduction in validation errors through intelligent rule engine',
    targetImprovement: 50,
    currentProgress: 42,
    status: HypothesisStatus.ON_TRACK,
    baselineValue: 23,
    currentValue: 14,
    unit: 'errors per configuration',
    userStories: ['US-3.1', 'US-3.2', 'US-3.3'],
    testCases: ['TC-H8-001', 'TC-H8-002', 'TC-H8-003'],
    confidenceLevel: 89,
    sampleSize: 190,
    measurementPeriod: '30 days',
    lastUpdated: new Date(),
  },
];

const MOCK_PERFORMANCE_METRICS: PerformanceMetric[] = [
  {
    id: 'pm1',
    hypothesis: 'H1',
    metricName: 'Average Search Time',
    baselineValue: 7.0,
    currentValue: 3.8,
    targetValue: 3.85,
    improvement: 45.7,
    trend: 'improving',
    confidence: 95,
    significance: true,
    lastMeasured: new Date(),
  },
  {
    id: 'pm2',
    hypothesis: 'H1',
    metricName: 'Search Result Relevance',
    baselineValue: 72,
    currentValue: 92.5,
    targetValue: 85,
    improvement: 28.5,
    trend: 'improving',
    confidence: 94,
    significance: true,
    lastMeasured: new Date(),
  },
  {
    id: 'pm3',
    hypothesis: 'H3',
    metricName: 'SME Contribution Time',
    baselineValue: 4.5,
    currentValue: 1.9,
    targetValue: 2.25,
    improvement: 57.8,
    trend: 'improving',
    confidence: 92,
    significance: true,
    lastMeasured: new Date(),
  },
  {
    id: 'pm4',
    hypothesis: 'H6',
    metricName: 'Requirement Extraction Accuracy',
    baselineValue: 78,
    currentValue: 94.2,
    targetValue: 85,
    improvement: 20.8,
    trend: 'stable',
    confidence: 94,
    significance: true,
    lastMeasured: new Date(),
  },
  {
    id: 'pm5',
    hypothesis: 'H8',
    metricName: 'Validation Error Rate',
    baselineValue: 23,
    currentValue: 14,
    targetValue: 11.5,
    improvement: 39.1,
    trend: 'improving',
    confidence: 89,
    significance: true,
    lastMeasured: new Date(),
  },
];

const MOCK_USER_STORIES: UserStoryProgress[] = [
  {
    id: 'us1',
    userStoryId: 'US-1.1',
    title: 'Natural Language Content Search',
    hypothesis: ['H1'],
    completed: true,
    acceptanceCriteriaPassed: 3,
    acceptanceCriteriaTotal: 3,
    testsPassed: 1,
    testsTotal: 1,
    performanceTarget: 45,
    actualPerformance: 52,
    status: 'completed',
  },
  {
    id: 'us2',
    userStoryId: 'US-2.1',
    title: 'SME Technical Contribution',
    hypothesis: ['H3'],
    completed: true,
    acceptanceCriteriaPassed: 4,
    acceptanceCriteriaTotal: 4,
    testsPassed: 1,
    testsTotal: 1,
    performanceTarget: 50,
    actualPerformance: 58,
    status: 'completed',
  },
  {
    id: 'us3',
    userStoryId: 'US-4.2',
    title: 'Automated Requirement Extraction',
    hypothesis: ['H6'],
    completed: true,
    acceptanceCriteriaPassed: 4,
    acceptanceCriteriaTotal: 4,
    testsPassed: 1,
    testsTotal: 1,
    performanceTarget: 30,
    actualPerformance: 31,
    status: 'completed',
  },
  {
    id: 'us4',
    userStoryId: 'US-3.1',
    title: 'Technical Configuration Validation',
    hypothesis: ['H8'],
    completed: true,
    acceptanceCriteriaPassed: 3,
    acceptanceCriteriaTotal: 4,
    testsPassed: 2,
    testsTotal: 3,
    performanceTarget: 50,
    actualPerformance: 42,
    status: 'in_progress',
  },
];

export default function AnalyticsHypothesisValidation() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'hypotheses' | 'metrics' | 'user-stories' | 'test-results' | 'insights'
  >('overview');
  const [selectedHypothesis, setSelectedHypothesis] = useState<Hypothesis | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [sessionStartTime] = useState(Date.now());

  // Analytics tracking
  const trackAnalyticsAction = useCallback(
    (action: string, metadata: any = {}) => {
      console.log('Analytics Dashboard Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        sessionDuration: Date.now() - sessionStartTime,
      });
    },
    [sessionStartTime]
  );

  // Overall system performance summary
  const systemPerformance = useMemo(() => {
    const completedHypotheses = MOCK_HYPOTHESES.filter(
      h => h.status === HypothesisStatus.COMPLETED || h.status === HypothesisStatus.EXCEEDED
    ).length;
    const totalHypotheses = MOCK_HYPOTHESES.length;
    const avgProgress =
      MOCK_HYPOTHESES.reduce((sum, h) => sum + h.currentProgress, 0) / totalHypotheses;
    const exceedingTarget = MOCK_HYPOTHESES.filter(
      h => h.currentProgress > h.targetImprovement
    ).length;

    return {
      overallProgress: Math.round(avgProgress),
      completedHypotheses,
      totalHypotheses,
      exceedingTarget,
      atRisk: MOCK_HYPOTHESES.filter(
        h => h.status === HypothesisStatus.AT_RISK || h.status === HypothesisStatus.BEHIND
      ).length,
    };
  }, []);

  // Status indicators
  const getStatusIcon = (status: HypothesisStatus) => {
    switch (status) {
      case HypothesisStatus.COMPLETED:
      case HypothesisStatus.EXCEEDED:
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case HypothesisStatus.ON_TRACK:
        return <ClockIcon className="w-5 h-5 text-blue-600" />;
      case HypothesisStatus.AT_RISK:
        return <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />;
      case HypothesisStatus.BEHIND:
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: HypothesisStatus) => {
    switch (status) {
      case HypothesisStatus.COMPLETED:
      case HypothesisStatus.EXCEEDED:
        return 'text-green-600 bg-green-100';
      case HypothesisStatus.ON_TRACK:
        return 'text-blue-600 bg-blue-100';
      case HypothesisStatus.AT_RISK:
        return 'text-amber-600 bg-amber-100';
      case HypothesisStatus.BEHIND:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressColor = (progress: number, target: number) => {
    if (progress >= target) return 'bg-green-500';
    if (progress >= target * 0.8) return 'bg-blue-500';
    if (progress >= target * 0.6) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Handle actions
  const handleAction = useCallback(
    (action: string, target?: any) => {
      trackAnalyticsAction(`analytics_${action}`, {
        targetId: target?.id,
        targetType: target?.constructor?.name,
      });

      switch (action) {
        case 'export_report':
          console.log('Export analytics report');
          break;
        case 'refresh_data':
          console.log('Refresh analytics data');
          break;
        case 'view_details':
          console.log('View hypothesis details:', target?.id);
          break;
        default:
          console.log(`${action}:`, target?.id);
      }
    },
    [trackAnalyticsAction]
  );

  // Track page load
  useEffect(() => {
    trackAnalyticsAction('analytics_dashboard_loaded', {
      totalHypotheses: MOCK_HYPOTHESES.length,
      overallProgress: systemPerformance.overallProgress,
      completedHypotheses: systemPerformance.completedHypotheses,
    });
  }, [systemPerformance, trackAnalyticsAction]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Analytics & Hypothesis Validation
              </h1>
              <p className="text-gray-600">
                Performance Tracking • {systemPerformance.overallProgress}% average progress •{' '}
                {systemPerformance.completedHypotheses}/{systemPerformance.totalHypotheses}{' '}
                hypotheses validated
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={e => setTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
              <Button
                onClick={() => handleAction('refresh_data')}
                variant="secondary"
                className="border-gray-300"
              >
                Refresh Data
              </Button>
              <Button
                onClick={() => handleAction('export_report')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {systemPerformance.overallProgress}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Average Progress</div>
            </div>
          </Card>
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600">
                {systemPerformance.completedHypotheses}/{systemPerformance.totalHypotheses}
              </div>
              <div className="text-sm text-gray-600 mt-1">Validated Hypotheses</div>
            </div>
          </Card>
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {systemPerformance.exceedingTarget}
              </div>
              <div className="text-sm text-gray-600 mt-1">Exceeding Target</div>
            </div>
          </Card>
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-red-600">{systemPerformance.atRisk}</div>
              <div className="text-sm text-gray-600 mt-1">At Risk</div>
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              {
                id: 'hypotheses',
                label: 'Hypotheses',
                icon: SparklesIcon,
                count: MOCK_HYPOTHESES.length,
              },
              {
                id: 'metrics',
                label: 'Metrics',
                icon: ChartBarIcon,
                count: MOCK_PERFORMANCE_METRICS.length,
              },
              {
                id: 'user-stories',
                label: 'User Stories',
                icon: CheckCircleIcon,
                count: MOCK_USER_STORIES.length,
              },
              { id: 'test-results', label: 'Test Results', icon: EyeIcon },
              { id: 'insights', label: 'Insights', icon: SparklesIcon },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 py-0.5 px-2 text-xs bg-gray-100 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hypothesis Progress Chart */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Hypothesis Progress Overview
                </h3>
                <div className="space-y-4">
                  {MOCK_HYPOTHESES.map(hypothesis => (
                    <div key={hypothesis.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(hypothesis.status)}
                          <span className="font-medium">{hypothesis.code}</span>
                          <span className="text-sm text-gray-600">{hypothesis.title}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {hypothesis.currentProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(
                            hypothesis.currentProgress,
                            hypothesis.targetImprovement
                          )}`}
                          style={{
                            width: `${Math.min(hypothesis.currentProgress, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Target: {hypothesis.targetImprovement}%</span>
                        <span
                          className={`font-medium ${
                            hypothesis.currentProgress >= hypothesis.targetImprovement
                              ? 'text-green-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {hypothesis.currentProgress >= hypothesis.targetImprovement
                            ? '✓ Target Met'
                            : 'In Progress'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Performance Metrics Summary */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Key Performance Indicators
                </h3>
                <div className="space-y-4">
                  {MOCK_PERFORMANCE_METRICS.slice(0, 5).map(metric => (
                    <div
                      key={metric.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{metric.metricName}</div>
                        <div className="text-sm text-gray-600">{metric.hypothesis}</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          {metric.trend === 'improving' ? (
                            <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                          ) : metric.trend === 'declining' ? (
                            <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />
                          ) : (
                            <div className="w-4 h-4" />
                          )}
                          <span
                            className={`font-medium ${
                              metric.improvement > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {metric.improvement > 0 ? '+' : ''}
                            {metric.improvement.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {metric.currentValue}{' '}
                          {metric.hypothesis === 'H1' ? 's' : metric.hypothesis === 'H7' ? '%' : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Hypotheses Tab */}
        {activeTab === 'hypotheses' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hypotheses List */}
            <div className="lg:col-span-2">
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Hypothesis Validation Status ({MOCK_HYPOTHESES.length})
                  </h3>
                  <div className="space-y-4">
                    {MOCK_HYPOTHESES.map(hypothesis => (
                      <div
                        key={hypothesis.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedHypothesis?.id === hypothesis.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedHypothesis(hypothesis)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              {getStatusIcon(hypothesis.status)}
                              <span className="font-bold text-lg">{hypothesis.code}</span>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                  hypothesis.status
                                )}`}
                              >
                                {hypothesis.status}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">{hypothesis.title}</h4>
                            <p className="text-sm text-gray-600 mb-3">{hypothesis.description}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Progress:</span>{' '}
                                <span
                                  className={`font-bold ${
                                    hypothesis.currentProgress >= hypothesis.targetImprovement
                                      ? 'text-green-600'
                                      : 'text-blue-600'
                                  }`}
                                >
                                  {hypothesis.currentProgress}%
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Target:</span>{' '}
                                {hypothesis.targetImprovement}%
                              </div>
                              <div>
                                <span className="font-medium">Baseline:</span>{' '}
                                {hypothesis.baselineValue} {hypothesis.unit}
                              </div>
                              <div>
                                <span className="font-medium">Current:</span>{' '}
                                {hypothesis.currentValue} {hypothesis.unit}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Hypothesis Details */}
            <div>
              {selectedHypothesis ? (
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {selectedHypothesis.code} Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Statistical Confidence</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Confidence Level</span>
                          <span className="font-medium">{selectedHypothesis.confidenceLevel}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Sample Size</span>
                          <span className="font-medium">{selectedHypothesis.sampleSize}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Period</span>
                          <span className="font-medium">
                            {selectedHypothesis.measurementPeriod}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">User Stories</h4>
                        <div className="space-y-1">
                          {selectedHypothesis.userStories.map(story => (
                            <span
                              key={story}
                              className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mr-1 mb-1"
                            >
                              {story}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Test Cases</h4>
                        <div className="space-y-1">
                          {selectedHypothesis.testCases.map(testCase => (
                            <span
                              key={testCase}
                              className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full mr-1 mb-1"
                            >
                              {testCase}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <Button
                          onClick={() => handleAction('view_details', selectedHypothesis)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          View Detailed Analysis
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card>
                  <div className="p-6 text-center">
                    <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Hypothesis</h3>
                    <p className="text-gray-600">
                      Click on a hypothesis to view detailed information and metrics.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* User Stories Tab */}
        {activeTab === 'user-stories' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                User Story Completion Status ({MOCK_USER_STORIES.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User Story
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hypothesis
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acceptance Criteria
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Test Results
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {MOCK_USER_STORIES.map(story => (
                      <tr key={story.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {story.userStoryId}
                            </div>
                            <div className="text-sm text-gray-500">{story.title}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {story.hypothesis.map(h => (
                              <span
                                key={h}
                                className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full"
                              >
                                {h}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {story.acceptanceCriteriaPassed}/{story.acceptanceCriteriaTotal} passed
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className={`h-2 rounded-full ${
                                story.acceptanceCriteriaPassed === story.acceptanceCriteriaTotal
                                  ? 'bg-green-500'
                                  : 'bg-blue-500'
                              }`}
                              style={{
                                width: `${
                                  (story.acceptanceCriteriaPassed / story.acceptanceCriteriaTotal) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {story.testsPassed}/{story.testsTotal} passed
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className={`h-2 rounded-full ${
                                story.testsPassed === story.testsTotal
                                  ? 'bg-green-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{
                                width: `${(story.testsPassed / story.testsTotal) * 100}%`,
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <span
                              className={`font-medium ${
                                story.actualPerformance >= story.performanceTarget
                                  ? 'text-green-600'
                                  : 'text-blue-600'
                              }`}
                            >
                              {story.actualPerformance}%
                            </span>
                            <span className="text-gray-500">/{story.performanceTarget}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              story.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : story.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : story.status === 'blocked'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {story.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-800">Exceeding Expectations</span>
                    </div>
                    <p className="text-sm text-green-700 mt-2">
                      H1 (Content Discovery) and H3 (SME Contribution) are both exceeding their
                      target improvements by significant margins, with 52% and 58% improvements
                      respectively.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <ClockIcon className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-800">On Track</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-2">
                      H4 (Coordination), H7 (Deadline Management), and H8 (Technical Validation) are
                      progressing well and are on track to meet their targets.
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center">
                      <SparklesIcon className="w-5 h-5 text-purple-600 mr-2" />
                      <span className="font-medium text-purple-800">High Confidence</span>
                    </div>
                    <p className="text-sm text-purple-700 mt-2">
                      All hypotheses have statistical confidence levels above 88%, indicating
                      reliable measurement and validation results.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                    <h4 className="font-medium text-blue-900">Optimization Opportunity</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      Consider applying successful patterns from H1 and H3 implementations to
                      accelerate progress on remaining hypotheses.
                    </p>
                  </div>
                  <div className="p-4 border-l-4 border-green-500 bg-green-50">
                    <h4 className="font-medium text-green-900">Scale Success</h4>
                    <p className="text-sm text-green-800 mt-1">
                      Document and scale the AI-powered approaches that led to exceptional
                      performance in content discovery and SME contribution.
                    </p>
                  </div>
                  <div className="p-4 border-l-4 border-amber-500 bg-amber-50">
                    <h4 className="font-medium text-amber-900">Monitor Progress</h4>
                    <p className="text-sm text-amber-800 mt-1">
                      Continue monitoring H8 validation error reduction closely as it approaches the
                      critical 50% improvement threshold.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
