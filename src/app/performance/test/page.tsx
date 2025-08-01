'use client';

/**
 * PosalPro MVP2 - Comprehensive Performance Testing Dashboard
 * Real-time performance validation and optimization testing for all UI components
 */

import { Card } from '@/components/ui/Card';
import { componentTester, ComponentTestResult } from '@/lib/performance/componentTester';
import { performanceTester, PerformanceTestResult } from '@/lib/performance/performanceTester';
import { reportGenerator, TestReport } from '@/lib/performance/reportGenerator';
import { sidebarTester, SidebarTestResult } from '@/lib/performance/sidebarTester';
import {
  ArrowDownTrayIcon,
  Bars3Icon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  CommandLineIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

// Simple Button component
const Button = ({
  onClick,
  disabled,
  children,
  variant = 'primary',
  className = '',
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'destructive';
  className?: string;
}) => {
  const baseClasses =
    'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// Simple Alert component
const Alert = ({
  children,
  type = 'info',
}: {
  children: React.ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error';
}) => {
  const typeClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  return <div className={`border rounded-lg p-4 ${typeClasses[type]}`}>{children}</div>;
};

type TestType = 'performance' | 'sidebar' | 'components';

export default function PerformanceTestPage() {
  const [performanceResults, setPerformanceResults] = useState<PerformanceTestResult[]>([]);
  const [sidebarResults, setSidebarResults] = useState<SidebarTestResult[]>([]);
  const [componentResults, setComponentResults] = useState<ComponentTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [activeTestType, setActiveTestType] = useState<TestType>('performance');
  const [reports, setReports] = useState<TestReport[]>([]);
  const [reportHTML, setReportHTML] = useState<string>('');

  // Load existing test results on mount
  useEffect(() => {
    setPerformanceResults(performanceTester.getTestResults());
    setSidebarResults(sidebarTester.getTestResults());
    setComponentResults(componentTester.getTestResults());

    // Load existing reports from storage
    const existingReports = reportGenerator.loadReportsFromStorage();
    setReports(existingReports);
  }, []);

  const runProposalWizardTests = async () => {
    setIsRunningTests(true);
    setCurrentTest('Running ProposalWizard performance tests...');

    try {
      performanceTester.clearResults();
      const results = await performanceTester.testProposalWizard();
      setPerformanceResults(results);
      setCurrentTest('');
    } catch (error) {
      console.error('Performance tests failed:', error);
      setCurrentTest('Test execution failed');
    } finally {
      setIsRunningTests(false);
    }
  };

  const runSidebarTests = async () => {
    setIsRunningTests(true);
    setCurrentTest('Running comprehensive sidebar functionality tests...');

    try {
      sidebarTester.clearResults();
      const results = await sidebarTester.runAllSidebarTests();
      setSidebarResults(results);
      setCurrentTest('');
    } catch (error) {
      console.error('Sidebar tests failed:', error);
      setCurrentTest('Test execution failed');
    } finally {
      setIsRunningTests(false);
    }
  };

  const runComponentTests = async () => {
    setIsRunningTests(true);
    setCurrentTest('Running comprehensive component functionality tests...');

    try {
      componentTester.clearResults();
      const results = await componentTester.runAllComponentTests();
      setComponentResults(results);
      setCurrentTest('');
    } catch (error) {
      console.error('Component tests failed:', error);
      setCurrentTest('Test execution failed');
    } finally {
      setIsRunningTests(false);
    }
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setCurrentTest('Running all comprehensive tests...');

    try {
      // Clear all previous results
      performanceTester.clearResults();
      sidebarTester.clearResults();
      componentTester.clearResults();

      // Run all test suites
      setCurrentTest('Running ProposalWizard performance tests...');
      const perfResults = await performanceTester.testProposalWizard();
      setPerformanceResults(perfResults);

      setCurrentTest('Running sidebar functionality tests...');
      const sidebarRes = await sidebarTester.runAllSidebarTests();
      setSidebarResults(sidebarRes);

      setCurrentTest('Running component functionality tests...');
      const componentRes = await componentTester.runAllComponentTests();
      setComponentResults(componentRes);

      setCurrentTest('');
    } catch (error) {
      console.error('All tests failed:', error);
      setCurrentTest('Test execution failed');
    } finally {
      setIsRunningTests(false);
    }
  };

  const clearAllResults = () => {
    performanceTester.clearResults();
    sidebarTester.clearResults();
    componentTester.clearResults();
    setPerformanceResults([]);
    setSidebarResults([]);
    setComponentResults([]);
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    if (score >= 70) return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
    return <XCircleIcon className="w-5 h-5 text-red-500" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getAllResults = () => {
    return [...performanceResults, ...sidebarResults, ...componentResults];
  };

  const overallScore = () => {
    const allResults = getAllResults();
    if (allResults.length === 0) return 0;
    return allResults.reduce((sum, result) => sum + result.score, 0) / allResults.length;
  };

  const getTestTypeResults = (): Array<| PerformanceTestResult
    | SidebarTestResult
    | ComponentTestResult> => {
    switch (activeTestType) {
      case 'performance':
        return performanceResults;
      case 'sidebar':
        return sidebarResults;
      case 'components':
        return componentResults;
      default:
        return [];
    }
  };

  const getTestTypeScore = () => {
    const results = getTestTypeResults();
    if (results.length === 0) return 0;
    return results.reduce((sum, result) => sum + result.score, 0) / results.length;
  };

  // Type guard functions
  const isPerformanceResult = (result: any): result is PerformanceTestResult => {
    return 'renderTime' in result && 'rerenderCount' in result;
  };

  const isSidebarResult = (result: any): result is SidebarTestResult => {
    return 'duration' in result && 'errors' in result && 'warnings' in result;
  };

  const isComponentResult = (result: any): result is ComponentTestResult => {
    return 'componentType' in result && 'duration' in result && 'errors' in result;
  };

  // Helper function to get duration from any result type
  const getResultDuration = (
    result: PerformanceTestResult | SidebarTestResult | ComponentTestResult
  ): number => {
    if (isPerformanceResult(result)) {
      return result.renderTime;
    }
    if (isSidebarResult(result) || isComponentResult(result)) {
      return result.duration;
    }
    return 0;
  };

  // Helper function to get errors from any result type
  const getResultErrors = (
    result: PerformanceTestResult | SidebarTestResult | ComponentTestResult
  ): string[] => {
    if (isPerformanceResult(result)) {
      return []; // Performance results don't have errors array
    }
    if (isSidebarResult(result) || isComponentResult(result)) {
      return result.errors;
    }
    return [];
  };

  // Helper function to get warnings from any result type
  const getResultWarnings = (
    result: PerformanceTestResult | SidebarTestResult | ComponentTestResult
  ): string[] => {
    if (isPerformanceResult(result)) {
      return []; // Performance results don't have warnings array
    }
    if (isSidebarResult(result) || isComponentResult(result)) {
      return result.warnings;
    }
    return [];
  };

  // Helper function to get details from any result type
  const getResultDetails = (
    result: PerformanceTestResult | SidebarTestResult | ComponentTestResult
  ): Record<string, any> => {
    if (isPerformanceResult(result)) {
      return {
        renderTime: result.renderTime,
        rerenderCount: result.rerenderCount,
        memoryUsage: result.memoryUsage,
        infiniteLoopDetected: result.infiniteLoopDetected,
        recommendations: result.recommendations?.length || 0,
      };
    }
    if (isSidebarResult(result) || isComponentResult(result)) {
      return result.details;
    }
    return {};
  };

  const generateReport = async () => {
    setIsRunningTests(true);
    setCurrentTest('Generating comprehensive test report...');

    try {
      const report = reportGenerator.generateComprehensiveReport(
        performanceResults,
        sidebarResults,
        componentResults
      );

      // Save report to storage
      reportGenerator.saveReportToStorage(report);

      // Generate HTML report
      const htmlReport = reportGenerator.generateHTMLReport(report);
      setReportHTML(htmlReport);

      // Update reports list
      setReports([report, ...reports]);
      setCurrentTest('');
    } catch (error) {
      console.error('Report generation failed:', error);
      setCurrentTest('Report generation failed');
    } finally {
      setIsRunningTests(false);
    }
  };

  const downloadReport = (report: TestReport, format: 'json' | 'csv' | 'html') => {
    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        content = reportGenerator.exportReportAsJSON(report);
        filename = `posalpro_test_report_${report.id}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        content = reportGenerator.exportReportAsCSV(report);
        filename = `posalpro_test_report_${report.id}.csv`;
        mimeType = 'text/csv';
        break;
      case 'html':
        content = reportGenerator.generateHTMLReport(report);
        filename = `posalpro_test_report_${report.id}.html`;
        mimeType = 'text/html';
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Comprehensive Performance Testing Dashboard
        </h1>
        <p className="text-gray-600">
          Validate and monitor performance optimizations for all PosalPro MVP2 components, sidebar
          functionality, forms, tabs, buttons, and UI interactions
        </p>
      </div>

      {/* Overall Performance Score */}
      {getAllResults().length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Overall Performance Score</h2>
              <p className="text-sm text-gray-600">
                Average score across all {getAllResults().length} tests
              </p>
            </div>
            <div
              className={`text-2xl font-bold px-4 py-2 rounded-lg ${getScoreColor(overallScore())}`}
            >
              {overallScore().toFixed(1)}/100
            </div>
          </div>

          {/* Test Summary */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{performanceResults.length}</div>
              <div className="text-sm text-blue-800">Performance Tests</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{sidebarResults.length}</div>
              <div className="text-sm text-purple-800">Sidebar Tests</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{componentResults.length}</div>
              <div className="text-sm text-green-800">Component Tests</div>
            </div>
          </div>
        </Card>
      )}

      {/* Test Controls */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Comprehensive Test Suites</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Button
            onClick={runProposalWizardTests}
            disabled={isRunningTests}
            className="h-24 flex flex-col justify-center items-center space-y-2"
          >
            <ChartBarIcon className="w-6 h-6" />
            <div className="text-center">
              <span className="font-semibold block">Performance Suite</span>
              <span className="text-sm opacity-80">ProposalWizard & Core</span>
            </div>
          </Button>

          <Button
            onClick={runSidebarTests}
            disabled={isRunningTests}
            className="h-24 flex flex-col justify-center items-center space-y-2"
          >
            <Bars3Icon className="w-6 h-6" />
            <div className="text-center">
              <span className="font-semibold block">Sidebar Suite</span>
              <span className="text-sm opacity-80">Navigation & RBAC</span>
            </div>
          </Button>

          <Button
            onClick={runComponentTests}
            disabled={isRunningTests}
            className="h-24 flex flex-col justify-center items-center space-y-2"
          >
            <CogIcon className="w-6 h-6" />
            <div className="text-center">
              <span className="font-semibold block">Component Suite</span>
              <span className="text-sm opacity-80">Forms, Tabs, Buttons</span>
            </div>
          </Button>

          <Button
            onClick={runAllTests}
            disabled={isRunningTests}
            variant="primary"
            className="h-24 flex flex-col justify-center items-center space-y-2 bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <CommandLineIcon className="w-6 h-6" />
            <div className="text-center">
              <span className="font-semibold block">Complete Suite</span>
              <span className="text-sm opacity-80">All Tests</span>
            </div>
          </Button>
        </div>

        {/* Clear Results Button */}
        <div className="flex justify-end">
          <Button
            onClick={clearAllResults}
            variant="outline"
            disabled={isRunningTests}
            className="flex items-center space-x-2"
          >
            <span>Clear All Results</span>
          </Button>
        </div>
      </Card>

      {/* Current Test Status */}
      {currentTest && (
        <Alert type="info">
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-5 h-5 animate-spin" />
            <span>{currentTest}</span>
          </div>
        </Alert>
      )}

      {/* Test Type Tabs */}
      {getAllResults().length > 0 && (
        <Card className="p-6">
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTestType('performance')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTestType === 'performance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Performance Tests ({performanceResults.length})
              </button>
              <button
                onClick={() => setActiveTestType('sidebar')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTestType === 'sidebar'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Sidebar Tests ({sidebarResults.length})
              </button>
              <button
                onClick={() => setActiveTestType('components')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTestType === 'components'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Component Tests ({componentResults.length})
              </button>
            </nav>
          </div>

          {/* Test Type Score */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {activeTestType} Test Results
              </h3>
              <div
                className={`text-xl font-bold px-3 py-1 rounded-lg ${getScoreColor(getTestTypeScore())}`}
              >
                {getTestTypeScore().toFixed(1)}/100
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-4">
            {getTestTypeResults().map((result, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getScoreIcon(result.score)}
                    <div>
                      <h4 className="font-semibold text-gray-900">{result.testName}</h4>
                      {'componentType' in result && (
                        <p className="text-sm text-gray-600">Type: {result.componentType}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {getResultDuration(result).toFixed(2)}ms
                    </span>
                    <span className={`font-bold px-2 py-1 rounded ${getScoreColor(result.score)}`}>
                      {result.score.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                {'metrics' in result && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-gray-600">Render Time:</span>
                      <span className="ml-1 font-medium">
                        {result.metrics.renderTime?.toFixed(2)}ms
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Memory:</span>
                      <span className="ml-1 font-medium">
                        {((result.metrics.memoryUsage || 0) / 1024).toFixed(1)}KB
                      </span>
                    </div>
                    {'eventCount' in result.metrics && (
                      <div>
                        <span className="text-gray-600">Events:</span>
                        <span className="ml-1 font-medium">{result.metrics.eventCount}</span>
                      </div>
                    )}
                    {'navigationCount' in result.metrics && (
                      <div>
                        <span className="text-gray-600">Navigation:</span>
                        <span className="ml-1 font-medium">{result.metrics.navigationCount}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Errors and Warnings */}
                {(getResultErrors(result).length > 0 || getResultWarnings(result).length > 0) && (
                  <div className="space-y-2">
                    {getResultErrors(result).length > 0 && (
                      <div>
                        <h5 className="font-medium text-red-600 mb-1">Errors:</h5>
                        <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                          {getResultErrors(result).map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {getResultWarnings(result).length > 0 && (
                      <div>
                        <h5 className="font-medium text-yellow-600 mb-1">Warnings:</h5>
                        <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                          {getResultWarnings(result).map((warning, i) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Details */}
                {Object.keys(getResultDetails(result)).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <h5 className="font-medium text-gray-700 mb-2">Test Details:</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {Object.entries(getResultDetails(result)).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1')}:
                          </span>
                          <span className="ml-1 font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Instructions */}
      {getAllResults().length === 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Comprehensive Testing Instructions
          </h3>
          <div className="space-y-4 text-gray-700">
            <div>
              <h4 className="font-medium text-blue-600 mb-2">🚀 Performance Suite</h4>
              <p className="text-sm">
                Tests ProposalWizard component performance, render times, memory usage, and
                optimization metrics.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-purple-600 mb-2">📋 Sidebar Suite</h4>
              <p className="text-sm">
                Validates navigation rendering, role-based access control, expand/collapse
                functionality, mobile responsiveness, accessibility compliance, and state
                management.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-green-600 mb-2">🔧 Component Suite</h4>
              <p className="text-sm">
                Tests form fields, tabs, buttons, modals, data tables, search components, validation
                logic, and user interactions.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-600 mb-2">⚡ Complete Suite</h4>
              <p className="text-sm">
                Runs all test suites sequentially for comprehensive application validation and
                performance monitoring.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Report Generation */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Test Report</h2>
        <p className="text-gray-600 mb-4">
          Generate a comprehensive report with detailed analysis, recommendations, and export
          options.
        </p>

        <div className="flex justify-end space-x-3">
          <Button
            onClick={generateReport}
            disabled={isRunningTests || getAllResults().length === 0}
            className="flex items-center space-x-2"
          >
            <DocumentTextIcon className="w-5 h-5" />
            <span>Generate Report</span>
          </Button>
        </div>

        {getAllResults().length === 0 && (
          <Alert type="warning">
            <span>Run some tests first to generate a report.</span>
          </Alert>
        )}
      </Card>

      {/* Reports */}
      {reports.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Reports</h2>

          <div className="space-y-4">
            {reports.map((report, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                    <div>
                      <h4 className="font-semibold text-gray-900">{report.testSuite}</h4>
                      <p className="text-sm text-gray-600">Report ID: {report.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {new Date(report.timestamp).toLocaleString()}
                    </span>
                    <span
                      className={`font-bold px-2 py-1 rounded ${getScoreColor(report.summary.averageScore)}`}
                    >
                      {report.summary.averageScore.toFixed(1)}/100
                    </span>
                  </div>
                </div>

                {/* Report Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Tests:</span>
                    <span className="ml-1 font-medium">{report.summary.totalTests}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Pass Rate:</span>
                    <span className="ml-1 font-medium">{report.summary.passRate.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Errors:</span>
                    <span className="ml-1 font-medium">{report.summary.totalErrors}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Warnings:</span>
                    <span className="ml-1 font-medium">{report.summary.totalWarnings}</span>
                  </div>
                </div>

                {/* Critical Recommendations */}
                {report.recommendations.critical.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-red-600 mb-2">Critical Issues:</h5>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {report.recommendations.critical.slice(0, 3).map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                      {report.recommendations.critical.length > 3 && (
                        <li className="text-gray-600">
                          +{report.recommendations.critical.length - 3} more issues...
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Download Options */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <h5 className="font-medium text-gray-700 mb-2">Download Report:</h5>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => downloadReport(report, 'html')}
                      variant="outline"
                      className="text-sm px-3 py-1 flex items-center space-x-1"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      <span>HTML</span>
                    </Button>
                    <Button
                      onClick={() => downloadReport(report, 'json')}
                      variant="outline"
                      className="text-sm px-3 py-1 flex items-center space-x-1"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      <span>JSON</span>
                    </Button>
                    <Button
                      onClick={() => downloadReport(report, 'csv')}
                      variant="outline"
                      className="text-sm px-3 py-1 flex items-center space-x-1"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      <span>CSV</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
