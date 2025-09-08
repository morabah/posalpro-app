/**
 * PosalPro MVP2 - Comprehensive Test Report Generator
 * Generates detailed reports for investigation and enhancement
 */

import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';

import { ComponentTestResult } from './componentTester';
import { PerformanceTestResult } from './performanceTester';
import { SidebarTestResult } from './sidebarTester';

// Type definitions for test results
type TestResult = PerformanceTestResult | SidebarTestResult | ComponentTestResult;

interface DetailedResult {
  category: string;
  count: number;
  results: Array<{
    name: string;
    score: number;
    passed: boolean;
    duration?: number;
    renderTime?: number;
    errors?: string[];
    warnings?: string[];
    testName: string;
    metrics?: {
      memoryUsage?: number;
    };
    memoryUsage?: number;
  }>;
}

interface RenderTimeResult {
  name: string;
  time: number;
}

export interface TestReport {
  id: string;
  timestamp: number;
  testSuite: string;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    passRate: number;
    averageScore: number;
    totalDuration: number;
    totalErrors: number;
    totalWarnings: number;
  };
  performance: {
    averageRenderTime: number;
    totalMemoryUsage: number;
    slowestTest: string;
    fastestTest: string;
    memoryLeaks: number;
    optimizationOpportunities: string[];
  };
  accessibility: {
    wcagCompliance: number;
    keyboardNavigation: number;
    screenReaderCompatibility: number;
    touchTargets: number;
    issues: string[];
  };
  recommendations: {
    critical: string[];
    high: string[];
    medium: string[];
    low: string[];
  };
  detailedResults: DetailedResult[];
  metadata: {
    userAgent: string;
    viewport: string;
    environment: string;
    version: string;
  };
}

export class ReportGenerator {
  private static instance: ReportGenerator | null = null;
  private reports: TestReport[] = [];

  static getInstance(): ReportGenerator {
    if (ReportGenerator.instance === null) {
      ReportGenerator.instance = new ReportGenerator();
    }
    return ReportGenerator.instance;
  }

  // Generate comprehensive report from all test results
  generateComprehensiveReport(
    performanceResults: PerformanceTestResult[],
    sidebarResults: SidebarTestResult[],
    componentResults: ComponentTestResult[]
  ): TestReport {
    const timestamp = Date.now();
    const id = `report_${timestamp}`;

    const allResults = [...performanceResults, ...sidebarResults, ...componentResults];

    const report: TestReport = {
      id,
      timestamp,
      testSuite: 'Comprehensive UI Testing Suite',
      summary: this.generateSummary(allResults),
      performance: this.generatePerformanceAnalysis(allResults),
      accessibility: this.generateAccessibilityAnalysis(sidebarResults, componentResults),
      recommendations: this.generateRecommendations(allResults),
      detailedResults: this.formatDetailedResults(
        performanceResults,
        sidebarResults,
        componentResults
      ),
      metadata: this.generateMetadata(),
    };

    this.reports.push(report);
    return report;
  }

  // Generate summary statistics
  private generateSummary(allResults: TestResult[]): TestReport['summary'] {
    const totalTests = allResults.length;
    const passed = allResults.filter(r => (r as any).passed || r.score >= 70).length;
    const failed = totalTests - passed;
    const passRate = totalTests > 0 ? (passed / totalTests) * 100 : 0;
    const averageScore =
      totalTests > 0 ? allResults.reduce((sum, r) => sum + r.score, 0) / totalTests : 0;

    const totalDuration = allResults.reduce((sum, r) => {
      if ('duration' in r) return sum + r.duration;
      if ('renderTime' in r) return sum + r.renderTime;
      return sum;
    }, 0);

    const totalErrors = allResults.reduce((sum, r) => {
      if ('errors' in r) return sum + r.errors.length;
      return sum;
    }, 0);

    const totalWarnings = allResults.reduce((sum, r) => {
      if ('warnings' in r) return sum + r.warnings.length;
      return sum;
    }, 0);

    return {
      totalTests,
      passed,
      failed,
      passRate,
      averageScore,
      totalDuration,
      totalErrors,
      totalWarnings,
    };
  }

