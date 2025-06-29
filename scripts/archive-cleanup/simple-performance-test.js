#!/usr/bin/env node

/**
 * Simple Performance Test - Monitor for violations in real-time
 */

const puppeteer = require('puppeteer');

class SimplePerformanceTest {
  constructor() {
    this.violations = [];
    this.serverUrl = 'http://localhost:3000';
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

  async testPage(url, duration = 30000) {
    this.log(`Testing ${url} for ${duration / 1000} seconds...`, 'info');

    const browser = await puppeteer.launch({
      headless: false, // Show browser to see real-time violations
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Capture console violations
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Violation]')) {
        this.violations.push({
          message: text,
          timestamp: Date.now(),
          url: page.url(),
        });
        this.log(`VIOLATION: ${text}`, 'warning');
      }
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

      // Wait and monitor for violations
      await new Promise(resolve => setTimeout(resolve, duration));
    } catch (error) {
      this.log(`Error testing ${url}: ${error.message}`, 'error');
    } finally {
      await browser.close();
    }
  }

  async run() {
    this.log('🚀 Starting Simple Performance Test', 'info');

    // Test dashboard for 30 seconds to capture violations
    await this.testPage(`${this.serverUrl}/dashboard`, 30000);

    // Report results
    this.log(`\n📊 PERFORMANCE TEST RESULTS:`, 'info');
    this.log(
      `Total Violations: ${this.violations.length}`,
      this.violations.length > 0 ? 'warning' : 'success'
    );

    if (this.violations.length > 0) {
      this.log('\nViolation Details:', 'warning');
      this.violations.forEach((violation, index) => {
        this.log(`${index + 1}. ${violation.message}`, 'warning');
      });

      // Analyze violation patterns
      const violationTypes = this.violations.reduce(
        (acc, v) => {
          if (v.message.includes("'message' handler")) acc.messageHandler++;
          else if (v.message.includes("'setInterval' handler")) acc.setInterval++;
          else if (v.message.includes("'setTimeout' handler")) acc.setTimeout++;
          else if (v.message.includes('Forced reflow')) acc.forcedReflow++;
          else acc.other++;
          return acc;
        },
        { messageHandler: 0, setInterval: 0, setTimeout: 0, forcedReflow: 0, other: 0 }
      );

      this.log('\nViolation Breakdown:', 'info');
      Object.entries(violationTypes).forEach(([type, count]) => {
        if (count > 0) {
          this.log(`${type}: ${count}`, 'warning');
        }
      });

      this.log('\n🔧 Recommendations:', 'info');
      if (violationTypes.messageHandler > 5) {
        this.log('- Reduce analytics batching frequency', 'info');
      }
      if (violationTypes.setInterval > 3) {
        this.log('- Increase setInterval durations or disable automatic monitoring', 'info');
      }
      if (violationTypes.setTimeout > 3) {
        this.log('- Optimize setTimeout usage in analytics and components', 'info');
      }
      if (violationTypes.forcedReflow > 2) {
        this.log('- Implement DOM batching to prevent layout thrashing', 'info');
      }
    } else {
      this.log('✅ No performance violations detected!', 'success');
    }
  }
}

// Run the test
if (require.main === module) {
  const test = new SimplePerformanceTest();
  test.run().catch(error => {
    console.error('❌ Performance test failed:', error);
    process.exit(1);
  });
}

module.exports = SimplePerformanceTest;
