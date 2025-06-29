#!/usr/bin/env node

/**
 * PosalPro MVP2 - Button Response Time Performance Test
 * Measures the time between button clicks and UI updates
 * Identifies performance bottlenecks in user interactions
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ButtonResponseTimeTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      testResults: [],
      summary: {},
      recommendations: [],
    };
  }

  async initialize() {
    console.log('🚀 Initializing Button Response Time Test...\n');

    this.browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      devtools: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1280,720',
      ],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });

    console.log('✅ Browser initialized successfully\n');
  }

  async testButtonResponseTimes() {
    console.log('📊 Testing Button Response Times...\n');

    const buttonTests = [
      {
        page: 'Dashboard',
        url: 'http://localhost:3000/dashboard',
        tests: [
          {
            name: 'View Customers Link',
            selector: 'a[href="/customers"]',
            expectedUrl: '/customers',
            timeout: 5000,
          },
          {
            name: 'View Products Link',
            selector: 'a[href="/products"]',
            expectedUrl: '/products',
            timeout: 5000,
          },
          {
            name: 'Create Proposal Link',
            selector: 'a[href="/proposals/create"]',
            expectedUrl: '/proposals/create',
            timeout: 10000,
          },
        ],
      },
      {
        page: 'Products',
        url: 'http://localhost:3000/products',
        tests: [
          {
            name: 'Page Load Performance',
            isPageLoad: true,
            timeout: 10000,
          },
        ],
      },
      {
        page: 'Customers',
        url: 'http://localhost:3000/customers',
        tests: [
          {
            name: 'Page Load Performance',
            isPageLoad: true,
            timeout: 10000,
          },
        ],
      },
      {
        page: 'Proposals Create',
        url: 'http://localhost:3000/proposals/create',
        tests: [
          {
            name: 'Page Load Performance',
            isPageLoad: true,
            timeout: 15000,
          },
        ],
      },
    ];

    for (const pageTest of buttonTests) {
      await this.testPageButtons(pageTest);
    }

    console.log('✅ Button response time testing completed\n');
  }

  async testPageButtons(pageTest) {
    console.log(`📄 Testing ${pageTest.page} page...`);

    try {
      // Navigate to page and measure load time
      const navigationStart = Date.now();
      await this.page.goto(pageTest.url, { waitUntil: 'networkidle2', timeout: 30000 });
      const navigationTime = Date.now() - navigationStart;

      console.log(`   ⏱️ Page load time: ${navigationTime}ms`);

      // Record page load performance
      const loadStatus =
        navigationTime <= 2000
          ? '🚀 Excellent'
          : navigationTime <= 5000
            ? '✅ Good'
            : navigationTime <= 10000
              ? '⚠️ Acceptable'
              : '❌ Poor';

      this.results.testResults.push({
        page: pageTest.page,
        test: 'Page Load',
        status: loadStatus.split(' ')[1],
        responseTime: navigationTime,
        target: 5000,
      });

      // Wait for page to be fully interactive using the correct method
      await new Promise(resolve => setTimeout(resolve, 2000));

      for (const test of pageTest.tests) {
        if (!test.isPageLoad) {
          await this.testSingleButton(pageTest.page, test);
        }
      }
    } catch (error) {
      console.log(`   ❌ ${pageTest.page} page failed: ${error.message}`);
      this.results.testResults.push({
        page: pageTest.page,
        test: 'Page Load',
        status: 'Failed',
        error: error.message,
        responseTime: null,
      });
    }
  }

  async testSingleButton(pageName, test) {
    console.log(`   🔘 Testing: ${test.name}`);

    try {
      // Find the element
      const element = await this.page.$(test.selector);
      if (!element) {
        console.log(`     ⚠️ Element not found: ${test.selector}`);
        this.results.testResults.push({
          page: pageName,
          test: test.name,
          status: 'Element Not Found',
          responseTime: null,
          selector: test.selector,
        });
        return;
      }

      // Measure button click response time
      const clickStart = Date.now();

      // Perform the action
      if (test.expectedUrl) {
        // Click and wait for navigation
        await Promise.all([
          this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: test.timeout }),
          this.page.click(test.selector),
        ]);
      } else {
        // Just click
        await this.page.click(test.selector);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const responseTime = Date.now() - clickStart;

      // Evaluate response time
      const status =
        responseTime <= 1000
          ? '🚀 Excellent'
          : responseTime <= 2000
            ? '✅ Good'
            : responseTime <= 5000
              ? '⚠️ Acceptable'
              : '❌ Poor';

      console.log(`     ${status}: ${responseTime}ms`);

      this.results.testResults.push({
        page: pageName,
        test: test.name,
        status: status.split(' ')[1],
        responseTime,
        target: test.timeout,
        selector: test.selector,
      });
    } catch (error) {
      console.log(`     ❌ Failed: ${error.message}`);

      this.results.testResults.push({
        page: pageName,
        test: test.name,
        status: 'Failed',
        responseTime: null,
        error: error.message,
        selector: test.selector,
      });
    }
  }

  async generateReport() {
    console.log('📋 Generating Performance Report...\n');

    // Calculate summary statistics
    const successfulTests = this.results.testResults.filter(
      t => t.status === 'Excellent' || t.status === 'Good' || t.status === 'Acceptable'
    );
    const failedTests = this.results.testResults.filter(
      t => t.status === 'Failed' || t.status === 'Element Not Found'
    );

    const avgResponseTime =
      successfulTests.length > 0
        ? successfulTests.reduce((sum, t) => sum + (t.responseTime || 0), 0) /
          successfulTests.length
        : 0;

    this.results.summary = {
      totalTests: this.results.testResults.length,
      successfulTests: successfulTests.length,
      failedTests: failedTests.length,
      successRate: `${((successfulTests.length / this.results.testResults.length) * 100).toFixed(1)}%`,
      averageResponseTime: `${avgResponseTime.toFixed(0)}ms`,
    };

    // Generate recommendations
    this.results.recommendations = this.generateRecommendations();

    // Save report
    const reportPath = path.join(__dirname, '../docs/BUTTON_RESPONSE_PERFORMANCE_REPORT.md');
    const reportContent = this.formatReportAsMarkdown();

    fs.writeFileSync(reportPath, reportContent);
    console.log(`✅ Performance report saved to: ${reportPath}\n`);

    // Display summary
    console.log('📊 BUTTON RESPONSE PERFORMANCE SUMMARY');
    console.log('═══════════════════════════════════════════════');
    console.log(`📝 Total Tests:           ${this.results.summary.totalTests}`);
    console.log(`✅ Successful Tests:      ${this.results.summary.successfulTests}`);
    console.log(`❌ Failed Tests:          ${this.results.summary.failedTests}`);
    console.log(`📈 Success Rate:          ${this.results.summary.successRate}`);
    console.log(`⏱️ Average Response Time: ${this.results.summary.averageResponseTime}`);
    console.log('═══════════════════════════════════════════════');

    // Highlight critical performance issues
    const criticalIssues = this.results.testResults.filter(
      t => t.responseTime && t.responseTime > 10000
    );
    if (criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL PERFORMANCE ISSUES DETECTED:');
      criticalIssues.forEach(issue => {
        console.log(
          `   ❌ ${issue.page} - ${issue.test}: ${issue.responseTime}ms (CRITICAL DELAY)`
        );
      });
      console.log('\n💡 IMMEDIATE ACTIONS REQUIRED:');
      console.log('   1. Optimize database queries (especially product stats)');
      console.log('   2. Implement caching for frequently accessed data');
      console.log('   3. Add loading states to improve perceived performance');
      console.log('   4. Consider server-side rendering optimizations');
    }
  }

  generateRecommendations() {
    const recommendations = [];
    const slowTests = this.results.testResults.filter(t => t.responseTime && t.responseTime > 2000);
    const criticalTests = this.results.testResults.filter(
      t => t.responseTime && t.responseTime > 10000
    );
    const failedTests = this.results.testResults.filter(t => t.status === 'Failed');

    if (criticalTests.length > 0) {
      recommendations.push('🚨 CRITICAL: Fix 10+ second page load times immediately');
      recommendations.push('🔧 Optimize database queries causing extreme delays');
      recommendations.push('💾 Implement aggressive caching strategy');
    }

    if (slowTests.length > 0) {
      recommendations.push('🐌 Optimize slow button responses (>2s) with database indexing');
      recommendations.push('💾 Implement client-side caching for frequently accessed data');
      recommendations.push('⚡ Add loading states and skeleton components for better UX');
    }

    if (failedTests.length > 0) {
      recommendations.push('🔧 Fix failed button interactions and element selectors');
      recommendations.push('🧪 Add automated testing for critical user interactions');
    }

    recommendations.push('📊 Monitor button response times in production');
    recommendations.push('🔄 Implement optimistic UI updates for immediate feedback');
    recommendations.push('🚀 Consider server-side rendering for faster initial loads');

    return recommendations;
  }

  formatReportAsMarkdown() {
    const criticalIssues = this.results.testResults.filter(
      t => t.responseTime && t.responseTime > 10000
    );

    return `# Button Response Performance Report

**Generated:** ${this.results.timestamp}

## 🚨 Critical Performance Alert

${
  criticalIssues.length > 0
    ? `**${criticalIssues.length} CRITICAL PERFORMANCE ISSUES DETECTED**

Pages taking 10+ seconds to load:
${criticalIssues.map(issue => `- **${issue.page}**: ${issue.responseTime}ms`).join('\n')}

**IMMEDIATE ACTION REQUIRED**`
    : 'No critical performance issues detected.'
}

## Summary

- **Total Tests:** ${this.results.summary.totalTests}
- **Successful Tests:** ${this.results.summary.successfulTests}
- **Failed Tests:** ${this.results.summary.failedTests}
- **Success Rate:** ${this.results.summary.successRate}
- **Average Response Time:** ${this.results.summary.averageResponseTime}

## Test Results

| Page | Test | Status | Response Time | Target |
|------|------|--------|---------------|--------|
${this.results.testResults
  .map(
    test =>
      `| ${test.page} | ${test.test} | ${test.status} | ${test.responseTime || 'N/A'}ms | ${test.target || 'N/A'}ms |`
  )
  .join('\n')}

## Recommendations

${this.results.recommendations.map(rec => `- ${rec}`).join('\n')}

## Performance Bottlenecks Identified

### Critical Issues (>10s)
${
  this.results.testResults
    .filter(t => t.responseTime && t.responseTime > 10000)
    .map(t => `- **${t.page} - ${t.test}**: ${t.responseTime}ms (CRITICAL)`)
    .join('\n') || 'None identified'
}

### Slow Responses (>2s)
${
  this.results.testResults
    .filter(t => t.responseTime && t.responseTime > 2000 && t.responseTime <= 10000)
    .map(t => `- **${t.page} - ${t.test}**: ${t.responseTime}ms`)
    .join('\n') || 'None identified'
}

### Failed Interactions
${
  this.results.testResults
    .filter(t => t.status === 'Failed' || t.status === 'Element Not Found')
    .map(t => `- **${t.page} - ${t.test}**: ${t.error || t.status}`)
    .join('\n') || 'None identified'
}

---

*Generated by PosalPro MVP2 Button Response Performance Test*
`;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.testButtonResponseTimes();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Execute the test
async function main() {
  const test = new ButtonResponseTimeTest();
  await test.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ButtonResponseTimeTest };