  // Generate performance analysis
  private generatePerformanceAnalysis(allResults: TestResult[]): TestReport['performance'] {
    const renderTimes: RenderTimeResult[] = allResults
      .map(r => {
        if ('duration' in r) return { name: (r as any).testName, time: r.duration };
        if ('renderTime' in r) return { name: (r as any).testName, time: r.renderTime };
        return { name: (r as any).testName, time: 0 };
      })
      .filter(r => r.time > 0);

    const averageRenderTime =
      renderTimes.length > 0
        ? renderTimes.reduce((sum, r) => sum + r.time, 0) / renderTimes.length
        : 0;

    const slowestTest =
      renderTimes.length > 0
        ? renderTimes.reduce((prev, curr) => (prev.time > curr.time ? prev : curr)).name
        : 'N/A';

    const fastestTest =
      renderTimes.length > 0
        ? renderTimes.reduce((prev, curr) => (prev.time < curr.time ? prev : curr)).name
        : 'N/A';

    const totalMemoryUsage = allResults.reduce((sum, r) => {
      if ('metrics' in r && r.metrics.memoryUsage) return sum + r.metrics.memoryUsage;
      if ('memoryUsage' in r) return sum + r.memoryUsage;
      return sum;
    }, 0);

    const memoryLeaks = allResults.filter(r => {
      if ('metrics' in r && r.metrics.memoryUsage) return r.metrics.memoryUsage > 1024 * 1024; // 1MB
      if ('memoryUsage' in r) return r.memoryUsage > 1024 * 1024;
      return false;
    }).length;

    const optimizationOpportunities = this.identifyOptimizationOpportunities(allResults);

    return {
      averageRenderTime,
      totalMemoryUsage,
      slowestTest,
      fastestTest,
      memoryLeaks,
      optimizationOpportunities,
    };
  }

  // Generate accessibility analysis
  private generateAccessibilityAnalysis(
    sidebarResults: SidebarTestResult[],
    componentResults: ComponentTestResult[]
  ): TestReport['accessibility'] {
    const accessibilityTests = [
      ...sidebarResults.filter(r => r.testName.includes('Accessibility')),
      ...componentResults.filter(
        r => r.testName.includes('accessibility') || r.testName.includes('Accessibility')
      ),
    ];

    const wcagCompliance =
      accessibilityTests.length > 0
        ? accessibilityTests.reduce((sum, r) => sum + r.score, 0) / accessibilityTests.length
        : 0;

    const keyboardNavigation =
      sidebarResults
        .filter(r => r.testName.includes('Accessibility'))
        .reduce((sum, r) => sum + r.score, 0) /
      Math.max(1, sidebarResults.filter(r => r.testName.includes('Accessibility')).length);

    const screenReaderCompatibility =
      (accessibilityTests.filter(r => r.score >= 90).length /
        Math.max(1, accessibilityTests.length)) *
      100;

    const touchTargets =
      sidebarResults
        .filter(r => r.testName.includes('Mobile'))
        .reduce((sum, r) => sum + r.score, 0) /
      Math.max(1, sidebarResults.filter(r => r.testName.includes('Mobile')).length);

    const issues: string[] = [];
    [...sidebarResults, ...componentResults].forEach(r => {
      if ('errors' in r) {
        r.errors.forEach(error => {
          if (
            error.toLowerCase().includes('accessibility') ||
            error.toLowerCase().includes('aria') ||
            error.toLowerCase().includes('keyboard')
          ) {
            issues.push(`${r.testName}: ${error}`);
          }
        });
      }
    });

    return {
      wcagCompliance,
      keyboardNavigation,
      screenReaderCompatibility,
      touchTargets,
      issues,
    };
  }

