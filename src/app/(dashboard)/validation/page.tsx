/**
 * PosalPro MVP2 - Validation Dashboard Screen
 * Phase 9: Advanced Validation Dashboard & Predictive Module Implementation
 *
 * Component Traceability Matrix:
 * - User Stories: US-3.1 (Configuration Validation), US-3.2 (License Validation), US-3.3 (Technical Review)
 * - Acceptance Criteria: AC-3.1.1, AC-3.1.2, AC-3.1.3, AC-3.1.4, AC-3.2.1, AC-3.2.2, AC-3.2.3, AC-3.2.4, AC-3.3.1, AC-3.3.2, AC-3.3.3
 * - Methods: statusIndicators(), compatibilityCheck(), generateSolutions(), trackErrorReduction(), measureValidationSpeed()
 * - Hypotheses: H8 (Technical Configuration Validation - 50% error reduction target)
 * - Test Cases: TC-H8-001, TC-H8-002, TC-H8-003
 */

'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useAuth } from '@/components/providers/AuthProvider';
import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import {
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-3.1', 'US-3.2', 'US-3.3'],
  acceptanceCriteria: [
    'AC-3.1.1',
    'AC-3.1.2',
    'AC-3.1.3',
    'AC-3.1.4',
    'AC-3.2.1',
    'AC-3.2.2',
    'AC-3.2.3',
    'AC-3.2.4',
    'AC-3.3.1',
    'AC-3.3.2',
    'AC-3.3.3',
  ],
  methods: [
    'statusIndicators()',
    'compatibilityCheck()',
    'generateSolutions()',
    'trackErrorReduction()',
    'measureValidationSpeed()',
    'licenseCheck()',
    'pricingImpact()',
    'standardsCheck()',
    'exportReports()',
  ],
  hypotheses: ['H8'],
  testCases: ['TC-H8-001', 'TC-H8-002', 'TC-H8-003'],
};

// Validation interfaces based on wireframe specifications
interface ValidationIssue {
  id: string;
  type: 'configuration' | 'license' | 'technical' | 'compliance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  proposalId: string;
  proposalName: string;
  detectedAt: Date;
  status: 'pending' | 'reviewing' | 'resolved' | 'ignored';
  suggestedFix?: string;
  impact: string;
  estimatedFixTime: number;
}

interface ValidationMetrics {
  totalIssues: number;
  criticalIssues: number;
  resolvedIssues: number;
  errorReductionRate: number;
  avgValidationTime: number;
  fixAcceptanceRate: number;
  licenseComplianceScore: number;
  lastUpdated: Date;
}

// API Response interfaces for proper typing
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface ValidationExportResponse {
  downloadUrl: string;
}

interface ValidationRule {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  lastRun: Date;
  detectedIssues: number;
  performance: number;
}

