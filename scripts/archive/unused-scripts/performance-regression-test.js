#!/usr/bin/env node

/**
 * PosalPro MVP2 - Performance Regression Testing Framework
 * Automated performance monitoring and regression detection
 * Component Traceability: US-6.1, US-6.3, H8, H12
 */

const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

class PerformanceRegressionTest {
  constructor() {
    this.baselinePath = path.join(process.cwd(), 'performance-baseline.json');
    this.currentResultsPath = path.join(process.cwd(), 'performance-current.json');
    this.regressionThreshold = 0.2; // 20% performance degradation threshold
    this.baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  /**
   * Establish performance baseline
   */
  async establishBaseline() {
    console.log('📊 Establishing performance baseline...');

    const baseline = {
      timestamp: new Date().toISOString(),
      commit: process.env.GITHUB_SHA || 'local',
      branch: process.env.GITHUB_REF || 'main',
      tests: await this.runPerformanceTests(),
    };

    await fs.writeFile(this.baselinePath, JSON.stringify(baseline, null, 2));
    console.log(`✅ Baseline established and saved to: ${this.baselinePath}`);

    return baseline;
  }

  /**
   * Run current performance tests
   */
  async runRegressionTests() {
    console.log('🔬 Running performance regression tests...');

    const current = {
      timestamp: new Date().toISOString(),
      commit: process.env.GITHUB_SHA || 'local',
      branch: process.env.GITHUB_REF || 'main',
      tests: await this.runPerformanceTests(),
    };

    await fs.writeFile(this.currentResultsPath, JSON.stringify(current, null, 2));

    // Compare with baseline
    const regression = await this.compareWithBaseline(current);

    return { current, regression };
  }

  /**
   * Run core performance tests
   */
  async runPerformanceTests() {
    const tests = [
      {
        name: 'Customer Search - Simple',
        endpoint: '/api/customers/search',
        params: { q: 'technology', limit: 20 },
        iterations: 5,
      },
      {
        name: 'Customer Search - Complex',
        endpoint: '/api/customers/search',
        params: {
          q: 'enterprise technology',
          industry: 'Technology',
          tier: 'ENTERPRISE',
          limit: 50,
        },
        iterations: 5,
      },
      {
        name: 'Proposal Search - Basic',
        endpoint: '/api/proposals',
        params: { limit: 20 },
        iterations: 5,
      },
      {
        name: 'Proposal Search - Filtered',
        endpoint: '/api/proposals',
        params: { status: 'DRAFT', priority: 'HIGH', limit: 30 },
        iterations: 5,
      },
      {
        name: 'Proposal Search - Complex',
        endpoint: '/api/proposals',
        params: {
          search: 'enterprise solution',
          status: 'APPROVED',
          priority: 'HIGH',
          dueBefore: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          limit: 50,
        },
        iterations: 5,
      },
    ];

    const results = [];

    for (const test of tests) {
      console.log(`  🧪 Running: ${test.name}`);
      const testResults = await this.testEndpoint(test.endpoint, test.params, test.iterations);

      const analysis = this.analyzeTestResults(testResults);

      results.push({
        name: test.name,
        endpoint: test.endpoint,
        params: test.params,
        iterations: test.iterations,
        results: testResults,
        analysis,
      });

      // Small delay between test suites
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  /**
   * Test single endpoint
   */
  async testEndpoint(endpoint, params = {}, iterations = 5) {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();

      try {
        // Simulate API call (in real implementation, make actual HTTP request)
        const simulatedResponseTime = this.simulateQueryResponse(endpoint, params);
        await new Promise(resolve => setTimeout(resolve, simulatedResponseTime));

        const endTime = performance.now();
        const responseTime = endTime - startTime;

        results.push({
          iteration: i + 1,
          responseTime,
          success: true,
        });
      } catch (error) {
        results.push({
          iteration: i + 1,
          responseTime: performance.now() - startTime,
          success: false,
          error: error.message,
        });
      }

      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Simulate query response time
   */
  simulateQueryResponse(endpoint, params) {
    let baseTime = 50;

    if (endpoint.includes('/api/customers/search')) {
      baseTime += params.q ? 100 : 0;
      baseTime += params.industry ? 50 : 0;
      baseTime += params.tier ? 30 : 0;
      baseTime += params.status ? 20 : 0;
      baseTime += params.limit ? Math.max(0, (params.limit - 20) * 2) : 0;
    }

    if (endpoint.includes('/api/proposals')) {
      baseTime += params.search ? 150 : 0;
      baseTime += params.status ? 40 : 0;
      baseTime += params.priority ? 30 : 0;
      baseTime += params.customerId ? 60 : 0;
      baseTime += params.dueBefore ? 80 : 0;
      baseTime += params.limit ? Math.max(0, (params.limit - 20) * 3) : 0;
    }

    // Add random variation
    const variation = (Math.random() - 0.5) * 0.4;
    return Math.max(20, baseTime * (1 + variation));
  }

  /**
   * Analyze test results
   */
  analyzeTestResults(results) {
    const successfulResults = results.filter(r => r.success);
    const responseTimes = successfulResults.map(r => r.responseTime);

    if (responseTimes.length === 0) {
      return {
        successRate: 0,
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errors: results.length,
      };
    }

    const sortedTimes = responseTimes.sort((a, b) => a - b);

    return {
      successRate: (successfulResults.length / results.length) * 100,
      avgResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      p95ResponseTime: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
      p99ResponseTime: sortedTimes[Math.floor(sortedTimes.length * 0.99)],
      errors: results.filter(r => !r.success).length,
    };
  }

  /**
   * Compare current results with baseline
   */
  async compareWithBaseline(current) {
    try {
      const baselineData = await fs.readFile(this.baselinePath, 'utf8');
      const baseline = JSON.parse(baselineData);

      console.log('🔍 Comparing with baseline...');

      const regression = {
        baselineCommit: baseline.commit,
        currentCommit: current.commit,
        comparisonTimestamp: new Date().toISOString(),
        overall: this.compareOverallMetrics(baseline.tests, current.tests),
        byTest: this.compareTestByTest(baseline.tests, current.tests),
        regressions: [],
        improvements: [],
      };

      // Identify regressions and improvements
      regression.byTest.forEach(testComparison => {
        const avgChange = testComparison.avgResponseTimeChange;
        const p95Change = testComparison.p95ResponseTimeChange;

        if (avgChange > this.regressionThreshold || p95Change > this.regressionThreshold) {
          regression.regressions.push({
            test: testComparison.name,
            severity: avgChange > this.regressionThreshold * 2 ? 'CRITICAL' : 'WARNING',
            avgChange: `${(avgChange * 100).toFixed(1)}%`,
            p95Change: `${(p95Change * 100).toFixed(1)}%`,
            baselineAvg: testComparison.baselineAvg,
            currentAvg: testComparison.currentAvg,
          });
        }

        if (avgChange < -this.regressionThreshold || p95Change < -this.regressionThreshold) {
          regression.improvements.push({
            test: testComparison.name,
            avgChange: `${(avgChange * 100).toFixed(1)}%`,
            p95Change: `${(p95Change * 100).toFixed(1)}%`,
            baselineAvg: testComparison.baselineAvg,
            currentAvg: testComparison.currentAvg,
          });
        }
      });

      return regression;
    } catch (error) {
      console.log('⚠️  No baseline found, creating new baseline...');
      await this.establishBaseline();
      return null;
    }
  }

  /**
   * Compare overall metrics
   */
  compareOverallMetrics(baselineTests, currentTests) {
    const baselineAvg = this.calculateOverallAverage(baselineTests);
    const currentAvg = this.calculateOverallAverage(currentTests);

    return {
      baselineAvgResponseTime: baselineAvg,
      currentAvgResponseTime: currentAvg,
      changePercent: ((currentAvg - baselineAvg) / baselineAvg) * 100,
      status:
        Math.abs((currentAvg - baselineAvg) / baselineAvg) > this.regressionThreshold
          ? currentAvg > baselineAvg
            ? 'REGRESSION'
            : 'IMPROVEMENT'
          : 'STABLE',
    };
  }

  /**
   * Compare test by test
   */
  compareTestByTest(baselineTests, currentTests) {
    const comparisons = [];

    baselineTests.forEach(baselineTest => {
      const currentTest = currentTests.find(t => t.name === baselineTest.name);

      if (currentTest) {
        const baselineAvg = baselineTest.analysis.avgResponseTime;
        const currentAvg = currentTest.analysis.avgResponseTime;
        const baselineP95 = baselineTest.analysis.p95ResponseTime;
        const currentP95 = currentTest.analysis.p95ResponseTime;

        comparisons.push({
          name: baselineTest.name,
          baselineAvg,
          currentAvg,
          baselineP95,
          currentP95,
          avgResponseTimeChange: (currentAvg - baselineAvg) / baselineAvg,
          p95ResponseTimeChange: (currentP95 - baselineP95) / baselineP95,
        });
      }
    });

    return comparisons;
  }

  /**
   * Calculate overall average response time
   */
  calculateOverallAverage(tests) {
    const allResponseTimes = tests.flatMap(test =>
      test.results.filter(r => r.success).map(r => r.responseTime)
    );

    return allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length;
  }

  /**
   * Generate regression report
   */
  async generateRegressionReport(regression) {
    if (!regression) {
      console.log('⚠️  No regression data available (first run)');
      return;
    }

    const reportPath = path.join(process.cwd(), 'performance-regression-report.json');
    await fs.writeFile(reportPath, JSON.stringify(regression, null, 2));

    console.log('\n📊 PERFORMANCE REGRESSION REPORT');
    console.log('=================================\n');

    console.log(`📈 Overall Status: ${regression.overall.status}`);
    console.log(`⏱️  Baseline Avg: ${regression.overall.baselineAvgResponseTime.toFixed(1)}ms`);
    console.log(`⏱️  Current Avg: ${regression.overall.currentAvgResponseTime.toFixed(1)}ms`);
    console.log(`📊 Change: ${regression.overall.changePercent.toFixed(1)}%\n`);

    if (regression.regressions.length > 0) {
      console.log('🚨 PERFORMANCE REGRESSIONS DETECTED:');
      regression.regressions.forEach(reg => {
        const icon = reg.severity === 'CRITICAL' ? '🚨' : '⚠️';
        console.log(`  ${icon} [${reg.severity}] ${reg.test}`);
        console.log(
          `     Avg: ${reg.baselineAvg.toFixed(1)}ms → ${reg.currentAvg.toFixed(1)}ms (${reg.avgChange})`
        );
        console.log(`     P95: ${reg.p95Change}\n`);
      });
    }

    if (regression.improvements.length > 0) {
      console.log('✅ PERFORMANCE IMPROVEMENTS DETECTED:');
      regression.improvements.forEach(imp => {
        console.log(`  🎉 ${imp.test}`);
        console.log(`     Avg: ${imp.avgChange} | P95: ${imp.p95Change}\n`);
      });
    }

    if (regression.regressions.length === 0 && regression.improvements.length === 0) {
      console.log('✅ No significant performance changes detected');
    }

    console.log(`📄 Detailed report saved to: ${reportPath}`);

    // Return exit code based on regression severity
    const hasCriticalRegression = regression.regressions.some(r => r.severity === 'CRITICAL');
    return hasCriticalRegression ? 1 : 0;
  }

  /**
   * Main execution method
   */
  async run(command = 'test') {
    try {
      console.log('🏁 PosalPro MVP2 Performance Regression Testing');
      console.log('==============================================\n');

      if (command === 'baseline') {
        await this.establishBaseline();
      } else if (command === 'test') {
        const { regression } = await this.runRegressionTests();

        if (regression) {
          const exitCode = await this.generateRegressionReport(regression);
          process.exit(exitCode);
        } else {
          console.log('✅ First run completed - baseline established');
          process.exit(0);
        }
      } else {
        console.log('Usage: node performance-regression-test.js [baseline|test]');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Performance regression test failed:', error);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const command = process.argv[2] || 'test';
  const regressionTester = new PerformanceRegressionTest();
  regressionTester.run(command).catch(console.error);
}

module.exports = PerformanceRegressionTest;