  // Generate recommendations
  private generateRecommendations(allResults: TestResult[]): TestReport['recommendations'] {
    const critical: string[] = [];
    const high: string[] = [];
    const medium: string[] = [];
    const low: string[] = [];

    allResults.forEach(result => {
      // Critical issues (score < 50)
      if (result.score < 50) {
        critical.push(`${result.testName}: Critical performance issue (Score: ${result.score})`);
      }

      // High priority issues (score < 70)
      if (result.score >= 50 && result.score < 70) {
        high.push(`${result.testName}: Performance optimization needed (Score: ${result.score})`);
      }

      // Medium priority issues (score < 90)
      if (result.score >= 70 && result.score < 90) {
        medium.push(`${result.testName}: Minor optimization opportunity (Score: ${result.score})`);
      }

      // Low priority (score >= 90 but has warnings)
      if (result.score >= 90 && 'warnings' in result && result.warnings.length > 0) {
        low.push(`${result.testName}: ${result.warnings.length} warning(s) to review`);
      }

      // Add specific recommendations based on test type
      if ('errors' in result && result.errors.length > 0) {
        result.errors.forEach((error: string) => {
          if (error.includes('slow') || error.includes('Slow')) {
            high.push(`${result.testName}: ${error}`);
          } else {
            medium.push(`${result.testName}: ${error}`);
          }
        });
      }

      // Performance-specific recommendations
      if ('renderTime' in result && result.renderTime > 1000) {
        critical.push(
          `${result.testName}: Render time exceeds 1 second (${result.renderTime.toFixed(2)}ms)`
        );
      }

      if ('memoryUsage' in result && result.memoryUsage > 5 * 1024 * 1024) {
        critical.push(
          `${result.testName}: High memory usage detected (${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB)`
        );
      }
    });

    return { critical, high, medium, low };
  }

  // Identify optimization opportunities
  private identifyOptimizationOpportunities(allResults: TestResult[]): string[] {
    const opportunities: string[] = [];

    // Analyze render performance
    const slowRenders = allResults.filter(r => {
      if ('duration' in r) return r.duration > 500;
      if ('renderTime' in r) return r.renderTime > 500;
      return false;
    });

    if (slowRenders.length > 0) {
      opportunities.push(
        `${slowRenders.length} components have slow render times - consider memoization`
      );
    }

    // Analyze memory usage
    const highMemoryUsage = allResults.filter(r => {
      if ('metrics' in r && r.metrics.memoryUsage) return r.metrics.memoryUsage > 2 * 1024 * 1024;
      if ('memoryUsage' in r) return r.memoryUsage > 2 * 1024 * 1024;
      return false;
    });

    if (highMemoryUsage.length > 0) {
      opportunities.push(
        `${highMemoryUsage.length} components have high memory usage - investigate memory leaks`
      );
    }

    // Analyze error patterns
    const errorPatterns = new Map<string, number>();
    allResults.forEach(r => {
      if ('errors' in r) {
        r.errors.forEach((error: string) => {
          const pattern = error.split(':')[0]; // Get error type
          errorPatterns.set(pattern, (errorPatterns.get(pattern) || 0) + 1);
        });
      }
    });

    errorPatterns.forEach((count, pattern) => {
      if (count >= 3) {
        opportunities.push(`Common error pattern detected: "${pattern}" (${count} occurrences)`);
      }
    });

    // Analyze accessibility issues
    const accessibilityIssues = allResults.filter(r => {
      if ('errors' in r) {
        return r.errors.some(
          (error: string) =>
            error.toLowerCase().includes('accessibility') ||
            error.toLowerCase().includes('aria') ||
            error.toLowerCase().includes('keyboard')
        );
      }
      return false;
    });

    if (accessibilityIssues.length > 0) {
      opportunities.push(
        `${accessibilityIssues.length} accessibility improvements needed for WCAG compliance`
      );
    }

    return opportunities;
  }

  // Format detailed results
  private formatDetailedResults(
    performanceResults: PerformanceTestResult[],
    sidebarResults: SidebarTestResult[],
    componentResults: ComponentTestResult[]
  ): DetailedResult[] {
    return [
      {
        category: 'Performance Tests',
        count: performanceResults.length,
        results: performanceResults.map(r => ({
          name: (r as any).testName,
          score: r.score,
          passed: r.score >= 70,
          renderTime: r.renderTime,
          rerenderCount: r.rerenderCount,
          memoryUsage: r.memoryUsage,
          recommendations: r.recommendations,
          testName: (r as any).testName,
        })),
      },
      {
        category: 'Sidebar Tests',
        count: sidebarResults.length,
        results: sidebarResults.map(r => ({
          name: (r as any).testName,
          score: r.score,
          passed: r.score >= 70,
          duration: r.duration,
          errors: r.errors,
          warnings: r.warnings,
          metrics: r.metrics,
          testName: (r as any).testName,
        })),
      },
      {
        category: 'Component Tests',
        count: componentResults.length,
        results: componentResults.map(r => ({
          name: (r as any).testName,
          componentType: r.componentType,
          score: r.score,
          passed: r.score >= 70,
          duration: r.duration,
          errors: r.errors,
          warnings: r.warnings,
          metrics: r.metrics,
          testName: (r as any).testName,
        })),
      },
    ];
  }

