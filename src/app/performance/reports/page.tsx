'use client';

/**
 * PosalPro MVP2 - Test Reports Management Page
 * View, analyze, and manage all generated test reports
 */

import { Card } from '@/components/ui/Card';
import { reportGenerator, TestReport } from '@/lib/performance/reportGenerator';
import {
  ArrowDownTrayIcon,
  ChartBarIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  TrashIcon,
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

export default function TestReportsPage() {
  const [reports, setReports] = useState<TestReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<TestReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Load reports on mount
  useEffect(() => {
    const existingReports = reportGenerator.loadReportsFromStorage();
    setReports(existingReports);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    if (score >= 70) return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
    return <XCircleIcon className="w-5 h-5 text-red-500" />;
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

  const deleteReport = (reportId: string) => {
    const updatedReports = reports.filter(r => r.id !== reportId);
    setReports(updatedReports);

    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('posalpro_test_reports', JSON.stringify(updatedReports));
    }
  };

  const clearAllReports = () => {
    setReports([]);
    reportGenerator.clearReports();

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('posalpro_test_reports');
    }
  };

  const viewReportDetails = (report: TestReport) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Reports</h1>
        <p className="text-gray-600">
          View, analyze, and manage comprehensive test reports for PosalPro MVP2 performance
          validation
        </p>
      </div>

      {/* Reports Summary */}
      {reports.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Reports Overview</h2>
            <Button
              onClick={clearAllReports}
              variant="destructive"
              className="flex items-center space-x-2"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Clear All</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{reports.length}</div>
              <div className="text-sm text-blue-800">Total Reports</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {reports.filter(r => r.summary.averageScore >= 90).length}
              </div>
              <div className="text-sm text-green-800">Excellent Scores (90+)</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {
                  reports.filter(r => r.summary.averageScore >= 70 && r.summary.averageScore < 90)
                    .length
                }
              </div>
              <div className="text-sm text-yellow-800">Good Scores (70-89)</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {reports.filter(r => r.summary.averageScore < 70).length}
              </div>
              <div className="text-sm text-red-800">Needs Improvement (&lt;70)</div>
            </div>
          </div>
        </Card>
      )}

      {/* Reports List */}
      {reports.length === 0 ? (
        <Card className="p-8 text-center">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Generated</h3>
          <p className="text-gray-600 mb-4">
            Run the performance tests and generate your first comprehensive report.
          </p>
          <Button
            onClick={() => (window.location.href = '/performance/test')}
            className="flex items-center space-x-2 mx-auto"
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>Go to Test Dashboard</span>
          </Button>
        </Card>
      ) : (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Reports</h2>

          <div className="space-y-4">
            {reports.map((report, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getScoreIcon(report.summary.averageScore)}
                    <div>
                      <h4 className="font-semibold text-gray-900">{report.testSuite}</h4>
                      <p className="text-sm text-gray-600">
                        Generated: {new Date(report.timestamp).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Report ID: {report.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`font-bold px-3 py-1 rounded ${getScoreColor(report.summary.averageScore)}`}
                    >
                      {report.summary.averageScore.toFixed(1)}/100
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">Tests:</span>
                    <span className="ml-1 font-medium">{report.summary.totalTests}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Pass Rate:</span>
                    <span className="ml-1 font-medium">{report.summary.passRate.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Errors:</span>
                    <span className="ml-1 font-medium text-red-600">
                      {report.summary.totalErrors}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Warnings:</span>
                    <span className="ml-1 font-medium text-yellow-600">
                      {report.summary.totalWarnings}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Render:</span>
                    <span className="ml-1 font-medium">
                      {report.performance.averageRenderTime.toFixed(1)}ms
                    </span>
                  </div>
                </div>

                {/* Critical Issues Preview */}
                {report.recommendations.critical.length > 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h5 className="font-medium text-red-600 mb-2">
                      🚨 {report.recommendations.critical.length} Critical Issue(s)
                    </h5>
                    <ul className="text-sm text-red-700 space-y-1">
                      {report.recommendations.critical.slice(0, 2).map((issue, i) => (
                        <li key={i}>• {issue}</li>
                      ))}
                      {report.recommendations.critical.length > 2 && (
                        <li className="text-red-600 font-medium">
                          +{report.recommendations.critical.length - 2} more critical issues...
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Optimization Opportunities */}
                {report.performance.optimizationOpportunities.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-medium text-blue-600 mb-2">
                      💡 {report.performance.optimizationOpportunities.length} Optimization
                      Opportunity(ies)
                    </h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {report.performance.optimizationOpportunities.slice(0, 2).map((opp, i) => (
                        <li key={i}>• {opp}</li>
                      ))}
                      {report.performance.optimizationOpportunities.length > 2 && (
                        <li className="text-blue-600 font-medium">
                          +{report.performance.optimizationOpportunities.length - 2} more
                          opportunities...
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => viewReportDetails(report)}
                      variant="outline"
                      className="text-sm px-3 py-1 flex items-center space-x-1"
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span>View Details</span>
                    </Button>
                  </div>

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
                    <Button
                      onClick={() => deleteReport(report.id)}
                      variant="destructive"
                      className="text-sm px-3 py-1 flex items-center space-x-1"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Report Details Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Report Details: {selectedReport.testSuite}
                </h3>
                <Button
                  onClick={() => setShowReportModal(false)}
                  variant="outline"
                  className="text-sm"
                >
                  Close
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Performance Analysis */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Performance Analysis</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-600">Average Render Time</div>
                    <div className="text-lg font-bold text-gray-900">
                      {selectedReport.performance.averageRenderTime.toFixed(1)}ms
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-600">Total Memory Usage</div>
                    <div className="text-lg font-bold text-gray-900">
                      {(selectedReport.performance.totalMemoryUsage / 1024 / 1024).toFixed(1)}MB
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-600">Memory Leaks</div>
                    <div className="text-lg font-bold text-gray-900">
                      {selectedReport.performance.memoryLeaks}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-600">Slowest Test</div>
                    <div className="text-sm font-medium text-gray-900">
                      {selectedReport.performance.slowestTest}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-600">Fastest Test</div>
                    <div className="text-sm font-medium text-gray-900">
                      {selectedReport.performance.fastestTest}
                    </div>
                  </div>
                </div>
              </div>

              {/* Accessibility Analysis */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Accessibility Analysis</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-600">WCAG Compliance</div>
                    <div className="text-lg font-bold text-gray-900">
                      {selectedReport.accessibility.wcagCompliance.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-600">Keyboard Navigation</div>
                    <div className="text-lg font-bold text-gray-900">
                      {selectedReport.accessibility.keyboardNavigation.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-600">Screen Reader</div>
                    <div className="text-lg font-bold text-gray-900">
                      {selectedReport.accessibility.screenReaderCompatibility.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-600">Touch Targets</div>
                    <div className="text-lg font-bold text-gray-900">
                      {selectedReport.accessibility.touchTargets.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* All Recommendations */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>

                {selectedReport.recommendations.critical.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-red-600 mb-2">🚨 Critical Issues</h5>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1 bg-red-50 p-3 rounded-lg">
                      {selectedReport.recommendations.critical.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedReport.recommendations.high.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-orange-600 mb-2">⚠️ High Priority</h5>
                    <ul className="list-disc list-inside text-sm text-orange-700 space-y-1 bg-orange-50 p-3 rounded-lg">
                      {selectedReport.recommendations.high.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedReport.recommendations.medium.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-blue-600 mb-2">💡 Medium Priority</h5>
                    <ul className="list-disc list-inside text-sm text-blue-700 space-y-1 bg-blue-50 p-3 rounded-lg">
                      {selectedReport.recommendations.medium.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedReport.recommendations.low.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-green-600 mb-2">✓ Low Priority</h5>
                    <ul className="list-disc list-inside text-sm text-green-700 space-y-1 bg-green-50 p-3 rounded-lg">
                      {selectedReport.recommendations.low.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* System Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">System Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Environment:</span>
                    <span className="ml-2">{selectedReport.metadata.environment}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Viewport:</span>
                    <span className="ml-2">{selectedReport.metadata.viewport}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">User Agent:</span>
                    <span className="ml-2 text-xs">{selectedReport.metadata.userAgent}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