export default function ValidationDashboardPage() {
  const { user } = useAuth() || {};
  const apiClient = useApiClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { handleAsyncError } = useErrorHandler();

  // State management
  const [loading, setLoading] = useState(true);
  const [validationMetrics, setValidationMetrics] = useState<ValidationMetrics | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  const [activeTab, setActiveTab] = useState<string>('issues');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [timeFilter, setTimeFilter] = useState('last-30-days');

  // Track component mount for H8 hypothesis
  useEffect(() => {
    analytics(
      'validation_dashboard_loaded',
      {
        userStory: 'US-3.1',
        hypothesis: 'H8',
        component: 'ValidationDashboard',
        ...COMPONENT_MAPPING,
      },
      'high'
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)

  // Extract loadValidationData function so it can be reused for refresh
  const loadValidationData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch validation metrics - ensure no duplicate /api in URL
      const metricsResponse = await apiClient.get<ApiResponse<ValidationMetrics>>('/validation/metrics');
      if (metricsResponse?.success && metricsResponse.data) {
        setValidationMetrics(metricsResponse.data);
      }

      // Fetch validation issues
      const issuesResponse = await apiClient.get<ApiResponse<ValidationIssue[]>>('/validation/issues');
      if (issuesResponse?.success && issuesResponse.data) {
        setValidationIssues(issuesResponse.data);
      }

      // Fetch validation rules
      const rulesResponse = await apiClient.get<ApiResponse<ValidationRule[]>>('/validation/rules');
      if (rulesResponse?.success && rulesResponse.data) {
        setValidationRules(rulesResponse.data);
      }

      // Track successful load
      analytics(
        'validation_data_loaded',
        {
          userStory: 'US-3.1',
          hypothesis: 'H8',
          component: 'ValidationDashboard',
          metricsCount: metricsResponse?.data ? Object.keys(metricsResponse.data).length : 0,
          issuesCount: issuesResponse?.data ? issuesResponse.data.length : 0,
          rulesCount: rulesResponse?.data ? rulesResponse.data.length : 0,
          ...COMPONENT_MAPPING,
        },
        'high'
      );
    } catch (error) {
      handleAsyncError(error as Error, 'Failed to load validation data', {
        context: 'ValidationDashboard',
        userStory: 'US-3.1',
        hypothesis: 'H8',
        ...COMPONENT_MAPPING,
      });
    } finally {
      setLoading(false);
    }
  }, [apiClient, analytics, handleAsyncError]);

  // Create refreshValidationData function for the refresh button
  const refreshValidationData = useCallback(async () => {
    analytics(
      'validation_data_refresh_requested',
      {
        userStory: 'US-3.1',
        hypothesis: 'H8',
        component: 'ValidationDashboard',
        ...COMPONENT_MAPPING,
      },
      'medium'
    );

    await loadValidationData();
  }, [loadValidationData, analytics, COMPONENT_MAPPING]);

  // Load validation data on mount
  useEffect(() => {
    loadValidationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)

  // Track validation issue resolution (AC-3.1.2)
  const handleResolveIssue = useCallback(
    async (issueId: string, resolution: string) => {
      const startTime = Date.now();

      try {
        const response = await apiClient.post<ApiResponse>(`/validation/issues/${issueId}/resolve`, {
          status: 'resolved',
          resolution,
        });

        if (response?.success) {
          // Update local state
          setValidationIssues(prev =>
            prev.map(issue =>
              issue.id === issueId ? { ...issue, status: 'resolved' as const } : issue
            )
          );

          // Track fix success for H8 hypothesis (AC-3.1.3)
          const resolutionTime = Date.now() - startTime;
          analytics(
            'validation_issue_resolved',
            {
              issueId,
              resolutionTime,
              userStory: 'US-3.1',
              hypothesis: 'H8',
              acceptanceCriteria: ['AC-3.1.2'],
              testCase: 'TC-H8-001',
            },
            'medium'
          );

          // Refresh metrics after resolution
          const metricsResponse = await apiClient.get<ApiResponse<ValidationMetrics>>('/validation/metrics');
          if (metricsResponse?.success && metricsResponse.data) {
            setValidationMetrics(metricsResponse.data);
          }
        }
      } catch (error) {
        handleAsyncError(error, 'Failed to resolve validation issue');
      }
    },
    [apiClient, analytics, handleAsyncError]
  );

  // Generate validation report (AC-3.3.3)
  const handleExportReport = useCallback(
    async (format: 'pdf' | 'csv') => {
      try {
        analytics(
          'validation_report_export_started',
          {
            format,
            userStory: 'US-3.3',
            hypothesis: 'H8',
            acceptanceCriteria: ['AC-3.3.3'],
          },
          'medium'
        );

        const response = await apiClient.post<ApiResponse<ValidationExportResponse>>('/validation/export', {
          format,
          timeFilter,
          includeMetrics: true,
          includeIssues: true,
          includeRules: true,
        });

        if (response?.success && response.data?.downloadUrl) {
          // Trigger download
          const link = document.createElement('a');
          link.href = response.data.downloadUrl;
          link.download = `validation-report-${new Date().toISOString().split('T')[0]}.${format}`;
          link.click();

          analytics(
            'validation_report_exported',
            {
              format,
              userStory: 'US-3.3',
              hypothesis: 'H8',
              testCase: 'TC-H8-003',
            },
            'medium'
          );
        }
      } catch (error) {
        handleAsyncError(error, 'Failed to export validation report');
      }
    },
    [apiClient, analytics, handleAsyncError, timeFilter]
  );

  // Filter issues based on selected criteria
  const filteredIssues = validationIssues.filter(issue => {
    if (selectedFilter !== 'all' && issue.type !== selectedFilter) return false;
    if (selectedSeverity !== 'all' && issue.severity !== selectedSeverity) return false;
    return true;
  });

  // Calculate H8 hypothesis progress
  const h8Progress = validationMetrics
    ? {
        errorReductionTarget: 50, // 50% reduction target for H8
        currentReduction: validationMetrics.errorReductionRate,
        progressPercentage: Math.min((validationMetrics.errorReductionRate / 50) * 100, 100),
        isOnTrack: validationMetrics.errorReductionRate >= 25, // 50% of target considered on track
        validationSpeedImprovement: validationMetrics.avgValidationTime
          ? Math.max(0, 100 - (validationMetrics.avgValidationTime / 3600) * 100)
          : 0, // Assuming 1 hour baseline
      }
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <nav className="flex" aria-label="Breadcrumb">
                  <ol role="list" className="flex items-center space-x-4">
                    <li>
                      <a href="/dashboard" className="text-gray-400 hover:text-gray-500">
                        Dashboard
                      </a>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <svg
                          className="flex-shrink-0 h-5 w-5 text-gray-300"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                        </svg>
                        <span className="ml-4 text-sm font-medium text-gray-500">
                          Validation Dashboard
                        </span>
                      </div>
                    </li>
                  </ol>
                </nav>
                <h1 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                  Validation Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Advanced validation analytics and issue management • H8 Hypothesis Tracking
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                <Button
                  variant="outline"
                  onClick={() => handleExportReport('pdf')}
                  className="inline-flex items-center"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportReport('csv')}
                  className="inline-flex items-center"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={refreshValidationData} className="inline-flex items-center">
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* H8 Hypothesis Progress - CRITICAL FIX: Add null check */}
        {h8Progress && (
          <Card className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                H8 Hypothesis: Technical Configuration Validation
              </h3>
              <Badge variant={h8Progress?.isOnTrack ? 'success' : 'warning'}>
                {h8Progress?.isOnTrack ? 'On Track' : 'Needs Attention'}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Error Reduction Progress</p>
                <div className="flex items-center space-x-3">
                  <Progress value={h8Progress?.progressPercentage ?? 0} className="flex-1" />
                  <span className="text-sm font-medium text-gray-900">
                    {h8Progress?.currentReduction?.toFixed?.(1) ?? '0.0'}% /{' '}
                    {h8Progress?.errorReductionTarget ?? 50}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Validation Speed Improvement</p>
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-blue-500" />
                  <span className="text-lg font-semibold text-gray-900">
                    {h8Progress?.validationSpeedImprovement?.toFixed?.(1) ?? '0.0'}%
                  </span>
                  <span className="text-sm text-gray-500">faster</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Target Status</p>
                <div className="flex items-center space-x-2">
                  {h8Progress.isOnTrack ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    {h8Progress.isOnTrack ? 'Meeting expectations' : 'Requires optimization'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Validation Metrics Cards */}
        {validationMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Issues</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {validationMetrics.totalIssues}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-8 w-8 text-orange-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Critical Issues</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {validationMetrics.criticalIssues}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Resolved Issues</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {validationMetrics.resolvedIssues}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Fix Acceptance Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {validationMetrics?.fixAcceptanceRate?.toFixed?.(1) ?? '0.0'}%
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Main Tabs Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="issues">Active Issues</TabsTrigger>
            <TabsTrigger value="rules">Validation Rules</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Active Issues Tab */}
          <TabsContent value="issues" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Validation Issues</h3>
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedFilter}
                    onChange={e => setSelectedFilter(e.target.value)}
                    className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="configuration">Configuration</option>
                    <option value="license">License</option>
                    <option value="technical">Technical</option>
                    <option value="compliance">Compliance</option>
                  </select>
                  <select
                    value={selectedSeverity}
                    onChange={e => setSelectedSeverity(e.target.value)}
                    className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="all">All Severity</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {filteredIssues.length === 0 ? (
                  <div className="text-center py-12">
                    <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No validation issues found</p>
                  </div>
                ) : (
                  filteredIssues.map(issue => (
                    <div
                      key={issue.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge
                              variant={
                                issue.severity === 'critical'
                                  ? 'destructive'
                                  : issue.severity === 'high'
                                    ? 'warning'
                                    : issue.severity === 'medium'
                                      ? 'secondary'
                                      : 'outline'
                              }
                            >
                              {issue.severity}
                            </Badge>
                            <Badge variant="outline">{issue.type}</Badge>
                            <span className="text-sm text-gray-500">{issue.proposalName}</span>
                          </div>
                          <h4 className="text-base font-medium text-gray-900 mb-2">
                            {issue.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">{issue.description}</p>
                          {issue.suggestedFix && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                              <div className="flex items-start">
                                <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-blue-900">Suggested Fix</p>
                                  <p className="text-sm text-blue-700">{issue.suggestedFix}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <span>Impact: {issue.impact}</span>
                            <span>Est. Fix Time: {issue.estimatedFixTime}min</span>
                            <span>Detected: {new Date(issue.detectedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col space-y-2">
                          {issue.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleResolveIssue(
                                  issue.id,
                                  issue.suggestedFix || 'Manual resolution'
                                )
                              }
                            >
                              Resolve
                            </Button>
                          )}
                          <Badge
                            variant={
                              issue.status === 'resolved'
                                ? 'success'
                                : issue.status === 'reviewing'
                                  ? 'warning'
                                  : 'secondary'
                            }
                          >
                            {issue.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Validation Rules Tab */}
          <TabsContent value="rules" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Validation Rules</h3>
                <Button className="inline-flex items-center">
                  <CogIcon className="h-4 w-4 mr-2" />
                  Configure Rules
                </Button>
              </div>

              <div className="space-y-4">
                {validationRules.map(rule => (
                  <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-base font-medium text-gray-900">{rule.name}</h4>
                          <Badge variant={rule.enabled ? 'success' : 'secondary'}>
                            {rule.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          <Badge variant="outline">{rule.type}</Badge>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span>Last Run: {new Date(rule.lastRun).toLocaleDateString()}</span>
                          <span>Issues Detected: {rule.detectedIssues}</span>
                          <span>Performance: {rule.performance?.toFixed?.(1) ?? '0.0'}%</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Validation Performance Trends
                </h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">
                    Performance charts will be implemented with chart library
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Issue Resolution Metrics
                </h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Resolution metrics visualization</p>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation History</h3>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Historical validation data will be displayed here</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
