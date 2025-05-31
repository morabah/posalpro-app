/**
 * Development Dashboard - Phase 1.5
 * Real-time development environment health and quality monitoring
 */

import React from 'react';
import { DevelopmentValidator } from '../../lib/validation/development-validator';

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
  duration: number;
}

interface HealthCheckResult {
  overall: boolean;
  checks: Record<string, ValidationResult>;
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

interface QualityMetrics {
  typescript: {
    strictMode: boolean;
    errorCount: number;
    warningCount: number;
  };
  eslint: {
    errorCount: number;
    warningCount: number;
    rulesCount: number;
  };
  performance: {
    buildTime: number;
    bundleSize: number;
    memoryUsage: number;
  };
  codebase: {
    totalFiles: number;
    totalLines: number;
    complexityScore: number;
    testCoverage: number;
  };
}

interface DashboardMetrics {
  healthCheck: HealthCheckResult;
  qualityMetrics: QualityMetrics;
  timestamp: number;
}

const DevDashboardPage = async () => {
  let dashboardData: DashboardMetrics | null = null;
  let error: string | null = null;

  try {
    const validator = new DevelopmentValidator();

    // Run health check and collect metrics
    const [healthCheck, qualityMetrics] = await Promise.all([
      validator.performHealthCheck(),
      validator.getQualityMetrics(),
    ]);

    dashboardData = {
      healthCheck,
      qualityMetrics,
      timestamp: Date.now(),
    };
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error occurred';
  }

  const formatDuration = (ms: number) => `${ms.toFixed(2)}ms`;
  const formatTimestamp = (timestamp: number) => new Date(timestamp).toLocaleTimeString();

  const StatusIndicator = ({ passed }: { passed: boolean }) => (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {passed ? '✓ PASS' : '✗ FAIL'}
    </span>
  );

  const MetricCard = ({
    title,
    value,
    unit,
    status,
  }: {
    title: string;
    value: number | string;
    unit?: string;
    status?: 'good' | 'warning' | 'error';
  }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'good':
          return 'border-green-200 bg-green-50';
        case 'warning':
          return 'border-yellow-200 bg-yellow-50';
        case 'error':
          return 'border-red-200 bg-red-50';
        default:
          return 'border-gray-200 bg-white';
      }
    };

