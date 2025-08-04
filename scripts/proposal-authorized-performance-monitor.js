#!/usr/bin/env node

/**
 * 🚀 PosalPro MVP2 - Proposal Authorization Performance Monitor
 * Comprehensive monitoring for proposal creation, approval workflows, and authorization performance
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ProposalAuthorizationPerformanceMonitor {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      proposalCreation: {
        success: 0,
        failures: 0,
        avgTime: 0,
        violations: [],
      },
      proposalApproval: {
        success: 0,
        failures: 0,
        avgTime: 0,
        violations: [],
      },
      authorizationChecks: {
        success: 0,
        failures: 0,
        avgTime: 0,
        violations: [],
      },
      performanceMetrics: {
        TTFB: 0,
        LCP: 0,
        CLS: 0,
        FID: 0,
      },
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
    this.log('Initializing browser for proposal authorization performance testing...', 'info');

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
      window.proposalPerformanceViolations = [];
      window.proposalPerformanceMetrics = {
        proposalCreationTime: 0,
        approvalWorkflowTime: 0,
        authorizationCheckTime: 0,
        violationCount: 0,
      };

      // Override console.warn to capture violations
      const originalWarn = console.warn;
      console.warn = function (...args) {
        const message = args.join(' ');

        if (
          message.includes('[Violation]') ||
          message.includes('proposal') ||
          message.includes('authorized')
        ) {
          const violation = {
            message: message,
            timestamp: Date.now(),
            type: 'unknown',
            duration: 0,
            context: 'proposal_authorization',
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
          } else if (message.includes('proposal')) {
            violation.type = 'proposalOperation';
          } else if (message.includes('authorized')) {
            violation.type = 'authorizationCheck';
          }

          const match = message.match(/(\d+)ms/);
          if (match) {
            violation.duration = parseInt(match[1]);
          }

          window.proposalPerformanceViolations.push(violation);
          window.proposalPerformanceMetrics.violationCount++;
        }

        originalWarn.apply(console, args);
      };
    });
  }

  async testProposalCreation() {
    this.log('Testing proposal creation performance...', 'info');

    try {
      // Navigate to proposal creation page
      await this.page.goto('http://localhost:3000/proposals/create', { waitUntil: 'networkidle2' });

      // Measure proposal creation performance
      const startTime = Date.now();

      // Fill proposal form
      await this.page.type('input[name="title"]', 'Test Proposal Performance');
      await this.page.type(
        'textarea[name="description"]',
        'This is a test proposal for performance monitoring'
      );
      await this.page.select('select[name="customerId"]', 'customer-1');
      await this.page.select('select[name="priority"]', 'HIGH');

      // Submit proposal
      await this.page.click('button[type="submit"]');

      // Wait for submission
      await this.page.waitForSelector('.success-message, .error-message', { timeout: 10000 });

      const endTime = Date.now();
      const creationTime = endTime - startTime;

      this.results.proposalCreation.avgTime = creationTime;
      this.results.proposalCreation.success++;

      this.log(`Proposal creation completed in ${creationTime}ms`, 'success');
    } catch (error) {
      this.results.proposalCreation.failures++;
      this.log(`Proposal creation failed: ${error.message}`, 'error');
    }
  }

  async testProposalApproval() {
    this.log('Testing proposal approval workflow performance...', 'info');

    try {
      // Navigate to proposal management page
      await this.page.goto('http://localhost:3000/proposals/manage', { waitUntil: 'networkidle2' });

      const startTime = Date.now();

      // Find and click on a proposal to approve
      await this.page.click('tr[data-proposal-id]', { timeout: 5000 });

      // Wait for approval modal
      await this.page.waitForSelector('.approval-modal', { timeout: 5000 });

      // Perform approval action
      await this.page.click('button[data-action="approve"]');

      // Wait for approval confirmation
      await this.page.waitForSelector('.approval-success', { timeout: 10000 });

      const endTime = Date.now();
      const approvalTime = endTime - startTime;

      this.results.proposalApproval.avgTime = approvalTime;
      this.results.proposalApproval.success++;

      this.log(`Proposal approval completed in ${approvalTime}ms`, 'success');
    } catch (error) {
      this.results.proposalApproval.failures++;
      this.log(`Proposal approval failed: ${error.message}`, 'error');
    }
  }

  async testAuthorizationChecks() {
    this.log('Testing authorization check performance...', 'info');

    try {
      // Test different authorization scenarios
      const authTests = [
        { url: '/admin', role: 'Administrator' },
        { url: '/proposals/create', role: 'Proposal Manager' },
        { url: '/sme/contributions', role: 'Technical SME' },
      ];

      for (const test of authTests) {
        const startTime = Date.now();

        await this.page.goto(`http://localhost:3000${test.url}`, { waitUntil: 'networkidle2' });

        // Check if access is granted or denied
        const hasAccess = await this.page.evaluate(() => {
          return !document.querySelector('.access-denied, .unauthorized');
        });

        const endTime = Date.now();
        const authTime = endTime - startTime;

        if (hasAccess) {
          this.results.authorizationChecks.success++;
        } else {
          this.results.authorizationChecks.failures++;
        }

        this.results.authorizationChecks.avgTime = authTime;

        this.log(
          `Authorization check for ${test.role} completed in ${authTime}ms`,
          hasAccess ? 'success' : 'warning'
        );
      }
    } catch (error) {
      this.log(`Authorization check failed: ${error.message}`, 'error');
    }
  }

  async measureWebVitals() {
    this.log('Measuring Web Vitals for proposal pages...', 'info');

    try {
      // Measure TTFB, LCP, CLS, FID
      const metrics = await this.page.evaluate(() => {
        return new Promise(resolve => {
          const observer = new PerformanceObserver(list => {
            const entries = list.getEntries();
            const metrics = {};

            entries.forEach(entry => {
              if (entry.entryType === 'largest-contentful-paint') {
                metrics.LCP = entry.startTime;
              } else if (entry.entryType === 'first-input') {
                metrics.FID = entry.processingStart - entry.startTime;
              }
            });

            resolve(metrics);
          });

          observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });

          // Measure TTFB
          const navigationEntry = performance.getEntriesByType('navigation')[0];
          if (navigationEntry) {
            metrics.TTFB = navigationEntry.responseStart - navigationEntry.requestStart;
          }

          // Measure CLS
          let cls = 0;
          const observer2 = new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              if (entry.hadRecentInput) continue;
              cls += entry.value;
            }
          });
          observer2.observe({ entryTypes: ['layout-shift'] });

          setTimeout(() => {
            metrics.CLS = cls;
            resolve(metrics);
          }, 5000);
        });
      });

      this.results.performanceMetrics = metrics;

      this.log(
        `Web Vitals measured: TTFB=${metrics.TTFB}ms, LCP=${metrics.LCP}ms, CLS=${metrics.CLS}, FID=${metrics.FID}ms`,
        'success'
      );
    } catch (error) {
      this.log(`Web Vitals measurement failed: ${error.message}`, 'error');
    }
  }

  generateRecommendations() {
    const recommendations = [];

    // Proposal creation recommendations
    if (this.results.proposalCreation.avgTime > 3000) {
      recommendations.push(
        'Optimize proposal creation form submission - consider implementing progressive loading'
      );
    }

    // Approval workflow recommendations
    if (this.results.proposalApproval.avgTime > 2000) {
      recommendations.push(
        'Optimize approval workflow - implement optimistic updates and background processing'
      );
    }

    // Authorization recommendations
    if (this.results.authorizationChecks.avgTime > 1000) {
      recommendations.push(
        'Optimize authorization checks - implement role-based caching and pre-fetching'
      );
    }

    // Web Vitals recommendations
    if (this.results.performanceMetrics.TTFB > 800) {
      recommendations.push(
        'Optimize TTFB - implement server-side caching and database query optimization'
      );
    }

    if (this.results.performanceMetrics.LCP > 2500) {
      recommendations.push('Optimize LCP - implement image optimization and critical CSS inlining');
    }

    if (this.results.performanceMetrics.CLS > 0.1) {
      recommendations.push(
        'Optimize CLS - implement proper image dimensions and avoid layout shifts'
      );
    }

    this.results.recommendations = recommendations;
  }

  calculateScore() {
    let score = 100;

    // Deduct points for performance issues
    if (this.results.proposalCreation.avgTime > 3000) score -= 10;
    if (this.results.proposalApproval.avgTime > 2000) score -= 10;
    if (this.results.authorizationChecks.avgTime > 1000) score -= 10;
    if (this.results.performanceMetrics.TTFB > 800) score -= 15;
    if (this.results.performanceMetrics.LCP > 2500) score -= 15;
    if (this.results.performanceMetrics.CLS > 0.1) score -= 10;

    // Deduct points for failures
    score -= this.results.proposalCreation.failures * 5;
    score -= this.results.proposalApproval.failures * 5;
    score -= this.results.authorizationChecks.failures * 5;

    this.results.score = Math.max(0, score);
  }

  async generateReport() {
    this.log('Generating comprehensive proposal authorization performance report...', 'info');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        score: this.results.score,
        grade:
          this.results.score >= 90
            ? 'A'
            : this.results.score >= 80
              ? 'B'
              : this.results.score >= 70
                ? 'C'
                : 'D',
        status:
          this.results.score >= 80
            ? 'EXCELLENT'
            : this.results.score >= 60
              ? 'GOOD'
              : 'NEEDS_IMPROVEMENT',
      },
      results: this.results,
      recommendations: this.results.recommendations,
    };

    // Save report
    const reportPath = path.join(__dirname, 'proposal-authorized-performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.log(`Report saved to: ${reportPath}`, 'success');

    // Print summary
    console.log('\n📊 PROPOSAL AUTHORIZATION PERFORMANCE REPORT');
    console.log('==========================================');
    console.log(`Score: ${this.results.score}/100 (${report.summary.grade})`);
    console.log(`Status: ${report.summary.status}`);
    console.log(`\nProposal Creation: ${this.results.proposalCreation.avgTime}ms`);
    console.log(`Proposal Approval: ${this.results.proposalApproval.avgTime}ms`);
    console.log(`Authorization Checks: ${this.results.authorizationChecks.avgTime}ms`);
    console.log(`\nWeb Vitals:`);
    console.log(`  TTFB: ${this.results.performanceMetrics.TTFB}ms`);
    console.log(`  LCP: ${this.results.performanceMetrics.LCP}ms`);
    console.log(`  CLS: ${this.results.performanceMetrics.CLS}`);
    console.log(`  FID: ${this.results.performanceMetrics.FID}ms`);
    console.log(`\nRecommendations:`);
    this.results.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }

  async run() {
    try {
      this.log('🚀 Starting Proposal Authorization Performance Monitor...', 'info');

      await this.initBrowser();

      // Run all tests
      await this.testProposalCreation();
      await this.testProposalApproval();
      await this.testAuthorizationChecks();
      await this.measureWebVitals();

      // Generate recommendations and score
      this.generateRecommendations();
      this.calculateScore();

      // Generate report
      await this.generateReport();

      this.log('✅ Proposal Authorization Performance Monitor completed successfully!', 'success');
    } catch (error) {
      this.log(`❌ Performance monitor failed: ${error.message}`, 'error');
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the monitor
if (require.main === module) {
  const monitor = new ProposalAuthorizationPerformanceMonitor();
  monitor.run();
}

module.exports = ProposalAuthorizationPerformanceMonitor;
