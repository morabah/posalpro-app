#!/usr/bin/env node

/**
 * PosalPro MVP2 - Comprehensive Performance Test
 * Measures performance violations and generates detailed reports
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class PerformanceTestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      violations: [],
      metrics: {},
      recommendations: [],
      score: 0,
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m',
    };
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${colors[type]}[${timestamp}] [${type.toUpperCase()}] ${message}${colors.reset}`);
  }

  async initBrowser() {
    this.log('Initializing browser for performance testing...', 'info');

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--enable-precise-memory-info',
      ],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1366, height: 768 });

    // Inject performance monitoring
    await this.page.evaluateOnNewDocument(() => {
      window.performanceViolations = [];
      window.performanceMetrics = {
        loadTime: 0,
        memoryUsage: 0,
        violationCount: 0,
      };

      // Override console.warn to capture violations
      const originalWarn = console.warn;
      console.warn = function (...args) {
        const message = args.join(' ');

        if (message.includes('[Violation]')) {
          const violation = {
            message: message,
            timestamp: Date.now(),
            type: 'unknown',
            duration: 0,
          };

          // Parse violation type and duration
          if (message.includes("'message' handler took")) {
            violation.type = 'messageHandler';
          } else if (message.includes('Forced reflow')) {
            violation.type = 'forcedReflow';
          } else if (message.includes("'click' handler took")) {
            violation.type = 'clickHandler';
          } else if (message.includes("'setInterval' handler took")) {
            violation.type = 'setIntervalHandler';
          }

          const match = message.match(/(\d+)ms/);
          if (match) {
            violation.duration = parseInt(match[1]);
          }

          window.performanceViolations.push(violation);
          window.performanceMetrics.violationCount++;
        }

        originalWarn.apply(console, args);
      };
    });
  }

  async testPage(url, pageName) {
    this.log(`Testing ${pageName} performance...`, 'info');

    const startTime = Date.now();

    try {
      await this.page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      const loadTime = Date.now() - startTime;

      // Wait for any async operations and violations to be captured
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Get performance data
      const pageData = await this.page.evaluate(() => {
        return {
          violations: window.performanceViolations || [],
          metrics: window.performanceMetrics || {},
          memory: performance.memory
            ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
              }
            : null,
        };
      });

      pageData.metrics.loadTime = loadTime;

      this.results.violations = this.results.violations.concat(pageData.violations);
      this.results.metrics[pageName] = pageData.metrics;

      this.log(
        `${pageName}: ${pageData.violations.length} violations, ${loadTime}ms load time`,
        pageData.violations.length > 0 ? 'warning' : 'success'
      );

      return pageData;
    } catch (error) {
      this.log(`Failed to test ${pageName}: ${error.message}`, 'error');
      return { error: error.message };
    }
  }

  generateReport() {
    const totalViolations = this.results.violations.length;
    const violationTypes = this.results.violations.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, {});

    const avgDuration =
      this.results.violations.length > 0
        ? this.results.violations.reduce((sum, v) => sum + v.duration, 0) /
          this.results.violations.length
        : 0;

    // Calculate performance score
    let score = 100;
    score -= totalViolations * 2; // -2 points per violation
    score -= Math.max(0, (avgDuration - 50) * 0.5); // Additional penalty for slow violations
    score = Math.max(0, score);

    this.results.score = score;

    // Generate recommendations
    const recommendations = [];

    if (violationTypes.messageHandler > 5) {
      recommendations.push(
        'CRITICAL: Optimize analytics batching - too many message handler violations'
      );
    }

    if (violationTypes.forcedReflow > 3) {
      recommendations.push('HIGH: Implement DOM batching to prevent forced reflows');
    }

    if (violationTypes.setIntervalHandler > 3) {
      recommendations.push('MEDIUM: Reduce setInterval frequency or use requestIdleCallback');
    }

    if (avgDuration > 100) {
      recommendations.push(
        'HIGH: Average violation duration is too high - optimize heavy operations'
      );
    }

    this.results.recommendations = recommendations;

    return {
      summary: {
        totalViolations,
        violationTypes,
        avgDuration: avgDuration.toFixed(1),
        performanceScore: score.toFixed(1),
      },
      details: this.results,
      recommendations,
    };
  }

  async run() {
    try {
      this.log('🚀 Starting Comprehensive Performance Test', 'info');

      // Check if server is running
      try {
        const response = await fetch('http://localhost:3000/api/health');
        if (!response.ok) {
          throw new Error('Server not responding');
        }
      } catch (error) {
        throw new Error('Server is not running on port 3000. Please start with npm run dev:smart');
      }

      await this.initBrowser();

      // Test key pages
      const pages = [
        { url: 'http://localhost:3000/dashboard', name: 'Dashboard' },
        { url: 'http://localhost:3000/proposals', name: 'Proposals' },
        { url: 'http://localhost:3000/customers', name: 'Customers' },
        { url: 'http://localhost:3000/products', name: 'Products' },
        { url: 'http://localhost:3000/analytics', name: 'Analytics' },
      ];

      for (const page of pages) {
        await this.testPage(page.url, page.name);
      }

      const report = this.generateReport();

      // Save detailed report
      const reportPath = path.join(process.cwd(), `performance-test-report-${Date.now()}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      // Display summary
      this.log('\n📊 PERFORMANCE TEST RESULTS:', 'info');
      this.log(
        `Performance Score: ${report.summary.performanceScore}/100`,
        parseFloat(report.summary.performanceScore) >= 80 ? 'success' : 'warning'
      );
      this.log(
        `Total Violations: ${report.summary.totalViolations}`,
        report.summary.totalViolations === 0 ? 'success' : 'warning'
      );
      this.log(
        `Average Duration: ${report.summary.avgDuration}ms`,
        parseFloat(report.summary.avgDuration) < 50 ? 'success' : 'warning'
      );

      if (report.recommendations.length > 0) {
        this.log('\n🔧 RECOMMENDATIONS:', 'warning');
        report.recommendations.forEach(rec => this.log(`  • ${rec}`, 'warning'));
      }

      this.log(`\n📄 Detailed report saved: ${reportPath}`, 'info');

      await this.cleanup();

      return report;
    } catch (error) {
      this.log(`Performance test failed: ${error.message}`, 'error');
      await this.cleanup();
      throw error;
    }
  }

  async cleanup() {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run the test
async function main() {
  const runner = new PerformanceTestRunner();

  try {
    await runner.run();
    process.exit(0);
  } catch (error) {
    console.error('Performance test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = PerformanceTestRunner;