    return (
      <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
        <div className="text-sm font-medium text-gray-600">{title}</div>
        <div className="text-2xl font-bold text-gray-900">
          {value}
          {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🛠️ Development Dashboard</h1>
          <p className="text-gray-600">
            Phase 1.5 - Real-time development environment monitoring and quality tracking
          </p>
          {dashboardData && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {formatTimestamp(dashboardData.timestamp)}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-8 p-6 border border-red-200 bg-red-50 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Dashboard Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {dashboardData && (
          <div className="space-y-8">
            {/* Health Check Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Environment Health Check</h2>
                <StatusIndicator passed={dashboardData.healthCheck.overall} />
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <MetricCard title="Total Checks" value={dashboardData.healthCheck.summary.total} />
                <MetricCard
                  title="Passed"
                  value={dashboardData.healthCheck.summary.passed}
                  status="good"
                />
                <MetricCard
                  title="Failed"
                  value={dashboardData.healthCheck.summary.failed}
                  status={dashboardData.healthCheck.summary.failed > 0 ? 'error' : 'good'}
                />
                <MetricCard
                  title="Warnings"
                  value={dashboardData.healthCheck.summary.warnings}
                  status={dashboardData.healthCheck.summary.warnings > 0 ? 'warning' : 'good'}
                />
              </div>

              {/* Individual Checks */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">Check Details</h3>
                {Object.entries(dashboardData.healthCheck.checks).map(
                  ([checkName, result]: [string, ValidationResult]) => (
                    <div
                      key={checkName}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900 capitalize">
                            {checkName.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          <StatusIndicator passed={result.passed} />
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                        {result.details && Object.keys(result.details).length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            Duration: {formatDuration(result.duration)}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Quality Metrics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Code Quality Metrics</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* TypeScript Metrics */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">TypeScript</h3>
                  <div className="space-y-2">
                    <MetricCard
                      title="Strict Mode"
                      value={
                        dashboardData.qualityMetrics.typescript.strictMode ? 'Enabled' : 'Disabled'
                      }
                      status={dashboardData.qualityMetrics.typescript.strictMode ? 'good' : 'error'}
                    />
                    <MetricCard
                      title="Errors"
                      value={dashboardData.qualityMetrics.typescript.errorCount}
                      status={
                        dashboardData.qualityMetrics.typescript.errorCount === 0 ? 'good' : 'error'
                      }
                    />
                  </div>
                </div>

                {/* ESLint Metrics */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">ESLint</h3>
                  <div className="space-y-2">
                    <MetricCard
                      title="Errors"
                      value={dashboardData.qualityMetrics.eslint.errorCount}
                      status={
                        dashboardData.qualityMetrics.eslint.errorCount === 0 ? 'good' : 'error'
                      }
                    />
                    <MetricCard
                      title="Warnings"
                      value={dashboardData.qualityMetrics.eslint.warningCount}
                      status={
                        dashboardData.qualityMetrics.eslint.warningCount === 0 ? 'good' : 'warning'
                      }
                    />
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Performance</h3>
                  <div className="space-y-2">
                    <MetricCard
                      title="Memory Usage"
                      value={dashboardData.qualityMetrics.performance.memoryUsage}
                      unit="MB"
                      status={
                        dashboardData.qualityMetrics.performance.memoryUsage < 200
                          ? 'good'
                          : dashboardData.qualityMetrics.performance.memoryUsage < 500
                            ? 'warning'
                            : 'error'
                      }
                    />
                    <MetricCard
                      title="Build Time"
                      value={dashboardData.qualityMetrics.performance.buildTime || 'N/A'}
                      unit={dashboardData.qualityMetrics.performance.buildTime ? 'ms' : ''}
                    />
                  </div>
                </div>

                {/* Codebase Metrics */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Codebase</h3>
                  <div className="space-y-2">
                    <MetricCard
                      title="Total Files"
                      value={dashboardData.qualityMetrics.codebase.totalFiles}
                    />
                    <MetricCard
                      title="Total Lines"
                      value={dashboardData.qualityMetrics.codebase.totalLines}
                    />
                    <MetricCard
                      title="Complexity Score"
                      value={dashboardData.qualityMetrics.codebase.complexityScore}
                      status={
                        dashboardData.qualityMetrics.codebase.complexityScore < 100
                          ? 'good'
                          : dashboardData.qualityMetrics.codebase.complexityScore < 300
                            ? 'warning'
                            : 'error'
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Quality Check</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Run comprehensive code quality validation
                  </p>
                  <code className="text-xs bg-blue-100 px-2 py-1 rounded">
                    npm run quality:check
                  </code>
                </div>
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Auto Fix</h3>
                  <p className="text-sm text-green-700 mb-3">
                    Automatically fix linting and formatting issues
                  </p>
                  <code className="text-xs bg-green-100 px-2 py-1 rounded">
                    npm run quality:fix
                  </code>
                </div>
                <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
                  <h3 className="font-medium text-purple-900 mb-2">Enhanced Dev Server</h3>
                  <p className="text-sm text-purple-700 mb-3">
                    Start development server with validation
                  </p>
                  <code className="text-xs bg-purple-100 px-2 py-1 rounded">
                    npm run dev:enhanced
                  </code>
                </div>
              </div>
            </div>

            {/* Development Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Development Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Phase 1.5 Features</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✅ Enhanced development server with pre-flight checks</li>
                    <li>✅ Comprehensive code quality validation</li>
                    <li>✅ Real-time environment health monitoring</li>
                    <li>✅ Development workflow automation scripts</li>
                    <li>✅ Quality metrics tracking and reporting</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Available Scripts</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>
                      <code className="bg-gray-100 px-1 rounded">npm run dev:enhanced</code> -
                      Enhanced dev server
                    </li>
                    <li>
                      <code className="bg-gray-100 px-1 rounded">npm run quality:check</code> -
                      Quality validation
                    </li>
                    <li>
                      <code className="bg-gray-100 px-1 rounded">npm run quality:fix</code> -
                      Auto-fix issues
                    </li>
                    <li>
                      <code className="bg-gray-100 px-1 rounded">npm run pre-commit</code> -
                      Pre-commit checks
                    </li>
                    <li>
                      <code className="bg-gray-100 px-1 rounded">npm run type-check</code> -
                      TypeScript validation
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevDashboardPage;