  // Generate metadata
  private generateMetadata(): TestReport['metadata'] {
    return {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      viewport:
        typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Unknown',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  }

  // Export report as JSON
  exportReportAsJSON(report: TestReport): string {
    return JSON.stringify(report, null, 2);
  }

  // Export report as CSV
  exportReportAsCSV(report: TestReport): string {
    const headers = [
      'Test Name',
      'Category',
      'Score',
      'Duration (ms)',
      'Errors',
      'Warnings',
      'Status',
    ];

    const rows: string[][] = [headers];

    report.detailedResults.forEach(category => {
      category.results.forEach((result) => {
        rows.push([
          result.name || 'N/A',
          category.category,
          result.score?.toString() ?? 'N/A',
          (result.duration ?? result.renderTime)?.toString() ?? 'N/A',
          result.errors?.length?.toString() ?? '0',
          result.warnings?.length?.toString() ?? '0',
          result.score >= 70 ? 'PASS' : 'FAIL',
        ]);
      });
    });

    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  // Generate HTML report
  generateHTMLReport(report: TestReport): string {
    const timestamp = new Date(report.timestamp).toLocaleString();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PosalPro MVP2 - Test Report ${report.id}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
        .metric-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .recommendations { background: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
        .critical { background: #fef2f2; border-left: 4px solid #ef4444; }
        .high { background: #fef3c7; border-left: 4px solid #f59e0b; }
        .medium { background: #f0f9ff; border-left: 4px solid #3b82f6; }
        .low { background: #f0fdf4; border-left: 4px solid #10b981; }
        .test-result { background: #f9fafb; padding: 10px; margin: 10px 0; border-radius: 4px; }
        .score { font-weight: bold; padding: 4px 8px; border-radius: 4px; color: white; }
        .score-good { background: #10b981; }
        .score-fair { background: #f59e0b; }
        .score-poor { background: #ef4444; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PosalPro MVP2 - Comprehensive Test Report</h1>
            <p>Generated: ${timestamp}</p>
            <p>Report ID: ${report.id}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value">${report.summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.passRate.toFixed(1)}%</div>
                <div class="metric-label">Pass Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.averageScore.toFixed(1)}</div>
                <div class="metric-label">Average Score</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.performance.averageRenderTime.toFixed(1)}ms</div>
                <div class="metric-label">Avg Render Time</div>
            </div>
            <div class="metric">
                <div class="metric-value">${(report.performance.totalMemoryUsage / 1024 / 1024).toFixed(1)}MB</div>
                <div class="metric-label">Total Memory</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.accessibility.wcagCompliance.toFixed(1)}%</div>
                <div class="metric-label">WCAG Compliance</div>
            </div>
        </div>

        <div class="section">
            <h2>🚨 Critical Recommendations</h2>
            ${report.recommendations.critical.map(rec => `<div class="recommendations critical">${rec}</div>`).join('')}
            ${report.recommendations.critical.length === 0 ? '<p>No critical issues found.</p>' : ''}
        </div>

        <div class="section">
            <h2>⚠️ High Priority Recommendations</h2>
            ${report.recommendations.high.map(rec => `<div class="recommendations high">${rec}</div>`).join('')}
            ${report.recommendations.high.length === 0 ? '<p>No high priority issues found.</p>' : ''}
        </div>

        <div class="section">
            <h2>📊 Performance Analysis</h2>
            <p><strong>Slowest Test:</strong> ${report.performance.slowestTest}</p>
            <p><strong>Fastest Test:</strong> ${report.performance.fastestTest}</p>
            <p><strong>Memory Leaks Detected:</strong> ${report.performance.memoryLeaks}</p>
            <h3>Optimization Opportunities:</h3>
            <ul>
                ${report.performance.optimizationOpportunities.map(opp => `<li>${opp}</li>`).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>♿ Accessibility Analysis</h2>
            <p><strong>WCAG Compliance:</strong> ${report.accessibility.wcagCompliance.toFixed(1)}%</p>
            <p><strong>Keyboard Navigation:</strong> ${report.accessibility.keyboardNavigation.toFixed(1)}%</p>
            <p><strong>Screen Reader Compatibility:</strong> ${report.accessibility.screenReaderCompatibility.toFixed(1)}%</p>
            <p><strong>Touch Targets:</strong> ${report.accessibility.touchTargets.toFixed(1)}%</p>
            ${
              report.accessibility.issues.length > 0
                ? `
                <h3>Issues Found:</h3>
                <ul>
                    ${report.accessibility.issues.map(issue => `<li>${issue}</li>`).join('')}
                </ul>
            `
                : '<p>No accessibility issues found.</p>'
            }
        </div>

        <div class="section">
            <h2>📋 Detailed Test Results</h2>
            ${report.detailedResults
              .map(
                category => `
                <h3>${category.category} (${(category as any).count} tests)</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Test Name</th>
                            <th>Score</th>
                            <th>Duration</th>
                            <th>Issues</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${category.results
                          .map(
                            (result) => `
                            <tr>
                                <td>${result.name}</td>
                                <td>
                                    <span class="score ${result.score >= 90 ? 'score-good' : result.score >= 70 ? 'score-fair' : 'score-poor'}">
                                        ${result.score?.toFixed(1) || 'N/A'}
                                    </span>
                                </td>
                                <td>${(result.duration || result.renderTime)?.toFixed(1) || 'N/A'}ms</td>
                                <td>${(result.errors?.length || 0) + (result.warnings?.length || 0)} issues</td>
                            </tr>
                        `
                          )
                          .join('')}
                    </tbody>
                </table>
            `
              )
              .join('')}
        </div>

        <div class="section">
            <h2>🔧 System Information</h2>
            <p><strong>Environment:</strong> ${report.metadata.environment}</p>
            <p><strong>Viewport:</strong> ${report.metadata.viewport}</p>
            <p><strong>User Agent:</strong> ${report.metadata.userAgent}</p>
            <p><strong>Version:</strong> ${report.metadata.version}</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Get all reports
  getAllReports(): TestReport[] {
    return this.reports;
  }

  // Get report by ID
  getReportById(id: string): TestReport | undefined {
    return this.reports.find(r => r.id === id);
  }

  // Clear all reports
  clearReports(): void {
    this.reports = [];
  }

  // Save report to localStorage (browser only)
  saveReportToStorage(report: TestReport): void {
    if (typeof window !== 'undefined') {
      try {
        const existingReports = JSON.parse(localStorage.getItem('posalpro_test_reports') || '[]');
        existingReports.push(report);
        // Keep only last 10 reports
        const recentReports = existingReports.slice(-10);
        localStorage.setItem('posalpro_test_reports', JSON.stringify(recentReports));
      } catch (error) {
        ErrorHandlingService.getInstance().processError(
          error,
          'Failed to save report to localStorage',
          ErrorCodes.SYSTEM.INTERNAL_ERROR,
          {
            component: 'ReportGenerator',
            operation: 'saveReportToStorage',
            reportId: report.id,
          }
        );
      }
    }
  }

  // Load reports from localStorage (browser only)
  loadReportsFromStorage(): TestReport[] {
    if (typeof window !== 'undefined') {
      try {
        const reports = JSON.parse(localStorage.getItem('posalpro_test_reports') || '[]');
        this.reports = reports;
        return reports;
      } catch (error) {
        ErrorHandlingService.getInstance().processError(
          error,
          'Failed to load reports from localStorage',
          ErrorCodes.SYSTEM.INTERNAL_ERROR,
          {
            component: 'ReportGenerator',
            operation: 'loadReportsFromStorage',
          }
        );
      }
    }
    return [];
  }
}

// Singleton instance
export const reportGenerator = ReportGenerator.getInstance();
