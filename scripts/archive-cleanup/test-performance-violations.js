#!/usr/bin/env node

/**
 * ✅ PERFORMANCE VIOLATION TESTER
 * Quick test to verify performance violations are eliminated
 */

const puppeteer = require('puppeteer');

class PerformanceViolationTester {
  constructor() {
    this.violations = [];
    this.serverUrl = 'http://localhost:3000';
  }

  log(message, level = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };

    const prefix = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    console.log(`${colors[level]}${prefix[level]} ${message}${colors.reset}`);
  }

  async testPage(url, duration = 15000) {
    this.log(`Testing ${url} for ${duration / 1000} seconds...`, 'info');

    const browser = await puppeteer.launch({
      headless: false,
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
    this.log('🚀 Starting Performance Violation Test', 'info');

    // Test dashboard for 15 seconds
    await this.testPage(`${this.serverUrl}/dashboard`, 15000);

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

      this.log('\n🔧 EMERGENCY FIX NEEDED:', 'error');
      this.log('- Run: node scripts/emergency-performance-fix.js', 'error');
      this.log('- Restart server: npm run dev:smart', 'error');
    } else {
      this.log('✅ SUCCESS: No performance violations detected!', 'success');
      this.log('🎉 Emergency performance fix is working correctly', 'success');
    }
  }
}

// Run the test
if (require.main === module) {
  const tester = new PerformanceViolationTester();
  tester.run().catch(error => {
    console.error('Performance test failed:', error);
    process.exit(1);
  });
}

module.exports = PerformanceViolationTester;
